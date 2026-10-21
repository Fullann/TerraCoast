import { describe, it, expect } from "vitest";
import {
  BORDER_PUZZLE_CLUSTERS,
  getRandomPuzzleCluster,
  prepareBorderPuzzle,
} from "../borderPuzzleData";

describe("Border Puzzle Data & Projection Engine", () => {
  it("should define at least 10 balanced geographical clusters", () => {
    expect(BORDER_PUZZLE_CLUSTERS.length).toBeGreaterThanOrEqual(10);
  });

  it("every cluster should contain between 3 and 6 member countries", () => {
    for (const cluster of BORDER_PUZZLE_CLUSTERS) {
      expect(cluster.id).toBeTruthy();
      expect(cluster.name).toBeTruthy();
      expect(cluster.countryIso3s.length).toBeGreaterThanOrEqual(3);
      expect(cluster.countryIso3s.length).toBeLessThanOrEqual(6);
    }
  });

  it("getRandomPuzzleCluster should return a valid cluster", () => {
    const random = getRandomPuzzleCluster();
    expect(random).toBeDefined();
    expect(BORDER_PUZZLE_CLUSTERS).toContainEqual(random);
  });

  it("prepareBorderPuzzle should project countries into normalized SVG viewBox and paths", () => {
    const cluster = BORDER_PUZZLE_CLUSTERS[0];
    const prepared = prepareBorderPuzzle(cluster.id, 640, 440);

    expect(prepared).not.toBeNull();
    if (!prepared) return;

    expect(prepared.cluster.id).toBe(cluster.id);
    expect(prepared.viewBox).toBe("0 0 640 440");
    expect(prepared.pieces.length).toBe(cluster.countryIso3s.length);

    // Each piece has pathD, valid centroid within bounds, and colors
    for (const piece of prepared.pieces) {
      expect(piece.iso3).toBeTruthy();
      expect(piece.name).toBeTruthy();
      expect(piece.pathD).toMatch(/^M/);
      expect(piece.centroid[0]).toBeGreaterThanOrEqual(0);
      expect(piece.centroid[0]).toBeLessThanOrEqual(640);
      expect(piece.centroid[1]).toBeGreaterThanOrEqual(0);
      expect(piece.centroid[1]).toBeLessThanOrEqual(440);
      expect(piece.color).toBeTruthy();
    }
  });
});
