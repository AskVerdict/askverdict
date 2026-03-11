// Agent & Persona Types

import type { ModelTier } from "./provider";

export type PersonaType =
  | "advocate"
  | "critic"
  | "analyst"
  | "engineer"
  | "economist"
  | "devil";

export interface PersonaConfig {
  type: PersonaType;
  name: string;
  role: string;
  systemPrompt: string;
  biasDirection?: "positive" | "negative" | "neutral";
  domains?: string[];
  modelPreference?: ModelTier;
  color: string;
  emoji: string;
}

export interface AgentInfo {
  id: string;
  persona: PersonaType;
  name: string;
}

export interface AgentSummary {
  id: string;
  persona: PersonaType;
  name: string;
  claimsCount: number;
  responsesCount: number;
  finalConfidence: number;
}

export interface AgentState {
  id: string;
  personaType: string;
  personaName: string;
  confidence: number;
}
