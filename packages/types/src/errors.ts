// Error Types

export interface ErrorContext {
  [key: string]: unknown;
  debateId?: string;
  agentId?: string;
  round?: number;
  stage?: string;
  timestamp?: Date;
}

export type VerdictErrorCode =
  | "DEBATE_ERROR"
  | "AGENT_ERROR"
  | "ROUTER_ERROR"
  | "SEARCH_ERROR"
  | "PROTOCOL_ERROR"
  | "PROVIDER_ERROR"
  | "CONFIG_ERROR"
  | "BUDGET_EXCEEDED"
  | "TIMEOUT";
