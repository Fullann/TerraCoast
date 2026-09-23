import { describe, it, expect } from "vitest";
import {
  generateChronoRushQuestion,
  getComboMultiplier,
  CHRONO_RUSH_CONFIG,
} from "../chronoRushGame";

describe("chronoRushGame engine", () => {
  it("calculates combo multipliers according to streak", () => {
    expect(getComboMultiplier(0)).toBe(1);
    expect(getComboMultiplier(1)).toBe(1);
    expect(getComboMultiplier(2)).toBe(1);
    expect(getComboMultiplier(3)).toBe(2);
    expect(getComboMultiplier(4)).toBe(2);
    expect(getComboMultiplier(5)).toBe(3);
    expect(getComboMultiplier(9)).toBe(3);
    expect(getComboMultiplier(10)).toBe(4);
    expect(getComboMultiplier(15)).toBe(4);
  });

  it("generates varied and valid fast-fire questions with exactly 1 correct answer", () => {
    for (let i = 0; i < 10; i++) {
      const q = generateChronoRushQuestion("fr");
      expect(q.prompt).toBeDefined();
      expect(q.options).toHaveLength(4);
      const correctCount = q.options.filter((o) => o.isCorrect).length;
      expect(correctCount).toBe(1);
      expect(q.targetCountry).toBeDefined();
    }
  });

  it("has balanced time configuration", () => {
    expect(CHRONO_RUSH_CONFIG.initialTimeSeconds).toBe(45);
    expect(CHRONO_RUSH_CONFIG.bonusTimeCorrect).toBe(3);
    expect(CHRONO_RUSH_CONFIG.penaltyTimeWrong).toBe(5);
  });
});
