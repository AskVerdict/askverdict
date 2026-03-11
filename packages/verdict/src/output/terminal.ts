// Zero-dep ANSI terminal helpers
// Ported from @askverdict/cli output.ts pattern

const USE_COLOR = process.stdout.isTTY === true && process.env["NO_COLOR"] === undefined;

function ansi(code: string, text: string): string {
  if (!USE_COLOR) return text;
  return `\x1b[${code}m${text}\x1b[0m`;
}

export const c = {
  bold: (t: string) => ansi("1", t),
  dim: (t: string) => ansi("2", t),
  italic: (t: string) => ansi("3", t),
  red: (t: string) => ansi("31", t),
  green: (t: string) => ansi("32", t),
  yellow: (t: string) => ansi("33", t),
  blue: (t: string) => ansi("34", t),
  magenta: (t: string) => ansi("35", t),
  cyan: (t: string) => ansi("36", t),
  white: (t: string) => ansi("37", t),
  gray: (t: string) => ansi("90", t),
  bgGreen: (t: string) => ansi("42;30", t),
  bgRed: (t: string) => ansi("41;37", t),
  bgYellow: (t: string) => ansi("43;30", t),
};

export function print(msg: string): void {
  process.stdout.write(msg + "\n");
}

export function printErr(msg: string): void {
  process.stderr.write(msg + "\n");
}

export function error(msg: string): void {
  printErr(c.red("  Error: ") + msg);
}

export function blank(): void {
  print("");
}

// ── Spinner ─────────────────────────────────────────────────────────────────

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export interface Spinner {
  stop: (finalMsg?: string) => void;
  update: (msg: string) => void;
}

export function spinner(msg: string): Spinner {
  if (!USE_COLOR || !process.stdout.isTTY) {
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
    process.stdout.write(`\r  ${c.cyan(spin ?? "?")} ${currentMsg}    `);
    frame++;
  }, 80);

  return {
    stop: (finalMsg?: string) => {
      if (stopped) return;
      stopped = true;
      clearInterval(interval);
      process.stdout.write("\r\x1b[K");
      if (finalMsg) print("  " + finalMsg);
    },
    update: (newMsg: string) => {
      currentMsg = newMsg;
    },
  };
}

// ── Box drawing ─────────────────────────────────────────────────────────────

export function box(lines: string[], width: number): string {
  const top = "  " + c.yellow("\u250c" + "\u2500".repeat(width - 2) + "\u2510");
  const bottom = "  " + c.yellow("\u2514" + "\u2500".repeat(width - 2) + "\u2518");

  const body = lines.map((line) => {
    const stripped = stripAnsi(line);
    const pad = Math.max(0, width - 4 - stripped.length);
    return "  " + c.yellow("\u2502") + "  " + line + " ".repeat(pad) + "  " + c.yellow("\u2502");
  });

  return [top, ...body, bottom].join("\n");
}

function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

export { USE_COLOR, stripAnsi };
