import { getAllAtlasCountries, getAtlasCountryByIso3, type AtlasCountry } from "./atlasData";
import { getSiteConfig } from "./siteConfigManager";
import type { Language } from "../i18n/translations";

export type ConquestRarity = "common" | "rare" | "epic" | "legendary";

export interface ConqueredRecord {
  iso3: string;
  conqueredAt: string; // ISO date string
  bestAccuracy: number;
  unlockedVia: "quiz" | "game" | "daily";
}

export interface ConquestCard {
  iso3: string;
  name: string;
  officialName: string;
  capital: string;
  flagEmoji: string;
  continent: string;
  subregion: string;
  population: number;
  areaKm2: number;
  currencies: Array<{ code: string; name: string; symbol: string }>;
  languages: string[];
  rarity: ConquestRarity;
  landmark: {
    name: string;
    icon: string;
    description: string;
  };
  funFact: string;
  isConquered: boolean;
  conqueredAt: string | null;
  bestAccuracy: number | null;
}

export interface ContinentProgress {
  continent: string;
  totalCountries: number;
  conqueredCountries: number;
  percentage: number;
}

export interface ConquestStats {
  totalCountries: number;
  conqueredCount: number;
  conquestPercentage: number;
  legendaryCount: number;
  epicCount: number;
  rareCount: number;
  commonCount: number;
  unlockedCardsCount: number;
  continentProgress: ContinentProgress[];
}

// Raretés spéciales par ISO3
const RARITY_MAP: Record<string, ConquestRarity> = {
  // Légendaires : micro-états uniques, géants mondiaux, ou sanctuaires isolés
  VAT: "legendary",
  MCO: "legendary",
  SMR: "legendary",
  NRU: "legendary",
  TUV: "legendary",
  LIE: "legendary",
  BTN: "legendary",
  ISL: "legendary",
  NZL: "legendary",
  MDG: "legendary",
  CHN: "legendary",
  IND: "legendary",
  USA: "legendary",

  // Épiques : merveilles du monde, superpuissances culturelles ou naturelles
  FRA: "epic",
  JPN: "epic",
  EGY: "epic",
  ITA: "epic",
  BRA: "epic",
  PER: "epic",
  AUS: "epic",
  GRC: "epic",
  MEX: "epic",
  JOR: "epic",
  GBR: "epic",
  CAN: "epic",
  ESP: "epic",
  DEU: "epic",
  KOR: "epic",
  ARG: "epic",
  NOR: "epic",
  CHE: "epic",
  ZAF: "epic",
  TUR: "epic",
  KEN: "epic",
  MAR: "epic",
  THA: "epic",
  COL: "epic",
  IDN: "epic",
  VNM: "epic",
  NPL: "epic",

  // Rares : nations réputées, façades maritimes clés, patrimoines historiques
  PRT: "rare",
  SWE: "rare",
  IRL: "rare",
  AUT: "rare",
  POL: "rare",
  SAU: "rare",
  SGP: "rare",
  CUB: "rare",
  CRI: "rare",
  NLD: "rare",
  FIN: "rare",
  HRV: "rare",
  MNG: "rare",
  CHL: "rare",
  SEN: "rare",
  UGA: "rare",
  GEO: "rare",
  ARM: "rare",
  LUX: "rare",
  AND: "rare",
  MLT: "rare",
  CZE: "rare",
  HUN: "rare",
  DNK: "rare",
  BEL: "rare",
};

// Monuments emblématiques & faits insolites sur-mesure pour enrichir le Pokédex
const CURATED_DETAILS: Record<
  string,
  {
    landmark: { name: string; icon: string; description: string };
    funFact: string;
  }
