import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Database } from "../database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function fetchUserFriends(userId: string): Promise<Profile[]> {
  if (!userId) return [];

  const [senderRes, receiverRes] = await Promise.all([
    supabase
      .from("friendships")
      .select(
        "friend_profile:profiles!friendships_friend_id_fkey(id, pseudo, avatar_url, frame_style, experience_points, monthly_score, duel_rating, level, role, is_banned)"
      )
      .eq("user_id", userId)
      .eq("status", "accepted"),
    supabase
      .from("friendships")
      .select(
        "user_profile:profiles!friendships_user_id_fkey(id, pseudo, avatar_url, frame_style, experience_points, monthly_score, duel_rating, level, role, is_banned)"
      )
      .eq("friend_id", userId)
      .eq("status", "accepted"),
  ]);

  if (senderRes.error) {
    console.error("Error fetching sender friendships:", senderRes.error);
  }
  if (receiverRes.error) {
    console.error("Error fetching receiver friendships:", receiverRes.error);
  }

  const senderFriends = (senderRes.data || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((item: any) => item.friend_profile as Profile | null)
    .filter((p): p is Profile => p !== null && p !== undefined && !p.is_banned);

  const receiverFriends = (receiverRes.data || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((item: any) => item.user_profile as Profile | null)
    .filter((p): p is Profile => p !== null && p !== undefined && !p.is_banned);

  const map = new Map<string, Profile>();
  for (const friend of [...senderFriends, ...receiverFriends]) {
    if (!map.has(friend.id)) {
      map.set(friend.id, friend);
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    (a.pseudo || "").localeCompare(b.pseudo || "")
  );
}

export function useFriendsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ["user_friends", userId],
    queryFn: () => (userId ? fetchUserFriends(userId) : Promise.resolve([])),
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes en mémoire
    gcTime: 15 * 60 * 1000,
  });
}

export function useInvalidateFriends() {
  const queryClient = useQueryClient();
  return (userId?: string) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ["user_friends", userId] });
    } else {
      queryClient.invalidateQueries({ queryKey: ["user_friends"] });
    }
  };
}
