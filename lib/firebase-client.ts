"use client"

import type { FirebaseApp } from "firebase/app"
import type { Auth } from "firebase/auth"
import type { Firestore } from "firebase/firestore"
import type { FirebaseStorage } from "firebase/storage"

// Manual config validation
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
}

// Strict validation - all fields must have real values
const isValidConfig =
  firebaseConfig.apiKey.length > 10 &&
  firebaseConfig.authDomain.length > 5 &&
  firebaseConfig.projectId.length > 3 &&
  firebaseConfig.storageBucket.length > 3 &&
  firebaseConfig.appId.length > 10

// Debug logging (only in development)
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("[Firebase] Config validation:", {
    isValid: isValidConfig,
    hasApiKey: firebaseConfig.apiKey.length > 10,
    hasAuthDomain: firebaseConfig.authDomain.length > 5,
    hasProjectId: firebaseConfig.projectId.length > 3,
    hasStorageBucket: firebaseConfig.storageBucket.length > 3,
    hasAppId: firebaseConfig.appId.length > 10,
    projectId: firebaseConfig.projectId,
  })
}

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let storage: FirebaseStorage | null = null
let initialized = false
let initializing = false
let initPromise: Promise<void> | null = null

async function initializeFirebase() {
  // Prevent multiple initialization attempts - wait for existing one
  if (initialized) {
    console.log("[Firebase] Already initialized, skipping")
    return
  }
  
  if (initializing && initPromise) {
    console.log("[Firebase] Initialization in progress, waiting...")
    return initPromise
  }
  
  initializing = true
  initPromise = (async () => {
    // Don't initialize on server
    if (typeof window === "undefined") {
      console.log("[Firebase] Server-side - skipping initialization")
      initializing = false
      return
    }

    // Must have valid config
    if (!isValidConfig) {
      console.warn("[Firebase] No valid configuration - running in demo mode")
      console.warn("[Firebase] Config values:", {
        apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : "missing",
        authDomain: firebaseConfig.authDomain || "missing",
        projectId: firebaseConfig.projectId || "missing",
        storageBucket: firebaseConfig.storageBucket || "missing",
        appId: firebaseConfig.appId ? `${firebaseConfig.appId.substring(0, 10)}...` : "missing",
      })
      initializing = false
      return
    }

    try {
      console.log("[Firebase] Starting initialization...")
      // Dynamic imports to avoid loading Firebase if not needed
      const { initializeApp, getApps } = await import("firebase/app")
      const { getAuth } = await import("firebase/auth")
      const { getFirestore } = await import("firebase/firestore")
      const { getStorage } = await import("firebase/storage")

      // Initialize app
      if (!getApps().length) {
        app = initializeApp(firebaseConfig)
        console.log("[Firebase] App initialized successfully")
      } else {
        app = getApps()[0]
        console.log("[Firebase] Using existing app instance")
      }

      // Initialize services only if app was created
      if (app) {
        auth = getAuth(app)
        db = getFirestore(app)
        storage = getStorage(app)
        initialized = true
        console.log("[Firebase] All services initialized successfully")
        console.log("[Firebase] Auth instance:", auth ? "ready" : "failed")
      } else {
        console.error("[Firebase] App initialization returned null")
      }
    } catch (error) {
      console.error("[Firebase] Initialization failed:", error)
      initialized = false // Allow retry
      app = null
      auth = null
      db = null
      storage = null
    } finally {
      initializing = false
      initPromise = null
    }
  })()
  
  return initPromise
}

// Auto-initialize on client side if config is valid
if (typeof window !== "undefined" && isValidConfig) {
  // Initialize on next tick to avoid blocking initial render
  setTimeout(() => {
    initializeFirebase().catch((error) => {
      console.error("[Firebase] Auto-initialization failed:", error)
    })
  }, 0)
}

// Export getters
export function getFirebaseApp(): FirebaseApp | null {
  return app
}

export function getFirebaseAuth(): Auth | null {
  if (typeof window === "undefined") {
    console.log("[Firebase] getFirebaseAuth called on server - returning null")
    return null
  }
  if (!auth) {
    console.warn("[Firebase] ⚠️ Auth not initialized")
    return null
  }
  if (process.env.NODE_ENV === "development") {
    console.log("[Firebase] ✅ Auth instance available:", {
      hasAuth: !!auth,
      currentUser: auth.currentUser?.uid || "null",
      email: auth.currentUser?.email || "null",
    })
  }
  return auth
}

export function getFirebaseFirestore(): Firestore | null {
  if (process.env.NODE_ENV === "development") {
    console.log("[Firebase] 🔍 getFirebaseFirestore called:", {
      dbExists: !!db,
      initialized: initialized,
      appName: db?.app?.name || "null",
      projectId: db?.app?.options?.projectId || "null",
    })
  }
  return db
}

export function getFirebaseStorage(): FirebaseStorage | null {
  return storage
}

// Export with shorter names
export {
  getFirebaseApp as getApp,
  getFirebaseAuth as getAuth,
  getFirebaseFirestore as getFirestore,
  getFirebaseStorage as getStorage,
}

// Export config status
export const hasFirebaseClientConfig = isValidConfig

// Export init function for manual initialization if needed
export { initializeFirebase }

// Export the instances for backward compatibility
export { auth, db, storage }
export type { User } from "firebase/auth"
