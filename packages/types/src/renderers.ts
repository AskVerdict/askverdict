// Platform-agnostic verdict card renderer functions.
// Pure functions — no side effects, no external dependencies.

import type { Verdict, VerdictRecommendation } from "./verdict";

// ─── Input ───────────────────────────────────────────────────────────────────

export interface VerdictCardData {
  verdictId: string;
  question: string;
  verdict: Verdict;
  /** Base URL for linking back to the app (e.g. "https://askverdict.ai") */
  appBaseUrl: string;
  /** Framework used, if any */
  framework?: string | null;
}

// ─── Output Types ─────────────────────────────────────────────────────────────

export interface SlackBlock {
  type: string;
  [key: string]: unknown;
}

export interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  fields: Array<{ name: string; value: string; inline?: boolean }>;
  url: string;
  footer: { text: string };
  timestamp?: string;
}

export type VerdictCardFormat = "slack" | "teams" | "discord" | "html" | "markdown";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RECOMMENDATION_EMOJI: Record<string, string> = {
  RECOMMENDED: "✅",
  NOT_RECOMMENDED: "🚫",
  PROCEED_WITH_CAUTION: "⚠️",
  CONDITIONAL: "❓",
  SPLIT_DECISION: "⚖️",
  // Legacy
  PROCEED: "✅",
  RECONSIDER: "⚠️",
  MORE_INFO_NEEDED: "❓",
};

const RECOMMENDATION_COLOR: Record<string, string> = {
  RECOMMENDED: "#22c55e",          // green
  NOT_RECOMMENDED: "#f43f5e",      // rose
  PROCEED_WITH_CAUTION: "#f59e0b", // amber
  CONDITIONAL: "#3b82f6",          // blue
  SPLIT_DECISION: "#8b5cf6",       // violet
  // Legacy
  PROCEED: "#22c55e",
  RECONSIDER: "#ef4444",
  MORE_INFO_NEEDED: "#eab308",
};

/** Hex color string → decimal integer for Discord embeds */
function hexToDecimal(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 1) + "…";
}

function confidenceBar(confidence: number): string {
  const filled = Math.round(confidence / 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

function verdictUrl(appBaseUrl: string, verdictId: string): string {
  return `${appBaseUrl}/debates/${verdictId}`;
}

function recommendationLabel(recommendation: VerdictRecommendation): string {
  return recommendation.replace(/_/g, " ");
}

// ─── 1. Slack Block Kit ───────────────────────────────────────────────────────

/**
 * Renders a Slack Block Kit message for the given verdict card.
 * Produces header, summary, confidence, top arguments, and a CTA action button.
 */
export function renderSlackBlocks(data: VerdictCardData): SlackBlock[] {
  const { verdictId, question, verdict, appBaseUrl } = data;
  const { recommendation, confidence, oneLiner, argumentsFor, argumentsAgainst } = verdict;
  const emoji = RECOMMENDATION_EMOJI[recommendation] ?? "⚖️";
  const label = recommendationLabel(recommendation);
  const bar = confidenceBar(confidence);
  const url = verdictUrl(appBaseUrl, verdictId);

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${emoji} Verdict`,
        emoji: true,
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Question*\n${truncate(question, 300)}`,
        },
        {
          type: "mrkdwn",
          text: `*Recommendation*\n${label}`,
        },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `_${truncate(oneLiner, 300)}_`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Confidence:* ${confidence}%\n\`${bar}\``,
      },
    },
  ];

  const topFor = argumentsFor.slice(0, 2);
  const topAgainst = argumentsAgainst.slice(0, 2);

  if (topFor.length > 0 || topAgainst.length > 0) {
    const fields: Array<{ type: string; text: string }> = [];

    if (topFor.length > 0) {
      const forText = topFor.map((a) => `• ${truncate(a.content, 100)}`).join("\n");
      fields.push({ type: "mrkdwn", text: `*Arguments For*\n${forText}` });
    }

    if (topAgainst.length > 0) {
      const againstText = topAgainst.map((a) => `• ${truncate(a.content, 100)}`).join("\n");
      fields.push({ type: "mrkdwn", text: `*Arguments Against*\n${againstText}` });
    }

    blocks.push({ type: "section", fields });
  }

  blocks.push({ type: "divider" });

  blocks.push({
    type: "actions",
    elements: [
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "View Full Verdict",
          emoji: true,
        },
        style: "primary",
        url,
      },
    ],
  });

  return blocks;
}

// ─── 2. MS Teams Adaptive Card ────────────────────────────────────────────────

/**
 * Renders an MS Teams Adaptive Card (schema 1.4) for the given verdict card.
 * Produces a card with question, recommendation facts, one-liner, top arguments,
 * and an action link to the full verdict.
 */
