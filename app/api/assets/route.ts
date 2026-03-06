import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type AssetCategory = "money" | "cars" | "models" | "effects" | "shapes" | "backgrounds";


type AssetItem = {
  id: string;
  category: AssetCategory;
  name: string;
  src: string; // public path, e.g. /assets/money/money1.png
};

const CATEGORIES: AssetCategory[] = ["money", "cars", "models", "effects", "shapes", "backgrounds"];
const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);

function toTitleFromFilename(filename: string) {
  const base = filename.replace(path.extname(filename), "");
  const withSpaces = base.replace(/[_-]+/g, " ").trim();
  return withSpaces
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function makeId(category: string, filename: string) {
  const base = filename.replace(path.extname(filename), "").toLowerCase();
  const safe = base.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${category}-${safe}`;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const onlyCategory = url.searchParams.get("category") as AssetCategory | null;

    const categoriesToScan = onlyCategory && CATEGORIES.includes(onlyCategory)
      ? [onlyCategory]
      : CATEGORIES;

    const publicDir = path.join(process.cwd(), "public");
    const assetsRoot = path.join(publicDir, "assets");

    const results: AssetItem[] = [];

    for (const category of categoriesToScan) {
      const dir = path.join(assetsRoot, category);

      if (!fs.existsSync(dir)) continue;

      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const ent of entries) {
        if (!ent.isFile()) continue;

        const ext = path.extname(ent.name).toLowerCase();
        if (!IMAGE_EXTS.has(ext)) continue;

        results.push({
          id: makeId(category, ent.name),
          category,
          name: toTitleFromFilename(ent.name),
          src: `/assets/${category}/${ent.name}`,
        });
      }
    }

    // Sort nicely (category then name)
    results.sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json(
      { version: 1, assets: results },
      {
        headers: {
          // Don’t cache while developing; you can change later
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed to scan assets" },
      { status: 500 }
    );
  }
}