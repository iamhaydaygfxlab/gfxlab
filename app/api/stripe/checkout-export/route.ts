import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const account = await stripe.accounts.retrieve();

    return NextResponse.json({
      ok: true,
      account: account.id,
      country: account.country,
      email: account.email
    });

  } catch (err: any) {
    return new NextResponse(
      `Stripe test failed: ${err?.message}`,
      { status: 500 }
    );
  }
}