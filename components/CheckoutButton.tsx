"use client";

import { useState } from "react";

export default function CheckoutButton() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("No checkout URL returned");
      }
    } catch (err) {
      console.error(err);
      alert("Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      style={{
        padding: "12px 24px",
        backgroundColor: "black",
        color: "white",
        borderRadius: "10px",
        fontSize: "16px",
        cursor: "pointer",
      }}
    >
      {loading ? "Loading..." : "Buy Now"}
    </button>
  );
}