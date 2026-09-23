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
        }
      >;
      leaderboard: PartyPlayer[];
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
