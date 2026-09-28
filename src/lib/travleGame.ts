/**
 * 🗺️ Moteur de Jeu Travle (Le Relieur de Continents)
 * Reliez deux pays en nommant uniquement des pays frontaliers directs.
 * Calcule le plus court chemin par parcours en largeur (BFS).
 */

import { getAllAtlasCountries, AtlasCountry } from "./atlasData";
import { Language } from "../i18n/translations";

export interface TravleStep {
  iso3: string;
  name: string;
  flagEmoji: string;
  isOptimal?: boolean;
}

export interface TravleAttempt {
  iso3?: string;
  name: string;
  flagEmoji?: string;
  status: "success" | "not_adjacent" | "already_visited" | "invalid";
  message: string;
}

export interface TravleGameSession {
  id: string;
  dateStr: string;
  startCountry: AtlasCountry;
  targetCountry: AtlasCountry;
  currentCountry: AtlasCountry;
  path: TravleStep[];
  attempts: TravleAttempt[];
  optimalPath: string[]; // ISO3s
  optimalStepsCount: number;
  isFinished: boolean;
  won: boolean;
  maxGuesses: number;
  guessesUsed: number;
}

// Construction du graphe d'adjacence bidirectionnel
let cachedAdjacency: Map<string, Set<string>> | null = null;
let cachedCountriesMap: Map<string, AtlasCountry> | null = null;

export function getTravleGraph(lang: Language = "fr"): {
  adjacency: Map<string, Set<string>>;
  countriesMap: Map<string, AtlasCountry>;
} {
  if (cachedAdjacency && cachedCountriesMap) {
    return { adjacency: cachedAdjacency, countriesMap: cachedCountriesMap };
  }

  const countries = getAllAtlasCountries(lang);
  const countriesMap = new Map<string, AtlasCountry>();
  const adjacency = new Map<string, Set<string>>();

  // Initialisation
  for (const c of countries) {
    countriesMap.set(c.iso3.toUpperCase(), c);
    if (!adjacency.has(c.iso3.toUpperCase())) {
      adjacency.set(c.iso3.toUpperCase(), new Set());
    }
  }

  // Connexions frontalières réelles
  for (const c of countries) {
    const fromIso = c.iso3.toUpperCase();
    for (const neighbor of c.borders || []) {
      const toIso = neighbor.toUpperCase();
      if (countriesMap.has(toIso)) {
        adjacency.get(fromIso)?.add(toIso);
        adjacency.get(toIso)?.add(fromIso);
      }
    }
  }

  // Connexions terrestres / ponts réputés pour la continuité de jeu :
  // Danemark <-> Suède (Pont de l'Øresund)
  if (countriesMap.has("DNK") && countriesMap.has("SWE")) {
    adjacency.get("DNK")?.add("SWE");
    adjacency.get("SWE")?.add("DNK");
  }
  // Royaume-Uni <-> France (Tunnel sous la Manche)
  if (countriesMap.has("GBR") && countriesMap.has("FRA")) {
    adjacency.get("GBR")?.add("FRA");
    adjacency.get("FRA")?.add("GBR");
  }
  // Égypte <-> Israël (Continuité Afrique - Eurasie)
  if (countriesMap.has("EGY") && countriesMap.has("ISR")) {
    adjacency.get("EGY")?.add("ISR");
    adjacency.get("ISR")?.add("EGY");
  }
  // Singapour <-> Malaisie (Chaussée Johor-Singapour)
  if (countriesMap.has("SGP") && countriesMap.has("MYS")) {
    adjacency.get("SGP")?.add("MYS");
    adjacency.get("MYS")?.add("SGP");
  }
  // Bahreïn <-> Arabie Saoudite (Chaussée du Roi Fahd)
  if (countriesMap.has("BHR") && countriesMap.has("SAU")) {
    adjacency.get("BHR")?.add("SAU");
    adjacency.get("SAU")?.add("BHR");
  }

  cachedAdjacency = adjacency;
  cachedCountriesMap = countriesMap;
  return { adjacency, countriesMap };
}

