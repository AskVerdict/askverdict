import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { VerdictResult, DebateResult, AgentResult } from "../../engine/types.js";
import {
  renderHeader,
  renderAgentHeader,
  renderAgentStreaming,
  renderAgentFallback,
  renderVerdictBox,
  renderStats,
} from "../../output/renderer.js";

// ── Output capture ───────────────────────────────────────────────────────────

let output: string[];
const originalWrite = process.stdout.write.bind(process.stdout);

beforeEach(() => {
  output = [];
  process.stdout.write = ((chunk: string) => {
    output.push(chunk);
    return true;
  }) as typeof process.stdout.write;
});

afterEach(() => {
  process.stdout.write = originalWrite;
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const ANSI_PATTERN = /\x1b\[[0-9;]*m/g;

function getPlainText(): string {
  return output.join("").replace(ANSI_PATTERN, "");
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const mockVerdict: VerdictResult = {
  summary: "Test summary verdict",
  confidence: 78,
  forPoints: ["Good point 1"],
  againstPoints: ["Bad point 1"],
  blindSpots: ["Missing angle"],
  nextStep: "Do this next",
  provider: "openai",
  model: "gpt-4o",
  promptTokens: 100,
  completionTokens: 200,
  durationMs: 5000,
};

const mockAdvocate: AgentResult = {
  role: "advocate",
  provider: "anthropic",
  model: "claude-3-5-sonnet-20241022",
  argument: "The advocate argument text.",
  promptTokens: 50,
  completionTokens: 100,
  durationMs: 1200,
};

const mockCritic: AgentResult = {
  role: "critic",
  provider: "openai",
  model: "gpt-4o",
  argument: "The critic argument text.",
  promptTokens: 50,
  completionTokens: 100,
  durationMs: 1300,
};

const mockDebateResult: DebateResult = {
  question: "Should we adopt TypeScript?",
  mode: "balanced",
  advocate: mockAdvocate,
  critic: mockCritic,
  verdict: mockVerdict,
  totalTokens: 600,
  totalDurationMs: 8500,
  providers: ["anthropic", "openai", "google"],
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("renderHeader()", () => {
  it("outputs the question text", () => {
    renderHeader("Is TypeScript worth it?");
    expect(getPlainText()).toContain("Is TypeScript worth it?");
  });

  it("outputs verdict branding", () => {
    renderHeader("Some question here");
    expect(getPlainText()).toContain("verdict");
  });
});

describe("renderAgentHeader()", () => {
  it("shows THE ADVOCATE and FOR for advocate role", () => {
    renderAgentHeader("advocate", "anthropic", "claude-3-5-sonnet-20241022");
    const plain = getPlainText();
    expect(plain).toContain("THE ADVOCATE");
    expect(plain).toContain("FOR");
  });

  it("shows THE CRITIC and AGAINST for critic role", () => {
    renderAgentHeader("critic", "openai", "gpt-4o");
    const plain = getPlainText();
    expect(plain).toContain("THE CRITIC");
    expect(plain).toContain("AGAINST");
  });

  it("includes provider and model info", () => {
    renderAgentHeader("advocate", "anthropic", "claude-3-5-sonnet-20241022");
    const plain = getPlainText();
    expect(plain).toContain("Anthropic");
    expect(plain).toContain("claude-3-5-sonnet-20241022");
  });
});

describe("renderAgentStreaming()", () => {
  it("returns a function", () => {
    const handler = renderAgentStreaming("advocate");
    expect(typeof handler).toBe("function");
  });
});

describe("renderAgentFallback()", () => {
  it("outputs the argument text", () => {
    renderAgentFallback(mockAdvocate);
    expect(getPlainText()).toContain("The advocate argument text.");
  });
});

describe("renderVerdictBox()", () => {
  it("shows VERDICT label", () => {
    renderVerdictBox(mockVerdict);
    expect(getPlainText()).toContain("VERDICT");
  });

  it("shows confidence percentage", () => {
    renderVerdictBox(mockVerdict);
    expect(getPlainText()).toContain("78%");
  });

  it("shows summary text", () => {
    renderVerdictBox(mockVerdict);
    expect(getPlainText()).toContain("Test summary verdict");
  });

  it("shows for points", () => {
    renderVerdictBox(mockVerdict);
    expect(getPlainText()).toContain("Good point 1");
  });

  it("shows against points", () => {
    renderVerdictBox(mockVerdict);
    expect(getPlainText()).toContain("Bad point 1");
  });
});

describe("renderStats()", () => {
  it("shows provider count", () => {
    renderStats(mockDebateResult);
    expect(getPlainText()).toContain("3 providers");
  });

  it("shows token count", () => {
    renderStats(mockDebateResult);
    expect(getPlainText()).toContain("600");
  });

  it("shows duration in seconds", () => {
    renderStats(mockDebateResult);
    expect(getPlainText()).toContain("8.5s");
  });
});
