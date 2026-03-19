import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  serverExternalPackages: ["@ffmpeg-installer/ffmpeg"],
  outputFileTracingIncludes: {
    "/api/render-video": ["./node_modules/@ffmpeg-installer/ffmpeg/**/*"],
  },
};

export default nextConfig;