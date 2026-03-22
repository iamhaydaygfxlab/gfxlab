import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GFXlab",
  description: "Build covers and flyers fast.",
  openGraph: {
    title: "GFXlab",
    description:
      "Create covers, flyers, and visuals in seconds. Add music and export for just $5–$8.",
    url: "https://gfxlab.vercel.app",
    siteName: "GFXlab",
    images: [
      {
        url: "/opengraph-image.png", // 🔥 THIS is the key fix
        width: 1920,
        height: 1080,
        alt: "GFXlab Preview",
      },
    ],
    type: "website",
  },
};