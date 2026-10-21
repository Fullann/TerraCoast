import { describe, it, expect, beforeEach } from "vitest";
import {
  getDailyMissions,
  saveDailyMissions,
  resetDailyMissionsState,
  trackMissionProgress,
  claimMissionReward,
  claimDailyBonusChest,
} from "../dailyMissionsManager";
import { resetGamificationState } from "../gamificationManager";

describe("dailyMissionsManager", () => {
  const TEST_USER = "test-user-missions-456";

  beforeEach(() => {
    resetGamificationState(TEST_USER);
    resetDailyMissionsState(TEST_USER);
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  });

  it("generates exactly 3 daily missions deterministically for the day", () => {
    const state = getDailyMissions(TEST_USER, "2026-10-16");
    expect(state.missions).toHaveLength(3);
    expect(state.date).toBe("2026-10-16");
    expect(state.bonusClaimed).toBe(false);

    // Consistency check on same day
    const state2 = getDailyMissions(TEST_USER, "2026-10-16");
    expect(state2.missions.map((m) => m.id)).toEqual(state.missions.map((m) => m.id));
  });

  it("tracks mission progress accurately and triggers completion", () => {
    const state = getDailyMissions(TEST_USER, "2026-10-16");
    const firstMission = state.missions[0];

    // Progress before
    expect(firstMission.currentCount).toBe(0);
    expect(firstMission.completed).toBe(false);

    // Track matching progress
    let actionType = "play_any_game";
    if (firstMission.id === "geo_detective_explorer") actionType = "geo-detective_play";
    else if (firstMission.id === "silhouette_guesser") actionType = "silhouette_win";
    else if (firstMission.id === "higher_lower_streak") actionType = "higher_lower_streak";
    else if (firstMission.id === "chrono_rush_master") actionType = "chrono_rush_score";
    else if (firstMission.id === "daily_challenge_fan") actionType = "daily_challenge_play";
    else if (firstMission.id === "travle_explorer") actionType = "travle_play";
    else if (firstMission.id === "conquest_scout") actionType = "conquest_capture";
    else if (firstMission.id === "srs_study") actionType = "srs_study";

    trackMissionProgress(TEST_USER, actionType, firstMission.targetCount, "2026-10-16");

    const updated = getDailyMissions(TEST_USER, "2026-10-16");
    const updatedMission = updated.missions.find((m) => m.id === firstMission.id);
    expect(updatedMission?.currentCount).toBe(firstMission.targetCount);
    expect(updatedMission?.completed).toBe(true);
    expect(updatedMission?.claimed).toBe(false);
  });

  it("claims individual mission rewards and prevents double claiming", () => {
    const state = getDailyMissions(TEST_USER, "2026-10-16");
    const targetMission = state.missions[0];

    // Mark completed & save
    targetMission.completed = true;
    targetMission.currentCount = targetMission.targetCount;
    saveDailyMissions(TEST_USER, state);

    const claimRes = claimMissionReward(TEST_USER, targetMission.id, "2026-10-16");
    expect(claimRes.success).toBe(true);
    expect(claimRes.gems).toBe(targetMission.rewardGems);

    const updatedState = getDailyMissions(TEST_USER, "2026-10-16");
    const claimedMission = updatedState.missions.find((m) => m.id === targetMission.id);
    expect(claimedMission?.claimed).toBe(true);

    // Double claim rejection
    const repeatClaim = claimMissionReward(TEST_USER, targetMission.id, "2026-10-16");
    expect(repeatClaim.success).toBe(false);
    expect(repeatClaim.error).toContain("déjà réclamée");
  });

  it("unlocks and claims the 3/3 daily bonus chest when all missions are claimed", () => {
    const state = getDailyMissions(TEST_USER, "2026-10-16");

    // Attempting bonus chest before 3/3 fails
    const prematureClaim = claimDailyBonusChest(TEST_USER, "2026-10-16");
    expect(prematureClaim.success).toBe(false);

    // Complete all 3 missions and persist
    for (const mission of state.missions) {
      mission.completed = true;
      mission.currentCount = mission.targetCount;
    }
    saveDailyMissions(TEST_USER, state);

    // Claim all 3 missions
    for (const mission of state.missions) {
      const res = claimMissionReward(TEST_USER, mission.id, "2026-10-16");
      expect(res.success).toBe(true);
    }

    const chestRes = claimDailyBonusChest(TEST_USER, "2026-10-16");
    expect(chestRes.success).toBe(true);
    expect(chestRes.gems).toBe(50);
    expect(chestRes.xp).toBe(100);

    const finalState = getDailyMissions(TEST_USER, "2026-10-16");
    expect(finalState.bonusClaimed).toBe(true);

    const repeatChest = claimDailyBonusChest(TEST_USER, "2026-10-16");
    expect(repeatChest.success).toBe(false);
  });
});