> = {
  FRA: {
    landmark: {
      name: "Tour Eiffel & Mont-Saint-Michel",
      icon: "🗼",
      description: "Symbole universel de Paris et merveille insulaire de Normandie inscrite à l'UNESCO.",
    },
    funFact: "La France est la première destination touristique au monde avec plus de 90 millions de visiteurs par an.",
  },
  JPN: {
    landmark: {
      name: "Mont Fuji & Sanctuaire Fushimi Inari",
      icon: "⛩️",
      description: "Volcan sacré culminant à 3 776 m et allée de 10 000 torii vermillon à Kyoto.",
    },
    funFact: "Le Japon est un archipel de 6 852 îles et Tokyo est l'aire urbaine la plus peuplée de la planète.",
  },
  EGY: {
    landmark: {
      name: "Grandes Pyramides de Gizeh & Sphinx",
      icon: "🐪",
      description: "La seule des 7 Merveilles du Monde antique encore debout aujourd'hui.",
    },
    funFact: "La pyramide de Khéops a été la plus haute construction humaine pendant plus de 3 800 ans.",
  },
  BRA: {
    landmark: {
      name: "Le Christ Rédempteur & Forêt Amazonienne",
      icon: "🦜",
      description: "Statue Art déco colossale dominant Rio de Janeiro et la plus vaste forêt tropicale du globe.",
    },
    funFact: "Le Brésil abrite 60% de l'Amazonie et détient le plus vaste sanctuaire de biodiversité terrestre.",
  },
  CHE: {
    landmark: {
      name: "Le Cervin (Matterhorn) & Jet d'eau de Genève",
      icon: "🏔️",
      description: "La montagne emblématique des Alpes suisses au profil pyramidal reconnaissable entre mille.",
    },
    funFact: "La Suisse compte 4 langues nationales officielles et plus de 1 500 lacs d'eau pure.",
  },
  USA: {
    landmark: {
      name: "Statue de la Liberté & Grand Canyon",
      icon: "🗽",
      description: "Phare de la démocratie offert par la France et gorge spectaculaire sculptée par le fleuve Colorado.",
    },
    funFact: "Le Grand Canyon est si gigantesque qu'il influence et crée son propre micro-climat local.",
  },
  CHN: {
    landmark: {
      name: "Grande Muraille de Chine & Cité Interdite",
      icon: "🐉",
      description: "Ouvrage militaire colossal de plus de 21 000 km serpentant à travers les montagnes.",
    },
    funFact: "Le système d'écriture chinois est le plus ancien système d'écriture continu encore utilisé de nos jours.",
  },
  IND: {
    landmark: {
      name: "Taj Mahal & Temple d'Or d'Amritsar",
      icon: "🕌",
      description: "Mausolée en marbre blanc d'une symétrie parfaite érigé par amour au XVIIe siècle.",
    },
    funFact: "L'Inde est le pays le plus peuplé de la planète et le berceau originel du jeu d'échecs et du yoga.",
  },
  ITA: {
    landmark: {
      name: "Colisée de Rome & Canaux de Venise",
      icon: "🏛️",
      description: "Amphithéâtre flavien antique et cité des Doges posée sur les eaux de la lagune.",
    },
    funFact: "L'Italie détient le record mondial du plus grand nombre de sites classés au patrimoine mondial de l'UNESCO (60).",
  },
  AUS: {
    landmark: {
      name: "Opéra de Sydney & Uluru (Ayers Rock)",
      icon: "🦘",
      description: "Chef-d'œuvre architectural aux voiles blanches et monolithe sacré au cœur de l'Outback.",
    },
    funFact: "L'Australie héberge la Grande Barrière de Corail, la plus gigantesque structure vivante visible depuis l'espace.",
  },
  GRC: {
    landmark: {
      name: "Parthénon d'Athènes & Falaises de Santorin",
      icon: "🏺",
      description: "Temple antique dédié à Athéna sur l'Acropole et villages blancs suspendus sur la caldeira.",
    },
    funFact: "La Grèce compte plus de 6 000 îles et îlots, dont seulement 227 sont habités en permanence.",
  },
  PER: {
    landmark: {
      name: "Cité inca du Machu Picchu & Lignes de Nazca",
      icon: "🦙",
      description: "Sanctuaire mystique perché à 2 430 m d'altitude dans la brume des Andes péruviennes.",
    },
    funFact: "Le lac Titicaca au Pérou est la plus haute étendue d'eau navigable au monde pour de grands navires (3 812 m).",
  },
  MEX: {
    landmark: {
      name: "Pyramide de Kukulcán (Chichén Itzá)",
      icon: "🌮",
      description: "Merveille maya célébrant les équinoxes grâce à un jeu d'ombre créant l'illusion d'un serpent descendant.",
    },
    funFact: "C'est au Mexique que les civilisations méso-américaines ont domestiqué le cacao, la vanille et le maïs.",
  },
  ISL: {
    landmark: {
      name: "Geysir, Cascade de Gullfoss & Aurores Boréales",
      icon: "🌋",
      description: "Terre de feu et de glace où geysers, volcans actifs et glaciers se côtoient.",
    },
    funFact: "L'Islande produit 100% de son électricité grâce aux énergies renouvelables (géothermie et hydroélectricité).",
  },
  MDG: {
    landmark: {
      name: "Allée des Baobabs & Tsingy de Bemaraha",
      icon: "🦎",
      description: "Forêt de baobabs géants séculaires et cathédrales minérales acérées de calcaire.",
    },
    funFact: "Plus de 90% de la faune de Madagascar (dont tous les lémuriens) est strictement endémique à l'île.",
  },
  CAN: {
    landmark: {
      name: "Chutes du Niagara & Parc National de Banff",
      icon: "🍁",
      description: "Chutes d'eau tumultueuses à la frontière et lacs glaciaires aux eaux turquoise des Rocheuses.",
    },
    funFact: "Le Canada concentre à lui seul plus de 2 millions de lacs, soit 60% des lacs du monde entier !",
  },
  GBR: {
    landmark: {
      name: "Big Ben & Stonehenge",
      icon: "🏰",
      description: "Horloge mythique du Parlement de Westminster et cercle de mégalithes préhistoriques de Salisbury.",
    },
    funFact: "Le Royaume-Uni est le berceau du football moderne, du rugby, du cricket, du tennis et du golf.",
  },
  ESP: {
    landmark: {
      name: "Sagrada Família & Palais de l'Alhambra",
      icon: "💃",
      description: "Basilique visionnaire d'Antoni Gaudí à Barcelone et joyau de l'art nasride à Grenade.",
    },
    funFact: "La Sagrada Família est en construction ininterrompue depuis 1882, plus longtemps que les pyramides de Gizeh !",
  },
  DEU: {
    landmark: {
      name: "Porte de Brandebourg & Château de Neuschwanstein",
      icon: "🥨",
      description: "Symbole de la réunification berlinoise et château féerique bâti par Louis II de Bavière.",
    },
    funFact: "Le château de Neuschwanstein a directement inspiré Walt Disney pour concevoir le château de La Belle au Bois Dormant.",
  },
  MAR: {
    landmark: {
      name: "Place Jemaa el-Fna & Mosquée Koutoubia",
      icon: "🏜️",
      description: "Cœur vibrant de Marrakech animé par conteurs et musiciens, et minaret almohade historique.",
    },
    funFact: "Le Maroc héberge la plus ancienne université encore en activité continue du monde : Al Quaraouiyine (fondée en 859).",
  },
  KEN: {
    landmark: {
      name: "Réserve Nationale du Masai Mara & Mont Kenya",
      icon: "🦁",
      description: "Savanes théâtres de la Grande Migration annuelle et second plus haut sommet d'Afrique (5 199 m).",
    },
    funFact: "Chaque année, plus de 1,5 million de gnous et zèbres traversent les rivières du Masai Mara au péril des crocodiles.",
  },
  JOR: {
    landmark: {
      name: "Cité de Pétra & Désert du Wadi Rum",
      icon: "🏺",
      description: "Cité troglodytique nabatéenne sculptée dans des falaises de grès rose il y a plus de 2 000 ans.",
    },
    funFact: "Pétra est restée dissimulée aux yeux du monde occidental pendant plus de 600 ans avant d'être redécouverte en 1812.",
  },
  NPL: {
    landmark: {
      name: "Mont Everest (Sagarmatha) & Katmandou",
      icon: "🏔️",
      description: "Le Toit du Monde culminant à 8 848 mètres au milieu des sommets éternels de l'Himalaya.",
    },
    funFact: "Le drapeau national du Népal est le seul drapeau officiel au monde à ne pas être quadrilatéral (deux triangles superposés).",
  },
  NOR: {
    landmark: {
      name: "Geirangerfjord & Falaises du Preikestolen",
      icon: "🌌",
      description: "Fjords majestueux aux eaux profondes entourés de cascades vertigineuses et de falaises abruptes.",
    },
    funFact: "En été, au-dessus du cercle polaire norvégien, le soleil ne se couche jamais pendant 76 jours consécutifs.",
  },
  NZL: {
    landmark: {
      name: "Milford Sound & Mont Cook (Aoraki)",
      icon: "🥝",
      description: "Fjord spectaculaire surnommé la « Huitième Merveille du Monde » par Rudyard Kipling.",
    },
    funFact: "La Nouvelle-Zélande a été le premier pays au monde à accorder le droit de vote aux femmes en 1893.",
  },
  VAT: {
    landmark: {
      name: "Basilique Saint-Pierre & Chapelle Sixtine",
      icon: "🇻🇦",
      description: "Plus grand sanctuaire de la chrétienté et voûte mythique peinte par Michel-Ange.",
    },
    funFact: "Le plus petit État indépendant du monde avec seulement 0,44 km² et moins de 800 habitants !",
  },
  MCO: {
    landmark: {
      name: "Le Rocher princier & Casino de Monte-Carlo",
      icon: "🎰",
      description: "Palais des Grimaldi dominant la Méditerranée et temple de l'élégance Belle Époque.",
    },
    funFact: "Monaco est l'État souverain le plus densément peuplé du monde avec plus de 19 000 habitants par kilomètre carré.",
  },
  BTN: {
    landmark: {
      name: "Monastère du Nid du Tigre (Paro Taktsang)",
      icon: "🐉",
      description: "Monastère sacré spectaculairement accroché à une falaise abrupte à 3 120 mètres d'altitude.",
    },
    funFact: "Le Bhoutan est le seul pays au monde à mesurer son développement via le « Bonheur National Brut » (BNB).",
  },
};

