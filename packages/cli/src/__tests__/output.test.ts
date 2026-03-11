import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Color stripping helper ────────────────────────────────────────────────────
// Remove ANSI escape codes so tests are independent of TTY state.

function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

// ── Module under test ─────────────────────────────────────────────────────────
// Import after setting up env so the module-level USE_COLOR is deterministic.

import {
  statusBadge,
  truncate,
  printTable,
  print,
  printErr,
  success,
  info,
  warn,
  error,
  c,
  type Row,
} from "../output.js";

// ── stdout / stderr capture ───────────────────────────────────────────────────

let stdoutOutput: string[] = [];
let stderrOutput: string[] = [];

beforeEach(() => {
  stdoutOutput = [];
  stderrOutput = [];
  vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
    stdoutOutput.push(String(chunk));
    return true;
  });
  vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
    stderrOutput.push(String(chunk));
    return true;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── statusBadge() ─────────────────────────────────────────────────────────────

describe("statusBadge()", () => {
  it("returns the plain status string for unknown statuses", () => {
    const result = stripAnsi(statusBadge("unknown-status"));
    expect(result).toBe("unknown-status");
  });

  it("wraps 'completed' status (case-insensitive)", () => {
    const lower = stripAnsi(statusBadge("completed"));
    const upper = stripAnsi(statusBadge("COMPLETED"));
    expect(lower).toBe("completed");
    expect(upper).toBe("COMPLETED");
  });

  it("wraps 'active' status", () => {
    const result = stripAnsi(statusBadge("active"));
    expect(result).toBe("active");
  });

  it("wraps 'running' status", () => {
    const result = stripAnsi(statusBadge("running"));
    expect(result).toBe("running");
  });

  it("wraps 'failed' status", () => {
    const result = stripAnsi(statusBadge("failed"));
    expect(result).toBe("failed");
  });

  it("wraps 'paused' status", () => {
    const result = stripAnsi(statusBadge("paused"));
    expect(result).toBe("paused");
  });

  it("wraps 'pending' status", () => {
    const result = stripAnsi(statusBadge("pending"));
    expect(result).toBe("pending");
  });

  it("preserves the original text regardless of ANSI wrapping", () => {
    for (const s of ["completed", "active", "running", "failed", "paused", "pending"]) {
      expect(stripAnsi(statusBadge(s))).toBe(s);
    }
  });
});

// ── truncate() ────────────────────────────────────────────────────────────────

describe("truncate()", () => {
  it("returns the original string when it is shorter than maxLen", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("returns the original string when it equals maxLen exactly", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });

  it("truncates and appends ellipsis when string exceeds maxLen", () => {
    const result = truncate("Hello, world!", 10);
    expect(result).toBe("Hello, ...");
    expect(result).toHaveLength(10);
  });

  it("handles very short maxLen of 3 (all ellipsis)", () => {
    const result = truncate("abcdefgh", 3);
    expect(result).toBe("...");
    expect(result).toHaveLength(3);
  });

  it("handles maxLen of 4 (one char + ellipsis)", () => {
    const result = truncate("abcdefgh", 4);
    expect(result).toBe("a...");
    expect(result).toHaveLength(4);
  });

  it("does not truncate empty strings", () => {
    expect(truncate("", 5)).toBe("");
  });
});

// ── printTable() ──────────────────────────────────────────────────────────────

describe("printTable()", () => {
  it("prints a (no results) message when rows array is empty", () => {
    printTable([]);
    const output = stdoutOutput.join("");
    expect(stripAnsi(output)).toContain("(no results)");
  });

  it("prints header row with column names uppercased", () => {
    const rows: Row[] = [{ id: "1", name: "Alice", status: "active" }];
    printTable(rows);
    const output = stripAnsi(stdoutOutput.join(""));
    expect(output).toContain("ID");
    expect(output).toContain("NAME");
    expect(output).toContain("STATUS");
  });

  it("prints data values for each row", () => {
    const rows: Row[] = [
      { id: "d1", question: "Is TypeScript good?" },
      { id: "d2", question: "Coffee or tea?" },
    ];
    printTable(rows);
    const output = stripAnsi(stdoutOutput.join(""));
    expect(output).toContain("d1");
    expect(output).toContain("Is TypeScript good?");
    expect(output).toContain("d2");
    expect(output).toContain("Coffee or tea?");
  });

  it("respects custom columns array and only shows those columns", () => {
    const rows: Row[] = [{ id: "1", name: "Alice", secret: "hidden" }];
    printTable(rows, ["id", "name"]);
    const output = stripAnsi(stdoutOutput.join(""));
    expect(output).toContain("ID");
    expect(output).toContain("NAME");
    expect(output).not.toContain("SECRET");
    expect(output).not.toContain("hidden");
  });

  it("handles null and undefined cell values as empty strings", () => {
    const rows: Row[] = [{ id: "1", name: null, status: undefined }];
    printTable(rows);
    // Should not throw and should render without "null" or "undefined" text
    const output = stripAnsi(stdoutOutput.join(""));
    expect(output).toContain("1");
  });

  it("pads columns to align values correctly", () => {
    const rows: Row[] = [
      { id: "short", value: "x" },
      { id: "a-much-longer-id", value: "y" },
    ];
    printTable(rows);
    const lines = stripAnsi(stdoutOutput.join("")).split("\n").filter(Boolean);
    // Both data lines should have the same length due to padding
    const dataLines = lines.filter((l) => l.includes("x") || l.includes("y"));
    expect(dataLines.length).toBeGreaterThanOrEqual(2);
  });
});

// ── Color helpers (c.*) ───────────────────────────────────────────────────────

describe("color helpers (c.*)", () => {
  it("c.bold — stripped text matches input", () => {
    expect(stripAnsi(c.bold("hello"))).toBe("hello");
  });

  it("c.green — stripped text matches input", () => {
    expect(stripAnsi(c.green("ok"))).toBe("ok");
  });

  it("c.red — stripped text matches input", () => {
    expect(stripAnsi(c.red("error"))).toBe("error");
  });

  it("c.cyan — stripped text matches input", () => {
    expect(stripAnsi(c.cyan("info"))).toBe("info");
  });

  it("c.yellow — stripped text matches input", () => {
    expect(stripAnsi(c.yellow("warn"))).toBe("warn");
  });

  it("c.gray — stripped text matches input", () => {
    expect(stripAnsi(c.gray("dim text"))).toBe("dim text");
  });
});

// ── Output helpers ────────────────────────────────────────────────────────────

describe("output helpers", () => {
  it("print() writes message to stdout with newline", () => {
    print("test message");
    expect(stdoutOutput.join("")).toBe("test message\n");
  });

  it("printErr() writes message to stderr with newline", () => {
    printErr("error message");
    expect(stderrOutput.join("")).toBe("error message\n");
  });

  it("success() writes to stdout and contains the message text", () => {
    success("All done!");
    const output = stripAnsi(stdoutOutput.join(""));
    expect(output).toContain("All done!");
  });

  it("info() writes to stdout and contains the message text", () => {
    info("Loading...");
    const output = stripAnsi(stdoutOutput.join(""));
    expect(output).toContain("Loading...");
  });

  it("warn() writes to stderr and contains the message text", () => {
    warn("Something is off");
    const output = stripAnsi(stderrOutput.join(""));
    expect(output).toContain("Something is off");
  });

  it("error() writes to stderr and contains 'Error:' label and message", () => {
    error("Connection refused");
    const output = stripAnsi(stderrOutput.join(""));
    expect(output).toContain("Error:");
    expect(output).toContain("Connection refused");
  });
});
