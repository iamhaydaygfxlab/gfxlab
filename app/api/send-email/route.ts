import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, image } = await req.json();

    if (!email || !image) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const result = await resend.emails.send({
      from: "GFXLab <onboarding@resend.dev>",
      to: email,
      subject: "Your Export Is Ready",
      html: `
        <div>
          <h2>Your export is ready</h2>
          <p>Download or view below:</p>
          <img src="${image}" style="max-width:100%;" />
        </div>
      `,
    });

    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}