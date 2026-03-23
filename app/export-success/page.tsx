"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ExportSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(rgba(0,0,0,0.82), rgba(0,0,0,0.9)), url('/background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "22px",
          padding: "28px",
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            margin: 0,
            marginBottom: "12px",
            fontSize: "32px",
            fontWeight: 900,
          }}
        >
          Payment Successful
        </h1>

        <p
          style={{
            margin: 0,
            marginBottom: "22px",
            fontSize: "16px",
            color: "rgba(255,255,255,0.82)",
            lineHeight: 1.5,
          }}
        >
          Your payment went through BOOM!!. When you return to the page you edit will be in "EXPORT" 
          hold down the image  and save it THANK YOU !! 
        </p>

        <Link
          href={sessionId ? `/editor?export=success&session_id=${sessionId}` : "/editor"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "56px",
            borderRadius: "16px",
            textDecoration: "none",
            fontWeight: 900,
            fontSize: "18px",
            color: "#fff",
            background:
              "linear-gradient(90deg, rgba(209,177,90,0.95) 0%, rgba(120,92,35,0.9) 45%, rgba(0,0,0,0.95) 100%)",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          Return to Editor
        </Link>

        <p
          style={{
            marginTop: "16px",
            fontSize: "13px",
            color: "rgba(255,255,255,0.62)",
          }}
        >
          Session ID: {sessionId || "Not found"}
        </p>
      </div>
    </main>
  );
}

export default function ExportSuccessPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: "#fff" }}>Loading...</div>}>
      <ExportSuccessContent />
    </Suspense>
  );
}