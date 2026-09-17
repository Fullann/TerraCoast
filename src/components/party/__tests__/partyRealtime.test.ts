import { describe, it, expect, vi } from "vitest";

vi.mock("../../../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
  },
}));

import {
  calculatePartyScore,
  generatePartyPin,
  normalizePartyPin,
} from "../partyRealtime";

describe("Party Realtime Helpers & Scoring", () => {
  describe("generatePartyPin", () => {
    it("should generate a valid PIN format like TERRA-XX", () => {
      const pin = generatePartyPin();
      expect(pin).toMatch(/^TERRA-\d{2}$/);
    });
  });

  describe("normalizePartyPin", () => {
    it("should uppercase and format raw codes", () => {
      expect(normalizePartyPin("terra-24")).toBe("TERRA-24");
      expect(normalizePartyPin("terra24")).toBe("TERRA-24");
      expect(normalizePartyPin("24")).toBe("TERRA-24");
      expect(normalizePartyPin("  TERRA-84  ")).toBe("TERRA-84");
      expect(normalizePartyPin("1234")).toBe("TERRA-1234");
    });
  });

  describe("calculatePartyScore", () => {
    it("should return 0 points and 0 streak on incorrect answer", () => {
      const result = calculatePartyScore(false, 1500, 15, 3);
      expect(result.points).toBe(0);
      expect(result.newStreak).toBe(0);
    });

    it("should calculate speed bonus and streak bonus for quick correct answer", () => {
      // 500ms on 15s limit -> nearly max speed bonus
      const result = calculatePartyScore(true, 500, 15, 0);
      expect(result.points).toBeGreaterThan(950);
      expect(result.newStreak).toBe(1);
    });

    it("should award higher points with an active streak", () => {
      const noStreak = calculatePartyScore(true, 2000, 15, 0);
      const withStreak = calculatePartyScore(true, 2000, 15, 3);
      expect(withStreak.points).toBeGreaterThan(noStreak.points);
      expect(withStreak.newStreak).toBe(4);
    });
  });
});
