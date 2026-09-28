/**
 * 🎮 TerraCoast Gamification Manager (Duolingo Style)
 * Gère les ressources du joueur :
 * - 💎 TerraGems : monnaie du jeu gagnée à chaque étape et coffre
 * - ❤️ Cœurs / Vies (5 max) : régénération temporelle automatique (1 cœur / 20 min)
 * - 🏆 Ligues Duolingo (Bronze, Argent, Or, Saphir, Rubis, Diamant)
 * - 🗺️ Parcours d'Apprentissage (Unités, Nœuds oscillants, Étoiles ⭐⭐⭐, Coffres au trésor 🎁)
 */

import {
  getAllPathAssignments,
  getCustomUnits,
  type PathNode,
  type PathChest,
  type PathUnit,
} from "./pathConfigManager";

export type { PathNode, PathChest, PathUnit };

export interface ShopItem {
  id: string;
  name: string;
  category: "consumable" | "theme" | "frame" | "title";
  priceGems: number;
  icon: string;
  badge?: string;
  description: string;
  details?: string;
  previewGradient?: string;
}

export interface PlayerGamificationState {
  gems: number;
  lives: number;
  maxLives: number;
  lastLifeLostAt: number | null; // timestamp ms
  nextLifeRefillMs: number; // ms until next life
  claimedChests: string[];
  completedNodes: Record<string, { stars: number; completedAt: number }>;
  streakFreezes: number;
  doubleXpUntil?: number | null;
  inventory: {
    themes: string[];
    avatarFrames: string[];
    titles: string[];
  };
  activeTheme: string;
  activeAvatarFrame: string;
  activeTitle: string | null;
  _v2Cleaned?: boolean;
}

