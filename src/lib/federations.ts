/**
 * Système de Fédérations & Compétition par Pays / Régions / Cantons / Écoles
 */

export interface Federation {
  id: string;
  name: string;
  shortCode: string;
  flagEmoji: string;
  category: "country" | "canton" | "academic" | "club";
  description?: string;
}

export interface FederationLeaderboardEntry {
  federation: Federation;
  rank: number;
  totalScore: number;
  membersCount: number;
  averageScore: number;
  topPlayerPseudo?: string;
  topPlayerScore?: number;
}

export const FEDERATIONS_LIST: Federation[] = [
  // 1. Pays
  {
    id: "CH",
    name: "Suisse",
    shortCode: "SUI",
    flagEmoji: "🇨🇭",
    category: "country",
    description: "Confédération Suisse • Helvetia",
  },
  {
    id: "FR",
    name: "France",
    shortCode: "FRA",
    flagEmoji: "🇫🇷",
    category: "country",
    description: "République Française",
  },
  {
    id: "BE",
    name: "Belgique",
    shortCode: "BEL",
    flagEmoji: "🇧🇪",
    category: "country",
    description: "Royaume de Belgique",
  },
  {
    id: "CA",
    name: "Canada",
    shortCode: "CAN",
    flagEmoji: "🇨🇦",
    category: "country",
    description: "Dominion du Canada",
  },
  {
    id: "DE",
    name: "Allemagne",
    shortCode: "GER",
    flagEmoji: "🇩🇪",
    category: "country",
    description: "Bundesrepublik Deutschland",
  },
  {
    id: "IT",
    name: "Italie",
    shortCode: "ITA",
    flagEmoji: "🇮🇹",
    category: "country",
    description: "Repubblica Italiana",
  },
  {
    id: "ES",
    name: "Espagne",
    shortCode: "ESP",
    flagEmoji: "🇪🇸",
    category: "country",
    description: "Reino de España",
  },
  {
    id: "GB",
    name: "Royaume-Uni",
    shortCode: "GBR",
    flagEmoji: "🇬🇧",
    category: "country",
    description: "United Kingdom",
  },
  {
    id: "US",
    name: "États-Unis",
    shortCode: "USA",
    flagEmoji: "🇺🇸",
    category: "country",
    description: "United States of America",
  },
  {
    id: "MA",
    name: "Maroc",
    shortCode: "MAR",
    flagEmoji: "🇲🇦",
    category: "country",
    description: "Royaume du Maroc",
  },
  {
    id: "TN",
    name: "Tunisie",
    shortCode: "TUN",
    flagEmoji: "🇹🇳",
    category: "country",
    description: "République Tunisienne",
  },
  {
    id: "DZ",
    name: "Algérie",
    shortCode: "ALG",
    flagEmoji: "🇩🇿",
    category: "country",
    description: "République Algérienne",
  },
  {
    id: "SN",
    name: "Sénégal",
    shortCode: "SEN",
    flagEmoji: "🇸🇳",
    category: "country",
    description: "République du Sénégal",
  },
  {
    id: "CI",
    name: "Côte d'Ivoire",
    shortCode: "CIV",
    flagEmoji: "🇨🇮",
    category: "country",
    description: "République de Côte d'Ivoire",
  },
  {
    id: "BR",
    name: "Brésil",
    shortCode: "BRA",
    flagEmoji: "🇧🇷",
    category: "country",
    description: "República Federativa do Brasil",
  },
  {
    id: "JP",
    name: "Japon",
    shortCode: "JPN",
    flagEmoji: "🇯🇵",
    category: "country",
    description: "Nippon • 日本",
  },

  // 2. Cantons suisses
  {
    id: "CH-VD",
    name: "Canton de Vaud",
    shortCode: "VD",
    flagEmoji: "🏔️",
    category: "canton",
    description: "Liberté et Patrie • Région Lémanique",
  },
  {
    id: "CH-GE",
    name: "Canton de Genève",
    shortCode: "GE",
    flagEmoji: "⛲",
    category: "canton",
    description: "Post Tenebras Lux • Cité de Calvin",
  },
  {
    id: "CH-BE",
    name: "Canton de Berne",
    shortCode: "BE",
    flagEmoji: "🐻",
    category: "canton",
    description: "Canton de Berne • Bäregrabe",
  },
  {
    id: "CH-VS",
    name: "Canton du Valais",
    shortCode: "VS",
    flagEmoji: "🏰",
    category: "canton",
    description: "Valais • 13 Étoiles & Cervin",
  },
  {
    id: "CH-ZH",
    name: "Canton de Zurich",
    shortCode: "ZH",
    flagEmoji: "🦁",
    category: "canton",
    description: "Zürich • Lion de Zwingli",
  },
  {
    id: "CH-FR",
    name: "Canton de Fribourg",
    shortCode: "FR",
    flagEmoji: "🍏",
    category: "canton",
    description: "Fribourg / Freiburg",
  },
  {
    id: "CH-NE",
    name: "Canton de Neuchâtel",
    shortCode: "NE",
    flagEmoji: "🍇",
    category: "canton",
    description: "République et Canton de Neuchâtel",
  },
  {
    id: "CH-JU",
    name: "Canton du Jura",
    shortCode: "JU",
    flagEmoji: "🧀",
    category: "canton",
    description: "République et Canton du Jura",
  },

  // 3. Écoles & Académies
  {
    id: "ACAD-UNIV",
    name: "Ligue Universitaire & Grandes Écoles",
    shortCode: "UNIV",
    flagEmoji: "🎓",
    category: "academic",
    description: "Étudiants, Alumni & Enseignants",
  },
  {
    id: "ACAD-LYCEE",
    name: "Ligue des Collèges & Gymnases",
    shortCode: "GYM",
    flagEmoji: "📚",
    category: "academic",
    description: "Élèves et classes du secondaire",
  },
  {
    id: "CLUB-EXP",
    name: "Guilde des Explorateurs du Monde",
    shortCode: "EXP",
    flagEmoji: "🧭",
    category: "club",
    description: "Aventuriers et passionnés de cartographie",
  },
  {
    id: "CLUB-GEO",
    name: "Société Géographique TerraCoast",
    shortCode: "GEO",
    flagEmoji: "🌍",
    category: "club",
    description: "Maîtres des frontières et des capitales",
  },
];

