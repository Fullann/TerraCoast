/**
 * 🏅 Gestionnaire Centralisé des Records Personnels des Jeux TerraCoast
 * Fournit les records enregistrés dans le navigateur pour chaque mini-jeu
 * et des libellés stimulants pour le Hub des Jeux (/games).
 */

import { getChronoRushHighScore } from "./chronoRushGame";
import { getHigherLowerRecord } from "./higherLowerGame";
import { getGeoDetectiveHighScore } from "./geoDetectiveGame";
import { getSrsStats } from "./srsManager";

// Clés de stockage
const KEY_CHRONO_ANSWERS = "terracoast_chrono_rush_best_answers";
const KEY_TRAVLE_RECORD = "terracoast_travle_record";
const KEY_SILHOUETTE_RECORD = "terracoast_silhouette_record";
const KEY_MAP_BLITZ_RECORD = "terracoast_map_blitz_record";
const KEY_PHYSICAL_GEO_RECORD = "terracoast_physical_geo_record";

export interface GamePersonalRecords {
  chronoRush: { highScore: number; bestAnswers: number; display: string };
  higherLower: { bestStreak: number; display: string };
  travle: { gamesWon: number; minErrors: number; display: string };
  silhouette: { totalWon: number; bestAttempts: number; maxStreak: number; display: string };
  geoDetective: { highScore: number; display: string };
  mapBlitz: { bestCount: number; bestPercent: number; display: string };
  physicalGeo: { bestScore: number; bestChronoAnswers: number; display: string };
  srs: { dueToday: number; masteredCount: number; display: string };
}

// ── Chrono Rush ──
export function saveChronoRushRecord(score: number, correctAnswers: number): void {
  if (typeof window === "undefined") return;
  const currentHighScore = getChronoRushHighScore();
  const currentAnswers = Number(localStorage.getItem(KEY_CHRONO_ANSWERS)) || 0;

  if (score > currentHighScore) {
    localStorage.setItem("terracoast_chrono_rush_highscore", String(score));
  }
  if (correctAnswers > currentAnswers) {
    localStorage.setItem(KEY_CHRONO_ANSWERS, String(correctAnswers));
  }
}

export function getChronoRushRecord(): { highScore: number; bestAnswers: number; display: string } {
  const highScore = getChronoRushHighScore();
  const rawAnswers = typeof window !== "undefined" ? Number(localStorage.getItem(KEY_CHRONO_ANSWERS)) || 0 : 0;
  const bestAnswers = rawAnswers || (highScore > 0 ? Math.max(1, Math.round(highScore / 100)) : 0);

  const display =
    highScore > 0
      ? `Record : ${bestAnswers} bonnes réponses (${highScore} pts)`
      : "Record : 45s de survie";

  return { highScore, bestAnswers, display };
}

// ── Higher-Lower ──
export function getHigherLowerBestRecord(): { bestStreak: number; display: string } {
  const pop = getHigherLowerRecord("population");
  const area = getHigherLowerRecord("area_km2") || getHigherLowerRecord("area");
  const bestStreak = Math.max(pop, area, 0);

  const display =
    bestStreak > 0
      ? `Série max : ${bestStreak} d'affilée 🔥`
      : "Série max : Duel infini";

  return { bestStreak, display };
}

// ── Travle ──
export interface TravleRecord {
  gamesWon: number;
  minErrors: number;
}

export function saveTravleWin(guessesUsed: number, optimalSteps: number): void {
  if (typeof window === "undefined") return;
  const errors = Math.max(0, guessesUsed - optimalSteps);
  const current = getTravleRecord();

  const next = {
    gamesWon: current.gamesWon + 1,
    minErrors: Math.min(current.minErrors, errors),
  };
  localStorage.setItem(KEY_TRAVLE_RECORD, JSON.stringify(next));
}

export function getTravleRecord(): { gamesWon: number; minErrors: number; display: string } {
  if (typeof window === "undefined") {
    return { gamesWon: 0, minErrors: 99, display: "Défi quotidien disponible" };
  }
  try {
    const raw = localStorage.getItem(KEY_TRAVLE_RECORD);
    if (!raw) return { gamesWon: 0, minErrors: 99, display: "Record Travle : 0 erreur" };
    const parsed = JSON.parse(raw);
    const minErrors = typeof parsed.minErrors === "number" ? parsed.minErrors : 0;
    const gamesWon = Number(parsed.gamesWon) || 0;

    const display =
      gamesWon > 0
        ? minErrors === 0
          ? "Record : 0 erreur (optimal 🎯)"
          : `Record : ${minErrors} erreur(s) • ${gamesWon} victoires`
        : "Record Travle : 0 erreur";

    return { gamesWon, minErrors, display };
  } catch {
    return { gamesWon: 0, minErrors: 0, display: "Record Travle : 0 erreur" };
  }
}

// ── Silhouette Mystère ──
export function saveSilhouetteGameResult(attemptsUsed: number, won: boolean): void {
  if (typeof window === "undefined") return;
  const current = getSilhouetteRecord();

  if (won) {
    const streak = current.maxStreak + 1;
    const next = {
      totalWon: current.totalWon + 1,
      bestAttempts: Math.min(current.bestAttempts, attemptsUsed),
      maxStreak: streak,
    };
    localStorage.setItem(KEY_SILHOUETTE_RECORD, JSON.stringify(next));
  }
}

