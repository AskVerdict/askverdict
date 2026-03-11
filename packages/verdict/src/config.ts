import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { ProviderName } from "./providers/types.js";

const CONFIG_DIR = join(homedir(), ".verdict");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export interface VerdictConfig {
  keys?: Partial<Record<ProviderName, string>>;
  defaultMode?: string;
}

export function loadConfig(): VerdictConfig {
  try {
    if (!existsSync(CONFIG_FILE)) return {};
    const raw = readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(raw) as VerdictConfig;
  } catch {
    return {};
  }
}

export function saveConfig(config: VerdictConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

export function setConfigKey(provider: ProviderName, key: string): void {
  const config = loadConfig();
  if (!config.keys) config.keys = {};
  config.keys[provider] = key;
  saveConfig(config);
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}
