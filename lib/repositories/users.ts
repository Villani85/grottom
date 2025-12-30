import { mockUsers } from "@/lib/mock/data"
import type { User } from "@/lib/types"

export class UsersRepository {
  static async getById(uid: string): Promise<User | null> {
    // Always use mock data for now to avoid firebase-admin bundling issues
    return mockUsers.find((u) => u.uid === uid) || mockUsers[0]
  }

  static async getAll(limit = 100): Promise<User[]> {
    return mockUsers.slice(0, limit)
  }

  static async getBySubscriptionStatus(status: User["subscriptionStatus"], limit = 100): Promise<User[]> {
    return mockUsers.filter((u) => u.subscriptionStatus === status).slice(0, limit)
  }

  static async update(uid: string, data: Partial<User>): Promise<boolean> {
    console.log("[UsersRepository] Mock mode - update logged:", { uid, data })
    return true
  }

  static async delete(uid: string): Promise<boolean> {
    console.log("[UsersRepository] Mock mode - delete logged:", { uid })
    return true
  }

  static async create(data: Omit<User, "createdAt" | "updatedAt">): Promise<User> {
    const newUser: User = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    console.log("[UsersRepository] Mock mode - create logged:", newUser)
    return newUser
  }
}
