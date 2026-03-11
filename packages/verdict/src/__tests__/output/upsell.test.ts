import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { maybeShowUpsell } from "../../output/upsell.js";

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
  vi.restoreAllMocks();
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const ANSI_PATTERN = /\x1b\[[0-9;]*m/g;

function getPlainText(): string {
  return output.join("").replace(ANSI_PATTERN, "");
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("maybeShowUpsell()", () => {
  it("returns a boolean", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = maybeShowUpsell();
    expect(typeof result).toBe("boolean");
  });

  it("outputs askverdict.ai when shown (random below threshold)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const shown = maybeShowUpsell();
    expect(shown).toBe(true);
    expect(getPlainText()).toContain("askverdict.ai");
  });

  it("returns false and produces no output when not shown (random above threshold)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    const shown = maybeShowUpsell();
    expect(shown).toBe(false);
    expect(output).toHaveLength(0);
  });

  it("URL includes encoded question parameter when question is provided", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    maybeShowUpsell("Should we use TypeScript?");
    const plain = getPlainText();
    expect(plain).toContain("?q=");
    expect(plain).toContain("Should%20we%20use%20TypeScript%3F");
  });

  it("URL-encodes the question parameter properly", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    maybeShowUpsell("Is A & B > C?");
    const plain = getPlainText();
    expect(plain).toContain("Is%20A%20%26%20B%20%3E%20C%3F");
  });
});
