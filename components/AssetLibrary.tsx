"use client";

import React, { useEffect, useState } from "react";
import { fetchAssets, type AssetType, type FireAsset } from "@/lib/assets";

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

  function pickAsset(a: FireAsset) {
    onPick({ src: a.src, name: a.name, type: a.type });
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
            onClick={() => pickAsset(a)}
            style={{
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(0,0,0,0.25)",
              padding: 10,
              cursor: "pointer",
              height: 120,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title={a.name || "asset"}
          >
            <img
              src={a.src}
              alt={a.name || "asset"}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                display: "block",
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}