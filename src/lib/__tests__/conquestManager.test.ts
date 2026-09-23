import { describe, it, expect, beforeEach } from "vitest";
import {
  getConqueredRegistry,
  isCountryConquered,
  recordConqueredCountries,
  getAllConquestCards,
  getConquestCardByIso3,
  getConquestStats,
  getCountryRarity,
  resetConquestProgress,
} from "../conquestManager";

describe("conquestManager (Fog of War & Geographic Pokédex)", () => {
  const USER_A = "player_conquest_alpha";
  const USER_B = "player_conquest_beta";

  beforeEach(() => {
    resetConquestProgress(USER_A);
    resetConquestProgress(USER_B);
    resetConquestProgress(null);
  });

  it("initializes with 0 conquered countries and full fog of war", () => {
    const registry = getConqueredRegistry(USER_A);
    expect(Object.keys(registry)).toHaveLength(0);

    const stats = getConquestStats(USER_A);
    expect(stats.conqueredCount).toBe(0);
    expect(stats.conquestPercentage).toBe(0);
    expect(stats.totalCountries).toBeGreaterThan(190);
    expect(isCountryConquered("FRA", USER_A)).toBe(false);
  });

  it("does not conquer territories if accuracy is below 80%", () => {
    const result = recordConqueredCountries(["FRA", "ITA", "ESP"], 75, USER_A);
    expect(result.newlyConquered).toHaveLength(0);
    expect(result.totalConquered).toBe(0);

    expect(isCountryConquered("FRA", USER_A)).toBe(false);
  });

  it("conquers territories when accuracy is >= 80%", () => {
    const result = recordConqueredCountries(["FRA", "JPN", "EGY"], 90, USER_A, "quiz");
    expect(result.newlyConquered).toEqual(["FRA", "JPN", "EGY"]);
    expect(result.totalConquered).toBe(3);

    expect(isCountryConquered("FRA", USER_A)).toBe(true);
    expect(isCountryConquered("JPN", USER_A)).toBe(true);
    expect(isCountryConquered("EGY", USER_A)).toBe(true);
    expect(isCountryConquered("BRA", USER_A)).toBe(false);

    // Conquering same countries again should not duplicate
    const secondPass = recordConqueredCountries(["FRA", "BRA"], 100, USER_A, "quiz");
    expect(secondPass.newlyConquered).toEqual(["BRA"]);
    expect(secondPass.totalConquered).toBe(4);
  });

  it("isolates conquest progress across different users and guest", () => {
    recordConqueredCountries(["CHE", "CAN"], 85, USER_A);
    recordConqueredCountries(["AUS"], 95, USER_B);

    expect(isCountryConquered("CHE", USER_A)).toBe(true);
    expect(isCountryConquered("CHE", USER_B)).toBe(false);

    expect(isCountryConquered("AUS", USER_A)).toBe(false);
    expect(isCountryConquered("AUS", USER_B)).toBe(true);
  });

  it("assigns appropriate rarity levels to countries", () => {
    expect(getCountryRarity("VAT")).toBe("legendary");
    expect(getCountryRarity("USA")).toBe("legendary");
    expect(getCountryRarity("FRA")).toBe("epic");
    expect(getCountryRarity("JPN")).toBe("epic");
    expect(getCountryRarity("PRT")).toBe("rare");
  });

  it("retrieves full Pokédex card with landmarks and trivia", () => {
    recordConqueredCountries(["FRA"], 95, USER_A);

    const card = getConquestCardByIso3("FRA", USER_A);
    expect(card).not.toBeNull();
    expect(card?.name).toBe("France");
    expect(card?.capital).toBe("Paris");
    expect(card?.rarity).toBe("epic");
    expect(card?.isConquered).toBe(true);
    expect(card?.bestAccuracy).toBe(95);
    expect(card?.landmark.name).toContain("Tour Eiffel");
    expect(card?.funFact).toBeTruthy();

    const lockedCard = getConquestCardByIso3("NOR", USER_A);
    expect(lockedCard).not.toBeNull();
    expect(lockedCard?.isConquered).toBe(false);
    expect(lockedCard?.bestAccuracy).toBeNull();
  });

  it("computes stats and continent progress breakdown", () => {
    recordConqueredCountries(["FRA", "DEU", "ITA", "BRA", "JPN"], 88, USER_A);

    const stats = getConquestStats(USER_A);
    expect(stats.conqueredCount).toBe(5);
    expect(stats.conquestPercentage).toBeGreaterThanOrEqual(1);
    expect(stats.epicCount).toBeGreaterThanOrEqual(3);

    const europe = stats.continentProgress.find((c) => c.continent === "Europe");
    expect(europe).toBeDefined();
    expect(europe!.conqueredCountries).toBeGreaterThanOrEqual(3);
    expect(europe!.totalCountries).toBeGreaterThan(30);

    const allCards = getAllConquestCards(USER_A);
    expect(allCards.length).toBeGreaterThan(190);
    const conqueredInCards = allCards.filter((c) => c.isConquered);
    expect(conqueredInCards).toHaveLength(5);
  });
});
