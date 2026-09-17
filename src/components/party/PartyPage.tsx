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
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import type {
  PartyPlayer,
  PartyQuestion,
  PartyRealtimeEvent,
  PartyRoom,
  PartyEmote,
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

interface QuizItem {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  difficulty?: string | null;
  question_count?: number;
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

  // Create room form states
  const [quizzesList, setQuizzesList] = useState<QuizItem[]>([]);
  const [searchQuizQuery, setSearchQuizQuery] = useState("");
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number>(15);
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

  // Load published quizzes for host creation tab
  useEffect(() => {
    if (activeTab === "create" && quizzesList.length === 0) {
      setLoadingQuizzes(true);
      supabase
        .from("quizzes")
        .select("id, title, description, category, difficulty")
        .eq("status", "published")
        .limit(40)
        .then(({ data }) => {
          if (data) {
            setQuizzesList(data as QuizItem[]);
            if (data.length > 0 && !selectedQuizId) {
              setSelectedQuizId(data[0].id);
            }
          }
          setLoadingQuizzes(false);
        });
    }
  }, [activeTab, quizzesList.length, selectedQuizId]);

  // Disconnect realtime on unmount
  useEffect(() => {
    return () => {
      if (realtimeRef.current) {
        realtimeRef.current.disconnect();
      }
    };
  }, []);

  // Filtered quizzes for search
  const filteredQuizzes = quizzesList.filter((q) =>
    searchQuizQuery
      ? q.title.toLowerCase().includes(searchQuizQuery.toLowerCase()) ||
        (q.category && q.category.toLowerCase().includes(searchQuizQuery.toLowerCase()))
      : true
  );

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

          // If Host: check if all connected players have answered
          if (currentPlayerRef.current?.isHost) {
            const totalPlayers = connectedPlayersRef.current.length;
            if (
              totalPlayers > 0 &&
              answersThisRoundRef.current.size >= totalPlayers
            ) {
              // Trigger reveal automatically!
              triggerRoundReveal(event.questionIndex);
            }
          }
          break;
        }

        case "ROUND_REVEAL": {
          setRoundCorrectAnswer(event.correctAnswer);
          setRoundDistribution(event.answersDistribution);
          setRoundPlayerResults(event.playerResults);
          setConnectedPlayers(event.leaderboard);

          // Update current player's personal score and streak
          const myId = currentPlayerRef.current?.guestId;
          if (myId && event.playerResults[myId]) {
            const myRes = event.playerResults[myId];
            setCurrentPlayer((prev) =>
              prev
                ? {
                    ...prev,
                    score: myRes.totalScore,
                    streak: myRes.streak,
                    lastAnswerCorrect: myRes.isCorrect,
                    lastPointsEarned: myRes.pointsEarned,
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

      // Sort leaderboard
      updatedPlayers.sort((a, b) => b.score - a.score);
      const rankedPlayers = updatedPlayers.map((p, idx) => ({
        ...p,
        rank: idx + 1,
      }));

      realtimeRef.current.sendEvent({
        type: "ROUND_REVEAL",
        questionIndex: qIndex,
        correctAnswer,
        answersDistribution: distribution,
        playerResults,
        leaderboard: rankedPlayers,
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
      // Game Over -> Podium
      const finalRanked = [...connectedPlayers].sort((a, b) => b.score - a.score);
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

      // 1. Fetch questions for quiz
      const { data: questionsData, error: qErr } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", selectedQuizId)
        .order("order_index");

      if (qErr || !questionsData || questionsData.length === 0) {
        setErrorMsg("Impossible de charger les questions de ce quiz.");
        setConnecting(false);
        return;
      }

      const selectedQuiz = quizzesList.find((q) => q.id === selectedQuizId);
      const code = generatePartyPin();
      const guestId = getOrCreateGuestId();

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
      };

      const newRoom: PartyRoom = {
        id: code,
        code,
        hostId: user?.id || null,
        hostPseudo: inputPseudo.trim(),
        quizId: selectedQuizId,
        quizTitle: selectedQuiz?.title || "Quiz Géographie",
        quizDescription: selectedQuiz?.description,
        totalQuestions: questionsData.length,
        status: "lobby",
        currentQuestionIndex: 0,
        timeLimitSeconds,
        questions: questionsData as PartyQuestion[],
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
      setRoomQuestions(questionsData as PartyQuestion[]);
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white p-4 md:p-8 flex flex-col justify-between">
      {/* Top bar */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/duels")}
          className="text-xs md:text-sm text-indigo-300 hover:text-white transition flex items-center gap-1.5"
        >
          ← Retour aux Duels
        </button>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30">
          <Crown className="w-3.5 h-3.5" />
          Mode Party Multijoueur
        </div>
      </div>

      {/* Main Hub Container */}
      <div className="max-w-xl w-full mx-auto my-auto py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3.5 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-xl shadow-amber-500/20 mb-3">
            <Gamepad2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 tracking-tight">
            {t("party.title") || "Salon en Direct 🏆"}
          </h1>
          <p className="text-sm md:text-base text-indigo-200 mt-2 max-w-md mx-auto">
            {t("party.quickDesc") || "Jouez jusqu'à 10 amis simultanément avec smartphone ou PC. Réponses en direct & podium garanti !"}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab("join");
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "join"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30"
                : "text-indigo-200 hover:text-white"
            }`}
          >
            <LogIn className="w-4 h-4" />
            {t("party.joinRoom") || "Rejoindre un salon"}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("create");
              setErrorMsg(null);
            }}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === "create"
                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30"
                : "text-indigo-200 hover:text-white"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            {t("party.createRoom") || "Créer un salon"}
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs md:text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === "join" ? (
            <form onSubmit={handleJoinRoom} className="space-y-5">
              {/* PIN Code Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-indigo-200 mb-2">
                  {t("party.roomCode") || "Code du Salon"} (ex: TERRA-24)
                </label>
                <input
                  type="text"
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value.toUpperCase())}
                  placeholder="TERRA-24"
                  maxLength={10}
                  className="w-full px-5 py-4 rounded-2xl bg-black/30 border border-white/20 text-center font-mono text-2xl md:text-3xl font-black text-amber-300 tracking-widest placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  required
                />
              </div>

              {/* Pseudo Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-indigo-200 mb-2">
                  {t("party.yourPseudo") || "Votre Pseudo"}
                </label>
                <input
                  type="text"
                  value={inputPseudo}
                  onChange={(e) => setInputPseudo(e.target.value)}
                  placeholder="CapitaineTerra"
                  maxLength={20}
                  className="w-full px-5 py-3 rounded-2xl bg-black/30 border border-white/20 text-white font-semibold text-base placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  required
                />
              </div>

              {/* Avatar Picker */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-indigo-200 mb-2">
                  {t("party.chooseAvatar") || "Choisissez un avatar"}
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {AVAILABLE_AVATARS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setSelectedAvatar(av)}
                      className={`w-11 h-11 rounded-2xl text-xl flex items-center justify-center shrink-0 transition ${
                        selectedAvatar === av
                          ? "bg-amber-400 text-slate-900 scale-110 shadow-lg ring-2 ring-white"
                          : "bg-white/10 hover:bg-white/20 text-white"
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
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-base shadow-xl shadow-emerald-500/30 transition transform hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connexion au salon...
                  </>
                ) : (
                  <>
                    {t("party.joinButton") || "Rejoindre la partie 🚀"}
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateRoom} className="space-y-5">
              {/* Pseudo Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-indigo-200 mb-2">
                  Votre Pseudo d'Hôte
                </label>
                <input
                  type="text"
                  value={inputPseudo}
                  onChange={(e) => setInputPseudo(e.target.value)}
                  placeholder="MaîtreDuJeu"
                  maxLength={20}
                  className="w-full px-5 py-3 rounded-2xl bg-black/30 border border-white/20 text-white font-semibold text-base placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                />
              </div>

              {/* Avatar Picker */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-indigo-200 mb-2">
                  Votre avatar
                </label>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {AVAILABLE_AVATARS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setSelectedAvatar(av)}
                      className={`w-11 h-11 rounded-2xl text-xl flex items-center justify-center shrink-0 transition ${
                        selectedAvatar === av
                          ? "bg-amber-400 text-slate-900 scale-110 shadow-lg ring-2 ring-white"
                          : "bg-white/10 hover:bg-white/20 text-white"
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time limit selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-indigo-200 mb-2">
                  Temps par question
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 15, 20, 30].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setTimeLimitSeconds(sec)}
                      className={`py-2 rounded-xl text-xs font-bold transition border ${
                        timeLimitSeconds === sec
                          ? "bg-amber-400 text-slate-900 border-amber-300 font-extrabold"
                          : "bg-white/5 border-white/10 text-indigo-200 hover:bg-white/10"
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Quiz Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-indigo-200 mb-2">
                  Sélectionner un Quiz
                </label>

                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-indigo-300 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuizQuery}
                    onChange={(e) => setSearchQuizQuery(e.target.value)}
                    placeholder="Filtrer par titre ou catégorie..."
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-black/30 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </div>

                {loadingQuizzes ? (
                  <div className="p-6 text-center text-xs text-indigo-300">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Chargement des quiz disponibles...
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {filteredQuizzes.map((quiz) => (
                      <button
                        key={quiz.id}
                        type="button"
                        onClick={() => setSelectedQuizId(quiz.id)}
                        className={`w-full p-3 rounded-xl text-left transition border flex items-center justify-between text-xs ${
                          selectedQuizId === quiz.id
                            ? "bg-indigo-500/40 border-amber-400 text-white font-bold shadow-md"
                            : "bg-white/5 border-white/5 text-indigo-200 hover:bg-white/10"
                        }`}
                      >
                        <div className="overflow-hidden mr-2">
                          <span className="block truncate font-bold text-white">
                            {quiz.title}
                          </span>
                          <span className="text-[10px] opacity-70">
                            {quiz.category || "Géographie"} • {quiz.difficulty || "Général"}
                          </span>
                        </div>
                        {selectedQuizId === quiz.id && (
                          <span className="text-amber-400 font-bold">✓</span>
                        )}
                      </button>
                    ))}

                    {filteredQuizzes.length === 0 && (
                      <div className="text-center py-4 text-xs text-indigo-300">
                        Aucun quiz trouvé.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={connecting || !selectedQuizId}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-black text-base shadow-xl shadow-indigo-500/30 transition transform hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Création du salon...
                  </>
                ) : (
                  <>
                    Générer mon Salon & Inviter des Amis 👑
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl w-full mx-auto text-center text-xs text-indigo-300/60">
        TerraCoast Party • Compatible tous navigateurs, ordinateurs et smartphones.
      </div>
    </div>
  );
}
