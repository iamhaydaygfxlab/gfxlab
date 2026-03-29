"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { app, db } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();

  async function handleGoogleLogin() {
    try {
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email || "",
          name: user.displayName || "",
          photoURL: user.photoURL || "",
          pro: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(
          userRef,
          {
            email: user.email || "",
            name: user.displayName || "",
            photoURL: user.photoURL || "",
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      router.push("/editor");
    } catch (err) {
      console.error("Google sign-in failed:", err);
      alert("Google sign-in failed. Check Firebase authorized domains.");
    }
  }

  return (
    <>
      <style jsx>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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
            "linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.65)), url('/background.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 360,
            padding: 24,
            borderRadius: 20,
            background: "rgba(0,0,0,0.7)",
            border: "1px solid rgba(255,255,255,0.1)",
            display: "grid",
            gap: 16,
            textAlign: "center",
            animation: "fadeUp 0.6s ease-out",
          }}
        >
          <div>
            <Image
              src="/logo.png"
              alt="GFXLab"
              width={140}
              height={140}
              style={{ margin: "0 auto", height: "auto" }}
              priority
            />
          </div>

          <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>
            Sign in to GFXLab
          </div>

          <div style={{ fontSize: 14, opacity: 0.7, color: "#fff" }}>
            Save your projects and pick up where you left off
          </div>

          <button
            onClick={handleGoogleLogin}
            style={{
              height: 50,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.2)",
              background:
                "linear-gradient(90deg, rgba(209,177,90,0.95), rgba(0,0,0,0.95))",
              color: "#fff",
              fontWeight: 800,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Sign in with Google
          </button>

          <button
            onClick={() => router.push("/")}
            style={{
              marginTop: 4,
              fontSize: 14,
              color: "#bbb",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            ← Back to Home
          </button>
        </div>
      </main>
    </>
  );
}