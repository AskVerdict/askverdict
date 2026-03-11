// Round & Protocol Types

import type { Claim, ArgumentEdge } from "./graph";

export type RoundType = "opening" | "cross_examination" | "closing";

export interface Round {
  number: number;
  type: RoundType;
  startTime: Date;
  endTime?: Date;
  participatingAgents: string[];
}

export interface ClaimAssignment {
  agentId: string;
  assignedClaims: Claim[];
  reason: string;
}

export interface ValidationResult {
  valid: boolean;
  violations: string[];
}

export interface ProcessingResult {
  newClaims: Claim[];
  newEdges: ArgumentEdge[];
}

export interface AgentEngagement {
  assigned: number;
  addressed: number;
  rate: number;
}

export interface EngagementMetrics {
  totalAssigned: number;
  totalAddressed: number;
  engagementRate: number;
  byAgent: Map<string, AgentEngagement>;
}
