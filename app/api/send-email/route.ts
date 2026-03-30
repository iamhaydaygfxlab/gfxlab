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

    let attachments: any[] = [];

    // 🔥 TRY to fetch image (but don't fail if it breaks)
    try {
      if (imageUrl) {
        const imgRes = await fetch(imageUrl);
        if (imgRes.ok) {
          const buffer = await imgRes.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");

          attachments.push({
            filename: `${projectName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.png`,
            content: base64,
          });
        } else {
          console.log("Image fetch failed:", imgRes.status);
        }
      }
    } catch (err) {
      console.log("Image fetch error:", err);
    }

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 24px;">
        <h2>Your design is ready</h2>
        <p><strong>${projectName}</strong></p>
        <p>
          <a href="${imageUrl}" target="_blank">
            Download your image
          </a>
        </p>
        ${
          imageUrl
            ? `<img src="${imageUrl}" style="max-width:100%; border-radius:12px;" />`
            : ""
        }
      </div>
    `;

    const result = await resend.emails.send({
      from,
      to,
      subject: `${projectName} - Your export is ready`,
      html,
      attachments,
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