import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";
import type {
  Difficulty,
  DuelMatchmakingQueue,
  DuelWithDetails,
  MatchedPreview,
  NavigateFn,
  Quiz,
} from "../types";

interface UseMatchmakingParams {
  profileId?: string;
  matchmakingQueueEntry: DuelMatchmakingQueue | null;
  activeDuels: DuelWithDetails[];
  matchmakingQuizzes: Quiz[];
  duelFeatureFlags: {
    anti_repeat: boolean;
    progressive_expand: boolean;
    show_opponent_mmr: boolean;
  };
  loadDuels: () => Promise<void>;
  loadMatchmakingStatus: () => Promise<void>;
  notifyMatchFound: (from: string, quizTitle: string) => void;
  onNavigate: NavigateFn;
  t: (key: string) => string;
}

export function useMatchmaking({
  profileId,
  matchmakingQueueEntry,
  activeDuels,
  matchmakingQuizzes,
  duelFeatureFlags,
  loadDuels,
  loadMatchmakingStatus,
  notifyMatchFound,
  onNavigate,
  t,
}: UseMatchmakingParams) {
  const [matchmakingLoading, setMatchmakingLoading] = useState(false);
  const [preferredQuizIds, setPreferredQuizIds] = useState<string[]>([]);
  const [preferredDifficulty, setPreferredDifficulty] = useState<
    Difficulty | ""
  >("");
  const [queueMode, setQueueMode] = useState<"targeted" | "random_bonus">(
    "targeted"
  );
  const [matchedPreview, setMatchedPreview] = useState<MatchedPreview | null>(
    null
  );
  const matchmakingAttemptInFlightRef = useRef(false);

  const runMatchmakingAttempt = useCallback(
    async (
      matchType: "ranked" | "casual",
      prefQuizIds: string[] | null,
      prefDifficulty: Difficulty | null,
      prefQueueMode: "targeted" | "random_bonus",
      options?: { withLoading?: boolean }
    ) => {
      if (matchmakingAttemptInFlightRef.current) return;
      matchmakingAttemptInFlightRef.current = true;
      if (options?.withLoading) setMatchmakingLoading(true);

      const { data, error } = await supabase.rpc("create_or_match_random_duel", {
        p_match_type: matchType,
        p_preferred_quiz_id: null,
        p_preferred_difficulty: prefDifficulty,
        p_preferred_quiz_ids: prefQuizIds,
        p_queue_mode: prefQueueMode,
      });

      if (options?.withLoading) setMatchmakingLoading(false);
      matchmakingAttemptInFlightRef.current = false;

      if (error) {
        console.error("Error matchmaking:", error);
        return;
      }

      const payload = (Array.isArray(data) ? data[0] : data) as
        | {
            duel_id?: string | null;
            quiz_id?: string | null;
            matched?: boolean;
            waiting?: boolean;
            opponent_id?: string | null;
          }
        | null;

      if (payload?.matched && payload?.duel_id && payload?.quiz_id) {
        await Promise.all([loadDuels(), loadMatchmakingStatus()]);
        const quizTitle =
          matchmakingQuizzes.find((quiz) => quiz.id === payload.quiz_id)?.title ||
          t("duels.preferredQuizUnknown");

        if (!duelFeatureFlags.show_opponent_mmr) {
          notifyMatchFound(t("duels.unknownOpponent"), quizTitle);
          onNavigate("play-duel", {
            duelId: payload.duel_id,
            quizId: payload.quiz_id,
          });
          return;
        }

        const { data: opponentData } = payload.opponent_id
          ? await supabase
              .from("profiles")
              .select("pseudo, duel_rating")
              .eq("id", payload.opponent_id)
              .maybeSingle()
          : { data: null };

        setMatchedPreview({
          duelId: payload.duel_id,
          quizId: payload.quiz_id,
          opponentPseudo: opponentData?.pseudo || t("duels.unknownOpponent"),
          opponentMmr: opponentData?.duel_rating ?? 1000,
          matchType: matchType,
        });
        notifyMatchFound(
          opponentData?.pseudo || t("duels.unknownOpponent"),
          quizTitle
        );
      } else {
        await loadMatchmakingStatus();
      }
    },
    [
      duelFeatureFlags.show_opponent_mmr,
      loadDuels,
      loadMatchmakingStatus,
      matchmakingQuizzes,
      notifyMatchFound,
      onNavigate,
      t,
    ]
  );

  const startRandomMatchmaking = useCallback(
    async (matchType: "ranked" | "casual") => {
      await runMatchmakingAttempt(
        matchType,
        preferredQuizIds.length > 0 ? preferredQuizIds : null,
        (preferredDifficulty || null) as Difficulty | null,
        queueMode,
        { withLoading: true }
      );
    },
    [preferredDifficulty, preferredQuizIds, queueMode, runMatchmakingAttempt]
  );

  const cancelRandomMatchmaking = useCallback(async () => {
    setMatchmakingLoading(true);
    const { error } = await supabase.rpc("cancel_random_duel_search");
    if (error) {
      console.error("Error cancelling matchmaking:", error);
    }
    setMatchmakingLoading(false);
    await loadMatchmakingStatus();
  }, [loadMatchmakingStatus]);

  const launchMatchedDuel = useCallback(() => {
    if (!matchedPreview) return;
    onNavigate("play-duel", {
      duelId: matchedPreview.duelId,
      quizId: matchedPreview.quizId,
    });
    setMatchedPreview(null);
  }, [matchedPreview, onNavigate]);

  const togglePreferredQuiz = useCallback((quizId: string) => {
    setPreferredQuizIds((prev) => {
      if (prev.includes(quizId)) {
        return prev.filter((id) => id !== quizId);
      }
      if (prev.length >= 10) return prev;
      return [...prev, quizId];
    });
  }, []);

  useEffect(() => {
    if (!matchmakingQueueEntry || matchedPreview) return;
    const hasJoinableActiveDuel = activeDuels.some((duel) => {
      const isPlayer1 = duel.player1_id === profileId;
      const hasPlayed = isPlayer1
        ? !!duel.player1_session_id
        : !!duel.player2_session_id;
      return !hasPlayed;
    });
    if (hasJoinableActiveDuel) return;

    const interval = setInterval(() => {
      runMatchmakingAttempt(
        matchmakingQueueEntry.match_type as "ranked" | "casual",
        (matchmakingQueueEntry.preferred_quiz_ids as string[] | null) || null,
        (matchmakingQueueEntry.preferred_difficulty as Difficulty | null) || null,
        (matchmakingQueueEntry.queue_mode as "targeted" | "random_bonus") ||
          "targeted"
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [
    activeDuels,
    matchedPreview,
    matchmakingQueueEntry,
    profileId,
    runMatchmakingAttempt,
  ]);

  return {
    matchmakingLoading,
    preferredQuizIds,
    preferredDifficulty,
    queueMode,
    matchedPreview,
    setPreferredDifficulty,
    setQueueMode,
    setPreferredQuizIds,
    setMatchedPreview,
    togglePreferredQuiz,
    startRandomMatchmaking,
    cancelRandomMatchmaking,
    launchMatchedDuel,
  };
}
