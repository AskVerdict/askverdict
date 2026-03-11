// @askverdict/types — Shared type definitions for AskVerdict

// Provider & Model Configuration
export type {
  Provider,
  ModelTier,
  TaskType,
  ModelConfig,
  ProviderKeys,
  ProviderResponse,
  ProviderCallOptions,
  ModelProvider,
  ModelRouting,
  ContextBudgetEntry,
  ContextBudget,
  ConfigPreset,
  ResolvedModelConfig,
  ResolveConfigOptions,
} from "./provider";

// Debate Configuration & Control
export type {
  DebateMode,
  DebateStatus,
  DebateSource,
  PromptStyle,
  RoundTokenLimits,
  ModePreset,
  CostEstimate,
  SearchConfig,
  DebateConfig,
  CreateDebateConfig,
  CreateDebateResult,
  DebateCommandType,
  DebateCommand,
  QuickTakeAgreement,
} from "./debate";

// Agent & Persona
export type {
  PersonaType,
  PersonaConfig,
  AgentInfo,
  AgentSummary,
  AgentState,
} from "./agent";

// Evidence
export type {
  EvidenceSource,
  Evidence,
  KnowledgeEvidence,
} from "./evidence";

// Arguments & Responses
export type {
  ResponseType,
  AgentResponseItem,
  NewArgument,
  AgentResponse,
  Argument,
  CrossExamResponse,
} from "./argument";

// Argument Graph
export type {
  ClaimStatus,
  ClaimType,
  EdgeType,
  Claim,
  ArgumentEdge,
  GraphSnapshot,
  DebateGraph,
} from "./graph";

// Consensus & Convergence
export type {
  ConsensusState,
  RoundMetrics,
  ConsensusRoundEntry,
} from "./consensus";

// Verdict & Decision Matrix
export type {
  VerdictRecommendation,
  DecisionMatrixEntry,
  DecisionMatrix,
  DissentingView,
  VerdictNarrative,
  Verdict,
} from "./verdict";

// Cost Tracking
export type {
  CostRecord,
  ModelUsage,
  DebateCost,
} from "./cost";

// Rounds & Protocol
export type {
  RoundType,
  Round,
  ClaimAssignment,
  ValidationResult,
  ProcessingResult,
  AgentEngagement,
  EngagementMetrics,
} from "./rounds";

// Search
export type {
  SearchQuery,
  SearchResult,
  SearchResponse,
} from "./search";

// Debate Shapes
export type {
  DebateShape,
  ShapeResult,
} from "./shapes";

// Events (SSE streaming)
export type {
  InteractiveDebateStage,
  DebateStartEvent,
  AgentThinkingEvent,
  AgentArgumentEvent,
  AgentErrorEvent,
  AgentSearchEvent,
  GraphUpdateEvent,
  ConsensusCheckEvent,
  VerdictStartEvent,
  VerdictCompleteEvent,
  DebateCompleteEvent,
  DebateErrorEvent,
  DebateCachedEvent,
  StageChangeEvent,
  AgentIntroEvent,
  SynthesisProgressEvent,
  SynthesisNarrativeChunkEvent,
  DebateStatusEvent,
  DebatePausedEvent,
  DebateResumedEvent,
  ModeratorInjectEvent,
  QuestionClarificationEvent,
  MidDebateAnalysisEvent,
  FactCheckEvent,
  ControversyScoreEvent,
  EngineApiCallEvent,
  EngineApiResponseEvent,
  CostUpdateEvent,
  BadgesAwardedEvent,
  ClaimStatusChangedEvent,
  ControversyScoredEvent,
  QuickTakeStartEvent,
  QuickTakeThinkingEvent,
  QuickTakeCompleteEvent,
  QuickTakeAgreementEvent,
  AgentActionEvent,
  AgentThinkingContentEvent,
  DebateEvent,
  DebateEventType,
  DebateEventData,
  StreamEvent,
} from "./events";

// Store/Persistence
export type {
  StoredDebate,
  Checkpoint,
  KnowledgeEntry,
  DebateTranscriptArgument,
  DebateTranscriptRound,
  DebateTranscript,
  KnowledgeQuery,
  KnowledgeStats,
  DeleteDebateOptions,
  DeleteDebateResult,
  StoredEvent,
} from "./store";

