import type { Database } from "../../../lib/database.types";
import type { CountryGameEntry, CountryMetric } from "../../../lib/countryGameData";

export type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
export type Question = Database["public"]["Tables"]["questions"]["Row"];

export interface QuizAnswer {
  question_id: string;
  user_answer: string;
  is_correct: boolean;
  time_taken: number;
  points_earned: number;
}

export interface PuzzleState {
  countries: CountryGameEntry[];
  assignments: Record<string, string>;
  pickedIso3s: string[];
}

export interface Top10State {
  metric: CountryMetric;
  expected: string[];
  order: string[];
}

export interface CountryMultiInputRow {
  countryName: string;
  capital: string;
}

export interface QuizChallenge {
  id: string;
  from_user_id: string;
  to_user_id: string;
  quiz_id: string;
  target_score: number;
  status: string;
  from_profile?: { pseudo: string | null };
}

export interface PendingSessionPayload {
  sessionId: string;
  score: number;
  accuracy: number;
  totalTime: number;
  correctAnswers: number;
  totalQuestions: number;
  challengeId?: string | null;
  challengeTargetScore?: number;
  mode?: string | null;
  duelId?: string | null;
}
