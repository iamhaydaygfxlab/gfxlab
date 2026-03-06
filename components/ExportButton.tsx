"use client";

import { useEffect, useState } from "react";

export default function ExportButton({
  onExport,
  label = "Export",
  buttonStyle,
}: {
  onExport: () => void;
  label?: string;
  buttonStyle?: React.CSSProperties;
}) {
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ check if user already paid (from success page)
  useEffect(() => {
    setPaid(sessionStorage.getItem("paid_export") === "true");
  }, []);

  async function handleCheckout() {
    try {
      setLoading(true);

      const res = await fetch("/api/checkout", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // ✅ send user to Stripe
      window.location.href = data.url;
    } catch (err: any) {
      alert(err.message);
      setLoading(false);
    }
  }

  function handleExport() {
    // ✅ do the actual export
    onExport();

    // 🔥 IMPORTANT: remove access AFTER export
    sessionStorage.removeItem("paid_export");
    setPaid(true);
  }

  return (
    <div>
      {!paid ? (
        <button style={buttonStyle} onClick={handleCheckout} disabled={loading}>
  {loading ? "Loading..." : label}
</button>
      ) : (
        <button
          onClick={handleExport}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: 10,
            background: "#22c55e",
            color: "white",
            fontWeight: 800,
            border: "none",
            cursor: "pointer",
          }}
        >
          Download Now
        </button>
      )}
    </div>
  );
}