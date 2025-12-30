"use client"

import { useState, useImperativeHandle, forwardRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { FiSend, FiX } from "react-icons/fi"
import { useToast } from "@/hooks/use-toast"
import { getFirebaseIdToken } from "@/lib/api-helpers"

interface PostComposerMagneticProps {
  onPostCreated?: () => void
}

export interface PostComposerMagneticRef {
  expand: () => void
}

export const PostComposerMagnetic = forwardRef<PostComposerMagneticRef, PostComposerMagneticProps>(
  ({ onPostCreated }, ref) => {
    const [text, setText] = useState("")
    const [isExpanded, setIsExpanded] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { toast } = useToast()

    useImperativeHandle(ref, () => ({
      expand: () => {
        setIsExpanded(true)
        // Focus textarea after expansion animation
        setTimeout(() => {
          const textarea = document.querySelector("#post-composer textarea") as HTMLTextAreaElement
          textarea?.focus()
        }, 100)
      },
    }))

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
      setIsExpanded(false)
      toast({
        title: "Post pubblicato",
        description: "Il tuo post è stato pubblicato con successo",
      })

      // Refresh NeuroCredits stats if on neurocredits page
      if (typeof window !== "undefined" && window.location.pathname === "/neurocredits") {
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

  const handleCancel = () => {
    setText("")
    setIsExpanded(false)
  }

  return (
    <Card className="overflow-hidden transition-all duration-300 ease-in-out">
      <CardContent className="p-0">
        {!isExpanded ? (
          <div
            onClick={() => setIsExpanded(true)}
            className="p-4 cursor-text hover:bg-muted/50 transition-colors"
          >
            <Input
              placeholder="Scrivi un post..."
              readOnly
              className="cursor-text bg-background"
              onFocus={() => setIsExpanded(true)}
            />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-4 space-y-4 opacity-0 animate-slide-up"
            style={{ animationDuration: "0.3s", animationFillMode: "forwards" }}
          >
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Scrivi un post..."
              className="min-h-[120px] resize-none"
              maxLength={5000}
              disabled={isSubmitting}
              autoFocus
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {text.length}/5000 caratteri
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  <FiX className="h-4 w-4 mr-2" />
                  Annulla
                </Button>
                <Button type="submit" disabled={!text.trim() || isSubmitting}>
                  <FiSend className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Pubblicazione..." : "Pubblica"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
  }
)

PostComposerMagnetic.displayName = "PostComposerMagnetic"

