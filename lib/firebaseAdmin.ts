import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

const adminApp =
  getApps()[0] ||
  initializeApp({
    credential: cert(firebaseAdminConfig),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);