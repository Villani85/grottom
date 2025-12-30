// Environment configuration with demo mode detection
// Demo mode is active ONLY if explicitly set OR if Firebase Client config is missing
// Firebase Admin config is NOT required for client-side authentication
export const isDemoMode =
  process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  !process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
  !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
}

export const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "",
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || "",
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n") || "",
}

export const resendConfig = {
  apiKey: process.env.RESEND_API_KEY || "",
  fromEmail: process.env.EMAIL_FROM || "onboarding@resend.dev",
}

export const cronConfig = {
  secret: process.env.CRON_SECRET || "",
}

// Strict validation - config must have real values, not empty strings
export const hasFirebaseClientConfig =
  !!firebaseConfig.apiKey &&
  !!firebaseConfig.authDomain &&
  !!firebaseConfig.projectId &&
  firebaseConfig.apiKey.length > 10 &&
  firebaseConfig.authDomain.length > 5 &&
  firebaseConfig.projectId.length > 3

export const hasFirebaseAdminConfig = !!(
  firebaseAdminConfig.projectId &&
  firebaseAdminConfig.clientEmail &&
  firebaseAdminConfig.privateKey &&
  firebaseAdminConfig.projectId.length > 3
)

export const hasResendConfig = !!resendConfig.apiKey && resendConfig.apiKey.length > 10
