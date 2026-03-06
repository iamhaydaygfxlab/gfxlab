// app/cancel/page.tsx
"use client";

import { useEffect } from "react";

export default function CancelPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") || "/editor";
    window.location.href = next;
  }, []);

  return (
    <main style={{ minHeight: "100vh", padding: 24, background: "#0b0f19", color: "white" }}>
      <h1 style={{ fontSize: 22, fontWeight: 900 }}>Payment canceled</h1>
      <p style={{ opacity: 0.85 }}>Sending you back…</p>
    </main>
  );
}