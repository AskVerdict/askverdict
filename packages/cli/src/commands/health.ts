// askverdict health
// Check API health status.

import { Command } from "commander";
import { AskVerdictClient } from "@askverdict/sdk";
import { getConfig } from "../config.js";
import {
  printJson,
  header,
  print,
  success,
  warn,
  error,
  c,
} from "../output.js";

export function makeHealthCommand(): Command {
  const cmd = new Command("health");
  cmd
    .description("Check API health")
    .option("--json", "Output raw JSON")
    .action(async (opts: { json: boolean }) => {
      const cfg = getConfig();
      const client = new AskVerdictClient({ baseUrl: cfg.apiUrl });

      let result: Awaited<ReturnType<typeof client.health>>;
      try {
        result = await client.health();
      } catch (err_) {
        if (opts.json) {
          printJson({
            status: "unreachable",
            error: err_ instanceof Error ? err_.message : String(err_),
            apiUrl: cfg.apiUrl,
          });
        } else {
          error(`Cannot reach API at ${cfg.apiUrl}`);
          error(err_ instanceof Error ? err_.message : String(err_));
        }
        process.exit(1);
      }

      if (opts.json) {
        printJson(result);
        return;
      }

      header("API Health");
      print("  " + c.bold("Status:") + "    " + formatStatus(result.status));
      print("  " + c.bold("Service:") + "   " + result.service);
      print("  " + c.bold("Version:") + "   " + result.version);
      print(
        "  " +
          c.bold("Timestamp:") +
          " " +
          new Date(result.timestamp).toLocaleString(),
      );
      print("  " + c.bold("API URL:") + "   " + c.gray(cfg.apiUrl));
      print("");

      if (result.status === "ok") {
        success("API is healthy.");
      } else if (result.status === "degraded") {
        warn("API is degraded — some features may be unavailable.");
      } else {
        error("API is down.");
        process.exit(1);
      }
    });

  return cmd;
}

function formatStatus(status: string): string {
  switch (status) {
    case "ok":
      return c.green("ok");
    case "degraded":
      return c.yellow("degraded");
    case "down":
      return c.red("down");
    default:
      return status;
  }
}
