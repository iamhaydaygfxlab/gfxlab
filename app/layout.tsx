import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GFXlab",
  description: "Create custom graphics fast. Covers, flyers, visuals + music.",
  openGraph: {
    title: "GFXlab",
    description:
      "Create covers, flyers, and visuals in seconds. Add music and export for just $5–$8.",
    url: "https://gfxlab.vercel.app",
    siteName: "GFXlab",
    images: [
      {
        url: "https://gfxlab.vercel.app/opengraph-image.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}