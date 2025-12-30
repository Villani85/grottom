import { type NextRequest, NextResponse } from "next/server"
import { NewsletterRepository } from "@/lib/repositories/newsletter"
import { isDemoMode, resendConfig, hasResendConfig } from "@/lib/env"
import { Resend } from "resend"
import { sendNewsletterCampaign } from "@/lib/newsletter-sender"

// Get all newsletter campaigns (admin only)
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin auth check here
    const campaigns = await NewsletterRepository.getAll()
    return NextResponse.json(campaigns)
  } catch (error: any) {
    console.error("[API Admin Newsletter] Error fetching campaigns:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

// Create new newsletter campaign (admin only)
export async function POST(request: NextRequest) {
  if (isDemoMode) {
    return NextResponse.json({ error: "Demo mode - Newsletter creation disabled" }, { status: 403 })
  }

  try {
    // TODO: Add admin auth check here
    const body = await request.json()

    const campaignId = await NewsletterRepository.create(body)

    if (!campaignId) {
      return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 })
    }

    // If status is 'sending', trigger immediate send
    if (body.status === "sending") {
      console.log(`[Newsletter] Campaign ${campaignId} marked as sending - checking configuration...`)
      
      if (!hasResendConfig) {
        console.warn(`[Newsletter] ⚠️ Campaign ${campaignId} marked as sending but Resend not configured`)
        console.warn(`[Newsletter] ⚠️ RESEND_API_KEY missing or invalid`)
      } else {
        console.log(`[Newsletter] ✅ Resend configured, fetching campaign...`)
        
        // Get the created campaign and send it
        const campaign = await NewsletterRepository.getById(campaignId)
        
        if (!campaign) {
          console.error(`[Newsletter] ❌ Campaign ${campaignId} not found after creation!`)
        } else {
          console.log(`[Newsletter] ✅ Campaign found:`, {
            id: campaign.id,
            subject: campaign.subject,
            status: campaign.status,
            audience: campaign.audience.include,
          })
          
          const resend = new Resend(resendConfig.apiKey)
          console.log(`[Newsletter] 🚀 Starting to send campaign ${campaignId}...`)
          
          // Send in background (don't wait for completion)
          sendNewsletterCampaign(campaign, resend)
            .then((result) => {
              console.log(`[Newsletter] ✅ Campaign ${campaignId} sending completed:`, result)
            })
            .catch((error) => {
              console.error(`[Newsletter] ❌ Error sending campaign ${campaignId}:`, error)
              console.error(`[Newsletter] ❌ Error stack:`, error.stack)
            })
        }
      }
    } else if (body.status === "scheduled") {
      console.log(`[Newsletter] Campaign ${campaignId} scheduled for sending`)
    }

    return NextResponse.json({ id: campaignId })
  } catch (error: any) {
    console.error("[API Admin Newsletter] Error creating campaign:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
