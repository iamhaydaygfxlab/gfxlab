// app/api/ai/background/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function must(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function POST(req: Request) {
  try {
    const key = must("OPENAI_API_KEY");
    const body = await req.json().catch(() => ({}));
    const prompt = String(body?.prompt || "").trim();
    const size = String(body?.size || "1024x1024");

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    // OpenAI Images API: POST /v1/images/generations :contentReference[oaicite:0]{index=0}
    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1.5",
        prompt,
        n: 1,
        size, // "1024x1024" | "1024x1536" | "1536x1024" :contentReference[oaicite:1]{index=1}
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "OpenAI image generation failed" },
        { status: 500 }
      );
    }

    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json({ error: "No image returned" }, { status: 500 });
    }

    // Return a browser-ready data URL
    const dataUrl = `data:image/png;base64,${b64}`;
    return NextResponse.json({ dataUrl });
  } catch (err: any) {
    console.error("AI BG ERROR:", err);
    return NextResponse.json({ error: err?.message || "AI bg failed" }, { status: 500 });
  }
}