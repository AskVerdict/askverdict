// Search Types

export interface SearchQuery {
  query: string;
  agentId: string;
  round: number;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  relevance: number;
  provider?: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  timestamp: Date;
}
