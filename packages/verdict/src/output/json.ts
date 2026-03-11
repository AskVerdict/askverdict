import type { DebateResult } from "../engine/types.js";

export interface JsonOutput {
  question: string;
  mode: string;
  advocate: {
    provider: string;
    model: string;
    argument: string;
    tokens: number;
    durationMs: number;
  };
  critic: {
    provider: string;
    model: string;
    argument: string;
    tokens: number;
    durationMs: number;
  };
  verdict: {
    summary: string;
    confidence: number;
    forPoints: string[];
    againstPoints: string[];
    blindSpots: string[];
    nextStep: string;
    provider: string;
    model: string;
  };
  meta: {
    totalTokens: number;
    durationMs: number;
    providers: string[];
    version: string;
  };
}

export function formatJson(result: DebateResult, version: string): JsonOutput {
  return {
    question: result.question,
    mode: result.mode,
    advocate: {
      provider: result.advocate.provider,
      model: result.advocate.model,
      argument: result.advocate.argument,
      tokens: result.advocate.promptTokens + result.advocate.completionTokens,
      durationMs: result.advocate.durationMs,
    },
    critic: {
      provider: result.critic.provider,
      model: result.critic.model,
      argument: result.critic.argument,
      tokens: result.critic.promptTokens + result.critic.completionTokens,
      durationMs: result.critic.durationMs,
    },
    verdict: {
      summary: result.verdict.summary,
      confidence: result.verdict.confidence,
      forPoints: result.verdict.forPoints,
      againstPoints: result.verdict.againstPoints,
      blindSpots: result.verdict.blindSpots,
      nextStep: result.verdict.nextStep,
      provider: result.verdict.provider,
      model: result.verdict.model,
    },
    meta: {
      totalTokens: result.totalTokens,
      durationMs: result.totalDurationMs,
      providers: result.providers,
      version,
    },
  };
}

export function printJson(result: DebateResult, version: string): void {
  const output = formatJson(result, version);
  process.stdout.write(JSON.stringify(output, null, 2) + "\n");
}
