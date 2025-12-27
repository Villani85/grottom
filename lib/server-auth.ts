import "server-only";

import { isDemoMode } from "@/lib/env";
import { getAdminAuth } from "@/lib/firebase-admin";
import { UsersRepo } from "@/lib/repositories/users";
import type { AppUser } from "@/types";

export type AuthContext = {
  uid: string;
  email: string;
  isAdmin: boolean;
  user?: AppUser;
};

export async function getAuthFromRequest(req: Request): Promise<AuthContext | null> {
  if (isDemoMode()) {
    const demoUid = req.headers.get("x-demo-uid") || "demo_member";
    const demoEmail = req.headers.get("x-demo-email") || "member@example.com";
    const user = await UsersRepo.getById(demoUid);
    return { uid: demoUid, email: demoEmail, isAdmin: Boolean(user?.isAdmin), user: user ?? undefined };
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);

  const adminAuth = getAdminAuth();
  if (!adminAuth) return null;

  const decoded = await adminAuth.verifyIdToken(token);
  const user = await UsersRepo.getById(decoded.uid);
  return { uid: decoded.uid, email: decoded.email ?? "", isAdmin: Boolean(user?.isAdmin), user: user ?? undefined };
}

export async function requireAuth(req: Request): Promise<AuthContext | Response> {
  const ctx = await getAuthFromRequest(req);
  if (!ctx) return new Response(JSON.stringify({ error: "UNAUTHENTICATED" }), { status: 401 });
  return ctx;
}

export async function requireAdmin(req: Request): Promise<AuthContext | Response> {
  const ctx = await requireAuth(req);
  if (ctx instanceof Response) return ctx;
  if (!ctx.isAdmin) return new Response(JSON.stringify({ error: "FORBIDDEN" }), { status: 403 });
  return ctx;
}
