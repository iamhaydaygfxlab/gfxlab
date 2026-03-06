import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const uid = url.searchParams.get("uid");
    const email = url.searchParams.get("email");

    if (!uid || !email) {
      return new NextResponse("Missing uid or email for Pro checkout", {
        status: 400,
      });
    }

    const customer = await stripe.customers.create({
      email,
      metadata: { uid },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id,
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/editor?pro=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?pro=cancel`,
      allow_promotion_codes: true,
    });

    return NextResponse.redirect(session.url!);
  } catch (err: any) {
    console.error("checkout-pro error:", err?.message || err);
    return new NextResponse(
      `Checkout-Pro failed: ${err?.message || "Unknown error"}`,
      { status: 500 }
    );
  }
}