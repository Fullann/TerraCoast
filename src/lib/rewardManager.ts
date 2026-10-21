/**
 * 🎁 TerraCoast Unified Reward & Progression Manager
 * Centralise et sécurise l'attribution d'XP, de TerraGems 💎,
 * du bonus de Première Victoire du Jour, des multiplicateurs de Flamme (Streaks 🔥)
 * et du Boost Double XP ⚡ sur tous les jeux de la plateforme.
 */

import { supabase } from "./supabase";
import {
  addGems,
  getPlayerGamificationState,
  savePlayerGamificationState,
  calculateLevelForXp,
} from "./gamificationManager";
import { formatDateToIsoDay } from "./streakUtils";
import { getSiteConfig } from "./siteConfigManager";
import { trackMissionProgress } from "./dailyMissionsManager";

export type ArcadeGameType =
  | "geo-detective"
  | "silhouette"
  | "higher-lower"
  | "chrono-rush"
  | "travle"
  | "map-blitz"
  | "physical-geo"
  | "srs"
  | "daily-challenge"
  | "conquest"
  | "card-trivia"
  | "streak-milestone"
  | "league-reward"
  | "border-puzzle"
  | "time-guessr"
  | "city-guesser";

export interface GameRewardParams {
  score?: number;
  attempts?: number;
  won?: boolean;
  timeLeft?: number;
  correctCount?: number;
  streakCount?: number;
  totalCards?: number;
  rarity?: "common" | "rare" | "epic" | "legendary";
}

export interface CalculatedReward {
  baseXp: number;
  baseGems: number;
  title: string;
  summary: string;
}

export interface RewardApplicationResult {
  baseXp: number;
  streakBonusXp: number;
  firstWinBonusXp: number;
  doubleXpBonus: number;
  totalXp: number;
  gems: number;
  isFirstWin: boolean;
  streakMultiplier: number;
  doubleXpActive: boolean;
  newTotalGems: number;
  newTotalXp: number;
  newLevel: number;
  leveledUp: boolean;
}

const FIRST_WIN_BONUS_XP = 100;
const FIRST_WIN_STORAGE_PREFIX = "terracoast_first_win_";

const memoryRewardStore = new Map<string, string>();

function getStoredString(key: string): string | null {
  if (typeof localStorage !== "undefined") {
    try {
      return localStorage.getItem(key);
    } catch {
      // fallback
    }
  }
  return memoryRewardStore.get(key) || null;
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
  memoryRewardStore.set(key, val);
}

/**
 * Calcule le multiplicateur de série quotidienne (Flamme 🔥)
 * +10% à partir de 3 jours, +25% à partir de 7 jours, +50% à partir de 30 jours
 */
export function getStreakXpMultiplier(streak: number = 0): number {
  if (streak >= 30) return 1.5;
  if (streak >= 7) return 1.25;
  if (streak >= 3) return 1.1;
  return 1.0;
}

/**
 * Vérifie si le joueur a déjà bénéficié du bonus Première Victoire du Jour aujourd'hui
 */
export function hasClaimedFirstWinToday(userId?: string | null): boolean {
  const today = formatDateToIsoDay();
  const key = `${FIRST_WIN_STORAGE_PREFIX}${userId || "guest"}_${today}`;
  return getStoredString(key) === "true";
}

/**
 * Enregistre la Première Victoire du Jour
 */
function markFirstWinClaimedToday(userId?: string | null): void {
  const today = formatDateToIsoDay();
  const key = `${FIRST_WIN_STORAGE_PREFIX}${userId || "guest"}_${today}`;
  setStoredString(key, "true");
}

/**
 * Calcule les gains de base (XP et Gems) selon le jeu et les performances
 */