export function getSilhouetteRecord(): {
  totalWon: number;
  bestAttempts: number;
  maxStreak: number;
  display: string;
} {
  if (typeof window === "undefined") {
    return { totalWon: 0, bestAttempts: 5, maxStreak: 0, display: "Défi quotidien disponible" };
  }
  try {
    const raw = localStorage.getItem(KEY_SILHOUETTE_RECORD);
    if (!raw) return { totalWon: 0, bestAttempts: 5, maxStreak: 0, display: "Trouver en ≤ 5 essais" };
    const parsed = JSON.parse(raw);
    const totalWon = Number(parsed.totalWon) || 0;
    const bestAttempts = Number(parsed.bestAttempts) || 5;
    const maxStreak = Number(parsed.maxStreak) || 0;

    const display =
      totalWon > 0
        ? bestAttempts === 1
          ? `Record : 1er essai ! • Série : ${maxStreak}`
          : `Record : ${bestAttempts}e essai • ${totalWon} pays trouvés`
        : "Trouver en ≤ 5 essais";

    return { totalWon, bestAttempts, maxStreak, display };
  } catch {
    return { totalWon: 0, bestAttempts: 5, maxStreak: 0, display: "Trouver en ≤ 5 essais" };
  }
}

// ── Geo-Detective Satellite ──
export function getGeoDetectiveRecord(): { highScore: number; display: string } {
  const highScore = getGeoDetectiveHighScore();
  const display =
    highScore > 0
      ? `Record : ${highScore.toLocaleString("fr-FR")} pts 🛰️`
      : "Score max possible : 25 000 pts";

  return { highScore, display };
}

// ── Blind Map Blitz ──
export function saveMapBlitzRecord(countriesFound: number, totalCountries: number): void {
  if (typeof window === "undefined") return;
  const percent = Math.round((countriesFound / totalCountries) * 100);
  const current = getMapBlitzRecord();

  if (countriesFound > current.bestCount) {
    localStorage.setItem(
      KEY_MAP_BLITZ_RECORD,
      JSON.stringify({ bestCount: countriesFound, bestPercent: percent })
    );
  }
}

export function getMapBlitzRecord(): { bestCount: number; bestPercent: number; display: string } {
  if (typeof window === "undefined") {
    return { bestCount: 0, bestPercent: 0, display: "Monde + 5 Continents" };
  }
  try {
    const raw = localStorage.getItem(KEY_MAP_BLITZ_RECORD);
    if (!raw) return { bestCount: 0, bestPercent: 0, display: "Monde + 5 Continents" };
    const parsed = JSON.parse(raw);
    const bestCount = Number(parsed.bestCount) || 0;
    const bestPercent = Number(parsed.bestPercent) || 0;

    const display =
      bestCount > 0
        ? `Record : ${bestCount} pays (${bestPercent}%) ⚡`
        : "Monde + 5 Continents";

    return { bestCount, bestPercent, display };
  } catch {
    return { bestCount: 0, bestPercent: 0, display: "Monde + 5 Continents" };
  }
}

// ── Reliefs, Fleuves & Merveilles ──
export function savePhysicalGeoRecord(score: number, chronoAnswers: number): void {
  if (typeof window === "undefined") return;
  const current = getPhysicalGeoRecord();

  if (score > current.bestScore || chronoAnswers > current.bestChronoAnswers) {
    localStorage.setItem(
      KEY_PHYSICAL_GEO_RECORD,
      JSON.stringify({
        bestScore: Math.max(score, current.bestScore),
        bestChronoAnswers: Math.max(chronoAnswers, current.bestChronoAnswers),
      })
    );
  }
}

export function getPhysicalGeoRecord(): {
  bestScore: number;
  bestChronoAnswers: number;
  display: string;
} {
  if (typeof window === "undefined") {
    return { bestScore: 0, bestChronoAnswers: 0, display: "4 Thématiques complètes" };
  }
  try {
    const raw = localStorage.getItem(KEY_PHYSICAL_GEO_RECORD);
    if (!raw) return { bestScore: 0, bestChronoAnswers: 0, display: "4 Thématiques • Mode Chrono 60s" };
    const parsed = JSON.parse(raw);
    const bestScore = Number(parsed.bestScore) || 0;
    const bestChronoAnswers = Number(parsed.bestChronoAnswers) || 0;

    const display =
      bestScore > 0
        ? `Record Chrono : ${bestChronoAnswers} réussis (${bestScore} pts)`
        : "4 Thématiques • Mode Chrono 60s";

    return { bestScore, bestChronoAnswers, display };
  } catch {
    return { bestScore: 0, bestChronoAnswers: 0, display: "4 Thématiques complètes" };
  }
}

// ── Carnet SRS ──
export function getSrsRecordSummary(userId: string | null): {
  dueToday: number;
  masteredCount: number;
  display: string;
} {
  const stats = getSrsStats(userId);
  const display =
    stats.masteredCount > 0
      ? `Maîtrise : ${stats.masteredCount} cartes en boîte 5 🧠`
      : `${stats.dueToday} cartes à réviser`;

  return {
    dueToday: stats.dueToday,
    masteredCount: stats.masteredCount,
    display,
  };
}

/**
 * Récupère l'ensemble des records de tous les mini-jeux d'un seul coup
 */
export function getAllGamePersonalRecords(userId: string | null): GamePersonalRecords {
  return {
    chronoRush: getChronoRushRecord(),
    higherLower: getHigherLowerBestRecord(),
    travle: getTravleRecord(),
    silhouette: getSilhouetteRecord(),
    geoDetective: getGeoDetectiveRecord(),
    mapBlitz: getMapBlitzRecord(),
    physicalGeo: getPhysicalGeoRecord(),
    srs: getSrsRecordSummary(userId),
  };
}