// Fallback in-memory pour Node / Vitest
const memoryStore = new Map<string, string>();

function getStorageKey(userId?: string | null): string {
  const safeId = userId || "guest";
  return `terracoast_conquest_${safeId}`;
}

function getStoredJson<T>(key: string): T | null {
  if (typeof localStorage !== "undefined") {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch {
      // fallback
    }
  }
  const val = memoryStore.get(key);
  return val ? JSON.parse(val) : null;
}

function setStoredJson<T>(key: string, data: T): void {
  const serialized = JSON.stringify(data);
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(key, serialized);
      return;
    } catch {
      // fallback
    }
  }
  memoryStore.set(key, serialized);
}

/**
 * Récupère le registre de tous les pays conquis pour un utilisateur ou invité.
 */
export function getConqueredRegistry(
  userId?: string | null
): Record<string, ConqueredRecord> {
  const key = getStorageKey(userId);
  return getStoredJson<Record<string, ConqueredRecord>>(key) || {};
}

/**
 * Vérifie si un pays spécifique est conquis.
 */
export function isCountryConquered(
  iso3: string,
  userId?: string | null
): boolean {
  if (!iso3) return false;
  const registry = getConqueredRegistry(userId);
  return Boolean(registry[iso3.toUpperCase()]);
}

