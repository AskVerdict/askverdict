// Consensus & Convergence Types

export interface ConsensusState {
  agreedPoints: string[];
  liveDisputes: string[];
  irreconcilable: string[];
  convergenceVelocity: number;
  shouldContinue: boolean;
  reason?: string;
}

export interface RoundMetrics {
  round: number;
  concessions: number;
  challenges: number;
  rebuttals: number;
  newArguments: number;
  totalResponses: number;
  concessionRate: number;
  challengeRate: number;
  convergenceVelocity: number;
  agentConfidences: Map<string, number>;
}

export interface ConsensusRoundEntry {
  round: number;
  concessions: number;
  challenges: number;
  rebuttals: number;
  newArguments: number;
  totalResponses: number;
  concessionRate: number;
  challengeRate: number;
  convergenceVelocity: number;
  agentConfidences: Record<string, number>;
}