export const SHOP_CATALOG: ShopItem[] = [
  // 1. Consommables & Boosters
  {
    id: "streak_freeze",
    name: "Gel de Flamme 🧊",
    category: "consumable",
    priceGems: 200,
    icon: "🧊",
    badge: "Essentiel",
    description: "Protège ta série de jours si tu manques une journée.",
    details: "S'active automatiquement si tu oublies de jouer. Évite de perdre ta flamme !",
    previewGradient: "from-sky-500/20 to-blue-500/20 border-sky-400/40",
  },
  {
    id: "refill_lives",
    name: "Recharge de Cœurs ❤️",
    category: "consumable",
    priceGems: 100,
    icon: "❤️",
    badge: "Plein d'Énergie",
    description: "Restaure immédiatement tes 5 vies.",
    details: "Plus besoin d'attendre 20 minutes par vie : reprends ta partie sans interruption !",
    previewGradient: "from-rose-500/20 to-red-500/20 border-rose-400/40",
  },
  {
    id: "double_xp_15m",
    name: "Boost Double XP (15 min) ⚡",
    category: "consumable",
    priceGems: 150,
    icon: "⚡",
    badge: "Multiplicateur",
    description: "Double tous les gains d'XP pendant 15 minutes.",
    details: "Grimpez plus rapidement dans la ligue et validez vos défis !",
    previewGradient: "from-amber-500/20 to-yellow-500/20 border-amber-400/40",
  },

  // 2. Thèmes & Textures pour le Globe 3D & Cartes
  {
    id: "theme_antique",
    name: "Globe Parchemin Antique 📜",
    category: "theme",
    priceGems: 350,
    icon: "📜",
    badge: "Élégant",
    description: "Style cartes marines du 17e siècle avec teintes sépia et océans parcheminés.",
    details: "S'applique en temps réel sur le globe 3D de l'Atlas et de l'accueil.",
    previewGradient: "from-amber-700/20 to-stone-800/20 border-amber-600/40",
  },
  {
    id: "theme_night",
    name: "Globe Satellite Nocturne 🌃",
    category: "theme",
    priceGems: 400,
    icon: "🌃",
    badge: "Vue Spatiale",
    description: "Vue satellite orbitale avec lumières dorées des mégalopoles mondiales.",
    details: "Idéal pour une exploration contemplative et contrastée.",
    previewGradient: "from-indigo-900/30 to-slate-950/40 border-indigo-500/40",
  },
  {
    id: "theme_cyberpunk",
    name: "Globe Cyberpunk / Néon 👾",
    category: "theme",
    priceGems: 450,
    icon: "👾",
    badge: "Futuriste",
    description: "Océans sombres, tracés vectoriels luminescents vert émeraude et cyan.",
    details: "Un rendu visuel high-tech pour les cartographes modernes.",
    previewGradient: "from-cyan-900/30 to-fuchsia-950/40 border-cyan-400/50",
  },

  // 3. Cadres d'Avatar Animés
  {
    id: "frame_flame",
    name: "Flamme Incandescente 🔥",
    category: "frame",
    priceGems: 250,
    icon: "🔥",
    badge: "Animé",
    description: "Halo de braises ardentes qui palpite autour de votre photo de profil.",
    details: "Visible sur vos scores, duels, classements et votre profil.",
    previewGradient: "from-orange-500/20 to-amber-500/20 border-orange-400/40",
  },
  {
    id: "frame_compass",
    name: "Rose des Vents 🧭",
    category: "frame",
    priceGems: 300,
    icon: "🧭",
    badge: "Animé",
    description: "Boussole de marin dorée en rotation continue autour de votre avatar.",
    details: "Pour afficher fièrement votre sens inné de l'orientation.",
    previewGradient: "from-teal-500/20 to-emerald-500/20 border-teal-400/40",
  },
  {
    id: "frame_crown",
    name: "Couronne d'Explorateur 👑",
    category: "frame",
    priceGems: 500,
    icon: "👑",
    badge: "Légendaire",
    description: "Couronne d'or sertie de gemmes scintillantes pour les maîtres du monde.",
    details: "Le cosmétique suprême pour régner sur les classements.",
    previewGradient: "from-yellow-500/20 to-amber-500/30 border-yellow-400/50",
  },

  // 4. Titres Honorifiques Exclusifs
  {
    id: "title_navigator",
    name: "Navigateur des Équateurs 🌊",
    category: "title",
    priceGems: 200,
    icon: "🌊",
    badge: "Titre",
    description: "Titre de prestige affiché sous votre pseudo sur l'ensemble de l'application.",
    details: "Célèbre votre maîtrise des latitudes et des traversées océaniques.",
    previewGradient: "from-sky-500/20 to-indigo-500/20 border-sky-400/40",
  },
  {
    id: "title_cartographer",
    name: "Cartographe Suprême 📐",
    category: "title",
    priceGems: 350,
    icon: "📐",
    badge: "Titre",
    description: "Titre d'expert pour ceux qui connaissent chaque frontière au millimètre.",
    details: "Affiche un insigne doré de géomètre impérial sur votre fiche joueur.",
    previewGradient: "from-emerald-500/20 to-teal-500/20 border-emerald-400/40",
  },
  {
    id: "title_conqueror",
    name: "Maître des 7 Océans 🔱",
    category: "title",
    priceGems: 500,
    icon: "🔱",
    badge: "Légendaire",
    description: "Le titre ultime réservé aux conquérants des terres et des mers.",
    details: "Impressionne tes rivaux lors des duels et des parties multijoueur !",
    previewGradient: "from-purple-500/20 to-indigo-500/20 border-purple-400/40",
  },
];

export interface LeagueTier {
  name: string;
  tier: number;
  icon: string;
  minXp: number;
  color: string;
  textColor: string;
  bgGradient: string;
}

