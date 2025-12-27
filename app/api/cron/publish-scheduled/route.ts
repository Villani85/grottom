import { NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/env";

export async function POST(req: Request) {
  const ok = requireCronSecret(req.headers);
  if (!ok.ok) return NextResponse.json({ error: ok.error }, { status: 401 });

  return NextResponse.json({ ok: true, published: 0, note: "stub (implement posts scheduling)" });
}
