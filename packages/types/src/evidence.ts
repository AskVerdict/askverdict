// Evidence Types

export type EvidenceSource = "web_search" | "reasoning" | "data" | "document";

export interface Evidence {
  source: EvidenceSource;
  url?: string;
  snippet?: string;
  confidence: number;
  verified?: boolean;
}

export interface KnowledgeEvidence {
  source: string;
  snippet?: string;
  url?: string;
  confidence: number;
}
