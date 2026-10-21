/**
 * 🎯 Daily Missions Manager (Missions du Jour)
 * Gère les 3 objectifs quotidiens, leur suivi automatique,
 * la réclamation des récompenses individuelles (XP & 💎)
 * et le Coffre Bonus de fin de journée (3/3 validées).
 */

import { addGems, getPlayerGamificationState, savePlayerGamificationState, calculateLevelForXp } from "./gamificationManager";
import { formatDateToIsoDay } from "./streakUtils";

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  category: "arcade" | "quiz" | "conquest" | "study";
  icon: string;
  targetCount: number;
  currentCount: number;
  rewardGems: number;
  rewardXp: number;
  completed: boolean;
  claimed: boolean;
}

export interface DailyMissionsState {
  date: string;
  missions: DailyMission[];
  bonusClaimed: boolean;
  bonusGems: number;
  bonusXp: number;
}

const MISSIONS_STORAGE_PREFIX = "terracoast_daily_missions_";
export const DAILY_MISSIONS_UPDATED_EVENT = "terracoast:daily_missions_updated";

const ALL_MISSION_TEMPLATES: Array<Omit<DailyMission, "currentCount" | "completed" | "claimed">> = [
  {
    id: "geo_detective_explorer",
    title: "Enquêteur Satellite",
    description: "Jouer 1 partie de Geo-Detective",
    category: "arcade",
    icon: "🛰️",
    targetCount: 1,
    rewardGems: 25,
    rewardXp: 60,
  },
  {
    id: "silhouette_guesser",
    title: "L'Œil du Cartographe",
    description: "Trouver 1 Silhouette Mystère",
    category: "arcade",
    icon: "🗺️",
    targetCount: 1,
    rewardGems: 30,
    rewardXp: 75,
  },
  {
    id: "higher_lower_streak",
    title: "Records Mondiaux",
    description: "Aligner 5 réponses dans Plus Grand / Plus Petit",
    category: "arcade",
    icon: "⚖️",
    targetCount: 5,
    rewardGems: 25,
    rewardXp: 60,
  },
  {
    id: "chrono_rush_master",
    title: "Course Contre la Montre",
    description: "Identifier 10 pays dans Chrono Rush",
    category: "arcade",
    icon: "⚡",
    targetCount: 10,
    rewardGems: 25,
    rewardXp: 60,
  },
  {
    id: "daily_challenge_fan",
    title: "Rituel du Jour",
    description: "Participer au Quiz du Jour quotidien",
    category: "quiz",
    icon: "📅",
    targetCount: 1,
    rewardGems: 30,
    rewardXp: 80,
  },
  {
    id: "travle_explorer",
    title: "Grand Voyageur",
    description: "Compléter 1 parcours dans Travle ou Map Blitz",
    category: "arcade",
    icon: "🧭",
    targetCount: 1,
    rewardGems: 25,
    rewardXp: 60,
  },
  {
    id: "conquest_scout",
    title: "Pionnier de la Conquête",
    description: "Capturer au moins 1 pays dans le Pokédex",
    category: "conquest",
    icon: "🌟",
    targetCount: 1,
    rewardGems: 35,
    rewardXp: 100,
  },
  {
    id: "play_any_game",
    title: "Arcade Addict",
    description: "Terminer 2 sessions de jeux d'arcade au choix",
    category: "arcade",
    icon: "🎮",
    targetCount: 2,
    rewardGems: 25,
    rewardXp: 60,
  },
  {
    id: "srs_study",
    title: "Entraînement Cérébral",
    description: "Réviser 5 flashcards dans le Carnet Leitner",
    category: "study",
    icon: "🧠",
    targetCount: 5,
    rewardGems: 20,
    rewardXp: 50,
  },
];

const memoryMissionsStore = new Map<string, string>();

function getStoredString(key: string): string | null {
  if (typeof localStorage !== "undefined") {
    try {
      return localStorage.getItem(key);
    } catch {
      // fallback
    }
  }
  return memoryMissionsStore.get(key) || null;
}

function setStoredString(key: string, val: string): void {
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(key, val);
      return;
    } catch {
      // fallback
    }
  }
  memoryMissionsStore.set(key, val);
}

function notifyMissionsUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(DAILY_MISSIONS_UPDATED_EVENT));
  }
}

function getStorageKey(userId?: string | null): string {
  return `${MISSIONS_STORAGE_PREFIX}${userId || "guest"}`;
}

/**
 * Hash simple pour sélectionner 3 missions déterministes par jour
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Génère les 3 missions pour la date courante
 */
function generateMissionsForDate(dateStr: string): DailyMission[] {
  const seed = hashString(dateStr);
  const pool = [...ALL_MISSION_TEMPLATES];

  // Sélectionner 3 missions distinctes
  const selected: DailyMission[] = [];
  let currentSeed = seed;

  while (selected.length < 3 && pool.length > 0) {
    const idx = currentSeed % pool.length;
    const template = pool.splice(idx, 1)[0];
    selected.push({
      ...template,
      currentCount: 0,
      completed: false,
      claimed: false,
    });
    currentSeed = Math.floor(currentSeed / 7) + 13;
  }

  return selected;
}

/**
 * Récupère l'état des missions du jour pour le joueur
 */
