import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type TemplateType = "cover" | "flyer" | "social";

export type TemplateTextItem = {
  kind: "text";
  text: string;
  x: number;
  y: number;
  align?: "left" | "center" | "right";
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  fill: string;
};

export type FireTemplate = {
  id: string;
  name: string;
  type: TemplateType;
  presetId: string;
  bgSrc: string;
  pro?: boolean;
  previewSrc?: string;
  items: TemplateTextItem[];
};

export async function fetchTemplates(type: TemplateType) {
  const q = query(
    collection(db, "templates"),
    where("type", "==", type),
    orderBy("name")
  );

  const snap = await getDocs(q);

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FireTemplate[];
}