/**
 * Calcul du plus court chemin par Breadth-First Search (BFS)
 */
export function findShortestPath(startIso3: string, targetIso3: string): string[] | null {
  const { adjacency } = getTravleGraph();
  const start = startIso3.toUpperCase();
  const target = targetIso3.toUpperCase();

  if (start === target) return [start];
  if (!adjacency.has(start) || !adjacency.has(target)) return null;

  const queue: string[] = [start];
  const visited = new Set<string>([start]);
  const parent = new Map<string, string>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === target) {
      // Reconstruction du chemin
      const path: string[] = [];
      let step: string | undefined = target;
      while (step) {
        path.unshift(step);
        step = parent.get(step);
      }
      return path;
    }

    const neighbors = adjacency.get(current) || new Set();
    for (const n of neighbors) {
      if (!visited.has(n)) {
        visited.add(n);
        parent.set(n, current);
        queue.push(n);
      }
    }
  }

  return null; // Pas de route terrestre trouvée
}

export type TravleFilterType =
  | "all"
  | "express" // Voyage Express (3 à 4 frontières)
  | "transcontinental" // Grand Voyage Transcontinental (6 à 10 frontières)
  | "europe" // 100% Europe
  | "asia" // 100% Asie
  | "americas" // 100% Amériques
  | "africa"; // 100% Afrique

export interface CuratedTravlePair {
  start: string;
  target: string;
  title: string;
  category: "express" | "transcontinental" | "europe" | "asia" | "americas" | "africa";
  subtitle?: string;
}

/**
 * Paires sélectionnées et catégorisées pour les filtres de voyage
 */