export function calculateGameReward(
  gameType: ArcadeGameType,
  params: GameRewardParams = {}
): CalculatedReward {
  const score = params.score ?? 0;
  const attempts = params.attempts ?? 1;
  const won = params.won ?? true;
  const timeLeft = params.timeLeft ?? 0;
  const correctCount = params.correctCount ?? 0;

  switch (gameType) {
    case "geo-detective": {
      // Score satellite max = 25 000 pts -> XP max = 500
      const baseXp = Math.min(500, Math.max(10, Math.round(score / 50)));
      const baseGems =
        score >= 20000 ? 25 : score >= 15000 ? 15 : score >= 10000 ? 10 : 5;
      return {
        baseXp,
        baseGems,
        title: "Enquête Satellite Résolue 🛰️",
        summary: `${score.toLocaleString()} pts marqués`,
      };
    }

    case "silhouette": {
      if (!won) {
        return {
          baseXp: 15,
          baseGems: 0,
          title: "Silhouette Non Trouvée 🗺️",
          summary: "Partie terminée (effort récompensé)",
        };
      }
      // 100 XP au 1er essai, -15 par tentative supplémentaire
      // Gems : 30 💎 au 1er essai, dégressif jusqu'à 10 💎
      const xpTable = [100, 85, 70, 55, 40, 25];
      const gemsTable = [30, 25, 20, 15, 10, 10];
      const idx = Math.min(Math.max(0, attempts - 1), xpTable.length - 1);
      return {
        baseXp: xpTable[idx],
        baseGems: gemsTable[idx],
        title: "Silhouette Identifiée 🗺️",
        summary: `Trouvée en ${attempts} essai${attempts > 1 ? "s" : ""}`,
      };
    }

    case "higher-lower": {
      // 15 XP par bonne réponse + 100 XP bonus par palier de 10
      const milestoneBonus = Math.floor(score / 10) * 100;
      const baseXp = Math.max(10, score * 15 + milestoneBonus);
      // 2 💎 par bonne comparaison
      const baseGems = score * 2;
      return {
        baseXp,
        baseGems,
        title: "Duel de Grandeurs ⚖️",
        summary: `Série de ${score} bonne${score > 1 ? "s" : ""} réponse${score > 1 ? "s" : ""}`,
      };
    }

    case "chrono-rush": {
      // XP = Bonnes réponses * 10 + bonus de temps restant
      const timeBonus = Math.max(0, Math.round(timeLeft * 2));
      const baseXp = Math.max(10, correctCount * 10 + timeBonus);
      const baseGems =
        correctCount >= 20 ? 30 : correctCount >= 10 ? 15 : correctCount >= 5 ? 5 : 0;
      return {
        baseXp,
        baseGems,
        title: "Chrono Rush Terminé ⏱️",
        summary: `${correctCount} pays identifiés (+${timeBonus} XP temps)`,
      };
    }

    case "travle": {
      return {
        baseXp: 150,
        baseGems: 25,
        title: "Traversée Frontalière Réussie 🧭",
        summary: "Frontières reliées avec succès",
      };
    }

    case "map-blitz": {
      return {
        baseXp: 150,
        baseGems: 50,
        title: "Carte Muette Éclair 🗺️",
        summary: "Session Blitz complétée",
      };
    }

    case "physical-geo": {
      return {
        baseXp: 120,
        baseGems: 30,
        title: "Exploration Reliefs & Merveilles 🏔️",
        summary: "Sites géographiques identifiés",
      };
    }

    case "srs": {
      const cards = params.totalCards || correctCount || 5;
      return {
        baseXp: cards * 5,
        baseGems: 10,
        title: "Session Leitner Validée 🧠",
        summary: `${cards} flashcards révisées`,
      };
    }

    case "daily-challenge": {
      const baseXp = 100 + Math.round(score * 0.5);
      const baseGems = 25 + (score >= 90 ? 50 : 0);
      return {
        baseXp,
        baseGems,
        title: "Quiz du Jour Terminé 📅",
        summary: `Score : ${score}% (${score >= 90 ? "Bonus podium inclus" : "Participation validée"})`,
      };
    }

    case "card-trivia": {
      return {
        baseXp: 30,
        baseGems: 10,
        title: "Quiz Flash TerraDex 🎴",
        summary: "Anecdote géographique maîtrisée",
      };
    }

    case "conquest": {
      const rarity = params.rarity || "common";
      const xpMap = { common: 25, rare: 50, epic: 100, legendary: 250 };
      const gemsMap = { common: 5, rare: 15, epic: 30, legendary: 75 };
      return {
        baseXp: xpMap[rarity] || 25,
        baseGems: gemsMap[rarity] || 5,
        title: `Nouveau Territoire Conquis (${rarity}) 🌍`,
        summary: "Ajouté à votre Pokédex géographique",
      };
    }

    case "streak-milestone": {
      return {
        baseXp: 50,
        baseGems: params.score || 20,
        title: "Jalon de Flamme Atteint 🔥",
        summary: `Série de jours récompensée`,
      };
    }

    case "league-reward": {
      return {
        baseXp: 100,
        baseGems: params.score || 50,
        title: "Coffre de Ligue Hebdomadaire 🏆",
        summary: "Récompense de classement hebdomadaire",
      };
    }

    case "border-puzzle": {
      const score = params.score ?? 100;
      const baseXp = Math.min(250, Math.max(50, Math.round(score * 1.5)));
      const baseGems = score >= 90 ? 35 : score >= 70 ? 25 : 15;
      return {
        baseXp,
        baseGems,
        title: "Tangram Frontalier Résolu 🧩",
        summary: `Frontières assemblées (${score}% d'efficacité)`,
      };
    }

    case "time-guessr": {
      const score = params.score ?? 0;
      const baseXp = Math.min(500, Math.max(25, Math.round(score / 50)));
      const baseGems = score >= 20000 ? 50 : score >= 15000 ? 30 : score >= 10000 ? 20 : 10;
      return {
        baseXp,
        baseGems,
        title: "Enquêteur Géo-Historique ⏳",
        summary: `Score : ${score.toLocaleString()} pts`,
      };
    }

    case "city-guesser": {
      const score = params.score ?? 0;
      const baseXp = Math.min(500, Math.max(25, Math.round(score / 50)));
      const baseGems = score >= 20000 ? 50 : score >= 15000 ? 30 : score >= 10000 ? 20 : 10;
      return {
        baseXp,
        baseGems,
        title: "Zoom Satellite Métropole 🛰️",
        summary: `Score : ${score.toLocaleString()} pts`,
      };
    }

    default:
      return {
        baseXp: 20,
        baseGems: 5,
        title: "Partie Complétée 🎮",
        summary: "Récompense attribuée",
      };
  }
}

