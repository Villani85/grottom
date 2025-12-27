import { NextResponse } from "next/server";
import { AdminSettingsRepo } from "@/lib/repositories/admin-settings";
import { requireAdmin } from "@/lib/server-auth";

export async function GET() {
  const settings = await AdminSettingsRepo.get();
  return NextResponse.json({ settings });
}

export async function PUT(req: Request) {
  const ctx = await requireAdmin(req);
  if (ctx instanceof Response) return ctx;

  const body = await req.json().catch(() => ({}));
  const settings = body.settings;
  if (!settings) return NextResponse.json({ error: "MISSING_SETTINGS" }, { status: 400 });

  await AdminSettingsRepo.set(settings);
  return NextResponse.json({ ok: true, settings });
}
