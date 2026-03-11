// Feature flag types — shared between API and web

/**
 * All known feature flag keys in the system.
 * Each string literal maps to a row in the feature_flags table.
 */
export type FeatureFlagKey =
  | "notion_export"
  | "discord_bot"
  | "decision_chains"
  | "beta_dashboard"
  | "slack_integration"
  | "webhook_system"
  | "analytics_v2";

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  /** 0–100: percentage of users who receive this flag via hash rollout */
  rolloutPercentage: number;
  /** User IDs always granted access regardless of rollout percentage */
  allowedUserIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UpsertFeatureFlagInput {
  name?: string;
  description?: string | null;
  enabled?: boolean;
  rolloutPercentage?: number;
}