export const DUOLINGO_LEAGUES: LeagueTier[] = [
  {
    name: "Ligue Bronze",
    tier: 1,
    icon: "🥉",
    minXp: 0,
    color: "#b45309",
    textColor: "text-amber-800",
    bgGradient: "from-amber-100 to-amber-200 border-amber-300",
  },
  {
    name: "Ligue Argent",
    tier: 2,
    icon: "🥈",
    minXp: 250,
    color: "#94a3b8",
    textColor: "text-slate-700",
    bgGradient: "from-slate-100 to-slate-200 border-slate-300",
  },
  {
    name: "Ligue Or",
    tier: 3,
    icon: "🥇",
    minXp: 750,
    color: "#eab308",
    textColor: "text-yellow-800",
    bgGradient: "from-yellow-100 to-amber-200 border-yellow-400",
  },
  {
    name: "Ligue Saphir",
    tier: 4,
    icon: "💎",
    minXp: 1800,
    color: "#0284c7",
    textColor: "text-sky-800",
    bgGradient: "from-sky-100 to-cyan-200 border-sky-300",
  },
  {
    name: "Ligue Rubis",
    tier: 5,
    icon: "🔥",
    minXp: 3500,
    color: "#e11d48",
    textColor: "text-rose-800",
    bgGradient: "from-rose-100 to-red-200 border-rose-300",
  },
  {
    name: "Ligue Diamant",
    tier: 6,
    icon: "👑",
    minXp: 6000,
    color: "#9333ea",
    textColor: "text-purple-800",
    bgGradient: "from-purple-100 via-fuchsia-100 to-pink-200 border-purple-400",
  },
];

const REFILL_TIME_MS = 20 * 60 * 1000; // 20 minutes par vie
const MAX_LIVES = 5;
const DEFAULT_GEMS = 180;

const memoryStore = new Map<string, string>();

function getStorageKey(userId?: string): string {
  return `terracost_gamification_${userId || "guest"}`;
}

function getStoredString(key: string): string | null {
  if (typeof localStorage !== "undefined") {
    try {
      return localStorage.getItem(key);
    } catch {
      // fallback
    }
  }
  return memoryStore.get(key) || null;
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
  memoryStore.set(key, val);
}

/**
 * Réinitialise l'état pour les tests
 */
export function resetGamificationState(userId?: string): void {
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

/**
 * Charge l'état gamifié du joueur depuis le localStorage et calcule la régénération des vies
 */
export function getPlayerGamificationState(userId?: string): PlayerGamificationState {
  const key = getStorageKey(userId);
  let state: PlayerGamificationState = {
    gems: DEFAULT_GEMS,
    lives: MAX_LIVES,
    maxLives: MAX_LIVES,
    lastLifeLostAt: null,
    nextLifeRefillMs: 0,
    claimedChests: [],
    completedNodes: {},
    streakFreezes: 0,
    inventory: {
      themes: ["default"],
      avatarFrames: ["none"],
      titles: [],
    },
    activeTheme: "default",
    activeAvatarFrame: "none",
    activeTitle: null,
    _v2Cleaned: true,
  };

  try {
    const raw = getStoredString(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = {
        ...state,
        ...parsed,
        inventory: {
          themes: parsed.inventory?.themes || ["default"],
          avatarFrames: parsed.inventory?.avatarFrames || ["none"],
          titles: parsed.inventory?.titles || [],
        },
      };

      // Nettoyage automatique du bouchon par défaut où u1-n1 était pré-validé
      if (!parsed._v2Cleaned) {
        if (state.completedNodes) {
          delete state.completedNodes["u1-n1"];
        }
        state._v2Cleaned = true;
        savePlayerGamificationState(userId, state);
      }
    }
  } catch (err) {
    console.warn("Could not read gamification state:", err);
  }

  // Calcul de la régénération des vies
  if (state.lives < MAX_LIVES && state.lastLifeLostAt) {
    const now = Date.now();
    const elapsed = now - state.lastLifeLostAt;
    const recovered = Math.floor(elapsed / REFILL_TIME_MS);

    if (recovered > 0) {
      state.lives = Math.min(MAX_LIVES, state.lives + recovered);
      if (state.lives >= MAX_LIVES) {
        state.lastLifeLostAt = null;
        state.nextLifeRefillMs = 0;
      } else {
        // Temps restant pour la prochaine vie
        const remainder = elapsed % REFILL_TIME_MS;
        state.lastLifeLostAt = now - remainder;
        state.nextLifeRefillMs = REFILL_TIME_MS - remainder;
      }
      savePlayerGamificationState(userId, state);
    } else {
      state.nextLifeRefillMs = REFILL_TIME_MS - elapsed;
    }
  } else {
    state.nextLifeRefillMs = 0;
  }

  return state;
}

/**
 * Sauvegarde l'état gamifié dans le localStorage
 */
export function savePlayerGamificationState(
  userId: string | undefined,
  state: PlayerGamificationState
): void {
  try {
    const key = getStorageKey(userId);
    setStoredString(key, JSON.stringify(state));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("terracost_gamification_updated", { detail: state }));
    }
  } catch (err) {
    console.warn("Could not save gamification state:", err);
  }
}

