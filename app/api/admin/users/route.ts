import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server-auth";
import { UsersRepo } from "@/lib/repositories/users";

export async function GET(req: Request) {
  const ctx = await requireAdmin(req);
  if (ctx instanceof Response) return ctx;

  const users = await UsersRepo.list(200);
  return NextResponse.json({ users });
}
