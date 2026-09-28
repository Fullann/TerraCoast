import { describe, it, expect } from "vitest";
import {
  encodeGhostRunChallenge,
  decodeGhostRunChallenge,
  getGhostRunUrl,
  generateGhostRunShare,
  saveSentGhostRun,
  getSentGhostRuns,
  recordCompletedGhostRun,
  getCompletedGhostRuns,
  type GhostRunChallenge,
  type GhostRunResult,
} from "../ghostRunManager";

describe("ghostRunManager", () => {
  const mockChallenge: GhostRunChallenge = {
    id: "ghost_test_123",
    quizId: "quiz_europe_capitals",
    quizTitle: "Capitales d'Europe Express",
    quizCategory: "Europe",
    challengerPseudo: "Alexandre",
    challengerScore: 1850,
    challengerAccuracy: 95,
    challengerTimeSeconds: 42,
    createdAt: new Date().toISOString(),
  };

  it("should encode and decode a challenge without data corruption", () => {
    const encoded = encodeGhostRunChallenge(mockChallenge);
    expect(typeof encoded).toBe("string");
    expect(encoded.length).toBeGreaterThan(10);

    const decoded = decodeGhostRunChallenge(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe(mockChallenge.id);
    expect(decoded?.challengerScore).toBe(1850);
    expect(decoded?.quizTitle).toBe("Capitales d'Europe Express");
    expect(decoded?.challengerPseudo).toBe("Alexandre");
  });

  it("should generate valid WhatsApp and social share links", () => {
    const url = getGhostRunUrl(mockChallenge);
    expect(url).toContain(mockChallenge.quizId);

    const share = generateGhostRunShare(mockChallenge);
    expect(share.url).toContain(mockChallenge.quizId);
    expect(share.message).toContain("1850 pts");
    expect(share.message).toContain("Capitales d'Europe Express");
    expect(share.whatsappUrl).toContain("https://wa.me/?text=");
  });

  it("should save and retrieve sent ghost runs", () => {
    saveSentGhostRun(mockChallenge);
    const sent = getSentGhostRuns();
    expect(sent.some((g) => g.id === mockChallenge.id)).toBe(true);
  });

  it("should record completed ghost run matches", () => {
    const mockResult: GhostRunResult = {
      id: "res_123",
      challengeId: mockChallenge.id,
      quizId: mockChallenge.quizId,
      quizTitle: mockChallenge.quizTitle,
      challengerPseudo: "Alexandre",
      challengerScore: 1850,
      opponentPseudo: "Camille",
      opponentScore: 1920,
      opponentAccuracy: 100,
      opponentWon: true,
      scoreDifference: 70,
      completedAt: new Date().toISOString(),
    };

    recordCompletedGhostRun(mockResult);
    const completed = getCompletedGhostRuns();
    expect(completed.some((c) => c.id === "res_123")).toBe(true);
  });
});
