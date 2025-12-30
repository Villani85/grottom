import { type NextRequest, NextResponse } from "next/server"
import { UsersRepository } from "@/lib/repositories/users"

// Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin auth check here
    const users = await UsersRepository.getAll(500)
    return NextResponse.json(users)
  } catch (error: any) {
    console.error("[API Admin] Error fetching users:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
