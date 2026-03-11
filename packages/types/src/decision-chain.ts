// Decision Chain Types

import type { OutcomeStatus } from "./outcome";

/** Relationship between linked debates in a chain */
export type ChainRelationship = "follow_up" | "reversal" | "refinement";

/** A node in a decision chain */
export interface ChainNode {
  debateId: string;
  parentDebateId: string | null;
  relationship: ChainRelationship;
  question: string;
  verdict: string | null;
  outcomeStatus: OutcomeStatus;
  createdAt: string;
}

/** Full decision chain with all linked debates */
export interface DecisionChain {
  id: string;
  userId: string;
  name: string;
  rootDebateId: string;
  debates: ChainNode[];
  createdAt: string;
  updatedAt: string;
}

/** Summary for chain list views */
export interface DecisionChainSummary {
  id: string;
  name: string;
  debateCount: number;
  latestOutcomeStatus: OutcomeStatus;
  latestQuestion: string;
  createdAt: string;
  updatedAt: string;
}

/** Input for linking a debate to an existing chain */
export interface ChainLinkInput {
  parentDebateId: string;
  relationship: ChainRelationship;
}

/** Summarized context from a chain for injection into new debates */
export interface ChainContext {
  chainId: string;
  chainName: string;
  summary: string; // < 500 tokens summarized context
  decisions: Array<{
    question: string;
    verdict: string | null;
    outcomeStatus: OutcomeStatus;
  }>;
}
