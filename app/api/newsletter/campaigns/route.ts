import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { NewsletterRepo } from "@/lib/repositories/newsletter";

export async function GET(req: Request) {
  const ctx = await requireAdmin(req);
  if (ctx instanceof Response) return ctx;

  const campaigns = await NewsletterRepo.listCampaigns(50);
  return NextResponse.json({ campaigns });
}

export async function POST(req: Request) {
  const ctx = await requireAdmin(req);
  if (ctx instanceof Response) return ctx;

  const body = await req.json().catch(() => ({}));
  const campaign = await NewsletterRepo.upsertCampaign({
    createdBy: ctx.uid,
    subject: String(body.subject ?? ""),
    html: String(body.html ?? ""),
  });
  return NextResponse.json({ ok: true, campaign });
}

export async function PUT(req: Request) {
  const ctx = await requireAdmin(req);
  if (ctx instanceof Response) return ctx;

  const body = await req.json().catch(() => ({}));
  if (!body.id) return NextResponse.json({ error: "MISSING_ID" }, { status: 400 });

  const campaign = await NewsletterRepo.upsertCampaign({
    id: String(body.id),
    createdBy: ctx.uid,
    subject: body.subject,
    html: body.html,
    status: body.status,
    audience: body.audience,
    scheduledAt: body.scheduledAt ?? undefined,
  });

  return NextResponse.json({ ok: true, campaign });
}
