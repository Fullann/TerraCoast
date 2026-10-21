import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateGameReward,
  getStreakXpMultiplier,
  applyPlayerRewards,
  getWeeklyLeagueTier,
  getCurrentLeagueWeekKey,
  claimWeeklyLeagueReward,
  isWeeklyLeagueClaimed,
} from "../rewardManager";
import { resetGamificationState, getPlayerGamificationState } from "../gamificationManager";

describe("rewardManager", () => {
  const TEST_USER = "test-user-rewards-123";

  beforeEach(() => {
    resetGamificationState(TEST_USER);
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  });

  describe("calculateGameReward formulas", () => {
    it("calculates Geo-Detective rewards correctly (score / 50 capped at 500 XP, 25 gems for >20000)", () => {
      const perfect = calculateGameReward("geo-detective", { score: 25000 });
      expect(perfect.baseXp).toBe(500);
      expect(perfect.baseGems).toBe(25);

      const mid = calculateGameReward("geo-detective", { score: 10000 });
      expect(mid.baseXp).toBe(200);
      expect(mid.baseGems).toBe(10);
    });

    it("calculates Silhouette rewards correctly (100 to 25 XP by attempts, 10-30 gems)", () => {
      const firstTry = calculateGameReward("silhouette", { attempts: 1 });
      expect(firstTry.baseXp).toBe(100);
      expect(firstTry.baseGems).toBe(30);

      const thirdTry = calculateGameReward("silhouette", { attempts: 3 });
      expect(thirdTry.baseXp).toBe(70);
      expect(thirdTry.baseGems).toBe(20);

      const sixthTry = calculateGameReward("silhouette", { attempts: 6 });
      expect(sixthTry.baseXp).toBe(25);
      expect(sixthTry.baseGems).toBe(10);
    });

    it("calculates Higher / Lower rewards correctly (15 XP/correct + 100 XP per 10 consecutive, 2 gems/correct)", () => {
      const streak5 = calculateGameReward("higher-lower", { score: 5 });
      expect(streak5.baseXp).toBe(75);
      expect(streak5.baseGems).toBe(10);

      const streak12 = calculateGameReward("higher-lower", { score: 12 });
      // 12 * 15 = 180 + 100 bonus milestone = 280 XP
      expect(streak12.baseXp).toBe(280);
      expect(streak12.baseGems).toBe(24);
    });

    it("calculates Chrono Rush rewards correctly (10 XP per correct + remaining time bonus)", () => {
      const run = calculateGameReward("chrono-rush", { correctCount: 15, timeLeft: 8 });
      // 15 * 10 = 150 + (8 * 2 = 16) = 166 XP
      expect(run.baseXp).toBe(166);
      expect(run.baseGems).toBe(15);
    });

    it("calculates Travle & Map Blitz fixed arcade rewards", () => {
      const travle = calculateGameReward("travle");
      expect(travle.baseXp).toBe(150);
      expect(travle.baseGems).toBe(25);

      const blitz = calculateGameReward("map-blitz");
      expect(blitz.baseXp).toBe(150);
      expect(blitz.baseGems).toBe(50);
    });

    it("calculates Border Puzzle, TimeGuessr and City Guesser arcade rewards", () => {
      // Border Puzzle (Math.round(score * 1.5))
      const puzzlePerfect = calculateGameReward("border-puzzle", { score: 100 });
      expect(puzzlePerfect.baseXp).toBe(150);
      expect(puzzlePerfect.baseGems).toBe(35);

      const puzzleAssisted = calculateGameReward("border-puzzle", { score: 60 });
      expect(puzzleAssisted.baseXp).toBe(90);
      expect(puzzleAssisted.baseGems).toBe(15);

      // TimeGuessr
      const timeGuessrHigh = calculateGameReward("time-guessr", { score: 24000 });
      expect(timeGuessrHigh.baseXp).toBe(480);
      expect(timeGuessrHigh.baseGems).toBe(50);

      // City Guesser
      const cityHigh = calculateGameReward("city-guesser", { score: 21000 });
      expect(cityHigh.baseXp).toBe(420);
      expect(cityHigh.baseGems).toBe(50);
    });
  });

  describe("Streak multiplier", () => {
    it("returns correct streak multipliers (+10% at 3d, +25% at 7d, +50% at 30d)", () => {
      expect(getStreakXpMultiplier(0)).toBe(1.0);
      expect(getStreakXpMultiplier(2)).toBe(1.0);
      expect(getStreakXpMultiplier(3)).toBe(1.1);
      expect(getStreakXpMultiplier(6)).toBe(1.1);
      expect(getStreakXpMultiplier(7)).toBe(1.25);
      expect(getStreakXpMultiplier(29)).toBe(1.25);
      expect(getStreakXpMultiplier(30)).toBe(1.5);
      expect(getStreakXpMultiplier(100)).toBe(1.5);
    });
  });

  describe("applyPlayerRewards", () => {
    it("credits gems, computes XP with first win bonus and updates gamification state", async () => {
      const reward = calculateGameReward("silhouette", { attempts: 1 });
      const res = await applyPlayerRewards(TEST_USER, reward, "silhouette", 7, 0);

      expect(res.gems).toBe(30);
      expect(res.isFirstWin).toBe(true);
      expect(res.firstWinBonusXp).toBe(100);
      // Base XP 100 * streak 1.25 (125) + first win 100 = 225
      expect(res.totalXp).toBe(225);

      const state = getPlayerGamificationState(TEST_USER);
      expect(state.gems).toBeGreaterThanOrEqual(210); // default 180 + 30
      expect(state.xp).toBe(225);
    });
  });

  describe("Weekly League Chest Rewards", () => {
    it("returns correct tiers for division rankings", () => {
      expect(getWeeklyLeagueTier(1)?.id).toBe("rank_1");
      expect(getWeeklyLeagueTier(1)?.gems).toBe(300);
      expect(getWeeklyLeagueTier(1)?.boosterPackId).toBe("pack_mythic");

      expect(getWeeklyLeagueTier(2)?.id).toBe("rank_2");
      expect(getWeeklyLeagueTier(2)?.gems).toBe(200);

      expect(getWeeklyLeagueTier(3)?.id).toBe("rank_3");
      expect(getWeeklyLeagueTier(3)?.gems).toBe(120);

      expect(getWeeklyLeagueTier(7)?.id).toBe("top_10");
      expect(getWeeklyLeagueTier(7)?.gems).toBe(50);

      expect(getWeeklyLeagueTier(15)).toBeNull();
    });

    it("claims weekly league reward and prevents double claiming", async () => {
      const weekKey = getCurrentLeagueWeekKey();
      expect(isWeeklyLeagueClaimed(TEST_USER, weekKey)).toBe(false);

      const claimRes = await claimWeeklyLeagueReward(TEST_USER, 1, weekKey);
      expect(claimRes.success).toBe(true);
      expect(claimRes.tier?.gems).toBe(300);
      expect(isWeeklyLeagueClaimed(TEST_USER, weekKey)).toBe(true);

      const repeatRes = await claimWeeklyLeagueReward(TEST_USER, 1, weekKey);
      expect(repeatRes.success).toBe(false);
      expect(repeatRes.message).toContain("déjà réclamé");
    });
  });
});
