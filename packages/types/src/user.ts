// User & Billing Types (SaaS-specific)

// UserPlan is defined in pricing.ts — re-export for convenience
export type { UserPlan } from "./pricing";
import type { UserPlan } from "./pricing";

export type FundingSource = "byok" | "credits" | "free_tier" | "trial";

export type CreditTransactionType = "purchase" | "debate_usage" | "refund";

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  plan: UserPlan;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  creditBalance: number;
  freeDebatesUsed: number;
  bio: string | null;
  location: string | null;
  isPublicProfile: boolean;
  isFoundingMember: boolean;
  foundingOfferExpiresAt: string | null;
  gracePeriodEndsAt: string | null;
  trialEndsAt: string | null;
  featuresSeenAt: string | null;
  preferredSignIn: "magic_link" | "passkey" | "password";
  magicLinkEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageStats {
  debatesThisMonth: number;
  debatesLimit: number | null;
  creditsUsed: number;
  creditsRemaining: number;
  totalDebatesAllTime: number;
  avgCostPerDebate: number;
  topProviders: Array<{ provider: string; count: number }>;
}

export interface CreditBalance {
  balance: number;
  lastPurchaseAt: Date | null;
  lifetimePurchased: number;
  lifetimeUsed: number;
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  config: import("./api-key").ApiKeyConfig;
  lastUsedAt: Date | null;
  createdAt: Date;
}
