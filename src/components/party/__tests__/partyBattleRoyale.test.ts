import { describe, it, expect } from "vitest";
import { computeBattleRoyaleEliminations, type PartyPlayer } from "../types";

function createPlayer(id: string, score: number, isEliminated: boolean = false): PartyPlayer {
  return {
    id,
    guestId: id,
    pseudo: `Player_${id}`,
    score,
    streak: 0,
    isHost: false,
    isConnected: true,
    isEliminated,
  };
}

describe("Party Battle Royale Elimination Logic", () => {
  it("should not eliminate players if active players count <= 2 (protecting finale)", () => {
    const players: PartyPlayer[] = [
      createPlayer("p1", 500),
      createPlayer("p2", 300),
    ];

    const result = computeBattleRoyaleEliminations(players, 1, 0);
    expect(result.newlyEliminatedIds).toHaveLength(0);
    expect(result.remainingCount).toBe(2);
    expect(result.updatedPlayers[0].isEliminated).toBeFalsy();
    expect(result.updatedPlayers[1].isEliminated).toBeFalsy();
  });

  it("should eliminate the lowest scoring player in a 5-player match with eliminatedPerRound = 1", () => {
    const players: PartyPlayer[] = [
      createPlayer("p1", 800),
      createPlayer("p2", 1200),
      createPlayer("p3", 200), // lowest
      createPlayer("p4", 950),
      createPlayer("p5", 400),
    ];

    const result = computeBattleRoyaleEliminations(players, 1, 1);
    expect(result.newlyEliminatedIds).toEqual(["p3"]);
    expect(result.remainingCount).toBe(4);

    const eliminatedPlayer = result.updatedPlayers.find((p) => p.guestId === "p3");
    expect(eliminatedPlayer?.isEliminated).toBe(true);
    expect(eliminatedPlayer?.eliminatedAtRound).toBe(1);

    const survivor = result.updatedPlayers.find((p) => p.guestId === "p2");
    expect(survivor?.isEliminated).toBeFalsy();
  });

  it("should eliminate multiple lowest players when eliminatedPerRound is > 1", () => {
    const players: PartyPlayer[] = [
      createPlayer("p1", 100), // lowest
      createPlayer("p2", 200), // 2nd lowest
      createPlayer("p3", 800),
      createPlayer("p4", 900),
      createPlayer("p5", 1000),
      createPlayer("p6", 1100),
    ];

    const result = computeBattleRoyaleEliminations(players, 2, 2);
    expect(result.newlyEliminatedIds).toEqual(["p1", "p2"]);
    expect(result.remainingCount).toBe(4);
  });

  it("should ignore already eliminated players and only eliminate from remaining active players", () => {
    const players: PartyPlayer[] = [
      createPlayer("p1", 50, true), // already eliminated in round 1
      createPlayer("p2", 600),
      createPlayer("p3", 300), // lowest active
      createPlayer("p4", 900),
    ];

    const result = computeBattleRoyaleEliminations(players, 1, 2);
    expect(result.newlyEliminatedIds).toEqual(["p3"]);
    expect(result.remainingCount).toBe(2);

    const p1 = result.updatedPlayers.find((p) => p.guestId === "p1");
    expect(p1?.isEliminated).toBe(true);
    const p3 = result.updatedPlayers.find((p) => p.guestId === "p3");
    expect(p3?.isEliminated).toBe(true);
    expect(p3?.eliminatedAtRound).toBe(2);
  });
});
