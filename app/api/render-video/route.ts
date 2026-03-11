import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import ffmpegPath from "ffmpeg-static";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

async function writeTempFile(filePath: string, data: Buffer) {
  await fs.writeFile(filePath, data);
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "gfxlab-video-"));

  const coverPath = path.join(tempDir, "cover.png");
  const audioPath = path.join(tempDir, "audio.mp3");
  const outputPath = path.join(tempDir, "output.mp4");

  try {
    const formData = await req.formData();

    const cover = formData.get("cover");
    const audioUrl = formData.get("audioUrl");
    const clipStartRaw = formData.get("clipStart");
    const clipDurationRaw = formData.get("clipDuration");

    if (!(cover instanceof File)) {
      return NextResponse.json({ error: "Missing cover file." }, { status: 400 });
    }

    if (typeof audioUrl !== "string" || !audioUrl) {
      return NextResponse.json({ error: "Missing audioUrl." }, { status: 400 });
    }

    const clipStart = Math.max(0, Number(clipStartRaw ?? 0) || 0);
    const clipDuration = Math.max(1, Number(clipDurationRaw ?? 30) || 30);

    const coverBuffer = Buffer.from(await cover.arrayBuffer());
    await writeTempFile(coverPath, coverBuffer);

    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) {
      return NextResponse.json(
        { error: "Could not download audio file." },
        { status: 400 }
      );
    }

    const audioArrayBuffer = await audioRes.arrayBuffer();
    const audioBuffer = Buffer.from(audioArrayBuffer);
    await writeTempFile(audioPath, audioBuffer);

    if (!ffmpegPath) {
      return NextResponse.json(
        { error: "ffmpeg binary not available." },
        { status: 500 }
      );
    }

    const args = [
      "-y",
      "-loop",
      "1",
      "-i",
      coverPath,
      "-ss",
      String(clipStart),
      "-t",
      String(clipDuration),
      "-i",
      audioPath,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-tune",
      "stillimage",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-pix_fmt",
      "yuv420p",
      "-shortest",
      "-movflags",
      "+faststart",
      "-vf",
      "scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2",
      outputPath,
    ];

    await execFileAsync(ffmpegPath, args);

    const exists = await fileExists(outputPath);
    if (!exists) {
      return NextResponse.json(
        { error: "Video render failed. Output not created." },
        { status: 500 }
      );
    }

    const outputBuffer = await fs.readFile(outputPath);

    return new Response(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": 'attachment; filename="gfxlab-video.mp4"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("render-video error:", error);

    return NextResponse.json(
      {
        error: error?.message || "Video render failed.",
      },
      { status: 500 }
    );
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}