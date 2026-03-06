import admin from "firebase-admin";

function getPrivateKey() {
  const k = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!k) return undefined;
  // fixes newline issues in env vars
  return k.replace(/\\n/g, "\n");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: getPrivateKey(),
    }),
  });
}

export const adminDb = admin.firestore();
export { admin };