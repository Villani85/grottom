import type { AdminSettings, AppUser, NewsletterCampaign } from "@/types";

export const defaultAdminSettings: AdminSettings = {
  communityVisibility: "subscribers_only",
  billingPlansEnabled: "monthly_and_yearly",
};

export const demoUsers: AppUser[] = [
  {
    uid: "demo_admin",
    email: "admin@example.com",
    nickname: "Admin",
    pointsTotal: 420,
    subscriptionStatus: "active",
    isAdmin: true,
    marketingOptIn: true,
  },
  {
    uid: "demo_member",
    email: "member@example.com",
    nickname: "Member",
    pointsTotal: 120,
    subscriptionStatus: "active",
    marketingOptIn: true,
  },
  {
    uid: "demo_free",
    email: "free@example.com",
    nickname: "FreeUser",
    pointsTotal: 10,
    subscriptionStatus: "none",
    marketingOptIn: false,
  },
];

export const demoNewsletterDraft: NewsletterCampaign = {
  id: "demo_campaign",
  status: "draft",
  subject: "Benvenuto nella piattaforma 🎮",
  fromName: "Your Brand",
  fromEmail: "no-reply@example.com",
  replyTo: "support@example.com",
  html: "<h1>Ciao!</h1><p>Questa è una newsletter demo.</p>",
  audience: { include: ["all"], excludeBanned: true, marketing: false },
  createdBy: "demo_admin",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
