import { NextRequest } from "next/server";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import fs from "fs";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const resolvedFfmpegPath =
  typeof ffmpegStatic === "string"
    ? ffmpegStatic
    : (ffmpegStatic as unknown as { default?: string })?.default ?? "";

if (!resolvedFfmpegPath) {
  throw new Error("FFmpeg path could not be resolved.");
}

ffmpeg.setFfmpegPath(resolvedFfmpegPath);
console.log("FFmpeg path:", resolvedFfmpegPath);

export async function POST(req: NextRequest) {
  const tempId = randomUUID();
  const tempDir = path.join(os.tmpdir(), `gfxlab-video-${tempId}`);
  fs.mkdirSync(tempDir, { recursive: true });

  const coverPath = path.join(tempDir, "cover.png");
  const audioPath = path.join(tempDir, "audio-input");
  const outputPath = path.join(tempDir, "output.mp4");

  try {
    const formData = await req.formData();

    const cover = formData.get("cover") as File | null;
    const audio = formData.get("audio") as File | null;
    const clipStart = Number(formData.get("clipStart") || 0);
    const clipDuration = Number(formData.get("clipDuration") || 30);

    if (!cover || !audio) {
      return new Response(
        JSON.stringify({ error: "Missing cover or audio file" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    fs.writeFileSync(coverPath, Buffer.from(await cover.arrayBuffer()));
    fs.writeFileSync(audioPath, Buffer.from(await audio.arrayBuffer()));

    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(coverPath)
        .inputOptions(["-loop 1"])
        .input(audioPath)
        .inputOptions([`-ss ${clipStart}`])
        .duration(clipDuration)
        .videoCodec("libx264")
        .audioCodec("aac")
        .outputOptions([
          "-pix_fmt yuv420p",
          "-shortest",
          "-movflags +faststart",
          "-vf scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2",
        ])
        .save(outputPath)
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err));
    });

    const videoBuffer = fs.readFileSync(outputPath);

    return new Response(videoBuffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": 'attachment; filename="gfxlab-video.mp4"',
      },
    });
  } catch (error) {
    console.error("render-video error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to render video";

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}