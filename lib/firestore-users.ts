"use client"

import { getFirebaseFirestore } from "./firebase-client"
import type { User } from "./types"

/**
 * Client-side Firestore helper functions for Users
 */

// Helper to safely convert Firestore Timestamp to Date
const toDate = (value: any): Date | undefined => {
  if (!value) return undefined
  if (value instanceof Date) return value
  if (value && typeof value.toDate === "function") {
    // Firestore Timestamp
    try {
      return value.toDate()
    } catch (e) {
      console.warn("[Firestore] Error converting Timestamp to Date:", e)
      return undefined
    }
  }
  if (typeof value === "string") {
    // ISO string
    const date = new Date(value)
    return isNaN(date.getTime()) ? undefined : date
  }
  if (typeof value === "number") {
    // Unix timestamp (seconds or milliseconds)
    const date = value > 1000000000000 ? new Date(value) : new Date(value * 1000)
    return isNaN(date.getTime()) ? undefined : date
  }
  return undefined
}

export async function getAllUsersFromFirestore(limit = 500): Promise<User[]> {
  const db = getFirebaseFirestore()
  if (!db) {
    console.warn("[Firestore] ❌ Database not initialized")
    return []
  }

  // Check authentication
  const { getFirebaseAuth } = await import("./firebase-client")
  const auth = getFirebaseAuth()
  if (!auth || !auth.currentUser) {
    console.warn("[Firestore] ⚠️ User not authenticated - cannot fetch users")
    return []
  }

  try {
    const { collection, query, orderBy, limit: limitQuery, getDocs } = await import("firebase/firestore")
    const usersRef = collection(db, "users")
    
    console.log("[Firestore] 📥 Fetching all users (limit:", limit, ")")
    
    // Try to query with orderBy, but if createdAt doesn't exist, query without orderBy
    let snapshot
    try {
      const q = query(usersRef, orderBy("createdAt", "desc"), limitQuery(limit))
      snapshot = await getDocs(q)
      console.log("[Firestore] ✅ Query with orderBy successful, got", snapshot.size, "users")
    } catch (orderByError: any) {
      // If orderBy fails (e.g., no index or field doesn't exist), query without orderBy
      console.warn("[Firestore] ⚠️ orderBy failed, querying without order:", orderByError.message)
      try {
        const q = query(usersRef, limitQuery(limit))
        snapshot = await getDocs(q)
        console.log("[Firestore] ✅ Query without orderBy successful, got", snapshot.size, "users")
      } catch (queryError: any) {
        console.error("[Firestore] ❌ Query failed:", queryError.code, queryError.message)
        return []
      }
    }

    const users: User[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      users.push({
        uid: doc.id,
        email: data.email || "",
        nickname: data.nickname || "",
        avatarUrl: data.avatarUrl,
        bio: data.bio,
        location: data.location,
        website: data.website,
        publicEmail: data.publicEmail,
        interests: data.interests || [],
        socialLinks: data.socialLinks || {},
        pointsTotal: data.pointsTotal || 0,
        subscriptionStatus: data.subscriptionStatus || "none",
        subscriptionEnd: toDate(data.subscriptionEnd),
        isManualSubscription: data.isManualSubscription || false,
        isAdmin: data.isAdmin || false,
        marketingOptIn: data.marketingOptIn || false,
        createdAt: toDate(data.createdAt) || new Date(),
        updatedAt: toDate(data.updatedAt) || new Date(),
      } as User)
    })

    console.log(`[Firestore] ✅ Loaded ${users.length} users from Firestore`)
    return users
  } catch (error: any) {
    console.error("[Firestore] ❌ Error fetching all users:", error.code, error.message)
    return []
  }
}

