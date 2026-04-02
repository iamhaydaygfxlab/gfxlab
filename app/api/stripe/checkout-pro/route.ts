import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const mode = process.env.NEXT_PUBLIC_STRIPE_MODE ?? "test";

    const secretKey =
      mode === "live"
        ? process.env.STRIPE_SECRET_KEY
        : process.env.STRIPE_SECRET_KEY_TEST;

    const proPriceId =
      mode === "live"
        ? process.env.STRIPE_PRO_PRICE_ID
        : process.env.STRIPE_PRO_PRICE_ID_TEST;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!secretKey) {
      return new NextResponse("Missing Stripe secret key", { status: 500 });
    }

    if (!proPriceId) {
      return new NextResponse("Missing Pro price id", { status: 500 });
    }

    if (!appUrl) {
      return new NextResponse("Missing NEXT_PUBLIC_APP_URL", { status: 500 });
    }

    const stripe = new Stripe(secretKey);

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
          price: proPriceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/editor?pro=success`,
      cancel_url: `${appUrl}/?pro=cancel`,
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