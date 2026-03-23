import type { Database } from "../../lib/database.types";

export type Duel = Database["public"]["Tables"]["duels"]["Row"];
export type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type DuelInvitation =
  Database["public"]["Tables"]["duel_invitations"]["Row"];
export type DuelMatchmakingQueue =
  Database["public"]["Tables"]["duel_matchmaking_queue"]["Row"];
export type DuelFeatureFlag =
  Database["public"]["Tables"]["duel_feature_flags"]["Row"];
export type Difficulty = "easy" | "medium" | "hard";
export type NavigationParams = Record<string, unknown>;
export type NavigateFn = (view: string, data?: NavigationParams) => void;

export interface DuelWithDetails extends Duel {
  quizzes: Quiz;
  player1: Profile;
  player2: Profile;
  player1_session?: {
    score: number;
    correct_answers: number;
    total_questions: number;
  };
  player2_session?: {
    score: number;
    correct_answers: number;
    total_questions: number;
  };
}

export interface DuelWithMaybeDetails extends Duel {
  quizzes: Quiz | null;
  player1: Profile | null;
  player2: Profile | null;
  player1_session?: {
    score: number;
    correct_answers: number;
    total_questions: number;
  };
  player2_session?: {
    score: number;
    correct_answers: number;
    total_questions: number;
  };
}

export interface InvitationWithDetails extends DuelInvitation {
  from_user: Profile;
  to_user: Profile;
  quizzes: Quiz;
}

export interface InvitationWithMaybeDetails extends DuelInvitation {
  from_user: Profile | null;
  to_user: Profile | null;
  quizzes: Quiz | null;
}

export interface MatchedPreview {
  duelId: string;
  quizId: string;
  opponentPseudo: string;
  opponentMmr: number;
  matchType: "ranked" | "casual";
}
