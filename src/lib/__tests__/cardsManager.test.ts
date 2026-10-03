import { describe, it, expect, beforeEach } from "vitest";
import {
  TERRA_CARDS_CATALOG,
  BOOSTER_PACKS,
  RARITY_CONFIG,
  CATEGORY_CONFIG,
} from "../cardsData";
import {
  getPlayerCardsState,
  savePlayerCardsState,
  openBoosterPack,
  craftCardWithStardust,
  answerCardTrivia,
  setFavoriteCards,
  getCollectionStats,
  canClaimDailyPack,
  resetCardsState,
  getCardsCatalog,
  getCardById,
  adminSaveCard,
  adminUpdateCardRarity,
  adminDeleteCard,
  adminResetCardsCatalog,
  adminExportCardsCatalog,
  adminImportCardsCatalog,
  getRemoteCardsCatalog,
  setRemoteCardsCatalog,
  syncCardsCatalogFromSupabase,
} from "../cardsManager";
import {
  getPlayerGamificationState,
  savePlayerGamificationState,
  resetGamificationState,
} from "../gamificationManager";

describe("TerraDex Cards Manager & Data", () => {
  const TEST_USER = "test-collector-user";

  beforeEach(() => {
    resetCardsState(TEST_USER);
    resetGamificationState(TEST_USER);
  });

  describe("Catalog Integrity", () => {
    it("should contain exactly 60 curated collectible cards", () => {
      expect(TERRA_CARDS_CATALOG.length).toBe(60);
    });

    it("should have unique IDs and consecutive numbers from 1 to 60", () => {
      const ids = new Set(TERRA_CARDS_CATALOG.map((c) => c.id));
      expect(ids.size).toBe(60);

      const numbers = TERRA_CARDS_CATALOG.map((c) => c.number).sort((a, b) => a - b);
      expect(numbers[0]).toBe(1);
      expect(numbers[59]).toBe(60);
      expect(new Set(numbers).size).toBe(60);
    });

    it("should cover all 5 required categories with valid trivia questions", () => {
      expect(Object.keys(CATEGORY_CONFIG).length).toBe(5);
      const categories = new Set(TERRA_CARDS_CATALOG.map((c) => c.category));
      expect(categories.has("country")).toBe(true);
      expect(categories.has("region")).toBe(true);
      expect(categories.has("language")).toBe(true);
      expect(categories.has("figure")).toBe(true);
      expect(categories.has("wonder")).toBe(true);

      TERRA_CARDS_CATALOG.forEach((card) => {
        expect(card.name).toBeTruthy();
        expect(card.funFact).toBeTruthy();
        expect(card.trivia.question).toBeTruthy();
        expect(card.trivia.options.length).toBeGreaterThanOrEqual(2);
        expect(card.trivia.correctIndex).toBeGreaterThanOrEqual(0);
        expect(card.trivia.correctIndex).toBeLessThan(card.trivia.options.length);
      });
    });

    it("should have all 4 booster packs defined", () => {
      expect(BOOSTER_PACKS.length).toBe(4);
      expect(BOOSTER_PACKS.some((p) => p.category === "daily")).toBe(true);
      expect(BOOSTER_PACKS.some((p) => p.category === "starter")).toBe(true);
      expect(BOOSTER_PACKS.some((p) => p.category === "continental")).toBe(true);
      expect(BOOSTER_PACKS.some((p) => p.category === "mythic")).toBe(true);
    });
  });

  describe("Pack Opening & Collection", () => {
    it("should allow opening the daily free booster once and set cooldown", () => {
      const statusBefore = canClaimDailyPack(TEST_USER);
      expect(statusBefore.available).toBe(true);

      const res = openBoosterPack(TEST_USER, "pack_daily");
      expect(res.success).toBe(true);
      expect(res.cards.length).toBe(3);

      const statusAfter = canClaimDailyPack(TEST_USER);
      expect(statusAfter.available).toBe(false);
      expect(statusAfter.remainingMs).toBeGreaterThan(0);

      // Attempting to claim again should fail
      const repeatRes = openBoosterPack(TEST_USER, "pack_daily");
      expect(repeatRes.success).toBe(false);
    });

    it("should deduct gems when opening a paid booster pack", () => {
      // Set user gems
      const gState = getPlayerGamificationState(TEST_USER);
      gState.gems = 300;
      savePlayerGamificationState(TEST_USER, gState);

      const res = openBoosterPack(TEST_USER, "pack_starter");
      expect(res.success).toBe(true);
      expect(res.cards.length).toBe(3);

      const updatedGState = getPlayerGamificationState(TEST_USER);
      expect(updatedGState.gems).toBe(200); // 300 - 100
    });

    it("should prevent opening if user does not have enough gems", () => {
      const gState = getPlayerGamificationState(TEST_USER);
      gState.gems = 20;
      savePlayerGamificationState(TEST_USER, gState);

      const res = openBoosterPack(TEST_USER, "pack_starter");
      expect(res.success).toBe(false);
      expect(res.message).toContain("TerraGems insuffisantes");
    });
  });

  describe("Duplicate Handling & Stardust Crafting", () => {
    it("should award stardust when drawing a duplicate card", () => {
      // Force initial card ownership
      const card = TERRA_CARDS_CATALOG[0];
      const state = getPlayerCardsState(TEST_USER);
      state.ownedCards[card.id] = {
        count: 1,
        firstAcquiredAt: Date.now(),
        shiny: false,
      };
      savePlayerCardsState(TEST_USER, state);

      // Give enough gems to open starter pack
      const gState = getPlayerGamificationState(TEST_USER);
      gState.gems = 1000;
      savePlayerGamificationState(TEST_USER, gState);

      // Open several packs to accumulate stardust from duplicates
      for (let i = 0; i < 5; i++) {
        openBoosterPack(TEST_USER, "pack_starter");
      }

      const finalState = getPlayerCardsState(TEST_USER);
      expect(finalState.totalPacksOpened).toBe(5);
    });

    it("should craft a card with stardust if the user has enough", () => {
      const card = TERRA_CARDS_CATALOG[0]; // Common, craft cost: 60
      const cost = RARITY_CONFIG[card.rarity].craftCost;

      const state = getPlayerCardsState(TEST_USER);
      state.stardust = cost + 10;
      savePlayerCardsState(TEST_USER, state);

      const res = craftCardWithStardust(TEST_USER, card.id);
      expect(res.success).toBe(true);
      expect(res.state.ownedCards[card.id]).toBeDefined();
      expect(res.state.stardust).toBe(10);
    });

    it("should fail crafting if the user lacks stardust", () => {
      const card = TERRA_CARDS_CATALOG[16]; // Vatican (Mythic, cost: 2500)
      const state = getPlayerCardsState(TEST_USER);
      state.stardust = 20;
      savePlayerCardsState(TEST_USER, state);

      const res = craftCardWithStardust(TEST_USER, card.id);
      expect(res.success).toBe(false);
      expect(res.message).toContain("Poussières d'Étoile insuffisantes");
    });
  });

  describe("Card Flash Quiz Trivia", () => {
    it("should reward 5 gems on correct answer for an owned card", () => {
      const card = TERRA_CARDS_CATALOG[0];
      const state = getPlayerCardsState(TEST_USER);
      state.ownedCards[card.id] = {
        count: 1,
        firstAcquiredAt: Date.now(),
        answeredTrivia: false,
      };
      savePlayerCardsState(TEST_USER, state);

      const initialGems = getPlayerGamificationState(TEST_USER).gems;
      const res = answerCardTrivia(TEST_USER, card.id, card.trivia.correctIndex);

      expect(res.correct).toBe(true);
      expect(res.rewardGems).toBe(5);

      const afterGems = getPlayerGamificationState(TEST_USER).gems;
      expect(afterGems).toBe(initialGems + 5);

      // Repeat should not grant gems twice
      const repeatRes = answerCardTrivia(TEST_USER, card.id, card.trivia.correctIndex);
      expect(repeatRes.correct).toBe(true);
      expect(repeatRes.rewardGems).toBe(0);
    });

    it("should fail gracefully on wrong answer without awarding gems", () => {
      const card = TERRA_CARDS_CATALOG[0];
      const wrongIndex = (card.trivia.correctIndex + 1) % card.trivia.options.length;

      const res = answerCardTrivia(TEST_USER, card.id, wrongIndex);
      expect(res.correct).toBe(false);
      expect(res.rewardGems).toBe(0);
    });
  });

  describe("Favorites & Collection Stats", () => {
    it("should allow setting up to 3 favorite cards", () => {
      const ids = [TERRA_CARDS_CATALOG[0].id, TERRA_CARDS_CATALOG[1].id, TERRA_CARDS_CATALOG[2].id];
      const res = setFavoriteCards(TEST_USER, [...ids, "card_overflow"]);
      expect(res.favoriteCardIds.length).toBe(3);
      expect(res.favoriteCardIds).toEqual(ids);
    });

    it("should accurately compute collection stats", () => {
      const state = getPlayerCardsState(TEST_USER);
      state.ownedCards[TERRA_CARDS_CATALOG[0].id] = { count: 1, firstAcquiredAt: Date.now() };
      state.ownedCards[TERRA_CARDS_CATALOG[1].id] = { count: 1, firstAcquiredAt: Date.now() };
      savePlayerCardsState(TEST_USER, state);

      const stats = getCollectionStats(TEST_USER);
      expect(stats.totalCards).toBe(60);
      expect(stats.totalCollected).toBe(2);
      expect(stats.percentage).toBe(Math.round((2 / 60) * 100));
    });
  });

  describe("Admin Cards Management & Custom Cards", () => {
    beforeEach(() => {
      adminResetCardsCatalog();
    });

    it("should return the default 60 cards catalog when no overrides exist", () => {
      const catalog = getCardsCatalog();
      expect(catalog.length).toBe(60);
    });

    it("should allow an admin to change the rarity of a card in 1 action", () => {
      const res = adminUpdateCardRarity("card_country_fr", "legendary");
      expect(res.success).toBe(true);

      const updated = getCardById("card_country_fr");
      expect(updated?.rarity).toBe("legendary");

      // Verify other cards remain unaffected
      const ch = getCardById("card_country_ch");
      expect(ch?.rarity).toBe("rare");
    });

    it("should allow an admin to add a new custom card", () => {
      const newCard = {
        id: "card_custom_iceland",
        number: 61,
        name: "Islande",
        category: "country" as const,
        rarity: "epic" as const,
        continent: "Europe" as const,
        flag: "🇮🇸",
        icon: "🌋",
        tagline: "Terre de Glace et de Feu",
        description: "Île volcanique de l'Atlantique Nord célèbre pour ses geysers.",
        stats: { Capitale: "Reykjavik" },
        funFact: "L'Islande n'a pas d'armée régulière.",
        quote: "Lífið er saltfiskur",
        colorScheme: { from: "from-blue-700", to: "to-cyan-500", accent: "#0284c7" },
        trivia: {
          question: "Quelle est la capitale de l'Islande ?",
          options: ["Reykjavik", "Oslo", "Helsinki", "Dublin"],
          correctIndex: 0,
          explanation: "Reykjavik est la capitale la plus septentrionale.",
        },
      };

      const res = adminSaveCard(newCard);
      expect(res.success).toBe(true);

      const catalog = getCardsCatalog();
      expect(catalog.length).toBe(61);

      const found = getCardById("card_custom_iceland");
      expect(found).toBeDefined();
      expect(found?.name).toBe("Islande");
      expect(found?.number).toBe(61);
    });

    it("should allow an admin to delete a custom card and reset catalog", () => {
      adminSaveCard({
        id: "card_custom_temporary",
        number: 62,
        name: "Test Temp",
        category: "wonder",
        rarity: "common",
        continent: "Monde",
        icon: "❓",
        tagline: "Test",
        description: "Test description",
        stats: {},
        funFact: "Test fact",
        quote: "Test quote",
        colorScheme: { from: "from-slate-700", to: "to-slate-900", accent: "#334155" },
        trivia: { question: "Q?", options: ["A"], correctIndex: 0, explanation: "E" },
      });

      expect(getCardsCatalog().length).toBe(61);
      const delRes = adminDeleteCard("card_custom_temporary");
      expect(delRes.success).toBe(true);
      expect(getCardsCatalog().length).toBe(60);

      // Reset
      adminResetCardsCatalog();
      expect(getCardsCatalog().length).toBe(60);
    });

    it("should export and import cards catalog JSON reliably", () => {
      const exported = adminExportCardsCatalog();
      expect(typeof exported).toBe("string");
      expect(exported.length).toBeGreaterThan(100);

      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(60);

      // Import with a newly added card
      parsed.push({
        id: "card_custom_imported",
        number: 62,
        name: "Mont Olympe",
        category: "wonder",
        rarity: "mythic",
        continent: "Europe",
        icon: "⚡",
        tagline: "Demeure des Dieux",
        description: "Plus haut sommet de Grèce.",
        stats: { Altitude: "2 917 m" },
        funFact: "Considéré comme le trône de Zeus.",
        quote: "Olympus",
        colorScheme: { from: "from-amber-500", to: "to-purple-700", accent: "#f59e0b" },
        trivia: { question: "Qui régnait sur l'Olympe ?", options: ["Zeus", "Hadès", "Poséidon", "Arès"], correctIndex: 0, explanation: "Zeus régnait sur l'Olympe." },
      });

      const importRes = adminImportCardsCatalog(JSON.stringify(parsed));
      expect(importRes.success).toBe(true);
      expect(getCardsCatalog().length).toBe(61);
      expect(getCardById("card_custom_imported")?.rarity).toBe("mythic");
    });

    it("should handle remote cards catalog caching and precedence", () => {
      expect(getRemoteCardsCatalog()).toBeNull();

      const mockRemote = [
        ...TERRA_CARDS_CATALOG,
        {
          id: "card_remote_mars",
          number: 99,
          name: "Planète Mars",
          category: "wonder" as const,
          rarity: "mythic" as const,
          continent: "Monde" as const,
          icon: "🔴",
          tagline: "La Planète Rouge",
          description: "Quatrième planète du système solaire.",
          stats: {},
          funFact: "Mars abrite le plus haut volcan du système solaire, Olympus Mons !",
          colorScheme: { from: "from-red-600", to: "to-orange-600", accent: "#dc2626" },
          trivia: { question: "Quel est le plus haut volcan de Mars ?", options: ["Olympus Mons"], correctIndex: 0, explanation: "" },
        },
      ];

      setRemoteCardsCatalog(mockRemote);
      const cached = getRemoteCardsCatalog();
      expect(cached).not.toBeNull();
      expect(cached?.length).toBe(61);

      // getCardsCatalog should incorporate the remote card
      const catalog = getCardsCatalog();
      expect(catalog.length).toBe(61);
      expect(catalog.some((c) => c.id === "card_remote_mars")).toBe(true);

      // Clean up
      setRemoteCardsCatalog(null);
      expect(getCardsCatalog().length).toBe(60);
    });
  });
});