/**
 * Applique l'ensemble des récompenses au joueur de manière unifiée :
 * - Calcul des multiplicateurs (Streak 🔥, First Win 🥇, Double XP ⚡, Site Config)
 * - Crédit des TerraGems 💎
 * - Mise à jour du niveau et de l'XP dans l'état local et sur Supabase
 * - Mise à jour des missions quotidiennes
 * - Diffusion des événements en direct
 */
export async function applyPlayerRewards(
  userId: string | undefined | null,
  reward: CalculatedReward,
  gameType?: ArcadeGameType,
  currentStreak: number = 0,
  targetScore: number = 0
): Promise<RewardApplicationResult> {
  const gamification = getPlayerGamificationState(userId || undefined);
  const siteConfig = getSiteConfig();

  // 1. Vérification du First Win of the Day
  const isFirstWin = !hasClaimedFirstWinToday(userId);
  const firstWinBonusXp = isFirstWin ? FIRST_WIN_BONUS_XP : 0;
  if (isFirstWin) {
    markFirstWinClaimedToday(userId);
  }

  // 2. Multiplicateur de Flamme (Streaks)
  const streakMultiplier = getStreakXpMultiplier(currentStreak);
  const streakBonusXp = Math.round(reward.baseXp * (streakMultiplier - 1));

  // 3. Multiplicateur de configuration globale du site (ex: week-end 2x XP)
  const globalMultiplier = siteConfig?.gameplay?.globalXpMultiplier || 1;

  // 4. Boost Double XP (acheté dans la boutique)
  const doubleXpActive = Boolean(
    gamification.doubleXpUntil && gamification.doubleXpUntil > Date.now()
  );
  const boosterMultiplier = doubleXpActive ? 2 : 1;

  // 5. Calcul de l'XP Totale finale
  const subtotalXp = Math.round(
    (reward.baseXp + streakBonusXp + firstWinBonusXp) * globalMultiplier
  );
  const totalXp = Math.round(subtotalXp * boosterMultiplier);
  const doubleXpBonus = doubleXpActive ? subtotalXp : 0;

  // 6. Crédit des TerraGems
  const gemsAwarded = Math.max(0, reward.baseGems);
  let newTotalGems = gamification.gems;
  if (gemsAwarded > 0) {
    newTotalGems = addGems(userId || undefined, gemsAwarded);
  }

  // 7. Calcul de la nouvelle progression d'XP & Niveau
  const previousXp = gamification.xp || 0;
  const previousLevel = gamification.level || calculateLevelForXp(previousXp);
  const newTotalXp = previousXp + totalXp;
  const newLevel = calculateLevelForXp(newTotalXp);
  const leveledUp = newLevel > previousLevel;

  gamification.gems = newTotalGems;
  gamification.xp = newTotalXp;
  gamification.level = newLevel;
  savePlayerGamificationState(userId || undefined, gamification);

  // 8. Synchronisation avec Supabase profiles (via RPC ou mise à jour directe)
  if (userId) {
    try {
      // Appel RPC sécurisé (qui contourne le profil guard grâce à SECURITY DEFINER)
      const { error: rpcErr } = await (supabase.rpc as any)("grant_arcade_rewards", {
        p_xp: totalXp,
        p_score: targetScore || reward.baseXp,
        p_game_mode: gameType || "arcade",
      });

      if (rpcErr) {
        // Fallback doux : lecture du profil actuel pour synchroniser l'affichage
        const { data: currentP } = await supabase
          .from("profiles")
          .select("experience_points, monthly_score")
          .eq("id", userId)
          .single();

        if (currentP) {
          const freshXp = (currentP.experience_points || 0) + totalXp;
          const freshMonthly = (currentP.monthly_score || 0) + (targetScore || totalXp);
          const freshLvl = calculateLevelForXp(freshXp);

          // Tentative de mise à jour directe si les droits le permettent
          await supabase
            .from("profiles")
            .update({
              experience_points: freshXp,
              level: freshLvl,
              monthly_score: freshMonthly,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);
        }
      }
    } catch (e) {
      console.warn("[rewardManager] Supabase sync skipped or failed:", e);
    }

    // Déclencher l'événement global pour rafraîchir la Navbar et le Profile
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("terracoast:profile_updated", {
          detail: {
            userId,
            newXp: newTotalXp,
            newLevel,
            gemsAdded: gemsAwarded,
          },
        })
      );
    }
  }

  // 9. Mise à jour automatique de la progression des Missions du Jour
  if (gameType) {
    trackMissionProgress(userId || undefined, `${gameType}_play`, 1);
    if (gameType === "geo-detective" && targetScore > 0) {
      trackMissionProgress(userId || undefined, "geo_detective_score", targetScore);
    }
    if (gameType === "silhouette" && reward.baseGems > 0) {
      trackMissionProgress(userId || undefined, "silhouette_win", 1);
    }
    if (gameType === "higher-lower") {
      trackMissionProgress(userId || undefined, "higher_lower_streak", targetScore);
    }
    if (gameType === "chrono-rush") {
      trackMissionProgress(userId || undefined, "chrono_rush_score", targetScore);
    }
    if (gameType === "conquest") {
      trackMissionProgress(userId || undefined, "conquest_capture", 1);
    }
    if (gameType === "daily-challenge") {
      trackMissionProgress(userId || undefined, "daily_challenge_play", 1);
    }
    if (gameType === "border-puzzle") {
      trackMissionProgress(userId || undefined, "border_puzzle_win", 1);
    }
    if (gameType === "time-guessr" && targetScore > 0) {
      trackMissionProgress(userId || undefined, "time_guessr_score", targetScore);
    }
    if (gameType === "city-guesser" && targetScore > 0) {
      trackMissionProgress(userId || undefined, "city_guesser_score", targetScore);
    }
    // Tous les jeux contribuent au compteur générique "play_any_game"
    trackMissionProgress(userId || undefined, "play_any_game", 1);
  }

  // 10. Déclenchement de l'événement de célébration
  const result: RewardApplicationResult = {
    baseXp: reward.baseXp,
    streakBonusXp,
    firstWinBonusXp,
    doubleXpBonus,
    totalXp,
    gems: gemsAwarded,
    isFirstWin,
    streakMultiplier,
    doubleXpActive,
    newTotalGems,
    newTotalXp,
    newLevel,
    leveledUp,
  };

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("terracoast:reward_awarded", {
        detail: {
          ...result,
          title: reward.title,
          summary: reward.summary,
          gameType,
        },
      })
    );
  }

  return result;
}

