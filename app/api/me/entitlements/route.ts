// app/api/me/entitlements/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  // Option A (no auth): not used. Keep it harmless.
  return NextResponse.json({ exportUnlocked: false });
}