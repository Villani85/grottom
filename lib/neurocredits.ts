import { getAdminApp } from "./firebase-admin"
import { isDemoMode } from "./env"
import { NEUROCREDITS_RULES, getPeriodId, getTodayString, type NeuroCreditEventType } from "./neurocredits-rules"

export interface NeuroCreditEventPayload {
  type: NeuroCreditEventType
  targetUid: string // User receiving the credits
  actorUid: string // User performing the action
  periodId?: string // Auto-calculated if not provided
  deltaNeuroCredits: number
  deltaVideosCompleted?: number
  deltaActiveDays?: number
  ref?: {
    postId?: string
    videoId?: string
    date?: string
  }
}

/**
 * Generate deterministic event ID for idempotency
 */
export function generateEventId(payload: NeuroCreditEventPayload): string {
  const { type, targetUid, actorUid, ref } = payload

  switch (type) {
    case "POST_CREATED":
      return `post:${ref?.postId}:${targetUid}`
    case "COMMENT_CREATED":
      return `comment:${ref?.postId}:${ref?.commentId}:${targetUid}`
    case "COMMENT_DELETED":
      return `comment_deleted:${ref?.postId}:${ref?.commentId}:${targetUid}`
    case "LIKE_RECEIVED":
      return `like:${ref?.postId}:${actorUid}`
    case "UNLIKE_RECEIVED":
      return `unlike:${ref?.postId}:${actorUid}`
    case "VIDEO_COMPLETED":
      return `video_completed:${ref?.videoId}:${targetUid}`
    case "DAILY_ACTIVE":
      return `daily_active:${targetUid}:${ref?.date || getTodayString()}`
    default:
      return `${type}:${targetUid}:${actorUid}:${Date.now()}`
  }
}

/**
 * Update daily cap counter (inside transaction)
 */
async function updateDailyCap(
  transaction: any,
  db: any,
  uid: string,
  eventType: NeuroCreditEventType,
  today: string
) {
  const rule = NEUROCREDITS_RULES[eventType]
  if (!rule.hasDailyCap) {
    return // No cap to update
  }

  const capRef = db.collection("users").doc(uid).collection("dailyCaps").doc(today)

  if (eventType === "POST_CREATED") {
    // Get current value in transaction (synchronous)
    const capDoc = await transaction.get(capRef)
    const currentValue = capDoc.exists ? (capDoc.data()?.postCreditsUsed || 0) : 0
    transaction.set(
      capRef,
      {
        postCreditsUsed: currentValue + 1,
        updatedAt: new Date(),
      },
      { merge: true }
    )
  } else if (eventType === "COMMENT_CREATED") {
    // Get current value in transaction (synchronous)
    const capDoc = await transaction.get(capRef)
    const currentValue = capDoc.exists ? (capDoc.data()?.commentCreditsUsed || 0) : 0
    transaction.set(
      capRef,
      {
        commentCreditsUsed: currentValue + 1,
        updatedAt: new Date(),
      },
      { merge: true }
    )
  } else if (eventType === "VIDEO_COMPLETED") {
    // Get current value in transaction (synchronous)
    const capDoc = await transaction.get(capRef)
    const currentValue = capDoc.exists ? (capDoc.data()?.videoCreditsUsed || 0) : 0
    transaction.set(
      capRef,
      {
        videoCreditsUsed: currentValue + 1,
        updatedAt: new Date(),
      },
      { merge: true }
    )
  } else if (eventType === "DAILY_ACTIVE") {
    transaction.set(
      capRef,
      {
        dailyActiveUsed: true,
        updatedAt: new Date(),
      },
      { merge: true }
    )
  }
}

/**
 * Apply NeuroCredit event (idempotent via event ID)
 */
