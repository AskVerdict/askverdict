// Argument Graph Types

import type { Evidence } from "./evidence";

export type ClaimStatus =
  | "standing"
  | "challenged"
  | "rebutted"
  | "conceded"
  | "supported";

export type ClaimType =
  | "claim"
  | "evidence"
  | "challenge"
  | "rebuttal"
  | "concession";

export type EdgeType = "supports" | "challenges" | "rebuts" | "concedes";

export interface Claim {
  id: string;
  type: ClaimType;
  content: string;
  authorAgentId: string;
  round: number;
  status: ClaimStatus;
  evidence: Evidence[];
  respondsTo: string | null;
  engagementScore: number;
  createdAt: Date;
}

export interface ArgumentEdge {
  id: string;
  sourceClaimId: string;
  targetClaimId: string;
  type: EdgeType;
  round: number;
  createdAt: Date;
}

export interface GraphSnapshot {
  claims: Claim[];
  edges: ArgumentEdge[];
  roundNumber: number;
  timestamp: Date;
}

export interface DebateGraph {
  nodes: Claim[];
  edges: ArgumentEdge[];
  uncontestedClaims: Claim[];
  resolvedDisputes: Claim[];
  activeDisputes: Claim[];
  strongestArguments: Claim[];
  weakestArguments: Claim[];
}
