import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUrl = searchParams.get("url");

    if (!rawUrl) {
      return new NextResponse("Missing url", { status: 400 });
    }

    const imageUrl = rawUrl;

    const res = await fetch(imageUrl, {
      headers: {
        Accept: "image/*",
      },
    });

    if (!res.ok) {
      return new NextResponse("Upstream image fetch failed", { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "image/png";
    const arrayBuffer = await res.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("image-proxy failed:", err);
    return new NextResponse("Proxy failed", { status: 500 });
  }
}