const LOCAL_STORAGE_FEDERATION_KEY = "terracoast_user_federation";

// In-memory fallback for SSR/tests
let inMemoryUserFederation = "CH";

/**
 * Récupère une fédération par son identifiant unique (ex: "CH", "FR", "CH-VD")
 */
export function getFederationById(id: string): Federation {
  const found = FEDERATIONS_LIST.find((f) => f.id.toUpperCase() === id.toUpperCase());
  return (
    found || {
      id: "CH",
      name: "Suisse",
      shortCode: "SUI",
      flagEmoji: "🇨🇭",
      category: "country",
      description: "Confédération Suisse",
    }
  );
}

/**
 * Récupère la fédération choisie par l'utilisateur connecté ou le visiteur
 */
export function getUserFederation(userId?: string | null): Federation {
  try {
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem(
        userId ? `${LOCAL_STORAGE_FEDERATION_KEY}_${userId}` : LOCAL_STORAGE_FEDERATION_KEY
      ) || localStorage.getItem(LOCAL_STORAGE_FEDERATION_KEY);

      if (stored) {
        return getFederationById(stored);
      }
    }
  } catch {
    // Ignorer
  }

  return getFederationById(inMemoryUserFederation);
}

/**
 * Enregistre le choix de fédération de l'utilisateur
 */
