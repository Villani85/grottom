import "server-only";

import { isDemoMode } from "@/lib/env";
import { getAdminDb } from "@/lib/firebase-admin";
import { getDemoStore } from "@/lib/repositories/_memory";
import type { Comment } from "@/types";

const COL = "comments";

export class CommentsRepo {
  static async add(comment: Comment): Promise<void> {
    if (isDemoMode()) {
      const store = getDemoStore();
      store.comments[comment.id] = comment;
      return;
    }
    const db = getAdminDb();
    if (!db) throw new Error("Firebase Admin not configured");
    await db.collection(COL).doc(comment.id).set(comment);
  }

  static async listByLesson(lessonId: string, limit = 50): Promise<Comment[]> {
    if (isDemoMode()) {
      const store = getDemoStore();
      return Object.values(store.comments).filter((c: any) => c.lessonId === lessonId).slice(0, limit) as Comment[];
    }
    const db = getAdminDb();
    if (!db) return [];
    const qs = await db.collection(COL).where("lessonId", "==", lessonId).orderBy("createdAt", "desc").limit(limit).get();
    return qs.docs.map(d => d.data() as Comment);
  }
}
