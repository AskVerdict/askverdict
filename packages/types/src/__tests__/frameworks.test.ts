import { describe, expect, it } from "vitest";
import {
  FRAMEWORKS,
  getFramework,
  getAllFrameworks,
  getSpecializedFrameworks,
} from "../frameworks.js";
import type { DebateFrameworkId } from "../frameworks.js";

describe("frameworks registry", () => {
  it("has 8 frameworks defined", () => {
    expect(Object.keys(FRAMEWORKS)).toHaveLength(8);
  });

  it("includes all built-in frameworks", () => {
    expect(FRAMEWORKS["standard"]).toBeDefined();
    expect(FRAMEWORKS["six-thinking-hats"]).toBeDefined();
    expect(FRAMEWORKS["delphi-method"]).toBeDefined();
    expect(FRAMEWORKS["pre-mortem"]).toBeDefined();
    expect(FRAMEWORKS["roast"]).toBeDefined();
    expect(FRAMEWORKS["devils-advocate"]).toBeDefined();
    expect(FRAMEWORKS["eli5"]).toBeDefined();
    expect(FRAMEWORKS["shark-tank"]).toBeDefined();
  });

  describe("getFramework()", () => {
    it("returns framework by ID", () => {
      const fw = getFramework("six-thinking-hats");
      expect(fw).toBeDefined();
      expect(fw!.id).toBe("six-thinking-hats");
      expect(fw!.name).toBe("Six Thinking Hats");
    });

    it("returns undefined for unknown ID", () => {
      expect(getFramework("nonexistent" as DebateFrameworkId)).toBeUndefined();
    });
  });

  describe("getAllFrameworks()", () => {
    it("returns all 8 frameworks as an array", () => {
      const all = getAllFrameworks();
      expect(all).toHaveLength(8);
      expect(all.map((f) => f.id)).toContain("standard");
    });
  });

  describe("getSpecializedFrameworks()", () => {
    it("returns only non-standard frameworks", () => {
      const specialized = getSpecializedFrameworks();
      expect(specialized.every((f) => f.id !== "standard")).toBe(true);
      expect(specialized).toHaveLength(7);
    });
  });

  describe("framework properties", () => {
    it("standard framework has agentCount 0 (use mode default)", () => {
      expect(FRAMEWORKS["standard"].agentCount).toBe(0);
    });

    it("six-thinking-hats has 6 agents", () => {
      expect(FRAMEWORKS["six-thinking-hats"].agentCount).toBe(6);
    });

    it("delphi-method has 5 agents", () => {
      expect(FRAMEWORKS["delphi-method"].agentCount).toBe(5);
    });

    it("pre-mortem has 3 agents", () => {
      expect(FRAMEWORKS["pre-mortem"].agentCount).toBe(3);
    });

    it("all frameworks have required fields", () => {
      for (const fw of getAllFrameworks()) {
        expect(fw.id).toBeTruthy();
        expect(fw.name).toBeTruthy();
        expect(fw.description).toBeTruthy();
        expect(fw.longDescription).toBeTruthy();
        expect(fw.icon).toBeTruthy();
        expect(fw.personaSlots).toBeDefined();
        expect(fw.roundStructure).toBeDefined();
        expect(fw.verdictFormat).toBeDefined();
        expect(["fast", "balanced", "thorough"]).toContain(fw.minimumMode);
        expect(fw.themeColor).toBeTruthy();
      }
    });

    it("specialized frameworks have personaSlots matching their agentCount", () => {
      for (const fw of getSpecializedFrameworks()) {
        expect(fw.personaSlots).toHaveLength(fw.agentCount);
      }
    });

    it("six-thinking-hats has correct persona slot names", () => {
      const fw = FRAMEWORKS["six-thinking-hats"];
      const slotNames = fw.personaSlots.map((s) => s.name);
      expect(slotNames).toContain("White Hat");
      expect(slotNames).toContain("Red Hat");
      expect(slotNames).toContain("Black Hat");
      expect(slotNames).toContain("Yellow Hat");
      expect(slotNames).toContain("Green Hat");
      expect(slotNames).toContain("Blue Hat");
    });

    it("delphi-method requires balanced minimum mode", () => {
      expect(FRAMEWORKS["delphi-method"].minimumMode).toBe("balanced");
    });

    // Fun modes
    it("roast has 2 agents (Roaster + Defender)", () => {
      expect(FRAMEWORKS["roast"].agentCount).toBe(2);
      const names = FRAMEWORKS["roast"].personaSlots.map((s) => s.name);
      expect(names).toContain("The Roaster");
      expect(names).toContain("The Defender");
    });

    it("devils-advocate has 2 agents (Devil + Steel Man)", () => {
      expect(FRAMEWORKS["devils-advocate"].agentCount).toBe(2);
    });

    it("eli5 has 1 agent (The Simplifier)", () => {
      expect(FRAMEWORKS["eli5"].agentCount).toBe(1);
      expect(FRAMEWORKS["eli5"].personaSlots[0]!.name).toBe("The Simplifier");
    });

    it("shark-tank has 4 agents", () => {
      expect(FRAMEWORKS["shark-tank"].agentCount).toBe(4);
      const names = FRAMEWORKS["shark-tank"].personaSlots.map((s) => s.name);
      expect(names).toContain("Numbers Shark");
      expect(names).toContain("Market Shark");
      expect(names).toContain("Tech Shark");
      expect(names).toContain("Skeptic Shark");
    });

    it("eli5 works in fast mode", () => {
      expect(FRAMEWORKS["eli5"].minimumMode).toBe("fast");
    });

    it("shark-tank requires balanced mode", () => {
      expect(FRAMEWORKS["shark-tank"].minimumMode).toBe("balanced");
    });
  });
});
