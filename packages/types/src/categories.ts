// Decision Category — the 7 user-facing categories for debate classification

export const DECISION_CATEGORIES = [
  "technology",
  "business",
  "financial",
  "career",
  "health",
  "personal",
  "creative",
] as const;

export type DecisionCategory = (typeof DECISION_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<DecisionCategory, string> = {
  technology: "Technology",
  business: "Business",
  financial: "Financial",
  career: "Career",
  health: "Health",
  personal: "Personal",
  creative: "Creative",
};

export const CATEGORY_COLORS: Record<DecisionCategory, string> = {
  technology: "blue",
  business: "purple",
  financial: "green",
  career: "orange",
  health: "red",
  personal: "pink",
  creative: "yellow",
};

/**
 * Keywords used for local (non-LLM) category classification fallback.
 * Ordered by signal strength — more specific terms first.
 */
export const CATEGORY_KEYWORDS: Record<DecisionCategory, string[]> = {
  technology: [
    "database", "api", "framework", "language", "deploy", "architecture",
    "code", "software", "server", "cloud", "app", "frontend", "backend",
    "devops", "microservice", "kubernetes", "docker", "typescript", "javascript",
    "python", "react", "vue", "angular", "saas",
  ],
  business: [
    "revenue", "pricing", "market", "startup", "hire", "team", "company",
    "sales", "customer", "growth", "product", "strategy", "launch", "b2b",
    "enterprise", "partnership", "acquisition", "pivot", "mvp",
  ],
  financial: [
    "invest", "portfolio", "budget", "savings", "loan", "mortgage", "stock",
    "crypto", "retirement", "equity", "fund", "tax", "income", "spend",
    "debt", "credit", "money", "cash", "dividend", "returns",
  ],
  career: [
    "job", "promotion", "salary", "role", "interview", "resume", "freelance",
    "remote", "offer", "manager", "employer", "employee", "work", "career",
    "profession", "skill", "negotiate", "quit", "leave",
  ],
  health: [
    "treatment", "symptom", "medical", "therapy", "diagnosis", "health",
    "doctor", "patient", "medicine", "diet", "exercise", "fitness", "wellness",
    "mental", "sleep", "supplement", "surgery", "hospital",
  ],
  personal: [
    "relationship", "move", "life", "family", "school", "education",
    "college", "university", "degree", "decision", "choice", "should",
    "advice", "friend", "marriage", "divorce", "parenting", "travel",
  ],
  creative: [
    "design", "art", "music", "write", "story", "brand", "logo", "color",
    "font", "photography", "video", "content", "creative", "aesthetic",
    "style", "craft", "visual", "narrative", "portfolio",
  ],
};