/**
 * Déduit une vie (en cas d'erreur ou d'échec)
 */
export function deductLife(userId?: string): boolean {
  const state = getPlayerGamificationState(userId);
  if (state.lives <= 0) return false;

  state.lives -= 1;
  // Ne déclencher le minuteur de régénération que si les vies sont repassées sous le max standard
  if (state.lives < MAX_LIVES && !state.lastLifeLostAt) {
    state.lastLifeLostAt = Date.now();
  }
  savePlayerGamificationState(userId, state);
  return true;
}

/**
 * Recharge toutes les vies instantanément (ex: via achat en gems ou bonus)
 */
export function refillAllLives(userId?: string): void {
  const state = getPlayerGamificationState(userId);
  state.lives = MAX_LIVES;
  state.lastLifeLostAt = null;
  state.nextLifeRefillMs = 0;
  savePlayerGamificationState(userId, state);
}

/**
 * Ajoute des TerraGems 💎
 */
export function addGems(userId: string | undefined, amount: number): number {
  const state = getPlayerGamificationState(userId);
  state.gems = Math.max(0, state.gems + amount);
  savePlayerGamificationState(userId, state);
  return state.gems;
}

export interface AdminGrantParams {
  gemsDelta?: number;
  livesDelta?: number;
  setGems?: number;
  setLives?: number;
  fullRefill?: boolean;
  streakFreezesDelta?: number;
  setStreakFreezes?: number;
}

/**
 * Outil d'administration / Développeur pour s'octroyer ou octroyer des gemmes, cœurs et bonus
 */
export function adminGrantResources(
  userId: string | undefined,
  params: AdminGrantParams
): PlayerGamificationState {
  const state = getPlayerGamificationState(userId);

  if (params.fullRefill) {
    state.lives = MAX_LIVES;
    state.lastLifeLostAt = null;
    state.nextLifeRefillMs = 0;
  }

  if (typeof params.setLives === "number") {
    state.lives = Math.max(0, Math.floor(params.setLives));
    if (state.lives >= MAX_LIVES) {
      state.lastLifeLostAt = null;
      state.nextLifeRefillMs = 0;
    }
  } else if (typeof params.livesDelta === "number") {
    state.lives = Math.max(0, state.lives + Math.floor(params.livesDelta));
    if (state.lives >= MAX_LIVES) {
      state.lastLifeLostAt = null;
      state.nextLifeRefillMs = 0;
    }
  }

  if (typeof params.setGems === "number") {
    state.gems = Math.max(0, Math.floor(params.setGems));
  } else if (typeof params.gemsDelta === "number") {
    state.gems = Math.max(0, state.gems + Math.floor(params.gemsDelta));
  }

  if (typeof params.setStreakFreezes === "number") {
    state.streakFreezes = Math.max(0, Math.floor(params.setStreakFreezes));
  } else if (typeof params.streakFreezesDelta === "number") {
    state.streakFreezes = Math.max(0, (state.streakFreezes || 0) + Math.floor(params.streakFreezesDelta));
  }

  savePlayerGamificationState(userId, state);
  return state;
}

/**
 * Achète un article dans la Boutique TerraGems 💎
 */
