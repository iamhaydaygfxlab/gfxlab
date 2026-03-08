"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";

export default function Home() {
  const router = useRouter();

  const [loadingGuest, setLoadingGuest] = useState(false);
  const [loadingPro, setLoadingPro] = useState(false);

  async function handleGuest() {
    if (loadingGuest) return;

    try {
      setLoadingGuest(true);
      router.push("/editor");
    } catch (err) {
      console.error(err);
      setLoadingGuest(false);
    }
  }

  async function handleProCheckout() {
    if (loadingPro) return;

    try {
      setLoadingPro(true);

      const auth = getAuth(app);
      let user = auth.currentUser;

      if (!user) {
        await new Promise<void>((resolve) => {
          const unsub = auth.onAuthStateChanged((u) => {
            user = u;
            unsub();
            resolve();
          });
        });
      }

      if (!user) {
        router.push("/login");
        setLoadingPro(false);
        return;
      }

      const params = new URLSearchParams();
      params.set("uid", user.uid);
      if (user.email) {
        params.set("email", user.email);
      }

      window.location.href = `/api/stripe/checkout-pro?${params.toString()}`;
    } catch (err) {
      console.error(err);
      alert("Stripe checkout failed.");
      setLoadingPro(false);
    }
  }

  function handleAlreadyPro() {
    router.push("/login");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundImage: "url('/app-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        justifyContent: "center",
        padding: "0px 40px 18px",
        color: "white",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 340,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <img
          src="/logo.png"
          alt="GfxLab"
          style={{
            width: "100%",
            maxWidth: 235,
            height: "auto",
            objectFit: "contain",
            marginTop: -10,
          }}
        />

        <div style={{ textAlign: "center", marginTop: 2 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              lineHeight: 1.2,
            }}
          >
            Create graphics fast. Export when you're ready.
          </div>

          <div
            style={{
              fontSize: 12,
              opacity: 0.72,
              marginTop: 10,
            }}
          >
            Guest exports are $5 each • Pro is unlimited
          </div>
        </div>

        <div
          style={{
            width: "100%",
            background: "rgba(0,0,0,0.82)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 22,
            padding: "15px 15px 13px",
            boxShadow: "0 10px 26px rgba(0,0,0,0.30)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              fontSize: 13,
              opacity: 0.9,
              marginBottom: 8,
            }}
          >
            Pay Per Export
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontSize: 54,
                fontWeight: 900,
                lineHeight: 0.9,
                letterSpacing: "-2px",
              }}
            >
              $5
            </span>

            <span
              style={{
                fontSize: 16,
                opacity: 0.9,
                marginBottom: 7,
              }}
            >
              per export
            </span>
          </div>

          <div
            style={{
              fontSize: 15,
              lineHeight: 1.22,
              opacity: 0.95,
              maxWidth: 280,
              marginBottom: 14,
            }}
          >
            Export your design anytime. No account needed.
          </div>

          <button
            onClick={handleGuest}
            disabled={loadingGuest}
            style={{
              width: "100%",
              height: 30,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgb(0, 0, 0)",
              color: "white",
              fontWeight: 800,
              fontSize: 15,
              cursor: "pointer",
              opacity: loadingGuest ? 0.7 : 1,
            }}
          >
            {loadingGuest ? "Opening..." : "Continue as Guest"}
          </button>

          <div
            style={{
              fontSize: 12,
              opacity: 0.68,
              marginTop: 12,
            }}
          >
            Tip: If you export a lot, Pro saves money fast.
          </div>
        </div>

        <div
          style={{
            width: "100%",
            background:
              "linear-gradient(180deg, rgba(209,177,90,0.34) 0%, rgba(0,0,0,0.82) 62%)",
            border: "1px solid rgba(209,177,90,0.65)",
            borderRadius: 22,
            padding: "15px 15px 7px",
            boxShadow: "0 10px 26px rgba(0,0,0,0.32)",
            position: "relative",
            overflow: "hidden",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              background: "#e0bb58",
              color: "black",
              fontSize: 11,
              fontWeight: 900,
              borderRadius: 999,
              padding: "7px 11px",
            }}
          >
            BEST VALUE
          </div>

          <div
            style={{
              fontSize: 13,
              opacity: 0.95,
              marginBottom: 8,
            }}
          >
            GfxLab Pro
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 5,
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 52,
                fontWeight: 900,
                lineHeight: 0.9,
                letterSpacing: "-2px",
              }}
            >
              $50
            </span>

            <span
              style={{
                fontSize: 16,
                opacity: 0.9,
                marginBottom: 7,
              }}
            >
              / month
            </span>
          </div>

          <div
            style={{
              fontSize: 15,
              lineHeight: 1.25,
              opacity: 0.96,
              marginBottom: 12,
            }}
          >
            Unlimited exports + premium features.
          </div>

          <ul
            style={{
              margin: 0,
              paddingLeft: 22,
              lineHeight: 1.7,
              fontSize: 15,
              marginBottom: 10,
            }}
          >
            <li>Unlimited exports</li>
            <li>High resolution</li>
            <li>Transparent PNG</li>
            <li>Premium assets + fonts</li>
          </ul>

          <div
            style={{
              fontSize: 12,
              opacity: 0.74,
              marginBottom: 12,
            }}
          >
            Break-even: 10 exports/month = $50
          </div>

          <button
            onClick={handleProCheckout}
            disabled={loadingPro}
            style={{
              width: "100%",
              height: 30,
              borderRadius: 14,
              border: "none",
              background: "#d1b15a",
              color: "black",
              fontWeight: 900,
              fontSize: 15,
              cursor: "pointer",
              opacity: loadingPro ? 0.7 : 1,
            }}
          >
            {loadingPro ? "Loading..." : "Upgrade to Pro"}
          </button>
        </div>

        <button
          onClick={handleAlreadyPro}
          style={{
            width: "100%",
            maxWidth: 370,
            height: 42,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(0,0,0,0.45)",
            color: "white",
            fontWeight: 800,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Already Pro? Sign In
        </button>
      </div>
    </main>
  );
}