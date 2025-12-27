import "server-only";

import { isDemoMode } from "@/lib/env";
import { getAdminDb } from "@/lib/firebase-admin";
import { getDemoStore } from "@/lib/repositories/_memory";
import type { AdminSettings } from "@/types";
import { defaultAdminSettings } from "@/lib/mock/data";

const DOC_PATH = { col: "admin_settings", doc: "global" };

export class AdminSettingsRepo {
  static async get(): Promise<AdminSettings> {
    if (isDemoMode()) {
      const store = getDemoStore();
      if (!store.adminSettings) store.adminSettings = defaultAdminSettings;
      return store.adminSettings as AdminSettings;
    }
    const db = getAdminDb();
    if (!db) return defaultAdminSettings;
    const snap = await db.collection(DOC_PATH.col).doc(DOC_PATH.doc).get();
    if (!snap.exists) return defaultAdminSettings;
    return snap.data() as AdminSettings;
  }

  static async set(settings: AdminSettings): Promise<void> {
    if (isDemoMode()) {
      const store = getDemoStore();
      store.adminSettings = settings;
      return;
    }
    const db = getAdminDb();
    if (!db) throw new Error("Firebase Admin not configured");
    await db.collection(DOC_PATH.col).doc(DOC_PATH.doc).set(settings, { merge: true });
  }
}
