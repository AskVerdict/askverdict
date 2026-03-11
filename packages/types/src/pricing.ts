// @askverdict/types - Single source of truth for pricing, plans, and feature constants

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

export type UserPlan = "free" | "starter" | "pro" | "enterprise";

/** Billing-relevant debate modes (subset of engine DebateMode) */
export type BillingDebateMode = "instant" | "fast" | "balanced" | "thorough" | "compare";

export type CreditPackType = "credits_50" | "credits_200" | "credits_600";

export type Feature =
  | "sso"
  | "scim"
  | "custom_roles"
  | "api_access"
  | "mfa_enforcement"
  | "advanced_audit"
  | "decision_matrix"
  | "convergence_scores"
  | "argument_graph_heatmap"
  | "file_upload_storage";

// ---------------------------------------------------------------------------
// Debate credit costs
// ---------------------------------------------------------------------------

/**
 * Credits consumed per debate/compare mode.
 * Instant: 1 credit ($0.01 cost, $0.19 margin) - single-pass Quick Take
 * Fast: 1 credit  ($0.03 cost, $0.17 margin)
 * Balanced: 3 credits ($0.08 cost, $0.52 margin)
 * Thorough: 8 credits ($0.14 cost, $1.46 margin)
 * Compare: 5 credits ($0.10 cost, $0.90 margin)
 */
export const DEBATE_CREDIT_COSTS: Record<BillingDebateMode, number> = {
  instant: 1,
  fast: 1,
  balanced: 3,
  thorough: 8,
  compare: 5,
} as const;

// ---------------------------------------------------------------------------
// Credit packs
// ---------------------------------------------------------------------------

export interface CreditPack {
  type: CreditPackType;
  name: string;
  credits: number;
  displayPrice: string;
  priceCents: number;
  highlighted: boolean;
}

export const CREDIT_PACKS: CreditPack[] = [
  { type: "credits_50", name: "Starter", credits: 50, displayPrice: "$1.99", priceCents: 199, highlighted: false },
  { type: "credits_200", name: "Standard", credits: 200, displayPrice: "$5.99", priceCents: 599, highlighted: true },
  { type: "credits_600", name: "Power", credits: 600, displayPrice: "$14.99", priceCents: 1499, highlighted: false },
];

/** Credit amounts awarded per pack purchase */
export const CREDIT_AMOUNTS: Record<CreditPackType, number> = {
  credits_50: 50,
  credits_200: 200,
  credits_600: 600,
};

// ---------------------------------------------------------------------------
// Subscription plan intervals (Starter + Pro)
// ---------------------------------------------------------------------------

export const STARTER_PLAN = {
  monthly: { displayPrice: "$4.99", priceCents: 499, creditsPerMonth: 200 },
  annual: { displayPrice: "$3.99", priceCents: 399, creditsPerMonth: 200 },
} as const;

export const PRO_PLAN = {
  monthly: { displayPrice: "$14.99", priceCents: 1499, creditsPerMonth: 700 },
  annual: { displayPrice: "$11.99", priceCents: 1199, creditsPerMonth: 700 },
} as const;

// ---------------------------------------------------------------------------
// Free tier
// ---------------------------------------------------------------------------

export const FREE_TIER = {
  lifetimeDebates: 3,
  allowedModes: ["instant", "fast"] as BillingDebateMode[],
} as const;

// ---------------------------------------------------------------------------
// BYOK debate limits (per plan, when user enables own API keys)
// ---------------------------------------------------------------------------

/**
 * Monthly debate cap when using own API keys (BYOK toggle enabled).
 * -1 means unlimited.
 */
export const BYOK_DEBATE_LIMITS: Record<Exclude<UserPlan, "free">, number> = {
  starter: 500,
  pro: 2000,
  enterprise: -1,
};

// ---------------------------------------------------------------------------
// Seat limits
// ---------------------------------------------------------------------------

/** Per-plan seat limits. -1 means unlimited (enterprise). */
export const SEAT_LIMITS: Record<UserPlan, number> = {
  free: 1,
  starter: 1,
  pro: 25,
  enterprise: -1,
};

// ---------------------------------------------------------------------------
// Monthly credit quotas
// ---------------------------------------------------------------------------

/** Credits included per month per plan. 0 = no subscription credits. */
export const MONTHLY_CREDITS: Record<UserPlan, number> = {
  free: 0,
  starter: 200,
  pro: 700,
  enterprise: 0, // custom
};

// ---------------------------------------------------------------------------
// Feature matrix
// ---------------------------------------------------------------------------

/**
 * Maps each gated feature to the set of plans that unlock it.
 */
export const FEATURE_MATRIX: Record<Feature, UserPlan[]> = {
  sso: ["pro", "enterprise"],
  scim: ["enterprise"],
  custom_roles: ["pro", "enterprise"],
  api_access: ["starter", "pro", "enterprise"],
  mfa_enforcement: ["enterprise"],
  advanced_audit: ["pro", "enterprise"],
  decision_matrix: ["pro", "enterprise"],
  convergence_scores: ["pro", "enterprise"],
  argument_graph_heatmap: ["pro", "enterprise"],
  file_upload_storage: ["pro", "enterprise"],
};

