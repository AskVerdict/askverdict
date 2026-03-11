// askverdict config
// Show and manage CLI configuration stored in ~/.askverdict/config.json

import { Command } from "commander";
import {
  getConfig,
  setConfig,
  clearConfig,
  getConfigPath,
} from "../config.js";
import {
  printJson,
  header,
  print,
  success,
  info,
  error,
  c,
} from "../output.js";

export function makeConfigCommand(): Command {
  const cmd = new Command("config");
  cmd.description("Show or modify CLI configuration");

  // config show
  cmd
    .command("show")
    .description("Show current configuration")
    .option("--json", "Output raw JSON")
    .action((opts: { json: boolean }) => {
      const cfg = getConfig();

      if (opts.json) {
        printJson({
          ...cfg,
          authToken: cfg.authToken ? "[set]" : undefined,
          configFile: getConfigPath(),
        });
        return;
      }

      header("Configuration");
      print("  " + c.bold("Config file:") + " " + c.gray(getConfigPath()));
      print("  " + c.bold("API URL:") + "     " + c.cyan(cfg.apiUrl));
      print(
        "  " +
          c.bold("Auth token:") +
          "  " +
          (cfg.authToken ? c.green("[set]") : c.gray("[not set]")),
      );
      print("");
      info("Env vars ASKVERDICT_TOKEN and ASKVERDICT_API_URL override file config.");
    });

  // config set-url <url>
  cmd
    .command("set-url")
    .description("Set the API base URL")
    .argument("<url>", "API base URL (e.g. https://api.askverdict.ai)")
    .action((url: string) => {
      try {
        // Validate basic URL format
        new URL(url);
      } catch {
        error(`"${url}" is not a valid URL.`);
        process.exit(1);
      }

      try {
        setConfig({ apiUrl: url.replace(/\/$/, "") });
        success(`API URL set to: ${url}`);
      } catch (err_) {
        error(err_ instanceof Error ? err_.message : String(err_));
        process.exit(1);
      }
    });

  // config set-token <token>
  cmd
    .command("set-token")
    .description("Save an auth token to config")
    .argument("<token>", "Auth token or API key")
    .action((token: string) => {
      if (!token.trim()) {
        error("Token cannot be empty.");
        process.exit(1);
      }

      try {
        setConfig({ authToken: token.trim() });
        success("Auth token saved to config.");
        info(`Config file: ${getConfigPath()}`);
      } catch (err_) {
        error(err_ instanceof Error ? err_.message : String(err_));
        process.exit(1);
      }
    });

  // config clear-token
  cmd
    .command("clear-token")
    .description("Remove the saved auth token")
    .action(() => {
      try {
        setConfig({ authToken: undefined });
        success("Auth token cleared.");
      } catch (err_) {
        error(err_ instanceof Error ? err_.message : String(err_));
        process.exit(1);
      }
    });

  // config reset
  cmd
    .command("reset")
    .description("Reset all config to defaults")
    .action(() => {
      try {
        clearConfig();
        success("Config reset to defaults.");
      } catch (err_) {
        error(err_ instanceof Error ? err_.message : String(err_));
        process.exit(1);
      }
    });

  // Default action: show config
  cmd.action((opts: { json?: boolean }) => {
    const cfg = getConfig();

    if (opts.json) {
      printJson({
        ...cfg,
        authToken: cfg.authToken ? "[set]" : undefined,
        configFile: getConfigPath(),
      });
      return;
    }

    header("Configuration");
    print("  " + c.bold("Config file:") + " " + c.gray(getConfigPath()));
    print("  " + c.bold("API URL:") + "     " + c.cyan(cfg.apiUrl));
    print(
      "  " +
        c.bold("Auth token:") +
        "  " +
        (cfg.authToken ? c.green("[set]") : c.gray("[not set]")),
    );
    print("");
    print(c.dim("  Subcommands:"));
    print(c.dim("    askverdict config show"));
    print(c.dim("    askverdict config set-url <url>"));
    print(c.dim("    askverdict config set-token <token>"));
    print(c.dim("    askverdict config clear-token"));
    print(c.dim("    askverdict config reset"));
  });

  return cmd;
}
