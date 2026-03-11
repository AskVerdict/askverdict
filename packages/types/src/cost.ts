// Cost Tracking Types

import type { ModelTier, TaskType } from "./provider";

export interface CostRecord {
  model: string;
  taskType: TaskType;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: Date;
}

export interface ModelUsage {
  model: string;
  taskType: TaskType;
  callCount: number;
  totalTokens: number;
  cost: number;
}

export interface DebateCost {
  records: CostRecord[];
  totalCost: number;
  totalTokens: number;
  breakdown: {
    byModel: Record<string, number>;
    byTaskType: Record<TaskType, number>;
  };
  budgetPercentage?: number;
  avgCostPerRound?: number;
  costByModelTier?: Record<ModelTier, number>;
  efficiency?: {
    actualCost: number;
    allOpusCost: number;
    savingsPercent: number;
  };
}
