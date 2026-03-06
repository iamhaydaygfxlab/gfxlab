// lib/cutout.ts
import { removeBackground } from "@imgly/background-removal";

/**
 * Takes an uploaded photo and returns a transparent PNG as a data URL
 * (ready to drop into Konva as src).
 */
export async function cutoutPersonToPngDataUrl(file: File): Promise<string> {
  // 1) Read the file into bytes
  const input = await file.arrayBuffer();

  // 2) Create a Blob WITH a valid mime type (some uploads/cameras give "")
  const mime = file.type && file.type.includes("/") ? file.type : "image/jpeg";
  const inputBlob = new Blob([input], { type: mime });

  // 3) Run background removal -> always output PNG
  const outputBlob = await removeBackground(inputBlob, {
    output: { format: "image/png" }, // <-- IMPORTANT
  });

  // 4) Convert Blob -> dataURL for Konva
  const dataUrl = await blobToDataUrl(outputBlob);
  return dataUrl;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Failed to convert cutout blob to data URL"));
    r.readAsDataURL(blob);
  });
}