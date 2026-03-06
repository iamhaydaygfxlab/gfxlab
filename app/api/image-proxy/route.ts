import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) return new NextResponse("Missing url", { status: 400 });

  const res = await fetch(url);
  if (!res.ok) return new NextResponse("Fetch failed", { status: 400 });

  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const buf = await res.arrayBuffer();

  return new NextResponse(buf, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
}