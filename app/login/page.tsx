"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { app } from "@/lib/firebase"; // change path if your firebase file is different

const GOLD = "#C8A24A";
const BG = "rgba(0,0,0,0.82)";
const CARD = "rgba(10,10,10,0.78)";
const BORDER = "rgba(255,255,255,0.14)";
const TEXT_DIM = "rgba(255,255,255,0.72)";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogleSignIn() {
    setLoading(true);
    setError("");

    try {
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const uid = result.user.uid;
      const email = result.user.email;

      if (!uid || !email) {
        throw new Error("Missing user UID or email after sign-in.");
      }

      if (next === "checkout-pro") {
        router.push(
          `/api/stripe/checkout-pro?uid=${encodeURIComponent(uid)}&email=${encodeURIComponent(email)}`
        );
        return;
      }

      router.push("/editor");
    } catch (err: any) {
      setError(err?.message || "Sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        style={{
          minHeight: "100vh",
          background: BG,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 18,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 18,
            padding: 24,
            backdropFilter: "blur(10px)",
            boxShadow: "0 10px 34px rgba(0,0,0,0.40)",
            textAlign: "center",
          }}
        >
          <img
            src="/logo.png"
            alt="GfxLab"
            style={{
              width: 220,
              maxWidth: "70%",
              height: "auto",
              marginBottom: -10,
              filter: "drop-shadow(0 0 14px rgba(200,162,74,0.55))",
            }}
          />

          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              marginTop: 8,
              color: "white",
            }}
          >
            Sign in to GfxLab
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 14,
              color: TEXT_DIM,
            }}
          >
            Sign in to continue to Pro checkout or access your account.
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              marginTop: 20,
              width: "100%",
              padding: "14px 16px",
              borderRadius: 12,
              background: GOLD,
              color: "black",
              border: "none",
              cursor: loading ? "default" : "pointer",
              fontSize: 16,
              fontWeight: 900,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in..." : "Continue with Google"}
          </button>

          {error ? (
            <div
              style={{
                marginTop: 14,
                color: "#ff6b6b",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          ) : null}

          <button
            onClick={() => router.push("/")}
            style={{
              marginTop: 14,
              background: "transparent",
              border: "none",
              color: TEXT_DIM,
              textDecoration: "underline",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}