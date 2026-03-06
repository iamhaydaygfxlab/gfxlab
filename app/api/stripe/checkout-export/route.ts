import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const uid = url.searchParams.get("uid");
    const guestId = url.searchParams.get("guestId");

    const metadata: Record<string, string> = {};

    if (uid) metadata.uid = uid;
    if (guestId) metadata.guestId = guestId;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: process.env.STRIPE_EXPORT_PRICE_ID!,
          quantity: 1,
        },
      ],
      metadata,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/editor?export=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/editor?export=cancel`,
    });

    return NextResponse.redirect(session.url!);
  } catch (err: any) {
    console.error("checkout-export error:", err?.message || err);
    return new NextResponse(
      `Checkout-export failed: ${err?.message || "Unknown error"}`,
      { status: 500 }
    );
  }
}