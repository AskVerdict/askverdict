// askverdict stream <id>
// Stream live SSE events from a running debate.

import { Command } from "commander";
import { AskVerdictClient } from "@askverdict/sdk";
import { getConfig, resolveToken } from "../config.js";
import {
  header,
  print,
  error,
  fatal,
  c,
} from "../output.js";
import { streamAndDisplay } from "./debate.js";

export function makeStreamCommand(): Command {
  const cmd = new Command("stream");
  cmd
    .description("Stream a live debate (SSE)")
    .argument("<id>", "Debate ID")
    .option("--token <token>", "Auth token (overrides config/env)")
    .option("--json", "Output raw JSON events (one per line)")
    .option("--raw", "Print raw SSE lines")
    .action(async (id: string, opts: { token?: string; json: boolean; raw: boolean }) => {
      const cfg = getConfig();
      const token = resolveToken(opts.token);

      if (!token) {
        fatal("No auth token found. Run `askverdict config set-token <token>` or set ASKVERDICT_TOKEN.");
      }

      const client = new AskVerdictClient({
        baseUrl: cfg.apiUrl,
        authToken: token,
      });

      if (!opts.json) {
        header("Streaming Debate");
        print("  " + c.bold("ID:") + " " + c.cyan(id));
        print(c.gray("  Ctrl+C to exit — stream will continue server-side\n"));
      }

      if (opts.raw) {
        // Raw mode: pipe SSE directly to stdout
        const url = `${cfg.apiUrl}/api/debates/${encodeURIComponent(id)}/stream`;
        const headers: Record<string, string> = {
          Accept: "text/event-stream",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        let response: Response;
        try {
          const res = await fetch(url, { headers });
          if (!res.ok) {
            fatal(`HTTP ${String(res.status)}: ${res.statusText}`);
          }
          response = res;
        } catch (err_) {
          fatal(err_ instanceof Error ? err_.message : "Failed to connect to stream");
        }

        const body = response.body;
        if (!body) {
          fatal("Response body is empty");
        }

        const reader = body.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            process.stdout.write(decoder.decode(value, { stream: true }));
          }
        } catch (err_) {
          error(err_ instanceof Error ? err_.message : String(err_));
          process.exit(1);
        } finally {
          reader.releaseLock();
        }

        return;
      }

      await streamAndDisplay(client, id, opts.json);
    });

  return cmd;
}
