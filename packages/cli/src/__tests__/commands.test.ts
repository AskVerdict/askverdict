import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Shared mock instance (vi.hoisted runs before mock hoisting) ──────────────

const mockClient = vi.hoisted(() => ({
  getMe: vi.fn(),
  getUsage: vi.fn(),
  getDashboard: vi.fn(),
  getScore: vi.fn(),
  getStreak: vi.fn(),
  search: vi.fn(),
  getDebate: vi.fn(),
  deleteDebate: vi.fn(),
  getOutcome: vi.fn(),
  submitOutcome: vi.fn(),
  getPendingOutcomes: vi.fn(),
  getOutcomeHistory: vi.fn(),
  checkHealth: vi.fn(),
}));

vi.mock("@askverdict/sdk", () => ({
  AskVerdictClient: vi.fn(() => mockClient),
}));

vi.mock("fs", () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  existsSync: vi.fn(() => true),
}));

vi.mock("readline", () => ({
  createInterface: vi.fn(() => ({
    question: vi.fn((_q: string, cb: (a: string) => void) => cb("y")),
    close: vi.fn(),
  })),
}));

import * as fs from "fs";
import { makeWhoamiCommand } from "../commands/whoami.js";
import { makeSearchCommand } from "../commands/search.js";
import { makeStatsCommand } from "../commands/stats.js";
import { makeExportCommand } from "../commands/export.js";
import { makeDeleteCommand } from "../commands/delete.js";
import { makeOutcomesCommand } from "../commands/outcomes.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

let captured: string[];
let originalWrite: typeof process.stdout.write;
let originalExit: typeof process.exit;

function captureStdout() {
  captured = [];
  originalWrite = process.stdout.write;
  process.stdout.write = ((chunk: string) => {
    captured.push(chunk.toString());
    return true;
  }) as typeof process.stdout.write;
}

function restoreStdout() {
  process.stdout.write = originalWrite;
}

function getOutput(): string {
  return captured.join("");
}

function setToken() {
  process.env["ASKVERDICT_TOKEN"] = "test-token-123";
}

function setConfigFile() {
  vi.mocked(fs.existsSync).mockReturnValue(true);
  vi.mocked(fs.readFileSync).mockReturnValue(
    JSON.stringify({ apiUrl: "http://localhost:3035", authToken: "cfg-token" }) as never,
  );
}

// ── Setup / Teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  setToken();
  setConfigFile();
  originalExit = process.exit;
  process.exit = vi.fn() as never;
});

afterEach(() => {
  delete process.env["ASKVERDICT_TOKEN"];
  delete process.env["ASKVERDICT_API_URL"];
  process.exit = originalExit;
});

// ── Command registration tests ───────────────────────────────────────────────

describe("command registration", () => {
  it("whoami command has correct name and description", () => {
    const cmd = makeWhoamiCommand();
    expect(cmd.name()).toBe("whoami");
    expect(cmd.description()).toContain("user info");
  });

  it("search command has correct name and accepts query argument", () => {
    const cmd = makeSearchCommand();
    expect(cmd.name()).toBe("search");
    expect(cmd.description()).toContain("Search");
  });

  it("stats command has correct name and description", () => {
    const cmd = makeStatsCommand();
    expect(cmd.name()).toBe("stats");
    expect(cmd.description()).toContain("stats");
  });

  it("export command has correct name and description", () => {
    const cmd = makeExportCommand();
    expect(cmd.name()).toBe("export");
    expect(cmd.description()).toContain("Export");
  });

  it("delete command has correct name and description", () => {
    const cmd = makeDeleteCommand();
    expect(cmd.name()).toBe("delete");
    expect(cmd.description()).toContain("Delete");
  });

  it("outcomes command has correct name and subcommands", () => {
    const cmd = makeOutcomesCommand();
    expect(cmd.name()).toBe("outcomes");
    expect(cmd.description()).toContain("outcome");
    // Verify subcommands exist
    const subCmds = cmd.commands.map((c) => c.name());
    expect(subCmds).toContain("pending");
    expect(subCmds).toContain("record");
    expect(subCmds).toContain("history");
  });
});

// ── whoami command ───────────────────────────────────────────────────────────

