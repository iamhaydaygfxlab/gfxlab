import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, image } = await req.json();

    if (!email || !image) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const response = await resend.emails.send({
    from: "GFXLab <hello@iamhaydaygfxlab.com>",
      to: email,
      subject: "Your Design is Ready ",
      html: `
        <div style="font-family: sans-serif;">
          <h2>Your design is ready</h2>
          <p>Download your image below:</p>
          <img src="${image}" style="max-width:100%;" />
        </div>
      `,
    });

    return NextResponse.json({ success: true, response });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Email failed" }, { status: 500 });
  }
}