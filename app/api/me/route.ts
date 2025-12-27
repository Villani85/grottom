import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/server-auth";

export async function GET(req: Request) {
  const ctx = await getAuthFromRequest(req);
  if (!ctx) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({ user: ctx.user ?? null, isAdmin: ctx.isAdmin });
}
