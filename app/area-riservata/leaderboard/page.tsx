"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LeaderboardRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/neurocredits")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#005FD7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Reindirizzamento a NeuroCredits...</p>
      </div>
    </div>
  )
}
