// app/api/image-proxy/route.ts
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return new Response("Missing url", { status: 400 });
  }

  try {
    const upstream = await fetch(url, {
      cache: "no-store",
    });

    if (!upstream.ok) {
      return new Response(`Upstream fetch failed: ${upstream.status}`, {
        status: 400,
      });
    }

    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";

    const data = await upstream.arrayBuffer();

    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    return new Response(`Proxy failed: ${err?.message || "unknown error"}`, {
      status: 500,
    });
  }
}