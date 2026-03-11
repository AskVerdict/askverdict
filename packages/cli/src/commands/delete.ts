// askverdict delete <id>
// Delete a debate by ID, with optional confirmation prompt.

import { createInterface } from "readline";
import { Command } from "commander";
import { AskVerdictClient } from "@askverdict/sdk";
import { getConfig, resolveToken } from "../config.js";
import { printJson, success, error, fatal, c } from "../output.js";

function promptConfirm(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y");
    });
  });
}

export function makeDeleteCommand(): Command {
  const cmd = new Command("delete");
  cmd
    .description("Delete a debate")
    .argument("<id>", "Debate ID to delete")
    .option("--force", "Skip confirmation prompt")
    .option("--token <token>", "Auth token (overrides config/env)")
    .option("--json", "Output raw JSON")
    .action(async (id: string, opts: { force: boolean; token?: string; json: boolean }) => {
      const cfg = getConfig();
      const token = resolveToken(opts.token);

      if (!token) {
        fatal("No auth token found. Run `askverdict config set-token <token>` or set ASKVERDICT_TOKEN.");
      }

      if (!opts.force) {
        const confirmed = await promptConfirm(
          c.yellow(`  Delete debate ${id}? `) + c.gray("[y/N] "),
        );
        if (!confirmed) {
          if (opts.json) {
            printJson({ cancelled: true });
          } else {
            process.stdout.write("  Cancelled.\n");
          }
          return;
        }
      }

      const client = new AskVerdictClient({
        baseUrl: cfg.apiUrl,
        authToken: token,
      });

      try {
        await client.deleteDebate(id);
      } catch (err_) {
        if (opts.json) {
          printJson({ error: String(err_) });
        } else {
          error(err_ instanceof Error ? err_.message : String(err_));
        }
        process.exit(1);
      }

      if (opts.json) {
        printJson({ deleted: true, id });
        return;
      }

      success(`Debate ${id} deleted.`);
    });

  return cmd;
}