/**
 * 🏆 Coffres de Fin de Semaine des Ligues (Dimanche soir à minuit)
 * 🥇 1ère place : 300 💎 + 1 Booster Mythique
 * 🥈 2e place : 200 💎
 * 🥉 3e place : 120 💎
 * ⬆️ Zone de promotion (Top 4-10) : 50 💎
 */

export interface WeeklyLeagueRewardTier {
  id: "rank_1" | "rank_2" | "rank_3" | "top_10";
  title: string;
  badge: string;
  rankLabel: string;
  gems: number;
  xp: number;
  boosterPackId?: string;
  boosterName?: string;
  description: string;
}

export const WEEKLY_LEAGUE_TIERS: WeeklyLeagueRewardTier[] = [
  {
    id: "rank_1",
    title: "Champion de Division",
    rankLabel: "1ère place",
    badge: "🥇",
    gems: 300,
    xp: 250,
    boosterPackId: "pack_mythic",
    boosterName: "Pack Légendes & Mythes",
    description: "300 💎 + 1 Booster Mythique offert",
  },
  {
    id: "rank_2",
    title: "Vice-Champion",
    rankLabel: "2e place",
    badge: "🥈",
    gems: 200,
    xp: 150,
    description: "200 💎",
  },
  {
    id: "rank_3",
    title: "Podium de Division",
    rankLabel: "3e place",
    badge: "🥉",
    gems: 120,
    xp: 100,
    description: "120 💎",
  },
  {
    id: "top_10",
    title: "Zone de Promotion",
    rankLabel: "Top 4-10",
    badge: "⬆️",
    gems: 50,
    xp: 50,
    description: "50 💎 de promotion",
  },
];

