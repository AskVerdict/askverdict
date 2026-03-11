// Decision Score Types

/** User's overall decision quality score */
export interface DecisionScore {
  userId: string;
  brierScore: number; // 0.0 (perfect) to 1.0 (worst) — lower is better
  totalTracked: number;
  totalResolved: number;
  domainScores: Record<string, number>; // domain → brier score
  accuracyPercentage: number; // 0-100, derived from brier score
  streak: number; // consecutive correct outcomes
  updatedAt: string;
}

/** Per-domain accuracy breakdown */
export interface DomainAccuracy {
  domain: string;
  brierScore: number;
  sampleSize: number;
  trend: "improving" | "stable" | "declining";
}

/** Accuracy trend data point for time-series charts */
export interface AccuracyTrendPoint {
  date: string; // ISO date
  brierScore: number;
  rollingAccuracy: number; // 0-100
  sampleSize: number;
}

/** Known domain categories for debate classification */
export type DomainCategory =
  | "business"
  | "technology"
  | "health"
  | "legal"
  | "personal"
  | "finance"
  | "education"
  | "other";

/** Domain keywords for local classification fallback */
export const DOMAIN_KEYWORDS: Record<DomainCategory, string[]> = {
  business: ["revenue", "pricing", "market", "startup", "hire", "team", "company", "sales", "customer", "growth"],
  technology: ["database", "api", "framework", "language", "deploy", "architecture", "code", "software", "server", "cloud"],
  health: ["treatment", "symptom", "medical", "therapy", "diagnosis", "health", "doctor", "patient", "medicine"],
  legal: ["contract", "liability", "compliance", "regulation", "lawsuit", "legal", "attorney", "court", "patent"],
  personal: ["career", "relationship", "move", "decision", "life", "family", "education", "school"],
  finance: ["invest", "portfolio", "budget", "savings", "loan", "mortgage", "stock", "crypto", "retirement"],
  education: ["learn", "course", "degree", "university", "training", "certification", "study"],
  other: [],
} as const;
