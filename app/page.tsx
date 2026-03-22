"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Capacitor } from "@capacitor/core";
export default function HomePage() {
  const router = useRouter();
  const isNative = Capacitor.getPlatform() !== "web";

  return (
    <>
      <style jsx>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes softGlow {
          0% {
            box-shadow: 0 0 0 rgba(209, 177, 90, 0);
          }
          50% {
            box-shadow: 0 0 24px rgba(209, 177, 90, 0.28);
          }
          100% {
            box-shadow: 0 0 0 rgba(209, 177, 90, 0);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(120%);
          }
        }
      `}</style>

      <main
        style={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url('/background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          padding: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "14px",
            animation: "fadeUp 0.8s ease-out",
          }}
        >
          <div
            style={{
              filter: "drop-shadow(0 0 16px rgba(209,177,90,0.16))",
            }}
          >
            <Image
              src="/logo.png"
              alt="GFXlab Logo"
              width={350}
              height={350}
              style={{
                objectFit: "contain",
                height: "auto",
              }}
              priority
            />
          </div>

          <button
            onClick={() => router.push("/editor")}
            style={{
              position: "relative",
              overflow: "hidden",
              width: "220px",
              height: "54px",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.18)",
              background:
                "linear-gradient(90deg, rgba(209,177,90,0.95) 0%, rgba(120,92,35,0.9) 45%, rgba(0,0,0,0.95) 100%)",
              color: "#ffffff",
              fontWeight: 900,
              fontSize: "18px",
              cursor: "pointer",
              animation: "softGlow 2.4s ease-in-out infinite",
              backdropFilter: "blur(4px)",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "40%",
                height: "100%",
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)",
                animation: "shimmer 2.2s linear infinite",
                pointerEvents: "none",
              }}
            />
            <span style={{ position: "relative", zIndex: 1 }}>
              Enter the Lab
            </span>
          </button>

         {!isNative && (
  <Link
    href="/custom"
    style={{
      width: "220px",
      height: "50px",
      borderRadius: "14px",
      border: "1px solid rgba(255,255,255,0.18)",
     background:
                "linear-gradient(90deg, rgba(209,177,90,0.95) 0%, rgba(120,92,35,0.9) 45%, rgba(0,0,0,0.95) 100%)",
              
      color: "#ffffff",
      fontWeight: 700,
      fontSize: "16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textDecoration: "none",
      backdropFilter: "blur(4px)",
    }}
  >
    CUSTOM FROM 
  </Link>
)}
        </div>
      </main>
    </>
  );
}