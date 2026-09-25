import { describe, it, expect, beforeEach } from "vitest";
import {
  getFederationById,
  getUserFederation,
  saveUserFederation,
  resolveProfileFederation,
  aggregateFederationLeaderboard,
  FEDERATIONS_LIST,
} from "../federations";

describe("Federations & Nations System", () => {
  beforeEach(() => {
    saveUserFederation("CH");
  });

  describe("getFederationById", () => {
    it("should retrieve a federation by its code", () => {
      const ch = getFederationById("CH");
      expect(ch.name).toBe("Suisse");
      expect(ch.flagEmoji).toBe("🇨🇭");

      const fr = getFederationById("fr");
      expect(fr.name).toBe("France");
      expect(fr.flagEmoji).toBe("🇫🇷");
    });

    it("should fallback to Switzerland for unknown ID", () => {
      const fallback = getFederationById("UNKNOWN_123");
      expect(fallback.id).toBe("CH");
    });
  });

  describe("User federation storage", () => {
    it("should persist and retrieve user federation", () => {
      saveUserFederation("CA", "user-123");
      const fed = getUserFederation("user-123");
      expect(fed.id).toBe("CA");
      expect(fed.flagEmoji).toBe("🇨🇦");
    });
  });

  describe("resolveProfileFederation", () => {
    it("should return explicit federation if set", () => {
      const fed = resolveProfileFederation({
        id: "abc",
        pseudo: "Alice",
        federation: "CH-VD",
      });
      expect(fed.id).toBe("CH-VD");
      expect(fed.name).toBe("Canton de Vaud");
    });

    it("should deterministically assign a federation if none set", () => {
      const fed1 = resolveProfileFederation({ id: "user_1", pseudo: "Bob" });
      const fed2 = resolveProfileFederation({ id: "user_1", pseudo: "Bob" });
      expect(fed1.id).toBe(fed2.id);
    });
  });

  describe("aggregateFederationLeaderboard", () => {
    it("should aggregate total scores and compute average and ranks correctly", () => {
      const mockProfiles = [
        {
          id: "p1",
          pseudo: "PlayerOne",
          federation: "CH",
          experience_points: 1000,
        },
        {
          id: "p2",
          pseudo: "PlayerTwo",
          federation: "CH",
          experience_points: 500,
        },
        {
          id: "p3",
          pseudo: "PlayerThree",
          federation: "FR",
          experience_points: 2000,
        },
      ];

      const leaderboard = aggregateFederationLeaderboard(mockProfiles, "alltime");
      expect(leaderboard.length).toBe(FEDERATIONS_LIST.length);

      // France has 2000 pts -> Rank 1
      const rank1 = leaderboard[0];
      expect(rank1.federation.id).toBe("FR");
      expect(rank1.rank).toBe(1);
      expect(rank1.totalScore).toBe(2000);
      expect(rank1.membersCount).toBe(1);
      expect(rank1.averageScore).toBe(2000);
      expect(rank1.topPlayerPseudo).toBe("PlayerThree");

      // Suisse has 1500 pts -> Rank 2
      const rank2 = leaderboard[1];
      expect(rank2.federation.id).toBe("CH");
      expect(rank2.rank).toBe(2);
      expect(rank2.totalScore).toBe(1500);
      expect(rank2.membersCount).toBe(2);
      expect(rank2.averageScore).toBe(750);
      expect(rank2.topPlayerPseudo).toBe("PlayerOne");
      expect(rank2.topPlayerScore).toBe(1000);
    });
  });
});
