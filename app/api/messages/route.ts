import { type NextRequest, NextResponse } from "next/server"
import { MessagesRepository } from "@/lib/repositories/messages"

// GET /api/messages?conversationId=xxx - Get messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversationId")

    if (!conversationId) {
      return NextResponse.json({ success: false, error: "conversationId is required" }, { status: 400 })
    }

    const messages = await MessagesRepository.getMessagesByConversationId(conversationId)

    return NextResponse.json({
      success: true,
      data: messages,
    })
  } catch (error) {
    console.error("[API] Error fetching messages:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch messages" }, { status: 500 })
  }
}

// POST /api/messages - Create new message
export async function POST(request: NextRequest) {
  try {
    console.log("[API/messages] 📥 POST /api/messages called")
    const body = await request.json()
    console.log("[API/messages] 📋 Request body:", JSON.stringify(body))
    
    const { conversationId, fromUserId, toUserId, content, mediaUrl, mediaType } = body

    if (!conversationId || !fromUserId || !toUserId || !content) {
      console.log("[API/messages] ❌ Missing required fields")
      return NextResponse.json(
        { success: false, error: "Missing required fields: conversationId, fromUserId, toUserId, content" },
        { status: 400 }
      )
    }

    // Verify conversation exists and user is participant
    console.log("[API/messages] 🔍 Looking for conversation:", conversationId)
    const conversation = await MessagesRepository.getConversationById(conversationId)
    console.log("[API/messages] 🔍 Conversation found:", conversation ? "yes" : "no")
    
    if (!conversation) {
      console.log("[API/messages] ❌ Conversation not found")
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 })
    }

    if (!conversation.participantIds.includes(fromUserId) || !conversation.participantIds.includes(toUserId)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    console.log("[API/messages] ✅ Creating message...")
    const message = await MessagesRepository.createMessage({
      conversationId,
      fromUserId,
      toUserId,
      content: content.trim(),
      mediaUrl,
      mediaType,
    })

    console.log("[API/messages] ✅ Message created successfully:", message.id)
    return NextResponse.json({ success: true, data: message }, { status: 201 })
  } catch (error: any) {
    console.error("[API/messages] ❌ Error creating message:", error)
    console.error("[API/messages] ❌ Error stack:", error.stack)
    return NextResponse.json({ success: false, error: "Failed to create message" }, { status: 500 })
  }
}