export function saveUserFederation(federationId: string, userId?: string | null): void {
  inMemoryUserFederation = federationId;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_FEDERATION_KEY, federationId);
      if (userId) {
        localStorage.setItem(`${LOCAL_STORAGE_FEDERATION_KEY}_${userId}`, federationId);
      }
    }
  } catch {
    // Ignorer
  }
}

/**
 * Dérive une fédération déterministe pour un profil s'il n'en a pas explicitement configuré,
 * afin que le classement collectif soit toujours riche et vivant même avec les comptes existants.
 */
export function resolveProfileFederation(profile: {
  id: string;
  pseudo?: string;
  federation?: string | null;
}): Federation {
  if (profile.federation) {
    return getFederationById(profile.federation);
  }

  // Distribution déterministe basée sur le hachage de l'identifiant
  let hash = 0;
  const str = profile.id + (profile.pseudo || "");
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % FEDERATIONS_LIST.length;
  return FEDERATIONS_LIST[index];
}

/**
 * Agrège les scores des profils individuels pour calculer le classement des Fédérations & Nations
 */
export function aggregateFederationLeaderboard(
  profiles: Array<{
    id: string;
    pseudo: string;
    federation?: string | null;
    experience_points?: number;
    monthly_score?: number | null;
  }>,
  period: "monthly" | "alltime" = "alltime"
): FederationLeaderboardEntry[] {
  const map = new Map<
    string,
    {
      federation: Federation;
      totalScore: number;
      membersCount: number;
      topPlayerPseudo?: string;
      topPlayerScore?: number;
    }
  >();

  // Initialiser toutes les fédérations connues avec 0 points
  FEDERATIONS_LIST.forEach((fed) => {
    map.set(fed.id, {
      federation: fed,
      totalScore: 0,
      membersCount: 0,
    });
  });

  // Agréger chaque joueur
  profiles.forEach((p) => {
    const fed = resolveProfileFederation(p);
    const score = (period === "monthly" ? p.monthly_score : p.experience_points) || 0;

    const entry = map.get(fed.id) || {
      federation: fed,
      totalScore: 0,
      membersCount: 0,
    };

    entry.totalScore += score;
    entry.membersCount += 1;

    if (!entry.topPlayerScore || score > entry.topPlayerScore) {
      entry.topPlayerScore = score;
      entry.topPlayerPseudo = p.pseudo;
    }

    map.set(fed.id, entry);
  });

  // Convertir en tableau trié
  const result: FederationLeaderboardEntry[] = Array.from(map.values()).map((item) => ({
    federation: item.federation,
    rank: 0,
    totalScore: item.totalScore,
    membersCount: item.membersCount,
    averageScore:
      item.membersCount > 0 ? Math.round(item.totalScore / item.membersCount) : 0,
    topPlayerPseudo: item.topPlayerPseudo,
    topPlayerScore: item.topPlayerScore,
  }));

  // Trier par score décroissant, puis par nombre de membres
  result.sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    return b.membersCount - a.membersCount;
  });

  // Assigner les rangs 1..N
  result.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  return result;
}

/**
 * ============================================================================
 * LA CONQUÊTE DES NATIONS ⚔️ (Saison Hebdomadaire des Fédérations)
 * ============================================================================
 */

export type ConquestZoneKey = "europe" | "americas" | "asia" | "africa" | "oceania" | "poles";

export interface ConquestZoneConfig {
  id: ConquestZoneKey;
  name: string;
  emoji: string;
  subtitle: string;
  description: string;
  color: string;
  bgGradient: string;
  accentBorder: string;
  badge: string;
  bonusXpPercent: number;
}