describe("whoami command", () => {
  it("outputs user info and usage in JSON mode", async () => {
    const mock = mockClient;
    mock.getMe.mockResolvedValue({
      id: "usr_123",
      name: "Test User",
      email: "test@example.com",
      plan: "byok",
      bio: null,
      location: null,
      createdAt: "2025-06-01T00:00:00Z",
    });
    mock.getUsage.mockResolvedValue({
      debatesThisMonth: 12,
      debatesLimit: 50,
      creditsRemaining: 42,
      freeDebateResetAt: null,
    });

    captureStdout();
    try {
      const cmd = makeWhoamiCommand();
      await cmd.parseAsync(["node", "test", "--json"]);
      const output = getOutput();
      const parsed = JSON.parse(output);
      expect(parsed.name).toBe("Test User");
      expect(parsed.email).toBe("test@example.com");
      expect(parsed.usage.debatesThisMonth).toBe(12);
    } finally {
      restoreStdout();
    }
  });

  it("displays user info in human-readable format", async () => {
    const mock = mockClient;
    mock.getMe.mockResolvedValue({
      id: "usr_123",
      name: "Jane Doe",
      email: "jane@example.com",
      plan: "pro",
      bio: "AI enthusiast",
      location: "NYC",
      createdAt: "2025-01-15T00:00:00Z",
    });
    mock.getUsage.mockResolvedValue({
      debatesThisMonth: 5,
      debatesLimit: 100,
      creditsRemaining: 80,
      freeDebateResetAt: "2025-03-01T00:00:00Z",
    });

    captureStdout();
    try {
      const cmd = makeWhoamiCommand();
      await cmd.parseAsync(["node", "test"]);
      const output = getOutput();
      expect(output).toContain("Jane Doe");
      expect(output).toContain("jane@example.com");
      expect(output).toContain("pro");
      expect(output).toContain("AI enthusiast");
      expect(output).toContain("NYC");
    } finally {
      restoreStdout();
    }
  });

  it("handles API errors in JSON mode", async () => {
    const mock = mockClient;
    mock.getMe.mockRejectedValue(new Error("Unauthorized"));
    mock.getUsage.mockRejectedValue(new Error("Unauthorized"));

    captureStdout();
    try {
      const cmd = makeWhoamiCommand();
      await cmd.parseAsync(["node", "test", "--json"]);
      const output = getOutput();
      expect(output).toContain("Unauthorized");
      expect(process.exit).toHaveBeenCalledWith(1);
    } finally {
      restoreStdout();
    }
  });
});

// ── search command ───────────────────────────────────────────────────────────

describe("search command", () => {
  it("outputs search results in JSON mode", async () => {
    const mock = mockClient;
    mock.search.mockResolvedValue({
      results: [
        { id: "d_1", question: "Should we use React?", status: "completed", confidence: 0.87, createdAt: "2025-06-01" },
        { id: "d_2", question: "Is Rust worth learning?", status: "running", confidence: null, createdAt: "2025-06-02" },
      ],
      total: 2,
      page: 1,
      totalPages: 1,
    });

    captureStdout();
    try {
      const cmd = makeSearchCommand();
      await cmd.parseAsync(["node", "test", "React", "--json"]);
      const output = getOutput();
      const parsed = JSON.parse(output);
      expect(parsed.results).toHaveLength(2);
      expect(parsed.total).toBe(2);
    } finally {
      restoreStdout();
    }
  });

  it("displays no results message when empty", async () => {
    const mock = mockClient;
    mock.search.mockResolvedValue({
      results: [],
      total: 0,
      page: 1,
      totalPages: 0,
    });

    captureStdout();
    try {
      const cmd = makeSearchCommand();
      await cmd.parseAsync(["node", "test", "nonexistent"]);
      const output = getOutput();
      expect(output).toContain("No debates matched");
    } finally {
      restoreStdout();
    }
  });

  it("passes sort, limit, and page options to SDK", async () => {
    const mock = mockClient;
    mock.search.mockResolvedValue({
      results: [],
      total: 0,
      page: 2,
      totalPages: 3,
    });

    captureStdout();
    try {
      const cmd = makeSearchCommand();
      await cmd.parseAsync(["node", "test", "query", "--sort", "date", "-n", "10", "--page", "2", "--json"]);
      expect(mock.search).toHaveBeenCalledWith("query", {
        sort: "date",
        limit: 10,
        page: 2,
        status: undefined,
      });
    } finally {
      restoreStdout();
    }
  });
});

// ── stats command ────────────────────────────────────────────────────────────

