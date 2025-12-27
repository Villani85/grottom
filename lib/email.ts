import "server-only";

import { Resend } from "resend";
import { getServerEnv, isDemoMode } from "@/lib/env";

export async function sendEmail(params: { from: string; to: string; subject: string; html: string; replyTo?: string }): Promise<{ ok: true } | { ok: false; error: string }> {
  const { RESEND_API_KEY } = getServerEnv();
  if (isDemoMode() || !RESEND_API_KEY) return { ok: true };

  try {
    const resend = new Resend(RESEND_API_KEY);
    await resend.emails.send({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      replyTo: params.replyTo,
    });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Resend error" };
  }
}
