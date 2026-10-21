import { describe, it, expect } from "vitest";
import {
  HISTORICAL_ARCHIVES,
  getRandomTimeGuessrSession,
  calculateHaversineDistanceKm,
  calculateSpatialScore,
  calculateTemporalScore,
} from "../timeGuessrData";

describe("TimeGuessr Géo-Historique Engine", () => {
  it("should contain at least 15 historical items between 1850 and 2024", () => {
    expect(HISTORICAL_ARCHIVES.length).toBeGreaterThanOrEqual(15);
    for (const item of HISTORICAL_ARCHIVES) {
      expect(item.id).toBeTruthy();
      expect(item.year).toBeGreaterThanOrEqual(1850);
      expect(item.year).toBeLessThanOrEqual(2024);
      expect(item.lat).toBeGreaterThanOrEqual(-90);
      expect(item.lat).toBeLessThanOrEqual(90);
      expect(item.lng).toBeGreaterThanOrEqual(-180);
      expect(item.lng).toBeLessThanOrEqual(180);
      expect(item.imageUrl).toMatch(/^https?:\/\//);
    }
  });

  it("should accurately calculate Haversine distance", () => {
    // Paris (48.8566, 2.3522) to London (51.5074, -0.1278) ~343 km
    const distKm = calculateHaversineDistanceKm(48.8566, 2.3522, 51.5074, -0.1278);
    expect(distKm).toBeGreaterThan(320);
    expect(distKm).toBeLessThan(370);
  });

  it("calculateSpatialScore: 0 km should yield maximum 2500 pts", () => {
    const perfectScore = calculateSpatialScore(0);
    expect(perfectScore).toBe(2500);

    const closeScore = calculateSpatialScore(15);
    expect(closeScore).toBe(2500);

    const midScore = calculateSpatialScore(500);
    expect(midScore).toBeGreaterThan(1500);
    expect(midScore).toBeLessThan(2500);

    const farScore = calculateSpatialScore(12000);
    expect(farScore).toBeLessThan(100);
  });

  it("calculateTemporalScore: exact year yields 2500 pts", () => {
    const perfect = calculateTemporalScore(1969, 1969);
    expect(perfect).toBe(2500);

    const oneYear = calculateTemporalScore(1970, 1969);
    expect(oneYear).toBe(2400);

    const fiveYears = calculateTemporalScore(1974, 1969);
    expect(fiveYears).toBe(2000);

    const centuryOff = calculateTemporalScore(1869, 1969);
    expect(centuryOff).toBe(0);
  });

  it("getRandomTimeGuessrSession returns the requested number of unique items", () => {
    const session = getRandomTimeGuessrSession(5);
    expect(session.length).toBe(5);
    const ids = new Set(session.map((s) => s.id));
    expect(ids.size).toBe(5);
  });
});