export async function applyEvent(payload: NeuroCreditEventPayload): Promise<{
  applied: boolean
  eventId: string
  neuroCreditsAwarded: number
}> {
  if (isDemoMode) {
    console.log("[NeuroCredits] Demo mode - event logged:", payload)
    return { applied: true, eventId: generateEventId(payload), neuroCreditsAwarded: payload.deltaNeuroCredits }
  }

  const app = await getAdminApp()
  if (!app) {
    console.warn("[NeuroCredits] Firebase Admin not initialized")
    return { applied: false, eventId: generateEventId(payload), neuroCreditsAwarded: 0 }
  }

  const { getFirestore } = await import("firebase-admin/firestore")
  const db = getFirestore(app)

  const eventId = generateEventId(payload)
  const periodId = payload.periodId || getPeriodId()
  const today = getTodayString()

  try {
    await db.runTransaction(async (transaction) => {
      // Check if event already exists (idempotency)
      const eventRef = db.collection("neurocredit_events").doc(eventId)
      const eventDoc = await transaction.get(eventRef)

      if (eventDoc.exists) {
        // Event already applied - idempotent return
        return
      }

      // Check daily cap inside transaction
      const rule = NEUROCREDITS_RULES[payload.type]
      let capReached = false
      let neuroCreditsToAward = payload.deltaNeuroCredits

      if (rule.hasDailyCap) {
        const capRef = db.collection("users").doc(payload.targetUid).collection("dailyCaps").doc(today)
        const capDoc = await transaction.get(capRef)
        const capData = capDoc.exists ? capDoc.data() : {}

        if (payload.type === "POST_CREATED") {
          capReached = (capData.postCreditsUsed || 0) >= rule.dailyCap!
        } else if (payload.type === "COMMENT_CREATED") {
          capReached = (capData.commentCreditsUsed || 0) >= rule.dailyCap!
        } else if (payload.type === "VIDEO_COMPLETED") {
          capReached = (capData.videoCreditsUsed || 0) >= rule.dailyCap!
        } else if (payload.type === "DAILY_ACTIVE") {
          capReached = capData.dailyActiveUsed === true
        }

        if (capReached) {
          neuroCreditsToAward = 0
        }
      }

      // Log event creation
      console.log(`[NeuroCredits] 🎯 Applying event:`, {
        eventId,
        type: payload.type,
        targetUid: payload.targetUid,
        actorUid: payload.actorUid,
        deltaNeuroCredits: neuroCreditsToAward,
        capReached,
      })

      // Create event record
      transaction.set(eventRef, {
        type: payload.type,
        targetUid: payload.targetUid,
        actorUid: payload.actorUid,
        periodId,
        deltaNeuroCredits: neuroCreditsToAward,
        deltaVideosCompleted: payload.deltaVideosCompleted || 0,
        deltaActiveDays: payload.deltaActiveDays || 0,
        ref: payload.ref || {},
        createdAt: new Date(),
      })

      console.log(`[NeuroCredits] ✅ Event created: ${eventId}`)

      // Update daily cap if needed (before awarding credits)
      if (!capReached && rule.hasDailyCap) {
        await updateDailyCap(transaction, db, payload.targetUid, payload.type, today)
      }

      // Update user document
      const userRef = db.collection("users").doc(payload.targetUid)
      const userDoc = await transaction.get(userRef)

      if (!userDoc.exists) {
        throw new Error(`User ${payload.targetUid} not found`)
      }

      const userData = userDoc.data()
      const currentNeuroCredits = userData?.neuroCredits_total || 0
      const currentVideosCompleted = userData?.videosCompleted_total || 0
      const currentActiveDays = userData?.activeDays_total || 0

      // Update monthly maps
      const neuroCreditsMonthly = userData?.neuroCredits_monthly || {}
      const videosCompletedMonthly = userData?.videosCompleted_monthly || {}
      const activeDaysMonthly = userData?.activeDays_monthly || {}

      neuroCreditsMonthly[periodId] = (neuroCreditsMonthly[periodId] || 0) + neuroCreditsToAward
      if (payload.deltaVideosCompleted) {
        videosCompletedMonthly[periodId] = (videosCompletedMonthly[periodId] || 0) + payload.deltaVideosCompleted
      }
      if (payload.deltaActiveDays) {
        activeDaysMonthly[periodId] = (activeDaysMonthly[periodId] || 0) + payload.deltaActiveDays
      }

      // Update user
      const newNeuroCreditsTotal = currentNeuroCredits + neuroCreditsToAward
      transaction.update(userRef, {
        neuroCredits_total: newNeuroCreditsTotal,
        neuroCredits_monthly: neuroCreditsMonthly,
        videosCompleted_total: currentVideosCompleted + (payload.deltaVideosCompleted || 0),
        videosCompleted_monthly: videosCompletedMonthly,
        activeDays_total: currentActiveDays + (payload.deltaActiveDays || 0),
        activeDays_monthly: activeDaysMonthly,
        updatedAt: new Date(),
      })

      console.log(`[NeuroCredits] 📊 Updated totals:`, {
        targetUid: payload.targetUid,
        neuroCredits_total: newNeuroCreditsTotal,
        neuroCredits_monthly: neuroCreditsMonthly[periodId],
        periodId,
      })

      // Update leaderboard entries
      const allTimeEntryRef = db.collection("leaderboards").doc("all_time").collection("entries").doc(payload.targetUid)
      const monthlyEntryRef = db
        .collection("leaderboards")
        .doc(periodId)
        .collection("entries")
        .doc(payload.targetUid)

      // Get current leaderboard entries
      const allTimeEntryDoc = await transaction.get(allTimeEntryRef)
      const monthlyEntryDoc = await transaction.get(monthlyEntryRef)

      const allTimeData = allTimeEntryDoc.exists ? allTimeEntryDoc.data() : {}
      const monthlyData = monthlyEntryDoc.exists ? monthlyEntryDoc.data() : {}

      // Update all-time leaderboard
      transaction.set(
        allTimeEntryRef,
        {
          neuroCredits: (allTimeData.neuroCredits || 0) + neuroCreditsToAward,
          videosCompleted: (allTimeData.videosCompleted || 0) + (payload.deltaVideosCompleted || 0),
          activeDays: (allTimeData.activeDays || 0) + (payload.deltaActiveDays || 0),
          displayName: userData?.nickname || userData?.email?.split("@")[0] || "User",
          avatarUrl: userData?.avatarUrl || null,
          updatedAt: new Date(),
        },
        { merge: true }
      )

      // Update monthly leaderboard
      transaction.set(
        monthlyEntryRef,
        {
          neuroCredits: (monthlyData.neuroCredits || 0) + neuroCreditsToAward,
          videosCompleted: (monthlyData.videosCompleted || 0) + (payload.deltaVideosCompleted || 0),
          activeDays: (monthlyData.activeDays || 0) + (payload.deltaActiveDays || 0),
          displayName: userData?.nickname || userData?.email?.split("@")[0] || "User",
          avatarUrl: userData?.avatarUrl || null,
          updatedAt: new Date(),
        },
        { merge: true }
      )
    })

    // Fetch the event to get the actual neuroCredits awarded
    const eventDoc = await db.collection("neurocredit_events").doc(eventId).get()
    const eventData = eventDoc.exists ? eventDoc.data() : null
    const neuroCreditsAwarded = eventData?.deltaNeuroCredits || 0

    return {
      applied: true,
      eventId,
      neuroCreditsAwarded,
    }
  } catch (error: any) {
    console.error("[NeuroCredits] Error applying event:", error)
    return { applied: false, eventId, neuroCreditsAwarded: 0 }
  }
}

