// askverdict outcomes <subcommand>
// Track and record debate outcomes.

import { Command } from "commander";
import { AskVerdictClient } from "@askverdict/sdk";
import { getConfig, resolveToken } from "../config.js";
import {
  printJson,
  header,
  print,
  success,
  error,
  fatal,
  printTable,
  truncate,
  c,
} from "../output.js";

type OutcomeRecord = Awaited<ReturnType<AskVerdictClient["getOutcome"]>>;

function formatOutcomeRow(o: OutcomeRecord): Record<string, string> {
  return {
    debateId: truncate(o.debateId, 12),
    outcome: truncate(String(o.actualOutcome ?? "—"), 30),
    correct: o.verdictWasCorrect === true
      ? c.green("yes")
      : o.verdictWasCorrect === false
        ? c.red("no")
        : c.gray("—"),
    recorded: new Date(o.recordedAt).toLocaleDateString(),
  };
}

function makeClient(opts: { token?: string }): { client: AskVerdictClient } {
  const cfg = getConfig();
  const token = resolveToken(opts.token);

  if (!token) {
    fatal("No auth token found. Run `askverdict config set-token <token>` or set ASKVERDICT_TOKEN.");
  }

  return {
    client: new AskVerdictClient({ baseUrl: cfg.apiUrl, authToken: token }),
  };
}

export function makeOutcomesCommand(): Command {
  const cmd = new Command("outcomes");
  cmd.description("Track and record debate outcomes");

  // ── outcomes pending ──────────────────────────────────────────────────────

  cmd
    .command("pending")
    .description("List debates that need an outcome recorded")
    .option("--token <token>", "Auth token (overrides config/env)")
    .option("--json", "Output raw JSON")
    .action(async (opts: { token?: string; json: boolean }) => {
      const { client } = makeClient(opts);

      let pending: OutcomeRecord[];
      try {
        pending = await client.getPendingOutcomes();
      } catch (err_) {
        if (opts.json) {
          printJson({ error: String(err_) });
        } else {
          error(err_ instanceof Error ? err_.message : String(err_));
        }
        process.exit(1);
      }

      if (opts.json) {
        printJson({ pending });
        return;
      }

      header(`Pending Outcomes  (${pending.length})`);

      if (pending.length === 0) {
        print("  " + c.dim("No debates awaiting outcome recording."));
        return;
      }

      const rows = pending.map(formatOutcomeRow);
      printTable(rows, ["debateId", "outcome", "correct", "recorded"]);
      print("");
      print(c.gray("  Use `askverdict outcomes record <debateId> <outcome>` to record."));
    });

  // ── outcomes record ───────────────────────────────────────────────────────

  cmd
    .command("record")
    .description("Record the actual outcome for a debate")
    .argument("<debateId>", "Debate ID")
    .argument("<outcome>", "Actual outcome text")
    .option("--notes <notes>", "Additional notes about the outcome")
    .option("--correct", "Mark verdict as correct")
    .option("--incorrect", "Mark verdict as incorrect")
    .option("--token <token>", "Auth token (overrides config/env)")
    .option("--json", "Output raw JSON")
    .action(async (
      debateId: string,
      outcome: string,
      opts: {
        notes?: string;
        correct: boolean;
        incorrect: boolean;
        token?: string;
        json: boolean;
      },
    ) => {
      if (opts.correct && opts.incorrect) {
        fatal("Cannot use --correct and --incorrect together.");
      }

      const { client } = makeClient(opts);

      let verdictWasCorrect: boolean | undefined;
      if (opts.correct) verdictWasCorrect = true;
      if (opts.incorrect) verdictWasCorrect = false;

      let result: OutcomeRecord;
      try {
        result = await client.submitOutcome(debateId, {
          actualOutcome: outcome,
          notes: opts.notes,
          verdictWasCorrect,
        });
      } catch (err_) {
        if (opts.json) {
          printJson({ error: String(err_) });
        } else {
          error(err_ instanceof Error ? err_.message : String(err_));
        }
        process.exit(1);
      }

      if (opts.json) {
        printJson(result);
        return;
      }

      success("Outcome recorded.");
      print("  " + c.bold("Debate:") + "  " + c.cyan(debateId));
      print("  " + c.bold("Outcome:") + " " + outcome);
      if (verdictWasCorrect !== undefined) {
        print(
          "  " +
            c.bold("Verdict:") +
            " " +
            (verdictWasCorrect ? c.green("correct") : c.red("incorrect")),
        );
      }
      if (opts.notes) {
        print("  " + c.bold("Notes:") + "   " + opts.notes);
      }
    });

  // ── outcomes history ──────────────────────────────────────────────────────

  cmd
    .command("history")
    .description("View outcome recording history")
    .option("-n, --limit <n>", "Number of records to show", "20")
    .option("--domain <domain>", "Filter by domain")
    .option("--token <token>", "Auth token (overrides config/env)")
    .option("--json", "Output raw JSON")
    .action(async (opts: {
      limit: string;
      domain?: string;
      token?: string;
      json: boolean;
    }) => {
      const { client } = makeClient(opts);
      const limit = Math.max(1, parseInt(opts.limit, 10) || 20);

      let history: OutcomeRecord[];
      try {
        history = await client.getOutcomeHistory({ limit, domain: opts.domain });
      } catch (err_) {
        if (opts.json) {
          printJson({ error: String(err_) });
        } else {
          error(err_ instanceof Error ? err_.message : String(err_));
        }
        process.exit(1);
      }

      if (opts.json) {
        printJson({ history });
        return;
      }

      header(`Outcome History  (${history.length} shown)`);

      if (history.length === 0) {
        print("  " + c.dim("No outcome history found."));
        return;
      }

      const rows = history.map(formatOutcomeRow);
      printTable(rows, ["debateId", "outcome", "correct", "recorded"]);
    });

  return cmd;
}
