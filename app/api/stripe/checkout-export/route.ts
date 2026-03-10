import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return new NextResponse("NEW CHECKOUT ROUTE IS LIVE", { status: 200 });
}