// Debate Configuration & Control Types

import type { ModelConfig, ProviderKeys } from "./provider";
import type { Verdict } from "./verdict";
import type { DebateCost } from "./cost";
import type { DebateEvent } from "./events";
import type { DebateFrameworkId } from "./frameworks";

export type DebateMode = "instant" | "fast" | "balanced" | "thorough" | "analytical";

export type DebateStatus = "active" | "completed" | "failed" | "paused" | "pending";

export type DebateSource = "web" | "mcp" | "cli" | "api" | "sdk";

export type PromptStyle = "concise" | "standard" | "detailed" | "analytical";

export interface RoundTokenLimits {
  opening: number;
  crossExam: number;
  closing: number;
}

export interface ModePreset {
  agentCount: number;
  maxRounds: number;
  enableSearch: boolean;
  tokens: RoundTokenLimits;
  synthMaxTokens: number;
  temperature: { opening: number; crossExam: number; closing: number };
  promptStyle: PromptStyle;
}

export interface CostEstimate {
  estimatedCost: number;
  agents: number;
  rounds: number;
  estimatedDurationSeconds: number;
}

export interface SearchConfig {
  searxngUrl?: string;
  serperApiKey?: string;
  serperApiUrl?: string;
  braveApiKey?: string;
}

export interface DebateConfig {
  question: string;
  agentCount: number;
  maxRounds: number;
  enableSearch: boolean;
  context?: string;
  modelConfig?: ModelConfig;
  promptStyle?: PromptStyle;
  modeTokens?: RoundTokenLimits;
  modeTemperatures?: { opening: number; crossExam: number; closing: number };
  modeSynthMaxTokens?: number;
  searchConfig?: SearchConfig;
  preset?: string;
  routingOverrides?: Record<string, string | null>;
  /** Decision framework methodology (default: "standard") */
  framework?: DebateFrameworkId;
}

export interface CreateDebateConfig {
  question: string;
  debateId?: string;
  mode?: DebateMode;
  agentCount?: number;
  maxRounds?: number;
  enableSearch?: boolean;
  context?: string;
  providerKeys?: ProviderKeys;
  pooledKey?: string;
  anthropicApiKey?: string;
  openrouterApiKey?: string;
  braveApiKey?: string;
  searxngUrl?: string;
  serperApiKey?: string;
  ollama?: { baseUrl: string; model: string };
  skipEnvFallback?: boolean;
  onEvent?: (event: DebateEvent) => void;
  maxBudgetUsd?: number;
  preset?: string;
  routingOverrides?: Record<string, string | null>;
  /** Decision framework methodology (default: "standard") */
  framework?: DebateFrameworkId;
}

export interface CreateDebateResult {
  verdict: Verdict;
  matrix: import("./verdict").DecisionMatrix;
  cost: DebateCost;
}

// Quick Take Agreement (V2-A.2)
export type QuickTakeAgreement = "agrees" | "disagrees" | "nuances";

// Commands & Control
export type DebateCommandType = "pause" | "resume" | "skip_to_verdict" | "inject";

export interface DebateCommand {
  type: DebateCommandType;
  payload?: string;
  timestamp: number;
}
