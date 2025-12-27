import { NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/env";
import { NewsletterRepo } from "@/lib/repositories/newsletter";
import { UsersRepo } from "@/lib/repositories/users";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  const ok = requireCronSecret(req.headers);
  if (!ok.ok) return NextResponse.json({ error: ok.error }, { status: 401 });

  const campaigns = await NewsletterRepo.listCampaigns(50);
  const due = campaigns.filter(c => c.status === "scheduled" && c.scheduledAt && new Date(c.scheduledAt).getTime() <= Date.now());

  let processed = 0;
  let sent = 0;
  let failed = 0;

  for (const camp of due) {
    await NewsletterRepo.setStatus(camp.id, "sending");

    const batch = await UsersRepo.listForNewsletterBatch(camp.lastUserIdProcessed ?? null, 50);
    const aud = UsersRepo.withAudience(batch, camp.audience.include as any);
    const aud2 = camp.audience.excludeBanned ? aud.filter(u => !u.banned) : aud;
    const finalUsers = UsersRepo.withMarketingFilter(aud2, camp.audience.marketing);

    for (const u of finalUsers) {
      processed += 1;

      const already = await NewsletterRepo.hasAlreadySent(camp.id, u.email);
      if (already) continue;

      await NewsletterRepo.createSendLog({
        campaignId: camp.id,
        toUserId: u.uid,
        toEmail: u.email,
        status: "pending",
      });

      const from = `${camp.fromName} <${camp.fromEmail}>`;
      const res = await sendEmail({ from, to: u.email, subject: camp.subject, html: camp.html, replyTo: camp.replyTo });

      if (res.ok) sent += 1;
      else failed += 1;
    }

    const last = batch.length ? batch[batch.length - 1].uid : camp.lastUserIdProcessed;

    await NewsletterRepo.upsertCampaign({
      id: camp.id,
      createdBy: camp.createdBy,
      lastUserIdProcessed: last ?? undefined,
      status: batch.length < 50 ? "sent" : "sending",
    });

    if (batch.length < 50) {
      await NewsletterRepo.setStatus(camp.id, "sent");
    }
  }

  return NextResponse.json({ ok: true, due: due.map(d => d.id), processed, sent, failed, time: new Date().toISOString() });
}
