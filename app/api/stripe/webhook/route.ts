import Stripe from "stripe";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return new NextResponse("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();

    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log("Webhook verified:", event.type);

  try {

    if (event.type === "checkout.session.completed") {

      const session = event.data.object as Stripe.Checkout.Session;

      const uid =
        typeof session.metadata?.uid === "string"
          ? session.metadata.uid
          : null;

      const guestId =
        typeof session.metadata?.guestId === "string"
          ? session.metadata.guestId
          : null;

      if (uid) {
        await adminDb.collection("users").doc(uid).set(
          {
            exportCredits: FieldValue.increment(1),
            updatedAt: Date.now(),
          },
          { merge: true }
        );

        console.log(`Granted export credit to user ${uid}`);
      }

      if (guestId) {
        await adminDb.collection("guestExports").doc(guestId).set(
          {
            paid: true,
            exportCredits: FieldValue.increment(1),
            updatedAt: Date.now(),
          },
          { merge: true }
        );

        console.log(`Granted export credit to guest ${guestId}`);
      }
    }

    return NextResponse.json({ received: true });

  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return new NextResponse("Webhook handler failed", { status: 500 });
  }
}