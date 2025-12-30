import { type NextRequest, NextResponse } from "next/server"
import { NewsletterRepository } from "@/lib/repositories/newsletter"
import { cronConfig, resendConfig, hasResendConfig, isDemoMode } from "@/lib/env"
import { Resend } from "resend"
import { sendNewsletterCampaign } from "@/lib/newsletter-sender"

const resend = hasResendConfig ? new Resend(resendConfig.apiKey) : null

// This endpoint should be called by Vercel Cron every 5-10 minutes
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${cronConfig.secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (isDemoMode || !hasResendConfig || !resend) {
    return NextResponse.json({ error: "Newsletter sending not configured" }, { status: 503 })
  }

  try {
    // Get all scheduled campaigns
    const campaigns = await NewsletterRepository.getAll()
    const scheduledCampaigns = campaigns.filter((c) => c.status === "scheduled")

    for (const campaign of scheduledCampaigns) {
      // Check if it's time to send
      if (campaign.scheduledAt && campaign.scheduledAt > new Date()) {
        continue // Not yet time
      }

      console.log(`[Newsletter Cron] Processing campaign ${campaign.id}`)

      // Update status to sending
      await NewsletterRepository.update(campaign.id, { status: "sending" })

      // Send campaign using shared function
      if (!resend) {
        throw new Error("Resend not configured")
      }

      await sendNewsletterCampaign(campaign, resend)
    }

    return NextResponse.json({ processed: scheduledCampaigns.length })
  } catch (error: any) {
    console.error("[Newsletter Cron] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
