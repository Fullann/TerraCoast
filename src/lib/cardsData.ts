/**
 * 🎴 TerraDex - Catalogue des Cartes à Collectionner de Géographie
 * Catégories : Nations & Territoires, Cantons & Régions, Langues du Monde, Explorateurs & Figures, Merveilles Naturelles
 */

export type CardCategory = "country" | "region" | "language" | "figure" | "wonder";

export type CardRarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export type CardContinent = "Europe" | "Asie" | "Afrique" | "Amériques" | "Océanie" | "Monde";

export interface CardTrivia {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TerraCard {
  id: string;
  number: number; // Numéro type Pokédex (ex: 1 -> #001)
  name: string;
  category: CardCategory;
  rarity: CardRarity;
  continent: CardContinent;
  flag?: string; // Emoji drapeau ou symbole
  icon: string; // Emoji d'ambiance
  tagline: string; // Court slogan évocateur
  description: string;
  stats: Record<string, string | number>; // Métadonnées clés (ex: Population, Superficie, Découverte...)
  funFact: string; // Anecdote géographique/culturelle percutante
  quote?: string; // Citation ou devise
  colorScheme: {
    from: string;
    via?: string;
    to: string;
    accent: string;
  };
  trivia: CardTrivia;
}

export interface BoosterPack {
  id: string;
  name: string;
  category: "starter" | "continental" | "mythic" | "daily";
  priceGems: number;
  cardsCount: number;
  icon: string;
  badge?: string;
  description: string;
  gradient: string;
  guaranteedRarity?: CardRarity;
  requiresContinentChoice?: boolean;
}

export const RARITY_CONFIG: Record<
  CardRarity,
  {
    label: string;
    stars: number;
    color: string;
    bgBadge: string;
    borderClass: string;
    glowClass: string;
    dustValue: number; // Poussières d'étoile gagnées sur doublon
    craftCost: number; // Poussières requises pour forger
    dropRate: number; // Probabilité approximative
  }
> = {
  common: {
    label: "Commune",
    stars: 1,
    color: "#64748B",
    bgBadge: "bg-slate-100 text-slate-700 border-slate-300",
    borderClass: "border-slate-300",
    glowClass: "shadow-[0_4px_14px_rgba(100,116,139,0.2)]",
    dustValue: 10,
    craftCost: 60,
    dropRate: 0.60,
  },
  rare: {
    label: "Rare",
    stars: 2,
    color: "#0284C7",
    bgBadge: "bg-sky-100 text-sky-800 border-sky-300",
    borderClass: "border-sky-400",
    glowClass: "shadow-[0_6px_20px_rgba(2,132,199,0.35)]",
    dustValue: 25,
    craftCost: 150,
    dropRate: 0.25,
  },
  epic: {
    label: "Épique",
    stars: 3,
    color: "#9333EA",
    bgBadge: "bg-purple-100 text-purple-800 border-purple-300",
    borderClass: "border-purple-400",
    glowClass: "shadow-[0_8px_25px_rgba(147,51,234,0.45)] ring-1 ring-purple-400/50",
    dustValue: 75,
    craftCost: 400,
    dropRate: 0.11,
  },
  legendary: {
    label: "Légendaire",
    stars: 4,
    color: "#D97706",
    bgBadge: "bg-amber-100 text-amber-900 border-amber-400",
    borderClass: "border-amber-400",
    glowClass: "shadow-[0_10px_32px_rgba(217,119,6,0.6)] ring-2 ring-amber-300",
    dustValue: 200,
    craftCost: 1000,
    dropRate: 0.035,
  },
  mythic: {
    label: "Mythique",
    stars: 5,
    color: "#EC4899",
    bgBadge: "bg-pink-100 text-pink-900 border-pink-400 animate-pulse",
    borderClass: "border-pink-500",
    glowClass: "shadow-[0_12px_40px_rgba(236,72,153,0.7)] ring-2 ring-pink-400 ring-offset-2",
    dustValue: 500,
    craftCost: 2500,
    dropRate: 0.005,
  },
};

export const CATEGORY_CONFIG: Record<
  CardCategory,
  { label: string; icon: string; description: string; gradient: string }
> = {
  country: {
    label: "Nations & Territoires",
    icon: "🌍",
    description: "Les pays du monde, leurs emblèmes et leurs records géographiques.",
    gradient: "from-blue-600 to-indigo-600",
  },
  region: {
    label: "Cantons & Régions",
    icon: "🏛️",
    description: "Cantons suisses, provinces historiques et terroirs d'exception.",
    gradient: "from-emerald-600 to-teal-600",
  },
  language: {
    label: "Langues & Écritures",
    icon: "🗣️",
    description: "Les langues parlées, familles linguistiques et alphabets remarquables.",
    gradient: "from-violet-600 to-purple-600",
  },
  figure: {
    label: "Explorateurs & Figures",
    icon: "🧭",
    description: "Ceux et celles qui ont repoussé les frontières de la cartographie terrestre.",
    gradient: "from-amber-600 to-orange-600",
  },
  wonder: {
    label: "Merveilles Naturelles",
    icon: "🏔️",
    description: "Les sommets, fosses abyssales, aurores et sanctuaires de la planète.",
    gradient: "from-cyan-600 to-emerald-600",
  },
};

export const BOOSTER_PACKS: BoosterPack[] = [
  {
    id: "pack_daily",
    name: "Booster Quotidien",
    category: "daily",
    priceGems: 0,
    cardsCount: 3,
    icon: "🎁",
    badge: "Gratuit / 20h",
    description: "3 cartes aléatoires offertes chaque jour pour agrandir votre collection !",
    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
  },
  {
    id: "pack_starter",
    name: "Pack Explorateur",
    category: "starter",
    priceGems: 100,
    cardsCount: 3,
    icon: "📦",
    badge: "1 Rare garantie",
    description: "3 cartes géographiques avec au minimum 1 carte Rare ou supérieure.",
    gradient: "from-blue-500 to-indigo-600",
    guaranteedRarity: "rare",
  },
  {
    id: "pack_continental",
    name: "Pack Continental",
    category: "continental",
    priceGems: 250,
    cardsCount: 5,
    icon: "🌐",
    badge: "Continent au choix",
    description: "5 cartes ciblées sur le continent de votre choix pour compléter vos pages d'album !",
    gradient: "from-purple-500 to-pink-600",
    guaranteedRarity: "rare",
    requiresContinentChoice: true,
  },
  {
    id: "pack_mythic",
    name: "Pack Légendes & Mythes",
    category: "mythic",
    priceGems: 500,
    cardsCount: 5,
    icon: "👑",
    badge: "1 Épique+ garantie",
    description: "5 cartes d'élite avec 1 carte Épique, Légendaire ou Mythique garantie !",
    gradient: "from-amber-500 via-orange-500 to-rose-600",
    guaranteedRarity: "epic",
  },
];

import defaultCardsCatalog from "../data/defaultCardsCatalog.json";

export const TERRA_CARDS_CATALOG: TerraCard[] = defaultCardsCatalog as TerraCard[];
