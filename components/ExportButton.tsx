"use client";

import React from "react";

export default function ExportButton({
  onExport,
  label = "Export",
  buttonStyle,
}: {
  onExport: () => void;
  label?: string;
  buttonStyle?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onExport}
      style={buttonStyle}
      type="button"
    >
      {label}
    </button>
  );
}