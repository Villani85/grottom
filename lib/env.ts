import { z } from "zod";

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_DEMO_MODE: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
});

const ServerEnvSchema = z.object({
  FIREBASE_ADMIN_PROJECT_ID: z.string().optional(),
  FIREBASE_ADMIN_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_ADMIN_PRIVATE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_MONTHLY: z.string().optional(),
  STRIPE_PRICE_YEARLY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  APP_BASE_URL: z.string().optional(),
});

export function getPublicEnv() {
  return PublicEnvSchema.parse({
    NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export function getServerEnv() {
  return ServerEnvSchema.parse({
    FIREBASE_ADMIN_PROJECT_ID: process.env.FIREBASE_ADMIN_PROJECT_ID,
    FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_MONTHLY: process.env.STRIPE_PRICE_MONTHLY,
    STRIPE_PRICE_YEARLY: process.env.STRIPE_PRICE_YEARLY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
    APP_BASE_URL: process.env.APP_BASE_URL,
  });
}

export function hasFirebaseAdminEnv(): boolean {
  const s = getServerEnv();
  return Boolean(s.FIREBASE_ADMIN_PROJECT_ID && s.FIREBASE_ADMIN_CLIENT_EMAIL && s.FIREBASE_ADMIN_PRIVATE_KEY);
}

export function isDemoMode(): boolean {
  const p = getPublicEnv();
  if (p.NEXT_PUBLIC_DEMO_MODE?.toLowerCase() === "true") return true;
  return !hasFirebaseAdminEnv();
}

export function requireCronSecret(headers: Headers): { ok: true } | { ok: false; error: string } {
  const { CRON_SECRET } = getServerEnv();
  if (!CRON_SECRET) return { ok: false, error: "CRON_SECRET missing (server env)" };
  const got = headers.get("x-cron-secret");
  if (!got) return { ok: false, error: "Missing x-cron-secret header" };
  if (got !== CRON_SECRET) return { ok: false, error: "Invalid cron secret" };
  return { ok: true };
}
