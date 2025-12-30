import { getAdminApp } from "@/lib/firebase-admin"
import { isDemoMode } from "@/lib/env"
import type { Category } from "@/lib/types-academy"

export const CategoriesRepository = {
  async getAll(): Promise<Category[]> {
    if (isDemoMode) {
      return [
        { id: "cat-1", name: "Mindset", order: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: "cat-2", name: "Business", order: 2, isActive: true, createdAt: new Date(), updatedAt: new Date() },
        { id: "cat-3", name: "Neuroscienze", order: 3, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      ]
    }

    const app = await getAdminApp()
    if (!app) {
      throw new Error("Firebase Admin not initialized")
    }

    const { getFirestore, FieldValue } = await import("firebase-admin/firestore")
    const db = getFirestore(app)

    // Query without composite index: use where only, then sort in memory
    // This avoids requiring a composite index (isActive + order)
    const snapshot = await db
      .collection("categories")
      .where("isActive", "==", true)
      .get()

    let categories = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      }))
      .sort((a, b) => (a.order || 0) - (b.order || 0)) as Category[]

    // Auto-create default category "Academy" if none exists
    if (categories.length === 0) {
      const defaultCategoryId = "academy"
      const defaultCategoryRef = db.collection("categories").doc(defaultCategoryId)

      // Check if it already exists
      const existing = await defaultCategoryRef.get()
      if (!existing.exists) {
        // Create default category
        await defaultCategoryRef.set(
          {
            name: "Academy",
            order: 1,
            isActive: true,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        )

        // Return the newly created category
        const newDoc = await defaultCategoryRef.get()
        if (newDoc.exists) {
          categories = [
            {
              id: newDoc.id,
              ...newDoc.data(),
              createdAt: newDoc.data()?.createdAt?.toDate() || new Date(),
              updatedAt: newDoc.data()?.updatedAt?.toDate() || new Date(),
            },
          ] as Category[]
        }
      } else {
        // It exists but wasn't in the query (shouldn't happen, but handle it)
        categories = [
          {
            id: existing.id,
            ...existing.data(),
            createdAt: existing.data()?.createdAt?.toDate() || new Date(),
            updatedAt: existing.data()?.updatedAt?.toDate() || new Date(),
          },
        ] as Category[]
      }
    }

    return categories
  },

  async getById(id: string): Promise<Category | null> {
    if (isDemoMode) {
      return { id, name: "Demo Category", order: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() }
    }

    const app = await getAdminApp()
    if (!app) {
      throw new Error("Firebase Admin not initialized")
    }

    const { getFirestore } = await import("firebase-admin/firestore")
    const db = getFirestore(app)

    const doc = await db.collection("categories").doc(id).get()
    if (!doc.exists) return null

    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate() || new Date(),
      updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
    } as Category
  },
}


