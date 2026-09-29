import {
  SATELLITE_LOCATIONS,
  type SatelliteLocation,
  type GeoDetectiveGuess,
  type GeoDetectiveRound,
  type GeoDetectiveGameState,
  type GeoDetectiveRank,
} from "./geoDetectiveData";
import { getActiveGeoDetectiveLocations } from "./geoDetectiveLocationsManager";

export type {
  SatelliteLocation,
  GeoDetectiveGuess,
  GeoDetectiveRound,
  GeoDetectiveGameState,
  GeoDetectiveRank,
};

const HIGH_SCORE_STORAGE_KEY = "terracoast_geodetective_highscore";
const memoryStore = new Map<string, string>();

function getStoredItem(key: string): string | null {
  if (typeof localStorage !== "undefined") {
    try {
      return localStorage.getItem(key);
    } catch {
      // fallback
    }
  }
  return memoryStore.get(key) || null;
}

function setStoredItem(key: string, value: string): void {
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(key, value);
      return;
    } catch {
      // fallback
    }
  }
  memoryStore.set(key, value);
}

/**
 * Calcule la distance géodésique de Haversine (en kilomètres)
 */
export function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Calcule l'orientation de la boussole depuis le repère du joueur vers la cible réelle
 */
export function calculateCompassBearing(
  latFrom: number,
  lngFrom: number,
  latTo: number,
  lngTo: number
): { direction: string; arrow: string; degrees: number } {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const dLng = toRad(lngTo - lngFrom);
  const fromLatRad = toRad(latFrom);
  const toLatRad = toRad(latTo);

  const y = Math.sin(dLng) * Math.cos(toLatRad);
  const x =
    Math.cos(fromLatRad) * Math.sin(toLatRad) -
    Math.sin(fromLatRad) * Math.cos(toLatRad) * Math.cos(dLng);

  const degrees = Math.round((toDeg(Math.atan2(y, x)) + 360) % 360);

  const directions = [
    { label: "Nord", arrow: "⬆️", min: 337.5, max: 360 },
    { label: "Nord", arrow: "⬆️", min: 0, max: 22.5 },
    { label: "Nord-Est", arrow: "↗️", min: 22.5, max: 67.5 },
    { label: "Est", arrow: "➡️", min: 67.5, max: 112.5 },
    { label: "Sud-Est", arrow: "↘️", min: 112.5, max: 157.5 },
    { label: "Sud", arrow: "⬇️", min: 157.5, max: 202.5 },
    { label: "Sud-Ouest", arrow: "↙️", min: 202.5, max: 247.5 },
    { label: "Ouest", arrow: "⬅️", min: 247.5, max: 292.5 },
    { label: "Nord-Ouest", arrow: "↖️", min: 292.5, max: 337.5 },
  ];

  const match = directions.find((d) => degrees >= d.min && degrees < d.max);
  return {
    direction: match?.label || "Nord",
    arrow: match?.arrow || "⬆️",
    degrees,
  };
}

/**
 * Calcule le score GeoGuessr (de 0 à 5 000 points) selon la distance d'écart.
 * Si distance <= 25 km : score parfait garanti (5 000 pts).
 * Décroissance exponentielle réaliste au-delà.
 * Optionnel : -250 pts si le joueur a utilisé un indice.
 */
export function calculateGeoScore(
  distanceKm: number,
  usedClue = false
): number {
  if (distanceKm <= 25) {
    const perfectScore = 5000;
    return Math.max(0, perfectScore - (usedClue ? 250 : 0));
  }

  // Décroissance exponentielle : s = 2000 km
  // 100 km -> ~4756 pts, 500 km -> ~3894 pts, 1 500 km -> ~2362 pts, 5 000 km -> ~410 pts, > 14 000 km -> 0 pt
  const rawScore = Math.round(5000 * Math.exp(-distanceKm / 2000));
  const cluePenalty = usedClue ? 250 : 0;
  return Math.max(0, Math.min(5000, rawScore - cluePenalty));
}

/**
 * Évalue la proposition du joueur pour une manche
 */
