export type DebateMode = "fast" | "balanced" | "thorough";

export interface DebateConfig {
  question: string;
  mode: DebateMode;
  streaming: boolean;
}

export interface AgentResult {
  role: "advocate" | "critic";
  provider: string;
  model: string;
  argument: string;
  promptTokens: number;
  completionTokens: number;
  durationMs: number;
}

export interface VerdictResult {
  summary: string;
  confidence: number;
  forPoints: string[];
  againstPoints: string[];
  blindSpots: string[];
  nextStep: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  durationMs: number;
}

export interface DebateResult {
  question: string;
  mode: DebateMode;
  advocate: AgentResult;
  critic: AgentResult;
  verdict: VerdictResult;
  totalTokens: number;
  totalDurationMs: number;
  providers: string[];
}