describe("stats command", () => {
  it("outputs stats in JSON mode", async () => {
    const mock = mockClient;
    mock.getDashboard.mockResolvedValue({
      totalDebates: 42,
      debatesThisWeek: 7,
      averageCost: 0.0034,
      modeDistribution: { fast: 20, balanced: 15, thorough: 7 },
    });
    mock.getScore.mockResolvedValue({
      overallAccuracy: 0.78,
      totalDecisions: 30,
      correctPredictions: 23,
      brierScore: 0.1234,
      calibrationScore: 0.82,
    });
    mock.getStreak.mockResolvedValue({
      currentStreak: 5,
      longestStreak: 12,
      totalDebates: 42,
      milestones: [],
    });

    captureStdout();
    try {
      const cmd = makeStatsCommand();
      await cmd.parseAsync(["node", "test", "--json"]);
      const output = getOutput();
      const parsed = JSON.parse(output);
      expect(parsed.dashboard.totalDebates).toBe(42);
      expect(parsed.score.overallAccuracy).toBe(0.78);
      expect(parsed.streak.currentStreak).toBe(5);
    } finally {
      restoreStdout();
    }
  });

  it("displays human-readable stats", async () => {
    const mock = mockClient;
    mock.getDashboard.mockResolvedValue({
      totalDebates: 100,
      debatesThisWeek: 3,
      averageCost: null,
      modeDistribution: null,
    });
    mock.getScore.mockResolvedValue({
      overallAccuracy: 0.9,
      totalDecisions: 50,
      correctPredictions: 45,
      brierScore: null,
      calibrationScore: null,
    });
    mock.getStreak.mockResolvedValue({
      currentStreak: 0,
      longestStreak: 10,
      totalDebates: 100,
      milestones: [{ label: "10 debates", reached: true }, { label: "100 debates", reached: true }],
    });

    captureStdout();
    try {
      const cmd = makeStatsCommand();
      await cmd.parseAsync(["node", "test"]);
      const output = getOutput();
      expect(output).toContain("100");
      expect(output).toContain("90%");
      expect(output).toContain("10 debates");
    } finally {
      restoreStdout();
    }
  });
});

// ── export command ───────────────────────────────────────────────────────────

describe("export command", () => {
  const sampleDebate = {
    id: "d_abc",
    question: "Should we use TypeScript?",
    status: "completed",
    mode: "thorough",
    createdAt: "2025-06-01T00:00:00Z",
    completedAt: "2025-06-01T01:00:00Z",
    verdict: {
      summary: "TypeScript provides strong benefits for large codebases.",
      recommendation: {
        recommendation: "Use TypeScript",
        confidence: 0.92,
        rationale: "Type safety reduces bugs significantly.",
      },
      keyFindings: ["Type safety catches bugs early", "Better IDE support"],
    },
  };

  it("exports debate as JSON to stdout", async () => {
    const mock = mockClient;
    mock.getDebate.mockResolvedValue(sampleDebate);

    captureStdout();
    try {
      const cmd = makeExportCommand();
      await cmd.parseAsync(["node", "test", "d_abc", "--format", "json"]);
      const output = getOutput();
      const parsed = JSON.parse(output);
      expect(parsed.question).toBe("Should we use TypeScript?");
      expect(parsed.verdict.summary).toContain("TypeScript");
    } finally {
      restoreStdout();
    }
  });

  it("exports debate as Markdown to stdout", async () => {
    const mock = mockClient;
    mock.getDebate.mockResolvedValue(sampleDebate);

    captureStdout();
    try {
      const cmd = makeExportCommand();
      await cmd.parseAsync(["node", "test", "d_abc", "--format", "md"]);
      const output = getOutput();
      expect(output).toContain("# Should we use TypeScript?");
      expect(output).toContain("## Verdict");
      expect(output).toContain("92%");
      expect(output).toContain("Type safety catches bugs early");
    } finally {
      restoreStdout();
    }
  });

  it("writes output to file when --output is given", async () => {
    const mock = mockClient;
    mock.getDebate.mockResolvedValue(sampleDebate);

    captureStdout();
    try {
      const cmd = makeExportCommand();
      await cmd.parseAsync(["node", "test", "d_abc", "--format", "json", "--output", "/tmp/test-export.json"]);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        "/tmp/test-export.json",
        expect.stringContaining("Should we use TypeScript?"),
        "utf-8",
      );
    } finally {
      restoreStdout();
    }
  });

  it("rejects unknown formats", async () => {
    captureStdout();
    try {
      const cmd = makeExportCommand();
      await cmd.parseAsync(["node", "test", "d_abc", "--format", "csv"]);
      expect(process.exit).toHaveBeenCalledWith(1);
    } finally {
      restoreStdout();
    }
  });
});

