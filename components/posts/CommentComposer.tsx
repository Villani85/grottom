"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FiSend } from "react-icons/fi"
import { useToast } from "@/hooks/use-toast"
import { getFirebaseIdToken } from "@/lib/api-helpers"

interface CommentComposerProps {
  postId: string
  onCommentAdded?: () => void
}

export function CommentComposer({ postId, onCommentAdded }: CommentComposerProps) {
  const [text, setText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!text.trim()) {
      toast({
        title: "Errore",
        description: "Il testo del commento è obbligatorio",
        variant: "destructive",
      })
      return
    }

    if (text.length > 500) {
      toast({
        title: "Errore",
        description: "Il commento non può superare i 500 caratteri",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const token = await getFirebaseIdToken()
      if (!token) {
        toast({
          title: "Errore",
          description: "Devi essere autenticato per commentare",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: text.trim() }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Errore nell'aggiungere il commento")
      }

      const newComment = await response.json()

      setText("")
      toast({
        title: "Commento aggiunto",
        description: "Il tuo commento è stato aggiunto con successo",
      })

      // Refresh NeuroCredits stats if on neurocredits page
      if (typeof window !== "undefined" && window.location.pathname === "/neurocredits") {
        window.dispatchEvent(new CustomEvent("refreshNeuroCredits"))
      }

      onCommentAdded?.()
    } catch (error: any) {
      console.error("Error adding comment:", error)
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiungere il commento",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Scrivi un commento..."
        className="min-h-[80px] resize-none"
        maxLength={500}
        disabled={isSubmitting}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{text.length}/500 caratteri</p>
        <Button type="submit" size="sm" disabled={!text.trim() || isSubmitting}>
          <FiSend className="h-4 w-4 mr-2" />
          {isSubmitting ? "Invio..." : "Invia"}
        </Button>
      </div>
    </form>
  )
}

