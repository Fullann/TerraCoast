import { describe, it, expect } from "vitest";
import {
  getTravleGraph,
  findShortestPath,
  startTravleGame,
  submitTravleGuess,
  generateTravleShareText,
} from "../travleGame";

describe("travleGame engine", () => {
  it("should build valid adjacency graph with reciprocal borders", () => {
    const { adjacency, countriesMap } = getTravleGraph("fr");
    expect(countriesMap.has("FRA")).toBe(true);
    expect(countriesMap.has("ESP")).toBe(true);

    const franceNeighbors = adjacency.get("FRA");
    expect(franceNeighbors).toBeDefined();
    expect(franceNeighbors?.has("ESP")).toBe(true);
    expect(franceNeighbors?.has("DEU")).toBe(true);
    expect(franceNeighbors?.has("ITA")).toBe(true);
    expect(franceNeighbors?.has("CHE")).toBe(true);
  });

  it("should find valid shortest path between Portugal and France", () => {
    const path = findShortestPath("PRT", "FRA");
    expect(path).toBeDefined();
    expect(path).toEqual(["PRT", "ESP", "FRA"]);
  });

  it("should start a travle session and accept valid border steps", () => {
    const session = startTravleGame(false, { start: "PRT", target: "FRA" });
    expect(session.startCountry.iso3).toBe("PRT");
    expect(session.targetCountry.iso3).toBe("FRA");
    expect(session.path.length).toBe(1);

    // Tentative invalide (non voisin)
    const { session: s1, attempt: a1 } = submitTravleGuess(session, "Allemagne");
    expect(a1.status).toBe("not_adjacent");
    expect(s1.path.length).toBe(1);

    // Tentative valide (Espagne)
    const { session: s2, attempt: a2 } = submitTravleGuess(s1, "Espagne");
    expect(a2.status).toBe("success");
    expect(s2.path.length).toBe(2);
    expect(s2.currentCountry.iso3).toBe("ESP");

    // Tentative finale gagnante (France)
    const { session: s3, attempt: a3 } = submitTravleGuess(s2, "France");
    expect(a3.status).toBe("success");
    expect(s3.isFinished).toBe(true);
    expect(s3.won).toBe(true);

    const share = generateTravleShareText(s3);
    expect(share).toContain("TerraCoast Travle");
    expect(share).toContain("Gagné");
  });
});
