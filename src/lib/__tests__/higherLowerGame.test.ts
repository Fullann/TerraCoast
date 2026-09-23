import { describe, it, expect } from "vitest";
import {
  getEligibleCountriesForHigherLower,
  getMetricValue,
  formatMetricValue,
  evaluateHigherLowerChoice,
  initHigherLowerGame,
  pickNextChallenger,
} from "../higherLowerGame";
import { getAllAtlasCountries } from "../atlasData";

describe("higherLowerGame engine", () => {
  it("filters eligible countries with solid data", () => {
    const list = getEligibleCountriesForHigherLower("fr");
    expect(list.length).toBeGreaterThan(100);
    expect(list.every((c) => c.population > 100000 && c.areaKm2 > 100)).toBe(true);
  });

  it("extracts metric values correctly", () => {
    const all = getAllAtlasCountries("fr");
    const france = all.find((c) => c.iso3 === "FRA")!;

    expect(getMetricValue(france, "population")).toBe(france.population);
    expect(getMetricValue(france, "area_km2")).toBe(france.areaKm2);
  });

  it("formats metric values with units", () => {
    expect(formatMetricValue(1000000, "population", "fr")).toContain("hab.");
    expect(formatMetricValue(50000, "area_km2", "fr")).toContain("km²");
  });

  it("evaluates user choices higher and lower correctly", () => {
    const all = getAllAtlasCountries("fr");
    const usa = all.find((c) => c.iso3 === "USA")!;
    const switzerland = all.find((c) => c.iso3 === "CHE")!;

    // Switzerland vs USA : USA is higher population
    const resHigher = evaluateHigherLowerChoice(switzerland, usa, "population", "higher");
    expect(resHigher.isCorrect).toBe(true);

    const resLower = evaluateHigherLowerChoice(switzerland, usa, "population", "lower");
    expect(resLower.isCorrect).toBe(false);

    // USA vs Switzerland : Switzerland is lower population
    const resSwitzerlandLower = evaluateHigherLowerChoice(usa, switzerland, "population", "lower");
    expect(resSwitzerlandLower.isCorrect).toBe(true);
  });

  it("initializes a valid round with 2 distinct countries", () => {
    const round = initHigherLowerGame("population", "fr");
    expect(round.currentCountry).toBeDefined();
    expect(round.nextCountry).toBeDefined();
    expect(round.currentCountry.iso3).not.toBe(round.nextCountry.iso3);
    expect(round.activeMetric).toBe("population");
  });

  it("picks challengers without repeating current country", () => {
    const all = getAllAtlasCountries("fr");
    const fra = all.find((c) => c.iso3 === "FRA")!;
    const challenger = pickNextChallenger(fra, "fr", [fra.iso3]);
    expect(challenger.iso3).not.toBe("FRA");
  });
});
