import { supabase } from "./supabase";
import type { Database } from "./database.types";
import { formatDateToIsoDay } from "./streakUtils";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];

export interface DailyLeaderboardEntry {
  sessionId: string;
  playerId: string;
  pseudo: string;
  avatarUrl?: string | null;
  frameStyle?: string | null;
  level: number;
  score: number;
  accuracyPercentage: number;
  timeTakenSeconds: number;
  completedAt: string;
  rank: number;
}

export interface DailyChallengeStatus {
  hasPlayedToday: boolean;
  userBestEntry: DailyLeaderboardEntry | null;
}

/**
 * Hash déterministe pour convertir une chaîne "YYYY-MM-DD" en nombre entier stable
 */
function hashStringToInt(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Sélectionne de manière 100% déterministe le quiz du jour parmi la liste des quiz publics
 */
export function getDailyQuizForDate(quizzes: Quiz[], dateString: string = formatDateToIsoDay()): Quiz | null {
  if (!quizzes || quizzes.length === 0) return null;

  // Filtrer de préférence les quiz publics ou globaux
  const candidates = quizzes.filter(
    (q) => q.is_public || q.is_global
  );

  const pool = candidates.length > 0 ? candidates : quizzes;

  // Trier par ID pour un ordre stable indépendamment de l'ordre retourné par l'API
  const sortedPool = [...pool].sort((a, b) => a.id.localeCompare(b.id));

  const seed = hashStringToInt(dateString);
  const index = seed % sortedPool.length;
  return sortedPool[index];
}

/**
 * Calcule le temps restant avant le prochain Quiz du Jour (minuit UTC ou local)
 */
export function getTimeUntilNextChallenge(): {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
} {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diffMs = Math.max(0, tomorrow.getTime() - now.getTime());
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  const pad = (n: number) => String(n).padStart(2, "0");
  const formatted = `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;

  return { hours, minutes, seconds, formatted };
}

/**
 * Récupère le classement du jour pour le quiz quotidien
 */
export async function fetchDailyLeaderboard(
  quizId: string,
  targetDate: string = formatDateToIsoDay()
): Promise<DailyLeaderboardEntry[]> {
  try {
    const startOfDay = `${targetDate}T00:00:00.000Z`;
    const endOfDay = `${targetDate}T23:59:59.999Z`;

    const { data, error } = await supabase
      .from("game_sessions")
      .select(
        `
        id,
        player_id,
        score,
        accuracy_percentage,
        time_taken_seconds,
        completed_at,
        profiles (
          pseudo,
          avatar_url,
          frame_style,
          level
        )
      `
      )
      .eq("quiz_id", quizId)
      .eq("completed", true)
      .gte("completed_at", startOfDay)
      .lte("completed_at", endOfDay)
      .order("score", { ascending: false })
      .order("accuracy_percentage", { ascending: false })
      .order("time_taken_seconds", { ascending: true })
      .limit(100);

    if (error) {
      console.warn("Erreur fetchDailyLeaderboard:", error);
      return [];
    }

    if (!data || data.length === 0) return [];

    // Dé-doublonnage : ne garder que le meilleur score par joueur
    const bestByPlayer = new Map<string, any>();
    for (const session of data) {
      const pId = session.player_id;
      if (!bestByPlayer.has(pId)) {
        bestByPlayer.set(pId, session);
      }
    }

    const uniqueSessions = Array.from(bestByPlayer.values()).slice(0, 50);

    return uniqueSessions.map((s, index) => {
      const profile = s.profiles as any;
      return {
        sessionId: s.id,
        playerId: s.player_id,
        pseudo: profile?.pseudo || "Explorateur",
        avatarUrl: profile?.avatar_url,
        frameStyle: profile?.frame_style,
        level: profile?.level || 1,
        score: s.score,
        accuracyPercentage: s.accuracy_percentage,
        timeTakenSeconds: s.time_taken_seconds,
        completedAt: s.completed_at || "",
        rank: index + 1,
      };
    });
  } catch (err) {
    console.error("fetchDailyLeaderboard exception:", err);
    return [];
  }
}

/**
 * Récupère le statut du joueur pour le quiz du jour
 */
export async function fetchUserDailyStatus(
  quizId: string,
  userId: string,
  targetDate: string = formatDateToIsoDay()
): Promise<DailyChallengeStatus> {
  try {
    const leaderboard = await fetchDailyLeaderboard(quizId, targetDate);
    const userEntry = leaderboard.find((entry) => entry.playerId === userId) || null;

    return {
      hasPlayedToday: Boolean(userEntry),
      userBestEntry: userEntry,
    };
  } catch (err) {
    return {
      hasPlayedToday: false,
      userBestEntry: null,
    };
  }
}
