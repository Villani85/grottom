import "server-only";

import { nanoid } from "nanoid";
import { isDemoMode } from "@/lib/env";
import { getAdminDb } from "@/lib/firebase-admin";
import { getDemoStore } from "@/lib/repositories/_memory";
import type { NewsletterCampaign, NewsletterSendLog, NewsletterStatus } from "@/types";
import { demoNewsletterDraft } from "@/lib/mock/data";

const CAMP_COL = "newsletter_campaigns";
const SEND_COL = "newsletter_sends";

function nowISO() { return new Date().toISOString(); }

export class NewsletterRepo {
  static async ensureSeed(): Promise<void> {
    if (!isDemoMode()) return;
    const store = getDemoStore();
    if (Object.keys(store.newsletterCampaigns).length) return;
    store.newsletterCampaigns[demoNewsletterDraft.id] = demoNewsletterDraft;
  }

  static async listCampaigns(limit = 50): Promise<NewsletterCampaign[]> {
    await this.ensureSeed();
    if (isDemoMode()) {
      const store = getDemoStore();
      return Object.values(store.newsletterCampaigns).slice(0, limit) as NewsletterCampaign[];
    }
    const db = getAdminDb();
    if (!db) return [];
    const qs = await db.collection(CAMP_COL).orderBy("createdAt", "desc").limit(limit).get();
    return qs.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  }

  static async getCampaign(id: string): Promise<NewsletterCampaign | null> {
    await this.ensureSeed();
    if (isDemoMode()) {
      const store = getDemoStore();
      return (store.newsletterCampaigns[id] as NewsletterCampaign) ?? null;
    }
    const db = getAdminDb();
    if (!db) return null;
    const snap = await db.collection(CAMP_COL).doc(id).get();
    if (!snap.exists) return null;
    return { id: snap.id, ...(snap.data() as any) } as NewsletterCampaign;
  }

  static async upsertCampaign(input: Partial<NewsletterCampaign> & { id?: string; createdBy: string }): Promise<NewsletterCampaign> {
    await this.ensureSeed();
    const id = input.id ?? nanoid();
    const existing = await this.getCampaign(id);
    const createdAt = existing?.createdAt ?? nowISO();

    const campaign: NewsletterCampaign = {
      id,
      status: (input.status as any) ?? existing?.status ?? "draft",
      subject: input.subject ?? existing?.subject ?? "",
      fromName: input.fromName ?? existing?.fromName ?? "Your Brand",
      fromEmail: input.fromEmail ?? existing?.fromEmail ?? "no-reply@example.com",
      replyTo: input.replyTo ?? existing?.replyTo,
      html: input.html ?? existing?.html ?? "",
      audience: (input.audience as any) ?? existing?.audience ?? { include: ["all"], excludeBanned: true, marketing: false },
      scheduledAt: input.scheduledAt ?? existing?.scheduledAt,
      lastUserIdProcessed: input.lastUserIdProcessed ?? existing?.lastUserIdProcessed,
      createdBy: input.createdBy,
      createdAt,
      updatedAt: nowISO(),
    };

    if (isDemoMode()) {
      const store = getDemoStore();
      store.newsletterCampaigns[id] = campaign;
      return campaign;
    }

    const db = getAdminDb();
    if (!db) throw new Error("Firebase Admin not configured");
    const { id: _, ...payload } = campaign as any;
    await db.collection(CAMP_COL).doc(id).set(payload, { merge: true });
    return campaign;
  }

  static async setStatus(id: string, status: NewsletterStatus): Promise<void> {
    const camp = await this.getCampaign(id);
    if (!camp) return;
    await this.upsertCampaign({ id, status, createdBy: camp.createdBy });
  }

  static async createSendLog(log: Omit<NewsletterSendLog, "id" | "createdAt" | "updatedAt">): Promise<NewsletterSendLog> {
    const id = nanoid();
    const record: NewsletterSendLog = { id, ...log, createdAt: nowISO(), updatedAt: nowISO() };

    if (isDemoMode()) {
      const store = getDemoStore();
      store.newsletterSends[id] = record;
      return record;
    }

    const db = getAdminDb();
    if (!db) throw new Error("Firebase Admin not configured");
    const { id: _, ...payload } = record as any;
    await db.collection(SEND_COL).doc(id).set(payload);
    return record;
  }

  static async hasAlreadySent(campaignId: string, toEmail: string): Promise<boolean> {
    if (isDemoMode()) {
      const store = getDemoStore();
      return Object.values(store.newsletterSends).some((s: any) => s.campaignId === campaignId && s.toEmail === toEmail && s.status === "sent");
    }
    const db = getAdminDb();
    if (!db) return false;
    const qs = await db.collection(SEND_COL).where("campaignId", "==", campaignId).where("toEmail", "==", toEmail).where("status", "==", "sent").limit(1).get();
    return !qs.empty;
  }
}
