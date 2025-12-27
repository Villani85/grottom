import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireAuth } from "@/lib/server-auth";
import { CommentsRepo } from "@/lib/repositories/comments";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lessonId = url.searchParams.get("lessonId") ?? "demo-lesson";
  const comments = await CommentsRepo.listByLesson(lessonId);
  return NextResponse.json({ comments });
}

export async function POST(req: Request) {
  const ctx = await requireAuth(req);
  if (ctx instanceof Response) return ctx;

  const isSub = ctx.user?.subscriptionStatus === "active";
  if (!isSub) return NextResponse.json({ error: "SUBSCRIPTION_REQUIRED" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const lessonId = String(body.lessonId ?? "demo-lesson");
  const text = String(body.body ?? "").trim();
  if (!text) return NextResponse.json({ error: "EMPTY" }, { status: 400 });

  const comment = { id: nanoid(), uid: ctx.uid, lessonId, body: text, createdAt: new Date().toISOString() };
  await CommentsRepo.add(comment);
  return NextResponse.json({ ok: true, comment });
}
