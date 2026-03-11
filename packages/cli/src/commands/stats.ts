// askverdict stats
// Show dashboard stats, accuracy score, and streak info.

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

function pct(n: number): string {
  return c.yellow(String(Math.round(n * 100)) + "%");
}

function formatNum(n: number, decimals = 0): string {
  return n.toFixed(decimals);
}

export function makeStatsCommand(): Command {
  const cmd = new Command("stats");
  cmd
    .description("Show dashboard stats and accuracy scores")
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

      let dashboard: Awaited<ReturnType<typeof client.getDashboard>>;
      let score: Awaited<ReturnType<typeof client.getScore>>;
      let streak: Awaited<ReturnType<typeof client.getStreak>>;

      try {
        [dashboard, score, streak] = await Promise.all([
          client.getDashboard(),
          client.getScore(),
          client.getStreak(),
        ]);
      } catch (err_) {
        if (opts.json) {
          printJson({ error: String(err_) });
        } else {
          error(err_ instanceof Error ? err_.message : String(err_));
        }
        process.exit(1);
      }

      if (opts.json) {
        printJson({ dashboard, score, streak });
        return;
      }

      // ── Activity ────────────────────────────────────────────────────────

      header("Activity");
      print("  " + c.bold("Total debates:") + "    " + c.cyan(String(dashboard.totalDebates)));
      print("  " + c.bold("This week:") + "        " + c.cyan(String(dashboard.debatesThisWeek)));
      if (dashboard.averageCost !== undefined && dashboard.averageCost !== null) {
        print(
          "  " +
            c.bold("Avg cost/debate:") +
            "   $" +
            c.yellow(formatNum(dashboard.averageCost, 4)),
        );
      }
      if (dashboard.modeDistribution) {
        print("");
        print("  " + c.bold("Mode breakdown:"));
        const dist = dashboard.modeDistribution as Record<string, number>;
        for (const [mode, count] of Object.entries(dist)) {
          print("    " + c.gray(mode.padEnd(12)) + " " + String(count));
        }
      }

      divider();

      // ── Streak ──────────────────────────────────────────────────────────

      header("Streak");
      print(
        "  " +
          c.bold("Current streak:") +
          "  " +
          c.yellow(String(streak.currentStreak)) +
          " days",
      );
      print(
        "  " +
          c.bold("Longest streak:") +
          "  " +
          c.cyan(String(streak.longestStreak)) +
          " days",
      );
      print("  " + c.bold("Total debates:") + "   " + String(streak.totalDebates));

      if (streak.milestones && streak.milestones.length > 0) {
        print("");
        print("  " + c.bold("Milestones:"));
        const milestones = streak.milestones as Array<{ label?: string; name?: string; reached?: boolean; achieved?: boolean }>;
        for (const m of milestones) {
          const label = m.label ?? m.name ?? String(m);
          const reached = m.reached ?? m.achieved ?? false;
          print(
            "    " +
              (reached ? c.green("✓") : c.gray("○")) +
              " " +
              (reached ? label : c.gray(label)),
          );
        }
      }

      divider();

      // ── Decision Score ──────────────────────────────────────────────────

      header("Decision Accuracy");
      print(
        "  " +
          c.bold("Overall accuracy:") +
          "    " +
          pct(score.overallAccuracy),
      );
      print(
        "  " +
          c.bold("Total decisions:") +
          "     " +
          String(score.totalDecisions),
      );
      print(
        "  " +
          c.bold("Correct predictions:") +
          " " +
          c.green(String(score.correctPredictions)),
      );
      if (score.brierScore !== undefined && score.brierScore !== null) {
        print(
          "  " +
            c.bold("Brier score:") +
            "         " +
            c.yellow(formatNum(score.brierScore, 4)) +
            c.gray("  (lower is better)"),
        );
      }
      if (score.calibrationScore !== undefined && score.calibrationScore !== null) {
        print(
          "  " +
            c.bold("Calibration score:") +
            "   " +
            pct(score.calibrationScore),
        );
      }
    });

  return cmd;
}
