"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { app, db } from "@/lib/firebase";

export default function LoginPageClient() {
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

      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid,
          email,
          name: result.user.displayName ?? "",
          photoURL: result.user.photoURL ?? "",
          provider: "google",
          pro: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(userRef, {
          updatedAt: serverTimestamp(),
        });
      }

      if (next === "checkout-pro") {
        router.push(
          `/api/stripe/checkout-pro?uid=${encodeURIComponent(uid)}&email=${encodeURIComponent(email)}`
        );
        return;
      }

      router.push("/editor");
    } catch (err: any) {
      console.error("GOOGLE SIGN IN ERROR:", err);
      setError(err?.message || "Sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border p-6 shadow">
        <h1 className="text-2xl font-bold mb-2">Sign in</h1>
        <p className="text-sm opacity-70 mb-6">
          Continue with Google to use GFXLab.
        </p>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full rounded-xl px-4 py-3 border font-medium"
        >
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>

        {error && (
          <p className="mt-4 text-sm text-red-500">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}