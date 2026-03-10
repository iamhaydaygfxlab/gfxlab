import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const guestId = searchParams.get("guestId") || "";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: process.env.STRIPE_VIDEO_EXPORT_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/editor?export=music-success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/editor`,
      metadata: {
        guestId,
        exportType: "music_bundle",
      },
    });

    return NextResponse.redirect(session.url!);
  } catch (error) {
    console.error("checkout-video-export error:", error);
    return new NextResponse("Could not create checkout session", { status: 500 });
  }
}