/**
 * Touch daily active (idempotent - can be called multiple times per day)
 * Should be called on any "serious" action (create post, comment, like, complete video)
 */
export async function touchDailyActive(actorUid: string): Promise<boolean> {
  const today = getTodayString()
  const periodId = getPeriodId()

  const result = await applyEvent({
    type: "DAILY_ACTIVE",
    targetUid: actorUid,
    actorUid,
    periodId,
    deltaNeuroCredits: 1, // Will be 0 if cap reached
    deltaActiveDays: 1,
    ref: {
      date: today,
    },
  })

  if (result.applied) {
    // Update streak and lastActiveDate
    await updateStreak(actorUid, today)
  }

  return result.applied
}

/**
 * Update user streak based on lastActiveDate
 */
async function updateStreak(uid: string, today: string): Promise<void> {
  if (isDemoMode) {
    return
  }

  const app = await getAdminApp()
  if (!app) {
    return
  }

  const { getFirestore } = await import("firebase-admin/firestore")
  const db = getFirestore(app)

  try {
    await db.runTransaction(async (transaction) => {
      const userRef = db.collection("users").doc(uid)
      const userDoc = await transaction.get(userRef)

      if (!userDoc.exists) {
        return
      }

      const userData = userDoc.data()
      const lastActiveDate = userData?.lastActiveDate || null

      // Parse dates
      const todayDate = new Date(today + "T00:00:00")
      const yesterdayDate = new Date(todayDate)
      yesterdayDate.setDate(yesterdayDate.getDate() - 1)
      const yesterdayString = getTodayString(yesterdayDate)

      let streakCurrent = userData?.streak_current || 0
      let streakBest = userData?.streak_best || 0

      if (lastActiveDate === today) {
        // Already active today - no change
        return
      } else if (lastActiveDate === yesterdayString) {
        // Consecutive day - increment streak
        streakCurrent += 1
      } else {
        // New streak
        streakCurrent = 1
      }

      streakBest = Math.max(streakBest, streakCurrent)

      transaction.update(userRef, {
        lastActiveDate: today,
        streak_current: streakCurrent,
        streak_best: streakBest,
        updatedAt: new Date(),
      })
    })
  } catch (error) {
    console.error("[NeuroCredits] Error updating streak:", error)
  }
}

