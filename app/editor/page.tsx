"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";

const GfxEditor = dynamic(() => import("@/components/GfxEditor"), {
  ssr: false,
  loading: () => (
    <div style={{ padding: 24, color: "white", background: "#0b0f19", minHeight: "100vh" }}>
      Loading editor...
    </div>
  ),
});

export default function EditorPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);

    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthChecked(true);
    });

    return () => unsub();
  }, []);

  // ✅ LOADING STATE
  if (!authChecked) {
    return <div style={{ padding: 40, color: "#fff" }}>Loading...</div>;
  }

  return <GfxEditor currentUser={currentUser} />;
}