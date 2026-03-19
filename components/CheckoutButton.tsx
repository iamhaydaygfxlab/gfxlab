"use client";

import { startPurchaseFlow } from "@/lib/startPurchaseFlow";

export default function CheckoutButton() {
  const handleCheckout = async () => {
    try {
      await startPurchaseFlow("pro");
    } catch (error) {
      console.error("Checkout failed:", error);
      alert("Checkout failed");
    }
  };

  return (
    <button onClick={handleCheckout}>
      Upgrade
    </button>
  );
}