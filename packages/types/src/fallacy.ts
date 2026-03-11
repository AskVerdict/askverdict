// Logical Fallacy Detection Types

export interface FallacyDetection {
  claimId: string;
  fallacyType: string;
  fallacyName: string; // human-readable name
  confidence: number; // 0-1
  explanation: string;
}

export interface FallacyReport {
  detections: FallacyDetection[];
  totalClaims: number;
  flaggedClaims: number;
  summary: string;
}
