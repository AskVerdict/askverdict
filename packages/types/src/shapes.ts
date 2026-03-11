// Debate Shape Types

export type DebateShape =
  | "quick_consensus"
  | "deep_revision"
  | "contested_split"
  | "evidence_battle"
  | "minority_triumph";

export interface ShapeResult {
  shape: DebateShape;
  label: string;
  description: string;
  emoji: string;
}
