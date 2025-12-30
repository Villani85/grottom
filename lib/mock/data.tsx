import type {
  User,
  Course,
  Lesson,
  Post,
  AdminSettings,
  NewsletterCampaign,
  GameScore,
  PointsTransaction,
  Message,
  Conversation,
} from "@/lib/types"

// Mock Users
export const mockUsers: User[] = [
  {
    uid: "demo-user-1",
    email: "demo@example.com",
    nickname: "DemoUser",
    avatarUrl: "/diverse-user-avatars.png",
    pointsTotal: 150,
    subscriptionStatus: "active",
    subscriptionEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isManualSubscription: false,
    isAdmin: true,
    marketingOptIn: true,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
    updatedAt: new Date(),
  },
  {
    uid: "demo-user-2",
    email: "mario.rossi@example.com",
    nickname: "MarioRossi",
    avatarUrl: "/diverse-user-avatars.png",
    pointsTotal: 320,
    subscriptionStatus: "active",
    subscriptionEnd: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    isManualSubscription: false,
    isAdmin: false,
    marketingOptIn: true,
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    uid: "demo-user-3",
    email: "giulia.verdi@example.com",
    nickname: "GiuliaV",
    avatarUrl: "/diverse-user-avatars.png",
    pointsTotal: 95,
    subscriptionStatus: "none",
    isManualSubscription: false,
    isAdmin: false,
    marketingOptIn: false,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    uid: "demo-user-4",
    email: "luca.bianchi@example.com",
    nickname: "LucaBianchi",
    avatarUrl: "/diverse-user-avatars.png",
    pointsTotal: 580,
    subscriptionStatus: "active",
    subscriptionEnd: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    isManualSubscription: true,
    isAdmin: false,
    marketingOptIn: true,
    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    uid: "demo-user-5",
    email: "sara.ferrari@example.com",
    nickname: "SaraF",
    avatarUrl: "/diverse-user-avatars.png",
    pointsTotal: 45,
    subscriptionStatus: "expired",
    subscriptionEnd: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    isManualSubscription: false,
    isAdmin: false,
    marketingOptIn: true,
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
]

// Mock Courses
export const mockCourses: Course[] = [
  {
    id: "course-1",
    title: "Fondamenti di Neuroscienza Applicata",
    description:
      "Scopri come funziona il cervello e impara tecniche scientificamente provate per migliorare memoria, concentrazione e prestazioni cognitive.",
    thumbnailUrl: "/brain-science-course.jpg",
    category: "Neuroscienza",
    published: true,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: "course-2",
    title: "Tecniche Avanzate di Memorizzazione",
    description:
      "Padroneggia i metodi più efficaci per memorizzare qualsiasi informazione: dal Palazzo della Memoria alle tecniche mnemoniche avanzate.",
    thumbnailUrl: "/memory-enhancement.jpg",
    category: "Memory Hacking",
    published: true,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: "course-3",
    title: "Focus e Concentrazione Estrema",
    description:
      "Elimina le distrazioni e raggiungi stati di flow profondo con protocolli scientifici di allenamento mentale.",
    thumbnailUrl: "/focus-concentration.jpg",
    category: "Produttività",
    published: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: "course-4",
    title: "Biohacking Cognitivo",
    description: "Ottimizza le tue prestazioni mentali attraverso nutrizione, integrazione, sonno e stile di vita.",
    thumbnailUrl: "/placeholder.svg?height=400&width=600",
    category: "Biohacking",
    published: false,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
]

// Mock Lessons
export const mockLessons: Lesson[] = [
  {
    id: "lesson-1-1",
    courseId: "course-1",
    title: "Introduzione alla Neuroplasticità",
    description: "Scopri come il cervello può cambiare e adattarsi durante tutta la vita.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    duration: 1200, // 20 minutes
    order: 1,
    published: true,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
  },
  {
    id: "lesson-1-2",
    courseId: "course-1",
    title: "Le Basi della Memoria",
    description: "Come funziona la memoria e perché dimentichiamo.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    duration: 900,
    order: 2,
    published: true,
    createdAt: new Date(Date.now() - 59 * 24 * 60 * 60 * 1000),
  },
  {
    id: "lesson-1-3",
    courseId: "course-1",
    title: "Neurotrasmettitori e Prestazioni Cognitive",
    description: "Il ruolo di dopamina, serotonina e altri neurotrasmettitori nelle performance mentali.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    duration: 1500,
    order: 3,
    published: true,
    createdAt: new Date(Date.now() - 58 * 24 * 60 * 60 * 1000),
  },
  {
    id: "lesson-2-1",
    courseId: "course-2",
    title: "Il Metodo del Palazzo della Memoria",
    description: "Costruisci il tuo palazzo mentale per memorizzare infinite informazioni.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    duration: 1800,
    order: 1,
    published: true,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
  },
  {
    id: "lesson-2-2",
    courseId: "course-2",
    title: "Sistemi di Conversione Fonetica",
    description: "Trasforma numeri in parole per memorizzare date, numeri di telefono e codici.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    duration: 1350,
    order: 2,
    published: true,
    createdAt: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000),
  },
  {
    id: "lesson-3-1",
    courseId: "course-3",
    title: "Protocollo di Deep Work",
    description: "Struttura le tue giornate per massimizzare focus e produttività.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    duration: 1650,
    order: 1,
    published: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
]

// Mock Posts (Community Feed)
export const mockPosts: Post[] = [
  // Note: These mock posts now include 'title' field
  {
    id: "post-1",
    userId: "demo-user-2",
    userNickname: "MarioRossi",
    userAvatar: "/diverse-user-avatars.png",
    title: "Completato corso Neuroplasticità!",
    content:
      "Ho appena completato il corso sulla neuroplasticità! Incredibile come il nostro cervello possa cambiare a qualsiasi età. 🧠✨",
    published: true,
    likesCount: 24,
    commentsCount: 7,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "post-2",
    userId: "demo-user-4",
    userNickname: "LucaBianchi",
    userAvatar: "/diverse-user-avatars.png",
    title: "Palazzo della Memoria: Game Changer!",
    content:
      "Consiglio a tutti: provate il Palazzo della Memoria per studiare! Ho memorizzato 50 termini di biologia in 30 minuti. Game changer! 🏛️",
    imageUrl: "/memory-enhancement.jpg",
    published: true,
    likesCount: 42,
    commentsCount: 15,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: "post-3",
    userId: "demo-user-1",
    userNickname: "DemoUser",
    userAvatar: "/diverse-user-avatars.png",
    title: "Nuovo Corso: Biohacking Cognitivo",
    content:
      "Nuovo corso in arrivo la prossima settimana: Biohacking Cognitivo! Preparatevi ad ottimizzare ogni aspetto delle vostre performance mentali. 🚀",
    published: true,
    likesCount: 67,
    commentsCount: 23,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: "post-4",
    userId: "demo-user-2",
    userNickname: "MarioRossi",
    userAvatar: "/diverse-user-avatars.png",
    title: "Protocollo Deep Work: Risultati",
    content:
      "Chi ha provato il protocollo di Deep Work? Riesco a lavorare concentrato per 4 ore senza distrazioni. Pazzesco!",
    published: true,
    likesCount: 31,
    commentsCount: 19,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
    updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
  },
]

// Mock Admin Settings
export const mockAdminSettings: AdminSettings = {
  communityVisibility: "subscribers_only",
  billingPlansEnabled: "monthly_and_yearly",
  updatedAt: new Date(),
}

// Mock Newsletter Campaigns
export const mockNewsletterCampaigns: NewsletterCampaign[] = [
  {
    id: "campaign-1",
    subject: "Benvenuto in Brain Hacking Academy! 🧠",
    fromName: "Brain Hacking Academy",
    fromEmail: "onboarding@resend.dev",
    replyTo: "onboarding@resend.dev",
    html: "<h1>Benvenuto!</h1><p>Siamo felici di averti con noi. Inizia subito il tuo percorso di trasformazione mentale.</p>",
    status: "sent",
    audience: {
      include: ["all"],
      excludeBanned: true,
    },
    createdBy: "demo-user-1",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: "campaign-2",
    subject: "Nuovo Corso: Tecniche Avanzate di Memorizzazione",
    fromName: "Brain Hacking Academy",
    fromEmail: "onboarding@resend.dev",
    replyTo: "onboarding@resend.dev",
    html: "<h1>Nuovo Corso Disponibile!</h1><p>Scopri le tecniche più avanzate per potenziare la tua memoria.</p>",
    status: "sent",
    audience: {
      include: ["subscribers_active"],
      excludeBanned: true,
    },
    createdBy: "demo-user-1",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
  },
  {
    id: "campaign-3",
    subject: "Tips Settimanali: 5 Modi per Migliorare il Focus",
    fromName: "Brain Hacking Academy",
    fromEmail: "onboarding@resend.dev",
    replyTo: "onboarding@resend.dev",
    html: "<h1>Tips della Settimana</h1><p>Ecco 5 strategie scientificamente provate per aumentare la concentrazione.</p>",
    status: "draft",
    audience: {
      include: ["all"],
      excludeBanned: true,
    },
    createdBy: "demo-user-1",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
]

// Mock Game Scores (for leaderboard)
export const mockGameScores: GameScore[] = [
  {
    id: "score-1",
    userId: "demo-user-4",
    userNickname: "LucaBianchi",
    gameName: "Memory Match",
    score: 2450,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "score-2",
    userId: "demo-user-2",
    userNickname: "MarioRossi",
    gameName: "Memory Match",
    score: 2100,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: "score-3",
    userId: "demo-user-1",
    userNickname: "DemoUser",
    gameName: "Memory Match",
    score: 1890,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
  },
  {
    id: "score-4",
    userId: "demo-user-4",
    userNickname: "LucaBianchi",
    gameName: "Number Recall",
    score: 3200,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: "score-5",
    userId: "demo-user-2",
    userNickname: "MarioRossi",
    gameName: "Number Recall",
    score: 2850,
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
  },
]

// Mock Points Transactions
export const mockPointsTransactions: PointsTransaction[] = [
  {
    id: "tx-1",
    userId: "demo-user-1",
    amount: 50,
    type: "video_watched",
    referenceId: "lesson-1-1",
    description: "Video completato: Introduzione alla Neuroplasticità",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "tx-2",
    userId: "demo-user-1",
    amount: 25,
    type: "comment_posted",
    referenceId: "comment-123",
    description: "Commento pubblicato su una lezione",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: "tx-3",
    userId: "demo-user-1",
    amount: 10,
    type: "daily_login",
    description: "Login giornaliero",
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
  },
  {
    id: "tx-4",
    userId: "demo-user-1",
    amount: 100,
    type: "game_completed",
    referenceId: "game-memory-match",
    description: "Gioco completato: Memory Match",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
]

// Mock Conversations
export const mockConversations: Conversation[] = [
  {
    id: "conv-1",
    participantIds: ["demo-user-1", "demo-user-2"],
    lastMessageId: "msg-3",
    lastMessageAt: new Date(Date.now() - 30 * 60 * 1000),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: "conv-2",
    participantIds: ["demo-user-1", "demo-user-4"],
    lastMessageId: "msg-5",
    lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
]

// Mock Messages
export const mockMessages: Message[] = [
  {
    id: "msg-1",
    conversationId: "conv-1",
    fromUserId: "demo-user-2",
    toUserId: "demo-user-1",
    content: "Ciao! Hai visto l'ultima lezione sulla neuroplasticità?",
    read: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "msg-2",
    conversationId: "conv-1",
    fromUserId: "demo-user-1",
    toUserId: "demo-user-2",
    content: "Sì, molto interessante! Sto già applicando alcune tecniche.",
    read: true,
    createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
  },
  {
    id: "msg-3",
    conversationId: "conv-1",
    fromUserId: "demo-user-2",
    toUserId: "demo-user-1",
    content: "Fantastico! Quali tecniche stai usando?",
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: "msg-4",
    conversationId: "conv-2",
    fromUserId: "demo-user-4",
    toUserId: "demo-user-1",
    content: "Grazie per il consiglio sul Palazzo della Memoria!",
    read: true,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    id: "msg-5",
    conversationId: "conv-2",
    fromUserId: "demo-user-1",
    toUserId: "demo-user-4",
    content: "Di nulla! Sono contento che ti sia utile.",
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
]