export function getCurrentLeagueWeekKey(date: Date = new Date()): string {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + (((4 - target.getDay()) + 7) % 7));
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return `${date.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

export function getClaimedLeagueWeeks(userId?: string | null): string[] {
  const raw = getStoredString(`terracoast_claimed_league_weeks_${userId || "guest"}`);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function isWeeklyLeagueClaimed(userId: string | null | undefined, weekKey?: string): boolean {
  const key = weekKey || getCurrentLeagueWeekKey();
  return getClaimedLeagueWeeks(userId).includes(key);
}

export function getWeeklyLeagueTier(rank: number): WeeklyLeagueRewardTier | null {
  if (rank <= 0 || rank > 10) return null;
  if (rank === 1) return WEEKLY_LEAGUE_TIERS[0];
  if (rank === 2) return WEEKLY_LEAGUE_TIERS[1];
  if (rank === 3) return WEEKLY_LEAGUE_TIERS[2];
  return WEEKLY_LEAGUE_TIERS[3];
}

export async function claimWeeklyLeagueReward(
  userId: string | null | undefined,
  divisionRank: number,
  weekKey?: string
): Promise<{
  success: boolean;
  tier?: WeeklyLeagueRewardTier;
  message: string;
  result?: RewardApplicationResult;
}> {
  const currentKey = weekKey || getCurrentLeagueWeekKey();
  if (isWeeklyLeagueClaimed(userId, currentKey)) {
    return {
      success: false,
      message: "Coffre de ligue déjà réclamé pour cette semaine !",
    };
  }

  const tier = getWeeklyLeagueTier(divisionRank);
  if (!tier) {
    return {
      success: false,
      message: "Seuls les membres du Top 10 de leur division accèdent aux coffres de fin de semaine.",
    };
  }

  // Appliquer les récompenses d'XP et de Gems
  const reward = calculateGameReward("league-reward", { score: tier.gems });
  const result = await applyPlayerRewards(userId, reward, "league-reward");

  // Marquer comme réclamé
  const claimed = getClaimedLeagueWeeks(userId);
  claimed.push(currentKey);
  setStoredString(
    `terracoast_claimed_league_weeks_${userId || "guest"}`,
    JSON.stringify(claimed)
  );

  return {
    success: true,
    tier,
    message: `Félicitations ! Vous remportez le coffre de ${tier.title} (${tier.description}) !`,
    result,
  };
}
