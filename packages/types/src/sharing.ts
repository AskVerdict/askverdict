// Sharing & public debate view types

export interface ShareSettings {
  allowComments: boolean;
  allowFork: boolean;
  showCost: boolean;
  requireSignIn: boolean;
  showInExplore: boolean;
  /** If set, public share link is password-protected (bcrypt hash stored in DB) */
  password?: string | null;
  /** ISO 8601 date string — link expires after this date */
  expiresAt?: string | null;
}

export interface PublicDebateView {
  id: string;
  question: string;
  verdict: string | null;
  confidence: number | null;
  status: string;
  resultData: unknown;
  agentCount: number;
  createdAt: string;
  completedAt: string | null;
  forkedFrom: string | null;
  forkCount: number;
  shareSettings: ShareSettings;
}
