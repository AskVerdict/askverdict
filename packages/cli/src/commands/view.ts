// askverdict view <id>
// View a debate's details and verdict.

import { Command } from "commander";
import { AskVerdictClient } from "@askverdict/sdk";
import { getConfig, resolveToken } from "../config.js";
import {
  printJson,
  header,
  print,
  info,
  error,
  fatal,
  statusBadge,
  printVerdict,
  divider,
  c,
} from "../output.js";

export function makeViewCommand(): Command {
  const cmd = new Command("view");
  cmd
    .description("View debate details and verdict")
    .argument("<id>", "Debate ID")
    .option("--token <token>", "Auth token (overrides config/env)")
    .option("--json", "Output raw JSON")
    .action(async (id: string, opts: { token?: string; json: boolean }) => {
      const cfg = getConfig();
      const token = resolveToken(opts.token);

      if (!token) {
        fatal("No auth token found. Run `askverdict config set-token <token>` or set ASKVERDICT_TOKEN.");
      }

      const client = new AskVerdictClient({
        baseUrl: cfg.apiUrl,
        authToken: token,
      });

      let debate: Awaited<ReturnType<typeof client.getDebate>>;
      try {
        debate = await client.getDebate(id);
      } catch (err_) {
        if (opts.json) {
          printJson({ error: String(err_) });
        } else {
          error(err_ instanceof Error ? err_.message : String(err_));
        }
        process.exit(1);
      }

      if (opts.json) {
        printJson(debate);
        return;
      }

      header("Debate Details");
      print("  " + c.bold("ID:") + "       " + c.cyan(debate.id));
      print("  " + c.bold("Question:") + " " + debate.question);
      print("  " + c.bold("Status:") + "   " + statusBadge(debate.status));
      print("  " + c.bold("Mode:") + "     " + (debate.mode ?? "—"));

      if (debate.agentCount !== null) {
        print("  " + c.bold("Agents:") + "   " + String(debate.agentCount));
      }
      if (debate.roundCount !== null) {
        print("  " + c.bold("Rounds:") + "   " + String(debate.roundCount));
      }

      print("  " + c.bold("Created:") + "  " + new Date(debate.createdAt).toLocaleString());
      if (debate.completedAt) {
        print("  " + c.bold("Completed:") + " " + new Date(debate.completedAt).toLocaleString());
      }

      if (debate.cost) {
        print(
          "  " +
            c.bold("Cost:") +
            "     $" +
            debate.cost.totalUsd.toFixed(4) +
            c.gray(
              ` (${debate.cost.inputTokens.toLocaleString()} in / ${debate.cost.outputTokens.toLocaleString()} out tokens)`,
            ),
        );
      }

      if (debate.verdict) {
        print("");
        divider();
        printVerdict(debate.verdict);
      } else if (debate.status === "active" || debate.status === "running") {
        print("");
        info(`Debate is still running. Use \`askverdict stream ${debate.id}\` to watch live.`);
      } else if (debate.status === "pending") {
        print("");
        info(`Debate is queued. Use \`askverdict stream ${debate.id}\` to watch when it starts.`);
      }
    });

  return cmd;
}
