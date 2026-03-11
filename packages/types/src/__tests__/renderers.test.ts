import { describe, expect, it } from "vitest";
import {
  renderSlackBlocks,
  renderTeamsAdaptiveCard,
  renderDiscordEmbed,
  renderHtml,
  renderMarkdown,
  renderVerdictCard,
} from "../renderers.js";
import type { VerdictCardData, SlackBlock, DiscordEmbed } from "../renderers.js";
import type { Verdict } from "../verdict.js";
import type { Argument } from "../argument.js";
import type { AgentSummary } from "../agent.js";
import type { ModelUsage } from "../cost.js";
import type { Evidence } from "../evidence.js";
import type { DecisionMatrix } from "../verdict.js";

// ─── Test Helpers ─────────────────────────────────────────────────────────────

function mockArgument(content: string, strength = 0.8): Argument {
  const evidence: Evidence = {
    source: "reasoning",
    confidence: 0.9,
  };
  return { content, evidence: [evidence], strength };
}

function mockAgentSummary(id: string, name: string): AgentSummary {
  return {
    id,
    persona: "analyst",
    name,
    claimsCount: 3,
    responsesCount: 2,
    finalConfidence: 75,
  };
}

function mockModelUsage(model: string): ModelUsage {
  return {
    model,
    taskType: "debater",
    callCount: 4,
    totalTokens: 2048,
    cost: 0.012,
  };
}

function mockDecisionMatrix(): DecisionMatrix {
  return {
    entries: [
      {
        criterion: "Scalability",
        weight: 0.4,
        scores: { optionA: 8, optionB: 6 },
        reasoning: "Kubernetes scales horizontally.",
      },
    ],
    options: ["optionA", "optionB"],
    totalScores: { optionA: 8, optionB: 6 },
  };
}

function mockVerdict(): Verdict {
  return {
    recommendation: "PROCEED",
    confidence: 82,
    oneLiner: "Kubernetes is well-suited for microservices at scale.",
    argumentsFor: [
      mockArgument("Kubernetes provides robust container orchestration."),
      mockArgument("Declarative configuration simplifies deployments."),
    ],
    argumentsAgainst: [
      mockArgument("Kubernetes has a steep learning curve for small teams."),
      mockArgument("Operational overhead increases infrastructure costs."),
    ],
    keyEvidence: [],
    dissentingViews: [],
    blindSpots: [],
    assumptions: ["Team has basic DevOps knowledge."],
    decisionMatrix: mockDecisionMatrix(),
    nextSteps: ["Set up a staging cluster", "Train the team on kubectl"],
    revisitTriggers: ["Team size drops below 5"],
    totalRounds: 3,
    agentsUsed: [
      mockAgentSummary("agent-1", "Advocate"),
      mockAgentSummary("agent-2", "Critic"),
    ],
    modelsUsed: [mockModelUsage("claude-sonnet-4-6")],
    totalCost: 0.024,
    debateDurationSeconds: 45,
  };
}

function mockVerdictCardData(): VerdictCardData {
  return {
    verdictId: "d4b3c2a1-e5f6-7890-abcd-ef1234567890",
    question: "Should we adopt Kubernetes for our microservices?",
    verdict: mockVerdict(),
    appBaseUrl: "https://askverdict.ai",
  };
}

const EXPECTED_VERDICT_URL =
  "https://askverdict.ai/debates/d4b3c2a1-e5f6-7890-abcd-ef1234567890";

// ─── 1. renderSlackBlocks ─────────────────────────────────────────────────────

