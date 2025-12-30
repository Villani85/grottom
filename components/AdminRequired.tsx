"use client"

import type React from "react"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldAlert } from "lucide-react"

interface AdminRequiredProps {
  children: React.ReactNode
}

export function AdminRequired({ children }: AdminRequiredProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login")
    } else if (!isLoading && user && !user.isAdmin) {
      router.push("/area-riservata/dashboard")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    )
  }

  if (!user || !user.isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Alert variant="destructive">
          <ShieldAlert className="h-5 w-5" />
          <AlertTitle className="text-xl font-bold">Accesso Negato</AlertTitle>
          <AlertDescription className="mt-4">Non hai i permessi per accedere a questa sezione.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return <>{children}</>
}
