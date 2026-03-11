import { describe, it, expect, vi } from "vitest";
import type { Provider } from "../../providers/types.js";
import type { ProviderAssignment } from "../../providers/registry.js";
import { runDebate } from "../../engine/runner.js";
import type { DebateConfig } from "../../engine/types.js";

// --- Mock helpers ---

function createMockProvider(name: "anthropic" | "openai" | "google", response: string): Provider {
  return {
    name,
    model: `mock-${name}-model`,
    complete: vi.fn().mockResolvedValue({
      content: response,
      promptTokens: 10,
      completionTokens: 20,
      model: `mock-${name}-model`,
    }),
  };
}

const ADVOCATE_RESPONSE = JSON.stringify({
  argument: "This is the mock advocate argument for testing.",
});

const CRITIC_RESPONSE = JSON.stringify({
  argument: "This is the mock critic argument for testing.",
});

const SYNTHESIZER_RESPONSE = JSON.stringify({
  summary: "Test verdict summary",
  confidence: 75,
  forPoints: ["point 1"],
  againstPoints: ["point 2"],
  blindSpots: ["blind spot"],
  nextStep: "Take this action",
});

function makeProviders(
  advocateName: "anthropic" | "openai" | "google" = "anthropic",
  criticName: "anthropic" | "openai" | "google" = "openai",
  synthName: "anthropic" | "openai" | "google" = "google",
): ProviderAssignment {
  return {
    advocate: createMockProvider(advocateName, ADVOCATE_RESPONSE),
    critic: createMockProvider(criticName, CRITIC_RESPONSE),
    synthesizer: createMockProvider(synthName, SYNTHESIZER_RESPONSE),
  };
}

const BASE_CONFIG: DebateConfig = {
  question: "Should we adopt TypeScript?",
  mode: "balanced",
  streaming: false,
};

// --- Tests ---

