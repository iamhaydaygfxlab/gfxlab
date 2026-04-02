import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const PRICE_MAP: Record<string, { test: string; live: string }> = {
  export_image: {
    test: process.env.STRIPE_EXPORT_PRICE_ID_TEST ?? "",
    live: process.env.STRIPE_EXPORT_PRICE_ID ?? "",
  },
  export_with_music: {
    test: process.env.STRIPE_VIDEO_EXPORT_PRICE_ID_TEST ?? "",
    live: process.env.STRIPE_VIDEO_EXPORT_PRICE_ID ?? "",
  },
};

export async function POST(req: NextRequest) {
  try {
    const mode = process.env.NEXT_PUBLIC_STRIPE_MODE ?? "live";

    const stripeSecretKey =
      mode === "live"
        ? process.env.STRIPE_SECRET_KEY ?? ""
        : process.env.STRIPE_SECRET_KEY_TEST ?? "";

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Missing Stripe secret key" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    const { productId } = await req.json();
    const price = PRICE_MAP[productId]?.[mode as "test" | "live"];

    if (!price) {
      return NextResponse.json(
        { error: "Invalid product id or missing price id" },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    if (!appUrl) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_APP_URL" },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/success`,
      cancel_url: `${appUrl}/editor`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}