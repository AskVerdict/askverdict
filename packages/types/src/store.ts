// Store/Persistence Types

import type { AgentState } from "./agent";
import type { ConsensusRoundEntry } from "./consensus";
import type { DebateCost } from "./cost";
import type { DebateStatus, DebateSource } from "./debate";
import type { KnowledgeEvidence } from "./evidence";
import type { GraphSnapshot } from "./graph";
import type { Verdict } from "./verdict";

export interface StoredDebate {
  id: string;
  question: string;
  context?: string;
  status: DebateStatus;
  agentCount: number;
  maxRounds: number;
  completedRounds: number;
  verdict: Verdict | null;
  cost: DebateCost | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  deletedAt?: string | null;
  source?: DebateSource;
  parentDebateId?: string | null;
}

export interface Checkpoint {
  id: number;
  debateId: string;
  round: number;
  graphSnapshot: GraphSnapshot;
  consensusHistory: ConsensusRoundEntry[];
  agentStates: AgentState[];
  createdAt: string;
}

export interface KnowledgeEntry {
  id: number;
  claimContent: string;
  confidence: number;
  domainTags: string[];
  sourceDebateId: string;
  sourceQuestion: string;
  evidence: KnowledgeEvidence[];
  createdAt: string;
  sourceDeleted?: boolean;
  archived?: boolean;
}

export interface DebateTranscriptArgument {
  agentId: string;
  content: string;
  type: "opening" | "challenge" | "rebut" | "concede" | "closing";
  confidence: number;
  evidence: KnowledgeEvidence[];
  responses?: Array<{
    toClaimId: string;
    type: "challenge" | "concede" | "rebut";
    content: string;
    evidence: KnowledgeEvidence[];
  }>;
}

export interface DebateTranscriptRound {
  round: number;
  type: string;
  arguments: DebateTranscriptArgument[];
}

export interface DebateTranscript {
  agents: Array<{ id: string; name: string; persona: string }>;
  rounds: DebateTranscriptRound[];
}

export interface KnowledgeQuery {
  keywords: string[];
  limit?: number;
  minConfidence?: number;
}

export interface KnowledgeStats {
  totalEntries: number;
  sourceDebates: number;
  avgConfidence: number;
  topDomains: Array<{ domain: string; count: number }>;
}

export interface DeleteDebateOptions {
  hardDelete?: boolean;
  deleteKnowledge?: boolean;
}

export interface DeleteDebateResult {
  debateDeleted: boolean;
  knowledgeDeleted: number;
  knowledgeOrphaned: number;
}

export interface StoredEvent {
  id: number;
  debateId: string;
  eventId: number;
  eventType: string;
  eventData: unknown;
  createdAt: string;
}
