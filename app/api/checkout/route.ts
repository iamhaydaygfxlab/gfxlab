import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_MAP: Record<string, string> = {
  export_image: "price_1T9JZd4bBR1MvbiEPTlaP9qg",
  export_with_music: "price_1T9VCs4bBR1MvbiEdUABENwO"
};

export async function POST(req: NextRequest) {
  try {
    const { productId } = await req.json();

    const price = PRICE_MAP[productId];

    if (!price) {
      return NextResponse.json(
        { error: "Invalid product id" },
        { status: 400 }
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
      success_url: "https://yourdomain.com/success",
      cancel_url: "https://yourdomain.com/editor",
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}