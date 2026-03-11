// askverdict whoami
// Show current authenticated user info and usage stats.

import { Command } from "commander";
import { AskVerdictClient } from "@askverdict/sdk";
import { getConfig, resolveToken } from "../config.js";
import {
  printJson,
  header,
  print,
  error,
  fatal,
  divider,
  c,
} from "../output.js";

export function makeWhoamiCommand(): Command {
  const cmd = new Command("whoami");
  cmd
    .description("Show current user info and usage stats")
    .option("--token <token>", "Auth token (overrides config/env)")
    .option("--json", "Output raw JSON")
    .action(async (opts: { token?: string; json: boolean }) => {
      const cfg = getConfig();
      const token = resolveToken(opts.token);

      if (!token) {
        fatal("No auth token found. Run `askverdict config set-token <token>` or set ASKVERDICT_TOKEN.");
      }

      const client = new AskVerdictClient({
        baseUrl: cfg.apiUrl,
        authToken: token,
      });

      let me: Awaited<ReturnType<typeof client.getMe>>;
      let usage: Awaited<ReturnType<typeof client.getUsage>>;

      try {
        [me, usage] = await Promise.all([client.getMe(), client.getUsage()]);
      } catch (err_) {
        if (opts.json) {
          printJson({ error: String(err_) });
        } else {
          error(err_ instanceof Error ? err_.message : String(err_));
        }
        process.exit(1);
      }

      if (opts.json) {
        printJson({ ...me, usage });
        return;
      }

      header("Current User");
      print("  " + c.bold("Name:") + "    " + me.name);
      print("  " + c.bold("Email:") + "   " + me.email);
      print("  " + c.bold("Plan:") + "    " + c.cyan(me.plan));
      if (me.bio) {
        print("  " + c.bold("Bio:") + "     " + me.bio);
      }
      if (me.location) {
        print("  " + c.bold("Location:") + " " + me.location);
      }
      print("  " + c.bold("Member since:") + " " + new Date(me.createdAt).toLocaleDateString());

      divider();

      header("Usage This Month");
      print(
        "  " +
          c.bold("Debates:") +
          "  " +
          c.yellow(String(usage.debatesThisMonth)) +
          " / " +
          (usage.debatesLimit === null ? c.gray("unlimited") : String(usage.debatesLimit)),
      );
      print("  " + c.bold("Credits:") + "  " + c.yellow(String(usage.creditsRemaining)) + " remaining");

      if (usage.freeDebateResetAt) {
        print(
          "  " +
            c.bold("Resets:") +
            "   " +
            c.gray(new Date(usage.freeDebateResetAt).toLocaleDateString()),
        );
      }
    });

  return cmd;
}
