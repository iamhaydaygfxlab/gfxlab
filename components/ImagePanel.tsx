"use client";

import React from "react";

export type ImageAdjustments = {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  blur: number;
  hdr: number;
  texture: number;
  clarity: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function ImagePanel({
  value,
  onChange,
  onReset,
}: {
  value: ImageAdjustments;
  onChange: (next: ImageAdjustments) => void;
  onReset: () => void;
}) {
  return (
    <div style={wrap}>
      <div style={{ fontWeight: 900, marginBottom: 10 }}>Image Settings</div>

      <Slider label="Brightness" min={-1} max={1} step={0.05} value={value.brightness}
        onChange={(v) => onChange({ ...value, brightness: clamp(v, -1, 1) })} />

      <Slider label="Contrast" min={-100} max={100} step={1} value={value.contrast}
        onChange={(v) => onChange({ ...value, contrast: clamp(v, -100, 100) })} />

      <Slider label="Saturation" min={-2} max={2} step={0.05} value={value.saturation}
        onChange={(v) => onChange({ ...value, saturation: clamp(v, -2, 2) })} />

      <Slider label="Hue" min={-180} max={180} step={1} value={value.hue}
        onChange={(v) => onChange({ ...value, hue: clamp(v, -180, 180) })} />

      <Slider label="Blur" min={0} max={30} step={1} value={value.blur}
        onChange={(v) => onChange({ ...value, blur: clamp(v, 0, 30) })} />

      <Slider label="HDR" min={0} max={1} step={0.01} value={value.hdr ?? 0}
        onChange={(v) => onChange({ ...value, hdr: v })} />

      <Slider label="Texture" min={0} max={1} step={0.01} value={value.texture ?? 0}
        onChange={(v) => onChange({ ...value, texture: v })} />

      <Slider label="Clarity" min={0} max={1} step={0.01} value={value.clarity ?? 0}
        onChange={(v) => onChange({ ...value, clarity: v })} />

      <button style={btn} onClick={onReset}>Reset Image Adjustments</button>
    </div>
  );
}

function Slider({
  label, min, max, step, value, onChange,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={labelStyle}>
        <span>{label}</span>
        <span style={{ opacity: 0.8 }}>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%" }}
      />
    </div>
  );
}

const wrap: React.CSSProperties = {
  padding: 12,
  borderRadius: 12,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 12,
  fontWeight: 800,
  opacity: 0.9,
  marginBottom: 6,
};

const btn: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  cursor: "pointer",
  fontWeight: 800,
};