describe("renderSlackBlocks", () => {
  it("returns an array of blocks", () => {
    const blocks = renderSlackBlocks(mockVerdictCardData());
    expect(Array.isArray(blocks)).toBe(true);
    expect(blocks.length).toBeGreaterThan(0);
  });

  it("first block is type 'header' containing the PROCEED emoji", () => {
    const blocks = renderSlackBlocks(mockVerdictCardData());
    const header = blocks[0] as SlackBlock;
    expect(header.type).toBe("header");
    const text = header.text as { type: string; text: string };
    expect(text.text).toContain("✅");
  });

  it("contains a section block with the question text", () => {
    const blocks = renderSlackBlocks(mockVerdictCardData());
    const sectionWithQuestion = blocks.find((b) => {
      if (b.type !== "section") return false;
      const fields = b.fields as Array<{ text: string }> | undefined;
      return fields?.some((f) => f.text.includes("Should we adopt Kubernetes"));
    });
    expect(sectionWithQuestion).toBeDefined();
  });

  it("contains confidence percentage in a section block", () => {
    const blocks = renderSlackBlocks(mockVerdictCardData());
    const confidenceBlock = blocks.find((b) => {
      if (b.type !== "section") return false;
      const text = b.text as { text: string } | undefined;
      return text?.text.includes("82%");
    });
    expect(confidenceBlock).toBeDefined();
  });

  it("last block is type 'actions' with a 'View Full Verdict' button", () => {
    const blocks = renderSlackBlocks(mockVerdictCardData());
    const lastBlock = blocks[blocks.length - 1] as SlackBlock;
    expect(lastBlock.type).toBe("actions");
    const elements = lastBlock.elements as Array<{ text: { text: string } }>;
    expect(elements[0].text.text).toBe("View Full Verdict");
  });

  it("button URL points to the correct debate URL", () => {
    const blocks = renderSlackBlocks(mockVerdictCardData());
    const actionsBlock = blocks[blocks.length - 1] as SlackBlock;
    const elements = actionsBlock.elements as Array<{ url: string }>;
    expect(elements[0].url).toBe(EXPECTED_VERDICT_URL);
  });

  it("includes arguments for and against as section fields", () => {
    const blocks = renderSlackBlocks(mockVerdictCardData());
    const argBlock = blocks.find((b) => {
      if (b.type !== "section") return false;
      const fields = b.fields as Array<{ text: string }> | undefined;
      return fields?.some((f) => f.text.includes("Arguments For"));
    });
    expect(argBlock).toBeDefined();
  });
});

// ─── 2. renderTeamsAdaptiveCard ───────────────────────────────────────────────

describe("renderTeamsAdaptiveCard", () => {
  it("returns AdaptiveCard with correct schema and version", () => {
    const card = renderTeamsAdaptiveCard(mockVerdictCardData());
    expect(card.type).toBe("AdaptiveCard");
    expect(card.$schema).toBe("http://adaptivecards.io/schemas/adaptive-card.json");
    expect(card.version).toBe("1.4");
  });

  it("body contains a FactSet with confidence percentage", () => {
    const card = renderTeamsAdaptiveCard(mockVerdictCardData());
    const body = card.body as Array<Record<string, unknown>>;
    const factSet = body.find((block) => block.type === "FactSet");
    expect(factSet).toBeDefined();
    const facts = factSet!.facts as Array<{ title: string; value: string }>;
    const confidenceFact = facts.find((f) => f.title === "Confidence");
    expect(confidenceFact?.value).toBe("82%");
  });

  it("has Action.OpenUrl action linking to the full verdict", () => {
    const card = renderTeamsAdaptiveCard(mockVerdictCardData());
    const actions = card.actions as Array<{ type: string; url: string; title: string }>;
    expect(actions).toBeDefined();
    const openUrl = actions.find((a) => a.type === "Action.OpenUrl");
    expect(openUrl).toBeDefined();
    expect(openUrl!.url).toBe(EXPECTED_VERDICT_URL);
    expect(openUrl!.title).toBe("View Full Verdict");
  });

  it("body contains the question text in a TextBlock", () => {
    const card = renderTeamsAdaptiveCard(mockVerdictCardData());
    const body = card.body as Array<Record<string, unknown>>;
    const questionBlock = body.find(
      (block) =>
        block.type === "TextBlock" &&
        typeof block.text === "string" &&
        (block.text as string).includes("Should we adopt Kubernetes")
    );
    expect(questionBlock).toBeDefined();
  });

  it("FactSet includes recommendation and agents used", () => {
    const card = renderTeamsAdaptiveCard(mockVerdictCardData());
    const body = card.body as Array<Record<string, unknown>>;
    const factSet = body.find((block) => block.type === "FactSet");
    const facts = factSet!.facts as Array<{ title: string; value: string }>;
    const recommendationFact = facts.find((f) => f.title === "Recommendation");
    const agentsFact = facts.find((f) => f.title === "Agents Used");
    expect(recommendationFact?.value).toBe("PROCEED");
    expect(agentsFact?.value).toBe("2");
  });
});

// ─── 3. renderDiscordEmbed ────────────────────────────────────────────────────

