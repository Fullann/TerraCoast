import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import type {
  DuelFeatureFlag,
  DuelMatchmakingQueue,
  DuelWithMaybeDetails,
  DuelWithDetails,
  InvitationWithMaybeDetails,
  InvitationWithDetails,
  Profile,
  Quiz,
} from "../types";

interface UseDuelsDataParams {
  profile: Profile | null;
  activeTab: "invitations" | "active" | "completed" | "matchmaking";
  rankedOnlyHistory: boolean;
}

export function useDuelsData({
  profile,
  activeTab,
  rankedOnlyHistory,
}: UseDuelsDataParams) {
  const [activeDuels, setActiveDuels] = useState<DuelWithDetails[]>([]);
  const [completedDuels, setCompletedDuels] = useState<DuelWithDetails[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<
    InvitationWithDetails[]
  >([]);
  const [sentInvitations, setSentInvitations] = useState<InvitationWithDetails[]>(
    []
  );
  const [viewedDuels, setViewedDuels] = useState<Set<string>>(new Set());
  const [matchmakingQueueEntry, setMatchmakingQueueEntry] =
    useState<DuelMatchmakingQueue | null>(null);
  const [matchmakingQuizzes, setMatchmakingQuizzes] = useState<Quiz[]>([]);
  const [duelFeatureFlags, setDuelFeatureFlags] = useState({
    anti_repeat: true,
    progressive_expand: true,
    show_opponent_mmr: true,
  });

  const isDuelWithDetails = (
    duel: DuelWithMaybeDetails
  ): duel is DuelWithDetails =>
    Boolean(duel.player1 && duel.player2 && duel.quizzes) &&
    !duel.player1!.is_banned &&
    !duel.player2!.is_banned;

  const isInvitationWithDetails = (
    invitation: InvitationWithMaybeDetails
  ): invitation is InvitationWithDetails =>
    Boolean(invitation.from_user && invitation.to_user && invitation.quizzes) &&
    !invitation.from_user!.is_banned &&
    !invitation.to_user!.is_banned;

  const loadDuels = useCallback(async () => {
    if (!profile) return;

    const { data: active } = await supabase
      .from("duels")
      .select(
        "*, quizzes(*), player1:profiles!duels_player1_id_fkey(*), player2:profiles!duels_player2_id_fkey(*)"
      )
      .or(`player1_id.eq.${profile.id},player2_id.eq.${profile.id}`)
      .in("status", ["pending", "in_progress"])
      .order("created_at", { ascending: false });

    const activeRows = (active ?? []) as DuelWithMaybeDetails[];
    const filteredActive = activeRows.filter(isDuelWithDetails);
    if (filteredActive) setActiveDuels(filteredActive as DuelWithDetails[]);

    const { data: completed } = await supabase
      .from("duels")
      .select(
        "*, quizzes(*), player1:profiles!duels_player1_id_fkey(*), player2:profiles!duels_player2_id_fkey(*)"
      )
      .or(`player1_id.eq.${profile.id},player2_id.eq.${profile.id}`)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(10);

    if (completed) {
      const completedRows = (completed ?? []) as DuelWithMaybeDetails[];
      const filteredCompleted = completedRows.filter(isDuelWithDetails);

      const sessionIds = Array.from(
        new Set(
          filteredCompleted
            .flatMap((duel) => [duel.player1_session_id, duel.player2_session_id])
            .filter((id): id is string => Boolean(id))
        )
      );

      const { data: sessions } =
        sessionIds.length > 0
          ? await supabase
              .from("game_sessions")
              .select("id, score, correct_answers, total_questions")
              .in("id", sessionIds)
          : { data: [] };

      type SessionLite = {
        id: string;
        score: number;
        correct_answers: number;
        total_questions: number;
      };
      const sessionsById = new Map<string, SessionLite>(
        ((sessions ?? []) as SessionLite[]).map((session) => [session.id, session])
      );

      const enrichedDuels = filteredCompleted.map((duel) => ({
        ...duel,
        player1_session: duel.player1_session_id
          ? sessionsById.get(duel.player1_session_id)
          : undefined,
        player2_session: duel.player2_session_id
          ? sessionsById.get(duel.player2_session_id)
          : undefined,
      }));

      setCompletedDuels(enrichedDuels as DuelWithDetails[]);
    }
  }, [profile]);

  const loadInvitations = useCallback(async () => {
    if (!profile) return;

    const { data: pending } = await supabase
      .from("duel_invitations")
      .select(
        "*, from_user:profiles!duel_invitations_from_user_id_fkey(*), to_user:profiles!duel_invitations_to_user_id_fkey(*), quizzes(*)"
      )
      .eq("to_user_id", profile.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    const pendingRows = (pending ?? []) as InvitationWithMaybeDetails[];
    const filteredPending = pendingRows.filter(isInvitationWithDetails);
    if (filteredPending)
      setPendingInvitations(filteredPending as InvitationWithDetails[]);

    const { data: sent } = await supabase
      .from("duel_invitations")
      .select(
        "*, from_user:profiles!duel_invitations_from_user_id_fkey(*), to_user:profiles!duel_invitations_to_user_id_fkey(*), quizzes(*)"
      )
      .eq("from_user_id", profile.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    const sentRows = (sent ?? []) as InvitationWithMaybeDetails[];
    const filteredSent = sentRows.filter(isInvitationWithDetails);
    if (filteredSent) setSentInvitations(filteredSent as InvitationWithDetails[]);
  }, [profile]);

  const loadMatchmakingStatus = useCallback(async () => {
    if (!profile) return;

    const { data } = await supabase
      .from("duel_matchmaking_queue")
      .select("*")
      .eq("user_id", profile.id)
      .maybeSingle();

    setMatchmakingQueueEntry(data || null);
  }, [profile]);

  const loadMatchmakingOptions = useCallback(async () => {
    const { data } = await supabase
      .from("quizzes")
      .select("*")
      .or("is_public.eq.true,is_global.eq.true")
      .order("total_plays", { ascending: false })
      .limit(50);

    if (data) setMatchmakingQuizzes(data);
  }, []);

  const loadDuelFeatureFlags = useCallback(async () => {
    const { data } = await supabase
      .from("duel_feature_flags")
      .select("*")
      .in("feature_key", [
        "anti_repeat",
        "progressive_expand",
        "show_opponent_mmr",
      ]);

    if (!data) return;
    const typed = data as DuelFeatureFlag[];
    setDuelFeatureFlags({
      anti_repeat:
        typed.find((f) => f.feature_key === "anti_repeat")?.enabled ?? true,
      progressive_expand:
        typed.find((f) => f.feature_key === "progressive_expand")?.enabled ??
        true,
      show_opponent_mmr:
        typed.find((f) => f.feature_key === "show_opponent_mmr")?.enabled ??
        true,
    });
  }, []);

  useEffect(() => {
    loadDuels();
    loadInvitations();
    loadMatchmakingStatus();
    loadMatchmakingOptions();
    loadDuelFeatureFlags();
  }, [
    loadDuels,
    loadInvitations,
    loadMatchmakingStatus,
    loadMatchmakingOptions,
    loadDuelFeatureFlags,
  ]);

  useEffect(() => {
    if (!profile) return;
    const subscription = supabase
      .channel("duel_updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "duels" },
        () => {
          loadDuels();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "duel_invitations" },
        () => {
          loadInvitations();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "duel_matchmaking_queue" },
        () => {
          loadMatchmakingStatus();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [profile, loadDuels, loadInvitations, loadMatchmakingStatus]);

  useEffect(() => {
    const stored = localStorage.getItem("viewedDuels");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      setViewedDuels(new Set(parsed));
    } catch (e) {
      console.error("Error loading viewed duels:", e);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== "completed" || completedDuels.length === 0) return;
    const newViewedDuels = new Set(viewedDuels);
    completedDuels.forEach((duel) => newViewedDuels.add(duel.id));
    setViewedDuels(newViewedDuels);
    localStorage.setItem("viewedDuels", JSON.stringify([...newViewedDuels]));
  }, [activeTab, completedDuels, viewedDuels]);

  const pendingDuelsCount = useMemo(
    () =>
      activeDuels.filter((duel) => {
        const isPlayer1 = duel.player1_id === profile?.id;
        const hasPlayed = isPlayer1
          ? !!duel.player1_session_id
          : !!duel.player2_session_id;
        return !hasPlayed;
      }).length,
    [activeDuels, profile?.id]
  );

  const newResultsCount = useMemo(
    () =>
      completedDuels.filter((duel) => {
        const completedAt = duel.completed_at ? new Date(duel.completed_at) : null;
        const isRecent =
          completedAt && Date.now() - completedAt.getTime() < 24 * 60 * 60 * 1000;
        return isRecent && !viewedDuels.has(duel.id);
      }).length,
    [completedDuels, viewedDuels]
  );

  const filteredCompletedDuels = useMemo(
    () =>
      rankedOnlyHistory
        ? completedDuels.filter((duel) => duel.match_type === "ranked")
        : completedDuels,
    [rankedOnlyHistory, completedDuels]
  );

  return {
    activeDuels,
    completedDuels,
    pendingInvitations,
    sentInvitations,
    pendingDuelsCount,
    newResultsCount,
    filteredCompletedDuels,
    matchmakingQueueEntry,
    matchmakingQuizzes,
    duelFeatureFlags,
    loadDuels,
    loadInvitations,
    loadMatchmakingStatus,
    setMatchmakingQueueEntry,
  };
}
