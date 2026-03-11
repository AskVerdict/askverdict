// askverdict export <id>
// Export a debate to JSON or Markdown format.

import { writeFileSync } from "fs";
import { Command } from "commander";
import { AskVerdictClient } from "@askverdict/sdk";
import { getConfig, resolveToken } from "../config.js";
import { printJson, success, error, fatal, print, c } from "../output.js";

function toMarkdown(debate: Awaited<ReturnType<AskVerdictClient["getDebate"]>>): string {
  const lines: string[] = [];

  lines.push(`# ${debate.question}`);
  lines.push("");
  lines.push(`**Status:** ${debate.status}`);
  if (debate.mode) {
    lines.push(`**Mode:** ${debate.mode}`);
  }
  lines.push(`**Created:** ${new Date(debate.createdAt).toLocaleString()}`);
  if (debate.completedAt) {
    lines.push(`**Completed:** ${new Date(debate.completedAt).toLocaleString()}`);
  }
  lines.push("");

  if (debate.verdict) {
    lines.push("## Verdict");
    lines.push("");
    if (debate.verdict.recommendation) {
      lines.push(`**Recommendation:** ${debate.verdict.recommendation.recommendation}`);
      lines.push("");
      lines.push(`**Confidence:** ${Math.round(debate.verdict.recommendation.confidence * 100)}%`);
      lines.push("");
      lines.push(`**Rationale:** ${debate.verdict.recommendation.rationale}`);
      lines.push("");
    }
    lines.push(`**Summary:** ${debate.verdict.summary}`);
    lines.push("");
    if (debate.verdict.keyFindings && debate.verdict.keyFindings.length > 0) {
      lines.push("**Key Findings:**");
      lines.push("");
      for (const finding of debate.verdict.keyFindings) {
        lines.push(`- ${finding}`);
      }
      lines.push("");
    }
  }

  // Arguments — try to extract from messages or arguments arrays if present
  const debateData = debate as unknown as Record<string, unknown>;

  const argsFor = debateData["argumentsFor"] as string[] | undefined;
  const argsAgainst = debateData["argumentsAgainst"] as string[] | undefined;

  if (argsFor && argsFor.length > 0) {
    lines.push("## Arguments For");
    lines.push("");
    for (const arg of argsFor) {
      lines.push(`- ${arg}`);
    }
    lines.push("");
  }

  if (argsAgainst && argsAgainst.length > 0) {
    lines.push("## Arguments Against");
    lines.push("");
    for (const arg of argsAgainst) {
      lines.push(`- ${arg}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function makeExportCommand(): Command {
  const cmd = new Command("export");
  cmd
    .description("Export a debate to JSON or Markdown")
    .argument("<id>", "Debate ID")
    .option("--format <format>", "Output format: json or md", "json")
    .option("--output <file>", "Write output to a file instead of stdout")
    .option("--token <token>", "Auth token (overrides config/env)")
    .option("--json", "Output raw JSON (same as --format json)")
    .action(async (
      id: string,
      opts: { format: string; output?: string; token?: string; json: boolean },
    ) => {
      const cfg = getConfig();
      const token = resolveToken(opts.token);

      if (!token) {
        fatal("No auth token found. Run `askverdict config set-token <token>` or set ASKVERDICT_TOKEN.");
      }

      const format = opts.json ? "json" : opts.format;
      if (format !== "json" && format !== "md") {
        fatal(`Unknown format "${format}". Use --format json or --format md.`);
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

      let content: string;
      if (format === "md") {
        content = toMarkdown(debate);
      } else {
        content = JSON.stringify(debate, null, 2);
      }

      if (opts.output) {
        try {
          writeFileSync(opts.output, content, "utf-8");
        } catch (err_) {
          error(`Failed to write file: ${err_ instanceof Error ? err_.message : String(err_)}`);
          process.exit(1);
        }
        if (!opts.json) {
          success(`Exported debate ${c.cyan(id)} to ${c.bold(opts.output)}`);
        } else {
          printJson({ exported: true, id, format, output: opts.output });
        }
      } else {
        print(content);
      }
    });

  return cmd;
}
