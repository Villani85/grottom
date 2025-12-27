import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/server-auth";
import { isDemoMode } from "@/lib/env";
import { getAdminStorage } from "@/lib/firebase-admin";

export async function GET(req: Request) {
  const ctx = await requireAuth(req);
  if (ctx instanceof Response) return ctx;

  const url = new URL(req.url);
  const path = url.searchParams.get("path") ?? "chat/demo.png";

  if (isDemoMode()) {
    return NextResponse.json({ ok: true, url: `https://example.com/mock-chat-url?path=${encodeURIComponent(path)}`, demo: true });
  }

  const storage = getAdminStorage();
  if (!storage) return NextResponse.json({ error: "STORAGE_NOT_CONFIGURED" }, { status: 500 });

  const bucket = storage.bucket();
  const file = bucket.file(path);

  try {
    const [signed] = await file.getSignedUrl({ action: "read", expires: Date.now() + 1000 * 60 * 10 });
    return NextResponse.json({ ok: true, url: signed, expiresInSeconds: 600 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "SIGNED_URL_ERROR" }, { status: 500 });
  }
}
