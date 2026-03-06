import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";

export type AssetType =
  | "background"
  | "sticker"
  | "texture"
  | "cars"
  | "effects"
  | "models"
  | "money";

export type FireAsset = {
  id: string;
  name?: string;
  type: AssetType;
  url: string;
  path?: string;
  createdAt?: any;
};

export async function fetchAssets(type: AssetType) {
  const q = query(
    collection(db, "assets"),
    where("type", "==", type),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as FireAsset[];
}