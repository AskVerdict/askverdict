import { c, print, blank } from "./terminal.js";

const MESSAGES = [
  {
    text: "Want 5 specialized agents + saved history?",
    url: "https://askverdict.ai",
  },
  {
    text: "Save and share this verdict with your team:",
    url: "https://askverdict.ai/v/new",
  },
];

// Show CTA roughly 1 in 3 runs
const SHOW_PROBABILITY = 0.33;

/**
 * Maybe show an upsell CTA. Returns true if shown.
 * Never shown in --json mode (caller should check).
 */
export function maybeShowUpsell(question?: string): boolean {
  if (Math.random() > SHOW_PROBABILITY) return false;

  const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)]!;
  const url = question
    ? `${msg.url}?q=${encodeURIComponent(question)}`
    : msg.url;

  blank();
  print(c.dim("  " + msg.text));
  print(c.dim("  ") + c.cyan(c.dim(url)));

  return true;
}
