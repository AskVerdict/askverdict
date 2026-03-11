import { describe, it, expect } from "vitest";
import {
  getAdvocatePrompt,
  getCriticPrompt,
  getSynthesizerPrompt,
  getMaxTokens,
} from "../../engine/personas.js";

describe("personas", () => {
  describe("getAdvocatePrompt()", () => {
    it("returns system prompt containing 'Advocate' and 'FOR'", () => {
      const { system } = getAdvocatePrompt("Should we use TypeScript?", "balanced");
      expect(system).toContain("Advocate");
      expect(system).toContain("FOR");
    });

    it("includes the question in user message", () => {
      const question = "Should we adopt microservices?";
      const { user } = getAdvocatePrompt(question, "balanced");
      expect(user).toContain(question);
    });

    it("system prompt instructs JSON response format", () => {
      const { system } = getAdvocatePrompt("Test question", "fast");
      expect(system).toContain("JSON");
      expect(system).toContain("argument");
    });
  });

  describe("getCriticPrompt()", () => {
    it("returns system prompt containing 'Critic' and 'AGAINST'", () => {
      const { system } = getCriticPrompt("Should we use TypeScript?", "balanced");
      expect(system).toContain("Critic");
      expect(system).toContain("AGAINST");
    });

    it("includes the question in user message", () => {
      const question = "Should we adopt microservices?";
      const { user } = getCriticPrompt(question, "balanced");
      expect(user).toContain(question);
    });

    it("system prompt instructs JSON response format", () => {
      const { system } = getCriticPrompt("Test question", "fast");
      expect(system).toContain("JSON");
      expect(system).toContain("argument");
    });
  });

  describe("getSynthesizerPrompt()", () => {
    it("includes advocate argument in user message", () => {
      const advocateArg = "This is the advocate argument text.";
      const criticArg = "This is the critic argument text.";
      const { user } = getSynthesizerPrompt("Test question", advocateArg, criticArg, "balanced");
      expect(user).toContain(advocateArg);
    });

    it("includes critic argument in user message", () => {
      const advocateArg = "This is the advocate argument text.";
      const criticArg = "This is the critic argument text.";
      const { user } = getSynthesizerPrompt("Test question", advocateArg, criticArg, "balanced");
      expect(user).toContain(criticArg);
    });

    it("includes both advocate and critic arguments in user message", () => {
      const advocateArg = "Strong case for the proposition.";
      const criticArg = "Strong case against the proposition.";
      const { user } = getSynthesizerPrompt("Test question", advocateArg, criticArg, "fast");
      expect(user).toContain(advocateArg);
      expect(user).toContain(criticArg);
    });

    it("system prompt mentions JSON response format", () => {
      const { system } = getSynthesizerPrompt("Test", "advocate arg", "critic arg", "balanced");
      expect(system).toContain("JSON");
    });

    it("system prompt includes expected verdict fields", () => {
      const { system } = getSynthesizerPrompt("Test", "advocate arg", "critic arg", "balanced");
      expect(system).toContain("summary");
      expect(system).toContain("confidence");
      expect(system).toContain("forPoints");
      expect(system).toContain("againstPoints");
    });

    it("includes the question in user message", () => {
      const question = "Is remote work better than office work?";
      const { user } = getSynthesizerPrompt(question, "arg1", "arg2", "thorough");
      expect(user).toContain(question);
    });
  });

  describe("getMaxTokens()", () => {
    it("returns 500 for 'fast' mode", () => {
      expect(getMaxTokens("fast")).toBe(500);
    });

    it("returns 1000 for 'balanced' mode", () => {
      expect(getMaxTokens("balanced")).toBe(1000);
    });

    it("returns 2000 for 'thorough' mode", () => {
      expect(getMaxTokens("thorough")).toBe(2000);
    });
  });

  describe("mode instructions", () => {
    it("fast mode includes concise instruction in advocate prompt", () => {
      const { system } = getAdvocatePrompt("Test", "fast");
      expect(system).toContain("concise");
    });

    it("thorough mode includes comprehensive instruction in advocate prompt", () => {
      const { system } = getAdvocatePrompt("Test", "thorough");
      expect(system).toContain("comprehensive");
    });

    it("fast and balanced system prompts differ", () => {
      const fast = getAdvocatePrompt("Test", "fast").system;
      const balanced = getAdvocatePrompt("Test", "balanced").system;
      expect(fast).not.toBe(balanced);
    });

    it("balanced and thorough system prompts differ", () => {
      const balanced = getAdvocatePrompt("Test", "balanced").system;
      const thorough = getAdvocatePrompt("Test", "thorough").system;
      expect(balanced).not.toBe(thorough);
    });

    it("fast and thorough system prompts differ", () => {
      const fast = getAdvocatePrompt("Test", "fast").system;
      const thorough = getAdvocatePrompt("Test", "thorough").system;
      expect(fast).not.toBe(thorough);
    });
  });
});
