export type PartyRoomStatus =
  | "lobby"
  | "countdown"
  | "question"
  | "round_reveal"
  | "podium"
  | "finished"
  | "cancelled";

export interface PartyPlayer {
  id: string;
  guestId: string;
  userId?: string | null;
  pseudo: string;
  avatarUrl?: string | null;
  score: number;
  streak: number;
  isHost: boolean;
  isConnected: boolean;
  hasAnsweredCurrentQuestion?: boolean;
  lastAnswerCorrect?: boolean | null;
  lastAnswerTimeMs?: number | null;
  lastPointsEarned?: number;
  rank?: number;
  isEliminated?: boolean;
  eliminatedAtRound?: number;
}

export interface PartyQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options?: string[] | null;
  correct_answer?: string | null;
  image_url?: string | null;
  option_images?: Record<string, string> | null;
  explanation?: string | null;
  time_limit?: number | null;
}

export interface PartyRoom {
  id: string;
  code: string;
  hostId?: string | null;
  hostPseudo: string;
  quizId: string;
  quizTitle: string;
  quizDescription?: string | null;
  totalQuestions: number;
  status: PartyRoomStatus;
  currentQuestionIndex: number;
  timeLimitSeconds: number;
  questionStartTime?: number | null;
  questions?: PartyQuestion[];
  gameMode?: "classic" | "battle_royale";
  eliminatedPerRound?: number;
}

export interface PartyAnswerSubmission {
  guestId: string;
  pseudo: string;
  questionIndex: number;
  selectedOption: string;
  answerTimeMs: number;
  isCorrect: boolean;
  pointsAwarded: number;
}

export interface PartyEmote {
  id: string;
  emoji: string;
  senderPseudo: string;
  createdAt: number;
}

export type PartyRealtimeEvent =
  | {
      type: "ROOM_STATE_SYNC";
      room: Partial<PartyRoom>;
      players: PartyPlayer[];
    }
  | {
      type: "GAME_START";
      totalQuestions: number;
      timeLimitSeconds: number;
      questions: PartyQuestion[];
    }
  | {
      type: "QUESTION_START";
      questionIndex: number;
      questionStartTime: number;
      timeLimitSeconds: number;
    }
  | {
      type: "PLAYER_ANSWERED";
      guestId: string;
      questionIndex: number;
      selectedOption: string;
      answerTimeMs: number;
    }
  | {
      type: "ROUND_REVEAL";
      questionIndex: number;
      correctAnswer: string;
      answersDistribution: Record<string, number>;
      playerResults: Record<
        string,
        {
          isCorrect: boolean;
          pointsEarned: number;
          totalScore: number;
          streak: number;
          isEliminated?: boolean;
        }
      >;
      leaderboard: PartyPlayer[];
      eliminatedPlayerIds?: string[];
      remainingPlayersCount?: number;
    }
  | {
      type: "NEXT_QUESTION";
      questionIndex: number;
    }
  | {
      type: "GAME_PODIUM";
      finalPodium: PartyPlayer[];
    }
  | {
      type: "EMOTE";
      emote: PartyEmote;
    };

/**
 * Calcule les éliminations pour le mode Battle Royale (Mort Subite).
 * Élimine les N joueurs actifs ayant le score le plus bas ce tour-ci,
 * tout en garantissant qu'au moins un joueur actif (survivant) reste en jeu.
 */
export function computeBattleRoyaleEliminations(
  players: PartyPlayer[],
  eliminatedPerRound: number = 1,
  currentRoundIndex: number = 0
): {
  updatedPlayers: PartyPlayer[];
  newlyEliminatedIds: string[];
  remainingCount: number;
} {
  const activePlayers = players.filter((p) => !p.isEliminated);

  // Si 2 joueurs ou moins sont actifs, on ne force pas l'élimination pour garder la finale
  if (activePlayers.length <= 2) {
    return {
      updatedPlayers: [...players],
      newlyEliminatedIds: [],
      remainingCount: activePlayers.length,
    };
  }

  // Ne pas éliminer plus que ce qui laisserait au moins 1 survivant
  const countToEliminate = Math.min(
    Math.max(1, eliminatedPerRound),
    activePlayers.length - 1
  );

  // Trier les actifs par score croissant (les plus bas scores en premier)
  const sortedActive = [...activePlayers].sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return a.guestId.localeCompare(b.guestId);
  });

  const toEliminate = sortedActive.slice(0, countToEliminate);
  const newlyEliminatedIds = toEliminate.map((p) => p.guestId);
  const newlyElimSet = new Set(newlyEliminatedIds);

  const updatedPlayers = players.map((p) => {
    if (newlyElimSet.has(p.guestId)) {
      return {
        ...p,
        isEliminated: true,
        eliminatedAtRound: currentRoundIndex,
      };
    }
    return p;
  });

  const remainingCount = activePlayers.length - newlyEliminatedIds.length;

  return {
    updatedPlayers,
    newlyEliminatedIds,
    remainingCount,
  };
}
