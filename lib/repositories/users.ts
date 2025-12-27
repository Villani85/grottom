import "server-only";

import { isDemoMode } from "@/lib/env";
import { getAdminDb } from "@/lib/firebase-admin";
import { getDemoStore } from "@/lib/repositories/_memory";
import type { AppUser } from "@/types";
import { demoUsers } from "@/lib/mock/data";

const COL = "users";

export class UsersRepo {
  static async ensureSeed(): Promise<void> {
    if (!isDemoMode()) return;
    const store = getDemoStore();
    if (Object.keys(store.users).length) return;
    for (const u of demoUsers) store.users[u.uid] = u;
  }

  static async getById(uid: string): Promise<AppUser | null> {
    await this.ensureSeed();
    if (isDemoMode()) {
      const store = getDemoStore();
      return (store.users[uid] as AppUser) ?? null;
    }
    const db = getAdminDb();
    if (!db) return null;
    const snap = await db.collection(COL).doc(uid).get();
    if (!snap.exists) return null;
    return snap.data() as AppUser;
  }

  static async upsert(user: AppUser): Promise<void> {
    await this.ensureSeed();
    if (isDemoMode()) {
      const store = getDemoStore();
      store.users[user.uid] = user;
      return;
    }
    const db = getAdminDb();
    if (!db) throw new Error("Firebase Admin not configured");
    await db.collection(COL).doc(user.uid).set(user, { merge: true });
  }

  static async list(limit = 100): Promise<AppUser[]> {
    await this.ensureSeed();
    if (isDemoMode()) {
      const store = getDemoStore();
      return Object.values(store.users).slice(0, limit) as AppUser[];
    }
    const db = getAdminDb();
    if (!db) return [];
    const qs = await db.collection(COL).limit(limit).get();
    return qs.docs.map(d => d.data() as AppUser);
  }

  static async listForNewsletterBatch(afterUid: string | null, limit = 50): Promise<AppUser[]> {
    const all = (await this.list(1000)).sort((a,b) => a.uid.localeCompare(b.uid));
    if (!afterUid) return all.slice(0, limit);
    const idx = all.findIndex(u => u.uid === afterUid);
    return all.slice(idx + 1, idx + 1 + limit);
  }

  static withMarketingFilter(users: AppUser[], marketing: boolean): AppUser[] {
    if (!marketing) return users;
    return users.filter(u => u.marketingOptIn === true);
  }

  static withAudience(users: AppUser[], include: ("subscribers_active"|"non_subscribers"|"all")[]): AppUser[] {
    if (include.includes("all")) return users;
    const wantSubs = include.includes("subscribers_active");
    const wantNon = include.includes("non_subscribers");
    return users.filter(u => {
      const isSub = u.subscriptionStatus === "active";
      if (wantSubs && isSub) return true;
      if (wantNon && !isSub) return true;
      return false;
    });
  }
}
