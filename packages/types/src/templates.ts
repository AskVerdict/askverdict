// Decision Templates — structured business decision templates

/** Field types available in template input forms */
export type TemplateFieldType =
  | "text"
  | "number"
  | "select"
  | "multiselect"
  | "textarea";

/** Category groupings for template picker */
export type TemplateCategory =
  | "business"
  | "technology"
  | "career"
  | "investment";

/** A single input field in a template form */
export interface TemplateField {
  name: string;
  label: string;
  type: TemplateFieldType;
  required: boolean;
  placeholder: string;
  options?: string[];
  description?: string;
}

/** A complete decision template definition */
export interface DecisionTemplate {
  slug: string;
  name: string;
  category: TemplateCategory;
  description: string;
  icon: string;
  fields: TemplateField[];
  promptTemplate: string;
  recommendedMode: "fast" | "balanced" | "thorough";
  /** Suggested decision framework for this template (D.5 — Framework-Template Linking) */
  suggestedFramework?: import("./frameworks").DebateFrameworkId;
}

// ============================================================================
// BUILT-IN TEMPLATES
// ============================================================================

const VENDOR_SELECTION: DecisionTemplate = {
  slug: "vendor-selection",
  name: "Vendor Selection",
  category: "business",
  description: "Compare vendors, tools, or service providers against your requirements",
  icon: "scale",
  fields: [
    { name: "category", label: "Category", type: "text", required: true, placeholder: "e.g., Cloud hosting, CRM, Analytics" },
    { name: "options", label: "Options to Compare", type: "textarea", required: true, placeholder: "e.g., AWS vs GCP vs Azure" },
    { name: "budget", label: "Budget", type: "text", required: true, placeholder: "e.g., $50,000/year" },
    { name: "requirements", label: "Key Requirements", type: "textarea", required: true, placeholder: "e.g., SOC2 compliance, <100ms latency, API-first" },
    { name: "timeline", label: "Decision Timeline", type: "text", required: false, placeholder: "e.g., Q2 2026" },
    { name: "teamSize", label: "Team Size", type: "number", required: false, placeholder: "e.g., 15" },
  ],
  promptTemplate: `Evaluate this vendor selection decision:

## Decision Context
Category: {{category}}
Options: {{options}}
Budget: {{budget}}
Key Requirements: {{requirements}}
{{#timeline}}Timeline: {{timeline}}{{/timeline}}
{{#teamSize}}Team Size: {{teamSize}}{{/teamSize}}

Compare each option against the stated requirements. Score them on cost, capability, reliability, and fit. Identify deal-breakers and hidden costs.`,
  recommendedMode: "balanced",
  suggestedFramework: "six-thinking-hats",
};

const BUILD_VS_BUY: DecisionTemplate = {
  slug: "build-vs-buy",
  name: "Build vs Buy",
  category: "technology",
  description: "Decide whether to build in-house or purchase an existing solution",
  icon: "hammer",
  fields: [
    { name: "feature", label: "Feature / Capability", type: "text", required: true, placeholder: "e.g., Payment processing system" },
    { name: "internalCapacity", label: "Internal Capacity", type: "textarea", required: true, placeholder: "e.g., 3 senior engineers, 6 months availability" },
    { name: "budget", label: "Budget", type: "text", required: true, placeholder: "e.g., $100,000 initial + $20,000/year maintenance" },
    { name: "timeline", label: "Timeline", type: "text", required: true, placeholder: "e.g., Must ship by Q3 2026" },
    { name: "maintenanceBudget", label: "Ongoing Maintenance Budget", type: "text", required: false, placeholder: "e.g., $2,000/month" },
  ],
  promptTemplate: `Evaluate this build vs buy decision:

## Decision Context
Feature: {{feature}}
Internal Capacity: {{internalCapacity}}
Budget: {{budget}}
Timeline: {{timeline}}
{{#maintenanceBudget}}Maintenance Budget: {{maintenanceBudget}}{{/maintenanceBudget}}

Analyze total cost of ownership for both paths. Consider development time, maintenance burden, vendor lock-in, customization needs, and opportunity cost of engineering time.`,
  recommendedMode: "balanced",
  suggestedFramework: "six-thinking-hats",
};

