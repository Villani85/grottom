"use client"

import { useEffect, useRef } from "react"
import Script from "next/script"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Declare IVS Player types (SDK will be loaded dynamically)
declare global {
  interface Window {
    IVSPlayer: any
  }
}

export default function LivePage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<any>(null)

  const playbackUrl = process.env.NEXT_PUBLIC_IVS_PLAYBACK_URL

  useEffect(() => {
    if (!playbackUrl) {
      console.error("NEXT_PUBLIC_IVS_PLAYBACK_URL not set")
      return
    }

    // Initialize player when SDK is ready
    const initPlayer = () => {
      if (!window.IVSPlayer || !videoRef.current) return

      try {
        const player = window.IVSPlayer.create()
        player.attachHTMLVideoElement(videoRef.current)
        player.load(playbackUrl)
        playerRef.current = player
      } catch (err) {
        console.error("Error initializing IVS player:", err)
      }
    }

    // Check if SDK is already loaded
    if (window.IVSPlayer) {
      initPlayer()
    } else {
      // Wait for SDK to load
      const checkInterval = setInterval(() => {
        if (window.IVSPlayer) {
          clearInterval(checkInterval)
          initPlayer()
        }
      }, 100)

      // Cleanup
      return () => {
        clearInterval(checkInterval)
        if (playerRef.current) {
          try {
            playerRef.current.delete()
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      }
    }
  }, [playbackUrl])

  if (!playbackUrl) {
    return (
      <div className="py-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Stream non disponibile. Configura NEXT_PUBLIC_IVS_PLAYBACK_URL.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="py-8">
      <Script
        src="https://player.live-video.net/1.4.1/amazon-ivs-player.min.js"
        strategy="afterInteractive"
      />

      <Card>
        <CardHeader>
          <CardTitle>Diretta Live</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
            <video
              ref={videoRef}
              className="w-full h-full bg-black rounded-lg"
              playsInline
              controls
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


