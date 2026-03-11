// @askverdict/cli — Config file management
// Reads and writes ~/.askverdict/config.json
//
// Dependencies: fs, os, path (Node builtins)

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export interface CliConfig {
  apiUrl: string;
  authToken?: string;
}

const CONFIG_DIR = join(homedir(), ".askverdict");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");
const DEFAULT_API_URL = "http://localhost:3035";

export function getConfig(): CliConfig {
  // Environment variables take priority over file config
  const envToken = process.env["ASKVERDICT_TOKEN"];
  const envUrl = process.env["ASKVERDICT_API_URL"];

  let fileConfig: Partial<CliConfig> = {};

  if (existsSync(CONFIG_FILE)) {
    try {
      const raw = readFileSync(CONFIG_FILE, "utf-8");
      const parsed: unknown = JSON.parse(raw);
      if (parsed !== null && typeof parsed === "object") {
        fileConfig = parsed as Partial<CliConfig>;
      }
    } catch {
      // Ignore parse errors — use defaults
    }
  }

  return {
    apiUrl: envUrl ?? fileConfig.apiUrl ?? DEFAULT_API_URL,
    authToken: envToken ?? fileConfig.authToken,
  };
}

export function setConfig(updates: Partial<CliConfig>): void {
  let existing: Partial<CliConfig> = {};

  if (existsSync(CONFIG_FILE)) {
    try {
      const raw = readFileSync(CONFIG_FILE, "utf-8");
      const parsed: unknown = JSON.parse(raw);
      if (parsed !== null && typeof parsed === "object") {
        existing = parsed as Partial<CliConfig>;
      }
    } catch {
      // Start fresh
    }
  }

  const merged = { ...existing, ...updates };

  try {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }
    writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2) + "\n", "utf-8");
  } catch (err) {
    throw new Error(
      `Failed to write config: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export function clearConfig(): void {
  try {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }
    writeFileSync(CONFIG_FILE, "{}\n", "utf-8");
  } catch (err) {
    throw new Error(
      `Failed to clear config: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function resolveToken(flagToken?: string): string | undefined {
  if (flagToken) return flagToken;
  const cfg = getConfig();
  return cfg.authToken;
}