export const CONQUEST_ZONES_CONFIG: Record<ConquestZoneKey, ConquestZoneConfig> = {
  europe: {
    id: "europe",
    name: "Europe",
    emoji: "🏰",
    subtitle: "Bastion Ancien",
    description: "Des fjords norvégiens aux collines toscanes, l'influence s'arrache à coups de capitales et drapeaux.",
    color: "emerald",
    bgGradient: "from-emerald-600 via-teal-700 to-cyan-900",
    accentBorder: "border-emerald-400",
    badge: "Seigneur d'Europe 🏰",
    bonusXpPercent: 15,
  },
  americas: {
    id: "americas",
    name: "Amériques",
    emoji: "🌎",
    subtitle: "Terres des Géants",
    description: "Du Grand Nord canadien à la Terre de Feu, dominez les cordillères, fleuves et mégapoles.",
    color: "sky",
    bgGradient: "from-sky-600 via-blue-700 to-indigo-900",
    accentBorder: "border-sky-400",
    badge: "Conquérant du Nouveau Monde 🌎",
    bonusXpPercent: 15,
  },
  asia: {
    id: "asia",
    name: "Asie",
    emoji: "🏯",
    subtitle: "Empire d'Orient",
    description: "Le continent le plus vaste et peuplé : un affrontement d'influence titanesque.",
    color: "rose",
    bgGradient: "from-rose-600 via-pink-700 to-purple-900",
    accentBorder: "border-rose-400",
    badge: "Empereur d'Orient 🏯",
    bonusXpPercent: 20,
  },
  africa: {
    id: "africa",
    name: "Afrique",
    emoji: "🦁",
    subtitle: "Berceau Sauvage",
    description: "Du Sahara au Cap de Bonne-Espérance, imposez les couleurs de votre blason.",
    color: "amber",
    bgGradient: "from-amber-600 via-orange-700 to-red-900",
    accentBorder: "border-amber-400",
    badge: "Gardien de la Savane 🦁",
    bonusXpPercent: 15,
  },
  oceania: {
    id: "oceania",
    name: "Océanie",
    emoji: "🏝️",
    subtitle: "Archipels du Pacifique",
    description: "D'innombrables atolls coralliens et l'Outback australien à conquérir par les quiz.",
    color: "teal",
    bgGradient: "from-teal-600 via-cyan-700 to-blue-900",
    accentBorder: "border-teal-400",
    badge: "Navigateur du Pacifique 🏝️",
    bonusXpPercent: 15,
  },
  poles: {
    id: "poles",
    name: "Pôles & Terres Australes",
    emoji: "❄️",
    subtitle: "Frontières Glacées",
    description: "Arctique et Antarctique : les contrées les plus rudes récompensent les géographes les plus téméraires.",
    color: "indigo",
    bgGradient: "from-indigo-600 via-slate-800 to-cyan-950",
    accentBorder: "border-cyan-400",
    badge: "Pionnier des Glaces ❄️",
    bonusXpPercent: 25,
  },
};

export interface ConquestZoneInfluenceEntry {
  federation: Federation;
  points: number;
  percentage: number;
}

export interface ConquestZoneState {
  id: ConquestZoneKey;
  config: ConquestZoneConfig;
  totalInfluence: number;
  controllingFederation: Federation | null;
  dominancePercent: number;
  rankings: ConquestZoneInfluenceEntry[];
}

export interface ConquestSeasonState {
  seasonId: string;
  seasonEndsAt: number;
  zones: Record<ConquestZoneKey, ConquestZoneState>;
  topDominatingFederation: Federation | null;
}

const STORAGE_CONQUEST_KEY = "terracoast_conquest_season_v1";
let inMemoryConquestStorage: RawInfluenceStorage | null = null;

/**
 * Calcule l'ID de la saison hebdomadaire courante (ex: 2026-W39)
 */