export const CURATED_TRAVLE_PAIRS: CuratedTravlePair[] = [
  // ── ⚡ VOYAGES EXPRESS (3 à 4 frontières) ──
  {
    start: "FRA",
    target: "POL",
    title: "Voyage Express : France ➡️ Pologne",
    category: "express",
    subtitle: "3 frontières (France ➔ Allemagne ➔ Pologne)",
  },
  {
    start: "PRT",
    target: "DEU",
    title: "Voyage Express : Portugal ➡️ Allemagne",
    category: "express",
    subtitle: "3 frontières (Portugal ➔ Espagne ➔ France ➔ Allemagne)",
  },
  {
    start: "CAN",
    target: "MEX",
    title: "Voyage Express : Canada ➡️ Mexique",
    category: "express",
    subtitle: "2 frontières (Canada ➔ USA ➔ Mexique)",
  },
  {
    start: "CHL",
    target: "BRA",
    title: "Voyage Express : Chili ➡️ Brésil",
    category: "express",
    subtitle: "3 frontières (Chili ➔ Argentine ➔ Brésil)",
  },
  {
    start: "ITA",
    target: "DNK",
    title: "Voyage Express : Italie ➡️ Danemark",
    category: "express",
    subtitle: "3 frontières (Italie ➔ Autriche ➔ Allemagne ➔ Danemark)",
  },
  {
    start: "THA",
    target: "VNM",
    title: "Voyage Express : Thaïlande ➡️ Viêt Nam",
    category: "express",
    subtitle: "2 frontières (Thaïlande ➔ Laos ➔ Viêt Nam)",
  },
  {
    start: "EGY",
    target: "JOR",
    title: "Voyage Express : Égypte ➡️ Jordanie",
    category: "express",
    subtitle: "2 frontières (Égypte ➔ Israël ➔ Jordanie)",
  },
  {
    start: "BEL",
    target: "AUT",
    title: "Voyage Express : Belgique ➡️ Autriche",
    category: "express",
    subtitle: "2 frontières (Belgique ➔ Allemagne ➔ Autriche)",
  },

  // ── 🌍 GRANDS VOYAGES TRANSCONTINENTAUX (6 à 10 frontières) ──
  {
    start: "PRT",
    target: "THA",
    title: "Grand Voyage : De l'Atlantique à l'Indochine",
    category: "transcontinental",
    subtitle: "Portugal ➡️ Thaïlande (~9 frontières)",
  },
  {
    start: "CAN",
    target: "ARG",
    title: "Grand Voyage : La Grande Traversée Panaméricaine",
    category: "transcontinental",
    subtitle: "Canada ➡️ Argentine (~9 frontières)",
  },
  {
    start: "NOR",
    target: "ZAF",
    title: "Grand Voyage : Du Pôle Nord au Cap de Bonne-Espérance",
    category: "transcontinental",
    subtitle: "Norvège ➡️ Afrique du Sud (~10 frontières)",
  },
  {
    start: "FRA",
    target: "IND",
    title: "Grand Voyage : La Route de la Soie",
    category: "transcontinental",
    subtitle: "France ➡️ Inde (~7 frontières)",
  },
  {
    start: "DEU",
    target: "CHN",
    title: "Grand Voyage : D'Europe Centrale à la Mer de Chine",
    category: "transcontinental",
    subtitle: "Allemagne ➡️ Chine (~6 frontières)",
  },
  {
    start: "ESP",
    target: "SGP",
    title: "Grand Voyage : D'Ibérie à l'Équateur",
    category: "transcontinental",
    subtitle: "Espagne ➡️ Singapour (~10 frontières)",
  },

  // ── 🇪🇺 100% EUROPE ──
  {
    start: "ITA",
    target: "FIN",
    title: "100% Europe : De la Méditerranée à la Laponie",
    category: "europe",
    subtitle: "Italie ➡️ Finlande",
  },
  {
    start: "PRT",
    target: "GRC",
    title: "100% Europe : Du Tage au Parthénon",
    category: "europe",
    subtitle: "Portugal ➡️ Grèce",
  },
  {
    start: "CHE",
    target: "NOR",
    title: "100% Europe : Des Alpes aux Fjords",
    category: "europe",
    subtitle: "Suisse ➡️ Norvège",
  },
  {
    start: "ESP",
    target: "POL",
    title: "100% Europe : Des Pyrénées aux Carpates",
    category: "europe",
    subtitle: "Espagne ➡️ Pologne",
  },

  // ── 🌏 100% ASIE ──
  {
    start: "TUR",
    target: "VNM",
    title: "100% Asie : D'Anatolie au Mékong",
    category: "asia",
    subtitle: "Turquie ➡️ Viêt Nam",
  },
  {
    start: "SAU",
    target: "KAZ",
    title: "100% Asie : Des Dunes aux Steppes",
    category: "asia",
    subtitle: "Arabie Saoudite ➡️ Kazakhstan",
  },
  {
    start: "IND",
    target: "MNG",
    title: "100% Asie : Du Gange au Désert de Gobi",
    category: "asia",
    subtitle: "Inde ➡️ Mongolie",
  },
  {
    start: "GEO",
    target: "THA",
    title: "100% Asie : Du Caucase aux Plages Thaïlandaises",
    category: "asia",
    subtitle: "Géorgie ➡️ Thaïlande",
  },

  // ── 🌎 100% AMÉRIQUES ──
  {
    start: "COL",
    target: "CHL",
    title: "100% Amériques : L'Échine des Andes",
    category: "americas",
    subtitle: "Colombie ➡️ Chili",
  },
  {
    start: "CAN",
    target: "PAN",
    title: "100% Amériques : De la Toundra au Canal de Panama",
    category: "americas",
    subtitle: "Canada ➡️ Panama",
  },
  {
    start: "ARG",
    target: "COL",
    title: "100% Amériques : De la Terre de Feu aux Caraïbes",
    category: "americas",
    subtitle: "Argentine ➡️ Colombie",
  },
  {
    start: "BRA",
    target: "ECU",
    title: "100% Amériques : Du Bassin Amazonien au Pacifique",
    category: "americas",
    subtitle: "Brésil ➡️ Équateur",
  },

  // ── 🌍 100% AFRIQUE ──
  {
    start: "SEN",
    target: "EGY",
    title: "100% Afrique : La Transsaharienne",
    category: "africa",
    subtitle: "Sénégal ➡️ Égypte",
  },
  {
    start: "MAR",
    target: "KEN",
    title: "100% Afrique : Du Maghreb aux Grands Lacs",
    category: "africa",
    subtitle: "Maroc ➡️ Kenya",
  },
  {
    start: "ZAF",
    target: "ETH",
    title: "100% Afrique : Du Cap au Nil Bleu",
    category: "africa",
    subtitle: "Afrique du Sud ➡️ Éthiopie",
  },
  {
    start: "CIV",
    target: "TZA",
    title: "100% Afrique : D'Abidjan au Kilimandjaro",
    category: "africa",
    subtitle: "Côte d'Ivoire ➡️ Tanzanie",
  },
];

