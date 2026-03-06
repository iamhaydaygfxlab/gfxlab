"use client";

import React from "react";

type LayerRow = {
  id: string;
  kind: "text" | "image";
  label: string;
};

export default function LayersPanel({
  layers,
  selectedId,
  onSelect,
  onMoveUp,
  onMoveDown,
  onToFront,
  onToBack,
}: {
  layers: LayerRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;

  onMoveUp: () => void;
  onMoveDown: () => void;
  onToFront: () => void;
  onToBack: () => void;
}) {
  const hasSelection = !!selectedId;

  return (
    <div style={wrap}>
      <div style={header}>
        <div style={{ fontWeight: 900 }}>Layers</div>
        <div style={{ fontSize: 11, opacity: 0.7 }}>{layers.length} item(s)</div>
      </div>

      <div style={btnRow}>
        <button style={hasSelection ? btnMini : btnMiniDisabled} onClick={onToFront} disabled={!hasSelection} type="button">
          To Top
        </button>
        <button style={hasSelection ? btnMini : btnMiniDisabled} onClick={onMoveUp} disabled={!hasSelection} type="button">
          Up
        </button>
        <button style={hasSelection ? btnMini : btnMiniDisabled} onClick={onMoveDown} disabled={!hasSelection} type="button">
          Down
        </button>
        <button style={hasSelection ? btnMini : btnMiniDisabled} onClick={onToBack} disabled={!hasSelection} type="button">
          To Bottom
        </button>
      </div>

      <div style={list}>
        {layers.length === 0 ? (
          <div style={{ opacity: 0.7, fontSize: 12 }}>No layers yet.</div>
        ) : (
          layers
            // topmost at top of list (reverse drawing order)
            .slice()
            .reverse()
            .map((l, idx) => {
              const isActive = l.id === selectedId;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => onSelect(l.id)}
                  style={isActive ? rowActive : row}
                >
                  <div style={badge}>{l.kind === "text" ? "T" : "I"}</div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontWeight: 900, fontSize: 12 }}>{l.label}</div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>
                      {l.kind === "text" ? "Text" : "Image"} • Layer #{layers.length - idx}
                    </div>
                  </div>
                </button>
              );
            })
        )}
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = {
  padding: 12,
  borderRadius: 12,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  marginBottom: 10,
};

const btnRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
  marginBottom: 10,
};

const btnMini: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 12,
};

const btnMiniDisabled: React.CSSProperties = {
  ...btnMini,
  opacity: 0.45,
  cursor: "not-allowed",
};

const list: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  maxHeight: 260,
  overflowY: "auto",
};

const row: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  padding: 10,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.22)",
  color: "white",
  cursor: "pointer",
};

const rowActive: React.CSSProperties = {
  ...row,
  border: "1px solid rgba(14,165,233,0.55)",
  boxShadow: "0 0 0 2px rgba(14,165,233,0.18) inset",
  background: "rgba(14,165,233,0.12)",
};

const badge: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 8,
  display: "grid",
  placeItems: "center",
  fontWeight: 1000 as any,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.10)",
};