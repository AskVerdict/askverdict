#!/usr/bin/env node
// @askverdict/cli — Terminal interface for AskVerdict
//
// Required dependencies (add to package.json if not present):
//   commander@^13.1.0   (already in package.json)
//
// Optional enhancements (NOT added to keep bundle lean):
//   chalk              — colored output (replaced by inline ANSI helpers in output.ts)
//   ora                — spinners (replaced by simple console spinner in output.ts)
//   inquirer           — interactive prompts (not needed for MVP)

import { Command } from "commander";
import { makeDebateCommand } from "./commands/debate.js";
import { makeListCommand } from "./commands/list.js";
import { makeViewCommand } from "./commands/view.js";
import { makeStreamCommand } from "./commands/stream.js";
import { makeVoteCommand } from "./commands/vote.js";
import { makePollsCommand } from "./commands/polls.js";
import { makeHealthCommand } from "./commands/health.js";
import { makeConfigCommand } from "./commands/config.js";
import { makeWhoamiCommand } from "./commands/whoami.js";
import { makeDeleteCommand } from "./commands/delete.js";
import { makeExportCommand } from "./commands/export.js";
import { makeOutcomesCommand } from "./commands/outcomes.js";
import { makeSearchCommand } from "./commands/search.js";
import { makeStatsCommand } from "./commands/stats.js";

const program = new Command();

program
  .name("askverdict")
  .description(
    "AskVerdict CLI — run AI debates and view results from your terminal",
  )
  .version("0.1.0")
  .option("--token <token>", "Auth token (overrides config and ASKVERDICT_TOKEN env var)")
  .option("--api-url <url>", "API base URL (overrides config and ASKVERDICT_API_URL env var)");

// Apply top-level --token and --api-url to env so child commands pick them up
program.hook("preAction", (thisCommand) => {
  const opts = thisCommand.opts() as { token?: string; apiUrl?: string };
  if (opts.token) {
    process.env["ASKVERDICT_TOKEN"] = opts.token;
  }
  if (opts.apiUrl) {
    process.env["ASKVERDICT_API_URL"] = opts.apiUrl;
  }
});

// ── Commands ──────────────────────────────────────────────────────────────────

program.addCommand(makeDebateCommand());
program.addCommand(makeListCommand());
program.addCommand(makeViewCommand());
program.addCommand(makeStreamCommand());
program.addCommand(makeVoteCommand());
program.addCommand(makePollsCommand());
program.addCommand(makeHealthCommand());
program.addCommand(makeConfigCommand());
program.addCommand(makeWhoamiCommand());
program.addCommand(makeDeleteCommand());
program.addCommand(makeExportCommand());
program.addCommand(makeOutcomesCommand());
program.addCommand(makeSearchCommand());
program.addCommand(makeStatsCommand());

// ── Helpful aliases & error handling ─────────────────────────────────────────

program.on("command:*", (operands: string[]) => {
  console.error(`Unknown command: ${operands.join(" ")}`);
  console.error("Run `askverdict --help` to see available commands.");
  process.exit(1);
});

program.parse();
