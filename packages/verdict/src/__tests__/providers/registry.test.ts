import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { ProviderName } from "../../providers/types.js";

vi.mock("../../config.js", () => ({
  loadConfig: () => ({}),
}));

// Import after mock is set up
const { detectKeys, assignProviders, getProviderSummary } = await import("../../providers/registry.js");

describe("registry", () => {
  // Save original env values to restore after each test
  let originalAnthropicKey: string | undefined;
  let originalOpenAIKey: string | undefined;
  let originalGeminiKey: string | undefined;

  beforeEach(() => {
    originalAnthropicKey = process.env["ANTHROPIC_API_KEY"];
    originalOpenAIKey = process.env["OPENAI_API_KEY"];
    originalGeminiKey = process.env["GEMINI_API_KEY"];

    delete process.env["ANTHROPIC_API_KEY"];
    delete process.env["OPENAI_API_KEY"];
    delete process.env["GEMINI_API_KEY"];
  });

  afterEach(() => {
    if (originalAnthropicKey !== undefined) {
      process.env["ANTHROPIC_API_KEY"] = originalAnthropicKey;
    } else {
      delete process.env["ANTHROPIC_API_KEY"];
    }

    if (originalOpenAIKey !== undefined) {
      process.env["OPENAI_API_KEY"] = originalOpenAIKey;
    } else {
      delete process.env["OPENAI_API_KEY"];
    }

    if (originalGeminiKey !== undefined) {
      process.env["GEMINI_API_KEY"] = originalGeminiKey;
    } else {
      delete process.env["GEMINI_API_KEY"];
    }
  });

  describe("detectKeys()", () => {
    it("returns empty array when no env vars are set", () => {
      const keys = detectKeys();
      expect(keys).toEqual([]);
    });

    it("finds ANTHROPIC_API_KEY from env", () => {
      process.env["ANTHROPIC_API_KEY"] = "sk-ant-test-key";
      const keys = detectKeys();
      expect(keys).toHaveLength(1);
      expect(keys[0]).toMatchObject({ name: "anthropic" as ProviderName, key: "sk-ant-test-key" });
    });

    it("finds OPENAI_API_KEY from env", () => {
      process.env["OPENAI_API_KEY"] = "sk-openai-test-key";
      const keys = detectKeys();
      expect(keys).toHaveLength(1);
      expect(keys[0]).toMatchObject({ name: "openai" as ProviderName, key: "sk-openai-test-key" });
    });

    it("finds GEMINI_API_KEY from env", () => {
      process.env["GEMINI_API_KEY"] = "gemini-test-key";
      const keys = detectKeys();
      expect(keys).toHaveLength(1);
      expect(keys[0]).toMatchObject({ name: "google" as ProviderName, key: "gemini-test-key" });
    });

    it("finds all 3 keys when all env vars are set", () => {
      process.env["ANTHROPIC_API_KEY"] = "sk-ant-test-key";
      process.env["OPENAI_API_KEY"] = "sk-openai-test-key";
      process.env["GEMINI_API_KEY"] = "gemini-test-key";

      const keys = detectKeys();
      expect(keys).toHaveLength(3);

      const names = keys.map((k) => k.name);
      expect(names).toContain("anthropic");
      expect(names).toContain("openai");
      expect(names).toContain("google");
    });
  });

  describe("assignProviders()", () => {
    it("throws when no keys are available", () => {
      expect(() => assignProviders()).toThrow(/No API keys found/);
    });

    it("assigns same provider to all roles when only 1 key is set", () => {
      process.env["OPENAI_API_KEY"] = "sk-openai-test-key";

      const assignment = assignProviders();

      expect(assignment.advocate.name).toBe("openai");
      expect(assignment.critic.name).toBe("openai");
      expect(assignment.synthesizer.name).toBe("openai");
    });

    it("splits roles across 2 providers when 2 keys are set", () => {
      process.env["ANTHROPIC_API_KEY"] = "sk-ant-test-key";
      process.env["OPENAI_API_KEY"] = "sk-openai-test-key";

      const assignment = assignProviders();

      // With 2 keys: advocate=first, critic=second, synthesizer=first
      expect(assignment.advocate.name).toBe("anthropic");
      expect(assignment.critic.name).toBe("openai");
      expect(assignment.synthesizer.name).toBe("anthropic");
    });

    it("assigns unique providers to all roles when 3 keys are set", () => {
      process.env["ANTHROPIC_API_KEY"] = "sk-ant-test-key";
      process.env["OPENAI_API_KEY"] = "sk-openai-test-key";
      process.env["GEMINI_API_KEY"] = "gemini-test-key";

      const assignment = assignProviders();

      // Each role gets a distinct provider
      const names = [assignment.advocate.name, assignment.critic.name, assignment.synthesizer.name];
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(3);
      expect(uniqueNames).toContain("anthropic");
      expect(uniqueNames).toContain("openai");
      expect(uniqueNames).toContain("google");
    });

    it("respects the filter parameter", () => {
      process.env["ANTHROPIC_API_KEY"] = "sk-ant-test-key";
      process.env["OPENAI_API_KEY"] = "sk-openai-test-key";
      process.env["GEMINI_API_KEY"] = "gemini-test-key";

      const filter: ProviderName[] = ["openai"];
      const assignment = assignProviders(filter);

      expect(assignment.advocate.name).toBe("openai");
      expect(assignment.critic.name).toBe("openai");
      expect(assignment.synthesizer.name).toBe("openai");
    });

    it("throws when filter matches no available keys", () => {
      process.env["OPENAI_API_KEY"] = "sk-openai-test-key";

      const filter: ProviderName[] = ["anthropic"];
      expect(() => assignProviders(filter)).toThrow(/No keys found for providers: anthropic/);
    });
  });

  describe("getProviderSummary()", () => {
    it("returns summaries for detected providers from env", () => {
      process.env["ANTHROPIC_API_KEY"] = "sk-ant-test-key";
      process.env["OPENAI_API_KEY"] = "sk-openai-test-key";

      const summary = getProviderSummary();

      expect(summary).toHaveLength(2);

      const anthropicEntry = summary.find((s) => s.provider === "anthropic");
      expect(anthropicEntry).toBeDefined();
      expect(anthropicEntry?.source).toBe("env");
      expect(typeof anthropicEntry?.model).toBe("string");

      const openaiEntry = summary.find((s) => s.provider === "openai");
      expect(openaiEntry).toBeDefined();
      expect(openaiEntry?.source).toBe("env");
      expect(typeof openaiEntry?.model).toBe("string");
    });

    it("returns empty array when no keys are set", () => {
      const summary = getProviderSummary();
      expect(summary).toEqual([]);
    });
  });
});
