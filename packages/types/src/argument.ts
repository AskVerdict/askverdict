// Argument & Response Types

import type { Evidence } from "./evidence";

export type ResponseType = "challenge" | "concede" | "rebut";

export interface AgentResponseItem {
  to_claim_id: string;
  type: ResponseType;
  content: string;
  evidence: Evidence[];
}

export interface NewArgument {
  content: string;
  evidence: Evidence[];
}

export interface AgentResponse {
  responses: AgentResponseItem[];
  new_arguments: NewArgument[];
  current_confidence: number;
}

export interface Argument {
  content: string;
  evidence: Evidence[];
  strength: number;
}

export interface CrossExamResponse {
  toClaimId: string;
  type: "challenge" | "concede" | "rebut";
  content: string;
  evidence: Evidence[];
}
