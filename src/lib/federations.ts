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
