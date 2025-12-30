"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FiHeart } from "react-icons/fi"
import { useToast } from "@/hooks/use-toast"
import { getFirebaseIdToken } from "@/lib/api-helpers"
import { useAuth } from "@/context/AuthContext"

interface LikeButtonProps {
  postId: string
  authorId: string
  initialLikesCount: number
  onLikeChange?: (liked: boolean, newCount: number) => void
}

export function LikeButton({ postId, authorId, initialLikesCount, onLikeChange }: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(initialLikesCount)
  const [isLoading, setIsLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  // Check if current user has liked this post
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!user) {
        setIsChecking(false)
        return
      }

      try {
        const token = await getFirebaseIdToken()
        if (!token) {
          setIsChecking(false)
          return
        }

        const response = await fetch(`/api/posts/${postId}/like/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setIsLiked(data.liked || false)
        }
      } catch (error) {
        console.error("Error checking like status:", error)
      } finally {
        setIsChecking(false)
      }
    }

    checkLikeStatus()
  }, [user, postId])

  const handleToggleLike = async () => {
    if (!user) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato per mettere like",
        variant: "destructive",
      })
      return
    }

    if (user.uid === authorId) {
      toast({
        title: "Errore",
        description: "Non puoi mettere like al tuo post",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const token = await getFirebaseIdToken()
      if (!token) {
        throw new Error("Token non disponibile")
      }

      const endpoint = `/api/posts/${postId}/like`
      const method = isLiked ? "DELETE" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Errore nel like")
      }

      const result = await response.json()

      // Optimistic update
      const newLiked = method === "POST"
      const newCount = newLiked ? likesCount + 1 : Math.max(0, likesCount - 1)

      setIsLiked(newLiked)
      setLikesCount(newCount)
      onLikeChange?.(newLiked, newCount)

      // Refresh NeuroCredits stats if on neurocredits page
      if (typeof window !== "undefined" && window.location.pathname === "/neurocredits") {
        window.dispatchEvent(new CustomEvent("refreshNeuroCredits"))
      }
    } catch (error: any) {
      console.error("Error toggling like:", error)
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare il like",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <FiHeart className="h-4 w-4 mr-2" />
        {likesCount}
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggleLike}
      disabled={isLoading || !user || user.uid === authorId}
      className={`motion-safe:active:scale-[0.98] transition-transform motion-reduce:transition-none ${
        isLiked ? "text-red-500 hover:text-red-600" : ""
      }`}
    >
      <FiHeart className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
      {likesCount}
    </Button>
  )
}