// ── delete command ───────────────────────────────────────────────────────────

describe("delete command", () => {
  it("deletes with --force and outputs JSON", async () => {
    const mock = mockClient;
    mock.deleteDebate.mockResolvedValue(undefined);

    captureStdout();
    try {
      const cmd = makeDeleteCommand();
      await cmd.parseAsync(["node", "test", "d_123", "--force", "--json"]);
      const output = getOutput();
      const parsed = JSON.parse(output);
      expect(parsed.deleted).toBe(true);
      expect(parsed.id).toBe("d_123");
      expect(mock.deleteDebate).toHaveBeenCalledWith("d_123");
    } finally {
      restoreStdout();
    }
  });

  it("deletes with --force and shows success message", async () => {
    const mock = mockClient;
    mock.deleteDebate.mockResolvedValue(undefined);

    captureStdout();
    try {
      const cmd = makeDeleteCommand();
      await cmd.parseAsync(["node", "test", "d_456", "--force"]);
      const output = getOutput();
      expect(output).toContain("d_456");
      expect(output).toContain("deleted");
    } finally {
      restoreStdout();
    }
  });

  it("handles API errors on delete", async () => {
    const mock = mockClient;
    mock.deleteDebate.mockRejectedValue(new Error("Not found"));

    captureStdout();
    try {
      const cmd = makeDeleteCommand();
      await cmd.parseAsync(["node", "test", "d_bad", "--force", "--json"]);
      const output = getOutput();
      expect(output).toContain("Not found");
      expect(process.exit).toHaveBeenCalledWith(1);
    } finally {
      restoreStdout();
    }
  });
});

// ── outcomes command ─────────────────────────────────────────────────────────

describe("outcomes command", () => {
  it("lists pending outcomes in JSON mode", async () => {
    const mock = mockClient;
    mock.getPendingOutcomes.mockResolvedValue([
      {
        debateId: "d_1",
        actualOutcome: null,
        verdictWasCorrect: null,
        recordedAt: "2025-06-01T00:00:00Z",
      },
    ]);

    captureStdout();
    try {
      const cmd = makeOutcomesCommand();
      await cmd.parseAsync(["node", "test", "pending", "--json"]);
      const output = getOutput();
      const parsed = JSON.parse(output);
      expect(parsed.pending).toHaveLength(1);
      expect(parsed.pending[0].debateId).toBe("d_1");
    } finally {
      restoreStdout();
    }
  });

  it("records an outcome with --correct flag", async () => {
    const mock = mockClient;
    mock.submitOutcome.mockResolvedValue({
      debateId: "d_1",
      actualOutcome: "TypeScript won",
      verdictWasCorrect: true,
      recordedAt: "2025-06-01T00:00:00Z",
    });

    captureStdout();
    try {
      const cmd = makeOutcomesCommand();
      await cmd.parseAsync(["node", "test", "record", "d_1", "TypeScript won", "--correct", "--json"]);
      const output = getOutput();
      const parsed = JSON.parse(output);
      expect(parsed.actualOutcome).toBe("TypeScript won");
      expect(parsed.verdictWasCorrect).toBe(true);
    } finally {
      restoreStdout();
    }
  });

  it("shows history in human-readable format", async () => {
    const mock = mockClient;
    mock.getOutcomeHistory.mockResolvedValue([
      {
        debateId: "d_1",
        actualOutcome: "Result A",
        verdictWasCorrect: true,
        recordedAt: "2025-06-01T00:00:00Z",
      },
      {
        debateId: "d_2",
        actualOutcome: "Result B",
        verdictWasCorrect: false,
        recordedAt: "2025-06-02T00:00:00Z",
      },
    ]);

    captureStdout();
    try {
      const cmd = makeOutcomesCommand();
      await cmd.parseAsync(["node", "test", "history"]);
      const output = getOutput();
      expect(output).toContain("Outcome History");
      expect(output).toContain("2 shown");
    } finally {
      restoreStdout();
    }
  });

  it("shows empty pending message", async () => {
    const mock = mockClient;
    mock.getPendingOutcomes.mockResolvedValue([]);

    captureStdout();
    try {
      const cmd = makeOutcomesCommand();
      await cmd.parseAsync(["node", "test", "pending"]);
      const output = getOutput();
      expect(output).toContain("No debates awaiting");
    } finally {
      restoreStdout();
    }
  });
});