export function buyShopItem(
  userId: string | undefined,
  itemId: string
): { success: boolean; message: string; state: PlayerGamificationState } {
  const state = getPlayerGamificationState(userId);
  const item = SHOP_CATALOG.find((it) => it.id === itemId);

  if (!item) {
    return { success: false, message: "Article introuvable dans la boutique.", state };
  }

  if (state.gems < item.priceGems) {
    return {
      success: false,
      message: `TerraGems insuffisantes ! Il vous manque ${item.priceGems - state.gems} 💎.`,
      state,
    };
  }

  // Déduire les gems
  state.gems -= item.priceGems;

  if (item.category === "consumable") {
    if (item.id === "streak_freeze") {
      state.streakFreezes = (state.streakFreezes || 0) + 1;
    } else if (item.id === "refill_lives") {
      state.lives = MAX_LIVES;
      state.lastLifeLostAt = null;
      state.nextLifeRefillMs = 0;
    } else if (item.id === "double_xp_15m") {
      state.doubleXpUntil = Math.max(Date.now(), state.doubleXpUntil || 0) + 15 * 60 * 1000;
    }
  } else if (item.category === "theme") {
    if (!state.inventory.themes.includes(item.id)) {
      state.inventory.themes.push(item.id);
    }
    state.activeTheme = item.id;
  } else if (item.category === "frame") {
    if (!state.inventory.avatarFrames.includes(item.id)) {
      state.inventory.avatarFrames.push(item.id);
    }
    state.activeAvatarFrame = item.id;
  } else if (item.category === "title") {
    if (!state.inventory.titles.includes(item.id)) {
      state.inventory.titles.push(item.id);
    }
    state.activeTitle = item.id;
  }

  savePlayerGamificationState(userId, state);
  return {
    success: true,
    message: `${item.name} acquis avec succès !`,
    state,
  };
}

/**
 * Équipe un cosmétique de l'inventaire
 */
export function equipShopItem(
  userId: string | undefined,
  itemType: "theme" | "frame" | "title",
  itemId: string | null
): PlayerGamificationState {
  const state = getPlayerGamificationState(userId);

  if (itemType === "theme") {
    if (!itemId || state.inventory.themes.includes(itemId)) {
      state.activeTheme = itemId || "default";
    }
  } else if (itemType === "frame") {
    if (!itemId || state.inventory.avatarFrames.includes(itemId)) {
      state.activeAvatarFrame = itemId || "none";
    }
  } else if (itemType === "title") {
    if (!itemId || state.inventory.titles.includes(itemId)) {
      state.activeTitle = itemId;
    }
  }

  savePlayerGamificationState(userId, state);
  return state;
}

/**
 * Consomme un Streak Freeze si disponible pour sauver la série
 */
export function consumeStreakFreeze(userId: string | undefined): boolean {
  const state = getPlayerGamificationState(userId);
  if ((state.streakFreezes || 0) > 0) {
    state.streakFreezes -= 1;
    savePlayerGamificationState(userId, state);
    return true;
  }
  return false;
}

/**
 * Récupère le thème actif du globe
 */
export function getActiveGlobeTheme(userId?: string): string {
  return getPlayerGamificationState(userId).activeTheme || "default";
}

/**
 * Récupère le cadre d'avatar actif
 */
export function getActiveAvatarFrame(userId?: string): string {
  return getPlayerGamificationState(userId).activeAvatarFrame || "none";
}

/**
 * Récupère le titre honorifique actif
 */
export function getActiveTitle(userId?: string): string | null {
  return getPlayerGamificationState(userId).activeTitle || null;
}

/**
 * Réclame un coffre au trésor 🎁
 */
export function claimChest(
  userId: string | undefined,
  chestId: string,
  gemReward: number
): boolean {
  const state = getPlayerGamificationState(userId);
  if (state.claimedChests.includes(chestId)) return false;

  state.claimedChests.push(chestId);
  state.gems += gemReward;
  savePlayerGamificationState(userId, state);
  return true;
}

/**
 * Marque un nœud de parcours comme complété avec attribution des étoiles ⭐
 */
export function completePathNode(
  userId: string | undefined,
  nodeId: string,
  scorePercentage: number
): { stars: number; gemsAwarded: number } {
  const state = getPlayerGamificationState(userId);
  const stars = scorePercentage >= 90 ? 3 : scorePercentage >= 70 ? 2 : 1;
  const existing = state.completedNodes[nodeId];

  // Si nouveau record d'étoiles ou premier passage
  const isFirstTime = !existing;
  const gemsAwarded = isFirstTime ? 15 : stars > (existing?.stars || 0) ? 5 : 0;

  state.completedNodes[nodeId] = {
    stars: Math.max(stars, existing?.stars || 0),
    completedAt: Date.now(),
  };

  if (gemsAwarded > 0) {
    state.gems += gemsAwarded;
  }

  savePlayerGamificationState(userId, state);
  return { stars, gemsAwarded };
}

