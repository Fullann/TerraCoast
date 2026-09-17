import { describe, it, expect } from "vitest";
import {
  formatDateToIsoDay,
  isStreakPlayedToday,
  isStreakAtRisk,
  getNextStreakMilestone,
  getWeekStreakStatus,
} from "../streakUtils";

describe("streakUtils", () => {
  it("formats date to ISO string YYYY-MM-DD", () => {
    const d = new Date(2026, 8, 17); // Sept 17, 2026
    expect(formatDateToIsoDay(d)).toBe("2026-09-17");
  });

  it("checks if streak was played today", () => {
    const today = formatDateToIsoDay(new Date());
    expect(isStreakPlayedToday(today)).toBe(true);
    expect(isStreakPlayedToday("2020-01-01")).toBe(false);
    expect(isStreakPlayedToday(null)).toBe(false);
    expect(isStreakPlayedToday(undefined)).toBe(false);
  });

  it("detects when streak is in danger (played yesterday but not today)", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayIso = formatDateToIsoDay(yesterday);

    expect(isStreakAtRisk(yesterdayIso, 5)).toBe(true);
    // If streak is 0, cannot be in danger
    expect(isStreakAtRisk(yesterdayIso, 0)).toBe(false);
    // If played today, not in danger
    const todayIso = formatDateToIsoDay(new Date());
    expect(isStreakAtRisk(todayIso, 5)).toBe(false);
  });

  it("computes next streak milestone accurately", () => {
    const milestone1 = getNextStreakMilestone(2);
    expect(milestone1.nextDays).toBe(3);
    expect(milestone1.remainingDays).toBe(1);

    const milestone2 = getNextStreakMilestone(7);
    expect(milestone2.nextDays).toBe(14);
    expect(milestone2.remainingDays).toBe(7);
  });

  it("returns 7 days for the current week", () => {
    const week = getWeekStreakStatus(formatDateToIsoDay(), 3);
    expect(week).toHaveLength(7);
    expect(week[0].dayLabel).toBe("Lun");
    expect(week[6].dayLabel).toBe("Dim");
    const todayItem = week.find((d) => d.isToday);
    expect(todayItem).toBeDefined();
    expect(todayItem?.isCompleted).toBe(true);
  });
});
