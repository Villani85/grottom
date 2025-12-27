import "server-only";

import { isDemoMode } from "@/lib/env";
import { getAdminDb } from "@/lib/firebase-admin";
import { getDemoStore } from "@/lib/repositories/_memory";
import type { PointsTransaction } from "@/types";
import { UsersRepo } from "@/lib/repositories/users";

const COL = "points_transactions";

export class PointsRepo {
  static async add(tx: PointsTransaction): Promise<{ ok: true } | { ok: false; reason: "DUPLICATE" }> {
    if (isDemoMode()) {
      const store = getDemoStore();
      if (store.pointsTx[tx.txId]) return { ok: false, reason: "DUPLICATE" };
      store.pointsTx[tx.txId] = tx;
      const user = await UsersRepo.getById(tx.uid);
      if (user) await UsersRepo.upsert({ ...user, pointsTotal: user.pointsTotal + tx.delta });
      return { ok: true };
    }

    const db = getAdminDb();
    if (!db) throw new Error("Firebase Admin not configured");

    const ref = db.collection(COL).doc(tx.txId);
    const snap = await ref.get();
    if (snap.exists) return { ok: false, reason: "DUPLICATE" };
    await ref.set(tx);

    const user = await UsersRepo.getById(tx.uid);
    if (user) await UsersRepo.upsert({ ...user, pointsTotal: user.pointsTotal + tx.delta });
    return { ok: true };
  }
}
