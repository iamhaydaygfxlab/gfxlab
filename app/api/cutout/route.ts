import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    return NextResponse.json({
      ok: true,
      message: "Cutout route is working",
      received: body,
    });
  } catch (error) {
    console.error("CUTOUT API ERROR:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}