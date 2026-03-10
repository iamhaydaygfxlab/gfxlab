import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { ok: false, error: "Missing STRIPE_SECRET_KEY" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const sessionId = body?.sessionId;

    if (!sessionId) {
      return NextResponse.json(
        { ok: false, error: "Missing sessionId" },
        { status: 400 }
      );
    }

    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      cache: "no-store",
    });

    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: text },
        { status: 500 }
      );
    }

    const session = JSON.parse(text);

    const paid = session.payment_status === "paid";

    return NextResponse.json({
      ok: true,
      paid,
      sessionId: session.id,
      metadata: session.metadata || {},
      amount_total: session.amount_total,
      currency: session.currency,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Verification failed" },
      { status: 500 }
    );
  }
}