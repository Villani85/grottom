"use client"

import { useState, useEffect, useRef } from "react"
import { SubscriptionRequired } from "@/components/SubscriptionRequired"
import { Card, CardContent } from "@/components/ui/card"
import { PostComposerMagnetic, type PostComposerMagneticRef } from "@/components/posts/PostComposerMagnetic"
import { PostCard } from "@/components/posts/PostCard"
import { PostListSkeleton } from "@/components/posts/PostListSkeleton"
import { PageHeader } from "@/components/layout/PageHeader"
import { BachecaSidebar } from "@/components/posts/BachecaSidebar"
import { Button } from "@/components/ui/button"
import { FiRefreshCw } from "react-icons/fi"

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

export default function BachecaPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const composerRef = useRef<PostComposerMagneticRef>(null)

  const fetchPosts = async (cursor: string | null = null, append: boolean = false) => {
    try {
      if (cursor) {
        setIsLoadingMore(true)
      } else {
        setIsLoading(true)
      }

      const url = cursor
        ? `/api/posts?limit=20&cursor=${cursor}`
        : "/api/posts?limit=20"

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Failed to fetch posts")
      }

      const data = await response.json()

      if (append) {
        setPosts((prev) => [...prev, ...data.posts])
      } else {
        setPosts(data.posts)
      }

      setNextCursor(data.nextCursor)
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handlePostCreated = () => {
    // Refresh posts from the beginning
    fetchPosts(null, false)
  }

  const handleLikeChange = (postId: string, liked: boolean, newCount: number) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, likesCount: newCount }
          : post
      )
    )
  }

  return (
    <SubscriptionRequired>
      <div className="py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Page Header */}
            <PageHeader
              title="Bacheca"
              subtitle="Condividi spunti, risorse e riflessioni con la community."
              action={{
                label: "Scrivi un post",
                onClick: () => {
                  // Scroll to composer
                  document.getElementById("post-composer")?.scrollIntoView({ behavior: "smooth" })
                  // Expand composer after scroll
                  setTimeout(() => {
                    composerRef.current?.expand()
                  }, 200)
                },
              }}
            />

            {/* Post Composer Magnetic */}
            <div id="post-composer">
              <PostComposerMagnetic ref={composerRef} onPostCreated={handlePostCreated} />
            </div>

            {/* Posts List */}
            {isLoading ? (
              <PostListSkeleton count={4} />
            ) : posts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">Nessun post ancora. Sii il primo a condividere qualcosa!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts.map((post, index) => (
                  <div
                    key={post.id}
                    className="opacity-0 animate-slide-up"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animationFillMode: "forwards",
                      animationDuration: "0.4s",
                    }}
                  >
                    <PostCard post={post} onLikeChange={handleLikeChange} />
                  </div>
                ))}

                {nextCursor && (
                  <div className="text-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => fetchPosts(nextCursor, true)}
                      disabled={isLoadingMore}
                    >
                      {isLoadingMore ? "Caricamento..." : "Carica altri post"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar (Desktop only) */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <BachecaSidebar />
            </div>
          </div>
        </div>
      </div>
    </SubscriptionRequired>
  )
}

