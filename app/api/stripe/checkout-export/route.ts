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

    const price = await stripe.prices.retrieve(exportPriceId);

    return NextResponse.json({
      ok: true,
      priceId: price.id,
      active: price.active,
      livemode: price.livemode,
      appUrl,
      keyPrefix: stripeSecretKey.slice(0, 8),
    });
  } catch (err: any) {
    console.error("STRIPE DIAG ERROR", {
      name: err?.name,
      message: err?.message,
      type: err?.type,
      code: err?.code,
      statusCode: err?.statusCode,
      rawMessage: err?.raw?.message,
      stack: err?.stack,
    });

    return new NextResponse(
      `Stripe diag failed: ${err?.raw?.message || err?.message || "Unknown error"}`,
      { status: 500 }
    );
  }
}