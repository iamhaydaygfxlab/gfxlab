import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    return NextResponse.json({
      success: true,
      message: "Cutout API working",
      data: body
    });

  } catch (error) {
    console.error("Cutout API error:", error);

    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}