import type { Provider } from "../providers/types.js";
import type { ProviderAssignment } from "../providers/registry.js";
import type { AgentResult, DebateConfig, DebateResult, VerdictResult } from "./types.js";
import { getAdvocatePrompt, getCriticPrompt, getSynthesizerPrompt, getMaxTokens } from "./personas.js";
import { adjustConfidence } from "./confidence.js";

interface RunCallbacks {
  onAdvocateChunk?: (chunk: string) => void;
  onCriticChunk?: (chunk: string) => void;
  onSynthesizerChunk?: (chunk: string) => void;
  onAdvocateStart?: (provider: string, model: string) => void;
  onCriticStart?: (provider: string, model: string) => void;
  onSynthesizerStart?: (provider: string, model: string) => void;
  onAdvocateDone?: (result: AgentResult) => void;
  onCriticDone?: (result: AgentResult) => void;
}

export async function runDebate(
  config: DebateConfig,
  providers: ProviderAssignment,
  callbacks?: RunCallbacks,
): Promise<DebateResult> {
  const maxTokens = getMaxTokens(config.mode);
  const temperature = 0.7;
  const startTime = Date.now();

  // Phase 1: Run advocate and critic in parallel
  const advocatePrompt = getAdvocatePrompt(config.question, config.mode);
  const criticPrompt = getCriticPrompt(config.question, config.mode);

  callbacks?.onAdvocateStart?.(providers.advocate.name, providers.advocate.model);
  callbacks?.onCriticStart?.(providers.critic.name, providers.critic.model);

  const [advocateResult, criticResult] = await Promise.all([
    runAgent(providers.advocate, advocatePrompt, maxTokens, temperature, "advocate", callbacks?.onAdvocateChunk),
    runAgent(providers.critic, criticPrompt, maxTokens, temperature, "critic", callbacks?.onCriticChunk),
  ]);

  callbacks?.onAdvocateDone?.(advocateResult);
  callbacks?.onCriticDone?.(criticResult);

  // Phase 2: Synthesizer reads both arguments
  callbacks?.onSynthesizerStart?.(providers.synthesizer.name, providers.synthesizer.model);

  const synthPrompt = getSynthesizerPrompt(
    config.question,
    advocateResult.argument,
    criticResult.argument,
    config.mode,
  );

  const synthStart = Date.now();
  const synthResponse = await providers.synthesizer.complete({
    system: synthPrompt.system,
    userMessage: synthPrompt.user,
    maxTokens: maxTokens + 500, // Synthesizer needs more room
    temperature: 0.5, // Lower temp for consistent JSON
    onChunk: config.streaming ? callbacks?.onSynthesizerChunk : undefined,
  });
  const synthDuration = Date.now() - synthStart;

  const verdict = parseVerdictResponse(synthResponse.content, synthDuration, providers.synthesizer);

  const totalDuration = Date.now() - startTime;
  const totalTokens =
    advocateResult.promptTokens +
    advocateResult.completionTokens +
    criticResult.promptTokens +
    criticResult.completionTokens +
    verdict.promptTokens +
    verdict.completionTokens;

  const uniqueProviders = [
    ...new Set([providers.advocate.name, providers.critic.name, providers.synthesizer.name]),
  ];

  return {
    question: config.question,
    mode: config.mode,
    advocate: advocateResult,
    critic: criticResult,
    verdict,
    totalTokens,
    totalDurationMs: totalDuration,
    providers: uniqueProviders,
  };
}

async function runAgent(
  provider: Provider,
  prompt: { system: string; user: string },
  maxTokens: number,
  temperature: number,
  role: "advocate" | "critic",
  onChunk?: (chunk: string) => void,
): Promise<AgentResult> {
  const start = Date.now();

  const response = await provider.complete({
    system: prompt.system,
    userMessage: prompt.user,
    maxTokens,
    temperature,
    onChunk,
  });

  const duration = Date.now() - start;
  const argument = parseAgentResponse(response.content);

  return {
    role,
    provider: provider.name,
    model: provider.model,
    argument,
    promptTokens: response.promptTokens,
    completionTokens: response.completionTokens,
    durationMs: duration,
  };
}

function parseAgentResponse(raw: string): string {
  try {
    const cleaned = stripMarkdownFences(raw);
    const parsed = JSON.parse(cleaned) as { argument?: string };
    if (parsed.argument) return parsed.argument;
  } catch {
    // If JSON parsing fails, use raw text
  }
  return raw.trim();
}

function parseVerdictResponse(raw: string, durationMs: number, provider: Provider): VerdictResult {
  try {
    const cleaned = stripMarkdownFences(raw);
    const parsed = JSON.parse(cleaned) as {
      summary?: string;
      confidence?: number;
      forPoints?: string[];
      againstPoints?: string[];
      blindSpots?: string[];
      nextStep?: string;
    };

    return {
      summary: parsed.summary ?? "Unable to synthesize verdict.",
      confidence: adjustConfidence(parsed.confidence ?? 50),
      forPoints: parsed.forPoints ?? [],
      againstPoints: parsed.againstPoints ?? [],
      blindSpots: parsed.blindSpots ?? [],
      nextStep: parsed.nextStep ?? "Research further before deciding.",
      provider: provider.name,
      model: provider.model,
      promptTokens: 0, // Set by caller
      completionTokens: 0,
      durationMs,
    };
  } catch {
    return {
      summary: raw.trim().slice(0, 500),
      confidence: adjustConfidence(50),
      forPoints: [],
      againstPoints: [],
      blindSpots: [],
      nextStep: "Review the raw output above.",
      provider: provider.name,
      model: provider.model,
      promptTokens: 0,
      completionTokens: 0,
      durationMs,
    };
  }
}

function stripMarkdownFences(text: string): string {
  return text.replace(/^```(?:json)?\s*\n?/m, "").replace(/\n?```\s*$/m, "").trim();
}
