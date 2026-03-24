import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const rawUrl = req.nextUrl.searchParams.get("url");
    if (!rawUrl) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    const target = new URL(rawUrl);

    const upstream = await fetch(target.toString(), {
      headers: { Accept: "image/*,*/*" },
      cache: "no-store",
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      return NextResponse.json(
        {
          error: "Upstream image fetch failed",
          status: upstream.status,
          statusText: upstream.statusText,
          body: text,
          url: target.toString(),
        },
        { status: 400 }
      );
    }

    const contentType = upstream.headers.get("content-type") || "image/png";
    const bytes = await upstream.arrayBuffer();

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Proxy failed" },
      { status: 500 }
    );
  }
}