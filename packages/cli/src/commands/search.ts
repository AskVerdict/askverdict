// askverdict search <query>
// Search debates by query string.

import { Command } from "commander";
import { AskVerdictClient } from "@askverdict/sdk";
import { getConfig, resolveToken } from "../config.js";
import {
  printJson,
  header,
  print,
  error,
  fatal,
  printTable,
  statusBadge,
  truncate,
  c,
} from "../output.js";

export function makeSearchCommand(): Command {
  const cmd = new Command("search");
  cmd
    .description("Search debates")
    .argument("<query>", "Search query")
    .option("--sort <sort>", "Sort order: relevance, date, or popularity", "relevance")
    .option("-n, --limit <n>", "Number of results to return", "20")
    .option("--page <n>", "Page number", "1")
    .option("--status <status>", "Filter by status")
    .option("--token <token>", "Auth token (overrides config/env)")
    .option("--json", "Output raw JSON")
    .action(async (
      query: string,
      opts: {
        sort: string;
        limit: string;
        page: string;
        status?: string;
        token?: string;
        json: boolean;
      },
    ) => {
      const cfg = getConfig();
      const token = resolveToken(opts.token);

      if (!token) {
        fatal("No auth token found. Run `askverdict config set-token <token>` or set ASKVERDICT_TOKEN.");
      }

      const limit = Math.max(1, parseInt(opts.limit, 10) || 20);
      const page = Math.max(1, parseInt(opts.page, 10) || 1);

      const validSorts = ["relevance", "date", "popularity"] as const;
      type SortOption = typeof validSorts[number];

      const sort: SortOption = (validSorts as readonly string[]).includes(opts.sort)
        ? (opts.sort as SortOption)
        : "relevance";

      const client = new AskVerdictClient({
        baseUrl: cfg.apiUrl,
        authToken: token,
      });

      let result: Awaited<ReturnType<typeof client.search>>;
      try {
        result = await client.search(query, {
          sort,
          limit,
          page,
          status: opts.status,
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

      header(`Search Results for "${query}"  (${result.total} total)`);

      if (result.results.length === 0) {
        print("  " + c.dim("No debates matched your query."));
        return;
      }

      const rows = result.results.map((d) => ({
        id: truncate(d.id, 12),
        question: truncate(d.question, 50),
        status: statusBadge(d.status),
        confidence: d.confidence !== undefined && d.confidence !== null
          ? c.yellow(String(Math.round(d.confidence)) + "%")
          : c.gray("—"),
        created: new Date(d.createdAt).toLocaleDateString(),
      }));

      printTable(rows, ["id", "question", "status", "confidence", "created"]);

      if (result.totalPages > 1) {
        print("");
        print(
          c.gray(
            `  Page ${result.page} of ${result.totalPages}. Use --page to navigate.`,
          ),
        );
      }
    });

  return cmd;
}