/**
 * Retourne la ligue actuelle selon le montant d'XP
 */
export function getLeagueForXp(xp: number = 0): LeagueTier {
  for (let i = DUOLINGO_LEAGUES.length - 1; i >= 0; i--) {
    if (xp >= DUOLINGO_LEAGUES[i].minXp) {
      return DUOLINGO_LEAGUES[i];
    }
  }
  return DUOLINGO_LEAGUES[0];
}

export interface UserLeagueProgress {
  currentLeague: LeagueTier;
  nextLeague: LeagueTier | null;
  tier: number;
  progressPercent: number;
  xpToNext: number;
  divisionRank: number;
  rankLabel: string;
  statusText: string;
}

/**
 * Calcule l'état détaillé de progression dans la ligue et le rang de division
 */
export function getUserLeagueProgress(xp: number = 0, customRank?: number): UserLeagueProgress {
  const currentLeague = getLeagueForXp(xp);
  const nextLeague = DUOLINGO_LEAGUES.find((l) => l.tier === currentLeague.tier + 1) || null;

  let progressPercent = 100;
  let xpToNext = 0;

  if (nextLeague) {
    const tierSpan = nextLeague.minXp - currentLeague.minXp;
    const currentProgress = Math.max(0, xp - currentLeague.minXp);
    progressPercent = Math.min(100, Math.max(0, Math.round((currentProgress / tierSpan) * 100)));
    xpToNext = Math.max(0, nextLeague.minXp - xp);
  }

  // Calcul du rang dans la division (cohorte de 30 joueurs)
  let divisionRank = customRank;
  if (!divisionRank || divisionRank < 1) {
    if (progressPercent >= 85) divisionRank = 2;
    else if (progressPercent >= 70) divisionRank = 4;
    else if (progressPercent >= 50) divisionRank = 7;
    else if (progressPercent >= 30) divisionRank = 11;
    else if (progressPercent >= 15) divisionRank = 16;
    else divisionRank = 21;
  }

  const statusText =
    divisionRank <= 5
      ? "Zone de promotion ⬆️"
      : divisionRank >= 25
      ? "Zone de relégation ⬇️"
      : "Maintien assuré 🛡️";

  const rankLabel = `${currentLeague.icon} ${currentLeague.name} • Rang #${divisionRank}`;

  return {
    currentLeague,
    nextLeague,
    tier: currentLeague.tier,
    progressPercent,
    xpToNext,
    divisionRank,
    rankLabel,
    statusText,
  };
}

