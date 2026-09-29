import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Search,
  PlusCircle,
  LogIn,
  AlertCircle,
  Loader2,
  Gamepad2,
  Crown,
  Skull,
  Check,
  X,
  Sparkles,
  Clock,
  Flame,
  ArrowRight,
  Tv,
  Lock,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { PATH_QUIZZES } from "../../lib/pathQuizzesData";
import {
  type PartyPlayer,
  type PartyQuestion,
  type PartyRealtimeEvent,
  type PartyRoom,
  type PartyEmote,
  computeBattleRoyaleEliminations,
} from "./types";
import {
  PartyRealtimeService,
  calculatePartyScore,
  generatePartyPin,
  getOrCreateGuestId,
  getStoredGuestAvatar,
  getStoredGuestPseudo,
  normalizePartyPin,
  saveGuestAvatar,
  saveGuestPseudo,
  tryPersistPartyRoom,
} from "./partyRealtime";
import { PartyLobby } from "./PartyLobby";
import { PartyLiveGame } from "./PartyLiveGame";
import { PartyRoundReveal } from "./PartyRoundReveal";
import { PartyPodium } from "./PartyPodium";

const AVAILABLE_AVATARS = [
  "🌍", "🤠", "🚀", "🦊", "🐯", "🐼", "🦁", "⚡", "👑", "🎯", "🦉", "🦄",
];

export interface QuizItem {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  difficulty?: string | null;
  question_count?: number;
  is_my_quiz?: boolean;
  is_private?: boolean;
  is_shared?: boolean;
}

const BUILTIN_PARTY_QUIZZES: QuizItem[] = [
  {
    id: "u1-n1",
    title: "Les 7 Continents de la Terre",
    description: "Formes, particularités et géographie des continents terrestres.",
    category: "continents",
    difficulty: "easy",
    question_count: 10,
  },
  {
    id: "u2-n1",
    title: "Capitales d'Europe",
    description: "Paris, Rome, Madrid, Berlin, Oslo et leurs anecdotes majeures.",
    category: "capitals",
    difficulty: "medium",
    question_count: 10,
  },
  {
    id: "u2-n3",
    title: "Drapeaux & Symboles d'Europe",
    description: "Couleurs, croix et emblèmes des nations du continent européen.",
    category: "flags",
    difficulty: "easy",
    question_count: 10,
  },
  {
    id: "u1-n2",
    title: "Océans & Grandes Mers du Monde",
    description: "Pacifique, Atlantique, Méditerranée et courants marins.",
    category: "continents",
    difficulty: "medium",
    question_count: 10,
  },
  {
    id: "u1-n3",
    title: "Merveilles Naturelles de la Terre",
    description: "Everest, Grand Canyon, Chutes Victoria et volcans spectaculaires.",
    category: "merveilles",
    difficulty: "medium",
    question_count: 10,
  },
  {
    id: "u2-n2",
    title: "Monuments & Patrimoine Mondial",
    description: "Colisée, Tour Eiffel, Parthénon, Sagrada Familia et patrimoine UNESCO.",
    category: "merveilles",
    difficulty: "easy",
    question_count: 10,
  },
  {
    id: "u1-boss",
    title: "👑 Boss Mondial : Le Maître du Globe",
    description: "12 questions de rapidité sur les extrêmes et records de notre planète.",
    category: "boss",
    difficulty: "hard",
    question_count: 12,
  },
  {
    id: "u2-boss",
    title: "👑 Empereur Européen : Boss Ultime",
    description: "Quiz d'expert pour ceux qui maîtrisent chaque recoin d'Europe.",
    category: "boss",
    difficulty: "hard",
    question_count: 12,
  },
];

const CATEGORY_CHIPS = [
  { id: "all", label: "Tous les Quiz", emoji: "✨" },
  { id: "continents", label: "Continents", emoji: "🌍" },
  { id: "capitals", label: "Capitales", emoji: "🏛️" },
  { id: "flags", label: "Drapeaux", emoji: "🚩" },
  { id: "merveilles", label: "Merveilles", emoji: "🏔️" },
  { id: "boss", label: "Défis Boss", emoji: "👑" },
];

function getQuizBadge(quiz: QuizItem): { emoji: string; label: string } {
  if (quiz.is_my_quiz) {
    return {
      emoji: quiz.is_private ? "🔒" : "✨",
      label: quiz.is_private ? "Quiz Privé" : "Ma Création",
    };
  }
  if (quiz.is_shared) {
    return { emoji: "🤝", label: "Quiz Partagé" };
  }
  const cat = (quiz.category || "").toLowerCase();
  const t = quiz.title.toLowerCase();
  if (cat.includes("flag") || cat.includes("drap") || t.includes("drap")) return { emoji: "🚩", label: "Drapeaux" };
  if (cat.includes("capital") || t.includes("capital")) return { emoji: "🏛️", label: "Capitales" };
  if (cat.includes("ocean") || t.includes("océan") || t.includes("mer")) return { emoji: "🌊", label: "Océans & Mers" };
  if (cat.includes("continent") || cat.includes("region") || t.includes("continent")) return { emoji: "🌍", label: "Continents" };
  if (cat.includes("merveil") || cat.includes("monument") || t.includes("merveil")) return { emoji: "🏔️", label: "Merveilles" };
  if (cat.includes("boss") || t.includes("boss")) return { emoji: "👑", label: "Défi Boss" };
  return { emoji: "🗺️", label: quiz.category || "Géographie" };
}

function getDifficultyBadge(diff?: string | null) {
  if (diff === "easy") return { label: "Facile", style: "bg-emerald-100 text-emerald-800 border-emerald-300" };
  if (diff === "hard") return { label: "Expert", style: "bg-rose-100 text-rose-800 border-rose-300" };
  return { label: "Moyen", style: "bg-amber-100 text-amber-800 border-amber-300" };
}

