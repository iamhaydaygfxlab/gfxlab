import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const exportPriceId = process.env.STRIPE_EXPORT_PRICE_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!stripeSecretKey) {
      return new NextResponse("Missing STRIPE_SECRET_KEY", { status: 500 });
    }

    if (!exportPriceId) {
      return new NextResponse("Missing STRIPE_EXPORT_PRICE_ID", { status: 500 });
    }

    if (!appUrl) {
      return new NextResponse("Missing NEXT_PUBLIC_APP_URL", { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey);

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
          price: exportPriceId,
          quantity: 1,
        },
      ],
      metadata,
      success_url: `${appUrl}/editor?export=success`,
      cancel_url: `${appUrl}/editor?export=cancel`,
    });

    if (!session.url) {
      return new NextResponse("Stripe did not return a checkout URL", { status: 500 });
    }

    return NextResponse.redirect(session.url);
  } catch (err: any) {
    console.error("checkout-export error:", err?.message || err);
    return new NextResponse(
      `Checkout-export failed: ${err?.raw?.message || err?.message || "Unknown error"}`,
      { status: 500 }
    );
  }
}