export function getDailyMissions(userId?: string | null, customDate?: string): DailyMissionsState {
  const today = customDate || formatDateToIsoDay();
  const key = getStorageKey(userId);

  const raw = getStoredString(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as DailyMissionsState;
      if (parsed.date === today && Array.isArray(parsed.missions) && parsed.missions.length === 3) {
        return parsed;
      }
    } catch {
      // fallback
    }
  }

  // Si pas encore générées pour aujourd'hui, créer l'état du jour
  const freshState: DailyMissionsState = {
    date: today,
    missions: generateMissionsForDate(today),
    bonusClaimed: false,
    bonusGems: 50,
    bonusXp: 100,
  };

  saveDailyMissions(userId, freshState);
  return freshState;
}

/**
 * Sauvegarde l'état des missions
 */
export function saveDailyMissions(userId: string | null | undefined, state: DailyMissionsState): void {
  const key = getStorageKey(userId);
  setStoredString(key, JSON.stringify(state));
  notifyMissionsUpdated();
}

/**
 * Réinitialise l'état des missions (pour les tests)
 */
export function resetDailyMissionsState(userId?: string | null): void {
  const key = getStorageKey(userId);
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
  memoryMissionsStore.delete(key);
}

/**
 * Fait progresser un objectif selon une action effectuée
 */
export function trackMissionProgress(
  userId: string | null | undefined,
  type: string,
  amount: number = 1,
  customDate?: string
): void {
  const state = getDailyMissions(userId, customDate);
  let updated = false;

  state.missions = state.missions.map((m) => {
    let match = false;

    if (type === "geo-detective_play" && m.id === "geo_detective_explorer") match = true;
    if (type === "silhouette_win" && m.id === "silhouette_guesser") match = true;
    if (type === "higher_lower_streak" && m.id === "higher_lower_streak") match = true;
    if (type === "chrono_rush_score" && m.id === "chrono_rush_master") match = true;
    if (type === "daily_challenge_play" && m.id === "daily_challenge_fan") match = true;
    if ((type === "travle_play" || type === "map-blitz_play") && m.id === "travle_explorer") match = true;
    if (type === "conquest_capture" && m.id === "conquest_scout") match = true;
    if (type === "srs_study" && m.id === "srs_study") match = true;
    if (type === "play_any_game" && m.id === "play_any_game") match = true;

    if (match && !m.completed) {
      const newCount = Math.min(m.targetCount, m.currentCount + amount);
      if (newCount !== m.currentCount) {
        updated = true;
        return {
          ...m,
          currentCount: newCount,
          completed: newCount >= m.targetCount,
        };
      }
    }
    return m;
  });

  if (updated) {
    saveDailyMissions(userId, state);
  }
}

/**
 * Réclame la récompense d'une mission terminée
 */
export function claimMissionReward(
  userId: string | null | undefined,
  missionId: string,
  customDate?: string
): { success: boolean; gems: number; xp: number; error?: string } {
  const state = getDailyMissions(userId, customDate);
  const mission = state.missions.find((m) => m.id === missionId);

  if (!mission) {
    return { success: false, gems: 0, xp: 0, error: "Mission introuvable" };
  }
  if (!mission.completed) {
    return { success: false, gems: 0, xp: 0, error: "Mission non terminée" };
  }
  if (mission.claimed) {
    return { success: false, gems: 0, xp: 0, error: "Récompense déjà réclamée" };
  }

  // Marquer comme réclamée
  mission.claimed = true;
  saveDailyMissions(userId, state);

  // Créditer les gemmes
  addGems(userId || undefined, mission.rewardGems);

  // Créditer l'XP dans l'état local
  const gamification = getPlayerGamificationState(userId || undefined);
  const currentXp = gamification.xp || 0;
  const newXp = currentXp + mission.rewardXp;
  gamification.xp = newXp;
  gamification.level = calculateLevelForXp(newXp);
  savePlayerGamificationState(userId || undefined, gamification);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("terracoast:profile_updated", {
        detail: {
          userId,
          newXp,
          newLevel: gamification.level,
          gemsAdded: mission.rewardGems,
        },
      })
    );
  }

  return {
    success: true,
    gems: mission.rewardGems,
    xp: mission.rewardXp,
  };
}

/**
 * Réclame le coffre bonus du jour quand les 3 missions sont réclamées
 */
export function claimDailyBonusChest(
  userId: string | null | undefined,
  customDate?: string
): { success: boolean; gems: number; xp: number; error?: string } {
  const state = getDailyMissions(userId, customDate);

  const allClaimed = state.missions.every((m) => m.claimed);
  if (!allClaimed) {
    return { success: false, gems: 0, xp: 0, error: "Toutes les missions doivent être terminées et réclamées !" };
  }
  if (state.bonusClaimed) {
    return { success: false, gems: 0, xp: 0, error: "Coffre bonus du jour déjà réclamé !" };
  }

  state.bonusClaimed = true;
  saveDailyMissions(userId, state);

  const bonusGems = state.bonusGems || 50;
  const bonusXp = state.bonusXp || 100;

  addGems(userId || undefined, bonusGems);

  const gamification = getPlayerGamificationState(userId || undefined);
  const currentXp = gamification.xp || 0;
  const newXp = currentXp + bonusXp;
  gamification.xp = newXp;
  gamification.level = calculateLevelForXp(newXp);
  savePlayerGamificationState(userId || undefined, gamification);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("terracoast:profile_updated", {
        detail: {
          userId,
          newXp,
          newLevel: gamification.level,
          gemsAdded: bonusGems,
        },
      })
    );
  }

  return {
    success: true,
    gems: bonusGems,
    xp: bonusXp,
  };
}