describe("renderDiscordEmbed", () => {
  it("returns correct title with recommendation label", () => {
    const embed = renderDiscordEmbed(mockVerdictCardData());
    expect(embed.title).toBe("Verdict: PROCEED");
  });

  it("color is a decimal integer, not a hex string", () => {
    const embed = renderDiscordEmbed(mockVerdictCardData());
    expect(typeof embed.color).toBe("number");
    expect(Number.isInteger(embed.color)).toBe(true);
    // #22c55e → 0x22c55e = 2277726
    expect(embed.color).toBe(0x22c55e);
  });

  it("has fields for question and confidence", () => {
    const embed = renderDiscordEmbed(mockVerdictCardData());
    const questionField = embed.fields.find((f) => f.name === "Question");
    const confidenceField = embed.fields.find((f) => f.name === "Confidence");
    expect(questionField).toBeDefined();
    expect(questionField!.value).toContain("Should we adopt Kubernetes");
    expect(confidenceField).toBeDefined();
    expect(confidenceField!.value).toContain("82%");
  });

  it("footer text is 'AskVerdict AI'", () => {
    const embed = renderDiscordEmbed(mockVerdictCardData());
    expect(embed.footer.text).toBe("AskVerdict AI");
  });

  it("url links to the full verdict", () => {
    const embed = renderDiscordEmbed(mockVerdictCardData());
    expect(embed.url).toBe(EXPECTED_VERDICT_URL);
  });

  it("description contains the one-liner text", () => {
    const embed = renderDiscordEmbed(mockVerdictCardData());
    expect(embed.description).toContain("Kubernetes is well-suited for microservices");
  });
});

// ─── 4. renderHtml ────────────────────────────────────────────────────────────

describe("renderHtml", () => {
  it("returns a string containing the HTML doctype declaration", () => {
    const html = renderHtml(mockVerdictCardData());
    expect(typeof html).toBe("string");
    expect(html).toContain("<!DOCTYPE html>");
  });

  it("contains the question text (HTML-escaped)", () => {
    const html = renderHtml(mockVerdictCardData());
    expect(html).toContain("Should we adopt Kubernetes for our microservices?");
  });

  it("contains the PROCEED recommendation accent color", () => {
    const html = renderHtml(mockVerdictCardData());
    expect(html).toContain("#22c55e");
  });

  it("contains 'View Full Verdict' link pointing to the correct URL", () => {
    const html = renderHtml(mockVerdictCardData());
    expect(html).toContain("View Full Verdict");
    expect(html).toContain(EXPECTED_VERDICT_URL);
  });

  it("contains the one-liner text", () => {
    const html = renderHtml(mockVerdictCardData());
    expect(html).toContain("Kubernetes is well-suited for microservices at scale.");
  });

  it("properly escapes special HTML characters in question", () => {
    const data = mockVerdictCardData();
    data.question = "Is <React> better than \"Vue\" & Angular?";
    const html = renderHtml(data);
    expect(html).not.toContain("<React>");
    expect(html).toContain("&lt;React&gt;");
    expect(html).toContain("&quot;Vue&quot;");
    expect(html).toContain("&amp;");
  });
});

// ─── 5. renderMarkdown ────────────────────────────────────────────────────────

describe("renderMarkdown", () => {
  it("starts with '## ' heading containing the emoji and recommendation", () => {
    const md = renderMarkdown(mockVerdictCardData());
    expect(md.startsWith("## ")).toBe(true);
    expect(md).toContain("## ✅ Verdict: PROCEED");
  });

  it("contains the question text", () => {
    const md = renderMarkdown(mockVerdictCardData());
    expect(md).toContain("Should we adopt Kubernetes for our microservices?");
  });

  it("contains the confidence bar using block characters", () => {
    const md = renderMarkdown(mockVerdictCardData());
    // 82% → 8 filled blocks, 2 empty
    expect(md).toContain("████████░░");
    expect(md).toContain("82%");
  });

  it("contains a 'View Full Verdict' Markdown link to the verdict URL", () => {
    const md = renderMarkdown(mockVerdictCardData());
    expect(md).toContain(`[View Full Verdict](${EXPECTED_VERDICT_URL})`);
  });

  it("contains arguments for and against as bullet lists under ### headings", () => {
    const md = renderMarkdown(mockVerdictCardData());
    expect(md).toContain("### Arguments For");
    expect(md).toContain("### Arguments Against");
    expect(md).toContain("- Kubernetes provides robust container orchestration.");
    expect(md).toContain("- Kubernetes has a steep learning curve for small teams.");
  });
});

// ─── 6. renderVerdictCard dispatcher ─────────────────────────────────────────

