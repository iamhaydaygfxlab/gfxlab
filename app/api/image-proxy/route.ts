import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUrl = searchParams.get("url");

    if (!rawUrl) {
      return new NextResponse("Missing url", { status: 400 });
    }

    const imageUrl = decodeURIComponent(rawUrl);
    console.log("image-proxy fetching:", imageUrl);

    const upstream = await fetch(imageUrl, {
      method: "GET",
      headers: {
        Accept: "image/*",
      },
      cache: "no-store",
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      console.error("Upstream fetch failed:", upstream.status, text);

      return new NextResponse(
        `Upstream fetch failed: ${upstream.status}\n${text}`,
        { status: upstream.status }
      );
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error: any) {
    console.error("image-proxy error:", error);
    return new NextResponse(`Proxy failed: ${error?.message || "unknown error"}`, {
      status: 500,
    });
  }
}