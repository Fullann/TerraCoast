export type SrsCardType = "capital" | "flag" | "location";
export type SrsRating = "again" | "good" | "easy";

export interface SrsCard {
  id: string;
  iso3: string;
  type: SrsCardType;
  box: number; // 1 à 5
  nextReviewDate: string; // Format YYYY-MM-DD
  lastReviewedDate?: string;
  streak: number;
  totalReviews: number;
  failures: number;
}

export interface SrsStats {
  totalCards: number;
  dueToday: number;
  masteredCount: number; // Box 5
  boxCounts: Record<number, number>; // 1: n, 2: n...
}

const BOX_INTERVALS_DAYS: Record<number, number> = {
  1: 1,  // Révision le lendemain
  2: 3,  // Dans 3 jours
  3: 7,  // Dans 1 semaine
  4: 14, // Dans 2 semaines
  5: 30, // Dans 1 mois (Maîtrisé)
};

function getStorageKey(userId?: string | null): string {
  const safeId = userId || "guest";
  return `terracoast_srs_deck_${safeId}`;
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

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

export function loadDeck(userId?: string | null): SrsCard[] {
  try {
    const raw = getStoredItem(getStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDeck(cards: SrsCard[], userId?: string | null): void {
  try {
    setStoredItem(getStorageKey(userId), JSON.stringify(cards));
  } catch {
    // Ignore storage issues
  }
}

/**
 * Récupère les cartes dues aujourd'hui ou en retard
 */
export function getDueCards(userId?: string | null): SrsCard[] {
  const deck = loadDeck(userId);
  const today = getTodayString();
  return deck.filter((c) => c.nextReviewDate <= today);
}

/**
 * Ajoute une carte au carnet de révision si elle n'existe pas déjà
 */
export function addCardToSrs(
  iso3: string,
  type: SrsCardType = "capital",
  userId?: string | null
): boolean {
  const normIso = String(iso3 || "").toUpperCase();
  if (!normIso) return false;

  const deck = loadDeck(userId);
  const cardId = `${normIso}_${type}`;

  const exists = deck.some((c) => c.id === cardId);
  if (exists) return false; // Déjà présente

  const newCard: SrsCard = {
    id: cardId,
    iso3: normIso,
    type,
    box: 1,
    nextReviewDate: getTodayString(),
    streak: 0,
    totalReviews: 0,
    failures: 0,
  };

  deck.push(newCard);
  saveDeck(deck, userId);
  return true;
}

/**
 * Ajoute automatiquement les erreurs rencontrées lors d'un quiz
 */
export function addErrorsFromQuizToSrs(
  countryIso3s: string[],
  type: SrsCardType = "capital",
  userId?: string | null
): number {
  if (!Array.isArray(countryIso3s) || countryIso3s.length === 0) return 0;
  let added = 0;
  for (const iso of countryIso3s) {
    if (addCardToSrs(iso, type, userId)) {
      added++;
    }
  }
  return added;
}

/**
 * Évalue une carte lors d'une session de révision (méthode de Leitner)
 */
export function reviewCard(
  cardId: string,
  rating: SrsRating,
  userId?: string | null
): { updatedCard: SrsCard; nextReviewDate: string } | null {
  const deck = loadDeck(userId);
  const index = deck.findIndex((c) => c.id === cardId);
  if (index === -1) return null;

  const card = deck[index];
  const today = getTodayString();

  let nextBox = card.box;
  let nextStreak = card.streak;
  let nextFailures = card.failures;

  if (rating === "again") {
    nextBox = 1; // Retour en boîte 1
    nextStreak = 0;
    nextFailures += 1;
  } else if (rating === "good") {
    nextBox = Math.min(5, card.box + 1);
    nextStreak += 1;
  } else if (rating === "easy") {
    nextBox = Math.min(5, card.box + 2);
    nextStreak += 2;
  }

  const intervalDays = BOX_INTERVALS_DAYS[nextBox] || 1;
  const nextReviewDate = addDaysToDate(today, intervalDays);

  const updatedCard: SrsCard = {
    ...card,
    box: nextBox,
    streak: nextStreak,
    failures: nextFailures,
    totalReviews: card.totalReviews + 1,
    lastReviewedDate: today,
    nextReviewDate,
  };

  deck[index] = updatedCard;
  saveDeck(deck, userId);

  return { updatedCard, nextReviewDate };
}

/**
 * Supprime une carte du carnet
 */
export function removeCardFromSrs(cardId: string, userId?: string | null): boolean {
  const deck = loadDeck(userId);
  const filtered = deck.filter((c) => c.id !== cardId);
  if (filtered.length !== deck.length) {
    saveDeck(filtered, userId);
    return true;
  }
  return false;
}

/**
 * Récupère les statistiques d'apprentissage globales
 */
export function getSrsStats(userId?: string | null): SrsStats {
  const deck = loadDeck(userId);
  const today = getTodayString();

  const boxCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let dueToday = 0;
  let masteredCount = 0;

  for (const c of deck) {
    boxCounts[c.box] = (boxCounts[c.box] || 0) + 1;
    if (c.nextReviewDate <= today) {
      dueToday++;
    }
    if (c.box === 5) {
      masteredCount++;
    }
  }

  return {
    totalCards: deck.length,
    dueToday,
    masteredCount,
    boxCounts,
  };
}

/**
 * Génère des cartes d'initiation si le deck est vide pour permettre de démarrer immédiatement
 */
export function seedStarterDeckIfEmpty(userId?: string | null): void {
  const current = loadDeck(userId);
  if (current.length > 0) return;

  const starterIso3s = ["FRA", "JPN", "BRA", "CAN", "EGY", "CHE", "AUS", "IND"];
  for (const iso of starterIso3s) {
    addCardToSrs(iso, "capital", userId);
  }
}
