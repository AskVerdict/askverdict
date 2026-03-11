// Provider abstraction layer
// Each provider implements raw fetch() calls to their API - no SDK dependencies.

export type ProviderName = "anthropic" | "openai" | "google";

export interface CompletionRequest {
  system: string;
  userMessage: string;
  maxTokens: number;
  temperature: number;
  onChunk?: (chunk: string) => void;
}

export interface CompletionResponse {
  content: string;
  promptTokens: number;
  completionTokens: number;
  model: string;
}

export interface Provider {
  readonly name: ProviderName;
  readonly model: string;
  complete(request: CompletionRequest): Promise<CompletionResponse>;
}

export class ProviderError extends Error {
  readonly provider: string;
  readonly status?: number;
  readonly retryable: boolean;

  constructor(opts: {
    provider: string;
    message: string;
    status?: number;
    retryable?: boolean;
  }) {
    super(opts.message);
    this.name = "ProviderError";
    this.provider = opts.provider;
    this.status = opts.status;
    this.retryable = opts.retryable ?? false;
  }
}
