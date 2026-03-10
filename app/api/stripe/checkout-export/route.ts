import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_EXPORT_PRICE_ID;

    if (!secretKey) {
      return new NextResponse("Missing STRIPE_SECRET_KEY", { status: 500 });
    }

    if (!priceId) {
      return new NextResponse("Missing STRIPE_EXPORT_PRICE_ID", { status: 500 });
    }

    const res = await fetch(`https://api.stripe.com/v1/prices/${priceId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      cache: "no-store",
    });

    const text = await res.text();

    return new NextResponse(
      JSON.stringify(
        {
          ok: res.ok,
          status: res.status,
          priceId,
          body: text.slice(0, 1000),
        },
        null,
        2
      ),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new NextResponse(
      `PRICE TEST FAILED: ${err?.message || "Unknown error"}`,
      { status: 500 }
    );
  }
}