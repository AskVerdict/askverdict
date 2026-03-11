// Provider & Model Configuration Types

export type Provider = "anthropic" | "openai" | "google" | "ollama" | "openrouter";

export type ModelTier = "opus" | "sonnet" | "haiku" | "local";

export type TaskType =
  | "orchestrator"
  | "synthesizer"
  | "debater"
  | "classifier"
  | "search_planner"
  | "mid_debate_analyst"
  | "fact_checker"
  | "controversy_scorer";

export interface ModelConfig {
  anthropic?: {
    apiKey: string;
    opusModel?: string;
    sonnetModel?: string;
    haikuModel?: string;
  };
  openrouter?: {
    apiKey: string;
    opusModel?: string;
    sonnetModel?: string;
    haikuModel?: string;
  };
  openai?: {
    apiKey: string;
    opusModel?: string;
    sonnetModel?: string;
    haikuModel?: string;
  };
  google?: {
    apiKey: string;
    opusModel?: string;
    sonnetModel?: string;
    haikuModel?: string;
  };
  ollama?: {
    baseUrl: string;
    model: string;
  };
}

export type ProviderKeys = Partial<Record<Provider, string>>;

export interface ProviderResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  reportedCost?: number;
  cacheCreationInputTokens?: number;
  cacheReadInputTokens?: number;
}

export interface ProviderCallOptions {
  model: string;
  system: string;
  messages: Array<{ role: string; content: string }>;
  maxTokens: number;
  temperature: number;
}

export interface ModelProvider {
  readonly name: string;
  isAvailable(): boolean;
  getModelId(tier: ModelTier): string;
  getSupportedTiers(): ModelTier[];
  estimateCost(
    tier: ModelTier,
    inputTokens: number,
    outputTokens: number
  ): number;
  call(options: ProviderCallOptions): Promise<ProviderResponse>;
}

export type ModelRouting = Record<TaskType, ModelTier | null>;

export interface ContextBudgetEntry {
  maxInputTokens: number;
  summarizeAfter: number;
}

export type ContextBudget = Partial<Record<TaskType, ContextBudgetEntry>>;

export interface ConfigPreset {
  name: string;
  description: string;
  routing: ModelRouting;
  contextBudget?: ContextBudget;
  estimatedCost: string;
}

export interface ResolvedModelConfig {
  presetName: string;
  routing: ModelRouting;
  contextBudget: ContextBudget;
}

export interface ResolveConfigOptions {
  preset?: string;
  routingOverrides?: Record<string, string | null>;
}
