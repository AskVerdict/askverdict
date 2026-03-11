// Outcome Tracking Types

/** Status of a decision outcome */
export type OutcomeStatus =
  | "pending"
  | "correct"
  | "partially_correct"
  | "wrong"
  | "too_early"
  | "skipped";

/** Stored outcome record for a debate */
export interface OutcomeRecord {
  id: string;
  debateId: string;
  userId: string;
  predictedProbability: number; // 0.0-1.0, from calibrated verdict
  outcomeStatus: OutcomeStatus;
  outcomeNotes: string | null; // free-text: "what actually happened"
  satisfactionScore: number | null; // 1-5
  reminderAt: string | null; // ISO date — when to nudge for outcome
  reminderSent: boolean;
  recordedAt: string | null; // ISO date — when user logged outcome
  createdAt: string;
}

/** User input shape for submitting an outcome */
export interface OutcomeFeedback {
  outcomeStatus: Exclude<OutcomeStatus, "pending" | "skipped">;
  outcomeNotes?: string;
  satisfactionScore?: number; // 1-5
}

/** Pending outcome for display (includes debate context) */
export interface PendingOutcome {
  id: string;
  debateId: string;
  question: string;
  predictedProbability: number;
  reminderAt: string | null;
  daysSinceDebate: number;
  createdAt: string;
}

/** Outcome history item with debate context */
export interface OutcomeHistoryItem {
  id: string;
  debateId: string;
  question: string;
  /** Whether the source debate has been soft-deleted */
  debateDeleted?: boolean;
  predictedProbability: number;
  outcomeStatus: OutcomeStatus;
  outcomeNotes: string | null;
  satisfactionScore: number | null;
  recordedAt: string | null;
  createdAt: string;
}
