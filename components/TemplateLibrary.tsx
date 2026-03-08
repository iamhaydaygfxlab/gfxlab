"use client";

import React, { useEffect, useState } from "react";
import { fetchTemplates, type FireTemplate, type TemplateType } from "@/lib/templates";

export default function TemplateLibrary({
  type,
  paid,
  onPick,
}: {
  type: TemplateType;
  paid: boolean;
  onPick: (template: FireTemplate) => void;
}) {
  const [templates, setTemplates] = useState<FireTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    fetchTemplates(type)
      .then((rows) => {
        if (alive) setTemplates(rows);
      })
      .catch((err) => {
        console.error("fetchTemplates failed", err);
        if (alive) setTemplates([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [type]);

  return (
    <div style={{ padding: 12 }}>
      {loading && <div style={{ opacity: 0.8 }}>Loading templates...</div>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          paddingTop: 10,
        }}
      >
        {templates.map((t) => {
          const locked = t.pro === true && !paid;

          return (
            <button
              key={t.id}
              type="button"
              disabled={locked}
              onClick={() => onPick(t)}
              style={{
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.18)",
                background: locked
                  ? "rgba(255,255,255,0.08)"
                  : "linear-gradient(135deg,#d1b15a,#000000)",
                color: "white",
                fontWeight: 700,
                fontSize: 13,
                minHeight: 120,
                padding: 10,
                cursor: locked ? "not-allowed" : "pointer",
                opacity: locked ? 0.6 : 1,
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 8 }}>{t.name}</div>

              {t.previewSrc ? (
                <img
                  src={t.previewSrc}
                  alt={t.name}
                  style={{
                    width: "100%",
                    height: 72,
                    objectFit: "cover",
                    borderRadius: 10,
                    display: "block",
                    marginBottom: 8,
                  }}
                />
              ) : null}

              <div style={{ fontSize: 11, opacity: 0.85 }}>
                {locked ? "Pro Template" : "Tap to use"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}