"use client";

import React from "react";

export type TextSettings = {
  text: string;

  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: "normal" | "italic";

  fill: string;
  align: "left" | "center" | "right";

  letterSpacing: number;
  lineHeight: number;

  textDecoration: "none" | "underline" | "line-through";

  bgEnabled: boolean;
  bgColor: string;
  bgOpacity: number;
  bgPaddingX: number;
  bgPaddingY: number;
  bgRadius: number;

  strokeEnabled: boolean;
  strokeColor: string;
  strokeWidth: number;

  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowOpacity: number;

  style3d: "none" | "soft" | "hard";

  // ✅ Step 4: Curved Text
  curveEnabled: boolean;
  curveRadius: number; // px
  curveArc: number; // degrees (20..320)
  curveReverse: boolean;
};

export default function FontPanel({
  value,
  onChange,
}: {
  value: TextSettings;
  onChange: (next: TextSettings) => void;
}) {
  function patch(p: Partial<TextSettings>) {
    onChange({ ...value, ...p });
  }

  return (
  <div style={wrap}>
    <style>{mediaWrapCss}</style>
    <style>{mediaGridCss}</style>
    <div style={title}>Text</div>

      <div style={row}>
        <div style={label}>Content</div>
        <textarea
          value={value.text}
          onChange={(e) => patch({ text: e.target.value })}
          style={textarea}
          rows={3}
        />
      </div>

      <div className="grid2-stack" style={grid2}>
        <div>
          <div style={label}>Font</div>
          <select
  value={value.fontFamily}
  onChange={(e) => onChange({ ...value, fontFamily: e.target.value })}
  style={input}
>
  <option value="Impact">Impact</option>
  <option value="Arial">Arial</option>
  <option value="Helvetica">Helvetica</option>
  <option value="Times New Roman">Times New Roman</option>
  <option value="Georgia">Georgia</option>
  <option value="Verdana">Verdana</option>
  <option value="Trebuchet MS">Trebuchet MS</option>
  <option value="Courier New">Courier New</option>
   <option value="Blank River">Blank River</option>
</select>
        </div>

        <div>
          <div style={label}>Size</div>
          <input
            type="number"
            value={value.fontSize}
            min={8}
            max={400}
            onChange={(e) => onChange({ ...value, fontSize: Number(e.target.value) })}
            style={input}
          />
        </div>

        <div>
          <div style={label}>Weight</div>
          <input
  type="number"
  value={value.fontWeight}
  onChange={(e) => onChange({ ...value, fontWeight: Number(e.target.value) })}
  style={input}
/>
        </div>

        <div>
          <div style={label}>Style</div>
          <select
            value={value.fontStyle}
            onChange={(e) => patch({ fontStyle: e.target.value as any })}
            style={input}
          >
            <option value="normal">Normal</option>
            <option value="italic">Italic</option>
          </select>
        </div>
      </div>

      <div className="grid2-stack" style={grid2}>
        <div>
          <div style={label}>Color</div>
         <input
  type="color"
  value={value.fill}
  onChange={(e) => onChange({ ...value, fill: e.target.value })}
  style={{ ...input, height: 44, padding: 6 }}
/>
        </div>

        <div>
          <div style={label}>Align</div>
          <select value={value.align} onChange={(e) => patch({ align: e.target.value as any })} style={input}>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>

        <div>
          <div style={label}>Letter Spacing</div>
          <input
            type="number"
            value={value.letterSpacing}
            min={-10}
            max={50}
            step={0.5}
            onChange={(e) => patch({ letterSpacing: Number(e.target.value || 0) })}
            style={input}
          />
        </div>

        <div>
          <div style={label}>Line Height</div>
          <input
            type="number"
            value={value.lineHeight}
            min={0.6}
            max={3}
            step={0.05}
            onChange={(e) => patch({ lineHeight: Number(e.target.value || 0) })}
            style={input}
          />
        </div>

        <div>
          <div style={label}>Decoration</div>
          <select
            value={value.textDecoration}
            onChange={(e) => patch({ textDecoration: e.target.value as any })}
            style={input}
          >
            <option value="none">None</option>
            <option value="underline">Underline</option>
            <option value="line-through">Line-through</option>
          </select>
        </div>

        <div>
          <div style={label}>3D Style</div>
          <select value={value.style3d} onChange={(e) => patch({ style3d: e.target.value as any })} style={input}>
            <option value="none">None</option>
            <option value="soft">Soft</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* ✅ Step 4: Curved Text */}
      <div style={section}>
        <div style={sectionTitle}>Curved Text</div>
        <label style={checkRow}>
          <input
            type="checkbox"
            checked={value.curveEnabled}
            onChange={(e) => patch({ curveEnabled: e.target.checked })}
          />
          <span>Enable Curved Text</span>
        </label>

        <div className="grid2-stack" style={grid2}>
          <div>
            <div style={label}>Radius (px)</div>
            <input
              type="number"
              value={value.curveRadius}
              min={40}
              max={2000}
              step={10}
             
              onChange={(e) => patch({ curveRadius: Number(e.target.value || 0) })}
              style={input}
            />
          </div>

          <div>
            <div style={label}>Arc (degrees)</div>
            <input
              type="number"
              value={value.curveArc}
              min={20}
              max={320}
              step={5}
            
              onChange={(e) => patch({ curveArc: Number(e.target.value || 0) })}
              style={input}
            />
          </div>
        </div>

        <label style={checkRow}>
          <input
            type="checkbox"
            checked={value.curveReverse}
          
            onChange={(e) => patch({ curveReverse: e.target.checked })}
          />
          <span>Reverse direction</span>
        </label>

        <div style={{ fontSize: 11, opacity: 0.75 }}>
          Note: Curved text currently ignores the text “background box” feature (bg). Stroke + shadow still work.
        </div>
      </div>

      {/* Background */}
      <div style={section}>
        <div style={sectionTitle}>Background Box</div>
        <label style={checkRow}>
          <input type="checkbox" checked={value.bgEnabled} onChange={(e) => patch({ bgEnabled: e.target.checked })} />
          <span>Enable background</span>
        </label>

        <div className="grid2-stack" style={grid2}>
          <div>
            <div style={label}>BG Color</div>
            <input value={value.bgColor} onChange={(e) => patch({ bgColor: e.target.value })} style={input} />
          </div>
          <div>
            <div style={label}>Opacity</div>
            <input
              type="number"
              value={value.bgOpacity}
              min={0}
              max={1}
              step={0.05}
              onChange={(e) => patch({ bgOpacity: Number(e.target.value || 0) })}
              style={input}
            />
          </div>
          <div>
            <div style={label}>Pad X</div>
            <input
              type="number"
              value={value.bgPaddingX}
              min={0}
              max={200}
              step={1}
              onChange={(e) => patch({ bgPaddingX: Number(e.target.value || 0) })}
              style={input}
            />
          </div>
          <div>
            <div style={label}>Pad Y</div>
            <input
              type="number"
              value={value.bgPaddingY}
              min={0}
              max={200}
              step={1}
              onChange={(e) => patch({ bgPaddingY: Number(e.target.value || 0) })}
              style={input}
            />
          </div>
          <div>
            <div style={label}>Radius</div>
            <input
              type="number"
              value={value.bgRadius}
              min={0}
              max={200}
              step={1}
              onChange={(e) => patch({ bgRadius: Number(e.target.value || 0) })}
              style={input}
            />
          </div>
        </div>
      </div>

      {/* Stroke */}
      <div style={section}>
        <div style={sectionTitle}>Stroke</div>
        <label style={checkRow}>
          <input
            type="checkbox"
            checked={value.strokeEnabled}
            onChange={(e) => patch({ strokeEnabled: e.target.checked })}
          />
          <span>Enable stroke</span>
        </label>

        <div className="grid2-stack" style={grid2}>
          <div>
            <div style={label}>Stroke Color</div>
            <input value={value.strokeColor} onChange={(e) => patch({ strokeColor: e.target.value })} style={input} />
          </div>
          <div>
            <div style={label}>Stroke Width</div>
            <input
              type="number"
              value={value.strokeWidth}
              min={0}
              max={80}
              step={1}
              onChange={(e) => patch({ strokeWidth: Number(e.target.value || 0) })}
              style={input}
            />
          </div>
        </div>
      </div>

      {/* Shadow */}
      <div style={section}>
        <div style={sectionTitle}>Shadow</div>
        <label style={checkRow}>
          <input
            type="checkbox"
            checked={value.shadowEnabled}
            onChange={(e) => patch({ shadowEnabled: e.target.checked })}
          />
          <span>Enable shadow</span>
        </label>

        <div className="grid2-stack" style={grid2}>
          <div>
            <div style={label}>Shadow Color</div>
            <input value={value.shadowColor} onChange={(e) => patch({ shadowColor: e.target.value })} style={input} />
          </div>
          <div>
            <div style={label}>Blur</div>
            <input
              type="number"
              value={value.shadowBlur}
              min={0}
              max={80}
              step={1}
              onChange={(e) => patch({ shadowBlur: Number(e.target.value || 0) })}
              style={input}
            />
          </div>
          <div>
            <div style={label}>Offset X</div>
            <input
              type="number"
              value={value.shadowOffsetX}
              min={-200}
              max={200}
              step={1}
              onChange={(e) => patch({ shadowOffsetX: Number(e.target.value || 0) })}
              style={input}
            />
          </div>
          <div>
            <div style={label}>Offset Y</div>
            <input
              type="number"
              value={value.shadowOffsetY}
              min={-200}
              max={200}
              step={1}
              onChange={(e) => patch({ shadowOffsetY: Number(e.target.value || 0) })}
              style={input}
            />
          </div>
          <div>
            <div style={label}>Opacity</div>
            <input
              type="number"
              value={value.shadowOpacity}
              min={0}
              max={1}
              step={0.05}
              onChange={(e) => patch({ shadowOpacity: Number(e.target.value || 0) })}
              style={input}
            />
          </div>
        </div>
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

const title: React.CSSProperties = { fontWeight: 1000 as any, marginBottom: 10 };

const row: React.CSSProperties = { marginBottom: 10 };

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
  marginBottom: 10,
  alignItems: "start",
  minWidth: 0,
};
const label: React.CSSProperties = { fontSize: 12, opacity: 0.85, marginBottom: 6, fontWeight: 800 };

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.25)",
  color: "white",
  outline: "none",
};

const textarea: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.25)",
  color: "white",
  outline: "none",
  resize: "vertical",
};

const section: React.CSSProperties = {
  marginTop: 10,
  paddingTop: 10,
  borderTop: "1px solid rgba(255,255,255,0.08)",
};

const row2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
};

const col: React.CSSProperties = {
  minWidth: 0, // ✅ prevents overlap in grid
};

const field: React.CSSProperties = {
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
};

const labelSm: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.85,
  fontWeight: 800,
};

const control: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.25)",
  color: "white",
  outline: "none",
};
const panelWrap: React.CSSProperties = {
  padding: 12,
  width: "100%",
  boxSizing: "border-box",
};
const mediaWrapCss = `
@media (max-width: 420px) {
  .fp-row2 {
    grid-template-columns: 1fr !important; /* ✅ stack on small screens */
  }
}
`;
const mediaGridCss = `
@media (max-width: 420px) {
  .grid2-stack {
    grid-template-columns: 1fr !important;
  }
}
`;

const sectionTitle: React.CSSProperties = { fontWeight: 1000 as any, marginBottom: 8, fontSize: 13 };

const checkRow: React.CSSProperties = { display: "flex", gap: 8, alignItems: "center", fontSize: 12, opacity: 0.92 };