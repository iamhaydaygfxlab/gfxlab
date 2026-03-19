import { Capacitor } from "@capacitor/core";

declare global {
  interface Window {
    CdvPurchase?: any;
    store?: any;
  }
}

const PRODUCTS = [
  { id: "export_image", type: "consumable" },
  { id: "export_with_music", type: "consumable" },
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

  PRODUCTS.forEach((product) => {
    store.register({
      id: product.id,
      type:
        product.type === "consumable"
          ? CdvPurchase.ProductType.CONSUMABLE
          : CdvPurchase.ProductType.NON_CONSUMABLE,
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

  const offer = product.getOffer?.();
  if (!offer) {
    throw new Error(`No offer found for product: ${productId}`);
  }

  await offer.order();
}