export function renderTeamsAdaptiveCard(data: VerdictCardData): Record<string, unknown> {
  const { verdictId, question, verdict, appBaseUrl } = data;
  const { recommendation, confidence, oneLiner, argumentsFor, argumentsAgainst, agentsUsed } =
    verdict;
  const emoji = RECOMMENDATION_EMOJI[recommendation] ?? "⚖️";
  const label = recommendationLabel(recommendation);
  const url = verdictUrl(appBaseUrl, verdictId);

  const body: Array<Record<string, unknown>> = [
    {
      type: "TextBlock",
      text: `${emoji} ${label}`,
      size: "Large",
      weight: "Bolder",
      wrap: true,
    },
    {
      type: "TextBlock",
      text: truncate(question, 400),
      wrap: true,
      spacing: "Small",
    },
    {
      type: "FactSet",
      facts: [
        { title: "Confidence", value: `${confidence}%` },
        { title: "Recommendation", value: label },
        { title: "Agents Used", value: String(agentsUsed.length) },
      ],
      spacing: "Medium",
    },
    {
      type: "TextBlock",
      text: truncate(oneLiner, 500),
      wrap: true,
      isSubtle: true,
      spacing: "Medium",
    },
  ];

  const topFor = argumentsFor.slice(0, 2);
  const topAgainst = argumentsAgainst.slice(0, 2);

  if (topFor.length > 0) {
    body.push({
      type: "TextBlock",
      text: "Arguments For",
      weight: "Bolder",
      spacing: "Medium",
    });
    for (const arg of topFor) {
      body.push({
        type: "TextBlock",
        text: `• ${truncate(arg.content, 150)}`,
        wrap: true,
        spacing: "Small",
      });
    }
  }

  if (topAgainst.length > 0) {
    body.push({
      type: "TextBlock",
      text: "Arguments Against",
      weight: "Bolder",
      spacing: "Medium",
    });
    for (const arg of topAgainst) {
      body.push({
        type: "TextBlock",
        text: `• ${truncate(arg.content, 150)}`,
        wrap: true,
        spacing: "Small",
      });
    }
  }

  return {
    type: "AdaptiveCard",
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
    version: "1.4",
    body,
    actions: [
      {
        type: "Action.OpenUrl",
        title: "View Full Verdict",
        url,
      },
    ],
  };
}

// ─── 3. Discord Embed ─────────────────────────────────────────────────────────

/**
 * Renders a Discord embed object for the given verdict card.
 * Color is the recommendation color converted to a decimal integer.
 */
export function renderDiscordEmbed(data: VerdictCardData): DiscordEmbed {
  const { verdictId, question, verdict, appBaseUrl } = data;
  const { recommendation, confidence, oneLiner, argumentsFor, argumentsAgainst } = verdict;
  const label = recommendationLabel(recommendation);
  const bar = confidenceBar(confidence);
  const url = verdictUrl(appBaseUrl, verdictId);
  const color = hexToDecimal(RECOMMENDATION_COLOR[recommendation] ?? "#f59e0b");

  const fields: DiscordEmbed["fields"] = [
    {
      name: "Question",
      value: truncate(question, 1024),
      inline: false,
    },
    {
      name: "Confidence",
      value: `${confidence}% \`${bar}\``,
      inline: false,
    },
  ];

  const topFor = argumentsFor.slice(0, 2);
  const topAgainst = argumentsAgainst.slice(0, 2);

  if (topFor.length > 0) {
    fields.push({
      name: "Top Arguments For",
      value: topFor.map((a) => `• ${truncate(a.content, 200)}`).join("\n"),
      inline: false,
    });
  }

  if (topAgainst.length > 0) {
    fields.push({
      name: "Top Arguments Against",
      value: topAgainst.map((a) => `• ${truncate(a.content, 200)}`).join("\n"),
      inline: false,
    });
  }

  return {
    title: `Verdict: ${label}`,
    description: truncate(oneLiner, 4096),
    color,
    fields,
    url,
    footer: { text: "AskVerdict AI" },
    timestamp: new Date().toISOString(),
  };
}

// ─── 4. HTML (Email-safe) ─────────────────────────────────────────────────────

/**
 * Renders a self-contained HTML string suitable for email embeds.
 * Uses inline styles for maximum email client compatibility.
 */
