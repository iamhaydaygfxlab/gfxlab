import { NextResponse } from "next/server";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/firebase";

const CATEGORIES = [
  "money",
  "cars",
  "models",
  "effects",
  "shapes",
  "backgrounds",
];

export async function GET() {
  try {
    const storage = getStorage(app);
    const results: any[] = [];

    for (const category of CATEGORIES) {
      const folderRef = ref(storage, `assets/${category}`);
      const list = await listAll(folderRef);

      for (const item of list.items) {
        const url = await getDownloadURL(item);

        results.push({
          id: `${category}-${item.name}`,
          category,
          name: item.name,
          src: url,
        });
      }
    }

    return NextResponse.json({
      version: 1,
      assets: results,
    });

  } catch (err: any) {
    console.error(err);

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}