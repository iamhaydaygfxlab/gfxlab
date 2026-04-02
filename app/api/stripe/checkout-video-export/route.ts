import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const mode = process.env.NEXT_PUBLIC_STRIPE_MODE ?? "test";

    const secretKey =
      mode === "live"
        ? process.env.STRIPE_SECRET_KEY_LIVE
        : process.env.STRIPE_SECRET_KEY_TEST;

    const priceId =
      mode === "live"
        ? process.env.STRIPE_VIDEO_EXPORT_PRICE_ID_LIVE
        : process.env.STRIPE_VIDEO_EXPORT_PRICE_ID_TEST;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!secretKey) {
      return new NextResponse("Missing Stripe secret key", { status: 500 });
    }

    if (!priceId) {
      return new NextResponse("Missing video export price id", { status: 500 });
    }

    if (!appUrl) {
      return new NextResponse("Missing NEXT_PUBLIC_APP_URL", { status: 500 });
    }

    const url = new URL(req.url);
    const guestId = url.searchParams.get("guestId");
const exportId = url.searchParams.get("exportId");
    const form = new URLSearchParams();
    form.append("mode", "payment");
    console.log("VIDEO MODE:", mode);
console.log("VIDEO PRICE RAW:", JSON.stringify(priceId));
console.log(
  "VIDEO PRICE ENV NAME:",
  mode === "live"
    ? "STRIPE_VIDEO_EXPORT_PRICE_ID_LIVE"
    : "STRIPE_VIDEO_EXPORT_PRICE_ID_TEST"
);
    form.append("line_items[0][price]", priceId);
    form.append("line_items[0][quantity]", "1");
    form.append(
      "success_url",
      `${appUrl}/editor?export=music-success&session_id={CHECKOUT_SESSION_ID}`
    );
    form.append("cancel_url", `${appUrl}/editor?export=cancel`);

    if (guestId) form.append("metadata[guestId]", guestId);
    if (exportId) form.append("metadata[exportId]", exportId);
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