/**
 * Enregistre une liste de pays conquis après un quiz réussi (score >= 80%).
 * Retourne les pays nouvellement conquis ainsi que le total conquis.
 */
export function recordConqueredCountries(
  iso3List: string[],
  accuracy: number,
  userId?: string | null,
  source: "quiz" | "game" | "daily" = "quiz"
): { newlyConquered: string[]; totalConquered: number } {
  if (!Array.isArray(iso3List) || iso3List.length === 0) {
    return { newlyConquered: [], totalConquered: Object.keys(getConqueredRegistry(userId)).length };
  }

  // Seuls les quiz ou défis réussis avec au moins le seuil configuré (par défaut 80%) débloquent la conquête
  const threshold = getSiteConfig()?.gameplay?.conquestAccuracyThreshold ?? 80;
  if (accuracy < threshold) {
    return { newlyConquered: [], totalConquered: Object.keys(getConqueredRegistry(userId)).length };
  }

  const key = getStorageKey(userId);
  const registry = getConqueredRegistry(userId);
  const newlyConquered: string[] = [];
  const now = new Date().toISOString();

  for (const rawIso of iso3List) {
    if (!rawIso || typeof rawIso !== "string") continue;
    const iso3 = rawIso.trim().toUpperCase();
    if (!iso3) continue;

    if (!registry[iso3]) {
      registry[iso3] = {
        iso3,
        conqueredAt: now,
        bestAccuracy: Math.round(accuracy),
        unlockedVia: source,
      };
      newlyConquered.push(iso3);
    } else {
      // Met à jour la meilleure précision si améliorée
      if (Math.round(accuracy) > registry[iso3].bestAccuracy) {
        registry[iso3].bestAccuracy = Math.round(accuracy);
      }
    }
  }

  setStoredJson(key, registry);

  return {
    newlyConquered,
    totalConquered: Object.keys(registry).length,
  };
}

/**
 * Détermine la rareté d'un pays selon son statut géographique et historique
 */
export function getCountryRarity(iso3: string): ConquestRarity {
  const upper = String(iso3 || "").toUpperCase();
  if (RARITY_MAP[upper]) {
    return RARITY_MAP[upper];
  }
  return "common";
}

/**
 * Génère la carte de collection Pokédex pour un pays donné
 */