export const DEFAULT_BASE_UNITS: PathUnit[] = [
    {
      id: "unit-1",
      unitNumber: 1,
      title: "Continents & Merveilles de la Terre",
      description: "Apprends à situer les 7 continents et les grands océans de la planète !",
      themeColor: "green",
      badgeIcon: "🌍",
      nodes: [
        {
          id: "u1-n1",
          title: "Les 7 Continents",
          subtitle: "Reconnaissance & Formes",
          category: "continents",
          xpReward: 20,
          gemReward: 10,
          stars: 0,
          status: "locked",
          quizIdOrFilter: "continents",
        },
        {
          id: "u1-n2",
          title: "Océans & Grandes Mers",
          subtitle: "Pacifique, Atlantique, Indien",
          category: "oceans",
          xpReward: 25,
          gemReward: 10,
          stars: 0,
          status: "locked",
          quizIdOrFilter: "oceans",
        },
        {
          id: "u1-n3",
          title: "Merveilles Naturelles",
          subtitle: "Grand Canyon, Everest, Barrière de Corail",
          category: "monuments",
          xpReward: 30,
          gemReward: 15,
          stars: 0,
          status: "locked",
          quizIdOrFilter: "nature",
        },
        {
          id: "u1-boss",
          title: "Défi Boss de l'Unité 1",
          subtitle: "Le Maître du Globe",
          category: "boss",
          xpReward: 50,
          gemReward: 25,
          stars: 0,
          status: "locked",
          isBoss: true,
          quizIdOrFilter: "world",
        },
      ],
      chest: {
        id: "u1-chest",
        title: "Coffre de l'Explorateur 1",
        gemReward: 40,
        xpReward: 25,
        claimed: false,
        unlocked: false,
      },
    },
    {
      id: "unit-2",
      unitNumber: 2,
      title: "Capitales & Joyaux d'Europe",
      description: "Parcours le vieux continent, ses capitales majestueuses et son histoire millénaire.",
      themeColor: "blue",
      badgeIcon: "🏛️",
      nodes: [
        {
          id: "u2-n1",
          title: "Capitales d'Europe de l'Ouest",
          subtitle: "Paris, Madrid, Berlin, Rome",
          category: "europe",
          xpReward: 25,
          gemReward: 10,
          stars: 0,
          status: "locked",
          quizIdOrFilter: "europe-west",
        },
        {
          id: "u2-n2",
          title: "Monuments & Patrimoine",
          subtitle: "Colisée, Tour Eiffel, Parthénon",
          category: "monuments",
          xpReward: 30,
          gemReward: 12,
          stars: 0,
          status: "locked",
          quizIdOrFilter: "europe-monuments",
        },
        {
          id: "u2-n3",
          title: "Drapeaux Européens",
          subtitle: "Tricolores & Croix Nordiques",
          category: "flags",
          xpReward: 35,
          gemReward: 15,
          stars: 0,
          status: "locked",
          quizIdOrFilter: "europe-flags",
        },
        {
          id: "u2-boss",
          title: "Défi Boss : Empereur Européen",
          subtitle: "Grand Quizz des 44 Nations",
          category: "boss",
          xpReward: 60,
          gemReward: 30,
          stars: 0,
          status: "locked",
          isBoss: true,
          quizIdOrFilter: "europe-all",
        },
      ],
      chest: {
        id: "u2-chest",
        title: "Trésor Royal Européen",
        gemReward: 60,
        xpReward: 35,
        claimed: false,
        unlocked: false,
      },
    },
    {
      id: "unit-3",
      unitNumber: 3,
      title: "Fleuves, Sommets & Déserts Sauvages",
      description: "Affronte les éléments : du Nil majestueux aux cimes de l'Himalaya et sables du Sahara.",
      themeColor: "amber",
      badgeIcon: "🏔️",
      nodes: [
        {
          id: "u3-n1",
          title: "Les Grands Fleuves",
          subtitle: "Nil, Amazone, Yangtsé, Danube",
          category: "rivers",
          xpReward: 30,
          gemReward: 12,
          stars: 0,
          status: "locked",
          quizIdOrFilter: "rivers",
        },
        {
          id: "u3-n2",
          title: "Les Toits du Monde",
          subtitle: "Cordillère des Andes & Sommets",
          category: "mountains",
          xpReward: 35,
          gemReward: 15,
          stars: 0,
          status: "locked",
          quizIdOrFilter: "mountains",
        },
        {
          id: "u3-n3",
          title: "Déserts Inhospitaliers",
          subtitle: "Sahara, Gobi, Atacama",
          category: "deserts",
          xpReward: 40,
          gemReward: 18,
          stars: 0,
          status: "locked",
          quizIdOrFilter: "deserts",
        },
        {
          id: "u3-boss",
          title: "Défi Boss : Aventurier de l'Extrême",
          subtitle: "Survie Géographique",
          category: "boss",
          xpReward: 75,
          gemReward: 40,
          stars: 0,
          status: "locked",
          isBoss: true,
          quizIdOrFilter: "extreme",
        },
      ],
      chest: {
        id: "u3-chest",
        title: "Coffre d'Aventure Sauvage",
        gemReward: 80,
        xpReward: 45,
        claimed: false,
        unlocked: false,
      },
    },
    {
      id: "unit-4",
      unitNumber: 4,
      title: "Drapeaux & Îles Mystérieuses",
      description: "Embarque pour les archipels lointains, îles volcaniques et drapeaux aux symboles rares.",
      themeColor: "purple",
      badgeIcon: "🏝️",
      nodes: [
        {
          id: "u4-n1",
          title: "Drapeaux à Motifs Rares",
          subtitle: "Soleils, Lions & Étoiles Multiples",
          category: "flags",
          xpReward: 35,
          gemReward: 15,
          stars: 0,
          status: "locked",
          quizIdOrFilter: "rare-flags",
        },
        {
          id: "u4-n2",
          title: "Archipels du Pacifique",
          subtitle: "Polynésie, Fidji, Hawaï",
          category: "islands",
          xpReward: 40,
          gemReward: 20,
          stars: 0,
          status: "locked",
          quizIdOrFilter: "pacific",
        },
        {
          id: "u4-boss",
          title: "Défi Boss : Maître Navigateur",
          subtitle: "Légende des 5 Océans",
          category: "boss",
          xpReward: 100,
          gemReward: 50,
          stars: 0,
          status: "locked",
          isBoss: true,
          quizIdOrFilter: "navigator",
        },
      ],
      chest: {
        id: "u4-chest",
        title: "Trésor des Pirates",
        gemReward: 100,
        xpReward: 60,
        claimed: false,
        unlocked: false,
      },
    },
  ];

