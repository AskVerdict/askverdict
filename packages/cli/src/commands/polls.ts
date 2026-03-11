// askverdict polls <debateId>
// View, create, and vote on polls for a debate.

import { Command } from "commander";
import { AskVerdictClient, type Poll } from "@askverdict/sdk";
import { getConfig, resolveToken } from "../config.js";
import {
  printJson,
  header,
  print,
  success,
  error,
  fatal,
  divider,
  c,
} from "../output.js";

export function makePollsCommand(): Command {
  const cmd = new Command("polls");
  cmd
    .description("Manage polls for a debate")
    .argument("<debateId>", "Debate ID");

  // Sub-command: list polls
  cmd
    .command("list")
    .description("List polls for a debate (default)")
    .argument("<debateId>", "Debate ID")
    .option("--token <token>", "Auth token (overrides config/env)")
    .option("--json", "Output raw JSON")
    .action(async (debateId: string, opts: { token?: string; json: boolean }) => {
      await listPolls(debateId, opts);
    });

  // Sub-command: create poll
  cmd
    .command("create")
    .description("Create a new poll (debate owner only)")
    .argument("<debateId>", "Debate ID")
    .requiredOption("-q, --question <question>", "Poll question")
    .option("-o, --options <options>", "Comma-separated list of options (min 2, max 6)")
    .option("--token <token>", "Auth token (overrides config/env)")
    .option("--json", "Output raw JSON")
    .action(async (
      debateId: string,
      opts: { question: string; options?: string; token?: string; json: boolean },
    ) => {
      const cfg = getConfig();
      const token = resolveToken(opts.token);

      if (!token) {
        fatal("No auth token found.");
      }

      const options = opts.options
        ? opts.options.split(",").map((o) => o.trim()).filter(Boolean)
        : [];

      if (options.length < 2) {
        fatal("Provide at least 2 options with --options \"Option A,Option B\"");
      }

      const client = new AskVerdictClient({ baseUrl: cfg.apiUrl, authToken: token });

      let poll: Poll;
      try {
        poll = await client.createPoll(debateId, opts.question, options);
      } catch (err_) {
        if (opts.json) { printJson({ error: String(err_) }); }
        else { error(err_ instanceof Error ? err_.message : String(err_)); }
        process.exit(1);
      }

      if (opts.json) { printJson(poll); return; }

      header("Poll Created");
      printPoll(poll);
      success("Poll created successfully.");
    });

  // Sub-command: vote on poll
  cmd
    .command("vote")
    .description("Vote on a poll option")
    .argument("<debateId>", "Debate ID")
    .argument("<pollId>", "Poll ID")
    .argument("<optionId>", "Option ID to vote for")
    .option("--token <token>", "Auth token (overrides config/env)")
    .option("--json", "Output raw JSON")
    .action(async (
      debateId: string,
      pollId: string,
      optionId: string,
      opts: { token?: string; json: boolean },
    ) => {
      const cfg = getConfig();
      const token = resolveToken(opts.token);

      if (!token) { fatal("No auth token found."); }

      const client = new AskVerdictClient({ baseUrl: cfg.apiUrl, authToken: token });

      try {
        await client.votePoll(debateId, pollId, optionId);
      } catch (err_) {
        if (opts.json) { printJson({ error: String(err_) }); }
        else { error(err_ instanceof Error ? err_.message : String(err_)); }
        process.exit(1);
      }

      if (opts.json) { printJson({ success: true, debateId, pollId, optionId }); return; }
      success("Vote recorded.");
    });

  // Default action when no sub-command is given: list polls
  cmd.action(async (debateId: string, opts: { token?: string; json?: boolean }) => {
    await listPolls(debateId, { token: opts.token, json: opts.json ?? false });
  });

  return cmd;
}

// ── Shared helpers ────────────────────────────────────────────────────────────

async function listPolls(
  debateId: string,
  opts: { token?: string; json: boolean },
): Promise<void> {
  const cfg = getConfig();
  const token = resolveToken(opts.token);

  if (!token) {
    fatal("No auth token found. Run `askverdict config set-token <token>` or set ASKVERDICT_TOKEN.");
  }

  const client = new AskVerdictClient({ baseUrl: cfg.apiUrl, authToken: token });

  let polls: Poll[];
  try {
    polls = await client.getPolls(debateId);
  } catch (err_) {
    if (opts.json) { printJson({ error: String(err_) }); }
    else { error(err_ instanceof Error ? err_.message : String(err_)); }
    process.exit(1);
  }

  if (opts.json) { printJson({ polls }); return; }

  header(`Polls for debate ${debateId}`);

  if (polls.length === 0) {
    print("  " + c.dim("No polls yet. Use `askverdict polls create <debateId> -q \"...\"` to add one."));
    return;
  }

  for (const poll of polls) {
    printPoll(poll);
    divider();
  }
}

function printPoll(poll: Poll): void {
  const statusTag = poll.status === "open" ? c.green("[open]") : c.gray("[closed]");
  print("");
  print("  " + c.bold(poll.question) + "  " + statusTag);
  print("  " + c.gray("ID: " + poll.id));

  if (poll.options.length > 0) {
    print("");
    for (const opt of poll.options) {
      const votes = poll.tallies[opt.id] ?? 0;
      const total = Math.max(1, poll.totalVotes);
      const pct = Math.round((votes / total) * 100);
      const bar = buildBar(pct, 20);
      const myVote = poll.userVote === opt.id ? c.yellow(" ← your vote") : "";
      print(
        "  " +
          c.cyan(opt.label.padEnd(24)) +
          " " +
          bar +
          " " +
          c.bold(String(votes)) +
          " votes (" +
          String(pct) +
          "%)" +
          myVote,
      );
    }
  }

  print("");
  print("  " + c.dim(`Total votes: ${String(poll.totalVotes)} — Created: ${new Date(poll.createdAt).toLocaleDateString()}`));
}

function buildBar(pct: number, width: number): string {
  const filled = Math.round((pct / 100) * width);
  const empty = width - filled;
  return c.green("█".repeat(filled)) + c.gray("░".repeat(empty));
}
