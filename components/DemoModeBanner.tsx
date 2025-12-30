"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { isDemoMode } from "@/lib/env"

export function DemoModeBanner() {
  if (!isDemoMode) return null

  return (
    <Alert className="mb-4 border-accent bg-accent/10">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <strong>DEMO MODE</strong> - I dati non vengono salvati. Configurare le variabili d'ambiente Firebase per usare
        il database reale.
      </AlertDescription>
    </Alert>
  )
}
