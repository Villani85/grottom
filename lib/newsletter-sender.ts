import { NewsletterRepository } from "@/lib/repositories/newsletter"
import { NewsletterSendsRepository } from "@/lib/repositories/newsletter-sends"
import { UsersRepository } from "@/lib/repositories/users"
import { Resend } from "resend"
import type { NewsletterCampaign } from "@/lib/types"

/**
 * Send newsletter campaign to all recipients
 * Uses Resend batch API for efficient sending
 */
export async function sendNewsletterCampaign(
  campaign: NewsletterCampaign,
  resend: Resend
): Promise<{ success: number; failed: number; failedEmails: string[] }> {
  console.log(`[Newsletter] 📧 Starting sendNewsletterCampaign for campaign ${campaign.id}`)
  console.log(`[Newsletter] Campaign details:`, {
    subject: campaign.subject,
    fromEmail: campaign.fromEmail,
    audience: campaign.audience.include,
  })

  // Get recipients based on audience
  let recipients: any[] = []

  console.log(`[Newsletter] Fetching recipients for audience:`, campaign.audience.include)

  if (campaign.audience.include.includes("all")) {
    recipients = await UsersRepository.getAll(1000)
    console.log(`[Newsletter] Found ${recipients.length} total users`)
  } else if (campaign.audience.include.includes("subscribers_active")) {
    recipients = await UsersRepository.getBySubscriptionStatus("active", 1000)
    console.log(`[Newsletter] Found ${recipients.length} active subscribers`)
  } else if (campaign.audience.include.includes("non_subscribers")) {
    const allUsers = await UsersRepository.getAll(1000)
    recipients = allUsers.filter((u) => u.subscriptionStatus === "none")
    console.log(`[Newsletter] Found ${recipients.length} non-subscribers`)
  }

  // Filter by marketing opt-in
  const beforeFilter = recipients.length
  recipients = recipients.filter(
    (u) => u.marketingOptIn || campaign.audience.include.includes("all")
  )
  console.log(`[Newsletter] After marketing opt-in filter: ${recipients.length} recipients (was ${beforeFilter})`)

  if (recipients.length === 0) {
    console.warn(`[Newsletter] ⚠️ No recipients found for campaign ${campaign.id}`)
    console.warn(`[Newsletter] ⚠️ Check audience settings and marketing opt-in`)
    return { success: 0, failed: 0, failedEmails: [] }
  }

  console.log(`[Newsletter] ✅ Ready to send to ${recipients.length} recipients`)

  // Send emails in batches using Resend batch API (more efficient)
  const BATCH_SIZE = 100 // Resend supports up to 100 emails per batch
  let successCount = 0
  let failCount = 0
  const failedEmails: string[] = []

  console.log(`[Newsletter] Starting to send campaign ${campaign.id} to ${recipients.length} recipients`)

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE)

    try {
      // Prepare batch emails array
      const batchEmails = batch.map((recipient) => ({
        from: `${campaign.fromName} <${campaign.fromEmail}>`,
        to: [recipient.email],
        subject: campaign.subject,
        html: campaign.html,
        replyTo: campaign.replyTo || campaign.fromEmail,
      }))

      // Send batch using Resend batch API
      const { data, error } = await resend.batch.send(batchEmails)

      if (error) {
        console.error(`[Newsletter] ❌ Batch send error:`, error)
        console.error(`[Newsletter] ❌ Error details:`, JSON.stringify(error, null, 2))
        
        // Check for domain verification error
        if (error.message?.includes("verify a domain") || error.name === "validation_error") {
          console.error(`[Newsletter] ⚠️ DOMAIN VERIFICATION REQUIRED`)
          console.error(`[Newsletter] ⚠️ Resend requires domain verification to send to external emails`)
          console.error(`[Newsletter] ⚠️ Go to https://resend.com/domains to verify your domain`)
          console.error(`[Newsletter] ⚠️ Then update the 'from' email to use your verified domain`)
        }
        // If batch fails, try sending individually as fallback
        for (const recipient of batch) {
          try {
            const emailRequest = {
              from: `${campaign.fromName} <${campaign.fromEmail}>`,
              to: recipient.email,
              subject: campaign.subject,
              html: campaign.html,
              replyTo: campaign.replyTo || campaign.fromEmail,
            }
            
            const result = await resend.emails.send(emailRequest)
            
            // Save send record
            await NewsletterSendsRepository.create({
              campaignId: campaign.id,
              toUserId: recipient.uid || recipient.id || "",
              toEmail: recipient.email,
              status: "sent",
              resendId: result.data?.id,
              resendResponse: result,
              requestDetails: {
                from: emailRequest.from,
                to: recipient.email,
                subject: emailRequest.subject,
                replyTo: emailRequest.replyTo,
                method: "individual",
              },
              sentAt: new Date(),
            })
            
            successCount++
          } catch (individualError: any) {
            console.error(`[Newsletter] ❌ Failed to send to ${recipient.email}:`, individualError)
            console.error(`[Newsletter] ❌ Error details:`, JSON.stringify(individualError, null, 2))
            
            // Check for domain verification error
            const errorMessage = individualError.message || JSON.stringify(individualError)
            if (errorMessage.includes("verify a domain") || individualError.name === "validation_error") {
              console.error(`[Newsletter] ⚠️ DOMAIN VERIFICATION REQUIRED for ${recipient.email}`)
            }
            
            // Save failed send record
            await NewsletterSendsRepository.create({
              campaignId: campaign.id,
              toUserId: recipient.uid || recipient.id || "",
              toEmail: recipient.email,
              status: "failed",
              error: errorMessage,
              resendResponse: individualError,
              requestDetails: {
                from: `${campaign.fromName} <${campaign.fromEmail}>`,
                to: recipient.email,
                subject: campaign.subject,
                replyTo: campaign.replyTo || campaign.fromEmail,
                method: "individual",
              },
            })
            
            failCount++
            failedEmails.push(recipient.email)
          }
        }
      } else {
        // Batch sent successfully - save records for each email
        if (data && Array.isArray(data)) {
          // Resend batch returns array of results
          for (let j = 0; j < batch.length; j++) {
            const recipient = batch[j]
            const result = data[j]
            
            await NewsletterSendsRepository.create({
              campaignId: campaign.id,
              toUserId: recipient.uid || recipient.id || "",
              toEmail: recipient.email,
              status: result?.error ? "failed" : "sent",
              resendId: result?.id,
              resendResponse: result,
              error: result?.error?.message || undefined,
              requestDetails: {
                from: `${campaign.fromName} <${campaign.fromEmail}>`,
                to: recipient.email,
                subject: campaign.subject,
                replyTo: campaign.replyTo || campaign.fromEmail,
                method: "batch",
              },
              sentAt: result?.id ? new Date() : undefined,
            })
            
            if (result?.error) {
              failCount++
              failedEmails.push(recipient.email)
            } else {
              successCount++
            }
          }
        } else {
          // Fallback: if data structure is different, mark all as sent
          for (const recipient of batch) {
            await NewsletterSendsRepository.create({
              campaignId: campaign.id,
              toUserId: recipient.uid || recipient.id || "",
              toEmail: recipient.email,
              status: "sent",
              resendResponse: data,
              requestDetails: {
                from: `${campaign.fromName} <${campaign.fromEmail}>`,
                to: recipient.email,
                subject: campaign.subject,
                replyTo: campaign.replyTo || campaign.fromEmail,
                method: "batch",
              },
              sentAt: new Date(),
            })
            successCount++
          }
        }
        
        console.log(`[Newsletter] Batch ${Math.floor(i / BATCH_SIZE) + 1} sent successfully: ${batch.length} emails`)
      }
        } catch (batchError: any) {
          console.error(`[Newsletter] ❌ Batch processing error:`, batchError)
          console.error(`[Newsletter] ❌ Error details:`, JSON.stringify(batchError, null, 2))
          
          // Check for domain verification error
          if (batchError.message?.includes("verify a domain") || batchError.name === "validation_error") {
            console.error(`[Newsletter] ⚠️ DOMAIN VERIFICATION REQUIRED`)
            console.error(`[Newsletter] ⚠️ Resend requires domain verification to send to external emails`)
            console.error(`[Newsletter] ⚠️ Go to https://resend.com/domains to verify your domain`)
          }
          
          // Fallback to individual sends if batch fails
      for (const recipient of batch) {
        try {
          const emailRequest = {
            from: `${campaign.fromName} <${campaign.fromEmail}>`,
            to: recipient.email,
            subject: campaign.subject,
            html: campaign.html,
            replyTo: campaign.replyTo || campaign.fromEmail,
          }
          
          const result = await resend.emails.send(emailRequest)
          
          // Save send record
          await NewsletterSendsRepository.create({
            campaignId: campaign.id,
            toUserId: recipient.uid || recipient.id || "",
            toEmail: recipient.email,
            status: "sent",
            resendId: result.data?.id,
            resendResponse: result,
            requestDetails: {
              from: emailRequest.from,
              to: recipient.email,
              subject: emailRequest.subject,
              replyTo: emailRequest.replyTo,
              method: "individual",
            },
            sentAt: new Date(),
          })
          
          successCount++
        } catch (individualError: any) {
          console.error(`[Newsletter] Failed to send to ${recipient.email}:`, individualError)
          
          // Save failed send record
          await NewsletterSendsRepository.create({
            campaignId: campaign.id,
            toUserId: recipient.uid || recipient.id || "",
            toEmail: recipient.email,
            status: "failed",
            error: individualError.message || JSON.stringify(individualError),
            requestDetails: {
              from: `${campaign.fromName} <${campaign.fromEmail}>`,
              to: recipient.email,
              subject: campaign.subject,
              replyTo: campaign.replyTo || campaign.fromEmail,
              method: "individual",
            },
          })
          
          failCount++
          failedEmails.push(recipient.email)
        }
      }
    }

    // Small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  // Update campaign status
  const finalStatus = failCount === 0 ? "sent" : failCount < recipients.length ? "sent" : "failed"
  await NewsletterRepository.update(campaign.id, {
    status: finalStatus,
  })

  console.log(`[Newsletter] Campaign ${campaign.id} completed:`, {
    total: recipients.length,
    success: successCount,
    failed: failCount,
    status: finalStatus,
    failedEmails: failedEmails.slice(0, 10), // Log first 10 failed emails
  })

  return { success: successCount, failed: failCount, failedEmails }
}