const HIRE_VS_CONTRACT: DecisionTemplate = {
  slug: "hire-vs-contract",
  name: "Hire vs Contract",
  category: "career",
  description: "Decide between hiring full-time or engaging contractors",
  icon: "users",
  fields: [
    { name: "role", label: "Role", type: "text", required: true, placeholder: "e.g., Senior Backend Engineer" },
    { name: "duration", label: "Expected Duration", type: "text", required: true, placeholder: "e.g., 12+ months ongoing" },
    { name: "budget", label: "Budget", type: "text", required: true, placeholder: "e.g., $150,000/year fully loaded" },
    { name: "skills", label: "Required Skills", type: "textarea", required: true, placeholder: "e.g., Rust, distributed systems, AWS" },
    { name: "urgency", label: "Urgency", type: "select", required: true, placeholder: "Select urgency", options: ["Low — can wait 3+ months", "Medium — need within 1-2 months", "High — need within weeks", "Critical — need immediately"] },
  ],
  promptTemplate: `Evaluate this staffing decision:

## Decision Context
Role: {{role}}
Duration: {{duration}}
Budget: {{budget}}
Required Skills: {{skills}}
Urgency: {{urgency}}

Compare full-time hire vs contractor engagement. Factor in ramp-up time, IP ownership, team culture, knowledge retention, total cost, and market availability for the required skills.`,
  recommendedMode: "balanced",
  suggestedFramework: "delphi-method",
};

const GO_NO_GO: DecisionTemplate = {
  slug: "go-no-go",
  name: "Go / No-Go",
  category: "business",
  description: "Decide whether to proceed with a project, launch, or initiative",
  icon: "rocket",
  fields: [
    { name: "projectName", label: "Project Name", type: "text", required: true, placeholder: "e.g., Mobile App V2 Launch" },
    { name: "risks", label: "Known Risks", type: "textarea", required: true, placeholder: "e.g., Untested payment flow, 2 open P1 bugs, holiday season timing" },
    { name: "budget", label: "Budget at Stake", type: "text", required: true, placeholder: "e.g., $200,000 spent, $50,000 remaining" },
    { name: "marketCondition", label: "Market Conditions", type: "textarea", required: false, placeholder: "e.g., Competitor launching similar product in Q1" },
    { name: "readinessScore", label: "Self-Assessed Readiness (1-10)", type: "number", required: false, placeholder: "e.g., 7" },
  ],
  promptTemplate: `Evaluate this go/no-go decision:

## Decision Context
Project: {{projectName}}
Known Risks: {{risks}}
Budget at Stake: {{budget}}
{{#marketCondition}}Market Conditions: {{marketCondition}}{{/marketCondition}}
{{#readinessScore}}Self-Assessed Readiness: {{readinessScore}}/10{{/readinessScore}}

Assess readiness across key dimensions: technical, market, financial, and operational. Identify blockers vs acceptable risks. Recommend go, no-go, or conditional go with specific conditions.`,
  recommendedMode: "thorough",
  suggestedFramework: "pre-mortem",
};

const INVESTMENT_THESIS: DecisionTemplate = {
  slug: "investment-thesis",
  name: "Investment Thesis",
  category: "investment",
  description: "Evaluate an investment opportunity with structured analysis",
  icon: "trending-up",
  fields: [
    { name: "asset", label: "Asset / Opportunity", type: "text", required: true, placeholder: "e.g., Series A in FinTech startup" },
    { name: "amount", label: "Investment Amount", type: "text", required: true, placeholder: "e.g., $25,000" },
    { name: "timeHorizon", label: "Time Horizon", type: "select", required: true, placeholder: "Select horizon", options: ["Short-term (< 1 year)", "Medium-term (1-3 years)", "Long-term (3-10 years)", "Very long-term (10+ years)"] },
    { name: "riskTolerance", label: "Risk Tolerance", type: "select", required: true, placeholder: "Select tolerance", options: ["Conservative", "Moderate", "Aggressive", "Very Aggressive"] },
    { name: "thesis", label: "Your Investment Thesis", type: "textarea", required: true, placeholder: "e.g., AI will transform healthcare billing, this company has best-in-class NLP..." },
  ],
  promptTemplate: `Evaluate this investment thesis:

## Decision Context
Asset: {{asset}}
Amount: {{amount}}
Time Horizon: {{timeHorizon}}
Risk Tolerance: {{riskTolerance}}
Thesis: {{thesis}}

Stress-test the thesis from multiple angles. Identify bull and bear cases, key assumptions that must hold, comparable investments, and specific metrics to monitor. Challenge the thesis rigorously.`,
  recommendedMode: "thorough",
  suggestedFramework: "pre-mortem",
};

