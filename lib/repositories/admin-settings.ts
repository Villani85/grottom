import { mockAdminSettings } from "@/lib/mock/data"
import type { AdminSettings } from "@/lib/types"

export class AdminSettingsRepository {
  static async get(): Promise<AdminSettings> {
    return mockAdminSettings
  }

  static async update(settings: Partial<AdminSettings>): Promise<boolean> {
    console.log("[AdminSettingsRepository] Mock mode - update logged:", settings)
    return true
  }
}
