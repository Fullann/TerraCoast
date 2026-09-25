import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateHaversineDistance,
  calculateGeoScore,
  calculateCompassBearing,
  evaluateGuess,
  startNewGeoDetectiveGame,
  getGeoDetectiveRank,
  getGeoDetectiveHighScore,
  saveGeoDetectiveHighScore,
  resetGeoDetectiveHighScore,
} from "../geoDetectiveGame";
import { SATELLITE_LOCATIONS } from "../geoDetectiveData";

describe("geoDetectiveGame engine", () => {
  beforeEach(() => {
    resetGeoDetectiveHighScore();
  });

  it("calculates accurate geodetic Haversine distance", () => {
    // Paris (48.8566, 2.3522) to London (51.5074, -0.1278) ~ 343 km
    const distParisLondon = calculateHaversineDistance(
      48.8566,
      2.3522,
      51.5074,
      -0.1278
    );
    expect(distParisLondon).toBeGreaterThan(330);
    expect(distParisLondon).toBeLessThan(360);

    // Distance to same point should be 0
    expect(calculateHaversineDistance(29.9792, 31.1342, 29.9792, 31.1342)).toBe(0);
  });

  it("computes accurate GeoGuessr scoring scale", () => {
    // Perfect guess (<= 25 km) gives full 5 000 points
    expect(calculateGeoScore(0)).toBe(5000);
    expect(calculateGeoScore(15)).toBe(5000);
    expect(calculateGeoScore(25)).toBe(5000);

    // Exponential dropoff
    const score100km = calculateGeoScore(100);
    const score500km = calculateGeoScore(500);
    const score1500km = calculateGeoScore(1500);
    const score5000km = calculateGeoScore(5000);
    const score15000km = calculateGeoScore(15000);

    expect(score100km).toBeGreaterThan(4600);
    expect(score500km).toBeGreaterThan(3500);
    expect(score1500km).toBeGreaterThan(2000);
    expect(score5000km).toBeLessThan(1000);
    expect(score15000km).toBeLessThan(10);

    // Clue penalty subtracts 250 pts
    expect(calculateGeoScore(10, true)).toBe(4750);
    expect(calculateGeoScore(100, true)).toBe(score100km - 250);
  });

  it("calculates compass orientation and arrow correctly", () => {
    // Moving from Equator/Greenwich northwards towards London
    const bearing = calculateCompassBearing(0, 0, 51.5, 0);
    expect(bearing.direction).toBe("Nord");
    expect(bearing.arrow).toBe("⬆️");

    // Moving eastwards
    const bearingEast = calculateCompassBearing(0, 0, 0, 50);
    expect(bearingEast.direction).toBe("Est");
    expect(bearingEast.arrow).toBe("➡️");
  });

  it("evaluates a guess and returns full metrics", () => {
    const target = SATELLITE_LOCATIONS[0]; // Pyramides de Gizeh (29.9792, 31.1342)
    // Guess in Cairo center (30.0444, 31.2357) ~ 12 km
    const guess = evaluateGuess(target, 30.0444, 31.2357);

    expect(guess.distanceKm).toBeLessThan(25);
    expect(guess.score).toBe(5000);
    expect(guess.compassDirection).toBeTruthy();
    expect(guess.compassArrow).toBeTruthy();
  });

  it("generates a 5-round session without duplicates", () => {
    const game = startNewGeoDetectiveGame("all", 5);

    expect(game.rounds).toHaveLength(5);
    expect(game.currentRoundIndex).toBe(0);
    expect(game.totalScore).toBe(0);
    expect(game.isGameOver).toBe(false);

    // Verify all 5 locations in the session are unique
    const locationIds = game.rounds.map((r) => r.location.id);
    const uniqueIds = new Set(locationIds);
    expect(uniqueIds.size).toBe(5);
  });

  it("assigns appropriate rank titles according to final score", () => {
    expect(getGeoDetectiveRank(24500).title).toBe("Astronaute Suprême");
    expect(getGeoDetectiveRank(21000).title).toBe("Geo-Détective d'Élite");
    expect(getGeoDetectiveRank(16000).title).toBe("Explorateur Vétéran");
    expect(getGeoDetectiveRank(11000).title).toBe("Navigateur Averti");
    expect(getGeoDetectiveRank(4000).title).toBe("Apprenti des Terres");
  });

  it("persists high score in storage only when broken", () => {
    expect(getGeoDetectiveHighScore()).toBe(0);

    const isRecord1 = saveGeoDetectiveHighScore(18500);
    expect(isRecord1).toBe(true);
    expect(getGeoDetectiveHighScore()).toBe(18500);

    // Lower score should not overwrite
    const isRecord2 = saveGeoDetectiveHighScore(14000);
    expect(isRecord2).toBe(false);
    expect(getGeoDetectiveHighScore()).toBe(18500);

    // Higher score breaks record
    const isRecord3 = saveGeoDetectiveHighScore(22100);
    expect(isRecord3).toBe(true);
    expect(getGeoDetectiveHighScore()).toBe(22100);
  });
});
