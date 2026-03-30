import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

function must(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function POST(req: Request) {
  try {
    must("RESEND_API_KEY");
    const from = must("EMAIL_FROM");

    const body = await req.json();
    const to = String(body?.to || "").trim();
    const imageUrl = String(body?.imageUrl || "").trim();
    const projectName = String(body?.projectName || "Your Design").trim();

    if (!to) {
      return NextResponse.json({ error: "Missing email address" }, { status: 400 });
    }

    if (!imageUrl) {
      return NextResponse.json({ error: "Missing imageUrl" }, { status: 400 });
    }

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      throw new Error(`Could not fetch image: ${imgRes.status}`);
    }

    const contentType = imgRes.headers.get("content-type") || "image/png";
    const arrayBuffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 24px;">
        <h2>Your design is ready</h2>
        <p>Thanks for your purchase.</p>
        <p><strong>${projectName}</strong></p>
        <p>Your image is attached to this email.</p>
        <p>
          <a href="${imageUrl}" target="_blank" rel="noopener noreferrer">
            Download your image
          </a>
        </p>
        <div style="margin-top: 20px;">
          <img src="${imageUrl}" alt="${projectName}" style="max-width: 100%; border-radius: 12px;" />
        </div>
      </div>
    `;

    const result = await resend.emails.send({
      from,
      to,
      subject: `${projectName} - Your export is ready`,
      html,
      attachments: [
        {
          filename: `${projectName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.png`,
          content: base64,
        },
      ],
    });

    return NextResponse.json({ ok: true, result });
  } catch (e: any) {
    console.error("SEND EMAIL ERROR:", e);
    return NextResponse.json(
      { error: e?.message || "Failed to send email" },
      { status: 500 }
    );
  }
}