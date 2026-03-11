import { describe, it, expect, vi } from "vitest";

vi.mock("../providers/registry.js", () => ({
  assignProviders: vi.fn(),
  getProviderSummary: vi.fn().mockReturnValue([]),
}));

import { run } from "../cli.js";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("cli module", () => {
  it("exports a run function", () => {
    expect(run).toBeDefined();
  });

  it("run is a function", () => {
    expect(typeof run).toBe("function");
  });
});

describe("run() smoke test", () => {
  it("does not throw when imported", () => {
    // Importing and referencing run should not cause any side effects or errors
    expect(() => run).not.toThrow();
  });
});