export function buildConquestCard(
  country: AtlasCountry,
  conqueredRecord: ConqueredRecord | null
): ConquestCard {
  const iso3 = country.iso3.toUpperCase();
  const rarity = getCountryRarity(iso3);
  const curated = CURATED_DETAILS[iso3];

  let landmark = curated?.landmark;
  if (!landmark) {
    // Génération dynamique de haute qualité
    const defaultIcon =
      rarity === "legendary"
        ? "⭐"
        : rarity === "epic"
        ? "🏛️"
        : rarity === "rare"
        ? "🏰"
        : "📍";
    landmark = {
      name: `Capitale historique de ${country.name} (${country.capital})`,
      icon: defaultIcon,
      description: `Cœur administratif et culturel de la nation avec une superficie de ${country.areaKm2.toLocaleString(
        "fr-FR"
      )} km².`,
    };
  }

  let funFact = curated?.funFact;
  if (!funFact) {
    const curList = country.currencies.map((c) => c.name).join(", ");
    const langList = country.languages.join(", ");
    funFact = `${country.name} compte ${country.population.toLocaleString(
      "fr-FR"
    )} habitants sur le continent ${country.continent}${
      curList ? ` (Monnaie : ${curList})` : ""
    }${langList ? `. Langue(s) parlée(s) : ${langList}` : ""}.`;
  }

  return {
    iso3,
    name: country.name,
    officialName: country.officialName,
    capital: country.capital,
    flagEmoji: country.flagEmoji,
    continent: country.continent,
    subregion: country.subregion,
    population: country.population,
    areaKm2: country.areaKm2,
    currencies: country.currencies,
    languages: country.languages,
    rarity,
    landmark,
    funFact,
    isConquered: Boolean(conqueredRecord),
    conqueredAt: conqueredRecord?.conqueredAt || null,
    bestAccuracy: conqueredRecord?.bestAccuracy || null,
  };
}

/**
 * Récupère toutes les cartes de collection du Pokédex Mondial enrichies
 */
export function getAllConquestCards(
  userId?: string | null,
  lang: Language = "fr"
): ConquestCard[] {
  const allCountries = getAllAtlasCountries(lang);
  const registry = getConqueredRegistry(userId);

  return allCountries.map((c) => {
    const record = registry[c.iso3.toUpperCase()] || null;
    return buildConquestCard(c, record);
  });
}

/**
 * Récupère une carte de collection spécifique par code ISO3
 */
export function getConquestCardByIso3(
  iso3: string,
  userId?: string | null,
  lang: Language = "fr"
): ConquestCard | null {
  const country = getAtlasCountryByIso3(iso3, lang);
  if (!country) return null;
  const registry = getConqueredRegistry(userId);
  const record = registry[country.iso3.toUpperCase()] || null;
  return buildConquestCard(country, record);
}

/**
 * Calcule les statistiques globales de conquête et la progression par continent
 */
export function getConquestStats(
  userId?: string | null,
  lang: Language = "fr"
): ConquestStats {
  const cards = getAllConquestCards(userId, lang);
  const totalCountries = cards.length;
  const conqueredCards = cards.filter((c) => c.isConquered);
  const conqueredCount = conqueredCards.length;

  const conquestPercentage =
    totalCountries > 0
      ? Math.round((conqueredCount / totalCountries) * 100)
      : 0;

  let legendaryCount = 0;
  let epicCount = 0;
  let rareCount = 0;
  let commonCount = 0;

  for (const card of conqueredCards) {
    if (card.rarity === "legendary") legendaryCount++;
    else if (card.rarity === "epic") epicCount++;
    else if (card.rarity === "rare") rareCount++;
    else commonCount++;
  }

  // Progression par continent
  const continentBuckets: Record<string, { total: number; conquered: number }> = {};

  for (const card of cards) {
    const cont = card.continent || "Autres";
    if (!continentBuckets[cont]) {
      continentBuckets[cont] = { total: 0, conquered: 0 };
    }
    continentBuckets[cont].total++;
    if (card.isConquered) {
      continentBuckets[cont].conquered++;
    }
  }

  const continentProgress: ContinentProgress[] = Object.entries(
    continentBuckets
  ).map(([continent, counts]) => ({
    continent,
    totalCountries: counts.total,
    conqueredCountries: counts.conquered,
    percentage:
      counts.total > 0
        ? Math.round((counts.conquered / counts.total) * 100)
        : 0,
  }));

  // Trier les continents par nombre de pays décroissant
  continentProgress.sort((a, b) => b.totalCountries - a.totalCountries);

  return {
    totalCountries,
    conqueredCount,
    conquestPercentage,
    legendaryCount,
    epicCount,
    rareCount,
    commonCount,
    unlockedCardsCount: conqueredCount,
    continentProgress,
  };
}

/**
 * Réinitialise la progression de conquête (pour tests ou remise à zéro).
 */
export function resetConquestProgress(userId?: string | null): void {
  const key = getStorageKey(userId);
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(key);
    } catch {
      // fallback
    }
  }
  memoryStore.delete(key);
}
