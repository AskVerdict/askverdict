/**
 * Adjust self-reported LLM confidence scores.
 *
 * LLMs tend to over-report confidence (clustering at 70-90%).
 * This applies empirical adjustments to produce more calibrated scores.
 */
export function adjustConfidence(rawConfidence: number): number {
  // Clamp input to valid range
  const clamped = Math.max(0, Math.min(100, rawConfidence));

  // LLMs cluster at 75-85. Apply sigmoid-like compression:
  // - Scores above 85 get pulled down (overconfident)
  // - Scores below 60 get pulled up slightly (underconfident on easy questions)
  // - Sweet spot (65-80) stays mostly intact

  if (clamped >= 90) {
    // Heavy pull-down for extreme confidence
    return Math.round(75 + (clamped - 90) * 0.5);
  }

  if (clamped >= 80) {
    // Moderate pull-down
    return Math.round(70 + (clamped - 80) * 0.5);
  }

  if (clamped >= 65) {
    // Light adjustment - this is the calibrated zone
    return Math.round(clamped - 5);
  }

  if (clamped >= 50) {
    // Slight pull-up for underconfident
    return Math.round(clamped + 3);
  }

  // Low confidence stays low
  return Math.round(clamped);
}

/**
 * Calculate agreement factor between advocate and critic.
 * Higher overlap in points suggests stronger consensus.
 * Returns 0-1 where 1 = strong agreement on key facts.
 */
export function calculateAgreementFactor(
  forPoints: string[],
  againstPoints: string[],
): number {
  if (forPoints.length === 0 || againstPoints.length === 0) return 0;

  // Simple keyword overlap heuristic
  const forWords = new Set(
    forPoints.join(" ").toLowerCase().split(/\s+/).filter((w) => w.length > 4),
  );
  const againstWords = new Set(
    againstPoints.join(" ").toLowerCase().split(/\s+/).filter((w) => w.length > 4),
  );

  let overlap = 0;
  for (const word of forWords) {
    if (againstWords.has(word)) overlap++;
  }

  const maxPossible = Math.min(forWords.size, againstWords.size);
  if (maxPossible === 0) return 0;

  return Math.min(1, overlap / maxPossible);
}
