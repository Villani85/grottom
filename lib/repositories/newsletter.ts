import { mockNewsletterCampaigns } from "@/lib/mock/data"
import { isDemoMode } from "@/lib/env"
import type { NewsletterCampaign } from "@/lib/types"

export class NewsletterRepository {
  static async getAll(limit = 50): Promise<NewsletterCampaign[]> {
    if (isDemoMode) {
      return mockNewsletterCampaigns.slice(0, limit)
    }

    // In production, fetch from Firestore using Admin SDK
    try {
      const { getAdminApp } = await import("@/lib/firebase-admin")
      const app = await getAdminApp()
      
      if (!app) {
        console.warn("[NewsletterRepository] Firebase Admin not initialized, returning empty array")
        return []
      }

      const { getFirestore } = await import("firebase-admin/firestore")
      const db = getFirestore(app)
      
      const campaignsSnapshot = await db
        .collection("newsletter_campaigns")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get()

      return campaignsSnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          subject: data.subject || "",
          fromName: data.fromName || "",
          fromEmail: data.fromEmail || "",
          replyTo: data.replyTo || "",
          html: data.html || "",
          status: data.status || "draft",
          audience: data.audience || { include: [], excludeBanned: true },
          scheduledAt: data.scheduledAt?.toDate?.() || (data.scheduledAt ? new Date(data.scheduledAt) : undefined),
          lastUserIdProcessed: data.lastUserIdProcessed || undefined,
          createdBy: data.createdBy || "",
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt) || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt) || new Date(),
        } as NewsletterCampaign
      })
    } catch (error) {
      console.error("[NewsletterRepository] Error fetching campaigns from Firestore:", error)
      return []
    }
  }

  static async getById(id: string): Promise<NewsletterCampaign | null> {
    if (isDemoMode) {
      return mockNewsletterCampaigns.find((c) => c.id === id) || null
    }

    // In production, fetch from Firestore using Admin SDK
    try {
      const { getAdminApp } = await import("@/lib/firebase-admin")
      const app = await getAdminApp()
      
      if (!app) {
        console.warn("[NewsletterRepository] Firebase Admin not initialized")
        return null
      }

      const { getFirestore } = await import("firebase-admin/firestore")
      const db = getFirestore(app)
      
      const campaignDoc = await db.collection("newsletter_campaigns").doc(id).get()

      if (!campaignDoc.exists) {
        console.warn(`[NewsletterRepository] Campaign ${id} not found in Firestore`)
        return null
      }

      const data = campaignDoc.data()
      return {
        id: campaignDoc.id,
        subject: data?.subject || "",
        fromName: data?.fromName || "",
        fromEmail: data?.fromEmail || "",
        replyTo: data?.replyTo || "",
        html: data?.html || "",
        status: data?.status || "draft",
        audience: data?.audience || { include: [], excludeBanned: true },
        scheduledAt: data?.scheduledAt?.toDate?.() || (data?.scheduledAt ? new Date(data.scheduledAt) : undefined),
        lastUserIdProcessed: data?.lastUserIdProcessed || undefined,
        createdBy: data?.createdBy || "",
        createdAt: data?.createdAt?.toDate?.() || new Date(data?.createdAt) || new Date(),
        updatedAt: data?.updatedAt?.toDate?.() || new Date(data?.updatedAt) || new Date(),
      } as NewsletterCampaign
    } catch (error) {
      console.error("[NewsletterRepository] Error fetching campaign from Firestore:", error)
      return null
    }
  }

  static async create(campaign: Omit<NewsletterCampaign, "id" | "createdAt" | "updatedAt">): Promise<string | null> {
    if (isDemoMode) {
      console.log("[NewsletterRepository] Demo mode - create logged:", campaign)
      return "demo-campaign-" + Date.now()
    }

    // In production, save to Firestore using Admin SDK
    try {
      const { getAdminApp } = await import("@/lib/firebase-admin")
      const app = await getAdminApp()
      
      if (!app) {
        console.warn("[NewsletterRepository] Firebase Admin not initialized, cannot create campaign")
        return null
      }

      const { getFirestore } = await import("firebase-admin/firestore")
      const db = getFirestore(app)
      
      const campaignData = {
        subject: campaign.subject,
        fromName: campaign.fromName,
        fromEmail: campaign.fromEmail,
        replyTo: campaign.replyTo,
        html: campaign.html,
        status: campaign.status,
        audience: campaign.audience,
        scheduledAt: campaign.scheduledAt || null,
        lastUserIdProcessed: campaign.lastUserIdProcessed || null,
        createdBy: campaign.createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const campaignRef = await db.collection("newsletter_campaigns").add(campaignData)

      console.log("[NewsletterRepository] ✅ Campaign created in Firestore:", campaignRef.id, {
        subject: campaign.subject,
        status: campaign.status,
      })
      return campaignRef.id
    } catch (error) {
      console.error("[NewsletterRepository] ❌ Error creating campaign in Firestore:", error)
      return null
    }
  }

  static async update(id: string, data: Partial<NewsletterCampaign>): Promise<boolean> {
    if (isDemoMode) {
      console.log("[NewsletterRepository] Demo mode - update logged:", { id, data })
      return true
    }

    // In production, update in Firestore using Admin SDK
    try {
      const { getAdminApp } = await import("@/lib/firebase-admin")
      const app = await getAdminApp()
      
      if (!app) {
        console.warn("[NewsletterRepository] Firebase Admin not initialized, cannot update campaign")
        return false
      }

      const { getFirestore } = await import("firebase-admin/firestore")
      const db = getFirestore(app)
      
      const campaignRef = db.collection("newsletter_campaigns").doc(id)
      
      await campaignRef.update({
        ...data,
        updatedAt: new Date(),
      })

      console.log("[NewsletterRepository] ✅ Campaign updated in Firestore:", id)
      return true
    } catch (error) {
      console.error("[NewsletterRepository] ❌ Error updating campaign in Firestore:", error)
      return false
    }
  }
}
