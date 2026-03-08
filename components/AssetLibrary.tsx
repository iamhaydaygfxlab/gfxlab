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

function makeAssetUrl(path: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}/o/${encodeURIComponent(
    path
  )}?alt=media`;
}

export default function AssetLibrary({
  onPick,
}: {
  onPick: (asset: AssetItem) => void;
}) {
  const [type, setType] = useState<AssetType>("background");
  const [assets, setAssets] = useState<FireAsset[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    fetchAssets(type)
      .then((rows) => {
        if (alive) setAssets(rows);
      })
      .catch((err) => {
        console.error("fetchAssets failed", err);
        if (alive) setAssets([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [type]);

  function pickAsset(a: FireAsset) {
    if (!a.path) {
      alert("That asset is missing a file path.");
      return;
    }

    onPick({
      src: makeAssetUrl(a.path),
      name: a.name,
      type: a.type,
    });
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          padding: "10px 4px",
        }}
      >
        {assets.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => pickAsset(a)}
            onTouchEnd={(e) => {
              e.preventDefault();
              pickAsset(a);
            }}
            title={a.name || "asset"}
            style={{
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.18)",
              background: "linear-gradient(135deg,#d1b15a,#000000)",
              color: "white",
              fontWeight: 700,
              fontSize: 14,
              height: 110,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "10px",
              cursor: "pointer",
              touchAction: "manipulation",
            }}
          >
            {a.path ? (
              <img
                src={makeAssetUrl(a.path)}
                alt={a.name || "asset"}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  display: "block",
                  pointerEvents: "none",
                }}
              />
            ) : (
              <div
                style={{
                  color: "white",
                  fontSize: 12,
                  opacity: 0.7,
                  textAlign: "center",
                  padding: 12,
                }}
              >
                Missing asset image
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}