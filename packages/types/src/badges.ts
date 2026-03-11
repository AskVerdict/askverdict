// ---------------------------------------------------------------------------
// Badge / Reward System Types
// ---------------------------------------------------------------------------

export type BadgeRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type BadgeCategory =
  | "milestone"
  | "analytical"
  | "social"
  | "dedication"
  | "speed"
  | "special";

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  /** Shown when locked — what the user needs to do */
  unlockHint: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  /** Lucide icon name */
  icon: string;
  /** Tailwind gradient classes e.g. "from-amber-400 to-yellow-600" */
  gradient: string;
  /** Shadow glow color for CSS filter */
  glowColor: string;
}

export interface UserBadge {
  badgeId: string;
  unlockedAt: string; // ISO date
  /** Contextual metadata, e.g. { debateCount: 10 } */
  metadata?: Record<string, unknown>;
}

export interface BadgesResponse {
  earned: UserBadge[];
  total: number;
}

// ---------------------------------------------------------------------------
// Badge definitions — single source of truth
// ---------------------------------------------------------------------------

export const BADGE_DEFINITIONS: BadgeDefinition[] = [

  // ── MILESTONE ────────────────────────────────────────────────────────────
  {
    id: "first_verdict",
    name: "The First Ruling",
    description: "You brought a question before the council — and received your first verdict.",
    unlockHint: "Complete your very first debate",
    category: "milestone",
    rarity: "common",
    icon: "Gavel",
    gradient: "from-slate-400 to-slate-600",
    glowColor: "rgba(148,163,184,0.4)",
  },
  {
    id: "debate_10",
    name: "Ten Truths",
    description: "A decade of debates behind you. The search for truth has begun.",
    unlockHint: "Complete 10 debates",
    category: "milestone",
    rarity: "common",
    icon: "Flame",
    gradient: "from-orange-400 to-red-500",
    glowColor: "rgba(251,146,60,0.4)",
  },
  {
    id: "debate_25",
    name: "The Silver Tongue",
    description: "Twenty-five questions answered. Your mind is a finely honed instrument.",
    unlockHint: "Complete 25 debates",
    category: "milestone",
    rarity: "uncommon",
    icon: "Trophy",
    gradient: "from-emerald-400 to-teal-600",
    glowColor: "rgba(52,211,153,0.4)",
  },
  {
    id: "debate_50",
    name: "The Half-Century",
    description: "Fifty debates. You have crossed the threshold from seeker to sage.",
    unlockHint: "Complete 50 debates",
    category: "milestone",
    rarity: "rare",
    icon: "Milestone",
    gradient: "from-sky-400 to-blue-600",
    glowColor: "rgba(56,189,248,0.5)",
  },
  {
    id: "debate_100",
    name: "The Centurion",
    description: "One hundred debates. You command the field of ideas like a Roman general.",
    unlockHint: "Complete 100 debates",
    category: "milestone",
    rarity: "rare",
    icon: "Medal",
    gradient: "from-blue-400 to-indigo-600",
    glowColor: "rgba(96,165,250,0.4)",
  },
  {
    id: "debate_250",
    name: "The Arbiter",
    description: "Two hundred and fifty verdicts. Nations would seek your counsel.",
    unlockHint: "Complete 250 debates",
    category: "milestone",
    rarity: "epic",
    icon: "Scale",
    gradient: "from-violet-400 to-purple-700",
    glowColor: "rgba(139,92,246,0.6)",
  },
  {
    id: "debate_500",
    name: "Vox Perpetua",
    description: "500 debates. The eternal voice. Your record shall outlast empires.",
    unlockHint: "Complete 500 debates",
    category: "milestone",
    rarity: "legendary",
    icon: "Star",
    gradient: "from-amber-300 via-yellow-400 to-amber-500",
    glowColor: "rgba(232,163,23,0.6)",
  },
  {
    id: "compare_first",
    name: "The Examiner",
    description: "You laid the options before the court and demanded a true comparison.",
    unlockHint: "Run your first Verdict Compare debate",
    category: "milestone",
    rarity: "common",
    icon: "GitCompare",
    gradient: "from-violet-400 to-purple-600",
    glowColor: "rgba(167,139,250,0.4)",
  },

  // ── ANALYTICAL ───────────────────────────────────────────────────────────
  {
    id: "balanced_mode_10",
    name: "The Moderate",
    description: "Ten balanced deliberations. You walk the path between extremes.",
    unlockHint: "Run 10 debates in Balanced mode",
    category: "analytical",
    rarity: "common",
    icon: "BalanceIcon",
    gradient: "from-teal-400 to-emerald-600",
    glowColor: "rgba(45,212,191,0.4)",
  },
  {
    id: "thorough_mode_5",
    name: "The Inquisitor",
    description: "Five thorough examinations. No stone left unturned, no argument unheard.",
    unlockHint: "Run 5 debates in Thorough mode",
    category: "analytical",
    rarity: "uncommon",
    icon: "Brain",
    gradient: "from-cyan-400 to-blue-600",
    glowColor: "rgba(34,211,238,0.4)",
  },
  {
    id: "fallacy_spotter",
    name: "The Logician",
    description: "You have exposed ten fallacies. Logic bows to no sophist under your watch.",
    unlockHint: "Detect 10 logical fallacies",
    category: "analytical",
    rarity: "uncommon",
    icon: "AlertTriangle",
    gradient: "from-yellow-400 to-orange-500",
    glowColor: "rgba(251,191,36,0.4)",
  },
  {
    id: "thorough_mode_25",
    name: "Grand Inquisitor",
    description: "Twenty-five deep analyses. Your thoroughness is without equal in the realm.",
    unlockHint: "Run 25 debates in Thorough mode",
    category: "analytical",
    rarity: "rare",
    icon: "BookOpen",
    gradient: "from-blue-500 to-cyan-700",
    glowColor: "rgba(59,130,246,0.5)",
  },
  {
    id: "decision_matrix",
    name: "The Strategist",
    description: "The decision matrix — a war table of the mind. You've mastered it five times.",
    unlockHint: "Use decision matrix 5 times",
    category: "analytical",
    rarity: "rare",
    icon: "LayoutGrid",
    gradient: "from-pink-400 to-rose-600",
    glowColor: "rgba(244,114,182,0.4)",
  },
  {
    id: "compare_5",
    name: "The Dialectician",
    description: "Five multi-option verdicts. Plato himself would debate at your table.",
    unlockHint: "Run 5 Verdict Compare debates",
    category: "analytical",
    rarity: "rare",
    icon: "Layers",
    gradient: "from-violet-500 to-indigo-600",
    glowColor: "rgba(139,92,246,0.4)",
  },
  {
    id: "fallacy_master",
    name: "Sophist Slayer",
    description: "Fifty fallacies exposed. Rhetoric crumbles before your reasoning.",
    unlockHint: "Detect 50 logical fallacies",
    category: "analytical",
    rarity: "epic",
    icon: "ShieldAlert",
    gradient: "from-red-400 to-rose-700",
    glowColor: "rgba(248,113,113,0.6)",
  },

  // ── SOCIAL ───────────────────────────────────────────────────────────────
  {
    id: "public_profile",
    name: "The Open Scroll",
    description: "You opened your record to the world. Transparency is the mark of the just.",
    unlockHint: "Set your profile to public",
    category: "social",
    rarity: "common",
    icon: "Globe",
    gradient: "from-green-400 to-emerald-500",
    glowColor: "rgba(74,222,128,0.4)",
  },
  {
    id: "share_first",
    name: "The Herald",
    description: "You carried your verdict into the public square for all to witness.",
    unlockHint: "Share your first debate",
    category: "social",
    rarity: "common",
    icon: "Share2",
    gradient: "from-sky-400 to-blue-500",
    glowColor: "rgba(56,189,248,0.4)",
  },
  {
    id: "vote_10",
    name: "The Juror",
    description: "Ten votes cast. You have taken your seat on the bench of judgment.",
    unlockHint: "Vote on 10 arguments",
    category: "social",
    rarity: "uncommon",
    icon: "ThumbsUp",
    gradient: "from-blue-400 to-cyan-500",
    glowColor: "rgba(96,165,250,0.4)",
  },
  {
    id: "share_10",
    name: "Town Crier",
    description: "Ten debates shared. Your voice echoes through the digital streets.",
    unlockHint: "Share 10 debates",
    category: "social",
    rarity: "uncommon",
    icon: "Megaphone",
    gradient: "from-orange-400 to-amber-500",
    glowColor: "rgba(251,146,60,0.4)",
  },
  {
    id: "vote_50",
    name: "The Senate",
    description: "Fifty votes. You hold the power of the assembled council in your hands.",
    unlockHint: "Vote on 50 arguments",
    category: "social",
    rarity: "rare",
    icon: "Users",
    gradient: "from-indigo-400 to-blue-600",
    glowColor: "rgba(99,102,241,0.5)",
  },
  {
    id: "debate_viewed_100",
    name: "The Orator",
    description: "One hundred eyes upon your verdict. The crowd has gathered to listen.",
    unlockHint: "Get 100 views on a shared debate",
    category: "social",
    rarity: "epic",
    icon: "TrendingUp",
    gradient: "from-fuchsia-400 to-purple-600",
    glowColor: "rgba(232,121,249,0.4)",
  },

  // ── DEDICATION ───────────────────────────────────────────────────────────
  {
    id: "streak_3",
    name: "Ablaze",
    description: "Three days of fire. The flame of inquiry burns bright within you.",
    unlockHint: "Debate 3 consecutive days",
    category: "dedication",
    rarity: "common",
    icon: "Zap",
    gradient: "from-yellow-400 to-amber-500",
    glowColor: "rgba(250,204,21,0.4)",
  },
  {
    id: "streak_7",
    name: "The Unbroken",
    description: "Seven days unbroken. Your discipline is the foundation of all wisdom.",
    unlockHint: "Debate 7 consecutive days",
    category: "dedication",
    rarity: "uncommon",
    icon: "CalendarCheck",
    gradient: "from-orange-400 to-red-500",
    glowColor: "rgba(251,146,60,0.4)",
  },
  {
    id: "streak_14",
    name: "Fortnight's Fire",
    description: "A fortnight of daily debate. Consistency is the rarest of virtues.",
    unlockHint: "Debate 14 consecutive days",
    category: "dedication",
    rarity: "rare",
    icon: "Flame",
    gradient: "from-red-400 to-orange-600",
    glowColor: "rgba(248,113,113,0.5)",
  },
  {
    id: "streak_30",
    name: "The Eternal Flame",
    description: "Thirty days. The flame that never dies. A legend forged in consistency.",
    unlockHint: "Debate 30 consecutive days",
    category: "dedication",
    rarity: "legendary",
    icon: "Infinity",
    gradient: "from-amber-300 via-yellow-400 to-amber-500",
    glowColor: "rgba(232,163,23,0.6)",
  },
  {
    id: "night_owl",
    name: "Midnight Counsel",
    description: "When the world sleeps, you deliberate. The night holds no secrets from you.",
    unlockHint: "Run a debate between midnight and 5am",
    category: "dedication",
    rarity: "uncommon",
    icon: "Moon",
    gradient: "from-indigo-500 to-violet-700",
    glowColor: "rgba(99,102,241,0.4)",
  },
  {
    id: "early_riser",
    name: "The Dawn Jury",
    description: "You deliberate at dawn, before the world stirs. Clarity comes to the early.",
    unlockHint: "Run a debate before 6am",
    category: "dedication",
    rarity: "uncommon",
    icon: "Sunrise",
    gradient: "from-amber-300 to-orange-400",
    glowColor: "rgba(252,211,77,0.4)",
  },
  {
    id: "veteran",
    name: "The Old Guard",
    description: "Ninety days on the field. A veteran commands respect without asking for it.",
    unlockHint: "Be active for 90 days",
    category: "dedication",
    rarity: "rare",
    icon: "Shield",
    gradient: "from-slate-500 to-gray-700",
    glowColor: "rgba(100,116,139,0.4)",
  },

  // ── SPEED ────────────────────────────────────────────────────────────────
  {
    id: "fast_mode_3",
    name: "The Swift",
    description: "Fast, decisive, razor-sharp. Three verdicts at the speed of thought.",
    unlockHint: "Run 3 Fast mode debates",
    category: "speed",
    rarity: "common",
    icon: "Zap",
    gradient: "from-yellow-300 to-amber-400",
    glowColor: "rgba(253,224,71,0.4)",
  },
  {
    id: "fast_mode_20",
    name: "Thunderstrike",
    description: "Twenty fast verdicts. You think like lightning and strike like thunder.",
    unlockHint: "Run 20 Fast mode debates",
    category: "speed",
    rarity: "rare",
    icon: "Rocket",
    gradient: "from-amber-400 to-orange-600",
    glowColor: "rgba(251,146,60,0.5)",
  },
  {
    id: "fast_mode_50",
    name: "The Blitz",
    description: "Fifty fast debates. Your mind outpaces the speed of sound.",
    unlockHint: "Run 50 Fast mode debates",
    category: "speed",
    rarity: "epic",
    icon: "Wind",
    gradient: "from-sky-400 to-cyan-600",
    glowColor: "rgba(56,189,248,0.6)",
  },
  {
    id: "byok_activated",
    name: "The Keyholder",
    description: "You wield your own keys to the kingdom of AI. None can restrict your reach.",
    unlockHint: "Activate BYOK plan",
    category: "speed",
    rarity: "uncommon",
    icon: "Key",
    gradient: "from-emerald-400 to-green-600",
    glowColor: "rgba(52,211,153,0.4)",
  },
  {
    id: "api_power_user",
    name: "The Architect",
    description: "You built upon the platform itself. The API is your drafting table.",
    unlockHint: "Create 3 API keys",
    category: "speed",
    rarity: "rare",
    icon: "Code2",
    gradient: "from-violet-400 to-blue-600",
    glowColor: "rgba(139,92,246,0.5)",
  },

  // ── SPECIAL ──────────────────────────────────────────────────────────────
  {
    id: "profile_complete",
    name: "The Known One",
    description: "Your name, your words, your place — all recorded in the annals.",
    unlockHint: "Complete your profile (name, bio, location)",
    category: "special",
    rarity: "common",
    icon: "UserCheck",
    gradient: "from-sky-400 to-indigo-500",
    glowColor: "rgba(56,189,248,0.4)",
  },
  {
    id: "upgrade_pro",
    name: "The Patron",
    description: "You believed in the cause and invested in it. A true patron of the verdicts.",
    unlockHint: "Upgrade to Starter, Pro, or BYOK",
    category: "special",
    rarity: "rare",
    icon: "BadgeCheck",
    gradient: "from-violet-400 to-purple-600",
    glowColor: "rgba(167,139,250,0.5)",
  },
  {
    id: "night_debate_won",
    name: "The Devil's Advocate",
    description: "You dared to challenge the obvious — and emerged with clarity.",
    unlockHint: "Run a debate that flips conventional wisdom",
    category: "special",
    rarity: "epic",
    icon: "Swords",
    gradient: "from-red-400 to-rose-600",
    glowColor: "rgba(248,113,113,0.5)",
  },
  {
    id: "template_creator",
    name: "The Scribe",
    description: "You authored a template for others to follow. A contribution to the archive.",
    unlockHint: "Create a debate template",
    category: "special",
    rarity: "uncommon",
    icon: "FileText",
    gradient: "from-stone-400 to-amber-600",
    glowColor: "rgba(168,162,158,0.4)",
  },
  {
    id: "webhook_user",
    name: "The Integrationist",
    description: "You connected AskVerdict to your world. The web of knowledge grows.",
    unlockHint: "Set up a webhook integration",
    category: "special",
    rarity: "uncommon",
    icon: "Link",
    gradient: "from-teal-400 to-cyan-600",
    glowColor: "rgba(45,212,191,0.4)",
  },
  {
    id: "founding_member",
    name: "The Founder",
    description: "Among the first hundred who shaped this court. Your name is in the stone.",
    unlockHint: "Claim the founding member offer",
    category: "special",
    rarity: "epic",
    icon: "Crown",
    gradient: "from-yellow-400 via-amber-400 to-orange-400",
    glowColor: "rgba(251,191,36,0.6)",
  },
  {
    id: "beta_pioneer",
    name: "The Pioneer",
    description: "You walked the untamed frontier when AskVerdict was still raw and wild.",
    unlockHint: "Join during the private beta",
    category: "special",
    rarity: "legendary",
    icon: "FlaskConical",
    gradient: "from-amber-300 via-yellow-400 to-amber-500",
    glowColor: "rgba(232,163,23,0.7)",
  },
];

/** Quick lookup map by id */
export const BADGE_MAP: Record<string, BadgeDefinition> = Object.fromEntries(
  BADGE_DEFINITIONS.map((b) => [b.id, b])
);

export const BADGE_RARITY_ORDER: BadgeRarity[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
];

export const BADGE_RARITY_LABELS: Record<BadgeRarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};
