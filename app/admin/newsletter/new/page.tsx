"use client"

import { useState } from "react"
import { AdminRequired } from "@/components/AdminRequired"
import { DemoModeBanner } from "@/components/DemoModeBanner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Send, Calendar, Eye, EyeOff, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { NewsletterCampaign } from "@/lib/types"

export default function NewNewsletterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [formData, setFormData] = useState({
    subject: "",
    fromName: "Brain Hacking Academy",
    fromEmail: process.env.NEXT_PUBLIC_EMAIL_FROM || "info@brainhackingacademy.com",
    replyTo: process.env.NEXT_PUBLIC_EMAIL_FROM || "info@brainhackingacademy.com",
    content: "",
    audience: "subscribers_active" as const,
    scheduledAt: "",
    sendType: "immediate" as "immediate" | "scheduled",
  })

  const generateHTML = (content: string) => {
    return `
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
          <div style="background: #001d41; padding: 20px; text-align: center; margin-bottom: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Brain Hacking Academy</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
            ${content
              .split("\n")
              .filter((p) => p.trim())
              .map((p) => {
                // Simple formatting: **bold**, *italic*, # heading
                let formatted = p.trim()
                formatted = formatted.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                formatted = formatted.replace(/\*(.+?)\*/g, "<em>$1</em>")
                if (formatted.startsWith("# ")) {
                  return `<h1 style="font-size: 24px; margin-top: 20px; margin-bottom: 10px;">${formatted.substring(2)}</h1>`
                }
                if (formatted.startsWith("## ")) {
                  return `<h2 style="font-size: 20px; margin-top: 18px; margin-bottom: 8px;">${formatted.substring(3)}</h2>`
                }
                if (formatted.startsWith("### ")) {
                  return `<h3 style="font-size: 18px; margin-top: 16px; margin-bottom: 6px;">${formatted.substring(4)}</h3>`
                }
                return `<p style="margin-bottom: 12px;">${formatted}</p>`
              })
              .join("")}
          </div>
          <div style="background: #f4f5f7; padding: 20px; text-align: center; margin-top: 20px; border-radius: 8px; font-size: 12px; color: #666;">
            <p>© 2025 Brain Hacking Academy. Tutti i diritti riservati.</p>
            <p><a href="{unsubscribe_url}" style="color: #005fd7; text-decoration: none;">Disiscriviti</a></p>
          </div>
        </body>
      </html>
    `
  }

  const handleSave = async (status: "draft" | "scheduled" | "sending") => {
    if (!formData.subject || !formData.content) {
      toast({
        title: "Campi mancanti",
        description: "Compila oggetto e contenuto prima di salvare",
        variant: "destructive",
      })
      return
    }

    if (formData.sendType === "scheduled" && !formData.scheduledAt) {
      toast({
        title: "Data mancante",
        description: "Seleziona una data per l'invio programmato",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const htmlContent = generateHTML(formData.content)
      const scheduledDate = formData.sendType === "scheduled" && formData.scheduledAt ? new Date(formData.scheduledAt) : undefined

      const campaignData: Omit<NewsletterCampaign, "id" | "createdAt" | "updatedAt"> = {
        subject: formData.subject,
        fromName: formData.fromName,
        fromEmail: formData.fromEmail,
        replyTo: formData.replyTo,
        html: htmlContent,
        status: status === "draft" ? "draft" : formData.sendType === "scheduled" ? "scheduled" : "sending",
        audience: {
          include: [formData.audience],
          excludeBanned: true,
        },
        scheduledAt: scheduledDate,
        createdBy: "admin", // TODO: Use actual admin user ID
      }

      const response = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaignData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || "Failed to create campaign")
      }

      const result = await response.json()

      toast({
        title: "Campagna creata",
        description:
          status === "draft"
            ? "Salvata come bozza"
            : formData.sendType === "scheduled"
              ? `Programmata per ${scheduledDate?.toLocaleString("it-IT")}`
              : "Invio immediato avviato",
      })

      // Show warning if using test email
      if (formData.fromEmail.includes("resend.dev") || formData.fromEmail.includes("onboarding")) {
        toast({
          title: "⚠️ Attenzione: Email di Test",
          description: "Stai usando un indirizzo email di test. Verifica un dominio su Resend per inviare a tutti i destinatari.",
          variant: "destructive",
        })
      }

      router.push("/admin/newsletter")
    } catch (error) {
      console.error("Error creating campaign:", error)
      toast({
        title: "Errore",
        description: "Impossibile creare la campagna",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AdminRequired>
      <div className="py-8 max-w-4xl">
        <DemoModeBanner />

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Nuova Campagna Newsletter</h1>
          <p className="text-muted-foreground">Crea e invia una newsletter ai tuoi membri</p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informazioni Email</CardTitle>
              <CardDescription>Configura mittente e oggetto dell'email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fromName">Nome Mittente</Label>
                  <Input
                    id="fromName"
                    value={formData.fromName}
                    onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="fromEmail">Email Mittente</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={formData.fromEmail}
                    onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                    className={`mt-2 ${formData.fromEmail.includes("resend.dev") ? "border-yellow-500" : ""}`}
                  />
                  {formData.fromEmail.includes("resend.dev") || formData.fromEmail.includes("onboarding") ? (
                    <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-sm text-yellow-400 font-semibold mb-1">⚠️ Email di Test</p>
                      <p className="text-xs text-yellow-300">
                        Puoi inviare solo all'email del tuo account Resend. Per inviare a tutti, verifica un dominio su{" "}
                        <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="underline">
                          resend.com/domains
                        </a>
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      Deve essere su un dominio verificato.{" "}
                      <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-[#005FD7] underline">
                        Verifica dominio
                      </a>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="subject">Oggetto</Label>
                <Input
                  id="subject"
                  placeholder="Il tuo oggetto accattivante..."
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Contenuto</CardTitle>
                  <CardDescription>Scrivi il contenuto della tua newsletter</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  type="button"
                >
                  {showPreview ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Nascondi Preview
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Mostra Preview
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showPreview ? (
                <div className="border border-gray-700 rounded-lg p-4 bg-white min-h-[300px]">
                  <div dangerouslySetInnerHTML={{ __html: generateHTML(formData.content) }} />
                </div>
              ) : (
                <>
                  <Textarea
                    placeholder="Scrivi il contenuto della newsletter qui...

Puoi usare:
- **testo** per grassetto
- *testo* per corsivo
- # Titolo principale
- ## Sottotitolo
- ### Sottotitolo 3"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Supporta formattazione Markdown base: **grassetto**, *corsivo*, # titoli
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pianificazione Invio</CardTitle>
              <CardDescription>Scegli quando inviare la newsletter</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tipo di Invio</Label>
                <Select
                  value={formData.sendType}
                  onValueChange={(value: "immediate" | "scheduled") =>
                    setFormData({ ...formData, sendType: value })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Invio Immediato</SelectItem>
                    <SelectItem value="scheduled">Invio Programmato</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.sendType === "scheduled" && (
                <div>
                  <Label htmlFor="scheduledAt">Data e Ora Invio (Europe/Rome)</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="mt-2"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    La newsletter verrà inviata automaticamente alla data e ora specificata
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audience</CardTitle>
              <CardDescription>Seleziona chi riceverà questa newsletter</CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="audience">Destinatari</Label>
              <Select
                value={formData.audience}
                onValueChange={(value: typeof formData.audience) => setFormData({ ...formData, audience: value })}
              >
                <SelectTrigger id="audience" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscribers_active">Solo Abbonati Attivi</SelectItem>
                  <SelectItem value="non_subscribers">Solo Non Abbonati</SelectItem>
                  <SelectItem value="all">Tutti gli Utenti</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground mt-2">
                Gli utenti bannati e quelli senza consenso marketing saranno automaticamente esclusi
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={() => router.back()}>
              Annulla
            </Button>
            <Button variant="outline" onClick={() => handleSave("draft")} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              Salva Bozza
            </Button>
            <Button
              onClick={() => handleSave(formData.sendType === "scheduled" ? "scheduled" : "sending")}
              disabled={isSaving}
            >
              {formData.sendType === "scheduled" ? (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Programma Invio
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Invia Subito
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AdminRequired>
  )
}
