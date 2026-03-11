import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:fs", () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  existsSync: vi.fn(),
}));

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { loadConfig, saveConfig, setConfigKey, getConfigPath } from "../config.js";

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockWriteFileSync = vi.mocked(writeFileSync);
const mockMkdirSync = vi.mocked(mkdirSync);

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("loadConfig()", () => {
  it("returns empty object when config file does not exist", () => {
    mockExistsSync.mockReturnValue(false);
    const config = loadConfig();
    expect(config).toEqual({});
  });

  it("returns parsed config when file exists", () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(
      JSON.stringify({ keys: { openai: "sk-test-key" }, defaultMode: "fast" }),
    );
    const config = loadConfig();
    expect(config).toEqual({ keys: { openai: "sk-test-key" }, defaultMode: "fast" });
  });

  it("returns empty object when file contains invalid JSON", () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue("{ broken json !!!");
    const config = loadConfig();
    expect(config).toEqual({});
  });
});

describe("saveConfig()", () => {
  it("creates directory before writing the file", () => {
    saveConfig({ defaultMode: "balanced" });
    expect(mockMkdirSync).toHaveBeenCalledOnce();
    expect(mockMkdirSync).toHaveBeenCalledWith(expect.stringContaining(".verdict"), {
      recursive: true,
    });
  });

  it("writes the serialised config to the config file path", () => {
    saveConfig({ defaultMode: "thorough" });
    expect(mockWriteFileSync).toHaveBeenCalledOnce();
    const [, content] = mockWriteFileSync.mock.calls[0] as [string, string, string];
    expect(content).toContain('"defaultMode": "thorough"');
  });
});

describe("setConfigKey()", () => {
  it("loads existing config and merges the new key", () => {
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify({ defaultMode: "fast" }));

    setConfigKey("openai", "sk-new-key");

    expect(mockWriteFileSync).toHaveBeenCalledOnce();
    const [, content] = mockWriteFileSync.mock.calls[0] as [string, string, string];
    const saved = JSON.parse(content) as { keys: Record<string, string>; defaultMode: string };
    expect(saved.keys["openai"]).toBe("sk-new-key");
    expect(saved.defaultMode).toBe("fast");
  });
});

describe("getConfigPath()", () => {
  it("returns a path that contains .verdict", () => {
    const configPath = getConfigPath();
    expect(configPath).toContain(".verdict");
  });
});