export function PartyPage() {
  const navigate = useNavigate();
  const { code: routeCode } = useParams<{ code?: string }>();
  const [searchParams] = useSearchParams();
  const queryCode = searchParams.get("code") || searchParams.get("pin");
  const initialCode = normalizePartyPin(routeCode || queryCode || "");

  const { user, profile } = useAuth();
  const { t } = useLanguage();

  // Navigation tab in Hub: "join" or "create"
  const [activeTab, setActiveTab] = useState<"join" | "create">(
    initialCode ? "join" : "join"
  );

  // Form states
  const [inputPin, setInputPin] = useState(initialCode);
  const [inputPseudo, setInputPseudo] = useState(
    profile?.pseudo || getStoredGuestPseudo() || ""
  );
  const [selectedAvatar, setSelectedAvatar] = useState(
    getStoredGuestAvatar()
  );

  // Host role state: "player" (plays & answers) or "spectator" (pure projector screen)
  const [hostRole, setHostRole] = useState<"player" | "spectator">("player");

  // Create room form states
  const [quizzesList, setQuizzesList] = useState<QuizItem[]>(BUILTIN_PARTY_QUIZZES);
  const [searchQuizQuery, setSearchQuizQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>("u1-n1");
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number>(15);
  const [gameMode, setGameMode] = useState<"classic" | "battle_royale">("classic");
  const [eliminatedPerRound, setEliminatedPerRound] = useState<number>(1);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  // Game execution state
  const [stage, setStage] = useState<
    "hub" | "lobby" | "game" | "reveal" | "podium"
  >("hub");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Active party data
  const [currentRoom, setCurrentRoom] = useState<PartyRoom | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<PartyPlayer | null>(null);
  const [connectedPlayers, setConnectedPlayers] = useState<PartyPlayer[]>([]);
  const [roomQuestions, setRoomQuestions] = useState<PartyQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [answeredGuestIds, setAnsweredGuestIds] = useState<Set<string>>(new Set());
  const [emotes, setEmotes] = useState<PartyEmote[]>([]);

  // Round reveal results
  const [roundCorrectAnswer, setRoundCorrectAnswer] = useState("");
  const [roundDistribution, setRoundDistribution] = useState<Record<string, number>>({});
  const [roundPlayerResults, setRoundPlayerResults] = useState<
    Record<
      string,
      {
        isCorrect: boolean;
        pointsEarned: number;
        totalScore: number;
        streak: number;
      }
    >
  >({});
  const [roundEliminatedIds, setRoundEliminatedIds] = useState<string[]>([]);
  const [finalPodium, setFinalPodium] = useState<PartyPlayer[]>([]);

  // Refs for tracking async state across broadcast events
  const realtimeRef = useRef<PartyRealtimeService | null>(null);
  const currentRoomRef = useRef<PartyRoom | null>(null);
  const currentPlayerRef = useRef<PartyPlayer | null>(null);
  const connectedPlayersRef = useRef<PartyPlayer[]>([]);
  const roomQuestionsRef = useRef<PartyQuestion[]>([]);
  const currentQIndexRef = useRef<number>(0);
  const answersThisRoundRef = useRef<
    Map<string, { option: string; timeMs: number }>
  >(new Map());

  currentRoomRef.current = currentRoom;
  currentPlayerRef.current = currentPlayer;
  connectedPlayersRef.current = connectedPlayers;
  roomQuestionsRef.current = roomQuestions;
  currentQIndexRef.current = currentQuestionIndex;

  // Sync profile pseudo if logged in
  useEffect(() => {
    if (profile?.pseudo && !inputPseudo) {
      setInputPseudo(profile.pseudo);
    }
  }, [profile?.pseudo, inputPseudo]);

  // Load published quizzes & host's own private/shared quizzes
  useEffect(() => {
    if (activeTab === "create") {
      setLoadingQuizzes(true);
      // Ensure built-in quizzes are present
      setQuizzesList((prev) => (prev.length > 0 ? prev : BUILTIN_PARTY_QUIZZES));
      if (!selectedQuizId) {
        setSelectedQuizId(BUILTIN_PARTY_QUIZZES[0].id);
      }

      const fetchAllQuizzes = async () => {
        try {
          const userQuizzes: QuizItem[] = [];

          // 1. Fetch user's own created quizzes (both private & public)
          if (user?.id) {
            const { data: myData, error: myErr } = await supabase
              .from("quizzes")
              .select("id, title, description, category, difficulty, is_public")
              .eq("creator_id", user.id)
              .order("created_at", { ascending: false });

            if (!myErr && myData && myData.length > 0) {
              for (const q of myData) {
                userQuizzes.push({
                  id: q.id,
                  title: q.title,
                  description: q.description,
                  category: q.category,
                  difficulty: q.difficulty,
                  is_my_quiz: true,
                  is_private: !q.is_public,
                });
              }
            }

            // 2. Fetch quizzes shared with the user
            const { data: sharedData, error: sErr } = await supabase
              .from("quiz_shares")
              .select("quiz:quizzes(id, title, description, category, difficulty, is_public)")
              .eq("shared_with_user_id", user.id);

            if (!sErr && sharedData && sharedData.length > 0) {
              const seen = new Set(userQuizzes.map((q) => q.id));
              for (const s of sharedData as any[]) {
                const sq = s?.quiz;
                if (sq && !seen.has(sq.id)) {
                  seen.add(sq.id);
                  userQuizzes.push({
                    id: sq.id,
                    title: sq.title,
                    description: sq.description,
                    category: sq.category,
                    difficulty: sq.difficulty,
                    is_shared: true,
                    is_private: !sq.is_public,
                  });
                }
              }
            }
          }

          // 3. Fetch public quizzes from Supabase (is_public or is_global)
          const { data: pubData } = await supabase
            .from("quizzes")
            .select("id, title, description, category, difficulty")
            .or("is_public.eq.true,is_global.eq.true")
            .order("total_plays", { ascending: false })
            .limit(50);

          const seenIds = new Set([
            ...userQuizzes.map((q) => q.id),
            ...BUILTIN_PARTY_QUIZZES.map((q) => q.id),
          ]);

          const publicCustom = ((pubData as QuizItem[]) || []).filter(
            (q) => !seenIds.has(q.id)
          );

          // User's private & custom quizzes appear FIRST, followed by built-ins and community
          const combined = [...userQuizzes, ...BUILTIN_PARTY_QUIZZES, ...publicCustom];
          setQuizzesList(combined);

          if (!selectedQuizId && combined.length > 0) {
            setSelectedQuizId(combined[0].id);
          }
        } catch (err) {
          console.error("Error loading party quizzes:", err);
          setQuizzesList(BUILTIN_PARTY_QUIZZES);
        } finally {
          setLoadingQuizzes(false);
        }
      };

      fetchAllQuizzes();
    }
  }, [activeTab, user?.id]);

  // Disconnect realtime on unmount
  useEffect(() => {
    return () => {
      if (realtimeRef.current) {
        realtimeRef.current.disconnect();
      }
    };
  }, []);

  // Category Chips with dynamic "Mes Quiz Privés"
  const myQuizzesCount = quizzesList.filter((q) => q.is_my_quiz || q.is_shared).length;

  const categoryChips = [
    { id: "all", label: "Tous les Quiz", emoji: "✨" },
    ...(user?.id
      ? [
          {
            id: "my_quizzes",
            label: `Mes Quiz ${myQuizzesCount > 0 ? `(${myQuizzesCount})` : "🔒"}`,
            emoji: "🔒",
          },
        ]
      : []),
    { id: "continents", label: "Continents", emoji: "🌍" },
    { id: "capitals", label: "Capitales", emoji: "🏛️" },
    { id: "flags", label: "Drapeaux", emoji: "🚩" },
    { id: "merveilles", label: "Merveilles", emoji: "🏔️" },
    { id: "boss", label: "Défis Boss", emoji: "👑" },
  ];

  // Filtered quizzes for category & search
  const filteredQuizzes = quizzesList.filter((q) => {
    // 1. Category chip filter
    if (selectedCategoryFilter === "my_quizzes") {
      if (!q.is_my_quiz && !q.is_shared) return false;
    } else if (selectedCategoryFilter !== "all") {
      const cat = (q.category || "").toLowerCase();
      const title = q.title.toLowerCase();
      if (selectedCategoryFilter === "capitals" && !cat.includes("capital") && !title.includes("capital")) return false;
      if (selectedCategoryFilter === "flags" && !cat.includes("flag") && !cat.includes("drap") && !title.includes("drap")) return false;
      if (
        selectedCategoryFilter === "continents" &&
        !cat.includes("continent") &&
        !cat.includes("region") &&
        !cat.includes("ocean") &&
        !title.includes("continent") &&
        !title.includes("mer") &&
        !title.includes("océan")
      )
        return false;
      if (
        selectedCategoryFilter === "merveilles" &&
        !cat.includes("merveil") &&
        !cat.includes("relief") &&
        !cat.includes("monument") &&
        !title.includes("merveil") &&
        !title.includes("monument")
      )
        return false;
      if (selectedCategoryFilter === "boss" && !cat.includes("boss") && !title.includes("boss")) return false;
    }

    // 2. Search query filter
    if (searchQuizQuery.trim()) {
      const qLower = searchQuizQuery.toLowerCase().trim();
      const matchTitle = q.title.toLowerCase().includes(qLower);
      const matchDesc = q.description ? q.description.toLowerCase().includes(qLower) : false;
      const matchCat = q.category ? q.category.toLowerCase().includes(qLower) : false;
      return matchTitle || matchDesc || matchCat;
    }

    return true;
  });

  /**
   * Broadcast message handler
   */
  const handleRealtimeEvent = useCallback(
    (event: PartyRealtimeEvent) => {
      switch (event.type) {
        case "GAME_START": {
          setRoomQuestions(event.questions);
          setTimeLimitSeconds(event.timeLimitSeconds);
          setCurrentQuestionIndex(0);
          setAnsweredGuestIds(new Set());
          answersThisRoundRef.current.clear();
          setStage("lobby"); // Will transition on QUESTION_START
          break;
        }

        case "QUESTION_START": {
          setCurrentQuestionIndex(event.questionIndex);
          setQuestionStartTime(event.questionStartTime);
          setTimeLimitSeconds(event.timeLimitSeconds);
          setAnsweredGuestIds(new Set());
          answersThisRoundRef.current.clear();
          setStage("game");
          break;
        }

        case "PLAYER_ANSWERED": {
          setAnsweredGuestIds((prev) => {
            const next = new Set(prev);
            next.add(event.guestId);
            return next;
          });

          answersThisRoundRef.current.set(event.guestId, {
            option: event.selectedOption,
            timeMs: event.answerTimeMs,
          });

          // If Host: check if all active non-spectator players have answered
          if (currentPlayerRef.current?.isHost) {
            const activePlayers = connectedPlayersRef.current.filter((p) => !p.isSpectator);
            if (activePlayers.length > 0) {
              const answeredCount = activePlayers.filter((p) =>
                answersThisRoundRef.current.has(p.guestId)
              ).length;
              if (answeredCount >= activePlayers.length) {
                // Trigger reveal automatically when everyone who plays has answered!
                triggerRoundReveal(event.questionIndex);
              }
            }
          }
          break;
        }

        case "ROUND_REVEAL": {
          setRoundCorrectAnswer(event.correctAnswer);
          setRoundDistribution(event.answersDistribution);
          setRoundPlayerResults(event.playerResults);
          setConnectedPlayers(event.leaderboard);
          setRoundEliminatedIds(event.eliminatedPlayerIds || []);

          // Update current player's personal score, streak and elimination status
          const myId = currentPlayerRef.current?.guestId;
          if (myId) {
            const isElim = event.eliminatedPlayerIds?.includes(myId);
            const myRes = event.playerResults[myId];
            setCurrentPlayer((prev) =>
              prev
                ? {
                    ...prev,
                    score: myRes ? myRes.totalScore : prev.score,
                    streak: myRes ? myRes.streak : prev.streak,
                    lastAnswerCorrect: myRes ? myRes.isCorrect : prev.lastAnswerCorrect,
                    lastPointsEarned: myRes ? myRes.pointsEarned : prev.lastPointsEarned,
                    isEliminated: isElim ? true : prev.isEliminated,
                    eliminatedAtRound: isElim ? event.questionIndex : prev.eliminatedAtRound,
                  }
                : null
            );
          }
          setStage("reveal");
          break;
        }

        case "NEXT_QUESTION": {
          setCurrentQuestionIndex(event.questionIndex);
          setAnsweredGuestIds(new Set());
          answersThisRoundRef.current.clear();
          break;
        }

        case "GAME_PODIUM": {
          setFinalPodium(event.finalPodium);
          setStage("podium");
          break;
        }

        case "EMOTE": {
          setEmotes((prev) => [...prev.slice(-10), event.emote]);
          setTimeout(() => {
            setEmotes((prev) => prev.filter((e) => e.id !== event.emote.id));
          }, 2500);
          break;
        }
      }
    },
    []
  );

  /**
   * Presence sync handler
   */
  const handlePresenceSync = useCallback((players: PartyPlayer[]) => {
    setConnectedPlayers(players);
  }, []);

  /**
   * Calculate round results and broadcast ROUND_REVEAL (called by host)
   */
  const triggerRoundReveal = useCallback(
    (qIndex: number) => {
      const q = roomQuestionsRef.current[qIndex];
      if (!q || !realtimeRef.current) return;

      const correctAnswer = q.correct_answer || "";
      const distribution: Record<string, number> = {};
      const playerResults: Record<
        string,
        {
          isCorrect: boolean;
          pointsEarned: number;
          totalScore: number;
          streak: number;
        }
      > = {};

      const updatedPlayers = connectedPlayersRef.current.map((player) => {
        if (player.isSpectator) {
          return {
            ...player,
            score: 0,
            streak: 0,
            lastAnswerCorrect: false,
            lastPointsEarned: 0,
          };
        }

        const submission = answersThisRoundRef.current.get(player.guestId);
        const selectedOption = submission?.option || "";
        const timeMs = submission?.timeMs || timeLimitSeconds * 1000;

        if (selectedOption) {
          distribution[selectedOption] = (distribution[selectedOption] || 0) + 1;
        }

        const isCorrect =
          selectedOption.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

        const { points, newStreak } = calculatePartyScore(
          isCorrect,
          timeMs,
          timeLimitSeconds,
          player.streak
        );

        const newTotalScore = player.score + points;

        playerResults[player.guestId] = {
          isCorrect,
          pointsEarned: points,
          totalScore: newTotalScore,
          streak: newStreak,
        };

        return {
          ...player,
          score: newTotalScore,
          streak: newStreak,
          lastAnswerCorrect: isCorrect,
          lastPointsEarned: points,
        };
      });

      // Sort leaderboard: only active players without spectators
      const competingPlayers = updatedPlayers.filter((p) => !p.isSpectator);
      competingPlayers.sort((a, b) => b.score - a.score);
      const rankedPlayers = competingPlayers.map((p, idx) => ({
        ...p,
        rank: idx + 1,
      }));

      let finalLeaderboard = rankedPlayers;
      let eliminatedIds: string[] = [];
      let remainingCount = rankedPlayers.length;

      if (currentRoomRef.current?.gameMode === "battle_royale") {
        const elimResult = computeBattleRoyaleEliminations(
          rankedPlayers,
          currentRoomRef.current.eliminatedPerRound || 1,
          qIndex
        );
        finalLeaderboard = elimResult.updatedPlayers.map((p, idx) => ({
          ...p,
          rank: p.rank ?? (idx + 1),
          lastAnswerCorrect: Boolean(p.lastAnswerCorrect),
          lastPointsEarned: p.lastPointsEarned ?? 0,
        }));
        eliminatedIds = elimResult.newlyEliminatedIds;
        remainingCount = elimResult.remainingCount;
      }

      realtimeRef.current.sendEvent({
        type: "ROUND_REVEAL",
        questionIndex: qIndex,
        correctAnswer,
        answersDistribution: distribution,
        playerResults,
        leaderboard: finalLeaderboard,
        eliminatedPlayerIds: eliminatedIds,
        remainingPlayersCount: remainingCount,
      });
    },
    [timeLimitSeconds]
  );

  /**
   * Host starts the entire game
   */
  const handleHostStartGame = async () => {
    if (!currentRoom || !realtimeRef.current || roomQuestions.length === 0) return;

    // 1. Send GAME_START
    await realtimeRef.current.sendEvent({
      type: "GAME_START",
      totalQuestions: roomQuestions.length,
      timeLimitSeconds,
      questions: roomQuestions,
    });

    // 2. Start Question 0
    setTimeout(async () => {
      const startTime = Date.now();
      setQuestionStartTime(startTime);
      await realtimeRef.current?.sendEvent({
        type: "QUESTION_START",
        questionIndex: 0,
        questionStartTime: startTime,
        timeLimitSeconds,
      });
      setStage("game");
    }, 1000);
  };

  /**
   * Host moves to next question or triggers podium
   */
  const handleHostNextQuestion = async () => {
    if (!currentRoom || !realtimeRef.current) return;
    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex >= roomQuestions.length) {
      // Game Over -> Podium (filter out spectators)
      const competing = connectedPlayers.filter((p) => !p.isSpectator);
      const finalRanked = [...competing].sort((a, b) => b.score - a.score);
      await realtimeRef.current.sendEvent({
        type: "GAME_PODIUM",
        finalPodium: finalRanked,
      });
      setFinalPodium(finalRanked);
      setStage("podium");
    } else {
      // Next Question
      setCurrentQuestionIndex(nextIndex);
      const startTime = Date.now();
      setQuestionStartTime(startTime);

      await realtimeRef.current.sendEvent({
        type: "QUESTION_START",
        questionIndex: nextIndex,
        questionStartTime: startTime,
        timeLimitSeconds,
      });
      setStage("game");
    }
  };

  /**
   * Player submits an answer
   */
  const handlePlayerAnswer = (selectedOption: string, timeMs: number) => {
    if (!currentPlayer || !realtimeRef.current) return;

    realtimeRef.current.sendEvent({
      type: "PLAYER_ANSWERED",
      guestId: currentPlayer.guestId,
      questionIndex: currentQuestionIndex,
      selectedOption,
      answerTimeMs: timeMs,
    });
  };

  /**
   * Time is up for question
   */
  const handleTimeUp = () => {
    if (currentPlayer?.isHost) {
      triggerRoundReveal(currentQuestionIndex);
    }
  };

  /**
   * Send floating emote
   */
  const handleSendEmote = (emoji: string) => {
    if (!currentPlayer || !realtimeRef.current) return;
    const emote: PartyEmote = {
      id: Math.random().toString(36).substring(2, 9),
      emoji,
      senderPseudo: currentPlayer.pseudo,
      createdAt: Date.now(),
    };
    realtimeRef.current.sendEvent({
      type: "EMOTE",
      emote,
    });
  };

  /**
   * Replay in same room (Host)
   */
  const handleReplay = () => {
    // Reset scores & restart
    setConnectedPlayers((prev) =>
      prev.map((p) => ({ ...p, score: 0, streak: 0 }))
    );
    setCurrentPlayer((prev) =>
      prev ? { ...prev, score: 0, streak: 0 } : null
    );
    setCurrentQuestionIndex(0);
    setStage("lobby");
  };

  /**
   * Leave party
   */
  const handleLeave = () => {
    if (realtimeRef.current) {
      realtimeRef.current.disconnect();
      realtimeRef.current = null;
    }
    setStage("hub");
    setCurrentRoom(null);
    setCurrentPlayer(null);
    setConnectedPlayers([]);
  };

  /**
   * Action: Create Room (Host)
   */
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPseudo.trim()) {
      setErrorMsg("Veuillez saisir un pseudo.");
      return;
    }
    if (!selectedQuizId) {
      setErrorMsg("Veuillez sélectionner un quiz.");
      return;
    }

    setConnecting(true);
    setErrorMsg(null);

    try {
      saveGuestPseudo(inputPseudo.trim());
      saveGuestAvatar(selectedAvatar);

      // 1. Fetch questions for quiz (from PATH_QUIZZES or Supabase)
      let questionsData: any[] = [];
      if (PATH_QUIZZES[selectedQuizId]) {
        questionsData = PATH_QUIZZES[selectedQuizId].questions;
      } else {
        const { data, error: qErr } = await supabase
          .from("questions")
          .select("*")
          .eq("quiz_id", selectedQuizId)
          .order("order_index");

        if (!qErr && data && data.length > 0) {
          questionsData = data;
        } else if (PATH_QUIZZES["u1-n1"]) {
          questionsData = PATH_QUIZZES["u1-n1"].questions;
        }
      }

      if (!questionsData || questionsData.length === 0) {
        setErrorMsg("Impossible de charger les questions de ce quiz.");
        setConnecting(false);
        return;
      }

      // 2. Filtrer STRICTEMENT les questions QCM (exclure puzzle_map, map_click, text_free, top10_order)
      const mcqOnlyQuestions = questionsData.filter((q: any) => {
        const type = q.question_type;
        return type === "mcq" || !type;
      });

      const finalQuestionsData = mcqOnlyQuestions.length > 0
        ? mcqOnlyQuestions
        : (PATH_QUIZZES["u1-n1"]?.questions || []);

      const mappedQuestions: PartyQuestion[] = finalQuestionsData.map((q: any, idx: number) => {
        let opts: string[] = [];
        if (Array.isArray(q.options) && q.options.length > 0) {
          opts = q.options.map(String).filter((s) => s.trim().length > 0);
        }

        const correct = String(q.correct_answer || "").trim();

        // S'assurer que la bonne réponse est présente dans les propositions
        if (correct && !opts.includes(correct)) {
          opts.unshift(correct);
        }

        // Normaliser à exactement 4 options (format standard Kahoot 2x2)
        if (opts.length < 4) {
          const fillers = ["Option A", "Option B", "Option C", "Option D", "Autre réponse", "Aucune des réponses"];
          for (const f of fillers) {
            if (opts.length >= 4) break;
            if (!opts.includes(f) && f !== correct) {
              opts.push(f);
            }
          }
        } else if (opts.length > 4) {
          if (opts.indexOf(correct) >= 4) {
            opts[3] = correct;
          }
          opts = opts.slice(0, 4);
        }

        return {
          id: q.id || `q-${idx}`,
          question_text: q.question_text || "Question",
          question_type: "mcq",
          options: opts,
          correct_answer: correct || opts[0] || "",
          image_url: q.image_url || null,
          explanation: q.complement_if_wrong || q.explanation || null,
        };
      });

      const selectedQuiz = quizzesList.find((q) => q.id === selectedQuizId);
      const code = generatePartyPin();
      const guestId = getOrCreateGuestId();
      const isSpectator = hostRole === "spectator";

      const hostPlayer: PartyPlayer = {
        id: guestId,
        guestId,
        userId: user?.id || null,
        pseudo: inputPseudo.trim(),
        avatarUrl: selectedAvatar,
        score: 0,
        streak: 0,
        isHost: true,
        isConnected: true,
        isSpectator: isSpectator,
      };

      const newRoom: PartyRoom = {
        id: code,
        code,
        hostId: user?.id || null,
        hostPseudo: inputPseudo.trim(),
        quizId: selectedQuizId,
        quizTitle: selectedQuiz?.title || "Quiz Géographie",
        quizDescription: selectedQuiz?.description,
        totalQuestions: mappedQuestions.length,
        status: "lobby",
        currentQuestionIndex: 0,
        timeLimitSeconds,
        questions: mappedQuestions,
        gameMode,
        eliminatedPerRound,
        hostIsPlayer: !isSpectator,
      };

      // Try persist in DB if available
      await tryPersistPartyRoom(newRoom);

      // Start Realtime Channel
      const realtime = new PartyRealtimeService(code);
      realtime.subscribe({
        currentPlayer: hostPlayer,
        onEvent: handleRealtimeEvent,
        onPresenceSync: handlePresenceSync,
      });

      realtimeRef.current = realtime;
      setCurrentRoom(newRoom);
      setCurrentPlayer(hostPlayer);
      setConnectedPlayers([hostPlayer]);
      setRoomQuestions(mappedQuestions);
      setStage("lobby");
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de la création du salon.");
    } finally {
      setConnecting(false);
    }
  };

  /**
   * Action: Join Room (Player)
   */
  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = normalizePartyPin(inputPin);
    if (!cleanPin) {
      setErrorMsg("Veuillez saisir le code PIN du salon (ex: TERRA-24).");
      return;
    }
    if (!inputPseudo.trim()) {
      setErrorMsg("Veuillez saisir votre pseudo.");
      return;
    }

    setConnecting(true);
    setErrorMsg(null);

    try {
      saveGuestPseudo(inputPseudo.trim());
      saveGuestAvatar(selectedAvatar);

      const guestId = getOrCreateGuestId();
      const joiningPlayer: PartyPlayer = {
        id: guestId,
        guestId,
        userId: user?.id || null,
        pseudo: inputPseudo.trim(),
        avatarUrl: selectedAvatar,
        score: 0,
        streak: 0,
        isHost: false,
        isConnected: true,
      };

      const roomData: PartyRoom = {
        id: cleanPin,
        code: cleanPin,
        hostPseudo: "Hôte",
        quizId: "",
        quizTitle: "Partie en direct",
        totalQuestions: 0,
        status: "lobby",
        currentQuestionIndex: 0,
        timeLimitSeconds: 15,
      };

      // Connect to Realtime Channel
      const realtime = new PartyRealtimeService(cleanPin);
      realtime.subscribe({
        currentPlayer: joiningPlayer,
        onEvent: handleRealtimeEvent,
        onPresenceSync: handlePresenceSync,
      });

      realtimeRef.current = realtime;
      setCurrentRoom(roomData);
      setCurrentPlayer(joiningPlayer);
      setStage("lobby");
    } catch (err: any) {
      setErrorMsg(err.message || "Impossible de rejoindre ce salon.");
    } finally {
      setConnecting(false);
    }
  };

  // Render Sub-screens based on stage
  if (stage === "lobby" && currentRoom && currentPlayer) {
    return (
      <PartyLobby
        room={currentRoom}
        players={connectedPlayers}
        currentPlayer={currentPlayer}
        onStartGame={handleHostStartGame}
        onLeave={handleLeave}
        onSendEmote={handleSendEmote}
      />
    );
  }

  if (stage === "game" && currentRoom && currentPlayer && roomQuestions[currentQuestionIndex]) {
    return (
      <PartyLiveGame
        room={currentRoom}
        question={roomQuestions[currentQuestionIndex]}
        questionIndex={currentQuestionIndex}
        totalQuestions={roomQuestions.length}
        timeLimitSeconds={timeLimitSeconds}
        questionStartTime={questionStartTime}
        currentPlayer={currentPlayer}
        players={connectedPlayers}
        answeredGuestIds={answeredGuestIds}
        emotes={emotes}
        onAnswer={handlePlayerAnswer}
        onSendEmote={handleSendEmote}
        onTimeUp={handleTimeUp}
      />
    );
  }

  if (stage === "reveal" && currentRoom && currentPlayer && roomQuestions[currentQuestionIndex]) {
    return (
      <PartyRoundReveal
        room={currentRoom}
        question={roomQuestions[currentQuestionIndex]}
        questionIndex={currentQuestionIndex}
        totalQuestions={roomQuestions.length}
        correctAnswer={roundCorrectAnswer}
        answersDistribution={roundDistribution}
        playerResults={roundPlayerResults}
        leaderboard={connectedPlayers}
        currentPlayer={currentPlayer}
        eliminatedPlayerIds={roundEliminatedIds}
        onNextQuestion={handleHostNextQuestion}
      />
    );
  }

  if (stage === "podium" && currentRoom && currentPlayer) {
    return (
      <PartyPodium
        room={currentRoom}
        podium={finalPodium.length > 0 ? finalPodium : connectedPlayers}
        currentPlayer={currentPlayer}
        onReplay={handleReplay}
        onLeave={handleLeave}
      />
    );
  }

  // HUB Screen: Join or Create Room
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#46178f] via-[#5c24b8] to-[#2b0863] text-white p-4 md:p-8 flex flex-col justify-between overflow-x-hidden">
      {/* Floating Kahoot Geometric Shapes in background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20 select-none">
        <span className="absolute top-[8%] left-[6%] text-red-400 text-5xl font-black rotate-12 animate-pulse">
          ▲
        </span>
        <span className="absolute top-[18%] right-[8%] text-blue-400 text-6xl font-black -rotate-12 animate-bounce">
          ◆
        </span>
        <span className="absolute bottom-[20%] left-[8%] text-yellow-300 text-6xl font-black rotate-45">
          ●
        </span>
        <span className="absolute bottom-[10%] right-[10%] text-emerald-400 text-5xl font-black rotate-6 animate-pulse">
          ■
        </span>
        <span className="absolute top-[50%] left-[3%] text-pink-400 text-4xl font-black -rotate-45">
          ▲
        </span>
        <span className="absolute top-[65%] right-[4%] text-amber-300 text-5xl font-black rotate-12">
          ●
        </span>
      </div>

      {/* Top bar */}
      <div className="relative z-10 max-w-4xl w-full mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/duels")}
          className="px-4 py-2 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs md:text-sm transition-all border-2 border-white/20 border-b-4 border-b-black/30 active:translate-y-0.5 active:border-b-2 flex items-center gap-1.5"
        >
          ← Retour aux Duels
        </button>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400 text-slate-950 text-xs md:text-sm font-black shadow-lg border-2 border-amber-300">
          <Crown className="w-4 h-4 fill-slate-950" />
          <span>Mode Party Multijoueur</span>
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping ml-0.5" />
        </div>
      </div>

      {/* Main Hub Container */}
      <div className="relative z-10 max-w-2xl w-full mx-auto my-auto py-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3.5 rounded-3xl bg-amber-400 text-slate-950 shadow-2xl border-4 border-amber-300 border-b-8 border-b-amber-600 mb-3 animate-bounce">
            <Gamepad2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
            Salon Multijoueur Party 🏆
          </h1>
          <p className="text-sm md:text-base text-purple-100 font-semibold mt-1.5 max-w-md mx-auto drop-shadow-xs">
            Défiez jusqu'à 10 amis simultanément avec smartphone ou PC. Réponses en direct & podium garanti !
          </p>
        </div>

        {/* Tab Switcher: Duolingo / Kahoot Tactile 3D Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={() => {
              setActiveTab("join");
              setErrorMsg(null);
            }}
            className={`py-3.5 px-4 rounded-2xl font-black text-sm md:text-base transition-all flex items-center justify-center gap-2 border-2 border-b-6 active:translate-y-1 active:border-b-2 shadow-lg ${
              activeTab === "join"
                ? "bg-emerald-500 text-white border-emerald-400 border-b-emerald-700 shadow-emerald-900/40"
                : "bg-white/20 text-purple-100 border-white/20 border-b-white/10 hover:bg-white/30"
            }`}
          >
            <LogIn className="w-5 h-5" />
            <span>Rejoindre avec un PIN</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("create");
              setErrorMsg(null);
            }}
            className={`py-3.5 px-4 rounded-2xl font-black text-sm md:text-base transition-all flex items-center justify-center gap-2 border-2 border-b-6 active:translate-y-1 active:border-b-2 shadow-lg ${
              activeTab === "create"
                ? "bg-amber-400 text-slate-950 border-amber-300 border-b-amber-600 shadow-amber-900/40"
                : "bg-white/20 text-purple-100 border-white/20 border-b-white/10 hover:bg-white/30"
            }`}
          >
            <PlusCircle className="w-5 h-5" />
            <span>Créer un Salon (Hôte)</span>
          </button>
        </div>

        {/* Form Card: Crisp White Card with High Contrast */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-slate-100 border-b-8 border-b-slate-300 text-slate-800">
          {errorMsg && (
            <div className="mb-5 p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-800 text-xs md:text-sm font-bold flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === "join" ? (
            <form onSubmit={handleJoinRoom} className="space-y-5">
              {/* PIN Code Input */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  Code du Salon (ex: TERRA-24)
                </label>
                <input
                  type="text"
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value.toUpperCase())}
                  placeholder="TERRA-24"
                  maxLength={10}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-4 border-b-6 border-slate-200 text-center font-mono text-3xl md:text-4xl font-black text-purple-900 tracking-widest placeholder-slate-300 focus:bg-white focus:border-purple-500 focus:outline-none transition-all shadow-inner"
                  required
                />
              </div>

              {/* Pseudo Input */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  Votre Pseudo de Joueur
                </label>
                <input
                  type="text"
                  value={inputPseudo}
                  onChange={(e) => setInputPseudo(e.target.value)}
                  placeholder="CapitaineTerra"
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-3 border-slate-200 text-slate-900 font-bold text-base placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
                  required
                />
              </div>

              {/* Avatar Picker */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  Choisissez votre avatar de fête
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {AVAILABLE_AVATARS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setSelectedAvatar(av)}
                      className={`w-12 h-12 rounded-2xl text-2xl flex items-center justify-center shrink-0 transition-all border-2 border-b-4 active:translate-y-0.5 active:border-b-2 ${
                        selectedAvatar === av
                          ? "bg-amber-400 text-slate-900 scale-110 shadow-md border-amber-500 border-b-amber-600 ring-2 ring-purple-600"
                          : "bg-slate-100 hover:bg-slate-200 border-slate-200 border-b-slate-300 text-slate-700"
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={connecting}
                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-lg shadow-xl shadow-emerald-500/30 transition-all border-b-6 border-b-emerald-700 active:translate-y-1 active:border-b-2 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connexion au salon...
                  </>
                ) : (
                  <>
                    <span>Rejoindre la partie</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateRoom} className="space-y-6">
              {/* Pseudo Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                    Votre Pseudo d'Hôte
                  </label>
                  <input
                    type="text"
                    value={inputPseudo}
                    onChange={(e) => setInputPseudo(e.target.value)}
                    placeholder="MaîtreDuJeu"
                    maxLength={20}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border-3 border-slate-200 text-slate-900 font-bold text-base placeholder-slate-400 focus:bg-white focus:border-purple-500 focus:outline-none transition-all"
                    required
                  />
                </div>

                {/* Avatar Picker */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                    Votre Avatar
                  </label>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {AVAILABLE_AVATARS.slice(0, 6).map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setSelectedAvatar(av)}
                        className={`w-11 h-11 rounded-2xl text-xl flex items-center justify-center shrink-0 transition-all border-2 border-b-4 active:translate-y-0.5 active:border-b-2 ${
                          selectedAvatar === av
                            ? "bg-amber-400 text-slate-900 scale-105 shadow-md border-amber-500 border-b-amber-600 ring-2 ring-purple-600"
                            : "bg-slate-100 hover:bg-slate-200 border-slate-200 border-b-slate-300 text-slate-700"
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rôle de l'Hôte dans la partie : Joueur vs Écran de projection */}
              <div className="pt-2 border-t-2 border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
                    Rôle de l'Hôte sur cet écran
                  </label>
                  <span className="text-[11px] font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    {hostRole === "spectator" ? "📺 Mode Grand Écran / TV" : "🎮 Joueur Actif"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => setHostRole("player")}
                    className={`p-3.5 rounded-2xl text-left transition-all border-2 border-b-4 active:translate-y-0.5 active:border-b-2 flex flex-col gap-1 ${
                      hostRole === "player"
                        ? "bg-purple-50 border-purple-500 border-b-purple-700 text-purple-950 shadow-md ring-2 ring-purple-400/30"
                        : "bg-slate-50 border-slate-200 border-b-slate-300 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm flex items-center gap-1.5 text-purple-900">
                        🎮 Hôte Joueur
                      </span>
                      {hostRole === "player" && (
                        <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      Vous répondez aux questions sur cet écran et figurez au classement et sur le podium avec vos invités.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHostRole("spectator")}
                    className={`p-3.5 rounded-2xl text-left transition-all border-2 border-b-4 active:translate-y-0.5 active:border-b-2 flex flex-col gap-1 ${
                      hostRole === "spectator"
                        ? "bg-amber-50 border-amber-500 border-b-amber-600 text-amber-950 shadow-md ring-2 ring-amber-400/30"
                        : "bg-slate-50 border-slate-200 border-b-slate-300 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm flex items-center gap-1.5 text-amber-900">
                        📺 Écran de Projection uniquement
                      </span>
                      {hostRole === "spectator" && (
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      Style Kahoot TV : vous ne jouez pas. Votre écran sert d'affichage géant des questions et podium pour vos invités.
                    </span>
                  </button>
                </div>
              </div>

              {/* Time limit selector */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  Chrono par question
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 15, 20, 30].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setTimeLimitSeconds(sec)}
                      className={`py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all border-2 border-b-4 active:translate-y-0.5 active:border-b-2 ${
                        timeLimitSeconds === sec
                          ? "bg-purple-600 text-white border-purple-500 border-b-purple-800 shadow-md"
                          : "bg-slate-100 border-slate-200 border-b-slate-300 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 inline mr-1" />
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Game Mode Selector: Classic vs Battle Royale */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  Mode de Jeu Multijoueur
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => setGameMode("classic")}
                    className={`p-3.5 rounded-2xl text-left transition-all border-2 border-b-4 active:translate-y-0.5 active:border-b-2 flex flex-col gap-1 ${
                      gameMode === "classic"
                        ? "bg-indigo-50 border-indigo-400 border-b-indigo-600 text-indigo-950 shadow-md"
                        : "bg-slate-50 border-slate-200 border-b-slate-300 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span className="font-black text-sm flex items-center gap-1.5 text-indigo-900">
                      🏆 Mode Classique
                    </span>
                    <span className="text-[11px] text-slate-500 font-semibold leading-tight">
                      Tous les joueurs répondent à chaque question jusqu'au podium final.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGameMode("battle_royale")}
                    className={`p-3.5 rounded-2xl text-left transition-all border-2 border-b-4 active:translate-y-0.5 active:border-b-2 flex flex-col gap-1 ${
                      gameMode === "battle_royale"
                        ? "bg-rose-50 border-rose-400 border-b-rose-600 text-rose-950 shadow-md"
                        : "bg-slate-50 border-slate-200 border-b-slate-300 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span className="font-black text-sm flex items-center gap-1.5 text-rose-900">
                      <Skull className="w-4 h-4 text-rose-600" />
                      💀 Mort Subite Battle Royale
                    </span>
                    <span className="text-[11px] text-slate-500 font-semibold leading-tight">
                      Les derniers du classement sont éliminés à chaque tour !
                    </span>
                  </button>
                </div>

                {gameMode === "battle_royale" && (
                  <div className="mt-2 p-3 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-900 text-xs flex items-center justify-between">
                    <span className="font-bold">Éliminés à chaque tour :</span>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setEliminatedPerRound(count)}
                          className={`w-7 h-7 rounded-xl font-black text-xs transition border-b-2 ${
                            eliminatedPerRound === count
                              ? "bg-rose-600 text-white border-b-rose-800 shadow-sm"
                              : "bg-white text-rose-800 border-rose-200 hover:bg-rose-100"
                          }`}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 🎯 QUIZ SELECTOR: Simplified with Category Chips & Search */}
              <div className="pt-2 border-t-2 border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
                    Sélectionner un Quiz ({filteredQuizzes.length})
                  </label>
                  {selectedQuizId && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ✓ Quiz sélectionné
                    </span>
                  )}
                </div>

                {/* 1. Category Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-2.5">
                  {categoryChips.map((chip) => {
                    const isSelected = selectedCategoryFilter === chip.id;
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => setSelectedCategoryFilter(chip.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border-2 border-b-3 active:translate-y-0.5 active:border-b ${
                          isSelected
                            ? "bg-purple-600 text-white border-purple-500 border-b-purple-800 shadow-xs scale-105"
                            : "bg-slate-100 text-slate-700 border-slate-200 border-b-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        <span className="mr-1">{chip.emoji}</span>
                        <span>{chip.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 2. Search Input with instant Clear */}
                <div className="relative mb-3">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuizQuery}
                    onChange={(e) => setSearchQuizQuery(e.target.value)}
                    placeholder="Rechercher par titre, pays, continent, thème..."
                    className="w-full pl-9 pr-9 py-2.5 text-xs sm:text-sm font-semibold rounded-2xl bg-slate-50 border-2 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-purple-500 focus:outline-none transition-all shadow-inner"
                  />
                  {searchQuizQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuizQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                      title="Effacer la recherche"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* 3. Quiz Card List */}
                {loadingQuizzes && quizzesList.length === 0 ? (
                  <div className="p-6 text-center text-xs text-purple-700 font-bold bg-purple-50 rounded-2xl border border-purple-200">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                    Chargement des quiz disponibles...
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {filteredQuizzes.map((quiz) => {
                      const isSelected = selectedQuizId === quiz.id;
                      const badge = getQuizBadge(quiz);
                      const diff = getDifficultyBadge(quiz.difficulty);

                      return (
                        <button
                          key={quiz.id}
                          type="button"
                          onClick={() => setSelectedQuizId(quiz.id)}
                          className={`w-full p-3 rounded-2xl text-left transition-all border-2 border-b-4 flex items-center justify-between text-xs active:translate-y-0.5 active:border-b-2 ${
                            isSelected
                              ? "bg-amber-50/90 border-amber-400 border-b-amber-600 shadow-md ring-2 ring-amber-400/50"
                              : "bg-slate-50 hover:bg-slate-100 border-slate-200 border-b-slate-300 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden mr-2">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg shrink-0 shadow-xs">
                              {badge.emoji}
                            </div>
                            <div className="overflow-hidden">
                              <div className="flex items-center gap-2">
                                <span className="truncate font-black text-sm text-slate-900">
                                  {quiz.title}
                                </span>
                                {quiz.is_my_quiz && (
                                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded shrink-0 border ${
                                    quiz.is_private
                                      ? "bg-purple-100 text-purple-900 border-purple-300"
                                      : "bg-emerald-100 text-emerald-900 border-emerald-300"
                                  }`}>
                                    {quiz.is_private ? "🔒 Privé" : "🌐 Public"}
                                  </span>
                                )}
                                {quiz.is_shared && (
                                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded shrink-0 bg-blue-100 text-blue-900 border border-blue-300">
                                    🤝 Partagé
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded border ${diff.style}`}>
                                  {diff.label}
                                </span>
                                <span className="text-[11px] text-slate-500 font-bold">
                                  {quiz.question_count || 10} questions
                                </span>
                                <span className="text-[11px] text-purple-700 font-semibold hidden sm:inline">
                                  • {badge.label}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 ml-2">
                            {isSelected ? (
                              <span className="flex items-center gap-1 bg-amber-400 text-slate-950 font-black px-2.5 py-1 rounded-xl shadow-xs border border-amber-500 text-xs">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span className="hidden sm:inline">Choisi</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 text-xs">
                                Choisir
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}

                    {filteredQuizzes.length === 0 && (
                      <div className="text-center py-6 px-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-600">
                        <p className="font-bold text-sm mb-1">Aucun quiz ne correspond à votre filtre.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategoryFilter("all");
                            setSearchQuizQuery("");
                          }}
                          className="mt-2 px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-black transition"
                        >
                          Réinitialiser les filtres ✨
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={connecting || !selectedQuizId}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-lg shadow-xl shadow-amber-500/30 transition-all border-b-6 border-b-amber-700 active:translate-y-1 active:border-b-2 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Création du salon...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Lancer mon Salon & Inviter des Amis 👑</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 max-w-4xl w-full mx-auto text-center text-xs text-purple-200/80 font-bold">
        TerraCoast Party • Compatible tous navigateurs, ordinateurs et smartphones.
      </div>
    </div>
  );
}