const TECH_STACK: DecisionTemplate = {
  slug: "tech-stack",
  name: "Tech Stack Decision",
  category: "technology",
  description: "Choose the right technology stack for your project",
  icon: "layers",
  fields: [
    { name: "useCase", label: "Use Case", type: "textarea", required: true, placeholder: "e.g., Real-time collaborative document editor" },
    { name: "scale", label: "Expected Scale", type: "text", required: true, placeholder: "e.g., 10K DAU, 1M documents, <200ms P99" },
    { name: "teamExpertise", label: "Team Expertise", type: "textarea", required: true, placeholder: "e.g., Strong in TypeScript/React, some Go experience, no Rust" },
    { name: "constraints", label: "Constraints", type: "textarea", required: false, placeholder: "e.g., Must run on AWS, HIPAA compliance, max $5K/month infra" },
    { name: "budget", label: "Development Budget", type: "text", required: false, placeholder: "e.g., $300,000 for MVP" },
  ],
  promptTemplate: `Evaluate this technology stack decision:

## Decision Context
Use Case: {{useCase}}
Expected Scale: {{scale}}
Team Expertise: {{teamExpertise}}
{{#constraints}}Constraints: {{constraints}}{{/constraints}}
{{#budget}}Development Budget: {{budget}}{{/budget}}

Recommend a tech stack considering team strengths, scale requirements, ecosystem maturity, hiring market, and long-term maintenance. Compare 2-3 viable stacks with concrete trade-offs.`,
  recommendedMode: "balanced",
  suggestedFramework: "delphi-method",
};

/**
 * Maximum length (in characters) for a composed template question.
 * If the result exceeds this limit it is truncated at the last complete
 * sentence boundary before the limit.
 */
export const MAX_COMPOSED_QUESTION_LENGTH = 4000;

// ============================================================================
// EXPORTS
// ============================================================================

export const BUILTIN_TEMPLATES: Readonly<Record<string, DecisionTemplate>> = Object.freeze({
  "vendor-selection": VENDOR_SELECTION,
  "build-vs-buy": BUILD_VS_BUY,
  "hire-vs-contract": HIRE_VS_CONTRACT,
  "go-no-go": GO_NO_GO,
  "investment-thesis": INVESTMENT_THESIS,
  "tech-stack": TECH_STACK,
});

/** Get a template by slug, or undefined if not found */
export function getTemplate(slug: string): DecisionTemplate | undefined {
  return BUILTIN_TEMPLATES[slug];
}

/** Get all templates as an array, optionally filtered by category */
export function getTemplatesByCategory(category?: TemplateCategory): DecisionTemplate[] {
  const all = Object.values(BUILTIN_TEMPLATES);
  if (!category) return all;
  return all.filter((t) => t.category === category);
}

/**
 * Compose a debate question from a template and user-provided field values.
 * Uses simple mustache-like substitution: {{field}} for required,
 * {{#field}}...{{/field}} blocks for optional fields (omitted if empty).
 */
export function composeTemplateQuestion(
  template: DecisionTemplate,
  fields: Record<string, string | number | string[]>,
): string {
  let prompt = template.promptTemplate;

  // Replace simple {{field}} placeholders
  for (const field of template.fields) {
    const value = fields[field.name];
    const stringValue = Array.isArray(value) ? value.join(", ") : String(value ?? "");
    prompt = prompt.replaceAll(`{{${field.name}}}`, stringValue);
  }

  // Handle conditional blocks {{#field}}...{{/field}}
  for (const field of template.fields) {
    const value = fields[field.name];
    // Treat undefined, null, empty string, AND empty arrays as "no value"
    const hasValue =
      value !== undefined &&
      value !== null &&
      value !== "" &&
      !(Array.isArray(value) && value.length === 0);
    const blockRegex = new RegExp(`\\{\\{#${field.name}\\}\\}([\\s\\S]*?)\\{\\{/${field.name}\\}\\}`, "g");

    if (hasValue) {
      // Keep block content, substitute field value within
      const stringValue = Array.isArray(value) ? value.join(", ") : String(value);
      prompt = prompt.replace(blockRegex, (_match, content: string) => {
        return content.replaceAll(`{{${field.name}}}`, stringValue);
      });
    } else {
      // Remove entire block
      prompt = prompt.replace(blockRegex, "");
    }
  }

  // Clean up blank lines from removed blocks
  prompt = prompt.replace(/\n{3,}/g, "\n\n").trim();

  // Enforce maximum length — truncate at the last sentence boundary before the limit
  if (prompt.length > MAX_COMPOSED_QUESTION_LENGTH) {
    const truncated = prompt.slice(0, MAX_COMPOSED_QUESTION_LENGTH);
    // Find the last sentence-ending punctuation followed by whitespace or end
    const lastSentence = truncated.search(/[.!?][^.!?]*$/);
    prompt = lastSentence > 0 ? truncated.slice(0, lastSentence + 1) : truncated;
  }

  return prompt;
}

/**
 * Validate that all required fields for a template are provided.
 * Returns array of missing field names, or empty array if valid.
 */
export function validateTemplateFields(
  template: DecisionTemplate,
  fields: Record<string, unknown>,
): string[] {
  const missing: string[] = [];
  for (const field of template.fields) {
    if (!field.required) continue;
    const value = fields[field.name];
    if (value === undefined || value === null || value === "") {
      missing.push(field.name);
    }
  }
  return missing;
}
