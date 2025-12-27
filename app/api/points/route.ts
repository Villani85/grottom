import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth } from "@/lib/server-auth";
import { PointsRepo } from "@/lib/repositories/points";

export async function POST(req: Request) {
  const ctx = await requireAuth(req);
  if (ctx instanceof Response) return ctx;

  const body = await req.json().catch(() => ({}));
  const txId = String(body.txId ?? nanoid());
  const delta = Number(body.delta ?? 0);
  const reason = String(body.reason ?? "unknown");

  if (!Number.isFinite(delta) || Math.abs(delta) > 1000) {
    return NextResponse.json({ error: "INVALID_DELTA" }, { status: 400 });
  }

  const tx = { txId, uid: ctx.uid, delta, reason, createdAt: new Date().toISOString() };
  const res = await PointsRepo.add(tx);

  return NextResponse.json({ ok: true, txId, applied: res.ok });
}
