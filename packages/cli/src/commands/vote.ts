// askverdict vote <debateId> <claimId> <agree|disagree|neutral>
// Cast or remove a vote on an argument claim.

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
  c,
} from "../output.js";

export function makeVoteCommand(): Command {
  const cmd = new Command("vote");
  cmd
    .description("Vote on an argument claim")
    .argument("<debateId>", "Debate ID")
    .argument("<claimId>", "Claim ID to vote on")
    .argument("<vote>", "Your vote: agree | disagree | neutral")
    .option("--token <token>", "Auth token (overrides config/env)")
    .option("--json", "Output raw JSON")
    .action(async (
      debateId: string,
      claimId: string,
      vote: string,
      opts: { token?: string; json: boolean },
    ) => {
      const cfg = getConfig();
      const token = resolveToken(opts.token);

      if (!token) {
        fatal("No auth token found. Run `askverdict config set-token <token>` or set ASKVERDICT_TOKEN.");
      }

      const validVotes = ["agree", "disagree", "neutral"] as const;
      const normalizedVote = vote.toLowerCase();
      if (!validVotes.includes(normalizedVote as "agree" | "disagree" | "neutral")) {
        fatal(`Invalid vote value "${vote}". Must be one of: agree, disagree, neutral`);
      }

      const client = new AskVerdictClient({
        baseUrl: cfg.apiUrl,
        authToken: token,
      });

      try {
        await client.castVote(debateId, claimId, normalizedVote as "agree" | "disagree" | "neutral");
      } catch (err_) {
        if (opts.json) {
          printJson({ error: String(err_) });
        } else {
          error(err_ instanceof Error ? err_.message : String(err_));
        }
        process.exit(1);
      }

      if (opts.json) {
        printJson({ success: true, debateId, claimId, vote: normalizedVote });
        return;
      }

      header("Vote Cast");
      print("  " + c.bold("Debate:") + " " + debateId);
      print("  " + c.bold("Claim:") + "  " + claimId);
      const voteLabel =
        normalizedVote === "agree"
          ? c.green("agree")
          : normalizedVote === "disagree"
          ? c.red("disagree")
          : c.gray("neutral (removed)");
      print("  " + c.bold("Vote:") + "   " + voteLabel);
      print("");
      success("Vote recorded.");
    });

  return cmd;
}
