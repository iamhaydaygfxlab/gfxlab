import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

export async function POST(req: NextRequest) {
  try {
  const mode = process.env.NEXT_PUBLIC_STRIPE_MODE ?? "test";

const secretKey =
  mode === "live"
    ? process.env.STRIPE_SECRET_KEY_LIVE
    : process.env.STRIPE_SECRET_KEY_TEST;

    if (!secretKey) {
      return NextResponse.json(
        { ok: false, error: "Missing STRIPE_SECRET_KEY" },
        {
          status: 500,
          headers: corsHeaders(),
        }
      );
    }

    const body = await req.json();
    const sessionId = body?.sessionId;

    if (!sessionId) {
      return NextResponse.json(
        { ok: false, error: "Missing sessionId" },
        {
          status: 400,
          headers: corsHeaders(),
        }
      );
    }

    const stripeRes = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
        cache: "no-store",
      }
    );

    const text = await stripeRes.text();

    if (!stripeRes.ok) {
      return NextResponse.json(
        { ok: false, error: text },
        {
          status: 500,
          headers: corsHeaders(),
        }
      );
    }

    const session = JSON.parse(text);
    const paid = session.payment_status === "paid";

    return NextResponse.json(
      {
        ok: true,
        paid,
        sessionId: session.id,
        metadata: session.metadata || {},
        amount_total: session.amount_total,
        currency: session.currency,
      },
      {
        status: 200,
        headers: corsHeaders(),
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Verification failed" },
      {
        status: 500,
        headers: corsHeaders(),
      }
    );
  }
}