"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  FiEdit,
  FiSave,
  FiX,
  FiAward,
  FiCalendar,
  FiMail,
  FiUser,
  FiMapPin,
  FiGlobe,
  FiTwitter,
  FiLinkedin,
  FiInstagram,
  FiFacebook,
  FiPlus,
  FiX as FiXIcon,
  FiTrendingUp,
  FiExternalLink,
} from "react-icons/fi"
import { FaTrophy } from "react-icons/fa"
import { getFirebaseIdToken } from "@/lib/api-helpers"
import { getPeriodId } from "@/lib/neurocredits-rules"
import Link from "next/link"

export default function ProfilePage() {
  const { user, isLoading, refreshUser } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    nickname: "",
    email: "",
  })
  const [points, setPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [derivedStats, setDerivedStats] = useState<any>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (user) {
      setFormData({
        nickname: user.nickname || "",
        email: user.email || "",
        avatarUrl: user.avatarUrl || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        publicEmail: user.publicEmail || false,
        interests: user.interests || [],
        socialLinks: user.socialLinks || {
          twitter: "",
          linkedin: "",
          instagram: "",
          facebook: "",
        },
        newInterest: "",
      })
      setPoints(user.pointsTotal || 0)
      loadDerivedStats()
      setLoading(false)
    }
  }, [user])

  const loadDerivedStats = async () => {
    try {
      const token = await getFirebaseIdToken()
      if (!token) return

      const res = await fetch("/api/profile/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        setDerivedStats(data.derivedStats)
      }
    } catch (error) {
      console.error("Error loading derived stats:", error)
    }
  }

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/users/${user?.uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setIsEditing(false)
        await refreshUser()
      }
    } catch (error) {
      console.error("Error updating profile:", error)
    }
  }

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#005FD7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Caricamento profilo...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Profilo</h1>
          <p className="text-muted-foreground">Gestisci le tue informazioni personali</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            <FiEdit className="h-4 w-4 mr-2" />
            Modifica
          </Button>
        )}
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informazioni Personali</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.nickname} className="w-full h-full rounded-full" />
              ) : (
                <FiUser className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <div>
              <div className="font-semibold text-lg">{user.nickname}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="nickname">Nickname</Label>
                <Input
                  id="nickname"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-2"
                  disabled
                />
                <p className="text-xs text-muted-foreground mt-1">L'email non può essere modificata</p>
              </div>
              <div>
                <Label htmlFor="avatarUrl">URL Avatar (opzionale)</Label>
                <Input
                  id="avatarUrl"
                  type="url"
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  className="mt-2"
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="bio">Biografia Pubblica (opzionale)</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="mt-2 min-h-[100px]"
                  placeholder="Racconta qualcosa di te che sarà visibile pubblicamente..."
                />
              </div>
              <div>
                <Label htmlFor="location">Località (opzionale)</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="mt-2"
                  placeholder="Es: Milano, Italia"
                />
              </div>
              <div>
                <Label htmlFor="website">Sito Web (opzionale)</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="mt-2"
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="publicEmail"
                  checked={formData.publicEmail}
                  onChange={(e) => setFormData({ ...formData, publicEmail: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="publicEmail" className="cursor-pointer">
                  Mostra email pubblicamente
                </Label>
              </div>
              <div>
                <Label>Interessi (opzionale)</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={formData.newInterest}
                    onChange={(e) => setFormData({ ...formData, newInterest: e.target.value })}
                    placeholder="Aggiungi interesse..."
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && formData.newInterest.trim()) {
                        e.preventDefault()
                        setFormData({
                          ...formData,
                          interests: [...formData.interests, formData.newInterest.trim()],
                          newInterest: "",
                        })
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (formData.newInterest.trim()) {
                        setFormData({
                          ...formData,
                          interests: [...formData.interests, formData.newInterest.trim()],
                          newInterest: "",
                        })
                      }
                    }}
                  >
                    <FiPlus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-800 rounded-full text-sm flex items-center gap-2"
                      >
                        {interest}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              interests: formData.interests.filter((_, i) => i !== index),
                            })
                          }}
                          className="hover:text-red-400"
                        >
                          <FiXIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label>Link Social (opzionali)</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    <FiTwitter className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="url"
                      value={formData.socialLinks.twitter}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialLinks: { ...formData.socialLinks, twitter: e.target.value },
                        })
                      }
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <FiLinkedin className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="url"
                      value={formData.socialLinks.linkedin}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialLinks: { ...formData.socialLinks, linkedin: e.target.value },
                        })
                      }
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <FiInstagram className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="url"
                      value={formData.socialLinks.instagram}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialLinks: { ...formData.socialLinks, instagram: e.target.value },
                        })
                      }
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <FiFacebook className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="url"
                      value={formData.socialLinks.facebook}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          socialLinks: { ...formData.socialLinks, facebook: e.target.value },
                        })
                      }
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave}>
                  <FiSave className="h-4 w-4 mr-2" />
                  Salva
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <FiX className="h-4 w-4 mr-2" />
                  Annulla
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <FiUser className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Nickname</div>
                  <div className="font-semibold">{user.nickname}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FiMail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-semibold">{user.email}</div>
                </div>
              </div>
              {user.bio && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Biografia Pubblica</div>
                  <div className="font-semibold">{user.bio}</div>
                </div>
              )}
              {user.location && (
                <div className="flex items-center gap-3">
                  <FiMapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Località</div>
                    <div className="font-semibold">{user.location}</div>
                  </div>
                </div>
              )}
              {user.website && (
                <div className="flex items-center gap-3">
                  <FiGlobe className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">Sito Web</div>
                    <a 
                      href={user.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-semibold text-[#005FD7] hover:underline"
                    >
                      {user.website}
                    </a>
                  </div>
                </div>
              )}
              {user.interests && user.interests.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Interessi</div>
                  <div className="flex flex-wrap gap-2">
                    {user.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-800 rounded-full text-sm"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-4">
                <Button variant="outline" onClick={() => router.push(`/u/${user.uid}`)}>
                  Vedi Profilo Pubblico
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progressi Section */}
      {derivedStats && (
        <Card className="bg-gradient-to-br from-[#005FD7]/20 to-purple-600/20 border-[#005FD7]/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FaTrophy className="h-5 w-5" />
              Progressi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Level Badge */}
            <div className="flex items-center gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Livello Attuale</div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#005FD7] text-white text-lg px-3 py-1">{derivedStats.level.levelId}</Badge>
                  <span className="text-xl font-bold">{derivedStats.level.title}</span>
                </div>
              </div>
            </div>

            {/* NeuroCredits */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">NeuroCredits Totali</div>
                <div className="text-2xl font-bold">{derivedStats.neuroCredits_total.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Questo Mese</div>
                <div className="text-2xl font-bold">{derivedStats.neuroCredits_month_current.toLocaleString()}</div>
              </div>
            </div>

            {/* Rank */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Classifica All-Time</div>
                <div className="text-xl font-bold">
                  {derivedStats.rank.all_time ? `#${derivedStats.rank.all_time}` : "Fuori dalla top 200"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Classifica Mese Corrente</div>
                <div className="text-xl font-bold">
                  {derivedStats.rank.month_current ? `#${derivedStats.rank.month_current}` : "Fuori dalla top 200"}
                </div>
              </div>
            </div>

            {/* Progress to Next Level */}
            {derivedStats.level.nextLevelPoints && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progresso al Livello {derivedStats.level.levelId + 1}</span>
                  <span className="text-sm text-muted-foreground">
                    {derivedStats.neuroCredits_total.toLocaleString()} / {derivedStats.level.nextLevelPoints.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-[#005FD7] to-purple-600 h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        ((derivedStats.neuroCredits_total - derivedStats.level.minPoints) /
                          (derivedStats.level.nextLevelPoints - derivedStats.level.minPoints)) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {derivedStats.level.pointsToNext.toLocaleString()} punti mancanti al prossimo livello
                </p>
              </div>
            )}

            {/* Link to Leaderboard */}
            <Link href={`/neurocredits?period=${getPeriodId()}&metric=neuroCredits`}>
              <Button variant="outline" className="w-full">
                <FiExternalLink className="h-4 w-4 mr-2" />
                Vedi Leaderboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <FiAward className="h-6 w-6 text-yellow-500" />
              <div className="text-sm text-muted-foreground">Punti Totali</div>
            </div>
            <div className="text-2xl font-bold">{points}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <FiCalendar className="h-6 w-6 text-blue-500" />
              <div className="text-sm text-muted-foreground">Membro dal</div>
            </div>
            <div className="text-2xl font-bold">
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString("it-IT", { month: "short", year: "numeric" })
                : "N/A"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <FiUser className="h-6 w-6 text-purple-500" />
              <div className="text-sm text-muted-foreground">Stato Abbonamento</div>
            </div>
            <div className="text-2xl font-bold capitalize">{user.subscriptionStatus || "Nessuno"}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

