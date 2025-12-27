import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { getServerEnv, isDemoMode } from "@/lib/env";

export async function POST(req: Request) {
  const stripe = getStripeClient();
  const plan = req.headers.get("x-plan") === "yearly" ? "yearly" : "monthly";

  if (isDemoMode() || !stripe) {
    return NextResponse.json({ ok: true, demo: true, plan, url: null });
  }

  const env = getServerEnv();
  const baseUrl = env.APP_BASE_URL ?? "http://localhost:3000";

  const priceId = plan === "yearly" ? env.STRIPE_PRICE_YEARLY : env.STRIPE_PRICE_MONTHLY;
  if (!priceId) return NextResponse.json({ error: "Missing STRIPE_PRICE_MONTHLY / STRIPE_PRICE_YEARLY" }, { status: 500 });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard?checkout=success`,
    cancel_url: `${baseUrl}/pricing?checkout=cancel`,
  });

  return NextResponse.json({ ok: true, url: session.url });
}