export function renderHtml(data: VerdictCardData): string {
  const { verdictId, question, verdict, appBaseUrl } = data;
  const { recommendation, confidence, oneLiner, argumentsFor, argumentsAgainst } = verdict;
  const emoji = RECOMMENDATION_EMOJI[recommendation] ?? "⚖️";
  const label = recommendationLabel(recommendation);
  const accentColor = RECOMMENDATION_COLOR[recommendation];
  const url = verdictUrl(appBaseUrl, verdictId);
  const fillWidth = `${Math.round(confidence)}%`;

  const topFor = argumentsFor.slice(0, 2);
  const topAgainst = argumentsAgainst.slice(0, 2);

  const forItems = topFor
    .map(
      (a) =>
        `<li style="margin-bottom:6px;color:#374151;">${escapeHtml(truncate(a.content, 200))}</li>`
    )
    .join("");

  const againstItems = topAgainst
    .map(
      (a) =>
        `<li style="margin-bottom:6px;color:#374151;">${escapeHtml(truncate(a.content, 200))}</li>`
    )
    .join("");

  const forSection =
    topFor.length > 0
      ? `
    <div style="margin-top:20px;">
      <p style="margin:0 0 8px;font-weight:600;color:#111827;font-family:system-ui,-apple-system,sans-serif;">Arguments For</p>
      <ul style="margin:0;padding-left:20px;">${forItems}</ul>
    </div>`
      : "";

  const againstSection =
    topAgainst.length > 0
      ? `
    <div style="margin-top:16px;">
      <p style="margin:0 0 8px;font-weight:600;color:#111827;font-family:system-ui,-apple-system,sans-serif;">Arguments Against</p>
      <ul style="margin:0;padding-left:20px;">${againstItems}</ul>
    </div>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Verdict — AskVerdict AI</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background:${accentColor};padding:20px 28px;">
              <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">
                ${escapeHtml(emoji)} Verdict
              </p>
              <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.85);text-transform:uppercase;letter-spacing:0.05em;">
                ${escapeHtml(label)}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px;">

              <!-- Question -->
              <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#6b7280;">Question</p>
              <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#111827;line-height:1.4;">
                ${escapeHtml(truncate(question, 300))}
              </p>

              <!-- One-liner -->
              <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;font-style:italic;border-left:3px solid ${accentColor};padding-left:12px;">
                ${escapeHtml(truncate(oneLiner, 400))}
              </p>

              <!-- Confidence -->
              <div style="margin-bottom:20px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151;">
                  Confidence: ${confidence}%
                </p>
                <div style="background:#e5e7eb;border-radius:9999px;height:8px;overflow:hidden;">
                  <div style="background:${accentColor};width:${fillWidth};height:100%;border-radius:9999px;"></div>
                </div>
              </div>

              ${forSection}
              ${againstSection}

              <!-- CTA -->
              <div style="margin-top:28px;text-align:center;">
                <a href="${escapeHtml(url)}"
                   style="display:inline-block;background:${accentColor};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 28px;border-radius:8px;letter-spacing:-0.01em;">
                  View Full Verdict
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 28px;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Powered by <a href="${escapeHtml(appBaseUrl)}" style="color:#6b7280;text-decoration:none;">AskVerdict AI</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Minimal HTML entity escaping for safe interpolation. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── 5. Markdown ──────────────────────────────────────────────────────────────

/**
 * Renders clean Markdown for the given verdict card.
 * Suitable for GitHub comments, documentation, or any Markdown-capable surface.
 */
export function renderMarkdown(data: VerdictCardData): string {
  const { verdictId, question, verdict, appBaseUrl } = data;
  const { recommendation, confidence, oneLiner, argumentsFor, argumentsAgainst } = verdict;
  const emoji = RECOMMENDATION_EMOJI[recommendation] ?? "⚖️";
  const label = recommendationLabel(recommendation);
  const bar = confidenceBar(confidence);
  const url = verdictUrl(appBaseUrl, verdictId);

  const topFor = argumentsFor.slice(0, 2);
  const topAgainst = argumentsAgainst.slice(0, 2);

  const forSection =
    topFor.length > 0
      ? `### Arguments For\n${topFor.map((a) => `- ${truncate(a.content, 300)}`).join("\n")}\n`
      : "";

  const againstSection =
    topAgainst.length > 0
      ? `### Arguments Against\n${topAgainst.map((a) => `- ${truncate(a.content, 300)}`).join("\n")}\n`
      : "";

  return [
    `## ${emoji} Verdict: ${label}`,
    "",
    `**Question:** ${question}`,
    "",
    `> ${truncate(oneLiner, 500)}`,
    "",
    `**Confidence:** ${confidence}% \`${bar}\``,
    "",
    forSection,
    againstSection,
    `[View Full Verdict](${url})`,
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ─── Unified Dispatcher ───────────────────────────────────────────────────────

/**
 * Renders a verdict card in the requested format.
 * Returns `unknown` because each format has a different output shape;
 * callers should narrow the type based on the `format` argument.
 */
export function renderVerdictCard(data: VerdictCardData, format: VerdictCardFormat): unknown {
  switch (format) {
    case "slack":
      return renderSlackBlocks(data);
    case "teams":
      return renderTeamsAdaptiveCard(data);
    case "discord":
      return renderDiscordEmbed(data);
    case "html":
      return renderHtml(data);
    case "markdown":
      return renderMarkdown(data);
  }
}
