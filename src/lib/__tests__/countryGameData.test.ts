import { describe, it, expect } from "vitest";
import {
  getCountries,
  getAllCountries,
  getCountriesByIso3,
  getIso3ByNumericCode,
  shuffleSeeded,
  pickCountries,
  getTop10CountriesByMetric,
  getCountryNameVariantsByIso3,
  getCountryCapitalVariantsByIso3,
} from "../countryGameData";

describe("countryGameData utilities", () => {
  it("returns all countries when continent is world or empty", () => {
    const all = getAllCountries();
    expect(all.length).toBeGreaterThan(190);
    expect(getCountries("world").length).toBe(all.length);
    expect(getCountries("").length).toBe(all.length);
  });

  it("filters countries by continent correctly", () => {
    const europe = getCountries("Europe");
    expect(europe.length).toBeGreaterThan(30);
    expect(europe.every((c) => c.continent === "Europe")).toBe(true);

    const americas = getCountries("Americas");
    expect(americas.length).toBeGreaterThan(20);
    expect(
      americas.every(
        (c) =>
          c.continent === "Americas" ||
          c.continent === "North America" ||
          c.continent === "South America"
      )
    ).toBe(true);
  });

  it("retrieves countries by ISO-3 case-insensitively", () => {
    const matched = getCountriesByIso3(["fra", "DEU", "esp", "NON_EXISTENT"]);
    expect(matched.length).toBe(3);
    const isos = matched.map((c) => c.iso3);
    expect(isos).toContain("FRA");
    expect(isos).toContain("DEU");
    expect(isos).toContain("ESP");
  });

  it("returns empty array when ISO list is empty or invalid", () => {
    expect(getCountriesByIso3([])).toEqual([]);
    // @ts-expect-error testing invalid input
    expect(getCountriesByIso3(null)).toEqual([]);
  });

  it("maps numeric codes to ISO-3 correctly", () => {
    // France is 250
    expect(getIso3ByNumericCode(250)).toBe("FRA");
    // String number "250"
    expect(getIso3ByNumericCode("250")).toBe("FRA");
    // Germany is 276
    expect(getIso3ByNumericCode(276)).toBe("DEU");
    // Invalid code returns empty string
    expect(getIso3ByNumericCode(999999)).toBe("");
    expect(getIso3ByNumericCode(null)).toBe("");
  });

  describe("shuffleSeeded and pickCountries", () => {
    it("is strictly deterministic: identical seed yields identical order", () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const run1 = shuffleSeeded(original, "test-seed-xyz");
      const run2 = shuffleSeeded(original, "test-seed-xyz");
      expect(run1).toEqual(run2);
      expect(run1).toHaveLength(original.length);
      expect(run1.sort()).toEqual(original.sort());
    });

    it("different seeds produce different orderings", () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const runA = shuffleSeeded(original, "seed-alpha");
      const runB = shuffleSeeded(original, "seed-beta-differing");
      expect(runA).not.toEqual(runB);
    });

    it("picks bounded number of countries deterministically", () => {
      const picked1 = pickCountries(5, "daily-quiz-123", "Europe");
      const picked2 = pickCountries(5, "daily-quiz-123", "Europe");
      expect(picked1).toHaveLength(5);
      expect(picked1.map((c) => c.iso3)).toEqual(picked2.map((c) => c.iso3));
    });
  });

  describe("getTop10CountriesByMetric", () => {
    it("returns top 10 populated countries in descending order", () => {
      const topPop = getTop10CountriesByMetric("population");
      expect(topPop).toHaveLength(10);
      for (let i = 0; i < topPop.length - 1; i++) {
        expect(topPop[i].population).toBeGreaterThanOrEqual(topPop[i + 1].population);
      }
      const topIso = topPop.map((c) => c.iso3);
      // India or China should be #1 or #2
      expect(topIso.slice(0, 3)).toContain("IND");
    });

    it("returns top 10 largest countries by area in descending order", () => {
      const topArea = getTop10CountriesByMetric("area_km2");
      expect(topArea).toHaveLength(10);
      for (let i = 0; i < topArea.length - 1; i++) {
        expect(topArea[i].area_km2).toBeGreaterThanOrEqual(topArea[i + 1].area_km2);
      }
      // Russia should be #1
      expect(topArea[0].iso3).toBe("RUS");
    });
  });

  describe("name and capital variants with localization", () => {
    it("provides multilingual variants for country names", () => {
      const frVariants = getCountryNameVariantsByIso3("DEU", "fr");
      expect(frVariants).toContain("Allemagne");

      const enVariants = getCountryNameVariantsByIso3("DEU", "en");
      expect(enVariants).toContain("Germany");

      const esVariants = getCountryNameVariantsByIso3("DEU", "es");
      expect(esVariants).toContain("Alemania");
    });

    it("provides capital variants including French aliases", () => {
      const swissCapitalsFr = getCountryCapitalVariantsByIso3("CHE", "fr");
      expect(swissCapitalsFr).toContain("Berne");

      const usaCapitalsFr = getCountryCapitalVariantsByIso3("USA", "fr");
      expect(usaCapitalsFr).toContain("Washington");
      expect(usaCapitalsFr).toContain("Washington DC");

      const ukrCapitalsFr = getCountryCapitalVariantsByIso3("UKR", "fr");
      expect(ukrCapitalsFr).toContain("Kyiv");
      expect(ukrCapitalsFr).toContain("Kiev");
    });
  });
});
