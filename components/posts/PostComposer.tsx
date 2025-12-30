"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FiSend } from "react-icons/fi"
import { useToast } from "@/hooks/use-toast"
import { getFirebaseIdToken } from "@/lib/api-helpers"

interface PostComposerProps {
  onPostCreated?: () => void
}

export function PostComposer({ onPostCreated }: PostComposerProps) {
  const [text, setText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!text.trim()) {
      toast({
        title: "Errore",
        description: "Il testo del post è obbligatorio",
        variant: "destructive",
      })
      return
    }

    if (text.length > 5000) {
      toast({
        title: "Errore",
        description: "Il post non può superare i 5000 caratteri",
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
          description: "Devi essere autenticato per creare un post",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: text.trim() }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Errore nel creare il post")
      }

      const newPost = await response.json()

      setText("")
      toast({
        title: "Post pubblicato",
        description: "Il tuo post è stato pubblicato con successo",
      })

      // Refresh NeuroCredits stats if on neurocredits page
      if (typeof window !== "undefined" && window.location.pathname === "/neurocredits") {
        // Trigger a custom event that the neurocredits page can listen to
        window.dispatchEvent(new CustomEvent("refreshNeuroCredits"))
      }

      onPostCreated?.()
    } catch (error: any) {
      console.error("Error creating post:", error)
      toast({
        title: "Errore",
        description: error.message || "Impossibile pubblicare il post",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Scrivi un post..."
          className="min-h-[120px] resize-none"
          maxLength={5000}
          disabled={isSubmitting}
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-muted-foreground">
            {text.length}/5000 caratteri
          </p>
          <Button type="submit" disabled={!text.trim() || isSubmitting}>
            <FiSend className="h-4 w-4 mr-2" />
            {isSubmitting ? "Pubblicazione..." : "Pubblica"}
          </Button>
        </div>
      </div>
    </form>
  )
}

