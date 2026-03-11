// Debate Event Types (discriminated union for SSE streaming)

import type { PersonaType } from "./agent";
import type { Evidence } from "./evidence";
import type { CrossExamResponse } from "./argument";
import type { GraphSnapshot } from "./graph";
import type { ConsensusState } from "./consensus";
import type { Verdict } from "./verdict";

// Interactive stages
export type InteractiveDebateStage =
  | "setup"
  | "opening"
  | "cross-exam"
  | "closing"
  | "synthesis";

// Core debate events
export interface DebateStartEvent {
  type: "debate:start";
  data: {
    debateId: string;
    question: string;
    context?: string;
    agentCount: number;
    maxRounds: number;
    agents: Array<{ id: string; persona: PersonaType; name: string }>;
  };
}

export interface AgentThinkingEvent {
  type: "agent:thinking";
  data: {
    agentId: string;
    agentName: string;
    round: number;
  };
}

export interface AgentArgumentEvent {
  type: "agent:argument";
  data: {
    agentId: string;
    agentName: string;
    round: number;
    content: string;
    evidence: Evidence[];
    confidence: number;
    responses?: CrossExamResponse[];
    timestamp?: number;
  };
}

export interface AgentErrorEvent {
  type: "agent:error";
  data: {
    agentId: string;
    agentName?: string;
    round: number;
    error: string;
    code?: string;
  };
}

export interface AgentSearchEvent {
  type: "agent:search";
  data: {
    agentId: string;
    agentName: string;
    query: string;
    resultsCount: number;
  };
}

export interface GraphUpdateEvent {
  type: "graph:update";
  data: {
    round: number;
    claimsAdded: number;
    edgesAdded: number;
    snapshot: GraphSnapshot;
  };
}

export interface ConsensusCheckEvent {
  type: "consensus:check";
  data: ConsensusState & {
    round: number;
  };
}

export interface VerdictStartEvent {
  type: "verdict:start";
  data: {
    round: number;
  };
}

export interface VerdictCompleteEvent {
  type: "verdict:complete";
  data: {
    verdict: Verdict;
  };
}

export interface DebateCompleteEvent {
  type: "debate:complete";
  data: {
    debateId: string;
    verdict: Verdict;
    totalCost: number;
    durationSeconds: number;
  };
}

export interface DebateErrorEvent {
  type: "debate:error";
  data: {
    error: string;
    stage?: string;
    recoverable: boolean;
  };
}

export interface DebateCachedEvent {
  type: "debate:cached";
  data: {
    cachedDebateId: string;
    question: string;
    verdict: Verdict;
  };
}

// Stage & interactive events
export interface StageChangeEvent {
  type: "stage:change";
  data: {
    stage: InteractiveDebateStage;
    round?: number;
    message: string;
  };
}

export interface AgentIntroEvent {
  type: "agent:intro";
  data: {
    agentId: string;
    name: string;
    persona: string;
    stance: string;
    color: string;
    emoji: string;
    /** Framework persona role label (e.g. "FACTS", "EMOTIONS", "DOMAIN") */
    role?: string;
  };
}

export interface SynthesisProgressEvent {
  type: "synthesis:progress";
  data: {
    step: "analyzing" | "weighing" | "drafting" | "finalizing";
    message: string;
    progress: number;
  };
}

export interface SynthesisNarrativeChunkEvent {
  type: "synthesis:narrative_chunk";
  data: {
    chunk: string;
  };
}

export interface DebateStatusEvent {
  type: "debate:status";
  data: {
    message: string;
    detail?: string;
  };
}

export interface DebatePausedEvent {
  type: "debate:paused";
  data: {
    round: number;
    message: string;
  };
}

export interface DebateResumedEvent {
  type: "debate:resumed";
  data: {
    round: number;
    message: string;
  };
}

export interface ModeratorInjectEvent {
  type: "moderator:inject";
  data: {
    content: string;
    round: number;
    acknowledgment: string;
  };
}

