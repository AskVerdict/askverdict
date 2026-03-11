import type { Provider, ProviderName } from "./types.js";
import { createAnthropicProvider } from "./anthropic.js";
import { createOpenAIProvider } from "./openai.js";
import { createGoogleProvider } from "./google.js";
import { loadConfig } from "../config.js";

interface DetectedKey {
  name: ProviderName;
  key: string;
}

const ENV_KEY_MAP: Record<string, ProviderName> = {
  ANTHROPIC_API_KEY: "anthropic",
  OPENAI_API_KEY: "openai",
  GEMINI_API_KEY: "google",
};

/**
 * Detect which API keys are available from env vars and config file.
 */
export function detectKeys(): DetectedKey[] {
  const config = loadConfig();
  const keys: DetectedKey[] = [];

  for (const [envVar, providerName] of Object.entries(ENV_KEY_MAP)) {
    // Env vars take priority over config file
    const key = process.env[envVar] ?? config.keys?.[providerName];
    if (key) {
      keys.push({ name: providerName, key });
    }
  }

  return keys;
}

/**
 * Create a provider instance from a detected key.
 */
function createProvider(detected: DetectedKey, model?: string): Provider {
  switch (detected.name) {
    case "anthropic":
      return createAnthropicProvider(detected.key, model);
    case "openai":
      return createOpenAIProvider(detected.key, model);
    case "google":
      return createGoogleProvider(detected.key, model);
  }
}

export interface ProviderAssignment {
  advocate: Provider;
  critic: Provider;
  synthesizer: Provider;
}

/**
 * Assign providers to debate roles.
 *
 * Strategy:
 * - 3 keys: each persona gets a different provider (diversity of thought)
 * - 2 keys: synthesizer gets the first, advocate/critic split
 * - 1 key: all three use the same provider
 *
 * If `filter` is provided, only matching providers are used.
 */
export function assignProviders(filter?: ProviderName[]): ProviderAssignment {
  let keys = detectKeys();

  if (keys.length === 0) {
    throw new Error(
      "No API keys found. Set at least one of:\n" +
        "  ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY\n\n" +
        "Or run: verdict config --set anthropic=sk-ant-...",
    );
  }

  if (filter && filter.length > 0) {
    const filtered = keys.filter((k) => filter.includes(k.name));
    if (filtered.length === 0) {
      throw new Error(
        `No keys found for providers: ${filter.join(", ")}. ` +
          `Available: ${keys.map((k) => k.name).join(", ")}`,
      );
    }
    keys = filtered;
  }

  if (keys.length >= 3) {
    // Each role gets a unique provider
    return {
      advocate: createProvider(keys[0]!),
      critic: createProvider(keys[1]!),
      synthesizer: createProvider(keys[2]!),
    };
  }

  if (keys.length === 2) {
    return {
      advocate: createProvider(keys[0]!),
      critic: createProvider(keys[1]!),
      synthesizer: createProvider(keys[0]!),
    };
  }

  // Single provider for all roles
  const provider = keys[0]!;
  return {
    advocate: createProvider(provider),
    critic: createProvider(provider),
    synthesizer: createProvider(provider),
  };
}

/**
 * Get human-readable summary of detected providers.
 */
export function getProviderSummary(): Array<{ provider: ProviderName; model: string; source: string }> {
  const config = loadConfig();
  const summary: Array<{ provider: ProviderName; model: string; source: string }> = [];

  for (const [envVar, providerName] of Object.entries(ENV_KEY_MAP)) {
    const envKey = process.env[envVar];
    const configKey = config.keys?.[providerName];

    if (envKey) {
      const p = createProvider({ name: providerName, key: envKey });
      summary.push({ provider: providerName, model: p.model, source: "env" });
    } else if (configKey) {
      const p = createProvider({ name: providerName, key: configKey });
      summary.push({ provider: providerName, model: p.model, source: "config" });
    }
  }

  return summary;
}
