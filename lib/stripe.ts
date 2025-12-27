import "server-only";

import Stripe from "stripe";
import { getServerEnv, isDemoMode } from "@/lib/env";

export function getStripeClient(): Stripe | null {
  const { STRIPE_SECRET_KEY } = getServerEnv();
  if (isDemoMode() || !STRIPE_SECRET_KEY) return null;
  return new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" as any });
}
