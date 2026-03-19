import { Capacitor } from "@capacitor/core";
import { Purchases, LOG_LEVEL } from "@revenuecat/purchases-capacitor";

let configured = false;

export async function initMobilePurchases() {
  const platform = Capacitor.getPlatform();

  if (platform === "web") return;
  if (configured) return;

  await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

  await Purchases.configure({
    apiKey:
      platform === "ios"
        ? process.env.NEXT_PUBLIC_REVENUECAT_APPLE_API_KEY!
        : process.env.NEXT_PUBLIC_REVENUECAT_GOOGLE_API_KEY!,
    appUserID: undefined, // later you can pass Firebase uid here
  });

  configured = true;
}

export async function buyMobileProduct(productId: string) {
  await initMobilePurchases();

  const offerings = await Purchases.getOfferings();
  const current = offerings.current;

  if (!current) {
    throw new Error("No mobile purchase offerings found");
  }

  const pkg = current.availablePackages.find(
    (p) => p.product.identifier === productId
  );

  if (!pkg) {
    throw new Error(`Product not found in RevenueCat offerings: ${productId}`);
  }

  const result = await Purchases.purchasePackage({ aPackage: pkg });
  return result;
}

export async function restoreMobilePurchases() {
  await initMobilePurchases();
  return await Purchases.restorePurchases();
}