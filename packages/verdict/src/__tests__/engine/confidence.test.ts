import { describe, it, expect } from "vitest";
import { adjustConfidence, calculateAgreementFactor } from "../../engine/confidence.js";

describe("confidence", () => {
  describe("adjustConfidence()", () => {
    it("returns 0 for input 0", () => {
      expect(adjustConfidence(0)).toBe(0);
    });

    it("clamps negative values to 0", () => {
      expect(adjustConfidence(-10)).toBe(0);
      expect(adjustConfidence(-100)).toBe(0);
    });

    it("clamps values above 100 to the adjusted ceiling", () => {
      // 110 clamps to 100, which is >= 90, so: 75 + (100 - 90) * 0.5 = 80
      expect(adjustConfidence(110)).toBe(80);
      expect(adjustConfidence(200)).toBe(80);
    });

    it("pulls down high confidence: 90 -> 75", () => {
      expect(adjustConfidence(90)).toBe(75);
    });

    it("pulls down moderate-high confidence: 85 -> 73", () => {
      // 85 >= 80: 70 + (85 - 80) * 0.5 = 72.5 -> rounds to 73
      expect(adjustConfidence(85)).toBe(73);
    });

    it("pulls down 80 to 70", () => {
      // 80 >= 80: 70 + (80 - 80) * 0.5 = 70
      expect(adjustConfidence(80)).toBe(70);
    });

    it("keeps mid-range relatively stable: 70 -> 65", () => {
      // 70 >= 65: 70 - 5 = 65
      expect(adjustConfidence(70)).toBe(65);
    });

    it("keeps 65 relatively stable: 65 -> 60", () => {
      // 65 >= 65: 65 - 5 = 60
      expect(adjustConfidence(65)).toBe(60);
    });

    it("slightly pulls up low-mid confidence: 55 -> 58", () => {
      // 55 >= 50: 55 + 3 = 58
      expect(adjustConfidence(55)).toBe(58);
    });

    it("score of 100 gets pulled to 80", () => {
      // 100 >= 90: 75 + (100 - 90) * 0.5 = 80
      expect(adjustConfidence(100)).toBe(80);
    });

    it("score of 50 returns 53", () => {
      // 50 >= 50: 50 + 3 = 53
      expect(adjustConfidence(50)).toBe(53);
    });

    it("score below 50 stays low", () => {
      expect(adjustConfidence(30)).toBe(30);
      expect(adjustConfidence(10)).toBe(10);
    });

    it("always returns a number between 0 and 100", () => {
      const testValues = [-50, 0, 25, 50, 65, 75, 85, 90, 95, 100, 150];
      for (const v of testValues) {
        const result = adjustConfidence(v);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(100);
      }
    });
  });

  describe("calculateAgreementFactor()", () => {
    it("returns 0 for empty for-points array", () => {
      expect(calculateAgreementFactor([], ["lower costs"])).toBe(0);
    });

    it("returns 0 for empty against-points array", () => {
      expect(calculateAgreementFactor(["lower costs"], [])).toBe(0);
    });

    it("returns 0 for both empty arrays", () => {
      expect(calculateAgreementFactor([], [])).toBe(0);
    });

    it("returns 0 for completely different words", () => {
      const forPoints = ["apples oranges bananas"];
      const againstPoints = ["pencils tables chairs"];
      expect(calculateAgreementFactor(forPoints, againstPoints)).toBe(0);
    });

    it("returns greater than 0 for overlapping keywords", () => {
      // Words > 4 chars that appear in both sides
      const forPoints = ["performance improves substantially with caching"];
      const againstPoints = ["performance degrades without proper caching"];
      const factor = calculateAgreementFactor(forPoints, againstPoints);
      expect(factor).toBeGreaterThan(0);
    });

    it("returns a value between 0 and 1", () => {
      const forPoints = ["typescript improves developer experience and catches errors early"];
      const againstPoints = ["typescript increases complexity and developer friction"];
      const factor = calculateAgreementFactor(forPoints, againstPoints);
      expect(factor).toBeGreaterThanOrEqual(0);
      expect(factor).toBeLessThanOrEqual(1);
    });

    it("returns 1 for identical point lists", () => {
      const points = ["performance stability scalability reliability"];
      expect(calculateAgreementFactor(points, points)).toBe(1);
    });

    it("ignores short words (4 chars or fewer) when calculating overlap", () => {
      // Only short words - no word is > 4 chars
      const forPoints = ["the big red car"];
      const againstPoints = ["the big red car"];
      // All words are <= 4 chars, so filtered out - maxPossible = 0 -> returns 0
      expect(calculateAgreementFactor(forPoints, againstPoints)).toBe(0);
    });

    it("higher keyword overlap produces higher agreement factor", () => {
      const sharedBase = "performance stability reliability scalability";
      const highOverlap = calculateAgreementFactor(
        [sharedBase + " simplicity"],
        [sharedBase + " complexity"],
      );
      const lowOverlap = calculateAgreementFactor(
        ["performance stability reliability scalability"],
        ["totally different words without matching anything"],
      );
      expect(highOverlap).toBeGreaterThan(lowOverlap);
    });
  });
});
