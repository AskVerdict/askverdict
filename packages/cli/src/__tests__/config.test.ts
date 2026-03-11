import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── fs mocking ────────────────────────────────────────────────────────────────
// We mock the entire "fs" module before importing the config module so that
// all filesystem operations are intercepted.

vi.mock("fs", () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  existsSync: vi.fn(),
}));

import * as fs from "fs";
import { getConfig, setConfig, clearConfig, getConfigPath, resolveToken } from "../config.js";

const mockedExistsSync = vi.mocked(fs.existsSync);
const mockedReadFileSync = vi.mocked(fs.readFileSync);
const mockedWriteFileSync = vi.mocked(fs.writeFileSync);
const mockedMkdirSync = vi.mocked(fs.mkdirSync);

// ── Helpers ───────────────────────────────────────────────────────────────────

function setConfigFile(content: unknown): void {
  mockedExistsSync.mockReturnValue(true);
  mockedReadFileSync.mockReturnValue(JSON.stringify(content) as never);
}

function noConfigFile(): void {
  mockedExistsSync.mockReturnValue(false);
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks();
  // Clear env vars that could leak between tests
  delete process.env["ASKVERDICT_TOKEN"];
  delete process.env["ASKVERDICT_API_URL"];
});

afterEach(() => {
  delete process.env["ASKVERDICT_TOKEN"];
  delete process.env["ASKVERDICT_API_URL"];
});

// ── getConfig() ───────────────────────────────────────────────────────────────

describe("getConfig()", () => {
  it("returns default apiUrl when no config file and no env vars", () => {
    noConfigFile();
    const cfg = getConfig();
    expect(cfg.apiUrl).toBe("http://localhost:3035");
  });

  it("returns undefined authToken when no config file and no env vars", () => {
    noConfigFile();
    const cfg = getConfig();
    expect(cfg.authToken).toBeUndefined();
  });

  it("reads apiUrl from config file when present", () => {
    setConfigFile({ apiUrl: "https://api.askverdict.ai" });
    const cfg = getConfig();
    expect(cfg.apiUrl).toBe("https://api.askverdict.ai");
  });

  it("reads authToken from config file when present", () => {
    setConfigFile({ apiUrl: "http://localhost:3035", authToken: "stored-tok-xyz" });
    const cfg = getConfig();
    expect(cfg.authToken).toBe("stored-tok-xyz");
  });

  it("ASKVERDICT_API_URL env var overrides config file apiUrl", () => {
    setConfigFile({ apiUrl: "https://staging.askverdict.ai" });
    process.env["ASKVERDICT_API_URL"] = "https://prod.askverdict.ai";
    const cfg = getConfig();
    expect(cfg.apiUrl).toBe("https://prod.askverdict.ai");
  });

  it("ASKVERDICT_TOKEN env var overrides config file authToken", () => {
    setConfigFile({ authToken: "file-token" });
    process.env["ASKVERDICT_TOKEN"] = "env-token";
    const cfg = getConfig();
    expect(cfg.authToken).toBe("env-token");
  });

  it("falls back to default apiUrl when config file has no apiUrl field", () => {
    setConfigFile({ authToken: "tok" });
    const cfg = getConfig();
    expect(cfg.apiUrl).toBe("http://localhost:3035");
  });

  it("gracefully handles malformed JSON in config file and uses defaults", () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue("{ invalid json" as never);
    const cfg = getConfig();
    expect(cfg.apiUrl).toBe("http://localhost:3035");
    expect(cfg.authToken).toBeUndefined();
  });

  it("ASKVERDICT_API_URL env var overrides even when config file is absent", () => {
    noConfigFile();
    process.env["ASKVERDICT_API_URL"] = "https://custom.example.com";
    const cfg = getConfig();
    expect(cfg.apiUrl).toBe("https://custom.example.com");
  });

  it("ASKVERDICT_TOKEN env var works even when config file is absent", () => {
    noConfigFile();
    process.env["ASKVERDICT_TOKEN"] = "env-only-token";
    const cfg = getConfig();
    expect(cfg.authToken).toBe("env-only-token");
  });
});

// ── setConfig() ───────────────────────────────────────────────────────────────

