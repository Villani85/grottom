// Core type definitions for the platform

export interface User {
  uid: string
  email: string
  nickname: string
  avatarUrl?: string
  pointsTotal: number
  subscriptionStatus: "none" | "active" | "cancelled" | "expired"
  subscriptionEnd?: Date
  isManualSubscription: boolean
  isAdmin: boolean
  marketingOptIn: boolean
  // Public profile data
  bio?: string // Biografia pubblica
  interests?: string[] // Interessi pubblici
  location?: string // Località (opzionale)
  website?: string // Sito web personale
  socialLinks?: {
    twitter?: string
    linkedin?: string
    instagram?: string
    facebook?: string
  }
  publicEmail?: boolean // Se true, mostra email pubblicamente
  createdAt: Date
  updatedAt: Date
}

export interface Course {
  id: string
  title: string
  description: string
  thumbnailUrl?: string
  category: string
  published: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Lesson {
  id: string
  courseId: string
  title: string
  description: string
  videoUrl: string
  duration: number // in seconds
  order: number
  published: boolean
  createdAt: Date
}

export interface Comment {
  id: string
  lessonId: string
  userId: string
  userNickname: string
  userAvatar?: string
  content: string
  createdAt: Date
}

export interface Post {
  id: string
  userId: string
  userNickname: string
  userAvatar?: string
  title: string // Oggetto/titolo del post
  content: string // Testo formattato (Markdown o HTML)
  imageUrl?: string
  published: boolean
  scheduledAt?: Date
  likesCount: number
  commentsCount: number
  createdAt: Date
  updatedAt: Date
}

export interface PostComment {
  id: string
  postId: string
  userId: string
  userNickname: string
  userAvatar?: string
  content: string
  createdAt: Date
}

export interface PointsTransaction {
  id: string
  userId: string
  amount: number
  type: "video_watched" | "comment_posted" | "post_created" | "game_completed" | "daily_login" | "manual"
  referenceId?: string // e.g., lessonId, postId
  description: string
  createdAt: Date
}

export interface NewsletterCampaign {
  id: string
  subject: string
  fromName: string
  fromEmail: string
  replyTo: string
  html: string
  status: "draft" | "scheduled" | "sending" | "sent" | "failed"
  audience: {
    include: ("subscribers_active" | "non_subscribers" | "all")[]
    excludeBanned: boolean
  }
  scheduledAt?: Date
  lastUserIdProcessed?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface NewsletterSend {
  id: string
  campaignId: string
  toUserId: string
  toEmail: string
  status: "pending" | "sent" | "failed"
  error?: string
  resendId?: string // ID email da Resend API
  resendResponse?: any // Risposta completa da Resend per debugging
  requestDetails?: {
    from: string
    to: string
    subject: string
    replyTo?: string
    method: "batch" | "individual" // Come è stato inviato
  }
  sentAt?: Date
  createdAt: Date
}

export interface AdminSettings {
  communityVisibility: "subscribers_only" | "authenticated"
  billingPlansEnabled: "yearly_only" | "monthly_and_yearly"
  updatedAt: Date
}

export interface GameScore {
  id: string
  userId: string
  userNickname: string
  gameName: string
  score: number
  createdAt: Date
}

export interface Message {
  id: string
  conversationId: string
  fromUserId: string
  toUserId: string
  content: string
  mediaUrl?: string
  mediaType?: "image" | "video" | "file"
  read: boolean
  createdAt: Date
}

export interface Conversation {
  id: string
  participantIds: string[] // Array of 2 user IDs
  lastMessageId?: string
  lastMessageAt?: Date
  createdAt: Date
  updatedAt: Date
}
