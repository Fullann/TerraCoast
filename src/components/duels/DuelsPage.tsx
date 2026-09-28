import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useNotifications } from "../../contexts/NotificationContext";
import {
  Swords,
  Trophy,
  Clock,
  Users,
  Plus,
  Zap,
  Crown,
  Play,
  CheckCircle2,
  X,
  AlertCircle,
  Gamepad2,
  Sparkles,
  Flame,
  Search,
  ChevronRight,
  TrendingUp,
  Award,
  RefreshCw,
} from "lucide-react";
import { useDuelsData } from "./hooks/useDuelsData";
import { useMatchmaking } from "./hooks/useMatchmaking";
import { useDuelNotifications } from "./hooks/useDuelNotifications";
import { fetchUserFriends } from "../../lib/queries/friendQueries";
import { decodeGhostRunChallenge, getSentGhostRuns } from "../../lib/ghostRunManager";
import { GhostRunsTab } from "./GhostRunsTab";
import { Avatar } from "../common/Avatar";
import type {
  DuelWithDetails,
  InvitationWithDetails,
  Difficulty,
  Profile,
  Quiz,
} from "./types";

export function DuelsPage({ initialTab }: { initialTab?: string }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ghostParam = searchParams.get("ghost");
  const incomingGhostChallenge = ghostParam ? decodeGhostRunChallenge(ghostParam) : null;
  const sentGhosts = getSentGhostRuns();

  const { profile } = useAuth();
  const { t } = useLanguage();
  const { refreshNotifications, showDuelNotification } = useNotifications();

  const [activeTab, setActiveTab] = useState<
    "active" | "matchmaking" | "invitations" | "completed" | "ghost"
  >(() => {
    if (ghostParam) return "ghost";
    if (initialTab === "history") return "completed";
    if (
      initialTab === "invitations" ||
      initialTab === "active" ||
      initialTab === "completed" ||
      initialTab === "matchmaking" ||
      initialTab === "ghost"
    ) {
      return initialTab;
    }
    return "active";
  });

  const [showCreateInvitation, setShowCreateInvitation] = useState(false);
  const [rankedOnlyHistory, setRankedOnlyHistory] = useState(false);

  const {
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
  } = useDuelsData({
    profile,
    activeTab,
    rankedOnlyHistory,
  });

  const { notifyMatchFound } = useDuelNotifications({
    showDuelNotification,
  });

  const {
    matchmakingLoading,
    preferredQuizIds,
    preferredDifficulty,
    queueMode,
    matchedPreview,
    setPreferredDifficulty,
    setQueueMode,
    setPreferredQuizIds,
    togglePreferredQuiz,
    startRandomMatchmaking,
    cancelRandomMatchmaking,
    launchMatchedDuel,
  } = useMatchmaking({
    profileId: profile?.id,
    matchmakingQueueEntry,
    activeDuels,
    matchmakingQuizzes,
    duelFeatureFlags,
    loadDuels,
    loadMatchmakingStatus,
    notifyMatchFound,
    navigate,
    t,
  });

  // State for quiz search inside matchmaking tab
  const [quizSearchQuery, setQuizSearchQuery] = useState("");
  const [showQuizSelector, setShowQuizSelector] = useState(false);

  const filteredMatchmakingQuizzes = useMemo(() => {
    if (!quizSearchQuery.trim()) return matchmakingQuizzes;
    const q = quizSearchQuery.toLowerCase();
    return matchmakingQuizzes.filter((quiz) =>
      quiz.title.toLowerCase().includes(q)
    );
  }, [matchmakingQuizzes, quizSearchQuery]);

  const acceptInvitation = async (invitation: InvitationWithDetails) => {
    refreshNotifications();
    if (!profile) return;

    const { data: duel, error: duelError } = await supabase
      .from("duels")
      .insert({
        quiz_id: invitation.quiz_id,
        player1_id: invitation.from_user_id,
        player2_id: invitation.to_user_id,
        status: "in_progress",
        match_type: "casual",
      })
      .select()
      .single();

    if (duelError) {
      console.error("Error creating duel:", duelError);
      return;
    }

    await supabase
      .from("duel_invitations")
      .update({ status: "accepted" })
      .eq("id", invitation.id);

    loadDuels();
    loadInvitations();

    if (duel) {
      navigate(`/duels/play/${duel.id}?quizId=${invitation.quiz_id}`);
    }
  };

  const declineInvitation = async (invitationId: string) => {
    refreshNotifications();
    await supabase
      .from("duel_invitations")
      .update({ status: "declined" })
      .eq("id", invitationId);

    loadInvitations();
  };

  const joinDuel = async (duel: DuelWithDetails) => {
    navigate(`/duels/play/${duel.id}?quizId=${duel.quiz_id}`);
  };

  const handleStartRandomMatchmaking = async (matchType: "ranked" | "casual") => {
    await startRandomMatchmaking(matchType);
    setActiveTab("matchmaking");
  };

  const getDuelStatus = (duel: DuelWithDetails) => {
    if (duel.status === "completed") {
      if (!duel.winner_id) return t("duels.draw");
      if (duel.winner_id === profile?.id) return t("duels.victory");
      return t("duels.defeat");
    }
    if (duel.status === "in_progress") return t("duels.inProgress");
    return t("duels.waiting");
  };

  const getOpponent = (duel: DuelWithDetails) => {
    return duel.player1_id === profile?.id ? duel.player2 : duel.player1;
  };

  // Helper to determine whether the current user has completed their session for a duel
  const hasUserPlayedDuel = (duel: DuelWithDetails) => {
    const isPlayer1 = duel.player1_id === profile?.id;
    return isPlayer1 ? !!duel.player1_session_id : !!duel.player2_session_id;
  };

  const hasOpponentPlayedDuel = (duel: DuelWithDetails) => {
    const isPlayer1 = duel.player1_id === profile?.id;
    return isPlayer1 ? !!duel.player2_session_id : !!duel.player1_session_id;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 sm:py-8 space-y-6">
      {/* ========================================================
          1. HERO HEADER WITH QUICK ACTION SHORTCUTS
      ======================================================== */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border-b-4 border-emerald-800">
        {/* Playful background decorative shapes */}
        <div className="absolute -right-10 -bottom-10 w-56 h-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-32 -top-12 w-40 h-40 bg-teal-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-emerald-100 text-xs font-bold tracking-wide uppercase border border-white/20">
              <Swords className="w-3.5 h-3.5 text-amber-300" />
              <span>Arène 1v1 & Multijoueur</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white flex items-center gap-3">
              {t("duels.title")}
              <span className="text-2xl sm:text-3xl">⚔️</span>
            </h1>

            <p className="text-emerald-100 text-sm sm:text-base max-w-xl font-medium leading-relaxed">
              {t("duels.subtitle") || "Défie tes amis, grimpe au classement en Matchmaking ou joue en direct !"}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <button
              onClick={() => navigate("/party")}
              className="px-5 py-3.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-extrabold rounded-2xl shadow-lg border-b-4 border-purple-800 active:translate-y-0.5 transition-all flex items-center justify-center gap-2.5 text-sm sm:text-base group"
            >
              <Crown className="w-5 h-5 text-amber-300 group-hover:rotate-12 transition-transform" />
              <span>Mode Salon / Party 🏆</span>
            </button>

            <button
              onClick={() => setShowCreateInvitation(true)}
              className="px-5 py-3.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-extrabold rounded-2xl shadow-lg border-b-4 border-amber-600 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>{t("duels.createDuel")}</span>
            </button>
          </div>
        </div>

        {/* Priority Alert Banner if user has pending duels to play */}
        {pendingDuelsCount > 0 && (
          <div className="mt-6 pt-5 border-t border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/30">
            <div className="flex items-center gap-3">
              <span className="flex h-3.5 w-3.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-300"></span>
              </span>
              <div>
                <p className="font-bold text-white text-sm sm:text-base flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-300 fill-amber-300" />
                  C&apos;est à toi de jouer !
                </p>
                <p className="text-xs sm:text-sm text-emerald-100">
                  Tu as <span className="font-bold underline">{pendingDuelsCount}</span> duel(s) en attente de ton score.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("active")}
              className="px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl font-bold text-xs sm:text-sm border-b-2 border-emerald-300 transition-colors self-start sm:self-auto flex items-center gap-1"
            >
              <span>Jouer maintenant</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ========================================================
          2. CLEAN TACTILE NAVIGATION BAR (DUOLINGO STYLE)
      ======================================================== */}
      <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-100 p-2 sm:p-2.5">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {/* Onglet 1: En cours */}
          <button
            onClick={() => setActiveTab("active")}
            className={`relative flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all border-b-4 active:translate-y-0.5 ${
              activeTab === "active"
                ? "bg-emerald-500 text-white border-emerald-700 shadow-md"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
            }`}
          >
            <Swords className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span className="truncate">{t("duels.activeDuels")}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-xs font-black ${
                activeTab === "active"
                  ? "bg-emerald-700 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {activeDuels.length}
            </span>

            {/* Notification badge if user needs to play */}
            {pendingDuelsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[9px] font-black items-center justify-center">
                  !
                </span>
              </span>
            )}
          </button>

          {/* Onglet 2: Matchmaking / Partie Rapide */}
          <button
            onClick={() => setActiveTab("matchmaking")}
            className={`relative flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all border-b-4 active:translate-y-0.5 ${
              activeTab === "matchmaking"
                ? "bg-indigo-600 text-white border-indigo-800 shadow-md"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
            }`}
          >
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-amber-400" />
            <span className="truncate">{t("duels.matchmaking")}</span>

            {matchmakingQueueEntry && (
              <span className="px-1.5 py-0.5 rounded-full text-xs font-black bg-purple-700 text-white animate-pulse">
                1
              </span>
            )}

            {matchmakingQueueEntry && (
              <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-indigo-500"></span>
              </span>
            )}
          </button>

          {/* Onglet 3: Invitations */}
          <button
            onClick={() => setActiveTab("invitations")}
            className={`relative flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all border-b-4 active:translate-y-0.5 ${
              activeTab === "invitations"
                ? "bg-amber-500 text-white border-amber-700 shadow-md"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
            }`}
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span className="truncate">{t("duels.invitations")}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-xs font-black ${
                activeTab === "invitations"
                  ? "bg-amber-700 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {pendingInvitations.length}
            </span>
          </button>

          {/* Onglet 4: Historique */}
          <button
            onClick={() => setActiveTab("completed")}
            className={`relative flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all border-b-4 active:translate-y-0.5 ${
              activeTab === "completed"
                ? "bg-blue-600 text-white border-blue-800 shadow-md"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
            }`}
          >
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-amber-300" />
            <span className="truncate">{t("duels.history")}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-xs font-black ${
                activeTab === "completed"
                  ? "bg-blue-800 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {completedDuels.length}
            </span>

            {newResultsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-5 w-5 text-[10px] font-black text-white bg-red-500 rounded-full border-2 border-white animate-pulse">
                {newResultsCount}
              </span>
            )}
          </button>

          {/* Onglet 5: Ghost Runs */}
          <button
            onClick={() => setActiveTab("ghost")}
            className={`col-span-2 sm:col-span-1 relative flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all border-b-4 active:translate-y-0.5 ${
              activeTab === "ghost"
                ? "bg-purple-600 text-white border-purple-800 shadow-md"
                : "bg-purple-50 text-purple-800 hover:bg-purple-100 border-purple-200"
            }`}
          >
            <span className="text-base shrink-0">👻</span>
            <span className="truncate">Ghost Runs</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-xs font-black ${
                activeTab === "ghost"
                  ? "bg-purple-800 text-white"
                  : "bg-purple-200 text-purple-800"
              }`}
            >
              {sentGhosts.length}
            </span>

            {incomingGhostChallenge && (
              <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-pink-500"></span>
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================
          3. TAB CONTENT: DUELS EN COURS (ACTIVE DUELS)
      ======================================================== */}
      {activeTab === "active" && (
        <div className="space-y-4">
          {activeDuels.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border-2 border-emerald-100">
                <Swords className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-gray-800">
                  {t("duels.noActiveDuels")}
                </h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  {t("duels.createOrAccept") || "Lance un défi à un ami ou trouve un adversaire en 1v1 instantané !"}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  onClick={() => setActiveTab("matchmaking")}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl border-b-4 border-indigo-800 active:translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Partie Rapide 1v1</span>
                </button>
                <button
                  onClick={() => setShowCreateInvitation(true)}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl border-b-4 border-emerald-800 active:translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t("duels.createDuel")}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeDuels.map((duel) => {
                const opponent = getOpponent(duel);
                const hasPlayed = hasUserPlayedDuel(duel);
                const opponentHasPlayed = hasOpponentPlayedDuel(duel);
                const isYourTurn = !hasPlayed;

                return (
                  <div
                    key={duel.id}
                    className={`rounded-2xl transition-all overflow-hidden flex flex-col justify-between ${
                      isYourTurn
                        ? "bg-gradient-to-b from-emerald-50/60 to-white border-2 border-emerald-400 shadow-md hover:shadow-lg ring-4 ring-emerald-100/50"
                        : "bg-white border-2 border-gray-200 shadow-sm hover:border-gray-300"
                    }`}
                  >
                    <div className="p-5 sm:p-6 space-y-4">
                      {/* Top status bar: Mode & Date */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide ${
                            duel.match_type === "ranked"
                              ? "bg-purple-100 text-purple-700 border border-purple-200"
                              : "bg-blue-100 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {duel.match_type === "ranked" ? "🏆 " + t("duels.rankedTag") : "🎮 " + t("duels.casualTag")}
                        </span>

                        <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(duel.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Quiz Title */}
                      <div>
                        <h3 className="text-lg sm:text-xl font-extrabold text-gray-800 line-clamp-1">
                          {duel.quizzes.title}
                        </h3>
                        <p className="text-xs text-gray-500 capitalize">
                          Difficulté : {duel.quizzes.difficulty}
                        </p>
                      </div>

                      {/* Opponents showdown visual */}
                      <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100 flex items-center justify-between">
                        {/* Current User */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar
                            url={profile?.avatar_url}
                            pseudo={profile?.pseudo}
                            frameStyle={profile?.frame_style}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-black text-gray-800 truncate">
                              Toi
                            </p>
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                                hasPlayed ? "text-emerald-600" : "text-amber-600"
                              }`}
                            >
                              {hasPlayed ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                  <span>Tour joué</span>
                                </>
                              ) : (
                                <>
                                  <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                                  <span>À toi !</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* VS badge */}
                        <div className="px-2.5 py-1 bg-white rounded-full border border-gray-200 text-xs font-black text-gray-500 shadow-xs">
                          VS
                        </div>

                        {/* Opponent */}
                        <div className="flex items-center gap-2.5 min-w-0 justify-end text-right">
                          <div className="min-w-0">
                            <p className="text-xs font-black text-gray-800 truncate">
                              {opponent.pseudo}
                            </p>
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-bold justify-end ${
                                opponentHasPlayed ? "text-emerald-600" : "text-gray-500"
                              }`}
                            >
                              {opponentHasPlayed ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                  <span>A joué</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  <span>En attente</span>
                                </>
                              )}
                            </span>
                          </div>
                          <Avatar
                            url={opponent.avatar_url}
                            pseudo={opponent.pseudo}
                            frameStyle={opponent.frame_style}
                            size="sm"
                          />
                        </div>
                      </div>

                      {/* Turn Status Message */}
                      {isYourTurn ? (
                        <div className="p-3 bg-emerald-100/70 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-800">
                          <Flame className="w-4 h-4 text-emerald-600 fill-emerald-600 shrink-0" />
                          <span>C&apos;est ton tour ! Réponds aux questions pour marquer tes points.</span>
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs font-medium text-amber-800">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Ton score est enregistré ! En attente du tour de {opponent.pseudo}.</span>
                        </div>
                      )}
                    </div>

                    {/* Action button */}
                    <div className="p-4 bg-gray-50/70 border-t border-gray-100">
                      {isYourTurn ? (
                        <button
                          onClick={() => joinDuel(duel)}
                          className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl border-b-4 border-emerald-700 active:translate-y-0.5 transition-all text-sm sm:text-base flex items-center justify-center gap-2 shadow-md"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          <span>Jouer mon tour maintenant !</span>
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full py-3 px-4 bg-gray-100 text-gray-500 font-bold rounded-xl border border-gray-200 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                        >
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>En attente de l&apos;adversaire</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          4. TAB CONTENT: MATCHMAKING 1V1 (PARTIE RAPIDE)
      ======================================================== */}
      {activeTab === "matchmaking" && (
        <div className="space-y-6">
          {/* Match Found State */}
          {matchedPreview && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl border-b-4 border-emerald-700 animate-scale-up space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-amber-300" />
                <span className="font-black text-sm uppercase tracking-wide text-emerald-100">
                  Adversaire Trouvé !
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Prépare-toi pour le duel !
              </h3>
              <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-100">Adversaire</p>
                  <p className="text-lg sm:text-xl font-black text-white">{matchedPreview.opponentPseudo}</p>
                </div>
                {matchedPreview.matchType === "ranked" && (
                  <div className="text-right">
                    <p className="text-xs text-emerald-100">MMR Estimé</p>
                    <p className="text-lg sm:text-xl font-black text-amber-300">
                      {matchedPreview.opponentMmr} pts
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={launchMatchedDuel}
                className="w-full py-4 bg-white hover:bg-emerald-50 text-emerald-800 font-extrabold text-lg rounded-2xl border-b-4 border-emerald-200 active:translate-y-0.5 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-emerald-800" />
                <span>{t("duels.startDuelNow")} 🚀</span>
              </button>
            </div>
          )}

          {/* Active Queue State (Searching...) */}
          {matchmakingQueueEntry && !matchedPreview && (
            <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl border-2 border-indigo-500/30 text-center space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Pulsing Sonar / Radar effect */}
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-30"></span>
                <span className="animate-pulse absolute inline-flex h-20 w-20 rounded-full bg-indigo-600/40"></span>
                <div className="relative w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white/30">
                  <Zap className="w-8 h-8 text-amber-300 animate-bounce" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {t("duels.searchingOpponent")}
                </h3>
                <p className="text-sm text-indigo-200">
                  Le système cherche un adversaire de ton niveau...
                </p>
              </div>

              {/* Queue summary chips */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
                <span className="px-3 py-1.5 rounded-full bg-white/10 text-white border border-white/10">
                  Mode: {matchmakingQueueEntry.match_type === "ranked" ? "Classé 🏆" : "Amical 🎮"}
                </span>
                <span className="px-3 py-1.5 rounded-full bg-white/10 text-white border border-white/10">
                  Quiz: {matchmakingQueueEntry.queue_mode === "random_bonus" ? "Aléatoire (+Bonus XP)" : "Sélection personnalisée"}
                </span>
                {matchmakingQueueEntry.preferred_difficulty && (
                  <span className="px-3 py-1.5 rounded-full bg-white/10 text-white border border-white/10 uppercase">
                    Difficulté: {matchmakingQueueEntry.preferred_difficulty}
                  </span>
                )}
                <span className="px-3 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {t("duels.inQueueSince")} {new Date(matchmakingQueueEntry.created_at).toLocaleTimeString()}
                </span>
              </div>

              {/* Cancel Button */}
              <div>
                <button
                  onClick={cancelRandomMatchmaking}
                  disabled={matchmakingLoading}
                  className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-white font-bold rounded-xl border border-red-500/40 active:translate-y-0.5 transition-all text-sm inline-flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  <span>{t("duels.cancelSearch")}</span>
                </button>
              </div>
            </div>
          )}

          {/* Default State: Setup & Choose Mode */}
          {!matchmakingQueueEntry && !matchedPreview && (
            <div className="space-y-6">
              {/* Mode Selection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Mode Classé */}
                <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-white rounded-3xl p-6 sm:p-7 border-2 border-purple-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="p-3 bg-purple-600 text-white rounded-2xl shadow-sm">
                        <Trophy className="w-6 h-6 text-amber-300" />
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-purple-100 text-purple-700 border border-purple-200">
                        Compétitif
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-gray-900">
                        Match Classé 1v1
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        Gagne ou perds des points de classement (MMR). Affronte des joueurs à ta hauteur et monte dans la ligue !
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-purple-700 bg-purple-100/60 p-2.5 rounded-xl">
                      <Award className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>Classement mondial • Calcul d&apos;ELO en temps réel</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartRandomMatchmaking("ranked")}
                    disabled={matchmakingLoading}
                    className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-base rounded-2xl border-b-4 border-purple-800 active:translate-y-0.5 transition-all shadow-md flex items-center justify-center gap-2 group"
                  >
                    <span>Lancer la recherche Classée</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* 2. Mode Amical */}
                <div className="bg-gradient-to-br from-sky-50 via-blue-50 to-white rounded-3xl p-6 sm:p-7 border-2 border-sky-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="p-3 bg-sky-500 text-white rounded-2xl shadow-sm">
                        <Gamepad2 className="w-6 h-6 text-white" />
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-sky-100 text-sky-700 border border-sky-200">
                        Détente
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-gray-900">
                        Match Amical 1v1
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        Joue pour le plaisir sans pression. Parfait pour t&apos;entraîner, découvrir de nouveaux quiz et tester tes réflexes.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-sky-700 bg-sky-100/60 p-2.5 rounded-xl">
                      <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>Sans impact sur ton classement MMR</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartRandomMatchmaking("casual")}
                    disabled={matchmakingLoading}
                    className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-base rounded-2xl border-b-4 border-sky-700 active:translate-y-0.5 transition-all shadow-md flex items-center justify-center gap-2 group"
                  >
                    <span>Lancer la recherche Amicale</span>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Matchmaking Custom Preferences (Difficulty & Quiz options) */}
              <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-6 sm:p-7 space-y-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚙️</span>
                    <h4 className="font-extrabold text-gray-800 text-base sm:text-lg">
                      Préférences de partie (Optionnel)
                    </h4>
                  </div>
                  <button
                    onClick={() => {
                      setQueueMode("targeted");
                      setPreferredDifficulty("");
                      setPreferredQuizIds([]);
                    }}
                    disabled={matchmakingLoading}
                    className="text-xs text-gray-500 hover:text-gray-800 font-bold flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{t("duels.resetFilters")}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Difficulty Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
                      Difficulté des questions
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: "", label: "Toutes", icon: "🌐" },
                        { id: "easy", label: "Facile", icon: "🌱" },
                        { id: "medium", label: "Moyen", icon: "⚡" },
                        { id: "hard", label: "Difficile", icon: "🔥" },
                      ].map((diff) => (
                        <button
                          key={diff.id}
                          type="button"
                          onClick={() => setPreferredDifficulty(diff.id as Difficulty | "")}
                          className={`py-2 px-1 text-center rounded-xl font-bold text-xs transition-all border-b-2 ${
                            preferredDifficulty === diff.id
                              ? "bg-emerald-500 text-white border-emerald-700 shadow-sm"
                              : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                          }`}
                        >
                          <div className="text-sm">{diff.icon}</div>
                          <div className="truncate">{diff.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mode / Category Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
                      Sélection des Quiz
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setQueueMode("random_bonus");
                          setShowQuizSelector(false);
                        }}
                        className={`p-2.5 rounded-xl font-bold text-xs text-left transition-all border-b-2 flex items-center gap-2 ${
                          queueMode === "random_bonus"
                            ? "bg-amber-500 text-white border-amber-700 shadow-sm"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                        }`}
                      >
                        <span className="text-lg">🎲</span>
                        <div>
                          <div>Aléatoire</div>
                          <div className={`text-[10px] ${queueMode === "random_bonus" ? "text-amber-100" : "text-amber-600"}`}>
                            + Bonus d&apos;XP !
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setQueueMode("targeted");
                          setShowQuizSelector(true);
                        }}
                        className={`p-2.5 rounded-xl font-bold text-xs text-left transition-all border-b-2 flex items-center gap-2 ${
                          queueMode === "targeted"
                            ? "bg-indigo-600 text-white border-indigo-800 shadow-sm"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                        }`}
                      >
                        <span className="text-lg">🎯</span>
                        <div>
                          <div>Quiz Ciblés</div>
                          <div className={`text-[10px] ${queueMode === "targeted" ? "text-indigo-100" : "text-gray-500"}`}>
                            {preferredQuizIds.length > 0 ? `${preferredQuizIds.length} sélectionné(s)` : "Tous les quiz"}
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Collapsible targeted quiz search if mode is targeted */}
                {queueMode === "targeted" && (
                  <div className="pt-4 border-t border-gray-100 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <p className="text-xs font-bold text-gray-700">
                        Choisis tes thèmes favoris ({preferredQuizIds.length}/10 sélectionnés) :
                      </p>
                      {preferredQuizIds.length > 0 && (
                        <button
                          onClick={() => setPreferredQuizIds([])}
                          className="text-xs text-red-500 hover:underline font-medium"
                        >
                          Tout désélectionner
                        </button>
                      )}
                    </div>

                    {/* Search bar inside matchmaking */}
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher un quiz par titre..."
                        value={quizSearchQuery}
                        onChange={(e) => setQuizSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1 p-2 bg-gray-50 rounded-xl border border-gray-200">
                      {filteredMatchmakingQuizzes.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">
                          Aucun quiz ne correspond à votre recherche.
                        </p>
                      ) : (
                        filteredMatchmakingQuizzes.map((quiz) => {
                          const isSelected = preferredQuizIds.includes(quiz.id);
                          return (
                            <label
                              key={quiz.id}
                              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs font-medium transition-colors ${
                                isSelected
                                  ? "bg-indigo-100 text-indigo-900 font-bold"
                                  : "hover:bg-gray-100 text-gray-700"
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => togglePreferredQuiz(quiz.id)}
                                  disabled={
                                    matchmakingLoading ||
                                    (!isSelected && preferredQuizIds.length >= 10)
                                  }
                                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="truncate">{quiz.title}</span>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-gray-600 border border-gray-200 capitalize shrink-0 ml-2">
                                {quiz.difficulty}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          5. TAB CONTENT: INVITATIONS (DEFIS RECUS & ENVOYES)
      ======================================================== */}
      {activeTab === "invitations" && (
        <div className="space-y-6">
          {/* Section: Invitations reçues */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 flex items-center gap-2">
                <span>📨</span>
                <span>{t("duels.receivedInvitations")}</span>
                <span className="text-xs px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full font-black">
                  {pendingInvitations.length}
                </span>
              </h3>
            </div>

            {pendingInvitations.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center text-gray-500">
                <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                <p className="font-bold text-gray-700 text-sm">
                  {t("duels.noInvitations")}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Aucun ami ne t&apos;a défié pour le moment.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="bg-white rounded-2xl p-5 border-2 border-amber-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <Avatar
                        url={invitation.from_user.avatar_url}
                        pseudo={invitation.from_user.pseudo}
                        frameStyle={invitation.from_user.frame_style}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-black text-gray-900 text-base truncate">
                            {invitation.from_user.pseudo}
                          </p>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                            Niv. {invitation.from_user.level}
                          </span>
                        </div>
                        <p className="text-xs text-amber-700 font-bold mt-0.5">
                          Te défie en 1v1 ! ⚔️
                        </p>
                        <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded-lg border border-gray-100 font-medium truncate">
                          Quiz: <span className="font-bold text-gray-800">{invitation.quizzes.title}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => acceptInvitation(invitation)}
                        className="flex-1 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl border-b-4 border-emerald-700 active:translate-y-0.5 transition-all text-xs sm:text-sm flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>{t("friends.accept")}</span>
                      </button>
                      <button
                        onClick={() => declineInvitation(invitation.id)}
                        className="py-2.5 px-4 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 font-bold rounded-xl border border-gray-200 transition-colors text-xs sm:text-sm"
                      >
                        <span>{t("friends.reject")}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Invitations envoyées */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-base sm:text-lg font-extrabold text-gray-800 mb-3 flex items-center gap-2">
              <span>📤</span>
              <span>{t("duels.sentInvitations")}</span>
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-bold">
                {sentInvitations.length}
              </span>
            </h3>

            {sentInvitations.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                Aucun défi envoyé en attente de réponse.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sentInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        url={invitation.to_user.avatar_url}
                        pseudo={invitation.to_user.pseudo}
                        frameStyle={invitation.to_user.frame_style}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">
                          Défi envoyé à <span className="text-emerald-700 font-extrabold">{invitation.to_user.pseudo}</span>
                        </p>
                        <p className="text-[11px] text-gray-500 truncate">
                          {invitation.quizzes.title}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{t("duels.waiting")}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          6. TAB CONTENT: HISTORIQUE DES DUELS
      ======================================================== */}
      {activeTab === "completed" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span className="font-extrabold text-sm sm:text-base text-gray-800">
                Historique des affrontements ({filteredCompletedDuels.length})
              </span>
            </div>

            <label className="inline-flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer select-none bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-100">
              <input
                type="checkbox"
                checked={rankedOnlyHistory}
                onChange={(e) => setRankedOnlyHistory(e.target.checked)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>{t("duels.rankedOnlyHistory")}</span>
            </label>
          </div>

          {filteredCompletedDuels.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-8 sm:p-12 text-center max-w-md mx-auto space-y-2">
              <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-gray-700">
                {t("duels.noCompletedDuels")}
              </h3>
              <p className="text-xs text-gray-500">
                {t("duels.historyAppears")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCompletedDuels.map((duel) => {
                const opponent = getOpponent(duel);
                const status = getDuelStatus(duel);
                const isPlayer1 = duel.player1_id === profile?.id;
                const mySession = isPlayer1
                  ? duel.player1_session
                  : duel.player2_session;
                const opponentSession = isPlayer1
                  ? duel.player2_session
                  : duel.player1_session;
                const isVictory = status === t("duels.victory");
                const isDefeat = status === t("duels.defeat");
                const ratingDelta =
                  duel.player1_id === profile?.id
                    ? duel.player1_rating_delta
                    : duel.player2_rating_delta;

                return (
                  <div
                    key={duel.id}
                    className={`rounded-2xl p-4 sm:p-5 border-2 transition-all shadow-xs hover:shadow-md ${
                      isVictory
                        ? "bg-gradient-to-r from-emerald-50/70 via-white to-white border-emerald-300"
                        : isDefeat
                        ? "bg-gradient-to-r from-rose-50/70 via-white to-white border-rose-300"
                        : "bg-gradient-to-r from-gray-50 via-white to-white border-gray-300"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Result Badge & Quiz Info */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black text-xs shrink-0 border-b-2 shadow-xs ${
                            isVictory
                              ? "bg-emerald-500 text-white border-emerald-700"
                              : isDefeat
                              ? "bg-rose-500 text-white border-rose-700"
                              : "bg-gray-500 text-white border-gray-700"
                          }`}
                        >
                          <span className="text-lg">
                            {isVictory ? "🏆" : isDefeat ? "💀" : "🤝"}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider">
                            {status}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-gray-900 text-sm sm:text-base truncate">
                              {duel.quizzes.title}
                            </h4>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                                duel.match_type === "ranked"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {duel.match_type === "ranked" ? "Classé" : "Amical"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {duel.completed_at ? new Date(duel.completed_at).toLocaleDateString() : ""}
                          </p>
                        </div>
                      </div>

                      {/* Center / Right: Players Score comparison */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 bg-white/80 p-2.5 rounded-xl border border-gray-100">
                        {/* You */}
                        <div className="flex items-center gap-2">
                          <Avatar
                            url={profile?.avatar_url}
                            pseudo={profile?.pseudo}
                            frameStyle={profile?.frame_style}
                            size="xs"
                          />
                          <div>
                            <p className="text-[11px] font-bold text-gray-500">Toi</p>
                            <p className="text-sm font-black text-emerald-700">
                              {mySession ? `${mySession.score} pts` : "-"}
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-black text-gray-400">vs</span>

                        {/* Opponent */}
                        <div className="flex items-center gap-2 text-right">
                          <div>
                            <p className="text-[11px] font-bold text-gray-500 truncate max-w-[80px]">
                              {opponent.pseudo}
                            </p>
                            <p className="text-sm font-black text-gray-800">
                              {opponentSession ? `${opponentSession.score} pts` : "-"}
                            </p>
                          </div>
                          <Avatar
                            url={opponent.avatar_url}
                            pseudo={opponent.pseudo}
                            frameStyle={opponent.frame_style}
                            size="xs"
                          />
                        </div>

                        {/* MMR Delta if Ranked */}
                        {duel.match_type === "ranked" && ratingDelta !== null && ratingDelta !== undefined && (
                          <div
                            className={`px-2.5 py-1 rounded-lg text-xs font-black shrink-0 ${
                              ratingDelta >= 0
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : "bg-rose-100 text-rose-800 border border-rose-200"
                            }`}
                          >
                            {ratingDelta >= 0 ? `+${ratingDelta}` : ratingDelta} MMR
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          7. TAB CONTENT: GHOST RUNS 👻
      ======================================================== */}
      {activeTab === "ghost" && (
        <GhostRunsTab
          incomingChallenge={incomingGhostChallenge}
          rawGhostParam={ghostParam}
        />
      )}

      {/* ========================================================
          8. CREER UN DUEL / DEFIS MODAL
      ======================================================== */}
      {showCreateInvitation && (
        <CreateDuelInvitation
          onClose={() => setShowCreateInvitation(false)}
          onCreated={() => {
            setShowCreateInvitation(false);
            loadInvitations();
          }}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// MODERN TACTILE CREATE DUEL MODAL
// ----------------------------------------------------------------------
function CreateDuelInvitation({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [friends, setFriends] = useState<Profile[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedFriend, setSelectedFriend] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState("");
  const [loading, setLoading] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [quizSearch, setQuizSearch] = useState("");

  useEffect(() => {
    loadFriendsAndQuizzes();
  }, []);

  const loadFriendsAndQuizzes = async () => {
    if (!profile) return;

    const allFriends = await fetchUserFriends(profile.id);
    setFriends(allFriends as Profile[]);

    const { data: quizzesData } = await supabase
      .from("quizzes")
      .select("*")
      .or("is_public.eq.true,is_global.eq.true")
      .order("total_plays", { ascending: false })
      .limit(60);

    if (quizzesData) setQuizzes(quizzesData);
  };

  const filteredFriends = useMemo(() => {
    if (!friendSearch.trim()) return friends;
    const q = friendSearch.toLowerCase();
    return friends.filter((f) => f.pseudo.toLowerCase().includes(q));
  }, [friends, friendSearch]);

  const filteredQuizzes = useMemo(() => {
    if (!quizSearch.trim()) return quizzes;
    const q = quizSearch.toLowerCase();
    return quizzes.filter((quiz) => quiz.title.toLowerCase().includes(q));
  }, [quizzes, quizSearch]);

  const createInvitation = async () => {
    if (!profile || !selectedFriend || !selectedQuiz) return;

    setLoading(true);

    try {
      await supabase.from("duel_invitations").insert({
        from_user_id: profile.id,
        to_user_id: selectedFriend,
        quiz_id: selectedQuiz,
        status: "pending",
      });

      onCreated();
    } catch (error) {
      console.error("Error creating invitation:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 border-4 border-emerald-100 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl text-lg">
              ⚔️
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                {t("duels.createDuel")}
              </h2>
              <p className="text-xs text-gray-500">
                Choisis un ami et le quiz sur lequel vous allez vous affronter.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4">
          {/* 1. Sélection de l'Ami */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-gray-700 block">
              1. {t("duels.chooseFriend")}
            </label>

            {friends.length === 0 ? (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800">
                Tu n&apos;as pas encore d&apos;amis ajoutés ! Ajoute des amis dans l&apos;onglet Amis pour les défier en 1v1.
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Chercher un ami..."
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto space-y-1.5 p-1">
                  {filteredFriends.map((friend) => {
                    const isSelected = selectedFriend === friend.id;
                    return (
                      <button
                        key={friend.id}
                        type="button"
                        onClick={() => setSelectedFriend(friend.id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? "bg-emerald-50 border-emerald-500 shadow-xs"
                            : "bg-white border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Avatar
                            url={friend.avatar_url}
                            pseudo={friend.pseudo}
                            frameStyle={friend.frame_style}
                            size="xs"
                          />
                          <span className="font-extrabold text-xs sm:text-sm text-gray-900 truncate">
                            {friend.pseudo}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                          Niv. {friend.level}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* 2. Sélection du Quiz */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-gray-700 block">
              2. {t("duels.chooseQuiz")}
            </label>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Chercher un quiz..."
                value={quizSearch}
                onChange={(e) => setQuizSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            <div className="max-h-40 overflow-y-auto space-y-1.5 p-1">
              {filteredQuizzes.map((quiz) => {
                const isSelected = selectedQuiz === quiz.id;
                return (
                  <button
                    key={quiz.id}
                    type="button"
                    onClick={() => setSelectedQuiz(quiz.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? "bg-emerald-50 border-emerald-500 shadow-xs"
                        : "bg-white border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <span className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                      {quiz.title}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase shrink-0 ml-2 ${
                        quiz.difficulty === "easy"
                          ? "bg-emerald-100 text-emerald-800"
                          : quiz.difficulty === "hard"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {quiz.difficulty}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors text-sm"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={createInvitation}
            disabled={!selectedFriend || !selectedQuiz || loading}
            className="flex-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl border-b-4 border-emerald-700 active:translate-y-0.5 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>{t("duels.sending")}</span>
            ) : (
              <>
                <Swords className="w-4 h-4" />
                <span>Envoyer le défi 🚀</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