// ---------------------------------------------------------------------------
// Plan display configs
// ---------------------------------------------------------------------------

export interface PlanConfig {
  label: string;
  description: string;
  limits: string[];
  badgeClass: string;
}

export const PLAN_CONFIGS: Record<UserPlan, PlanConfig> = {
  free: {
    label: "Free",
    badgeClass: "bg-white/[0.06] text-white/50 border-white/10",
    description: "Basic access to AskVerdict debates.",
    limits: ["3 lifetime debates", "Fast mode only", "No API access"],
  },
  starter: {
    label: "Starter",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
    description: "200 credits/month for everyday decisions.",
    limits: ["200 credits/month", "All modes (fast, balanced, thorough, compare)", "API access", "Optional: connect your own API keys"],
  },
  pro: {
    label: "Pro",
    badgeClass: "bg-gold-gradient text-gray-900 border-none shadow-[0_2px_8px_-2px_rgba(232,163,23,0.35)]",
    description: "700 credits/month + full analytics suite.",
    limits: [
      "700 credits/month",
      "All modes + compare",
      "Evidence engine + decision matrix",
      "File uploads",
      "Up to 25 seats",
      "Optional: connect your own API keys",
    ],
  },
  enterprise: {
    label: "Enterprise",
    badgeClass: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    description: "Custom SLAs, SSO, and dedicated support.",
    limits: ["Everything in Pro", "Custom SLA", "SSO / SAML", "Dedicated support", "Unlimited seats"],
  },
};

// ---------------------------------------------------------------------------
// Marketing pricing tiers
// ---------------------------------------------------------------------------

export interface PricingFeature {
  label: string;
  included: boolean;
  badge?: "new" | "popular";
}

export interface PricingTier {
  name: string;
  price: string;
  annualPrice?: string;
  annualPeriod?: string;
  annualSavingsPercent?: number;
  period: string;
  description: string;
  features: PricingFeature[];
  highlighted: boolean;
  badge?: string;
  ctaLabel: string;
  ctaHref: string;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Try AskVerdict with basic access.",
    features: [
      { label: "3 lifetime debates", included: true },
      { label: "Fast mode only", included: true },
      { label: "Up to 3 agents", included: true },
      { label: "Fun modes", included: false },
      { label: "Decision frameworks", included: false },
      { label: "Compare mode", included: false },
    ],
    highlighted: false,
    ctaLabel: "Start Free",
    ctaHref: "/login",
  },
  {
    name: "Starter",
    price: "$4.99",
    annualPrice: "$3.99",
    annualPeriod: "/mo, billed yearly",
    annualSavingsPercent: 20,
    period: "/month",
    description: "200 credits/month for everyday decisions.",
    features: [
      { label: "200 credits/month", included: true },
      { label: "All modes (fast, balanced, thorough)", included: true },
      { label: "Compare mode (5 credits)", included: true },
      { label: "Fun modes (Roast, Shark Tank, ELI5, Devil's Advocate)", included: true, badge: "new" },
      { label: "Own API keys (optional)", included: true },
      { label: "Up to 8 agents", included: true },
      { label: "API access", included: true },
      { label: "Decision frameworks", included: false },
      { label: "File uploads", included: false },
    ],
    highlighted: false,
    ctaLabel: "Get Started",
    ctaHref: "/login",
  },
  {
    name: "Pro",
    price: "$14.99",
    annualPrice: "$11.99",
    annualPeriod: "/mo, billed yearly",
    annualSavingsPercent: 20,
    period: "/month",
    description: "700 credits/month with the full analytics suite.",
    features: [
      { label: "700 credits/month", included: true },
      { label: "All modes + compare", included: true },
      { label: "Fun modes (Roast, Shark Tank, ELI5, Devil's Advocate)", included: true, badge: "new" },
      { label: "Decision frameworks (Six Hats, Delphi, Pre-mortem)", included: true, badge: "new" },
      { label: "Evidence Engine (web citations)", included: true },
      { label: "Knowledge Sources", included: true },
      { label: "Own API keys (optional)", included: true },
      { label: "Decision matrix + convergence scores", included: true },
      { label: "File uploads", included: true },
      { label: "Up to 25 seats", included: true },
      { label: "Priority queue + audit logs", included: true },
    ],
    highlighted: true,
    badge: "Best Value",
    ctaLabel: "Go Pro",
    ctaHref: "/login",
  },
  {
    name: "Teams",
    price: "$9.99",
    period: "/seat/month",
    description: "Shared workspace for teams. Pool credits, manage members, and collaborate.",
    features: [
      { label: "100 credits/seat/month (pooled)", included: true },
      { label: "Shared workspace & debates", included: true },
      { label: "Team analytics dashboard", included: true },
      { label: "Role-based access (owner/admin/member)", included: true },
      { label: "Shared API key configuration", included: true },
      { label: "Per-member spending limits", included: true },
      { label: "Up to 25 seats", included: true },
    ],
    highlighted: false,
    badge: "New",
    ctaLabel: "Start Team",
    ctaHref: "/workspaces/new",
  },
];

