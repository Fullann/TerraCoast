import { describe, it, expect, vi } from "vitest";

vi.mock("../supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import {
  getDailyQuizForDate,
  getTimeUntilNextChallenge,
} from "../dailyChallenge";

describe("dailyChallenge", () => {
  const mockQuizzes = [
    {
      id: "quiz-alpha",
      title: "Quiz Alpha",
      is_public: true,
      is_global: false,
    } as any,
    {
      id: "quiz-beta",
      title: "Quiz Beta",
      is_public: true,
      is_global: false,
    } as any,
    {
      id: "quiz-gamma",
      title: "Quiz Gamma",
      is_public: true,
      is_global: true,
    } as any,
  ];

  it("selects a deterministic quiz for a given day", () => {
    const quiz1 = getDailyQuizForDate(mockQuizzes, "2026-09-17");
    const quiz2 = getDailyQuizForDate(mockQuizzes, "2026-09-17");
    expect(quiz1).not.toBeNull();
    expect(quiz1?.id).toBe(quiz2?.id);
  });

  it("picks a different quiz on different dates if pool has multiple", () => {
    const picks = new Set<string>();
    for (let i = 1; i <= 10; i++) {
      const dateStr = `2026-09-${String(i).padStart(2, "0")}`;
      const q = getDailyQuizForDate(mockQuizzes, dateStr);
      if (q) picks.add(q.id);
    }
    expect(picks.size).toBeGreaterThan(1);
  });

  it("returns null when quiz pool is empty", () => {
    expect(getDailyQuizForDate([], "2026-09-17")).toBeNull();
  });

  it("calculates time until next challenge correctly", () => {
    const time = getTimeUntilNextChallenge();
    expect(time.hours).toBeGreaterThanOrEqual(0);
    expect(time.hours).toBeLessThanOrEqual(24);
    expect(time.minutes).toBeGreaterThanOrEqual(0);
    expect(time.minutes).toBeLessThan(60);
    expect(time.seconds).toBeGreaterThanOrEqual(0);
    expect(time.seconds).toBeLessThan(60);
    expect(time.formatted).toMatch(/^\d{2}h \d{2}m \d{2}s$/);
  });
});
