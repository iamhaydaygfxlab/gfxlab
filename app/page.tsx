"use client";

import { useRouter } from "next/navigation";

const GOLD = "#C8A24A";
const GOLD_SOFT = "rgba(200,162,74,0.25)";
const BG_OVERLAY = "rgba(0,0,0,0.78)";
const CARD = "rgba(10,10,10,0.72)";
const BORDER = "rgba(255,255,255,0.14)";
const TEXT_DIM = "rgba(255,255,255,0.72)";

export default function Page() {
  const router = useRouter();

  function handleGuestContinue() {
    router.push("/editor");
  }

  function handleProUpgrade() {
    router.push("/login?next=checkout-pro");
  }

  function handleSignIn() {
    router.push("/login");
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
          background: BG_OVERLAY,
          display: "flex",
          justifyContent: "center",
          padding: 18,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 980,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          {/* Header */}
          <div
            style={{
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: -30,
              marginBottom: 18,
            }}
          >
            <img
              src="/logo.png"
              alt="GfxLab"
              style={{
                width: 300,
                maxWidth: "80vw",
                height: "auto",
                marginBottom: -28,
                filter: "drop-shadow(0 0 14px rgba(200,162,74,0.55))",
              }}
            />

            <div
              style={{
                color: TEXT_DIM,
                fontSize: 15,
                marginTop: 0,
                textAlign: "center",
              }}
            >
              Create graphics fast. Export when you're ready.
            </div>

            <div
              style={{
                color: "rgba(255,255,255,0.55)",
                fontSize: 12,
                marginTop: 6,
                textAlign: "center",
              }}
            >
              Guest exports are $5 each • Pro is unlimited
            </div>
          </div>

          {/* Pricing cards */}
          <div
            className="pricingGrid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 14,
              alignItems: "stretch",
            }}
          >
            {/* Guest card */}
            <div
              style={{
                background: CARD,
                border: `1px solid ${BORDER}`,
                borderRadius: 16,
                padding: 18,
                boxShadow: "0 10px 34px rgba(0,0,0,0.40)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div style={{ fontSize: 14, color: TEXT_DIM }}>
                Pay Per Export
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  marginTop: 10,
                }}
              >
                <div style={{ fontSize: 46, fontWeight: 900 }}>$5</div>
                <div style={{ color: TEXT_DIM }}>per export</div>
              </div>

              <div style={{ marginTop: 10, color: TEXT_DIM }}>
                Export your design anytime. No account needed.
              </div>

              <button
                onClick={handleGuestContinue}
                style={{
                  marginTop: 16,
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "transparent",
                  color: "white",
                  border: `1px solid ${BORDER}`,
                  cursor: "pointer",
                  fontSize: 16,
                  fontWeight: 800,
                }}
              >
                Continue as Guest
              </button>

              <div style={{ marginTop: 10, fontSize: 12, color: TEXT_DIM }}>
                Tip: If you export a lot, Pro saves money fast.
              </div>
            </div>

            {/* Pro card */}
            <div
              style={{
                background: `linear-gradient(180deg, ${GOLD_SOFT}, rgba(0,0,0,0))`,
                border: `1px solid ${GOLD}`,
                borderRadius: 16,
                padding: 18,
                boxShadow: "0 12px 44px rgba(200,162,74,0.14)",
                position: "relative",
                overflow: "hidden",
                backdropFilter: "blur(10px)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: GOLD,
                  color: "black",
                  fontSize: 12,
                  fontWeight: 900,
                }}
              >
                BEST VALUE
              </div>

              <div style={{ fontSize: 14, color: TEXT_DIM }}>GfxLab Pro</div>

              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  marginTop: 10,
                }}
              >
                <div style={{ fontSize: 46, fontWeight: 950 }}>$50</div>
                <div style={{ color: TEXT_DIM }}>/ month</div>
              </div>

              <div style={{ marginTop: 10, color: TEXT_DIM }}>
                Unlimited exports + premium features.
              </div>

              <ul
                style={{
                  marginTop: 14,
                  marginBottom: 0,
                  paddingLeft: 18,
                  color: "white",
                  lineHeight: 1.55,
                }}
              >
                <li style={{ marginBottom: 6 }}>Unlimited exports</li>
                <li style={{ marginBottom: 6 }}>High resolution</li>
                <li style={{ marginBottom: 6 }}>Transparent PNG</li>
                <li style={{ marginBottom: 0 }}>Premium assets + fonts</li>
              </ul>

              <div style={{ marginTop: 10, fontSize: 12, color: TEXT_DIM }}>
                Break-even: 10 exports/month = $50
              </div>

              <button
                onClick={handleProUpgrade}
                style={{
                  marginTop: 16,
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: GOLD,
                  color: "black",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 16,
                  fontWeight: 950,
                }}
              >
                Upgrade to Pro
              </button>
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: 18 }}>
            <button
              onClick={handleSignIn}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.70)",
                cursor: "pointer",
                textDecoration: "underline",
                fontSize: 14,
              }}
            >
              Already Pro? Sign In
            </button>
          </div>

          <style jsx>{`
            @media (min-width: 760px) {
              .pricingGrid {
                grid-template-columns: 1fr 1fr !important;
              }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}