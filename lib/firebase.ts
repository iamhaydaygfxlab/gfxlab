import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim().replace(/^['"]|['"]$/g, ""),
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim().replace(/^['"]|['"]$/g, ""),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim().replace(/^['"]|['"]$/g, ""),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim().replace(/^['"]|['"]$/g, ""),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim().replace(/^['"]|['"]$/g, ""),
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim().replace(/^['"]|['"]$/g, ""),
};

if (
  !firebaseConfig.apiKey ||
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId ||
  !firebaseConfig.storageBucket ||
  !firebaseConfig.messagingSenderId ||
  !firebaseConfig.appId
) {
  throw new Error("Firebase public env vars are missing");
}

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);