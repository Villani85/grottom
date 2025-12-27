import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { getServerEnv, isDemoMode } from "@/lib/env";

export async function POST(req: Request) {
  if (isDemoMode()) return NextResponse.json({ ok: true, demo: true });

  const stripe = getStripeClient();
  if (!stripe) return NextResponse.json({ error: "STRIPE_NOT_CONFIGURED" }, { status: 500 });

  const env = getServerEnv();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  if (!env.STRIPE_WEBHOOK_SECRET) return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET missing" }, { status: 500 });

  const rawBody = await req.text();

  try {
    const event = stripe.webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
    return NextResponse.json({ ok: true, type: event.type });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Webhook error" }, { status: 400 });
  }
}
