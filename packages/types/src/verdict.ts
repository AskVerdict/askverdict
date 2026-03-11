// Verdict & Decision Matrix Types

import type { AgentSummary } from "./agent";
import type { Argument } from "./argument";
import type { Evidence } from "./evidence";
import type { ModelUsage } from "./cost";

export type VerdictRecommendation =
  // Primary values (direction-aware)
  | "RECOMMENDED"
  | "NOT_RECOMMENDED"
  | "PROCEED_WITH_CAUTION"
  | "CONDITIONAL"
  | "SPLIT_DECISION"
  // Legacy values (backward compat for stored verdicts)
  | "PROCEED"
  | "RECONSIDER"
  | "MORE_INFO_NEEDED";

export interface DecisionMatrixEntry {
  criterion: string;
  weight: number;
  scores: Record<string, number>;
  reasoning: string;
}

export interface DecisionMatrix {
  entries: DecisionMatrixEntry[];
  options: string[];
  totalScores: Record<string, number>;
}

export interface DissentingView {
  agentId: string;
  agentName: string;
  view: string;
  reasoning: string;
}

export interface VerdictNarrative {
  summary: string;
  journey: string;
  comparison: string;
  evidenceAssessment: string;
  finalWord: string;
  fullNarrative?: string;
}

export interface Verdict {
  recommendation: VerdictRecommendation;
  confidence: number;
  oneLiner: string;
  argumentsFor: Argument[];
  argumentsAgainst: Argument[];
  keyEvidence: Evidence[];
  dissentingViews: DissentingView[];
  blindSpots: string[];
  assumptions: string[];
  decisionMatrix: DecisionMatrix;
  nextSteps: string[];
  revisitTriggers: string[];
  totalRounds: number;
  agentsUsed: AgentSummary[];
  modelsUsed: ModelUsage[];
  totalCost: number;
  debateDurationSeconds: number;
  narrative?: VerdictNarrative;
  missingInfo?: string[];
}
