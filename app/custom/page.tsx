"use client";

import { useEffect } from "react";

export default function CustomPage() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://www.powr.io/powr.js?platform=html";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Custom Design Request</h1>

      <div
        className="powr-form-builder"
        id="ea427f26_1774208927"
      ></div>
    </div>
  );
}