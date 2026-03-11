# @askverdict/types

Shared TypeScript types, constants, and helpers for the AskVerdict AI ecosystem.

## Install

```bash
pnpm add @askverdict/types
```

## Usage

```typescript
import type { Verdict, DebateMode, CreateDebateConfig } from '@askverdict/types';
import { getCreditCostForMode, getPlanConfig } from '@askverdict/types';
```

## Type Categories

- **Debate** - DebateMode, DebateStatus, DebateConfig, CreateDebateConfig, CreateDebateResult
- **Verdict** - Verdict, VerdictRecommendation, DecisionMatrix, DissentingView, VerdictNarrative
- **Agent** - PersonaType, PersonaConfig, AgentInfo, AgentState, AgentSummary
- **Evidence** - Evidence, EvidenceSource, KnowledgeEvidence
- **Graph** - Claim, ClaimType, ArgumentEdge, DebateGraph, GraphSnapshot
- **Events** - DebateStartEvent, AgentThinkingEvent, AgentArgumentEvent, VerdictCompleteEvent, and 15+ more SSE event types
- **Pricing** - PlanConfig, PricingTier, CreditPack, BillingDebateMode, WorkspacePlan
- **User** - User, UserPlan, UsageStats, CreditBalance, ApiKey
- **Outcomes** - OutcomeRecord, OutcomeStatus, OutcomeFeedback
- **Decision Intelligence** - DecisionScore, DomainAccuracy, CalibrationBucket, DecisionChain
- **Frameworks** - DebateFramework, CustomDebateFramework, FrameworkRoundStructure
- **Templates** - DecisionTemplate, TemplateField, TemplateCategory
- **Badges** - BadgeDefinition, UserBadge, BadgeRarity, BadgeCategory
- **Renderers** - VerdictCardData, renderSlackBlocks, renderDiscordEmbed, renderMarkdown, renderHtml
- **API** - CreateDebateRequest, CreateDebateResponse, HealthResponse, ApiError

## Runtime Constants

```typescript
import {
  DEBATE_CREDIT_COSTS,
  CREDIT_PACKS,
  PRO_PLAN,
  FREE_TIER,
  PLAN_CONFIGS,
  PRICING_TIERS,
  BADGE_DEFINITIONS,
  FRAMEWORKS,
  DECISION_CATEGORIES,
} from '@askverdict/types';
```

## Helper Functions

```typescript
import {
  getCreditCostForMode,
  getMaxAgents,
  getPlanConfig,
  isPlanAllowed,
  getWorkspacePlan,
  getTemplate,
  getTemplatesByCategory,
  composeTemplateQuestion,
  getFramework,
  getAllFrameworks,
  renderVerdictCard,
} from '@askverdict/types';
```

## License

MIT
