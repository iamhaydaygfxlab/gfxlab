import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_VIDEO_EXPORT_PRICE_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!secretKey) {
      return new NextResponse("Missing STRIPE_SECRET_KEY", { status: 500 });
    }

    if (!priceId) {
      return new NextResponse("Missing STRIPE_VIDEO_EXPORT_PRICE_ID", { status: 500 });
    }

    if (!appUrl) {
      return new NextResponse("Missing NEXT_PUBLIC_APP_URL", { status: 500 });
    }

    const url = new URL(req.url);
    const guestId = url.searchParams.get("guestId");

    const form = new URLSearchParams();
    form.append("mode", "payment");
    form.append("line_items[0][price]", priceId);
    form.append("line_items[0][quantity]", "1");
    form.append("success_url", `${appUrl}/editor?export=music-success`);
    form.append("cancel_url", `${appUrl}/editor?export=cancel`);

    if (guestId) form.append("metadata[guestId]", guestId);
    form.append("metadata[exportType]", "music_bundle");

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
      cache: "no-store",
    });

    const text = await res.text();

    if (!res.ok) {
      return new NextResponse(`Checkout-video-export failed: ${text}`, {
        status: 500,
      });
    }

    const session = JSON.parse(text);

    if (!session.url) {
      return new NextResponse(
        "Checkout-video-export failed: Stripe did not return a checkout URL",
        { status: 500 }
      );
    }

    return NextResponse.redirect(session.url);
  } catch (err: any) {
    return new NextResponse(
      `Checkout-video-export failed: ${err?.message || "Unknown error"}`,
      { status: 500 }
    );
  }
}