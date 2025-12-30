"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { SubscriptionRequired } from "@/components/SubscriptionRequired"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft } from "lucide-react"
import { LikeButton } from "@/components/posts/LikeButton"
import { CommentComposer } from "@/components/posts/CommentComposer"
import { CommentsList } from "@/components/posts/CommentsList"
import { formatDistanceToNow } from "date-fns"
import { it } from "date-fns/locale"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Post {
  id: string
  authorId: string
  authorName: string
  authorAvatarUrl: string | null
  text: string
  createdAt: string
  likesCount: number
  commentsCount: number
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>
}) {
  const { postId } = use(params)
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPost()
  }, [postId])

  const fetchPost = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/posts/${postId}`)
      if (!response.ok) {
        if (response.status === 404) {
          router.push("/bacheca")
          return
        }
        throw new Error("Failed to fetch post")
      }

      const data = await response.json()
      setPost(data)
    } catch (error) {
      console.error("Error fetching post:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCommentAdded = () => {
    // Refresh post to update comments count
    fetchPost()
  }

  const handleCommentDeleted = () => {
    // Refresh post to update comments count
    fetchPost()
  }

  const handleLikeChange = (liked: boolean, newCount: number) => {
    if (post) {
      setPost({ ...post, likesCount: newCount })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: it,
      })
    } catch {
      return "poco fa"
    }
  }

  if (isLoading) {
    return (
      <SubscriptionRequired>
        <div className="py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005FD7] mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Caricamento post...</p>
            </CardContent>
          </Card>
        </div>
      </SubscriptionRequired>
    )
  }

  if (!post) {
    return (
      <SubscriptionRequired>
        <div className="py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Post non trovato</p>
              <Button onClick={() => router.push("/bacheca")} className="mt-4">
                Torna alla bacheca
              </Button>
            </CardContent>
          </Card>
        </div>
      </SubscriptionRequired>
    )
  }

  return (
    <SubscriptionRequired>
      <div className="py-8 space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/bacheca")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna alla bacheca
        </Button>

        {/* Post Detail */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <Link href={`/u/${post.authorId}`}>
                <Avatar className="cursor-pointer hover:ring-2 ring-[#005FD7]/50 transition-all">
                  <AvatarImage src={post.authorAvatarUrl || undefined} alt={post.authorName} />
                  <AvatarFallback>{getInitials(post.authorName)}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/u/${post.authorId}`}>
                  <h3 className="font-semibold hover:text-[#005FD7] transition-colors cursor-pointer">
                    {post.authorName}
                  </h3>
                </Link>
                <p className="text-sm text-muted-foreground">{formatDate(post.createdAt)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="whitespace-pre-wrap break-words">{post.text}</p>
            </div>
            <div className="flex items-center gap-4 pt-4 border-t">
              <LikeButton
                postId={post.id}
                authorId={post.authorId}
                initialLikesCount={post.likesCount}
                onLikeChange={handleLikeChange}
              />
              <span className="text-sm text-muted-foreground">
                💬 {post.commentsCount} commenti
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Commenti</h2>
          </CardHeader>
          <CardContent className="space-y-6">
            <CommentComposer postId={postId} onCommentAdded={handleCommentAdded} />
            <CommentsList postId={postId} onCommentDeleted={handleCommentDeleted} />
          </CardContent>
        </Card>
      </div>
    </SubscriptionRequired>
  )
}