describe("runner", () => {
  describe("runDebate()", () => {
    it("returns a complete DebateResult", async () => {
      const providers = makeProviders();
      const result = await runDebate(BASE_CONFIG, providers);

      expect(result).toBeDefined();
      expect(result.question).toBe(BASE_CONFIG.question);
      expect(result.mode).toBe(BASE_CONFIG.mode);
    });

    it("result contains advocate and critic results", async () => {
      const providers = makeProviders();
      const result = await runDebate(BASE_CONFIG, providers);

      expect(result.advocate).toBeDefined();
      expect(result.advocate.role).toBe("advocate");
      expect(result.advocate.argument).toBe("This is the mock advocate argument for testing.");

      expect(result.critic).toBeDefined();
      expect(result.critic.role).toBe("critic");
      expect(result.critic.argument).toBe("This is the mock critic argument for testing.");
    });

    it("result contains verdict with summary and confidence", async () => {
      const providers = makeProviders();
      const result = await runDebate(BASE_CONFIG, providers);

      expect(result.verdict).toBeDefined();
      expect(result.verdict.summary).toBe("Test verdict summary");
      // adjustConfidence(75) -> 75 >= 65: 75 - 5 = 70
      expect(result.verdict.confidence).toBe(70);
    });

    it("advocate and critic run in parallel - both providers called before synthesizer", async () => {
      const callOrder: string[] = [];

      const advocate = createMockProvider("anthropic", ADVOCATE_RESPONSE);
      (advocate.complete as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        callOrder.push("advocate");
        return { content: ADVOCATE_RESPONSE, promptTokens: 10, completionTokens: 20, model: "mock-anthropic-model" };
      });

      const critic = createMockProvider("openai", CRITIC_RESPONSE);
      (critic.complete as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        callOrder.push("critic");
        return { content: CRITIC_RESPONSE, promptTokens: 10, completionTokens: 20, model: "mock-openai-model" };
      });

      const synthesizer = createMockProvider("google", SYNTHESIZER_RESPONSE);
      (synthesizer.complete as ReturnType<typeof vi.fn>).mockImplementation(async () => {
        callOrder.push("synthesizer");
        return { content: SYNTHESIZER_RESPONSE, promptTokens: 10, completionTokens: 20, model: "mock-google-model" };
      });

      const providers: ProviderAssignment = { advocate, critic, synthesizer };
      await runDebate(BASE_CONFIG, providers);

      // Synthesizer must be last
      expect(callOrder[callOrder.length - 1]).toBe("synthesizer");
      // Both advocate and critic are called before synthesizer
      expect(callOrder.indexOf("advocate")).toBeLessThan(callOrder.indexOf("synthesizer"));
      expect(callOrder.indexOf("critic")).toBeLessThan(callOrder.indexOf("synthesizer"));
    });

    it("synthesizer receives both arguments in its prompt", async () => {
      const providers = makeProviders();
      await runDebate(BASE_CONFIG, providers);

      const synthComplete = providers.synthesizer.complete as ReturnType<typeof vi.fn>;
      expect(synthComplete).toHaveBeenCalledOnce();

      const [request] = synthComplete.mock.calls[0] as [{ system: string; userMessage: string }];
      expect(request.userMessage).toContain("This is the mock advocate argument for testing.");
      expect(request.userMessage).toContain("This is the mock critic argument for testing.");
    });

    it("uses correct mode settings - fast mode uses 500 max tokens for advocate/critic", async () => {
      const providers = makeProviders();
      const config: DebateConfig = { ...BASE_CONFIG, mode: "fast" };
      await runDebate(config, providers);

      const advocateComplete = providers.advocate.complete as ReturnType<typeof vi.fn>;
      const [request] = advocateComplete.mock.calls[0] as [{ maxTokens: number }];
      expect(request.maxTokens).toBe(500);
    });

    it("uses correct mode settings - thorough mode uses 2000 max tokens for advocate/critic", async () => {
      const providers = makeProviders();
      const config: DebateConfig = { ...BASE_CONFIG, mode: "thorough" };
      await runDebate(config, providers);

      const advocateComplete = providers.advocate.complete as ReturnType<typeof vi.fn>;
      const [request] = advocateComplete.mock.calls[0] as [{ maxTokens: number }];
      expect(request.maxTokens).toBe(2000);
    });

    it("handles raw text fallback when JSON parsing fails for agent response", async () => {
      const rawText = "This is just plain text, not JSON at all.";
      const providers: ProviderAssignment = {
        advocate: createMockProvider("anthropic", rawText),
        critic: createMockProvider("openai", CRITIC_RESPONSE),
        synthesizer: createMockProvider("google", SYNTHESIZER_RESPONSE),
      };

      const result = await runDebate(BASE_CONFIG, providers);
      // Raw text is used as-is when JSON parsing fails
      expect(result.advocate.argument).toBe(rawText);
    });

    it("handles raw text fallback when JSON parsing fails for synthesizer response", async () => {
      const rawText = "Plain text verdict that cannot be parsed as JSON.";
      const providers: ProviderAssignment = {
        advocate: createMockProvider("anthropic", ADVOCATE_RESPONSE),
        critic: createMockProvider("openai", CRITIC_RESPONSE),
        synthesizer: createMockProvider("google", rawText),
      };

      const result = await runDebate(BASE_CONFIG, providers);
      // Summary falls back to sliced raw text
      expect(result.verdict.summary).toBe(rawText.slice(0, 500));
      // Confidence falls back to adjustConfidence(50) = 53
      expect(result.verdict.confidence).toBe(53);
    });

    it("calls onAdvocateStart callback with provider name and model", async () => {
      const providers = makeProviders();
      const onAdvocateStart = vi.fn();
      await runDebate(BASE_CONFIG, providers, { onAdvocateStart });

      expect(onAdvocateStart).toHaveBeenCalledOnce();
      expect(onAdvocateStart).toHaveBeenCalledWith("anthropic", "mock-anthropic-model");
    });

    it("calls onCriticStart callback with provider name and model", async () => {
      const providers = makeProviders();
      const onCriticStart = vi.fn();
      await runDebate(BASE_CONFIG, providers, { onCriticStart });

      expect(onCriticStart).toHaveBeenCalledOnce();
      expect(onCriticStart).toHaveBeenCalledWith("openai", "mock-openai-model");
    });

    it("calls onAdvocateDone callback with agent result", async () => {
      const providers = makeProviders();
      const onAdvocateDone = vi.fn();
      await runDebate(BASE_CONFIG, providers, { onAdvocateDone });

      expect(onAdvocateDone).toHaveBeenCalledOnce();
      const [result] = onAdvocateDone.mock.calls[0] as [{ role: string; argument: string }];
      expect(result.role).toBe("advocate");
      expect(result.argument).toBe("This is the mock advocate argument for testing.");
    });

    it("calls onCriticDone callback with agent result", async () => {
      const providers = makeProviders();
      const onCriticDone = vi.fn();
      await runDebate(BASE_CONFIG, providers, { onCriticDone });

      expect(onCriticDone).toHaveBeenCalledOnce();
      const [result] = onCriticDone.mock.calls[0] as [{ role: string; argument: string }];
      expect(result.role).toBe("critic");
      expect(result.argument).toBe("This is the mock critic argument for testing.");
    });

    it("totalTokens sums all agent tokens", async () => {
      const providers = makeProviders();
      const result = await runDebate(BASE_CONFIG, providers);

      // Each mock provider returns promptTokens=10 and completionTokens=20
      // advocate: 10 + 20 = 30
      // critic:   10 + 20 = 30
      // synthesizer: promptTokens/completionTokens are set to 0 by parseVerdictResponse
      // total = 30 + 30 + 0 + 0 = 60
      expect(result.totalTokens).toBe(60);
    });

    it("providers array contains unique provider names", async () => {
      // All three roles use different providers
      const providers = makeProviders("anthropic", "openai", "google");
      const result = await runDebate(BASE_CONFIG, providers);

      expect(result.providers).toHaveLength(3);
      expect(result.providers).toContain("anthropic");
      expect(result.providers).toContain("openai");
      expect(result.providers).toContain("google");
    });

    it("providers array deduplicates when the same provider is reused", async () => {
      // All three roles use the same provider
      const singleProvider = createMockProvider("anthropic", ADVOCATE_RESPONSE);
      // Synthesizer needs the synthesizer response
      const synthProvider = createMockProvider("anthropic", SYNTHESIZER_RESPONSE);

      const providers: ProviderAssignment = {
        advocate: singleProvider,
        critic: createMockProvider("anthropic", CRITIC_RESPONSE),
        synthesizer: synthProvider,
      };

      const result = await runDebate(BASE_CONFIG, providers);
      // Three providers all named "anthropic" -> deduplicates to 1
      const uniqueNames = [...new Set(result.providers)];
      expect(uniqueNames).toHaveLength(1);
      expect(uniqueNames[0]).toBe("anthropic");
    });

    it("streaming flag controls whether onChunk is passed to synthesizer", async () => {
      const providers = makeProviders();
      const onSynthesizerChunk = vi.fn();

      // With streaming: false - onChunk should NOT be passed
      await runDebate({ ...BASE_CONFIG, streaming: false }, providers, { onSynthesizerChunk });

      const synthComplete = providers.synthesizer.complete as ReturnType<typeof vi.fn>;
      const [request] = synthComplete.mock.calls[0] as [{ onChunk?: unknown }];
      expect(request.onChunk).toBeUndefined();
    });

    it("streaming flag passes onChunk to synthesizer when streaming is true", async () => {
      const providers = makeProviders();
      const onSynthesizerChunk = vi.fn();

      await runDebate({ ...BASE_CONFIG, streaming: true }, providers, { onSynthesizerChunk });

      const synthComplete = providers.synthesizer.complete as ReturnType<typeof vi.fn>;
      const [request] = synthComplete.mock.calls[0] as [{ onChunk?: unknown }];
      expect(request.onChunk).toBe(onSynthesizerChunk);
    });

    it("verdict includes forPoints and againstPoints from synthesizer response", async () => {
      const providers = makeProviders();
      const result = await runDebate(BASE_CONFIG, providers);

      expect(result.verdict.forPoints).toEqual(["point 1"]);
      expect(result.verdict.againstPoints).toEqual(["point 2"]);
    });

    it("verdict includes blindSpots and nextStep from synthesizer response", async () => {
      const providers = makeProviders();
      const result = await runDebate(BASE_CONFIG, providers);

      expect(result.verdict.blindSpots).toEqual(["blind spot"]);
      expect(result.verdict.nextStep).toBe("Take this action");
    });

    it("result includes provider and model on advocate result", async () => {
      const providers = makeProviders();
      const result = await runDebate(BASE_CONFIG, providers);

      expect(result.advocate.provider).toBe("anthropic");
      expect(result.advocate.model).toBe("mock-anthropic-model");
    });

    it("result includes provider and model on critic result", async () => {
      const providers = makeProviders();
      const result = await runDebate(BASE_CONFIG, providers);

      expect(result.critic.provider).toBe("openai");
      expect(result.critic.model).toBe("mock-openai-model");
    });

    it("result includes totalDurationMs as a positive number", async () => {
      const providers = makeProviders();
      const result = await runDebate(BASE_CONFIG, providers);

      expect(result.totalDurationMs).toBeGreaterThanOrEqual(0);
      expect(typeof result.totalDurationMs).toBe("number");
    });
  });
});
