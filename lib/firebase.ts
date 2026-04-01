import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBAP5LIx5Z-Wi0RTP916EQdyCkiBHFaXm4",
  authDomain: "gfxlab-3a81c.firebaseapp.com",
  projectId: "gfxlab-3a81c",
  storageBucket: "gfxlab-3a81c.firebasestorage.app",
  messagingSenderId: "540569881746",
  appId: "1:540569881746:web:7261dea521f3100b672a4b",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);