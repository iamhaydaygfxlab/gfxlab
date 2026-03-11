import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/render-video": ["./node_modules/@ffmpeg-installer/ffmpeg/**/*"],
  },
};

export default nextConfig;