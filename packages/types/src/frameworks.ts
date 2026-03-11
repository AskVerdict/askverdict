// Decision Frameworks — structured debate methodologies
//
// Frameworks are orthogonal to modes (speed/depth). A user picks BOTH:
//   Framework = methodology (Standard, Six Thinking Hats, Delphi, Pre-mortem)
//   Mode = speed/depth (fast, balanced, thorough)
//
// The engine uses the framework to configure persona assignment, round
// structure, and verdict format — while the mode controls token budgets,
// agent count scaling, and temperature.

import type { PersonaType } from "./agent";

// ---------------------------------------------------------------------------
// Core Types
// ---------------------------------------------------------------------------

/** Built-in decision framework identifiers */
export type BuiltinFrameworkId =
  | "standard"
  | "six-thinking-hats"
  | "delphi-method"
  | "pre-mortem"
  | "roast"
  | "devils-advocate"
  | "eli5"
  | "shark-tank";

/** Custom framework IDs follow the pattern: custom-{uuid} */
export type CustomFrameworkId = string & { readonly __brand: "CustomFrameworkId" };

/** Any framework identifier (built-in or custom) */
export type DebateFrameworkId = BuiltinFrameworkId | CustomFrameworkId;

/** Type guard for custom framework IDs */
export function isCustomFrameworkId(id: string): id is CustomFrameworkId {
  return id.startsWith("custom-");
}

/** Type guard for built-in framework IDs */
export function isBuiltinFrameworkId(id: string): id is BuiltinFrameworkId {
  return ["standard", "six-thinking-hats", "delphi-method", "pre-mortem", "roast", "devils-advocate", "eli5", "shark-tank"].includes(id);
}

/** How rounds progress within a framework */
export interface FrameworkRoundStructure {
  /** Human-readable name for each round phase */
  phases: string[];
  /** Description of what happens in each phase */
  phaseDescriptions: string[];
  /** Whether the framework supports early exit via consensus detection */
  supportsEarlyExit: boolean;
}

/** Maps a framework persona slot to its configuration */
export interface FrameworkPersonaSlot {
  /** Unique slot ID within the framework (e.g. "white-hat", "pessimist") */
  slotId: string;
  /** Display name (e.g. "White Hat - Facts") */
  name: string;
  /** Short role description */
  role: string;
  /** Color for UI rendering (hex) */
  color: string;
  /** Emoji for compact display */
  emoji: string;
  /** Optional: map to an existing PersonaType for system prompt reuse */
  basePersona?: PersonaType;
}

/** Extended persona slot with inline system prompt for custom frameworks */
export interface CustomPersonaSlot extends FrameworkPersonaSlot {
  /** Full system prompt defining this persona's behavior */
  systemPrompt: string;
  /** Thinking bias direction */
  biasDirection: "positive" | "negative" | "neutral";
}

/** Describes how the verdict should be structured for this framework */
export interface FrameworkVerdictFormat {
  /** Name of the verdict style (e.g. "Hat Synthesis", "Convergence Report") */
  name: string;
  /** Sections expected in the verdict output */
  sections: string[];
}

/** Complete framework definition */
export interface DebateFramework {
  /** Unique identifier */
  id: DebateFrameworkId;
  /** Display name */
  name: string;
  /** One-line description for UI cards */
  description: string;
  /** Longer explanation for tooltips / details view */
  longDescription: string;
  /** Icon name (Lucide icon) */
  icon: string;
  /** Number of agents this framework uses (overrides mode's agentCount) */
  agentCount: number;
  /** Persona slots — defines each agent's role in this framework */
  personaSlots: FrameworkPersonaSlot[];
  /** Round structure definition */
  roundStructure: FrameworkRoundStructure;
  /** Verdict format specification */
  verdictFormat: FrameworkVerdictFormat;
  /** Recommended minimum mode (some frameworks need more rounds) */
  minimumMode: "fast" | "balanced" | "thorough";
  /** Color theme for UI (hex) */
  themeColor: string;
}