describe("renderVerdictCard dispatcher", () => {
  it("format 'slack' returns an array", () => {
    const result = renderVerdictCard(mockVerdictCardData(), "slack");
    expect(Array.isArray(result)).toBe(true);
  });

  it("format 'teams' returns an object with type 'AdaptiveCard'", () => {
    const result = renderVerdictCard(mockVerdictCardData(), "teams") as Record<string, unknown>;
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
    expect(result.type).toBe("AdaptiveCard");
  });

  it("format 'discord' returns an object with a title property", () => {
    const result = renderVerdictCard(mockVerdictCardData(), "discord") as DiscordEmbed;
    expect(result).toBeDefined();
    expect(typeof result.title).toBe("string");
    expect(result.title).toContain("Verdict:");
  });

  it("format 'markdown' returns a string", () => {
    const result = renderVerdictCard(mockVerdictCardData(), "markdown");
    expect(typeof result).toBe("string");
  });

  it("format 'html' returns a string containing DOCTYPE", () => {
    const result = renderVerdictCard(mockVerdictCardData(), "html");
    expect(typeof result).toBe("string");
    expect(result as string).toContain("<!DOCTYPE html>");
  });
});

// ─── 7. Edge cases ────────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("verdict with empty argumentsFor and argumentsAgainst still renders all formats without error", () => {
    const data = mockVerdictCardData();
    data.verdict = { ...data.verdict, argumentsFor: [], argumentsAgainst: [] };

    expect(() => renderSlackBlocks(data)).not.toThrow();
    expect(() => renderTeamsAdaptiveCard(data)).not.toThrow();
    expect(() => renderDiscordEmbed(data)).not.toThrow();
    expect(() => renderHtml(data)).not.toThrow();
    expect(() => renderMarkdown(data)).not.toThrow();
  });

  it("empty arguments do not produce 'Arguments For/Against' sections in Slack", () => {
    const data = mockVerdictCardData();
    data.verdict = { ...data.verdict, argumentsFor: [], argumentsAgainst: [] };
    const blocks = renderSlackBlocks(data);
    const argBlock = blocks.find((b) => {
      if (b.type !== "section") return false;
      const fields = b.fields as Array<{ text: string }> | undefined;
      return fields?.some((f) => f.text.includes("Arguments For"));
    });
    expect(argBlock).toBeUndefined();
  });

  it("very long question (>300 chars) is truncated with ellipsis in Slack output", () => {
    const data = mockVerdictCardData();
    data.question = "A".repeat(400);
    const blocks = renderSlackBlocks(data);
    const sectionWithQuestion = blocks.find((b) => {
      if (b.type !== "section") return false;
      const fields = b.fields as Array<{ text: string }> | undefined;
      return fields?.some((f) => f.text.includes("*Question*"));
    });
    expect(sectionWithQuestion).toBeDefined();
    const fields = sectionWithQuestion!.fields as Array<{ text: string }>;
    const questionField = fields.find((f) => f.text.includes("*Question*"));
    // truncated: 300 chars including ellipsis → length should be 300 + label overhead, not 400
    expect(questionField!.text).toContain("…");
    expect(questionField!.text).not.toContain("A".repeat(301));
  });

  it("special HTML characters in oneLiner are escaped in HTML output", () => {
    const data = mockVerdictCardData();
    data.verdict = {
      ...data.verdict,
      oneLiner: "Use <b>Kubernetes</b> & save 'time'",
    };
    const html = renderHtml(data);
    expect(html).not.toContain("<b>Kubernetes</b>");
    expect(html).toContain("&lt;b&gt;Kubernetes&lt;/b&gt;");
    expect(html).toContain("&amp;");
    expect(html).toContain("&#39;time&#39;");
  });

  it("RECONSIDER recommendation uses red color (#ef4444) in Discord embed", () => {
    const data = mockVerdictCardData();
    data.verdict = { ...data.verdict, recommendation: "RECONSIDER" };
    const embed = renderDiscordEmbed(data);
    expect(embed.color).toBe(0xef4444);
    expect(embed.title).toBe("Verdict: RECONSIDER");
  });

  it("MORE_INFO_NEEDED recommendation uses ❓ emoji in Slack header", () => {
    const data = mockVerdictCardData();
    data.verdict = { ...data.verdict, recommendation: "MORE_INFO_NEEDED" };
    const blocks = renderSlackBlocks(data);
    const header = blocks[0] as SlackBlock;
    const text = header.text as { text: string };
    expect(text.text).toContain("❓");
  });
});
