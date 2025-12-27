"use client";

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getPublicEnv } from "@/lib/env";

export function hasFirebaseClientConfig(): boolean {
  const p = getPublicEnv();
  return Boolean(p.NEXT_PUBLIC_FIREBASE_API_KEY && p.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
}

export function getFirebaseClientApp() {
  const p = getPublicEnv();
  if (!hasFirebaseClientConfig()) return null;

  const config = {
    apiKey: p.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: p.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: p.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: p.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  };

  if (!getApps().length) initializeApp(config);
  return getApps()[0];
}

export function getFirebaseAuth() {
  const app = getFirebaseClientApp();
  if (!app) return null;
  return getAuth(app);
}

export function getFirebaseDb() {
  const app = getFirebaseClientApp();
  if (!app) return null;
  return getFirestore(app);
}

export function getFirebaseStorage() {
  const app = getFirebaseClientApp();
  if (!app) return null;
  return getStorage(app);
}