// ---------------------------------------------------------------------------
// Team/Workspace Plans
// ---------------------------------------------------------------------------

export type WorkspacePlanId = "free" | "team" | "business" | "enterprise";

export interface WorkspacePlan {
  id: WorkspacePlanId;
  name: string;
  description: string;
  pricePerSeat: number;    // monthly USD per seat
  minSeats: number;
  maxSeats: number;
  includedCredits: number; // monthly credits included
  features: string[];
}

export const WORKSPACE_PLANS: Record<WorkspacePlanId, WorkspacePlan> = {
  free: {
    id: "free",
    name: "Free Workspace",
    description: "Basic team collaboration",
    pricePerSeat: 0,
    minSeats: 1,
    maxSeats: 3,
    includedCredits: 10,
    features: ["Up to 3 members", "10 credits/month", "Basic collaboration"],
  },
  team: {
    id: "team",
    name: "Team",
    description: "For growing teams",
    pricePerSeat: 9.99,
    minSeats: 1,
    maxSeats: 25,
    includedCredits: 100,
    features: [
      "Up to 25 members",
      "100 credits/month",
      "$2.99/seat/month",
      "Shared API key config",
      "Spending limits",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    description: "For larger organizations",
    pricePerSeat: 4.99,
    minSeats: 5,
    maxSeats: 100,
    includedCredits: 500,
    features: [
      "Up to 100 members",
      "500 credits/month",
      "$4.99/seat/month",
      "Priority support",
      "Advanced analytics",
      "SSO",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom solution for large orgs",
    pricePerSeat: 0, // custom pricing
    minSeats: 10,
    maxSeats: 9999,
    includedCredits: 0, // custom
    features: [
      "Unlimited members",
      "Custom credits",
      "Custom pricing",
      "Dedicated support",
      "SLA",
      "On-premise option",
    ],
  },
};

// Workspace credit pack pricing (same packs, purchased for workspace pool)
export const WORKSPACE_CREDIT_PACKS = [
  { credits: 50, price: 7.99, popular: false },
  { credits: 150, price: 19.99, popular: true },
  { credits: 500, price: 49.99, popular: false },
  { credits: 1500, price: 129.99, popular: false },
] as const;

export type WorkspaceCreditPack = (typeof WORKSPACE_CREDIT_PACKS)[number];

/** Get display config for a workspace plan. */
export function getWorkspacePlan(id: WorkspacePlanId): WorkspacePlan {
  return WORKSPACE_PLANS[id];
}

// ---------------------------------------------------------------------------
// Founding member
// ---------------------------------------------------------------------------

export const FOUNDING_MEMBER = {
  discountPercent: 100,
  durationMonths: 1,
  totalSlots: 100,
  description: "First 100 users get 1 month free Pro - no credit card required.",
} as const;

// ---------------------------------------------------------------------------
// Agent count limits per plan
// ---------------------------------------------------------------------------

/** Maximum number of agents per debate per plan. -1 means unlimited. */
export const AGENT_COUNT_LIMITS: Record<UserPlan, number> = {
  free: 3,
  starter: 8,
  pro: 8,
  enterprise: -1,
};

/** Get the maximum agent count allowed for a given plan. -1 means unlimited. */
export function getMaxAgents(plan: UserPlan): number {
  return AGENT_COUNT_LIMITS[plan];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get the credit cost for a given debate mode. */
export function getCreditCostForMode(mode: BillingDebateMode): number {
  return DEBATE_CREDIT_COSTS[mode];
}

/** Get display config for a plan. */
export function getPlanConfig(plan: UserPlan): PlanConfig {
  return PLAN_CONFIGS[plan];
}

/** Check if a plan grants access to a given feature. */
export function isPlanAllowed(plan: UserPlan, feature: Feature): boolean {
  return FEATURE_MATRIX[feature].includes(plan);
}

/** Get the seat limit for a plan. -1 means unlimited. */
export function getSeatLimit(plan: UserPlan): number {
  return SEAT_LIMITS[plan];
}

/** Check if a debate mode is available on the free tier. */
export function isFreeTierModeAllowed(mode: BillingDebateMode): boolean {
  return FREE_TIER.allowedModes.includes(mode);
}

/** Get monthly included credits for a plan. */
export function getMonthlyCredits(plan: UserPlan): number {
  return MONTHLY_CREDITS[plan];
}

// ---------------------------------------------------------------------------
// Legacy plan migration helpers
// ---------------------------------------------------------------------------

/**
 * Normalize legacy plan names to new simplified plans.
 * "byok" -> "starter", "byok_pro" -> "pro"
 */
export function normalizePlan(plan: string): UserPlan {
  if (plan === "byok") return "starter";
  if (plan === "byok_pro") return "pro";
  if (plan === "free" || plan === "starter" || plan === "pro" || plan === "enterprise") {
    return plan;
  }
  return "free";
}
