import { Capacitor } from "@capacitor/core";
import { buyNativeProduct } from "@/lib/nativeBilling";

export async function startPurchaseFlow(productId: string) {
  const platform = Capacitor.getPlatform();
  alert(`startPurchaseFlow platform: ${platform}, product: ${productId}`);

  if (platform === "web") {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Stripe checkout failed");

    window.location.href = data.url;
    return;
  }

  if (platform === "android" || platform === "ios") {
    await buyNativeProduct(productId);
    return;
  }

  throw new Error("Unsupported platform");
}