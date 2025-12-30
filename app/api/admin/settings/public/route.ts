import { NextResponse } from "next/server"
import { AdminSettingsRepository } from "@/lib/repositories/admin-settings"

export async function GET() {
  try {
    const settings = await AdminSettingsRepository.get()
    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error fetching admin settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}
