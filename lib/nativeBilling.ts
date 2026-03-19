import { Capacitor } from "@capacitor/core";

declare global {
  interface Window {
    CdvPurchase?: any;
    store?: any;
  }
}

const PRODUCT_IDS = [
  "export_image",
  "export_with_music",
];

let initialized = false;

export async function initNativeBilling() {
  const platform = Capacitor.getPlatform();

  if (platform === "web") return;
  if (initialized) return;

  const store = window.CdvPurchase?.store || window.store;
  const CdvPurchase = window.CdvPurchase;

  if (!store || !CdvPurchase) {
    throw new Error("Billing plugin not available");
  }

  const nativePlatform =
    platform === "android"
      ? CdvPurchase.Platform.GOOGLE_PLAY
      : CdvPurchase.Platform.APPLE_APPSTORE;

  PRODUCT_IDS.forEach((id) => {
    store.register({
      id,
      type: CdvPurchase.ProductType.NON_CONSUMABLE,
      platform: nativePlatform,
    });
  });

  store.when().approved((transaction: any) => {
    transaction.verify();
  });

  store.when().verified((receipt: any) => {
    receipt.finish();
  });

  store.error((err: any) => {
    console.error("Billing error", err);
  });

  store.verbosity = CdvPurchase.LogLevel.DEBUG;

  await store.initialize([nativePlatform]);
  initialized = true;
}

export async function buyNativeProduct(productId: string) {
  await initNativeBilling();

  const store = window.CdvPurchase?.store || window.store;
  const product = store.get(productId);

  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  await product.getOffer()?.order();
}