/**
 * Retourne la structure complète des unités du parcours d'apprentissage
 * avec l'état dynamique de chaque niveau (verrouillé, actif, complété, étoiles)
 */
export function getQuestPath(userId?: string): PathUnit[] {
  const state = getPlayerGamificationState(userId);
  const assignments = getAllPathAssignments();
  const customUnits = getCustomUnits();

  // Cloner les unités de base
  const defaultClones: PathUnit[] = JSON.parse(JSON.stringify(DEFAULT_BASE_UNITS));
  const unitMap = new Map<string, PathUnit>();

  // 1. Ajouter les unités de base
  defaultClones.forEach((u) => unitMap.set(u.id, u));

  // 2. Fusionner avec les customUnits créées ou modifiées par l'administrateur
  customUnits.forEach((u) => {
    unitMap.set(u.id, JSON.parse(JSON.stringify(u)));
  });

  const allUnits = Array.from(unitMap.values()).sort((a, b) => a.unitNumber - b.unitNumber);

  // Calcul dynamique des statuts débloqués / actifs en cascade séquentielle
  let previousNodeCompleted = true; // Le premier nœud de l'unité 1 est toujours accessible

  for (const unit of allUnits) {
    unit.chest.claimed = state.claimedChests.includes(unit.chest.id);
    let unitNodesCompletedCount = 0;

    for (const node of unit.nodes) {
      const customAssignment = assignments[node.id];
      if (customAssignment) {
        node.assignedQuizId = customAssignment.quizId;
        node.assignedQuizTitle = customAssignment.quizTitle;
        node.hasCustomQuiz = true;
        if (customAssignment.quizTitle) {
          node.title = customAssignment.quizTitle;
        }
      }

      const completedInfo = state.completedNodes[node.id];

      if (completedInfo) {
        node.status = "completed";
        node.stars = completedInfo.stars;
        previousNodeCompleted = true;
        unitNodesCompletedCount++;
      } else if (previousNodeCompleted) {
        // Premier nœud non encore complété = nœud ACTIF
        node.status = "active";
        node.stars = 0;
        previousNodeCompleted = false; // Les suivants seront verrouillés
      } else {
        node.status = "locked";
        node.stars = 0;
      }
    }

    // Le coffre se débloque dès que 2 nœuds de l'unité sont réussis (ou tous les nœuds si moins de 2)
    unit.chest.unlocked = unitNodesCompletedCount >= Math.min(2, unit.nodes.length);
  }

  return allUnits;
}

/**
 * Vérifie si le joueur bénéficie actuellement d'un multiplicateur Double XP
 */
export function isDoubleXpActive(userId?: string): boolean {
  const state = getPlayerGamificationState(userId);
  return Boolean(state.doubleXpUntil && state.doubleXpUntil > Date.now());
}

