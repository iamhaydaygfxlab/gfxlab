// app/editor/page.tsx
"use client";

import dynamic from "next/dynamic";

const GfxEditor = dynamic(() => import("@/components/GfxEditor"), {
  ssr: false,
  loading: () => (
    <div style={{ padding: 24, color: "white", background: "#0b0f19", minHeight: "100vh" }}>
      Loading editor...
    </div>
  ),
});

export default function EditorPage() {
  return <GfxEditor />;
}