import { describe, it, expect } from "vitest";
import {
  normalizeAnswer,
  levenshteinDistance,
  matchesWithTolerance,
  calculatePoints,
  arraysEqual,
} from "../utils";

describe("Quiz Play Scoring & Answer Evaluation", () => {
  describe("normalizeAnswer", () => {
    it("converts uppercase to lowercase", () => {
      expect(normalizeAnswer("FRANCE")).toBe("france");
    });

    it("strips accents and diacritics", () => {
      expect(normalizeAnswer("Éthiopie")).toBe("ethiopie");
      expect(normalizeAnswer("São Tomé")).toBe("sao tome");
      expect(normalizeAnswer("Côte d'Ivoire")).toBe("cote divoire");
    });

    it("collapses multiple spaces and trims edges", () => {
      expect(normalizeAnswer("  New    York  ")).toBe("new york");
    });

    it("removes punctuation except hyphen", () => {
      expect(normalizeAnswer("Saint-Marin!")).toBe("saint-marin");
    });
  });

  describe("levenshteinDistance", () => {
    it("returns 0 for identical strings", () => {
      expect(levenshteinDistance("paris", "paris")).toBe(0);
    });

    it("calculates 1 for single insertion, deletion, or substitution", () => {
      expect(levenshteinDistance("paris", "pari")).toBe(1);
      expect(levenshteinDistance("paris", "pariss")).toBe(1);
      expect(levenshteinDistance("paris", "parys")).toBe(1);
    });

    it("handles empty strings", () => {
      expect(levenshteinDistance("", "abc")).toBe(3);
      expect(levenshteinDistance("xyz", "")).toBe(3);
    });
  });

  describe("matchesWithTolerance", () => {
    it("matches exact normalized answers in strict mode", () => {
      expect(matchesWithTolerance("Paris", "paris", "strict")).toBe(true);
      expect(matchesWithTolerance("Éthiopie", "ethiopie", "strict")).toBe(true);
      expect(matchesWithTolerance("Pari", "paris", "strict")).toBe(false);
    });

    it("tolerates 1 character typo in lenient mode", () => {
      expect(matchesWithTolerance("Berne", "Bern", "lenient")).toBe(true);
      expect(matchesWithTolerance("Vienne", "Vienna", "lenient")).toBe(true); // 1 substitution ('e' vs 'a')
      expect(matchesWithTolerance("Madrid", "Marseille", "lenient")).toBe(false);
      expect(matchesWithTolerance("Tokio", "Tokyo", "lenient")).toBe(true); // distance 1: 'i' -> 'y'
    });

    it("rejects empty answers", () => {
      expect(matchesWithTolerance("", "Paris", "lenient")).toBe(false);
      expect(matchesWithTolerance("Paris", "", "lenient")).toBe(false);
    });
  });

  describe("calculatePoints", () => {
    it("gives max 1.5x bonus when answered instantly (0s)", () => {
      const pts = calculatePoints(0, 100, 30);
      expect(pts).toBe(150); // 100 * (1 + 0.5)
    });

    it("gives base points when answered at the time limit", () => {
      const pts = calculatePoints(30, 100, 30);
      expect(pts).toBe(100);
    });

    it("scales proportionally between 0 and timeLimit", () => {
      const pts = calculatePoints(15, 100, 30);
      // speedBonus = (1 - 15/30) * 0.5 = 0.5 * 0.5 = 0.25 -> 100 * 1.25 = 125
      expect(pts).toBe(125);
    });

    it("does not award negative speed bonus if time exceeded", () => {
      const pts = calculatePoints(35, 100, 30);
      expect(pts).toBe(100);
    });
  });

  describe("arraysEqual", () => {
    it("returns true for identical arrays in identical order", () => {
      expect(arraysEqual(["A", "B", "C"], ["A", "B", "C"])).toBe(true);
    });

    it("returns false for different order or different items", () => {
      expect(arraysEqual(["A", "B"], ["B", "A"])).toBe(false);
      expect(arraysEqual(["A", "B"], ["A", "B", "C"])).toBe(false);
    });
  });
});
