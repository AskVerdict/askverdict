// API Key Configuration Types (BYOK)

import type { TaskType, ModelTier, Provider, ModelRouting } from "./provider";

/** Per-key configuration stored as JSONB — controls routing, providers, and rate limits */
export interface ApiKeyConfig {
  /** Preset name: "balanced" | "economy" | "hackathon" | "local" | "custom" */
  preset?: string;
  /** Per-task routing overrides (only meaningful for "custom" preset) */
  routingOverrides?: Partial<Record<TaskType, ModelTier | null>>;
  /** Which providers this key is allowed to use */
  allowedProviders?: Provider[];
  /** Rate limit override (requests per minute, null = account default) */
  rateLimit?: number | null;
  /** Optional label/description for this config */
  description?: string;
}

/** Preset info returned from GET /presets */
export interface PresetInfo {
  name: string;
  description: string;
  estimatedCost: string;
  routing: ModelRouting;
  /** Count of active (non-null) task roles */
  activeTaskCount: number;
  /** Count of disabled (null) task roles */
  disabledTaskCount: number;
}
