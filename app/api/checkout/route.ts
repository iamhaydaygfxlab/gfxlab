import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  
});

export async function POST() {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      line_items: [
        {
          price: "price_1T6hKy4bBR1MvbiEUn4LqPwt", //
          quantity: 1,
        },
      ],

      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/editor",

      payment_method_types: ["card"],
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}