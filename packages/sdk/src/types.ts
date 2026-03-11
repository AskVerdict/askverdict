// @askverdict/sdk — SDK-specific types (re-exported shapes aligned with API)
// Note: We intentionally define these inline rather than re-exporting from
// @askverdict/types to keep the published SDK self-contained.

export interface AskVerdictClientConfig {
  /** Base URL for the AskVerdict API. Defaults to https://api.askverdict.ai */
  baseUrl?: string;
  /** API key for programmatic access (vrd_* prefix, sent via X-Api-Key) */
  apiKey?: string;
  /** Session/auth token (Authorization: Bearer header) — for internal app use */
  authToken?: string;
}

// ── Debate ────────────────────────────────────────────────────────────────────

export type DebateMode = "fast" | "balanced" | "thorough" | "analytical";
export type DebateStatus = "active" | "completed" | "failed" | "paused" | "pending" | "running";

export interface CreateDebateParams {
  question: string;
  mode?: DebateMode;
  agentCount?: number;
  maxRounds?: number;
  enableSearch?: boolean;
  context?: string;
  preset?: string;
  skipCache?: boolean;
}

export interface CreateDebateResult {
  id: string;
  status: string;
  streamUrl: string;
  /** @deprecated Use `id` instead */
  debateId?: string;
}

export interface VerdictRecommendation {
  recommendation: string;
  confidence: number;
  rationale: string;
}

export interface DecisionMatrixEntry {
  criterion: string;
  forScore: number;
  againstScore: number;
  weight: number;
}

export interface Verdict {
  summary: string;
  recommendation: VerdictRecommendation;
  confidence: number;
  keyFindings: string[];
  totalRounds?: number;
  agentsUsed?: string[];
}

export interface DebateCostRecord {
  totalUsd: number;
  inputTokens: number;
  outputTokens: number;
}

export type FundingSource = "free_tier" | "user_credits" | "byok" | null;

export interface DebateResponse {
  id: string;
  question: string;
  status: DebateStatus;
  verdict: Verdict | null;
  cost: DebateCostRecord | null;
  mode: string | null;
  agentCount: number | null;
  roundCount: number | null;
  fundingSource: FundingSource;
  isPublic: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface ListDebatesParams {
  limit?: number;
  offset?: number;
  status?: DebateStatus;
  page?: number;
  pageSize?: number;
}

export interface ListDebatesResult {
  debates: DebateResponse[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ── Votes ─────────────────────────────────────────────────────────────────────

export type VoteValue = "agree" | "disagree" | "neutral";

export interface ClaimVoteTally {
  agree: number;
  disagree: number;
  userVote?: VoteValue;
}

/** Map of claimId → tally */
export type VoteMap = Record<string, ClaimVoteTally>;

// ── Polls ─────────────────────────────────────────────────────────────────────

export interface PollOption {
  id: string;
  label: string;
}

export interface Poll {
  id: string;
  debateId: string;
  question: string;
  options: PollOption[];
  status: "open" | "closed";
  createdAt: string;
  closedAt: string | null;
  tallies: Record<string, number>;
  totalVotes: number;
  userVote: string | null;
}

// ── Health ────────────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: "ok" | "degraded" | "down";
  service: string;
  timestamp: string;
  version: string;
}

// ── Streaming ─────────────────────────────────────────────────────────────────

export interface StreamEvent {
  id: string;
  type: string;
  data: unknown;
  timestamp: number;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  plan: string;
  bio: string | null;
  location: string | null;
  createdAt: string;
}

export interface UsageInfo {
  plan: string;
  debatesThisMonth: number;
  debatesLimit: number | null;
  creditsRemaining: number;
  freeDebateResetAt: string | null;
}

// ── Billing ───────────────────────────────────────────────────────────────────

export interface BalanceInfo {
  creditBalance: number;
  plan: string;
}

export type CheckoutPlan = "starter" | "pro" | "byok" | "byok_pro";
export type CheckoutInterval = "monthly" | "annual";
export type CreditPack = "credits_50" | "credits_200" | "credits_600";

export interface CheckoutUrlResult {
  url: string;
}

export interface PortalUrlResult {
  url: string;
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalDebates: number;
  debatesThisWeek: number;
  weeklyActivity: number[];
  modeDistribution: Record<string, number>;
  averageCost: number;
  currentStreak: number;
}

// ── Search ────────────────────────────────────────────────────────────────────

export interface SearchParams {
  type?: "debates" | "verdicts";
  sort?: "relevance" | "date" | "popularity";
  page?: number;
  limit?: number;
  status?: string;
  mode?: string;
}

export interface SearchResultItem {
  id: string;
  question: string;
  status: string;
  mode: string | null;
  confidence: number | null;
  recommendation: string | null;
  createdAt: string;
}

export interface SearchResult {
  results: SearchResultItem[];
  total: number;
  page: number;
  totalPages: number;
}

// ── Outcomes ──────────────────────────────────────────────────────────────────

export interface OutcomeRecord {
  id: string;
  debateId: string;
  actualOutcome: string;
  notes: string | null;
  verdictWasCorrect: boolean | null;
  recordedAt: string;
}

export interface SubmitOutcomeParams {
  actualOutcome: string;
  notes?: string;
  verdictWasCorrect?: boolean;
}

// ── Scores ────────────────────────────────────────────────────────────────────

export interface DecisionScore {
  overallAccuracy: number;
  totalDecisions: number;
  correctPredictions: number;
  brierScore: number | null;
  calibrationScore: number | null;
}

// ── Streaks ───────────────────────────────────────────────────────────────────

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalDebates: number;
  milestones: Array<{ count: number; reached: boolean; reachedAt?: string }>;
}

// ── API Key Usage ────────────────────────────────────────────────────────────

export interface ApiKeyUsage {
  keyId: string;
  period: string;
  totalRequests: number;
  byEndpoint: Record<string, number>;
  rateLimit: number;
}

// ── Errors ────────────────────────────────────────────────────────────────────

export interface SdkError {
  code: string;
  message: string;
  status?: number;
  details?: Record<string, unknown>;
}

export class AskVerdictError extends Error {
  readonly code: string;
  readonly status: number | undefined;
  readonly details: Record<string, unknown> | undefined;

  constructor(error: SdkError) {
    super(error.message);
    this.name = "AskVerdictError";
    this.code = error.code;
    this.status = error.status;
    this.details = error.details;
  }
}
