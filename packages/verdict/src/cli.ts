import { Command } from "commander";
import { VERSION } from "./version.js";
import type { DebateMode } from "./engine/types.js";
import type { ProviderName } from "./providers/types.js";
import { assignProviders, getProviderSummary } from "./providers/registry.js";
import { runDebate } from "./engine/runner.js";
import {
  renderHeader,
  renderAgentHeader,
  renderAgentStreaming,
  renderAgentDone,
  renderAgentFallback,
  renderVerdictBox,
  renderStats,
} from "./output/renderer.js";
import { printJson } from "./output/json.js";
import { maybeShowUpsell } from "./output/upsell.js";
import { c, print, blank, error } from "./output/terminal.js";
import { getConfigPath, setConfigKey } from "./config.js";

const VALID_MODES = ["fast", "balanced", "thorough"] as const;
const VALID_PROVIDERS = ["anthropic", "openai", "google"] as const;

export function run(): void {
  const program = new Command();

  program
    .name("verdict")
    .description("Multi-agent AI debate engine. BYOK, zero signup, instant decisions.")
    .version(VERSION);

  // Default command: run a debate
  program
    .argument("[question]", "The question to debate")
    .option("-m, --mode <mode>", "Debate depth: fast, balanced, thorough", "balanced")
    .option("-p, --providers <list>", "Comma-separated providers to use")
    .option("-j, --json", "Output machine-readable JSON")
    .option("--no-stream", "Disable streaming output")
    .action(async (question: string | undefined, opts: {
      mode: string;
      providers?: string;
      json?: boolean;
      stream: boolean;
    }) => {
      if (!question) {
        program.help();
        return;
      }

      await runDebateCommand(question, opts);
    });

  // Config subcommand
  program
    .command("config")
    .description("Show detected API keys and configuration")
    .option("--set <pair>", "Set a key: anthropic=sk-ant-... or openai=sk-...")
    .option("--path", "Print config file path")
    .action((opts: { set?: string; path?: boolean }) => {
      if (opts.path) {
        print(getConfigPath());
        return;
      }

      if (opts.set) {
        const [provider, ...keyParts] = opts.set.split("=");
        const key = keyParts.join("=");
        if (!provider || !key) {
          error("Usage: verdict config --set provider=api-key");
          error("Providers: anthropic, openai, google");
          process.exit(1);
        }
        if (!VALID_PROVIDERS.includes(provider as ProviderName)) {
          error(`Unknown provider: ${provider}. Use: ${VALID_PROVIDERS.join(", ")}`);
          process.exit(1);
        }
        setConfigKey(provider as ProviderName, key);
        print(c.green(`  Saved ${provider} key to ${getConfigPath()}`));
        return;
      }

      showConfig();
    });

  program.parse();
}

async function runDebateCommand(
  question: string,
  opts: {
    mode: string;
    providers?: string;
    json?: boolean;
    stream: boolean;
  },
): Promise<void> {
  // Validate mode
  if (!VALID_MODES.includes(opts.mode as DebateMode)) {
    error(`Invalid mode: ${opts.mode}. Use: ${VALID_MODES.join(", ")}`);
    process.exit(1);
  }
  const mode = opts.mode as DebateMode;

  // Parse provider filter
  let providerFilter: ProviderName[] | undefined;
  if (opts.providers) {
    const names = opts.providers.split(",").map((s) => s.trim());
    for (const name of names) {
      if (!VALID_PROVIDERS.includes(name as ProviderName)) {
        error(`Unknown provider: ${name}. Use: ${VALID_PROVIDERS.join(", ")}`);
        process.exit(1);
      }
    }
    providerFilter = names as ProviderName[];
  }

  // Assign providers
  let providers;
  try {
    providers = assignProviders(providerFilter);
  } catch (err) {
    error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  const isStreaming = opts.stream && !opts.json;

  if (!opts.json) {
    renderHeader(question);
  }

  try {
    const result = await runDebate(
      { question, mode, streaming: isStreaming },
      providers,
      isStreaming
        ? {
            onAdvocateStart: (provider, model) => {
              renderAgentHeader("advocate", provider, model);
            },
            onAdvocateChunk: renderAgentStreaming("advocate"),
            onAdvocateDone: () => {
              renderAgentDone();
            },
            onCriticStart: (provider, model) => {
              renderAgentHeader("critic", provider, model);
            },
            onCriticChunk: renderAgentStreaming("critic"),
            onCriticDone: () => {
              renderAgentDone();
            },
            onSynthesizerStart: () => {
              // Verdict box renders after completion
            },
          }
        : undefined,
    );

    if (opts.json) {
      printJson(result, VERSION);
      return;
    }

    // Non-streaming: render agent results
    if (!isStreaming) {
      renderAgentHeader("advocate", result.advocate.provider, result.advocate.model);
      renderAgentFallback(result.advocate);
      renderAgentHeader("critic", result.critic.provider, result.critic.model);
      renderAgentFallback(result.critic);
    }

    renderVerdictBox(result.verdict);
    renderStats(result);
    maybeShowUpsell(question);
  } catch (err) {
    blank();
    error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

function showConfig(): void {
  blank();
  print(c.bold(c.white("  verdict config")));
  print(c.gray("  " + "\u2500".repeat(30)));
  blank();

  const summary = getProviderSummary();

  if (summary.length === 0) {
    print(c.yellow("  No API keys detected."));
    blank();
    print("  Set keys via environment variables:");
    print(c.dim("    export ANTHROPIC_API_KEY=sk-ant-..."));
    print(c.dim("    export OPENAI_API_KEY=sk-..."));
    print(c.dim("    export GEMINI_API_KEY=AI..."));
    blank();
    print("  Or save to config file:");
    print(c.dim("    verdict config --set anthropic=sk-ant-..."));
    blank();
    return;
  }

  for (const entry of summary) {
    const badge = c.green("\u2713");
    print(`  ${badge} ${c.bold(entry.provider)} ${c.dim(`(${entry.model})`)} ${c.dim(`[${entry.source}]`)}`);
  }

  blank();
  print(c.dim(`  Config: ${getConfigPath()}`));
  blank();
}
