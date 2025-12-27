import { NextResponse } from "next/server";
import { isDemoMode, hasFirebaseAdminEnv } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    ok: true,
    demo: isDemoMode(),
    firebaseAdminConfigured: hasFirebaseAdminEnv(),
    time: new Date().toISOString(),
  });
}