/**
 * Récupère les paires filtrées selon le filtre choisi
 */
export function getPairsForFilter(filter: TravleFilterType): CuratedTravlePair[] {
  if (filter === "all") return CURATED_TRAVLE_PAIRS;
  return CURATED_TRAVLE_PAIRS.filter((p) => p.category === filter);
}

/**
 * Récupère une paire aléatoire selon le filtre choisi
 */
export function getRandomPairForFilter(filter: TravleFilterType): CuratedTravlePair {
  const filtered = getPairsForFilter(filter);
  if (filtered.length === 0) return CURATED_TRAVLE_PAIRS[0];
  const idx = Math.floor(Math.random() * filtered.length);
  return filtered[idx];
}

/**
 * Récupère la paire du jour (déterministe selon la date)
 */
export function getDailyTravlePair(dateStr: string = new Date().toISOString().slice(0, 10)) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CURATED_TRAVLE_PAIRS.length;
  return CURATED_TRAVLE_PAIRS[index];
}

/**
 * Initialise une nouvelle partie de Travle
 */
export function startTravleGame(
  isDaily: boolean = true,
  customPair?: { start: string; target: string },
  lang: Language = "fr"
): TravleGameSession {
  const { countriesMap } = getTravleGraph(lang);
  const pair = customPair || (isDaily ? getDailyTravlePair() : CURATED_TRAVLE_PAIRS[Math.floor(Math.random() * CURATED_TRAVLE_PAIRS.length)]);

  const startCountry = countriesMap.get(pair.start.toUpperCase()) || countriesMap.get("FRA")!;
  const targetCountry = countriesMap.get(pair.target.toUpperCase()) || countriesMap.get("THA")!;

  const optimalPath = findShortestPath(startCountry.iso3, targetCountry.iso3) || [startCountry.iso3, targetCountry.iso3];
  const optimalStepsCount = Math.max(1, optimalPath.length - 1); // Nombre de frontières à franchir

  return {
    id: `travle-${Date.now()}`,
    dateStr: new Date().toISOString().slice(0, 10),
    startCountry,
    targetCountry,
    currentCountry: startCountry,
    path: [
      {
        iso3: startCountry.iso3,
        name: startCountry.name,
        flagEmoji: startCountry.flagEmoji,
      },
    ],
    attempts: [],
    optimalPath,
    optimalStepsCount,
    isFinished: false,
    won: false,
    maxGuesses: optimalStepsCount + 8, // Marge de tolérance
    guessesUsed: 0,
  };
}

/**
 * Soumet une tentative de pays
 */
