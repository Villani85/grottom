import { mockPosts } from "@/lib/mock/data"
import type { Post } from "@/lib/types"
import { isDemoMode } from "@/lib/env"

export class PostsRepository {
  static async getAll(limit = 50, publishedOnly = true): Promise<Post[]> {
    // In demo mode, use mock data
    if (isDemoMode) {
      return (publishedOnly ? mockPosts.filter((p) => p.published) : mockPosts).slice(0, limit)
    }

    // In production, try to load from Firestore (client-side only)
    // Note: This is called from API routes, so we can't use client-side Firestore here
    // The API route should handle Firestore operations server-side or delegate to client
    // For now, return mock data as fallback
    return (publishedOnly ? mockPosts.filter((p) => p.published) : mockPosts).slice(0, limit)
  }

  static async create(post: Omit<Post, "id" | "createdAt" | "updatedAt" | "likesCount" | "commentsCount">): Promise<Post> {
    const newPost: Post = {
      ...post,
      id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      likesCount: 0,
      commentsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    if (isDemoMode) {
      console.log("[PostsRepository] Mock mode - create logged:", newPost)
    } else {
      console.log("[PostsRepository] Post created (should be saved to Firestore by client):", newPost)
    }
    
    return newPost
  }

  static async update(id: string, data: Partial<Post>): Promise<boolean> {
    if (isDemoMode) {
      console.log("[PostsRepository] Mock mode - update logged:", { id, data })
    } else {
      console.log("[PostsRepository] Post update (should be saved to Firestore by client):", { id, data })
    }
    return true
  }

  static async delete(id: string): Promise<boolean> {
    if (isDemoMode) {
      console.log("[PostsRepository] Mock mode - delete logged:", { id })
    } else {
      console.log("[PostsRepository] Post delete (should be deleted from Firestore by client):", { id })
    }
    return true
  }
}
