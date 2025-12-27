import "server-only";

import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { hasFirebaseAdminEnv, getServerEnv } from "@/lib/env";

function normalizePrivateKey(key?: string): string | undefined {
  if (!key) return undefined;
  return key.replace(/\\n/g, "\n");
}

export function getAdminApp() {
  if (!hasFirebaseAdminEnv()) return null;

  const s = getServerEnv();
  const projectId = s.FIREBASE_ADMIN_PROJECT_ID!;
  const clientEmail = s.FIREBASE_ADMIN_CLIENT_EMAIL!;
  const privateKey = normalizePrivateKey(s.FIREBASE_ADMIN_PRIVATE_KEY)!;

  if (!getApps().length) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }
  return getApps()[0];
}

export function getAdminDb() {
  const app = getAdminApp();
  if (!app) return null;
  return getFirestore(app);
}

export function getAdminAuth() {
  const app = getAdminApp();
  if (!app) return null;
  return getAuth(app);
}

export function getAdminStorage() {
  const app = getAdminApp();
  if (!app) return null;
  return getStorage(app);
}
