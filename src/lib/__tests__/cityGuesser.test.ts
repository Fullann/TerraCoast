import { describe, it, expect } from "vitest";
import {
  METROPOLISES_DATABASE,
  calculateAltitudeScore,
  getRandomCityGuesserSession,
} from "../cityGuesserData";

describe("City Guesser / Satellite Zoom-In Engine", () => {
  it("should contain at least 15 metropolis entries with valid coordinates and distractors", () => {
    expect(METROPOLISES_DATABASE.length).toBeGreaterThanOrEqual(15);
    for (const city of METROPOLISES_DATABASE) {
      expect(city.id).toBeTruthy();
      expect(city.name).toBeTruthy();
      expect(city.country).toBeTruthy();
      expect(city.distractors.length).toBe(3);
      expect(city.distractors).not.toContain(city.name);
      expect(city.lat).toBeGreaterThanOrEqual(-90);
      expect(city.lat).toBeLessThanOrEqual(90);
      expect(city.lng).toBeGreaterThanOrEqual(-180);
      expect(city.lng).toBeLessThanOrEqual(180);
    }
  });

  it("calculateAltitudeScore gives higher reward when buzzing earlier at higher altitude", () => {
    // 1.0 = High Orbit (25 000 km)
    const orbitScore = calculateAltitudeScore(1.0);
    expect(orbitScore).toBe(5000);

    // 0.7 = Stratosphere
    const stratoScore = calculateAltitudeScore(0.7);
    expect(stratoScore).toBeGreaterThan(3000);
    expect(stratoScore).toBeLessThan(5000);

    // 0.2 = Low altitude
    const lowScore = calculateAltitudeScore(0.2);
    expect(lowScore).toBeGreaterThan(500);
    expect(lowScore).toBeLessThan(stratoScore);

    // 0.0 = Ground level
    const groundScore = calculateAltitudeScore(0.0);
    expect(groundScore).toBe(500);
  });

  it("getRandomCityGuesserSession returns non-repeating unique rounds", () => {
    const session = getRandomCityGuesserSession(5);
    expect(session.length).toBe(5);
    const ids = new Set(session.map((c) => c.id));
    expect(ids.size).toBe(5);
  });
});
