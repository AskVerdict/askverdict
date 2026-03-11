// @askverdict/cli — Output formatting helpers
//
// Uses ANSI escape codes directly (no chalk dependency required).
// Pass --json flag to any command for machine-readable output.

// ── ANSI helpers ──────────────────────────────────────────────────────────────

const USE_COLOR = process.stdout.isTTY && process.env["NO_COLOR"] === undefined;

function ansi(code: string, text: string): string {
  if (!USE_COLOR) return text;
  return `\x1b[${code}m${text}\x1b[0m`;
}

export const c = {
  bold: (t: string) => ansi("1", t),
  dim: (t: string) => ansi("2", t),
  red: (t: string) => ansi("31", t),
  green: (t: string) => ansi("32", t),
  yellow: (t: string) => ansi("33", t),
  blue: (t: string) => ansi("34", t),
  magenta: (t: string) => ansi("35", t),
  cyan: (t: string) => ansi("36", t),
  white: (t: string) => ansi("37", t),
  gray: (t: string) => ansi("90", t),
};

// ── Core output ───────────────────────────────────────────────────────────────

export function print(msg: string): void {
  process.stdout.write(msg + "\n");
}

export function printErr(msg: string): void {
  process.stderr.write(msg + "\n");
}

export function printJson(data: unknown): void {
  print(JSON.stringify(data, null, 2));
}

export function success(msg: string): void {
  print(c.green("  " + msg));
}

export function info(msg: string): void {
  print(c.cyan("  " + msg));
}

export function warn(msg: string): void {
  printErr(c.yellow("  " + msg));
}

export function error(msg: string): void {
  printErr(c.red("  Error: ") + msg);
}

export function fatal(msg: string): never {
  error(msg);
  process.exit(1);
}

// ── Section headers ───────────────────────────────────────────────────────────

export function header(title: string): void {
  print("");
  print(c.bold(c.cyan("  " + title)));
  print(c.gray("  " + "─".repeat(Math.max(0, title.length))));
}

export function divider(): void {
  print(c.gray("  " + "─".repeat(60)));
}

// ── Table rendering ───────────────────────────────────────────────────────────

export type Row = Record<string, string | number | boolean | null | undefined>;

export function printTable(rows: Row[], columns?: string[]): void {
  if (rows.length === 0) {
    print(c.dim("  (no results)"));
    return;
  }

  const cols = columns ?? Object.keys(rows[0] ?? {});
  if (cols.length === 0) return;

  // Calculate column widths
  const widths: number[] = cols.map((col) => {
    const colName = col.length;
    const maxVal = rows.reduce((max, row) => {
      const val = String(row[col] ?? "");
      return Math.max(max, val.length);
    }, 0);
    return Math.max(colName, maxVal);
  });

  // Header row
  const headerRow = cols
    .map((col, i) => c.bold(col.toUpperCase().padEnd(widths[i] ?? 0)))
    .join("  ");
  print("  " + headerRow);
  print("  " + widths.map((w) => "─".repeat(w)).join("  "));

  // Data rows
  for (const row of rows) {
    const line = cols
      .map((col, i) => {
        const val = String(row[col] ?? "");
        return val.padEnd(widths[i] ?? 0);
      })
      .join("  ");
    print("  " + line);
  }
}

// ── Spinners (simple console-based) ──────────────────────────────────────────

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export interface Spinner {
  stop: (finalMsg?: string) => void;
  update: (msg: string) => void;
}

export function spinner(msg: string): Spinner {
  if (!USE_COLOR || !process.stdout.isTTY) {
    // Non-TTY: just print once, no animation
    process.stdout.write("  " + msg + "...\n");
    return {
      stop: (finalMsg?: string) => {
        if (finalMsg) print("  " + finalMsg);
      },
      update: (newMsg: string) => {
        process.stdout.write("  " + newMsg + "...\n");
      },
    };
  }

  let frame = 0;
  let currentMsg = msg;
  let stopped = false;

  const interval = setInterval(() => {
    if (stopped) return;
    const spin = SPINNER_FRAMES[frame % SPINNER_FRAMES.length];
    process.stdout.write(
      `\r  ${c.cyan(spin ?? "?")} ${currentMsg}    `,
    );
    frame++;
  }, 80);

  return {
    stop: (finalMsg?: string) => {
      if (stopped) return;
      stopped = true;
      clearInterval(interval);
      // Clear the spinner line
      process.stdout.write("\r\x1b[K");
      if (finalMsg) {
        print("  " + finalMsg);
      }
    },
    update: (newMsg: string) => {
      currentMsg = newMsg;
    },
  };
}

// ── Status badge ──────────────────────────────────────────────────────────────

export function statusBadge(status: string): string {
  switch (status.toLowerCase()) {
    case "completed":
      return c.green(status);
    case "active":
    case "running":
      return c.cyan(status);
    case "failed":
      return c.red(status);
    case "paused":
      return c.yellow(status);
    case "pending":
      return c.gray(status);
    default:
      return status;
  }
}

// ── Truncation ────────────────────────────────────────────────────────────────

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

// ── Debate verdict display ────────────────────────────────────────────────────

export function printVerdict(verdict: {
  summary: string;
  confidence: number;
  recommendation?: {
    recommendation: string;
    confidence: number;
    rationale: string;
  };
  keyFindings?: string[];
}): void {
  header("Verdict");
  print("  " + c.bold("Summary:") + " " + verdict.summary);
  print(
    "  " +
      c.bold("Confidence:") +
      " " +
      c.yellow(String(Math.round(verdict.confidence)) + "%"),
  );

  if (verdict.recommendation) {
    print("");
    print("  " + c.bold("Recommendation:"));
    print("    " + c.green(verdict.recommendation.recommendation));
    print("    " + c.dim(verdict.recommendation.rationale));
  }

  if (verdict.keyFindings && verdict.keyFindings.length > 0) {
    print("");
    print("  " + c.bold("Key Findings:"));
    for (const finding of verdict.keyFindings) {
      print("    " + c.cyan("•") + " " + finding);
    }
  }
}
