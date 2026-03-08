import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const rawUrl = req.nextUrl.searchParams.get("url");

    if (!rawUrl) {
      return new NextResponse("Missing url", { status: 400 });
    }

    // IMPORTANT:
    // Do NOT decode Firebase Storage URLs here.
    // searchParams.get("url") already gives us the right value.
    const imageUrl = rawUrl;

    if (
      !imageUrl.startsWith("http://") &&
      !imageUrl.startsWith("https://")
    ) {
      return new NextResponse("Invalid url", { status: 400 });
    }

    const upstream = await fetch(imageUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        Accept: "image/*,*/*",
      },
      cache: "no-store",
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      console.error("UPSTREAM IMAGE PROXY FAILED:", upstream.status, text);
      return new NextResponse(
        `Upstream failed: ${upstream.status}\n${text}`,
        { status: upstream.status }
      );
    }

    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";

    const bytes = await upstream.arrayBuffer();

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("IMAGE PROXY ERROR:", error);
    return new NextResponse("Proxy error", { status: 500 });
  }
}