// Pricing — runtime constants + types (single source of truth)
export type {
  BillingDebateMode,
  CreditPackType,
  Feature,
  CreditPack,
  PlanConfig,
  PricingFeature,
  PricingTier,
  WorkspacePlanId,
  WorkspacePlan,
  WorkspaceCreditPack,
} from "./pricing";
export {
  DEBATE_CREDIT_COSTS,
  CREDIT_PACKS,
  CREDIT_AMOUNTS,
  STARTER_PLAN,
  PRO_PLAN,
  FREE_TIER,
  BYOK_DEBATE_LIMITS,
  SEAT_LIMITS,
  MONTHLY_CREDITS,
  FEATURE_MATRIX,
  PLAN_CONFIGS,
  PRICING_TIERS,
  FOUNDING_MEMBER,
  WORKSPACE_PLANS,
  WORKSPACE_CREDIT_PACKS,
  AGENT_COUNT_LIMITS,
  getCreditCostForMode,
  getMaxAgents,
  getPlanConfig,
  isPlanAllowed,
  getSeatLimit,
  isFreeTierModeAllowed,
  getWorkspacePlan,
  getMonthlyCredits,
  normalizePlan,
} from "./pricing";

// Auth Preferences
export type PreferredSignIn = "magic_link" | "passkey" | "password";

// User & Billing
export type {
  UserPlan,
  FundingSource,
  CreditTransactionType,
  User,
  UsageStats,
  CreditBalance,
  ApiKey,
} from "./user";

// API Request/Response
export type {
  CreateDebateRequest,
  CreateDebateResponse,
  GetDebateResponse,
  ListDebatesResponse,
  DebateCommandRequest,
  GetUsageResponse,
  HealthResponse,
  ApiError,
  StreamEventWrapper,
} from "./api";

// API Key Configuration (BYOK)
export type {
  ApiKeyConfig,
  PresetInfo,
} from "./api-key";

// Errors
export type {
  ErrorContext,
  VerdictErrorCode,
} from "./errors";

// Sharing
export type {
  ShareSettings,
  PublicDebateView,
} from "./sharing";

// Outcome Tracking
export type {
  OutcomeStatus,
  OutcomeRecord,
  OutcomeFeedback,
  PendingOutcome,
  OutcomeHistoryItem,
} from "./outcome";

// Calibration
export type {
  CalibrationBucket,
  CalibratedProbability,
  CalibratedVerdict,
  PlattParams,
} from "./calibration";

// Decision Score
export type {
  DecisionScore,
  DomainAccuracy,
  AccuracyTrendPoint,
  DomainCategory,
} from "./decision-score";
export { DOMAIN_KEYWORDS } from "./decision-score";

// Decision Chains
export type {
  ChainRelationship,
  ChainNode,
  DecisionChain,
  DecisionChainSummary,
  ChainLinkInput,
  ChainContext,
} from "./decision-chain";

// Feature Flags
export type {
  FeatureFlagKey,
  FeatureFlag,
  UpsertFeatureFlagInput,
} from "./feature-flags";

// Logical Fallacy Detection
export type {
  FallacyDetection,
  FallacyReport,
} from "./fallacy";

// Badge / Reward System
export type {
  BadgeRarity,
  BadgeCategory,
  BadgeDefinition,
  UserBadge,
  BadgesResponse,
} from "./badges";
export {
  BADGE_DEFINITIONS,
  BADGE_MAP,
  BADGE_RARITY_ORDER,
  BADGE_RARITY_LABELS,
} from "./badges";

// Decision Templates
export type {
  TemplateFieldType,
  TemplateCategory,
  TemplateField,
  DecisionTemplate,
} from "./templates";
export {
  BUILTIN_TEMPLATES,
  getTemplate,
  getTemplatesByCategory,
  composeTemplateQuestion,
  validateTemplateFields,
} from "./templates";

// Decision Frameworks
export type {
  BuiltinFrameworkId,
  CustomFrameworkId,
  DebateFrameworkId,
  FrameworkRoundStructure,
  FrameworkPersonaSlot,
  CustomPersonaSlot,
  FrameworkVerdictFormat,
  DebateFramework,
  CustomDebateFramework,
} from "./frameworks";
export {
  FRAMEWORKS,
  getFramework,
  getAllFrameworks,
  getSpecializedFrameworks,
  isCustomFrameworkId,
  isBuiltinFrameworkId,
} from "./frameworks";

// Decision Categories
export type { DecisionCategory } from "./categories";
export {
  DECISION_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CATEGORY_KEYWORDS,
} from "./categories";

// Bias Detection
export type { BiasType, BiasDetection, BiasProfile } from "./bias";

// Action Items (V2-C.1)
export type {
  ActionItemPriority,
  ActionItemCategory,
  ActionItemLink,
  ActionItem,
  ActionItemsData,
} from "./action-items";

// Platform-agnostic Verdict Card Renderers
export type {
  VerdictCardData,
  SlackBlock,
  DiscordEmbed,
  VerdictCardFormat,
} from "./renderers";
export {
  renderSlackBlocks,
  renderTeamsAdaptiveCard,
  renderDiscordEmbed,
  renderHtml,
  renderMarkdown,
  renderVerdictCard,
} from "./renderers";
