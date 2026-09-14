import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchUserFriends } from "../friendQueries";
import { supabase } from "../../supabase";

vi.mock("../../supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe("friendQueries - fetchUserFriends", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array if userId is empty", async () => {
    const friends = await fetchUserFriends("");
    expect(friends).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("merges sender and receiver friendships, filters banned or null profiles, deduplicates and sorts alphabetically", async () => {
    const senderData = [
      {
        friend_profile: {
          id: "u2",
          pseudo: "Zoe",
          avatar_url: null,
          frame_style: "default",
          experience_points: 100,
          monthly_score: 50,
          duel_rating: 1200,
          level: 2,
          role: "user",
          is_banned: false,
        },
      },
      {
        friend_profile: {
          id: "u3",
          pseudo: "BannedUser",
          is_banned: true,
        },
      },
      {
        friend_profile: null,
      },
    ];

    const receiverData = [
      {
        user_profile: {
          id: "u1",
          pseudo: "Alice",
          avatar_url: "https://example.com/alice.png",
          frame_style: "gold",
          experience_points: 500,
          monthly_score: 120,
          duel_rating: 1500,
          level: 5,
          role: "user",
          is_banned: false,
        },
      },
      {
        // duplicate of Zoe
        user_profile: {
          id: "u2",
          pseudo: "Zoe",
          avatar_url: null,
          frame_style: "default",
          experience_points: 100,
          monthly_score: 50,
          duel_rating: 1200,
          level: 2,
          role: "user",
          is_banned: false,
        },
      },
    ];

    const createChain = (data: unknown, error: unknown = null) => {
      const eqMock2 = vi.fn().mockResolvedValue({ data, error });
      const eqMock1 = vi.fn().mockReturnValue({ eq: eqMock2 });
      const selectMock = vi.fn().mockReturnValue({ eq: eqMock1 });
      return { select: selectMock };
    };

    const senderChain = createChain(senderData);
    const receiverChain = createChain(receiverData);

    let callCount = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from as any).mockImplementation((table: string) => {
      expect(table).toBe("friendships");
      callCount++;
      if (callCount === 1) return senderChain;
      return receiverChain;
    });

    const result = await fetchUserFriends("current-user-id");

    expect(result).toHaveLength(2);
    // Should be sorted alphabetically: Alice, Zoe
    expect(result[0].pseudo).toBe("Alice");
    expect(result[0].id).toBe("u1");
    expect(result[1].pseudo).toBe("Zoe");
    expect(result[1].id).toBe("u2");
  });

  it("handles errors gracefully and returns remaining friends", async () => {
    const senderChain = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Database error" },
          }),
        }),
      }),
    };

    const receiverData = [
      {
        user_profile: {
          id: "u4",
          pseudo: "Charlie",
          is_banned: false,
        },
      },
    ];

    const receiverChain = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: receiverData,
            error: null,
          }),
        }),
      }),
    };

    let callCount = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from as any).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? senderChain : receiverChain;
    });

    const result = await fetchUserFriends("user-with-error");
    expect(result).toHaveLength(1);
    expect(result[0].pseudo).toBe("Charlie");
  });
});
