import { describe, it, expect } from "vitest";
import {
  calculateHaversineDistance,
  calculateCompassBearing,
  calculateProximityPercent,
  evaluateGuess,
  getSilhouetteFeatureData,
  getDailySilhouetteCountry,
  getHintsForAttempt,
} from "../silhouetteGame";
import { getAllAtlasCountries } from "../atlasData";

describe("silhouetteGame engine", () => {
  it("calculates accurate Haversine distance", () => {
    // Paris (48.8566, 2.3522) to London (51.5074, -0.1278) ~ 343 km
    const dist = calculateHaversineDistance(48.8566, 2.3522, 51.5074, -0.1278);
    expect(dist).toBeGreaterThan(330);
    expect(dist).toBeLessThan(360);

    // Distance to same point is 0
    expect(calculateHaversineDistance(10, 20, 10, 20)).toBe(0);
  });

  it("calculates compass bearing correctly", () => {
    // Going North (0, 0) to (10, 0)
    const north = calculateCompassBearing(0, 0, 10, 0);
    expect(north.direction).toBe("N");
    expect(north.arrow).toBe("⬆️");

    // Going East (0, 0) to (0, 10)
    const east = calculateCompassBearing(0, 0, 0, 10);
    expect(east.direction).toBe("E");
    expect(east.arrow).toBe("➡️");

    // Going South (10, 0) to (0, 0)
    const south = calculateCompassBearing(10, 0, 0, 0);
    expect(south.direction).toBe("S");
    expect(south.arrow).toBe("⬇️");
  });

  it("calculates proximity percentage properly", () => {
    expect(calculateProximityPercent(0)).toBe(100);
    expect(calculateProximityPercent(20015)).toBe(0);
    expect(calculateProximityPercent(1000)).toBeGreaterThan(90);
  });

  it("evaluates guesses accurately", () => {
    const all = getAllAtlasCountries("fr");
    const france = all.find((c) => c.iso3 === "FRA")!;
    const germany = all.find((c) => c.iso3 === "DEU")!;

    const exact = evaluateGuess(france, france);
    expect(exact.isCorrect).toBe(true);
    expect(exact.distanceKm).toBe(0);
    expect(exact.proximityPercent).toBe(100);

    const diff = evaluateGuess(germany, france);
    expect(diff.isCorrect).toBe(false);
    expect(diff.distanceKm).toBeGreaterThan(200);
    expect(diff.proximityPercent).toBeGreaterThan(80);
  });

  it("extracts silhouette feature data and bounds for France and Japan", () => {
    const fraData = getSilhouetteFeatureData("FRA");
    expect(fraData).not.toBeNull();
    expect(fraData?.bounds.maxLng).toBeGreaterThan(fraData!.bounds.minLng);
    expect(fraData?.recommendedScale).toBeGreaterThan(100);

    const jpnData = getSilhouetteFeatureData("JPN");
    expect(jpnData).not.toBeNull();
  });

  it("determines deterministic daily silhouette country", () => {
    const day1 = getDailySilhouetteCountry("2026-03-27", "fr");
    const day1Again = getDailySilhouetteCountry("2026-03-27", "fr");
    const day2 = getDailySilhouetteCountry("2026-03-28", "fr");

    expect(day1.iso3).toBe(day1Again.iso3);
    expect(day1.name).toBeDefined();
    expect(day2.name).toBeDefined();
  });

  it("generates progressive hints per attempt", () => {
    const all = getAllAtlasCountries("fr");
    const canada = all.find((c) => c.iso3 === "CAN")!;

    expect(getHintsForAttempt(canada, 0)).toHaveLength(0);
    const hints1 = getHintsForAttempt(canada, 1);
    expect(hints1).toHaveLength(1);
    expect(hints1[0].type).toBe("continent");

    const hints3 = getHintsForAttempt(canada, 3);
    expect(hints3).toHaveLength(3);
    expect(hints3[2].type).toBe("capital");
    expect(hints3[2].value).toBe(canada.capital);
  });
});
