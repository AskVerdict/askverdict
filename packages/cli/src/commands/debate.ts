// askverdict debate <question>
// Start a new debate and optionally stream the result.

import { Command } from "commander";
import { AskVerdictClient } from "@askverdict/sdk";
import type { CreateDebateResult } from "@askverdict/sdk";
import { getConfig, resolveToken } from "../config.js";
import {
  print,
  printJson,
  header,
  info,
  success,
  error,
  fatal,
  spinner,
  printVerdict,
  c,
} from "../output.js";

export function makeDebateCommand(): Command {
  const cmd = new Command("debate");
  cmd
    .description("Start a new AI debate")
    .argument("<question>", "The question or topic to debate")
    .option("-m, --mode <mode>", "Debate mode: fast | balanced | thorough | analytical", "fast")
    .option("-c, --context <context>", "Additional context to provide to the debate")
    .option("--agents <count>", "Number of AI agents (2-6)", (v) => parseInt(v, 10))
    .option("--rounds <count>", "Max debate rounds", (v) => parseInt(v, 10))
    .option("--no-stream", "Start debate without streaming — print ID and exit")
    .option("--token <token>", "Auth token (overrides config/env)")
    .option("--json", "Output raw JSON")
    .action(async (question: string, opts: {
      mode: string;
      context?: string;
      agents?: number;
      rounds?: number;
      stream: boolean;
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

      const spin = spinner("Creating debate...");

      let result: CreateDebateResult;
      try {
        result = await client.createDebate({
          question,
          mode: opts.mode as "fast" | "balanced" | "thorough" | "analytical",
          context: opts.context,
          agentCount: opts.agents,
          maxRounds: opts.rounds,
        });
      } catch (err_) {
        spin.stop();
        if (opts.json) {
          printJson({ error: String(err_) });
        } else {
          error(err_ instanceof Error ? err_.message : String(err_));
        }
        process.exit(1);
      }

      spin.stop();
      const debateId = result.debateId ?? result.id;

      if (opts.json && !opts.stream) {
        printJson(result);
        return;
      }

      if (!opts.stream) {
        header("Debate Created");
        print("  " + c.bold("ID:") + " " + c.cyan(debateId));
        print("  " + c.bold("Stream URL:") + " " + result.streamUrl);
        print("");
        info(`Run \`askverdict stream ${debateId}\` to watch the debate live.`);
        info(`Run \`askverdict view ${debateId}\` when it's done.`);
        return;
      }

      // Stream mode
      header("Debate Started");
      print("  " + c.bold("ID:") + "       " + c.cyan(debateId));
      print("  " + c.bold("Question:") + " " + question);
      print("  " + c.bold("Mode:") + "     " + opts.mode);
      print("");

      await streamAndDisplay(client, debateId, opts.json);
    });

  return cmd;
}

export async function streamAndDisplay(
  client: AskVerdictClient,
  debateId: string,
  asJson: boolean,
): Promise<void> {
  try {
    for await (const event of client.streamDebate(debateId)) {
      if (asJson) {
        printJson(event);
        continue;
      }

      const data = event.data as Record<string, unknown>;

      switch (event.type) {
        case "debate:start":
          info("Debate started — agents warming up...");
          break;

        case "debate:status":
          print("  " + c.gray("  " + String(data["message"] ?? "")));
          break;

        case "agent:thinking": {
          const name = String(data["agentName"] ?? "Agent");
          const round = data["round"] !== undefined ? ` (round ${String(data["round"])})` : "";
          print("  " + c.dim(`  ${name} is thinking${round}...`));
          break;
        }

        case "agent:argument": {
          const name = String(data["agentName"] ?? "Agent");
          const content = String(data["content"] ?? "");
          const conf = data["confidence"] !== undefined
            ? ` [${Math.round(Number(data["confidence"]))}%]`
            : "";
          print("");
          print("  " + c.bold(c.blue(name)) + c.gray(conf));
          print("  " + content.split("\n").join("\n  "));
          break;
        }

        case "agent:search": {
          const name = String(data["agentName"] ?? "Agent");
          const query = String(data["query"] ?? "");
          print("  " + c.gray(`  ${name} searching: "${query}"`));
          break;
        }

        case "verdict:start":
          print("");
          info("Synthesizing verdict...");
          break;

        case "verdict:complete":
        case "debate:complete": {
          print("");
          success("Debate complete!");
          const verdict = (data["verdict"] ?? data) as {
            summary: string;
            confidence: number;
            recommendation?: { recommendation: string; confidence: number; rationale: string };
            keyFindings?: string[];
          };
          if (verdict?.summary) {
            printVerdict(verdict);
          }
          break;
        }

        case "debate:error":
          error(String(data["error"] ?? "Unknown error"));
          break;

        case "cost:update": {
          const cost = data["totalCost"] !== undefined
            ? `$${Number(data["totalCost"]).toFixed(4)}`
            : "";
          if (cost) {
            print("  " + c.dim(`  Running cost: ${cost}`));
          }
          break;
        }

        case "synthesis:progress": {
          const step = String(data["step"] ?? "");
          const msg = String(data["message"] ?? step);
          print("  " + c.gray(`  ${msg}`));
          break;
        }

        default:
          // Skip verbose internal events
          break;
      }
    }
  } catch (err_) {
    error(err_ instanceof Error ? err_.message : String(err_));
    process.exit(1);
  }
}

// For use by the stream command
export { streamAndDisplay as streamDebate };
