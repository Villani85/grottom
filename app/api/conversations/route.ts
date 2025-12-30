import { type NextRequest, NextResponse } from "next/server"
import { MessagesRepository } from "@/lib/repositories/messages"

// GET /api/conversations?userId=xxx - Get conversations for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 })
    }

    const conversations = await MessagesRepository.getConversationsByUserId(userId)

    return NextResponse.json({
      success: true,
      data: conversations,
    })
  } catch (error) {
    console.error("[API] Error fetching conversations:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch conversations" }, { status: 500 })
  }
}

// POST /api/conversations - Create or get conversation between two users
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[API/conversations] 📥 Received request body:", JSON.stringify(body))
    
    // Support both formats: { userId1, userId2 } or { participantIds: [id1, id2] }
    let userId1: string | undefined
    let userId2: string | undefined
    
    if (body.userId1 && body.userId2) {
      userId1 = body.userId1
      userId2 = body.userId2
    } else if (body.participantIds && Array.isArray(body.participantIds) && body.participantIds.length === 2) {
      userId1 = body.participantIds[0]
      userId2 = body.participantIds[1]
    }

    console.log("[API/conversations] 🔍 Parsed userId1:", userId1, "userId2:", userId2)

    if (!userId1 || !userId2) {
      console.error("[API/conversations] ❌ Missing required fields. Body:", body)
      return NextResponse.json({ success: false, error: "userId1 and userId2 (or participantIds array) are required" }, { status: 400 })
    }

    if (userId1 === userId2) {
      return NextResponse.json({ success: false, error: "Cannot create conversation with yourself" }, { status: 400 })
    }

    const conversation = await MessagesRepository.getOrCreateConversation(userId1, userId2)

    return NextResponse.json({ success: true, data: conversation }, { status: 201 })
  } catch (error) {
    console.error("[API] Error creating conversation:", error)
    return NextResponse.json({ success: false, error: "Failed to create conversation" }, { status: 500 })
  }
}

