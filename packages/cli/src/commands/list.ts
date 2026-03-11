// askverdict list
// List debates for the authenticated user.

import { Command } from "commander";
import { AskVerdictClient } from "@askverdict/sdk";
import { getConfig, resolveToken } from "../config.js";
import {
  printJson,
  header,
  printTable,
  error,
  fatal,
  truncate,
  statusBadge,
  print,
  c,
} from "../output.js";

export function makeListCommand(): Command {
  const cmd = new Command("list");
  cmd
    .description("List your debates")
    .option("-n, --limit <n>", "Number of debates to show", "20")
    .option("--page <n>", "Page number", "1")
    .option("--status <status>", "Filter by status (active|completed|failed|pending)")
    .option("--token <token>", "Auth token (overrides config/env)")
    .option("--json", "Output raw JSON")
    .action(async (opts: {
      limit: string;
      page: string;
      status?: string;
      token?: string;
      json: boolean;
    }) => {
      const cfg = getConfig();
      const token = resolveToken(opts.token);

      if (!token) {
        fatal("No auth token found. Run `askverdict config set-token <token>` or set ASKVERDICT_TOKEN.");
      }

      const client = new AskVerdictClient({
        baseUrl: cfg.apiUrl,
        authToken: token,
      });

      const pageSize = Math.max(1, parseInt(opts.limit, 10) || 20);
      const page = Math.max(1, parseInt(opts.page, 10) || 1);

      let result: Awaited<ReturnType<typeof client.listDebates>>;
      try {
        result = await client.listDebates({
          pageSize,
          page,
          status: opts.status as "active" | "completed" | "failed" | "paused" | "pending" | undefined,
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

      header(`Your Debates  (${result.total} total)`);

      if (result.debates.length === 0) {
        print("  " + c.dim("No debates found. Run `askverdict debate <question>` to start one."));
        return;
      }

      const rows = result.debates.map((d) => ({
        id: d.id.slice(0, 8) + "...",
        question: truncate(d.question, 50),
        mode: d.mode ?? "—",
        status: statusBadge(d.status),
        created: new Date(d.createdAt).toLocaleDateString(),
      }));

      printTable(rows, ["id", "question", "mode", "status", "created"]);

      if (result.hasMore) {
        print("");
        print(c.gray(`  Showing page ${page} of ${Math.ceil(result.total / pageSize)}. Use --page to navigate.`));
      }
    });

  return cmd;
}