export function getCurrentSeasonId(now: Date = new Date()): string {
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/**
 * Calcule l'horodatage de fin de saison (Dimanche soir à 23:59:59.999 local)
 */
export function getSeasonEndTimestamp(now: Date = new Date()): number {
  const end = new Date(now);
  const day = end.getDay(); // 0 is Sunday
  const daysUntilSunday = (7 - day) % 7;
  end.setDate(end.getDate() + daysUntilSunday);
  end.setHours(23, 59, 59, 999);
  return end.getTime();
}

/**
 * Calcule le temps restant avant le reset du dimanche minuit
 */
export function getTimeUntilSeasonReset(now: Date = new Date()): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
} {
  const end = getSeasonEndTimestamp(now);
  const diffMs = Math.max(0, end - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formatted = `${days > 0 ? `${days}j ` : ""}${String(hours).padStart(2, "0")}h ${String(
    minutes
  ).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;

  return { days, hours, minutes, seconds, formatted };
}

/**
 * Associe un quiz ou un continent à une zone de conflit territorial
 */
export function mapQuizToConquestZone(continentOrCategory?: string): ConquestZoneKey {
  if (!continentOrCategory) return "europe";
  const lower = continentOrCategory.toLowerCase();
  if (lower.includes("eur") || lower.includes("suisse") || lower.includes("france") || lower.includes("belg")) {
    return "europe";
  }
  if (
    lower.includes("amér") ||
    lower.includes("americ") ||
    lower.includes("usa") ||
    lower.includes("canada") ||
    lower.includes("brésil") ||
    lower.includes("nord") ||
    lower.includes("sud")
  ) {
    return "americas";
  }
  if (
    lower.includes("asi") ||
    lower.includes("japon") ||
    lower.includes("chine") ||
    lower.includes("inde") ||
    lower.includes("orient")
  ) {
    return "asia";
  }
  if (
    lower.includes("afri") ||
    lower.includes("maroc") ||
    lower.includes("sahara") ||
    lower.includes("senegal") ||
    lower.includes("égypte")
  ) {
    return "africa";
  }
  if (
    lower.includes("océan") ||
    lower.includes("ocean") ||
    lower.includes("austral") ||
    lower.includes("pacifi") ||
    lower.includes("zélande")
  ) {
    return "oceania";
  }
  if (
    lower.includes("pôle") ||
    lower.includes("pole") ||
    lower.includes("gla") ||
    lower.includes("antar") ||
    lower.includes("arcti")
  ) {
    return "poles";
  }
  return "europe";
}

/**
 * Données d'influence brutes par zone
 */
type RawInfluenceStorage = {
  seasonId: string;
  zones: Record<ConquestZoneKey, Record<string, number>>;
};

function getInitialRawInfluence(seasonId: string): RawInfluenceStorage {
  return {
    seasonId,
    zones: {
      europe: { CH: 1420, FR: 1180, BE: 560, DE: 420, GB: 310 },
      americas: { CA: 1650, US: 1420, BR: 720, FR: 340 },
      asia: { JP: 1890, CH: 950, FR: 780, US: 420 },
      africa: { MA: 1350, SN: 980, CI: 750, FR: 680, TN: 540 },
      oceania: { FR: 1120, CH: 840, GB: 650, US: 410 },
      poles: { CH: 1280, CA: 1100, FR: 860, DE: 450 },
    },
  };
}

/**
 * Récupère l'état complet de la saison de Conquête des Nations
 */
export function getConquestSeasonState(now: Date = new Date()): ConquestSeasonState {
  const currentSeasonId = getCurrentSeasonId(now);
  let raw: RawInfluenceStorage | null =
    inMemoryConquestStorage && inMemoryConquestStorage.seasonId === currentSeasonId
      ? inMemoryConquestStorage
      : null;

  if (!raw) {
    try {
      if (typeof localStorage !== "undefined") {
        const stored = localStorage.getItem(STORAGE_CONQUEST_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as RawInfluenceStorage;
          if (parsed.seasonId === currentSeasonId) {
            raw = parsed;
          }
        }
      }
    } catch {
      // Ignorer
    }
  }

  if (!raw) {
    raw = getInitialRawInfluence(currentSeasonId);
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_CONQUEST_KEY, JSON.stringify(raw));
      }
    } catch {
      // Ignorer
    }
  }

  inMemoryConquestStorage = raw;

  // Compiler l'état détaillé de chaque zone
  const zones = {} as Record<ConquestZoneKey, ConquestZoneState>;
  const zoneKeys: ConquestZoneKey[] = ["europe", "americas", "asia", "africa", "oceania", "poles"];

  const winCountByFed: Record<string, number> = {};

  for (const key of zoneKeys) {
    const config = CONQUEST_ZONES_CONFIG[key];
    const fedScores = raw.zones[key] || {};
    const totalInfluence = Object.values(fedScores).reduce((acc, pts) => acc + pts, 0);

    const rankings: ConquestZoneInfluenceEntry[] = Object.entries(fedScores)
      .map(([fedId, points]) => {
        const federation = getFederationById(fedId);
        const percentage = totalInfluence > 0 ? Math.round((points / totalInfluence) * 100) : 0;
        return { federation, points, percentage };
      })
      .sort((a, b) => b.points - a.points);

    const controllingFederation = rankings.length > 0 && rankings[0].points > 0 ? rankings[0].federation : null;
    const dominancePercent = rankings.length > 0 ? rankings[0].percentage : 0;

    if (controllingFederation) {
      winCountByFed[controllingFederation.id] = (winCountByFed[controllingFederation.id] || 0) + 1;
    }

    zones[key] = {
      id: key,
      config,
      totalInfluence,
      controllingFederation,
      dominancePercent,
      rankings,
    };
  }

  // Trouver la fédération la plus dominante du monde
  let topFedId: string | null = null;
  let maxWins = -1;
  for (const [fedId, wins] of Object.entries(winCountByFed)) {
    if (wins > maxWins) {
      maxWins = wins;
      topFedId = fedId;
    }
  }

  return {
    seasonId: currentSeasonId,
    seasonEndsAt: getSeasonEndTimestamp(now),
    zones,
    topDominatingFederation: topFedId ? getFederationById(topFedId) : null,
  };
}

/**
 * Enregistre des points d'influence apportés par un joueur lors d'un quiz
 */
export function recordFederationInfluence(
  federationId: string,
  zoneKey: ConquestZoneKey,
  points: number
): ConquestSeasonState {
  if (points <= 0) return getConquestSeasonState();

  const currentSeasonId = getCurrentSeasonId();
  let raw: RawInfluenceStorage =
    inMemoryConquestStorage && inMemoryConquestStorage.seasonId === currentSeasonId
      ? inMemoryConquestStorage
      : getInitialRawInfluence(currentSeasonId);

  try {
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem(STORAGE_CONQUEST_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RawInfluenceStorage;
        if (parsed.seasonId === currentSeasonId) {
          raw = parsed;
        }
      }
    }
  } catch {
    // Ignorer
  }

  if (!raw.zones[zoneKey]) {
    raw.zones[zoneKey] = {};
  }

  raw.zones[zoneKey][federationId] = (raw.zones[zoneKey][federationId] || 0) + points;
  inMemoryConquestStorage = raw;

  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_CONQUEST_KEY, JSON.stringify(raw));
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("terracoast_conquest_updated", {
            detail: { federationId, zoneKey, points },
          })
        );
      }
    }
  } catch {
    // Ignorer
  }

  return getConquestSeasonState();
}

/**
 * Récupère les badges territoriaux conquis par une fédération
 */
export function getTerritorialChampionBadges(federationId: string): string[] {
  const state = getConquestSeasonState();
  const badges: string[] = [];
  const zoneKeys: ConquestZoneKey[] = ["europe", "americas", "asia", "africa", "oceania", "poles"];

  for (const key of zoneKeys) {
    const zone = state.zones[key];
    if (zone.controllingFederation?.id === federationId) {
      badges.push(zone.config.badge);
    }
  }
  return badges;
}
