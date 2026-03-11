import type { AgentResult, DebateResult, VerdictResult } from "../engine/types.js";
import { c, print, blank, box } from "./terminal.js";

const BOX_WIDTH = 55;

export function renderHeader(question: string): void {
  blank();
  print(c.bold(c.white("  verdict")) + c.dim(" - multi-agent AI debate"));
  print(c.gray("  " + "\u2500".repeat(50)));
  blank();
  print("  " + c.bold(c.cyan(question)));
  blank();
}

export function renderAgentHeader(
  role: "advocate" | "critic",
  provider: string,
  model: string,
): void {
  const label = role === "advocate" ? "THE ADVOCATE" : "THE CRITIC";
  const side = role === "advocate" ? "FOR" : "AGAINST";
  const colorFn = role === "advocate" ? c.green : c.red;

  const header = `  ${c.bold(colorFn(label))} ${c.dim(`(${capitalize(provider)} ${model})`)}`;
  const sideLabel = colorFn(c.bold(side));

  print(`${header}${"  "}${sideLabel}`);
  blank();
}

export function renderAgentStreaming(role: "advocate" | "critic"): (chunk: string) => void {
  const colorFn = role === "advocate" ? c.green : c.red;
  let isFirst = true;

  return (chunk: string) => {
    if (isFirst) {
      process.stdout.write("  " + colorFn(chunk));
      isFirst = false;
    } else {
      process.stdout.write(colorFn(chunk));
    }
  };
}

export function renderAgentDone(): void {
  print(""); // End the streaming line
  blank();
}

export function renderAgentFallback(result: AgentResult): void {
  const colorFn = result.role === "advocate" ? c.green : c.red;
  const lines = result.argument.split("\n");
  for (const line of lines) {
    print("  " + colorFn(line));
  }
  blank();
}

export function renderVerdictBox(verdict: VerdictResult): void {
  const confidenceStr = `${verdict.confidence}%`;
  const lines: string[] = [
    c.bold(c.yellow("VERDICT")) + "  " + " ".repeat(Math.max(0, BOX_WIDTH - 20 - confidenceStr.length)) + c.bold(c.yellow(confidenceStr)),
    "",
    wordWrap(verdict.summary, BOX_WIDTH - 6),
    "",
  ];

  if (verdict.forPoints.length > 0) {
    lines.push(c.green("For:  ") + verdict.forPoints.join("; "));
  }

  if (verdict.againstPoints.length > 0) {
    lines.push(c.red("Against: ") + verdict.againstPoints.join("; "));
  }

  if (verdict.blindSpots.length > 0) {
    lines.push(c.yellow("Blind spots: ") + verdict.blindSpots.join("; "));
  }

  if (verdict.nextStep) {
    lines.push(c.cyan("Next: ") + verdict.nextStep);
  }

  // Wrap long lines
  const wrappedLines: string[] = [];
  for (const line of lines) {
    wrappedLines.push(line);
  }

  print(box(wrappedLines, BOX_WIDTH));
  blank();
}

export function renderStats(result: DebateResult): void {
  const providers = result.providers.length;
  const tokens = result.totalTokens.toLocaleString();
  const duration = (result.totalDurationMs / 1000).toFixed(1);

  print(
    c.dim(`  ${providers} provider${providers !== 1 ? "s" : ""} | ${tokens} tokens | ${duration}s`),
  );
  blank();
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function wordWrap(text: string, maxWidth: number): string {
  if (text.length <= maxWidth) return text;

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (currentLine.length + word.length + 1 > maxWidth) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? currentLine + " " + word : word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines.join("\n");
}
