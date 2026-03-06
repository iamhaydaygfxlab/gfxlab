import { onObjectFinalized } from "firebase-functions/v2/storage";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

const PREFIXES: Array<{ prefix: string; type: string }> = [
  { prefix: "assets/background/", type: "background" },
  { prefix: "assets/stickers/", type: "sticker" },
  { prefix: "assets/textures/", type: "texture" },
  { prefix: "assets/cars/", type: "cars" },
  { prefix: "assets/effects/", type: "effects" },
  { prefix: "assets/models/", type: "models" },
  { prefix: "assets/money/", type: "money" },
];

function getType(path: string) {
  const hit = PREFIXES.find((p) => path.startsWith(p.prefix));
  return hit?.type ?? null;
}

export const indexAsset = onObjectFinalized({ region: "us-west1" }, async (event) => {
  const filePath = event.data.name;
  if (!filePath) return;

  // ignore folders
  if (filePath.endsWith("/")) return;

  const type = getType(filePath);
  if (!type) return;

  const name = filePath.split("/").pop()?.replace(/\.[^/.]+$/, "") || "asset";

  // ✅ no replaceAll (works on older TS targets)
  const id = filePath.split("/").join("_");

  await db.collection("assets").doc(id).set(
    {
      name,
      type,
      path: filePath,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
});