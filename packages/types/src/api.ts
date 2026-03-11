// API Request/Response Types

import type { DebateMode, DebateStatus, DebateCommandType } from "./debate";
import type { DebateFrameworkId } from "./frameworks";
import type { FundingSource, UserPlan } from "./user";
import type { Verdict } from "./verdict";
import type { DebateCost } from "./cost";
import type { DebateEvent } from "./events";
import type { ActionItemsData } from "./action-items";

// Create Debate
export interface CreateDebateRequest {
  question: string;
  /** "debate" (default) or "compare" (multi-option decision matrix) */
  type?: "debate" | "compare";
  mode?: DebateMode;
  agentCount?: number;
  maxRounds?: number;
  enableSearch?: boolean;
  context?: string;
  preset?: string;
  skipCache?: boolean;
  /** Phase 17 — 2-5 options for compare mode */
  compareOptions?: string[];
  /** Phase 28 — structured template slug (from TemplatePicker) */
  templateSlug?: string;
  /** Phase 28 — field values collected from TemplateForm */
  templateFields?: Record<string, string | number | string[]>;
  /** Show agent thinking process (extended thinking for Anthropic, prompt-based for others) */
  showThinking?: boolean;
  /** Verdict tone/style override — independent of mode */
  tone?: "concise" | "standard" | "detailed";
  /** V3-D — Decision framework methodology */
  framework?: DebateFrameworkId;
  /** V3-A — Enable evidence engine (per-round retrieval, citations, fact-checking) */
  enableEvidence?: boolean;
  /** Preferred AI provider — engine routes all tiers to this provider when available */
  preferredProvider?: string;
  /** Incognito mode — debate auto-deletes after 30 days */
  isTemporary?: boolean;
}

export interface CreateDebateResponse {
  debateId: string;
  /** SSE stream URL — present for all modes except instant */
  streamUrl?: string;
  /** Verdict returned synchronously for instant (Quick Take) mode */
  verdict?: Verdict;
  /** Cost breakdown — present for instant mode */
  cost?: DebateCost;
  /** Whether the verdict was served from cache */
  cached?: boolean;
}

// Get Debate
export interface GetDebateResponse {
  id: string;
  question: string;
  status: DebateStatus;
  verdict: Verdict | null;
  cost: DebateCost | null;
  mode: string | null;
  agentCount: number | null;
  roundCount: number | null;
  fundingSource: FundingSource | null;
  isPublic: boolean;
  createdAt: string;
  completedAt: string | null;
  /** Non-null when debate was created from a template */
  templateSlug: string | null;
  shareToken: string | null;
  seoSlug: string | null;
  viewCount: number;
  forkCount: number;
  /** V2-C.1 — generated action items from verdict */
  actionItems: ActionItemsData | null;
  /** V2-C.2 — 3-sentence board-ready executive summary */
  executiveSummary: string | null;
  /** V2-E.2 — Decision quality score (0-100) */
  qualityScore: number | null;
  /** Domain/category used for calibration (e.g. "career", "finance") */
  domain: string | null;
  /** Phase 33C — Number of prior debates whose arguments informed this verdict */
  priorDebatesUsed: number | null;
  /** V3-D — Decision framework used (null = "standard") */
  framework: string | null;
  /** V3.1 — ID of background full debate spawned from this Quick Take */
  linkedFullDebateId: string | null;
  /** Re-run lineage — ID of the debate this was re-run from */
  rerunOf: string | null;
  /** Incognito mode — whether this debate auto-deletes after expiry */
  isTemporary: boolean;
  /** Incognito mode — when this temporary debate expires */
  temporaryExpiresAt: string | null;
}

// List Debates
export interface ListDebatesResponse {
  debates: GetDebateResponse[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Debate Commands
export interface DebateCommandRequest {
  command: DebateCommandType;
  payload?: string;
}

// Usage
export interface GetUsageResponse {
  plan: UserPlan;
  debatesThisMonth: number;
  debatesLimit: number | null;
  creditsRemaining: number;
  freeDebateResetAt: string | null;
}

// Health
export interface HealthResponse {
  status: "ok" | "degraded" | "down";
  service: string;
  timestamp: string;
  version: string;
}

// Error
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// SSE Stream
export interface StreamEventWrapper {
  id: string;
  event: DebateEvent["type"];
  data: DebateEvent;
  timestamp: number;
}
