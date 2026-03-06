// app/api/stripe/verify-session/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: Request) {
  try {
    const { session_id } = await req.json();

    if (!session_id || typeof session_id !== "string") {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Stripe sets payment_status = "paid" when completed
    const paid = session.payment_status === "paid";

    return NextResponse.json({ paid });
  } catch (err: any) {
    console.error("VERIFY SESSION ERROR:", err);
    return NextResponse.json({ error: err?.message || "Verify failed" }, { status: 500 });
  }
}