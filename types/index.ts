export type SubscriptionStatus = "none" | "active" | "past_due" | "canceled";

export type AppUser = {
  uid: string;
  email: string;
  nickname: string;
  avatarUrl?: string;
  pointsTotal: number;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEnd?: string;
  isManualSubscription?: boolean;
  isAdmin?: boolean;
  marketingOptIn?: boolean;
  banned?: boolean;
};

export type AdminSettings = {
  communityVisibility: "subscribers_only" | "authenticated";
  billingPlansEnabled: "yearly_only" | "monthly_and_yearly";
};

export type PointsTransaction = {
  txId: string;
  uid: string;
  delta: number;
  reason: string;
  createdAt: string;
};

export type Comment = {
  id: string;
  uid: string;
  lessonId: string;
  body: string;
  createdAt: string;
};

export type NewsletterAudienceInclude = "subscribers_active" | "non_subscribers" | "all";
export type NewsletterStatus = "draft" | "scheduled" | "sending" | "sent" | "failed";

export type NewsletterCampaign = {
  id: string;
  status: NewsletterStatus;
  subject: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  html: string;
  audience: {
    include: NewsletterAudienceInclude[];
    excludeBanned: boolean;
    marketing: boolean;
  };
  scheduledAt?: string;
  lastUserIdProcessed?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type NewsletterSendStatus = "pending" | "sent" | "failed";
export type NewsletterSendLog = {
  id: string;
  campaignId: string;
  toUserId: string;
  toEmail: string;
  status: NewsletterSendStatus;
  error?: string;
  createdAt: string;
  updatedAt: string;
};
