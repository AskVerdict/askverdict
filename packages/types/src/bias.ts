// Bias Detection Types — pure statistical analysis of decision patterns

export type BiasType =
  | "anchoring"     // Systematically goes with the first option presented
  | "cost_aversion" // Consistently favors lower-cost options in financial/business decisions
  | "recency"       // Quick decisions have significantly lower accuracy than deliberate ones
  | "confirmation"  // Positively-framed questions overwhelmingly confirm the implied preference
  | "risk_aversion" // Consistently picks safer options in financial/business/career decisions
  | "category_bias"; // Accuracy varies wildly across decision domains

export interface BiasDetection {
  type: BiasType;
  /** 0–1 — how confident we are this bias exists based on available evidence */
  confidence: number;
  /** Human-readable explanation, non-judgmental */
  description: string;
  /** How many decisions support this finding */
  evidenceCount: number;
  /** Actionable improvement tip */
  suggestion: string;
}

export interface BiasProfile {
  /** Detected biases — empty array means insufficient data or no biases found */
  biases: BiasDetection[];
  /** Overall accuracy as a percentage (0–100) */
  overallAccuracy: number;
  /** Per-category accuracy percentages */
  categoryAccuracy: Record<string, number>;
  /** Total decisions tracked (regardless of outcome) */
  totalDecisions: number;
  /** Decisions that have a resolved outcome */
  decisionsWithOutcomes: number;
  /** ISO timestamp of when this analysis was run */
  analyzedAt: string;
}
