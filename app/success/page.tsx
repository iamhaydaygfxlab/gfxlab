"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // ✅ unlock export AFTER payment
    sessionStorage.setItem("paid_export", "true");

    // redirect back to editor
    setTimeout(() => {
      router.push("/editor");
    }, 1500);
  }, []);

  return (
    <div style={{ padding: 40, textAlign: "center", color: "white" }}>
      <h1>Payment Successful 🎉</h1>
      <p>Redirecting back to your design...</p>
    </div>
  );
}