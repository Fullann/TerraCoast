import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getPlayerGamificationState,
  deductLife,
  refillAllLives,
  addGems,
  claimChest,
  completePathNode,
  getLeagueForXp,
  getQuestPath,
  resetGamificationState,
  adminGrantResources,
  buyShopItem,
  equipShopItem,
  getActiveTitleDetails,
} from "../gamificationManager";

describe("gamificationManager", () => {
  const testUserId = "test-player-duo-123";

  beforeEach(() => {
    resetGamificationState(testUserId);
    vi.restoreAllMocks();
  });

  it("should initialize default state for a player with no pre-completed nodes", () => {
    const state = getPlayerGamificationState(testUserId);
    expect(state.lives).toBe(5);
    expect(state.maxLives).toBe(5);
    expect(state.gems).toBeGreaterThan(0);
    expect(Object.keys(state.completedNodes).length).toBe(0);
  });

  it("should deduct lives and support refill", () => {
    const success = deductLife(testUserId);
    expect(success).toBe(true);

    let state = getPlayerGamificationState(testUserId);
    expect(state.lives).toBe(4);
    expect(state.lastLifeLostAt).not.toBeNull();

    // Refill all lives
    refillAllLives(testUserId);
    state = getPlayerGamificationState(testUserId);
    expect(state.lives).toBe(5);
    expect(state.lastLifeLostAt).toBeNull();
  });

  it("should add gems and claim chests", () => {
    const initialGems = getPlayerGamificationState(testUserId).gems;
    const newTotal = addGems(testUserId, 50);
    expect(newTotal).toBe(initialGems + 50);

    const claimed = claimChest(testUserId, "u1-chest", 40);
    expect(claimed).toBe(true);
    expect(getPlayerGamificationState(testUserId).gems).toBe(newTotal + 40);

    // Cannot claim same chest twice
    const claimedTwice = claimChest(testUserId, "u1-chest", 40);
    expect(claimedTwice).toBe(false);
  });

  it("should complete node and calculate stars and rewards", () => {
    const res = completePathNode(testUserId, "u1-n2", 95);
    expect(res.stars).toBe(3);
    expect(res.gemsAwarded).toBe(15);

    const state = getPlayerGamificationState(testUserId);
    expect(state.completedNodes["u1-n2"]?.stars).toBe(3);
  });

  it("should return correct Duolingo league tier by XP", () => {
    expect(getLeagueForXp(0).name).toBe("Ligue Bronze");
    expect(getLeagueForXp(300).name).toBe("Ligue Argent");
    expect(getLeagueForXp(1200).name).toBe("Ligue Or");
    expect(getLeagueForXp(2500).name).toBe("Ligue Saphir");
    expect(getLeagueForXp(4000).name).toBe("Ligue Rubis");
    expect(getLeagueForXp(9000).name).toBe("Ligue Diamant");
  });

  it("should generate quest path with first node active and subsequent nodes locked", () => {
    const path = getQuestPath(testUserId);
    expect(path.length).toBe(4);
    expect(path[0].nodes[0].status).toBe("active"); // u1-n1 is active and ready to play
    expect(path[0].nodes[0].stars).toBe(0);
    expect(path[0].nodes[1].status).toBe("locked"); // u1-n2 is locked until u1-n1 is completed
    expect(path[0].nodes[2].status).toBe("locked"); // u1-n3 is locked

    // When player completes u1-n1
    completePathNode(testUserId, "u1-n1", 90);
    const updatedPath = getQuestPath(testUserId);
    expect(updatedPath[0].nodes[0].status).toBe("completed");
    expect(updatedPath[0].nodes[0].stars).toBe(3);
    expect(updatedPath[0].nodes[1].status).toBe("active");
  });

  it("should allow admin to grant gems, hearts and streak freezes", () => {
    // Grant gems delta
    const s1 = adminGrantResources(testUserId, { gemsDelta: 1000 });
    expect(s1.gems).toBeGreaterThanOrEqual(1100);

    // Set exact gems
    const s2 = adminGrantResources(testUserId, { setGems: 7777 });
    expect(s2.gems).toBe(7777);

    // Give developer god mode (99 lives)
    const s3 = adminGrantResources(testUserId, { setLives: 99 });
    expect(s3.lives).toBe(99);

    // Deducting a life from 99 lives should result in 98 without clamping to 5
    deductLife(testUserId);
    const s4 = getPlayerGamificationState(testUserId);
    expect(s4.lives).toBe(98);

    // Full refill restores 5 lives
    const s5 = adminGrantResources(testUserId, { fullRefill: true });
    expect(s5.lives).toBe(5);

    // Grant streak freezes
    const s6 = adminGrantResources(testUserId, { streakFreezesDelta: 3 });
    expect(s6.streakFreezes).toBe(3);
  });

  it("should equip shop items with strict exclusivity and update active item", () => {
    // 1. Give gems and buy items
    adminGrantResources(testUserId, { setGems: 10000 });
    buyShopItem(testUserId, "frame_flame");
    buyShopItem(testUserId, "frame_compass");
    buyShopItem(testUserId, "title_cartographer");
    buyShopItem(testUserId, "theme_antique");

    let state = getPlayerGamificationState(testUserId);
    expect(state.inventory.avatarFrames).toContain("frame_flame");
    expect(state.inventory.avatarFrames).toContain("frame_compass");
    expect(state.inventory.titles).toContain("title_cartographer");
    expect(state.inventory.themes).toContain("theme_antique");

    // Last bought was theme_antique, so activeTheme is theme_antique
    expect(state.activeTheme).toBe("theme_antique");

    // 2. Equip flame frame
    state = equipShopItem(testUserId, "frame", "frame_flame");
    expect(state.activeAvatarFrame).toBe("frame_flame");

    // 3. Equip compass frame -> replaces flame frame (exclusive!)
    state = equipShopItem(testUserId, "frame", "frame_compass");
    expect(state.activeAvatarFrame).toBe("frame_compass");

    // 4. Unequip frame -> activeAvatarFrame becomes none
    state = equipShopItem(testUserId, "frame", null);
    expect(state.activeAvatarFrame).toBe("none");

    // 5. Title details
    state = equipShopItem(testUserId, "title", "title_cartographer");
    expect(state.activeTitle).toBe("title_cartographer");

    const titleDetails = getActiveTitleDetails(testUserId);
    expect(titleDetails).not.toBeNull();
    expect(titleDetails?.name).toBe("Cartographe Suprême 📐");
    expect(titleDetails?.icon).toBe("📐");
  });
});

