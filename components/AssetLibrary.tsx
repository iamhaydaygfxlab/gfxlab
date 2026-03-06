"use client";

import React, { useEffect, useState } from "react";
import { fetchAssets, type AssetType, type FireAsset } from "@/lib/assets";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

export type AssetItem = { src: string; name?: string; type?: AssetType };

const TABS: { key: AssetType; label: string }[] = [
  { key: "background", label: "pre-made backgrounds" },
  { key: "sticker", label: "Elements" },
  { key: "texture", label: "Icons" },
  { key: "cars", label: "Cars" },
  { key: "effects", label: "Effects" },
  { key: "models", label: "Models" },
  { key: "money", label: "Money" },
];

export default function AssetLibrary({ onPick }: { onPick: (asset: AssetItem) => void }) {
  const [type, setType] = useState<AssetType>("background");
  const [assets, setAssets] = useState<FireAsset[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    fetchAssets(type)
      .then((rows) => alive && setAssets(rows))
      .catch((err) => {
        console.error("fetchAssets failed", err);
        alive && setAssets([]);
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [type]);

  async function pickAsset(a: FireAsset) {
    const storage = getStorage();
    const url = await getDownloadURL(ref(storage, a.path));
    onPick({ src: url, name: a.name, type: a.type });
  }

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setType(t.key)}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)",
              background: type === t.key ? "#d1b15a" : "rgba(0,0,0,0.35)",
              color: "white",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ opacity: 0.8 }}>Loading…</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
  {assets.map((a) => (
    <button
      key={a.id}
      onClick={async () => {
        const storage = getStorage();
        const url = await getDownloadURL(ref(storage, a.path));
        onPick({ src: url, name: a.name, type: a.type });
      }}
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.18)",
        background: "rgba(0,0,0,0.25)", // ✅ no white card
        padding: 10,
        cursor: "pointer",
        height: 120,                  // ✅ forces equal height
        display: "flex",
        alignItems: "center",         // ✅ centers image
        justifyContent: "center",     // ✅ centers image
      }}
      title={a.name || "asset"}
    >
      <img
        src={`https://firebasestorage.googleapis.com/v0/b/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(
          a.path
        )}?alt=media`}
        alt={a.name || "asset"}
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",  // ✅ prevents cropping + keeps even
          display: "block",
        }}
      />
    </button>
  ))}
</div>
        
      
    </div>
  );
}