export interface QuestionClarificationEvent {
  type: "question:clarification";
  data: {
    clarity: number;
    gaps: string[];
    suggestions: string[];
    proceedAnyway: boolean;
  };
}

// Analysis events
export interface MidDebateAnalysisEvent {
  type: "analysis:mid_debate";
  data: {
    round: number;
    keyClaimIds: string[];
    summary: string;
    focusAreas: string[];
  };
}

export interface FactCheckEvent {
  type: "analysis:fact_check";
  data: {
    round: number;
    checks: Array<{
      claimId: string;
      claim: string;
      verified: boolean;
      explanation: string;
    }>;
  };
}

export interface ControversyScoreEvent {
  type: "analysis:controversy";
  data: {
    round: number;
    score: number;
    explanation: string;
    roundAdjustment: number;
  };
}

// Engine transparency events
export interface EngineApiCallEvent {
  type: "engine:api_call";
  data: {
    model: string;
    taskType: string;
    tier: string;
    provider: string;
    maxTokens: number;
  };
}

export interface EngineApiResponseEvent {
  type: "engine:api_response";
  data: {
    model: string;
    taskType: string;
    tier: string;
    provider: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    durationMs: number;
    runningTotalCost: number;
  };
}

// Cost update event (SaaS-specific)
export interface CostUpdateEvent {
  type: "cost:update";
  data: {
    totalCost: number;
    lastCallCost: number;
    creditsRemaining?: number;
  };
}

// Engine-level error (not tied to a specific agent)
export interface EngineErrorEvent {
  type: "engine:error";
  data: {
    error: string;
    code: string;
    recoverable: boolean;
  };
}

// API-side event: badges awarded after debate completion
export interface BadgesAwardedEvent {
  type: "badges:awarded";
  data: {
    badgeIds: string[];
  };
}

// Claim status change event (emitted when a claim's status is updated mid-debate)
export interface ClaimStatusChangedEvent {
  type: "claim:status-changed";
  data: {
    claimId: string;
    oldStatus: "standing" | "challenged" | "rebutted" | "conceded" | "supported";
    newStatus: "standing" | "challenged" | "rebutted" | "conceded" | "supported";
    agentId: string;
  };
}

// Quick Take events (V2-A.2 — preliminary verdict before full debate)
export interface QuickTakeStartEvent {
  type: "quick_take:start";
  data: {
    question: string;
  };
}

export interface QuickTakeThinkingEvent {
  type: "quick_take:thinking";
  data: {
    message: string;
  };
}

export interface QuickTakeCompleteEvent {
  type: "quick_take:complete";
  data: {
    verdict: Verdict;
  };
}

export interface QuickTakeAgreementEvent {
  type: "quick_take:agreement";
  data: {
    agreement: "agrees" | "disagrees" | "nuances";
    quickTakeRecommendation: string;
    fullRecommendation: string;
    confidenceDelta: number;
    summary: string;
  };
}

// Controversy scored event (richer alias for analysis:controversy)
export interface ControversyScoredEvent {
  type: "controversy:scored";
  data: {
    score: number;
    reasoning: string;
    roundAdjustment: number;
  };
}

// Action narration events (Deep Thinking mode)
export interface AgentActionEvent {
  type: "agent:action";
  data: {
    agentId: string;
    agentName: string;
    round: number;
    /** Human-readable action: "Building opening arguments..." */
    action: string;
    /** URL/query when searching/fetching */
    url?: string;
  };
}

export interface AgentThinkingContentEvent {
  type: "agent:thinking_content";
  data: {
    agentId: string;
    agentName: string;
    round: number;
    /** The reasoning text */
    content: string;
    /** "extended" = Anthropic thinking API, "prompt" = <thinking> blocks */
    source: "extended" | "prompt";
  };
}

