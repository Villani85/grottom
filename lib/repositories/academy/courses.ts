import { getAdminApp } from "@/lib/firebase-admin"
import { isDemoMode } from "@/lib/env"
import type { Course } from "@/lib/types-academy"
import { normalizeCourse } from "@/lib/academy/normalizeCourse"

export const CoursesRepository = {
  async getAll(filters?: { categoryId?: string; published?: boolean; q?: string }): Promise<Course[]> {
    if (isDemoMode) {
      return []
    }

    const app = await getAdminApp()
    if (!app) {
      throw new Error("Firebase Admin not initialized")
    }

    const { getFirestore } = await import("firebase-admin/firestore")
    const db = getFirestore(app)

    let courses: Course[] = []

    try {
      // Try query with composite index (where + orderBy)
      let query: any = db.collection("courses")

      if (filters?.published !== undefined) {
        query = query.where("published", "==", filters.published)
      }

      if (filters?.categoryId) {
        query = query.where("categoryId", "==", filters.categoryId)
      }

      const snapshot = await query.orderBy("updatedAt", "desc").limit(500).get()

      courses = snapshot.docs.map((doc) =>
        normalizeCourse({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })
      )
    } catch (error: any) {
      // Fallback: query without composite index (no-index fallback)
      const errorMessage = error.message || String(error) || ""
      const isIndexError =
        errorMessage.includes("FAILED_PRECONDITION") ||
        errorMessage.includes("requires an index") ||
        error.code === "failed-precondition"

      if (isIndexError) {
        // Query all courses (or with single where), filter and sort in memory
        let fallbackQuery: any = db.collection("courses")

        // Apply only one where clause if needed (to avoid composite index)
        if (filters?.published !== undefined) {
          fallbackQuery = fallbackQuery.where("published", "==", filters.published)
        } else if (filters?.categoryId) {
          fallbackQuery = fallbackQuery.where("categoryId", "==", filters.categoryId)
        }

        const snapshot = await fallbackQuery.limit(500).get()

        courses = snapshot.docs
          .map((doc) =>
            normalizeCourse({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
              updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            })
          )
          // Filter in memory
          .filter((c) => {
            if (filters?.published !== undefined && c.published !== filters.published) return false
            if (filters?.categoryId && c.categoryId !== filters.categoryId) return false
            return true
          })
          // Sort in memory
          .sort((a, b) => {
            const aTime = a.updatedAt?.getTime() || 0
            const bTime = b.updatedAt?.getTime() || 0
            return bTime - aTime // desc
          })
      } else {
        // Re-throw if it's not an index error
        throw error
      }
    }

    // Client-side search filter (simple, for production use Algolia or similar)
    let coursesFiltered = courses
    if (filters?.q) {
      const q = filters.q.toLowerCase()
      coursesFiltered = coursesFiltered.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.shortDescription.toLowerCase().includes(q) ||
          c.longDescription.toLowerCase().includes(q)
      )
    }

    return coursesFiltered
  },

  async getBySlug(slug: string, publishedOnly: boolean = true): Promise<Course | null> {
    if (isDemoMode) {
      return null
    }

    const app = await getAdminApp()
    if (!app) {
      throw new Error("Firebase Admin not initialized")
    }

    const { getFirestore } = await import("firebase-admin/firestore")
    const db = getFirestore(app)

    // Try to find by slug first
    try {
      let query: any = db.collection("courses").where("slug", "==", slug)

      if (publishedOnly) {
        query = query.where("published", "==", true)
      }

      const snapshot = await query.limit(1).get()

      if (!snapshot.empty) {
        const doc = snapshot.docs[0]
        return normalizeCourse({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })
      }
    } catch (error: any) {
      // Fallback: query only by slug, filter published in memory
      const errorMessage = error.message || String(error) || ""
      const isIndexError =
        errorMessage.includes("FAILED_PRECONDITION") ||
        errorMessage.includes("requires an index") ||
        error.code === "failed-precondition"

      if (isIndexError) {
        const snapshot = await db.collection("courses").where("slug", "==", slug).limit(1).get()

        if (!snapshot.empty) {
          const doc = snapshot.docs[0]
          const course = normalizeCourse({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          })

          // Filter published in memory
          if (publishedOnly && course.published !== true) {
            return null
          }

          return course
        }
      } else {
        // Re-throw if it's not an index error
        throw error
      }
    }

    // Fallback: try to find by docId (for backward compatibility)
    const docRef = db.collection("courses").doc(slug)
    const doc = await docRef.get()

    if (doc.exists) {
      const data = doc.data()
      // Check published filter if needed
      if (publishedOnly && data?.published !== true) {
        return null
      }
      return normalizeCourse({
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate() || new Date(),
        updatedAt: data?.updatedAt?.toDate() || new Date(),
      })
    }

    return null
  },

  async getById(id: string): Promise<Course | null> {
    if (isDemoMode) {
      return null
    }

    const app = await getAdminApp()
    if (!app) {
      throw new Error("Firebase Admin not initialized")
    }

    const { getFirestore } = await import("firebase-admin/firestore")
    const db = getFirestore(app)

    const doc = await db.collection("courses").doc(id).get()
    if (!doc.exists) return null

    return normalizeCourse({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate() || new Date(),
      updatedAt: doc.data()?.updatedAt?.toDate() || new Date(),
    })
  },

  async create(data: Omit<Course, "id" | "createdAt" | "updatedAt">): Promise<string> {
    if (isDemoMode) {
      return "demo-course-id"
    }

    const app = await getAdminApp()
    if (!app) {
      throw new Error("Firebase Admin not initialized")
    }

    const { getFirestore } = await import("firebase-admin/firestore")
    const db = getFirestore(app)

    const now = new Date()
    const docRef = await db.collection("courses").add({
      ...data,
      createdAt: now,
      updatedAt: now,
    })

    return docRef.id
  },

  async update(id: string, data: Partial<Course>): Promise<void> {
    if (isDemoMode) {
      return
    }

    const app = await getAdminApp()
    if (!app) {
      throw new Error("Firebase Admin not initialized")
    }

    const { getFirestore } = await import("firebase-admin/firestore")
    const db = getFirestore(app)

    await db.collection("courses").doc(id).update({
      ...data,
      updatedAt: new Date(),
    })
  },

  async delete(id: string): Promise<void> {
    if (isDemoMode) {
      return
    }

    const app = await getAdminApp()
    if (!app) {
      throw new Error("Firebase Admin not initialized")
    }

    const { getFirestore } = await import("firebase-admin/firestore")
    const db = getFirestore(app)

    await db.collection("courses").doc(id).delete()
  },
}