describe("setConfig()", () => {
  it("writes merged config to the config file", () => {
    setConfigFile({ apiUrl: "http://localhost:3035" });
    setConfig({ authToken: "new-tok" });

    expect(mockedWriteFileSync).toHaveBeenCalledOnce();
    const [, writtenContent] = mockedWriteFileSync.mock.calls[0] as [string, string, string];
    const parsed = JSON.parse(writtenContent) as Record<string, unknown>;
    expect(parsed["authToken"]).toBe("new-tok");
    expect(parsed["apiUrl"]).toBe("http://localhost:3035");
  });

  it("creates config directory if it does not exist", () => {
    mockedExistsSync.mockReturnValue(false);
    setConfig({ apiUrl: "http://localhost:9999" });
    expect(mockedMkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
  });

  it("does not call mkdirSync when config directory already exists", () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue("{}" as never);
    setConfig({ apiUrl: "http://localhost:9999" });
    expect(mockedMkdirSync).not.toHaveBeenCalled();
  });

  it("starts fresh when existing config file has invalid JSON", () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue("broken" as never);
    setConfig({ authToken: "fresh-tok" });

    const [, writtenContent] = mockedWriteFileSync.mock.calls[0] as [string, string, string];
    const parsed = JSON.parse(writtenContent) as Record<string, unknown>;
    expect(parsed["authToken"]).toBe("fresh-tok");
  });

  it("throws an error when writeFileSync fails", () => {
    mockedExistsSync.mockReturnValue(true);
    mockedReadFileSync.mockReturnValue("{}" as never);
    mockedWriteFileSync.mockImplementation(() => {
      throw new Error("EACCES: permission denied");
    });

    expect(() => setConfig({ authToken: "tok" })).toThrow("Failed to write config");
  });
});

// ── clearConfig() ─────────────────────────────────────────────────────────────

describe("clearConfig()", () => {
  it("writes an empty JSON object to the config file", () => {
    mockedExistsSync.mockReturnValue(true);
    clearConfig();

    expect(mockedWriteFileSync).toHaveBeenCalledOnce();
    const [, writtenContent] = mockedWriteFileSync.mock.calls[0] as [string, string, string];
    expect(writtenContent.trim()).toBe("{}");
  });

  it("creates the config directory if it does not exist", () => {
    mockedExistsSync.mockReturnValue(false);
    clearConfig();
    expect(mockedMkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
  });

  it("throws an error when write fails", () => {
    mockedExistsSync.mockReturnValue(true);
    mockedWriteFileSync.mockImplementation(() => {
      throw new Error("ENOSPC: no space left on device");
    });

    expect(() => clearConfig()).toThrow("Failed to clear config");
  });
});

// ── getConfigPath() ───────────────────────────────────────────────────────────

describe("getConfigPath()", () => {
  it("returns a path that includes .askverdict/config.json", () => {
    const path = getConfigPath();
    expect(path).toMatch(/\.askverdict[/\\]config\.json$/);
  });

  it("returns an absolute path", () => {
    const path = getConfigPath();
    expect(path.startsWith("/") || /^[A-Z]:\\/.test(path)).toBe(true);
  });
});

// ── resolveToken() ────────────────────────────────────────────────────────────

describe("resolveToken()", () => {
  it("returns the flagToken directly when provided", () => {
    noConfigFile();
    const token = resolveToken("flag-tok-123");
    expect(token).toBe("flag-tok-123");
  });

  it("falls back to config token when no flag token provided", () => {
    setConfigFile({ authToken: "config-tok" });
    const token = resolveToken(undefined);
    expect(token).toBe("config-tok");
  });

  it("returns undefined when no flag token and no config token", () => {
    noConfigFile();
    const token = resolveToken(undefined);
    expect(token).toBeUndefined();
  });

  it("env var token is returned when no flag token and config has no token", () => {
    noConfigFile();
    process.env["ASKVERDICT_TOKEN"] = "env-tok-resolve";
    const token = resolveToken(undefined);
    expect(token).toBe("env-tok-resolve");
  });

  it("flag token takes priority over env var token", () => {
    noConfigFile();
    process.env["ASKVERDICT_TOKEN"] = "env-tok";
    const token = resolveToken("flag-tok-wins");
    expect(token).toBe("flag-tok-wins");
  });
});
