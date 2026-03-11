// Calibration Types

import type { Verdict } from "./verdict";

/** A calibration bucket for binning predicted vs actual outcomes */
export interface CalibrationBucket {
  predictedRange: [number, number]; // e.g., [0.7, 0.8]
  actualRate: number; // fraction of correct outcomes in this bucket
  count: number; // number of predictions in this bucket
}

/** Calibrated probability with confidence interval */
export interface CalibratedProbability {
  probability: number; // 0.01-0.99, calibrated
  confidenceInterval: { lower: number; upper: number };
  calibrationQuality: "cold_start" | "limited" | "well_calibrated";
  similarDecisionCount: number;
}

/** Verdict extended with calibrated probability and domain info */
export interface CalibratedVerdict extends Verdict {
  calibratedProbability: number; // 0.01-0.99
  confidenceInterval: { lower: number; upper: number };
  domainCategory: string;
  similarDecisionCount: number;
}

/** Platt scaling parameters for logistic calibration */
export interface PlattParams {
  a: number; // slope
  b: number; // intercept
  sampleSize: number;
  fittedAt: string; // ISO date
}
