import Stripe from "stripe";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const sig = req.headers.get("stripe-signature");
    const body = await req.text();

    if (!sig) {
      return new NextResponse("Missing stripe-signature header", { status: 400 });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      return new NextResponse("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });
    }

    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log("Webhook verified:", event.type);

    // =========================================
    // PRO SUBSCRIPTION EVENTS
    // =========================================
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;

      const customer = await stripe.customers.retrieve(customerId);
      const uid =
        customer && !("deleted" in customer) ? customer.metadata?.uid : null;

      if (!uid) {
        console.warn("No uid found in Stripe customer metadata");
        return NextResponse.json({ received: true });
      }

      const isDeleted = event.type === "customer.subscription.deleted";
      const isActive = sub.status === "active" || sub.status === "trialing";

      await adminDb.collection("users").doc(uid).set(
        {
          pro: isDeleted ? false : isActive,
          proStatus: isDeleted ? "canceled" : sub.status,
          stripeCustomerId: customerId,
          proCurrentPeriodEnd: (sub as any).current_period_end ?? null,
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      console.log(`Updated Pro status for uid ${uid}`);
    }

    // =========================================
    // ONE-TIME EXPORT EVENTS
    // =========================================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === "payment") {
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

          console.log(`Granted 1 export credit to user ${uid}`);
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

          console.log(`Granted 1 export credit to guest ${guestId}`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err?.message || err);
    return new NextResponse(
      `Webhook failed: ${err?.message || "Unknown error"}`,
      { status: 500 }
    );
  }
}