/** User-created custom framework with inline persona prompts */
export interface CustomDebateFramework extends Omit<DebateFramework, "id" | "personaSlots" | "longDescription"> {
  id: CustomFrameworkId;
  personaSlots: CustomPersonaSlot[];
  longDescription?: string;
  userId: string;
  isShared: boolean;
  workspaceId?: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Framework Definitions
// ---------------------------------------------------------------------------

const STANDARD_FRAMEWORK: DebateFramework = {
  id: "standard",
  name: "Standard Debate",
  description: "Classic multi-agent debate with advocate, critic, and specialist perspectives.",
  longDescription:
    "The default debate format. Agents are assigned roles based on the question's domain - advocate, critic, analyst, engineer, economist, or devil's advocate. Each round, agents argue their positions, cross-examine each other, and build toward a synthesized verdict.",
  icon: "scale",
  agentCount: 0, // 0 = use mode's default agentCount
  personaSlots: [], // empty = use standard persona selection logic
  roundStructure: {
    phases: ["Opening", "Cross-Examination", "Closing"],
    phaseDescriptions: [
      "Each agent presents their initial position",
      "Agents challenge and respond to each other's arguments",
      "Final statements and position summaries",
    ],
    supportsEarlyExit: true,
  },
  verdictFormat: {
    name: "Standard Verdict",
    sections: ["Recommendation", "Arguments For", "Arguments Against", "Key Evidence", "Blind Spots", "Next Steps"],
  },
  minimumMode: "fast",
  themeColor: "#3b82f6", // blue
};

const SIX_THINKING_HATS_FRAMEWORK: DebateFramework = {
  id: "six-thinking-hats",
  name: "Six Thinking Hats",
  description: "De Bono's structured thinking - 6 agents, each wearing a different cognitive hat.",
  longDescription:
    "Based on Edward de Bono's Six Thinking Hats method. Each agent adopts one of six distinct thinking modes: White (facts & data), Red (emotions & intuition), Black (caution & risks), Yellow (optimism & benefits), Green (creativity & alternatives), and Blue (process & synthesis). The Blue Hat moderates and produces the final verdict.",
  icon: "palette",
  agentCount: 6,
  personaSlots: [
    { slotId: "white-hat", name: "White Hat", role: "Facts & Data", color: "#f5f5f5", emoji: "🤍", basePersona: "analyst" },
    { slotId: "red-hat", name: "Red Hat", role: "Emotions & Intuition", color: "#ef4444", emoji: "❤️" },
    { slotId: "black-hat", name: "Black Hat", role: "Caution & Risks", color: "#1f2937", emoji: "🖤", basePersona: "critic" },
    { slotId: "yellow-hat", name: "Yellow Hat", role: "Optimism & Benefits", color: "#eab308", emoji: "💛", basePersona: "advocate" },
    { slotId: "green-hat", name: "Green Hat", role: "Creativity & Alternatives", color: "#22c55e", emoji: "💚" },
    { slotId: "blue-hat", name: "Blue Hat", role: "Process & Synthesis", color: "#3b82f6", emoji: "💙" },
  ],
  roundStructure: {
    phases: ["Hat Perspectives", "Cross-Hat Dialogue", "Blue Hat Synthesis"],
    phaseDescriptions: [
      "Each hat presents its unique perspective on the question",
      "Hats respond to and build on each other's observations",
      "Blue Hat synthesizes all perspectives into a structured recommendation",
    ],
    supportsEarlyExit: false,
  },
  verdictFormat: {
    name: "Hat Synthesis",
    sections: ["Facts (White)", "Feelings (Red)", "Risks (Black)", "Benefits (Yellow)", "Alternatives (Green)", "Synthesis (Blue)", "Recommendation"],
  },
  minimumMode: "balanced",
  themeColor: "#3b82f6", // blue (Blue Hat leads)
};

const DELPHI_METHOD_FRAMEWORK: DebateFramework = {
  id: "delphi-method",
  name: "Delphi Method",
  description: "Anonymous expert rounds that iteratively converge toward consensus.",
  longDescription:
    "Based on the RAND Corporation's Delphi technique. Multiple expert agents independently assess the question, then see anonymous aggregated results (not who said what). Over successive rounds, they revise their positions. A convergence detector stops the debate when consensus is reached or maximum rounds are hit. The verdict shows the convergence trajectory and final consensus with remaining dissent.",
  icon: "target",
  agentCount: 5,
  personaSlots: [
    { slotId: "expert-1", name: "Domain Expert", role: "Primary domain specialist", color: "#8b5cf6", emoji: "🔮", basePersona: "analyst" },
    { slotId: "expert-2", name: "Industry Analyst", role: "Market & industry perspective", color: "#06b6d4", emoji: "📊", basePersona: "economist" },
    { slotId: "expert-3", name: "Technical Evaluator", role: "Feasibility & implementation lens", color: "#f59e0b", emoji: "🔧", basePersona: "engineer" },
    { slotId: "expert-4", name: "Risk Assessor", role: "Probability & downside analysis", color: "#ef4444", emoji: "🎯", basePersona: "critic" },
    { slotId: "expert-5", name: "Strategic Advisor", role: "Long-term strategic implications", color: "#10b981", emoji: "🧭", basePersona: "advocate" },
  ],
  roundStructure: {
    phases: ["Independent Assessment", "Anonymous Aggregate Review", "Position Revision", "Convergence Check"],
    phaseDescriptions: [
      "Each expert independently evaluates the question",
      "Aggregated positions shown without attribution",
      "Experts revise based on anonymous peer perspectives",
      "Check if variance has dropped below convergence threshold",
    ],
    supportsEarlyExit: true,
  },
  verdictFormat: {
    name: "Convergence Report",
    sections: ["Final Consensus Position", "Convergence Trajectory", "Remaining Dissent", "Confidence Distribution", "Recommendation"],
  },
  minimumMode: "balanced",
  themeColor: "#8b5cf6", // violet
};

const PRE_MORTEM_FRAMEWORK: DebateFramework = {
  id: "pre-mortem",
  name: "Pre-mortem Analysis",
  description: "\"Imagine this failed. Why?\" - agents argue from future-failure perspective.",
  longDescription:
    "Based on Gary Klein's Pre-mortem technique. Agents assume the decision has already been made and failed, then work backward to identify why. Three personas - Pessimist (catastrophic failures), Realist (likely failures), and Optimist (what could go right despite risks) - generate failure scenarios, rank them by probability and impact, and propose mitigations. The verdict is a structured risk matrix with a proceed/don't-proceed recommendation.",
  icon: "shield-alert",
  agentCount: 3,
  personaSlots: [
    { slotId: "pessimist", name: "The Pessimist", role: "Catastrophic failure scenarios", color: "#ef4444", emoji: "🔴", basePersona: "critic" },
    { slotId: "realist", name: "The Realist", role: "Likely failure modes & probabilities", color: "#f59e0b", emoji: "🟡", basePersona: "analyst" },
    { slotId: "optimist", name: "The Optimist", role: "Silver linings & mitigations", color: "#22c55e", emoji: "🟢", basePersona: "advocate" },
  ],
  roundStructure: {
    phases: ["Failure Scenarios", "Probability Ranking", "Mitigation Strategies"],
    phaseDescriptions: [
      "Each agent generates specific failure scenarios from their perspective",
      "Agents rank all scenarios by probability and severity",
      "Agents propose concrete mitigations for highest-ranked risks",
    ],
    supportsEarlyExit: false,
  },
  verdictFormat: {
    name: "Risk Matrix",
    sections: ["Risk Matrix", "Top Failure Scenarios", "Mitigation Plan", "Proceed Conditions", "Recommendation"],
  },
  minimumMode: "balanced",
  themeColor: "#ef4444", // red
};

// ---------------------------------------------------------------------------
// Fun Modes — entertaining decision frameworks
// ---------------------------------------------------------------------------

const ROAST_FRAMEWORK: DebateFramework = {
  id: "roast",
  name: "Roast Mode",
  description: "Brutally honest critique followed by genuine defense. No sugarcoating.",
  longDescription:
    "The Roaster tears your idea apart with Gordon Ramsay-level honesty, finding every flaw and weak assumption. Then The Defender steps in to find the genuine merit hiding underneath. The verdict includes a Roast Score (0-100), top burns, and a 'but seriously...' section with real insights.",
  icon: "flame",
  agentCount: 2,
  personaSlots: [
    { slotId: "roaster", name: "The Roaster", role: "Brutal honest critic", color: "#f97316", emoji: "🔥", basePersona: "critic" },
    { slotId: "defender", name: "The Defender", role: "Finds the genuine merit", color: "#22c55e", emoji: "🛡️", basePersona: "advocate" },
  ],
  roundStructure: {
    phases: ["The Roast", "The Defense"],
    phaseDescriptions: [
      "The Roaster delivers a brutally honest critique of the idea",
      "The Defender finds the genuine merit and actionable insights",
    ],
    supportsEarlyExit: false,
  },
  verdictFormat: {
    name: "Roast Verdict",
    sections: ["Roast Score", "Top Burns", "Hidden Strengths", "But Seriously...", "Final Take"],
  },
  minimumMode: "fast",
  themeColor: "#f97316", // orange
};

const DEVILS_ADVOCATE_FRAMEWORK: DebateFramework = {
  id: "devils-advocate",
  name: "Devil's Advocate",
  description: "Relentless opposition that stress-tests your position from every angle.",
  longDescription:
    "An enhanced devil's advocate that systematically attacks your position from multiple angles: logical consistency, hidden assumptions, second-order effects, and historical precedent. Over 3 rounds it escalates from surface-level pushback to deep structural challenges. The verdict rates your position's resilience and lists the vulnerabilities that survived scrutiny.",
  icon: "swords",
  agentCount: 2,
  personaSlots: [
    { slotId: "devil", name: "The Devil", role: "Relentless opposition", color: "#ec4899", emoji: "😈", basePersona: "devil" },
    { slotId: "steel-man", name: "The Steel Man", role: "Strongest form of the argument", color: "#3b82f6", emoji: "🗡️", basePersona: "advocate" },
  ],
  roundStructure: {
    phases: ["Surface Attack", "Deep Challenge", "Steel Man Response"],
    phaseDescriptions: [
      "The Devil attacks obvious weaknesses and assumptions",
      "The Devil escalates to structural and second-order challenges",
      "The Steel Man constructs the strongest possible defense",
    ],
    supportsEarlyExit: false,
  },
  verdictFormat: {
    name: "Resilience Report",
    sections: ["Position Strength", "Vulnerabilities Found", "Survived Challenges", "Watch For", "Final Assessment"],
  },
  minimumMode: "fast",
  themeColor: "#ec4899", // pink
};

const ELI5_FRAMEWORK: DebateFramework = {
  id: "eli5",
  name: "ELI5",
  description: "Explain Like I'm 5. Complex decisions in simple words and analogies.",
  longDescription:
    "The Simplifier breaks down complex decisions into plain language anyone can understand. No jargon, no hedging, no 'it depends.' Uses analogies, everyday comparisons, and clear yes/no/maybe answers. Perfect for getting clarity when you're drowning in complexity.",
  icon: "baby",
  agentCount: 1,
  personaSlots: [
    { slotId: "simplifier", name: "The Simplifier", role: "Makes it dead simple", color: "#06b6d4", emoji: "🧒", basePersona: "analyst" },
  ],
  roundStructure: {
    phases: ["Simplification"],
    phaseDescriptions: [
      "The Simplifier breaks down the decision into plain language with analogies",
    ],
    supportsEarlyExit: false,
  },
  verdictFormat: {
    name: "Simple Answer",
    sections: ["The Simple Answer", "The Analogy", "The One Caveat", "Bottom Line"],
  },
  minimumMode: "fast",
  themeColor: "#06b6d4", // cyan
};

const SHARK_TANK_FRAMEWORK: DebateFramework = {
  id: "shark-tank",
  name: "Shark Tank",
  description: "4 investor sharks evaluate your idea. Will they bite, or are you out?",
  longDescription:
    "Four distinct investor personas evaluate your idea or decision from different angles: Numbers Shark (unit economics and financials), Market Shark (TAM, moat, and timing), Tech Shark (feasibility and scalability), and Skeptic Shark (the toughest questions). Each independently decides 'I'm In' or 'I'm Out' with reasoning. The verdict shows the deal outcome and aggregate valuation range.",
  icon: "fish",
  agentCount: 4,
  personaSlots: [
    { slotId: "numbers-shark", name: "Numbers Shark", role: "Unit economics and financials", color: "#22c55e", emoji: "💰", basePersona: "economist" },
    { slotId: "market-shark", name: "Market Shark", role: "TAM, moat, and timing", color: "#3b82f6", emoji: "🌊", basePersona: "analyst" },
    { slotId: "tech-shark", name: "Tech Shark", role: "Feasibility and scalability", color: "#8b5cf6", emoji: "⚡", basePersona: "engineer" },
    { slotId: "skeptic-shark", name: "Skeptic Shark", role: "The toughest questions", color: "#ef4444", emoji: "🦈", basePersona: "critic" },
  ],
  roundStructure: {
    phases: ["The Pitch Review", "Shark Questions", "Deal or No Deal"],
    phaseDescriptions: [
      "Each shark evaluates the idea from their expertise",
      "Sharks challenge weak points and probe for details",
      "Each shark independently declares In or Out with reasoning",
    ],
    supportsEarlyExit: false,
  },
  verdictFormat: {
    name: "Shark Tank Verdict",
    sections: ["Deal Outcome", "Shark Decisions", "Valuation Range", "Key Concerns", "What Would Change Minds"],
  },
  minimumMode: "balanced",
  themeColor: "#3b82f6", // blue
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/** All built-in frameworks, keyed by ID */
export const FRAMEWORKS: Readonly<Record<BuiltinFrameworkId, DebateFramework>> = Object.freeze({
  "standard": STANDARD_FRAMEWORK,
  "six-thinking-hats": SIX_THINKING_HATS_FRAMEWORK,
  "delphi-method": DELPHI_METHOD_FRAMEWORK,
  "pre-mortem": PRE_MORTEM_FRAMEWORK,
  "roast": ROAST_FRAMEWORK,
  "devils-advocate": DEVILS_ADVOCATE_FRAMEWORK,
  "eli5": ELI5_FRAMEWORK,
  "shark-tank": SHARK_TANK_FRAMEWORK,
});

/** Get a built-in framework by ID, or undefined if not found */
export function getFramework(id: string): DebateFramework | undefined {
  if (isBuiltinFrameworkId(id)) {
    return FRAMEWORKS[id];
  }
  return undefined;
}

/** Get all built-in frameworks as an array */
export function getAllFrameworks(): DebateFramework[] {
  return Object.values(FRAMEWORKS);
}

/** Get all non-standard built-in frameworks (for framework selector UI) */
export function getSpecializedFrameworks(): DebateFramework[] {
  return Object.values(FRAMEWORKS).filter((f) => f.id !== "standard");
}