// ============================================================================
// V3-A: EVIDENCE ENGINE EVENTS
// ============================================================================

export interface EvidencePoolBuildingEvent {
  type: "evidence:pool_building";
  data: { debateId: string; sourceCount: number };
}

export interface EvidencePoolReadyEvent {
  type: "evidence:pool_ready";
  data: { debateId: string; chunkCount: number; sourceCount: number; elapsedMs: number };
}

export interface EvidenceRetrievalStartEvent {
  type: "evidence:retrieval_start";
  data: { query: string; topK: number };
}

export interface EvidenceRetrievalCompleteEvent {
  type: "evidence:retrieval_complete";
  data: { query: string; retrieved: number; totalCandidates: number; elapsedMs: number };
}

export interface EvidenceCitationEvent {
  type: "evidence:citation";
  data: {
    agentId: string;
    agentName: string;
    round: number;
    citedText: string;
    citations: Array<{ index: number; sourceTitle: string; sourceUrl: string; excerpt: string; confidence: number }>;
    citedClaimCount: number;
    uncitedClaimCount: number;
  };
}

export interface EvidenceCitationStartEvent {
  type: "evidence:citation_start";
  data: { agentId?: string; textLength: number; evidenceCount: number };
}

export interface EvidenceCitationCompleteEvent {
  type: "evidence:citation_complete";
  data: { agentId?: string; citedCount: number; uncitedCount: number; totalCitations: number };
}

export interface EvidenceFactCheckStartEvent {
  type: "evidence:fact_check_start";
  data: { debateId?: string; totalCitations: number };
}

export interface EvidenceFactCheckCompleteEvent {
  type: "evidence:fact_check_complete";
  data: {
    debateId?: string;
    totalChecked: number;
    verifiedCount: number;
    contestedCount: number;
    unverifiedCount: number;
    verificationRate: number;
    elapsedMs: number;
  };
}

// Discriminated union of all debate events
export type DebateEvent =
  | DebateStartEvent
  | AgentThinkingEvent
  | AgentArgumentEvent
  | AgentErrorEvent
  | AgentSearchEvent
  | GraphUpdateEvent
  | ConsensusCheckEvent
  | VerdictStartEvent
  | VerdictCompleteEvent
  | DebateCompleteEvent
  | DebateErrorEvent
  | DebateCachedEvent
  | StageChangeEvent
  | AgentIntroEvent
  | SynthesisProgressEvent
  | DebateStatusEvent
  | DebatePausedEvent
  | DebateResumedEvent
  | ModeratorInjectEvent
  | QuestionClarificationEvent
  | MidDebateAnalysisEvent
  | FactCheckEvent
  | ControversyScoreEvent
  | EngineApiCallEvent
  | EngineApiResponseEvent
  | CostUpdateEvent
  | EngineErrorEvent
  | BadgesAwardedEvent
  | ClaimStatusChangedEvent
  | ControversyScoredEvent
  | QuickTakeStartEvent
  | QuickTakeThinkingEvent
  | QuickTakeCompleteEvent
  | QuickTakeAgreementEvent
  | AgentActionEvent
  | AgentThinkingContentEvent
  | EvidencePoolBuildingEvent
  | EvidencePoolReadyEvent
  | EvidenceRetrievalStartEvent
  | EvidenceRetrievalCompleteEvent
  | EvidenceCitationEvent
  | EvidenceCitationStartEvent
  | EvidenceCitationCompleteEvent
  | EvidenceFactCheckStartEvent
  | EvidenceFactCheckCompleteEvent
  | SynthesisNarrativeChunkEvent;

// Helper type to extract event data by type
export type DebateEventType = DebateEvent["type"];

export type DebateEventData<T extends DebateEventType> = Extract<
  DebateEvent,
  { type: T }
>["data"];

// SSE stream wrapper
export interface StreamEvent {
  id: string;
  type: DebateEventType;
  data: DebateEvent;
  timestamp: number;
}
