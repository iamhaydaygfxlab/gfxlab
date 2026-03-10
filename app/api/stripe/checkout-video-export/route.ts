import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
const priceId = process.env.STRIPE_VIDEO_EXPORT_PRICE_ID;
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

if (!secretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY");
}

const stripe = new Stripe(secretKey);

export async function GET(req: NextRequest) {
  try {
    if (!priceId) {
      throw new Error("Missing STRIPE_VIDEO_EXPORT_PRICE_ID");
    }

    if (!appUrl) {
      throw new Error("Missing NEXT_PUBLIC_APP_URL");
    }

    const { searchParams } = new URL(req.url);
    const guestId = searchParams.get("guestId") || "";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/editor?export=music-success`,
      cancel_url: `${appUrl}/editor`,
      metadata: {
        guestId,
        exportType: "music_bundle",
      },
    });

    if (!session.url) {
      throw new Error("Stripe session created without a checkout URL");
    }

    return NextResponse.redirect(session.url);
  } catch (error) {
    console.error("checkout-video-export error:", error);

    const message =
      error instanceof Error ? error.message : "Could not create checkout session";

    return new NextResponse(message, { status: 500 });
  }
}