export function evaluateGuess(
  targetLocation: SatelliteLocation,
  guessedLat: number,
  guessedLng: number,
  usedClue = false
): GeoDetectiveGuess {
  const distanceKm = calculateHaversineDistance(
    guessedLat,
    guessedLng,
    targetLocation.lat,
    targetLocation.lng
  );

  const score = calculateGeoScore(distanceKm, usedClue);
  const bearing = calculateCompassBearing(
    guessedLat,
    guessedLng,
    targetLocation.lat,
    targetLocation.lng
  );

  return {
    guessedLat,
    guessedLng,
    distanceKm,
    score,
    bearingDegrees: bearing.degrees,
    compassDirection: bearing.direction,
    compassArrow: bearing.arrow,
  };
}

/**
 * Lance une nouvelle partie de Geo-Detective en 5 manches uniques
 */
export function startNewGeoDetectiveGame(
  difficulty: "all" | "easy" | "hard" = "all",
  totalRounds = 5
): GeoDetectiveGameState {
  const activeLocations = getActiveGeoDetectiveLocations();
  let pool = activeLocations.length > 0 ? [...activeLocations] : [...SATELLITE_LOCATIONS];

  if (difficulty === "easy") {
    pool = pool.filter((loc) => loc.difficulty === "easy");
  } else if (difficulty === "hard") {
    pool = pool.filter((loc) => loc.difficulty === "hard" || loc.difficulty === "medium");
  }

  // Si le pool filtré est trop petit, reprendre la liste active complète
  if (pool.length < totalRounds) {
    pool = activeLocations.length > 0 ? [...activeLocations] : [...SATELLITE_LOCATIONS];
  }

  // Mélange Fisher-Yates
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const selectedLocations = pool.slice(0, totalRounds);

  const rounds: GeoDetectiveRound[] = selectedLocations.map((loc, idx) => ({
    roundNumber: idx + 1,
    location: loc,
    guess: null,
    usedClue: false,
  }));

  return {
    rounds,
    currentRoundIndex: 0,
    totalScore: 0,
    isGameOver: false,
  };
}

/**
 * Récupère le rang / titre d'honneur en fin de partie selon le score cumulé (sur 25 000)
 */
export function getGeoDetectiveRank(totalScore: number): GeoDetectiveRank {
  if (totalScore >= 24000) {
    return {
      title: "Astronaute Suprême",
      icon: "🛰️",
      minScore: 24000,
      description: "Vision chirurgicale depuis l'orbite ! Aucune frontière terrestre ne t'échappe.",
    };
  }
  if (totalScore >= 20000) {
    return {
      title: "Geo-Détective d'Élite",
      icon: "🕵️",
      minScore: 20000,
      description: "Précision impressionnante ! Tu as identifié presque tous les repères en un coup d'œil.",
    };
  }
  if (totalScore >= 15000) {
    return {
      title: "Explorateur Vétéran",
      icon: "🧭",
      minScore: 15000,
      description: "Belle maîtrise de la géographie mondiale et des reliefs spectaculaires de notre planète.",
    };
  }
  if (totalScore >= 10000) {
    return {
      title: "Navigateur Averti",
      icon: "🗺️",
      minScore: 10000,
      description: "Tu as de solides repères continentaux. Continue d'entraîner ton œil satellite !",
    };
  }
  return {
    title: "Apprenti des Terres",
    icon: "🌱",
    minScore: 0,
    description: "Le monde est vaste ! Observe attentivement les deltas, fleuves et caldeiras pour t'orienter.",
  };
}

/**
 * Récupère le meilleur score enregistré en local
 */
export function getGeoDetectiveHighScore(): number {
  const val = getStoredItem(HIGH_SCORE_STORAGE_KEY);
  return val ? parseInt(val, 10) || 0 : 0;
}

/**
 * Enregistre le score si supérieur au record existant.
 * Retourne true si un nouveau record est établi.
 */
export function saveGeoDetectiveHighScore(score: number): boolean {
  const current = getGeoDetectiveHighScore();
  if (score > current) {
    setStoredItem(HIGH_SCORE_STORAGE_KEY, String(score));
    return true;
  }
  return false;
}

/**
 * Remet le record à zéro (utile pour les tests)
 */
export function resetGeoDetectiveHighScore(): void {
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(HIGH_SCORE_STORAGE_KEY);
    } catch {
      // fallback
    }
  }
  memoryStore.delete(HIGH_SCORE_STORAGE_KEY);
}