export function submitTravleGuess(
  session: TravleGameSession,
  inputCountryNameOrIso: string,
  lang: Language = "fr"
): { session: TravleGameSession; attempt: TravleAttempt } {
  if (session.isFinished) {
    return {
      session,
      attempt: {
        name: inputCountryNameOrIso,
        status: "invalid",
        message: "La partie est déjà terminée !",
      },
    };
  }

  const { adjacency, countriesMap } = getTravleGraph(lang);
  const query = inputCountryNameOrIso.trim().toLowerCase();

  // Recherche du pays
  let guessedCountry: AtlasCountry | undefined;
  for (const c of countriesMap.values()) {
    if (
      c.iso3.toLowerCase() === query ||
      c.name.toLowerCase() === query ||
      c.officialName.toLowerCase() === query
    ) {
      guessedCountry = c;
      break;
    }
  }

  if (!guessedCountry) {
    const attempt: TravleAttempt = {
      name: inputCountryNameOrIso,
      status: "invalid",
      message: "Pays introuvable ou mal orthographié.",
    };
    session.attempts.push(attempt);
    return { session: { ...session }, attempt };
  }

  const guessedIso = guessedCountry.iso3.toUpperCase();
  const currentIso = session.currentCountry.iso3.toUpperCase();
  const targetIso = session.targetCountry.iso3.toUpperCase();

  // Déjà visité dans ce parcours ?
  if (session.path.some((step) => step.iso3.toUpperCase() === guessedIso)) {
    const attempt: TravleAttempt = {
      iso3: guessedCountry.iso3,
      name: guessedCountry.name,
      flagEmoji: guessedCountry.flagEmoji,
      status: "already_visited",
      message: `${guessedCountry.name} est déjà dans votre itinéraire !`,
    };
    session.attempts.push(attempt);
    return { session: { ...session }, attempt };
  }

  // Vérifier si frontalier direct avec le pays actuel
  const currentNeighbors = adjacency.get(currentIso) || new Set();
  const isDirectNeighbor = currentNeighbors.has(guessedIso);

  if (!isDirectNeighbor) {
    session.guessesUsed += 1;
    const attempt: TravleAttempt = {
      iso3: guessedCountry.iso3,
      name: guessedCountry.name,
      flagEmoji: guessedCountry.flagEmoji,
      status: "not_adjacent",
      message: `${guessedCountry.name} ne partage pas de frontière avec ${session.currentCountry.name}.`,
    };
    session.attempts.push(attempt);

    if (session.guessesUsed >= session.maxGuesses) {
      session.isFinished = true;
      session.won = false;
    }

    return { session: { ...session }, attempt };
  }

  // C'est un voisin direct valide !
  session.guessesUsed += 1;
  session.currentCountry = guessedCountry;
  session.path.push({
    iso3: guessedCountry.iso3,
    name: guessedCountry.name,
    flagEmoji: guessedCountry.flagEmoji,
  });

  const attempt: TravleAttempt = {
    iso3: guessedCountry.iso3,
    name: guessedCountry.name,
    flagEmoji: guessedCountry.flagEmoji,
    status: "success",
    message: `Frontière franchie vers ${guessedCountry.name} ! 🚀`,
  };
  session.attempts.push(attempt);

  // Victoire : arrivé à destination
  if (guessedIso === targetIso) {
    session.isFinished = true;
    session.won = true;
  } else if (session.guessesUsed >= session.maxGuesses) {
    session.isFinished = true;
    session.won = false;
  }

  return { session: { ...session }, attempt };
}

/**
 * Génère la carte textuelle de partage émojis
 */
export function generateTravleShareText(session: TravleGameSession): string {
  const stepsTaken = session.path.length - 1;
  const optimal = session.optimalStepsCount;
  const isPerfect = stepsTaken === optimal;

  let stars = "⭐";
  if (isPerfect) stars = "⭐⭐⭐";
  else if (stepsTaken <= optimal + 2) stars = "⭐⭐";

  const pathEmojis = session.path.map((s) => s.flagEmoji).join(" ➔ ");

  return `🗺️ TerraCoast Travle #${session.dateStr}\n${session.startCountry.flagEmoji} ${session.startCountry.name} ➡️ ${session.targetCountry.flagEmoji} ${session.targetCountry.name}\n\n${session.won ? `🏆 Gagné en ${stepsTaken} étapes (Optimal : ${optimal}) ${stars}` : "❌ Itinéraire inachevé"}\nItinéraire : ${pathEmojis}\n\nJoue gratuitement sur https://terracoast.ch/games/travle`;
}
