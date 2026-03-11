// ---------------------------------------------------------------------------
// Action Items — V2-C.1
// Generated from verdict recommendations via Haiku.
// ---------------------------------------------------------------------------

export type ActionItemPriority = "high" | "medium" | "low";
export type ActionItemCategory = "immediate" | "this_week" | "this_month";

export interface ActionItemLink {
  title: string;
  url: string;
}

export interface ActionItem {
  /** Unique ID (nanoid) */
  id: string;
  /** Short actionable title (imperative form) */
  title: string;
  /** 1-2 sentence description of what to do */
  description: string;
  /** Urgency level */
  priority: ActionItemPriority;
  /** Time horizon */
  category: ActionItemCategory;
  /** Optional assignee name (free text) */
  assignee?: string;
  /** Whether the user has marked this item complete */
  completed: boolean;
  /** Timestamp when marked complete (ISO string) */
  completedAt?: string;
  /** AI-curated resource links (on-demand enrichment) */
  links?: ActionItemLink[];
  /** Whether links have been searched (prevents re-triggering) */
  linksSearched?: boolean;
}

/** Stored on the debate record as `actionItems` JSONB */
export interface ActionItemsData {
  items: ActionItem[];
  generatedAt: string;
}
