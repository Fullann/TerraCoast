/**
 * 🎴 TerraDex Cards Manager
 * Gère l'inventaire des cartes à collectionner, l'ouverture des boosters de gemmes,
 * la forge des doublons en poussière d'étoile 🪐 et les quiz flash des cartes.
 */

import {
  TERRA_CARDS_CATALOG,
  BOOSTER_PACKS,
  RARITY_CONFIG,
  type TerraCard,
  type CardRarity,
  type CardCategory,
  type CardContinent,
} from "./cardsData";
import {
  getPlayerGamificationState,
  savePlayerGamificationState,
} from "./gamificationManager";
import { supabase } from "./supabase";

export interface PlayerCardEntry {
  count: number;
  firstAcquiredAt: number;
  shiny?: boolean;
  answeredTrivia?: boolean;
}

export interface PlayerCardsState {
  ownedCards: Record<string, PlayerCardEntry>;
  stardust: number;
  totalPacksOpened: number;
  lastDailyPackClaimedAt: number | null;
  favoriteCardIds: string[];
}

export interface DrawnCard {
  card: TerraCard;
  isNew: boolean;
  isShiny: boolean;
  stardustEarned: number;
}

const STORAGE_PREFIX = "terracoast_cards_";
const DAILY_PACK_COOLDOWN_MS = 20 * 60 * 60 * 1000; // 20 heures
const CUSTOM_CARDS_KEY = "terracoast_custom_cards_catalog_v1";
const CARDS_OVERRIDES_KEY = "terracoast_cards_overrides_v1";
const DELETED_CARDS_KEY = "terracoast_deleted_cards_v1";
const memoryCardsStore = new Map<string, string>();

export const CARDS_CATALOG_UPDATED_EVENT = "terracoast_cards_catalog_updated";

function notifyCatalogUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CARDS_CATALOG_UPDATED_EVENT));
  }
}

function getStorageKey(userId?: string): string {
  return `${STORAGE_PREFIX}${userId || "guest"}`;
}

function getStoredString(key: string): string | null {
  if (typeof localStorage !== "undefined") {
    try {
      return localStorage.getItem(key);
    } catch {
      // fallback
    }
  }
  return memoryCardsStore.get(key) || null;
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
  memoryCardsStore.set(key, val);
}

export function resetCardsState(userId?: string): void {
  const key = getStorageKey(userId);
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(key);
    } catch {
      // fallback
    }
  }
  memoryCardsStore.delete(key);
}

export function getDefaultCardsState(): PlayerCardsState {
  return {
    ownedCards: {},
    stardust: 50, // Bonus de départ
    totalPacksOpened: 0,
    lastDailyPackClaimedAt: null,
    favoriteCardIds: [],
  };
}

/**
 * Récupère les cartes personnalisées créées par l'administrateur
 */
export function getCustomCards(): TerraCard[] {
  const raw = getStoredString(CUSTOM_CARDS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Récupère les surcharges (modifications de rareté, texte, etc.) appliquées aux cartes
 */
export function getCardsOverrides(): Record<string, Partial<TerraCard>> {
  const raw = getStoredString(CARDS_OVERRIDES_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Récupère les IDs de cartes supprimées/masquées
 */
export function getDeletedCardIds(): string[] {
  const raw = getStoredString(DELETED_CARDS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export const REMOTE_CARDS_CATALOG_KEY = "terracoast_remote_cards_catalog_v1";

/**
 * Récupère le catalogue distant mis en cache localement
 */
export function getRemoteCardsCatalog(): TerraCard[] | null {
  const raw = getStoredString(REMOTE_CARDS_CATALOG_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as TerraCard[]) : null;
  } catch {
    return null;
  }
}

/**
 * Définit ou vide le catalogue distant mis en cache localement
 */
export function setRemoteCardsCatalog(cards: TerraCard[] | null): void {
  if (cards && cards.length > 0) {
    setStoredString(REMOTE_CARDS_CATALOG_KEY, JSON.stringify(cards));
  } else {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem(REMOTE_CARDS_CATALOG_KEY);
      } catch {
        // fallback
      }
    }
    memoryCardsStore.delete(REMOTE_CARDS_CATALOG_KEY);
  }
  notifyCatalogUpdated();
}

/**
 * Synchronise le catalogue de cartes depuis la base Supabase (table terra_cards).
 * Met à jour le cache local et notifie l'application en cas de nouvelles cartes ou modifications.
 */
export async function syncCardsCatalogFromSupabase(): Promise<{ success: boolean; count: number }> {
  try {
    const { data, error } = await supabase
      .from("terra_cards")
      .select("*")
      .eq("is_active", true)
      .order("number", { ascending: true });

    if (error || !data || data.length === 0) {
      return { success: false, count: 0 };
    }

    const remoteCards: TerraCard[] = (data as any[]).map((row: any) => ({
      id: row.id,
      number: row.number,
      name: row.name,
      category: row.category as CardCategory,
      rarity: row.rarity as CardRarity,
      continent: row.continent as CardContinent,
      flag: row.flag || undefined,
      icon: row.icon,
      tagline: row.tagline,
      description: row.description,
      stats: (row.stats as Record<string, string | number>) || {},
      funFact: row.fun_fact,
      quote: row.quote || undefined,
      colorScheme: row.color_scheme,
      trivia: row.trivia,
    }));

    setStoredString(REMOTE_CARDS_CATALOG_KEY, JSON.stringify(remoteCards));
    notifyCatalogUpdated();
    return { success: true, count: remoteCards.length };
  } catch (err) {
    console.warn("Synchronisation Supabase des cartes ignorée/échouée :", err);
    return { success: false, count: 0 };
  }
}

/**
 * Récupère le catalogue complet et actif des cartes TerraDex
 * (Cartes distantes ou officielles + Cartes créées par l'admin - Cartes supprimées + Raretés personnalisées)
 */
export function getCardsCatalog(): TerraCard[] {
  const remoteCards = getRemoteCardsCatalog();
  const baseCatalog = remoteCards && remoteCards.length > 0 ? remoteCards : TERRA_CARDS_CATALOG;
  const customCards = getCustomCards();
  const overrides = getCardsOverrides();
  const deletedIds = new Set(getDeletedCardIds());

  // 1. Cartes de base (distantes ou intégrées) avec surcharges
  const baseProcessed = baseCatalog
    .filter((c) => !deletedIds.has(c.id))
    .map((c) => {
      const override = overrides[c.id];
      return override ? { ...c, ...override } : c;
    });

  // 2. Cartes personnalisées locales non encore présentes dans le catalogue distant
  const baseIds = new Set(baseProcessed.map((c) => c.id));
  const customProcessed = customCards
    .filter((c) => !deletedIds.has(c.id) && !baseIds.has(c.id))
    .map((c) => {
      const override = overrides[c.id];
      return override ? { ...c, ...override } : c;
    });

  return [...baseProcessed, ...customProcessed].sort((a, b) => a.number - b.number);
}

/**
 * Recherche une carte par son identifiant unique dans le catalogue actif
 */
export function getCardById(id: string): TerraCard | undefined {
  return getCardsCatalog().find((c) => c.id === id);
}

/**
 * Sauvegarde ou met à jour une carte (pour l'admin) avec synchronisation Supabase en arrière-plan
 */
export function adminSaveCard(card: TerraCard): { success: boolean; message: string } {
  const baseCatalog = getRemoteCardsCatalog() || TERRA_CARDS_CATALOG;
  const isBuiltIn = baseCatalog.some((c) => c.id === card.id);
  const overrides = getCardsOverrides();
  const customCards = getCustomCards();

  if (isBuiltIn) {
    overrides[card.id] = card;
    setStoredString(CARDS_OVERRIDES_KEY, JSON.stringify(overrides));
  } else {
    const existingIdx = customCards.findIndex((c) => c.id === card.id);
    if (existingIdx >= 0) {
      customCards[existingIdx] = card;
    } else {
      customCards.push(card);
    }
    setStoredString(CUSTOM_CARDS_KEY, JSON.stringify(customCards));
  }

  notifyCatalogUpdated();

  // Synchronisation distante Supabase en tâche de fond (si connecté & droits admin)
  try {
    supabase
      .from("terra_cards")
      .upsert({
        id: card.id,
        number: card.number,
        name: card.name,
        category: card.category,
        rarity: card.rarity,
        continent: card.continent,
        flag: card.flag || null,
        icon: card.icon,
        tagline: card.tagline,
        description: card.description,
        stats: card.stats,
        fun_fact: card.funFact,
        quote: card.quote || null,
        color_scheme: card.colorScheme,
        trivia: card.trivia,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) {
          console.warn("Échec de la sauvegarde distante Supabase :", error.message);
        }
      })
      .catch(() => {});
  } catch {
    // Mode hors-ligne / fallback local
  }

  return { success: true, message: `Carte « ${card.name} » enregistrée avec succès.` };
}

/**
 * Modifie la rareté d'une carte spécifique en 1 clic
 */
export function adminUpdateCardRarity(cardId: string, newRarity: CardRarity): { success: boolean; message: string } {
  const customCards = getCustomCards();
  const customCard = customCards.find((c) => c.id === cardId);

  if (customCard) {
    customCard.rarity = newRarity;
    setStoredString(CUSTOM_CARDS_KEY, JSON.stringify(customCards));
    notifyCatalogUpdated();
    return { success: true, message: `Rareté de « ${customCard.name} » passée à ${newRarity}.` };
  }

  const baseCatalog = getRemoteCardsCatalog() || TERRA_CARDS_CATALOG;
  const baseCard = baseCatalog.find((c) => c.id === cardId);
  if (!baseCard) {
    return { success: false, message: "Carte introuvable." };
  }

  const overrides = getCardsOverrides();
  overrides[cardId] = { ...(overrides[cardId] || {}), rarity: newRarity };
  setStoredString(CARDS_OVERRIDES_KEY, JSON.stringify(overrides));
  notifyCatalogUpdated();
  return { success: true, message: `Rareté de « ${baseCard.name} » passée à ${newRarity}.` };
}

/**
 * Supprime ou masque une carte du catalogue
 */
export function adminDeleteCard(cardId: string): { success: boolean; message: string } {
  const customCards = getCustomCards();
  const customIdx = customCards.findIndex((c) => c.id === cardId);

  if (customIdx >= 0) {
    const deletedName = customCards[customIdx].name;
    customCards.splice(customIdx, 1);
    setStoredString(CUSTOM_CARDS_KEY, JSON.stringify(customCards));
    notifyCatalogUpdated();

    try {
      supabase
        .from("terra_cards")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", cardId)
        .then(() => {})
        .catch(() => {});
    } catch {
      // Offline fallback
    }

    return { success: true, message: `Carte personnalisée « ${deletedName} » supprimée.` };
  }

  const baseCatalog = getRemoteCardsCatalog() || TERRA_CARDS_CATALOG;
  const baseCard = baseCatalog.find((c) => c.id === cardId);
  if (!baseCard) {
    return { success: false, message: "Carte introuvable." };
  }

  const deletedIds = getDeletedCardIds();
  if (!deletedIds.includes(cardId)) {
    deletedIds.push(cardId);
    setStoredString(DELETED_CARDS_KEY, JSON.stringify(deletedIds));
    notifyCatalogUpdated();

    try {
      supabase
        .from("terra_cards")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", cardId)
        .then(() => {})
        .catch(() => {});
    } catch {
      // Offline fallback
    }
  }
  return { success: true, message: `Carte « ${baseCard.name} » masquée du catalogue.` };
}

/**
 * Restaure une carte masquée
 */
export function adminRestoreCard(cardId: string): { success: boolean; message: string } {
  const deletedIds = getDeletedCardIds().filter((id) => id !== cardId);
  setStoredString(DELETED_CARDS_KEY, JSON.stringify(deletedIds));
  notifyCatalogUpdated();
  return { success: true, message: "Carte restaurée avec succès." };
}

/**
 * Réinitialise le catalogue entier aux 60 cartes initiales
 */
export function adminResetCardsCatalog(): { success: boolean; message: string } {
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(CUSTOM_CARDS_KEY);
      localStorage.removeItem(CARDS_OVERRIDES_KEY);
      localStorage.removeItem(DELETED_CARDS_KEY);
    } catch {}
  }
  memoryCardsStore.delete(CUSTOM_CARDS_KEY);
  memoryCardsStore.delete(CARDS_OVERRIDES_KEY);
  memoryCardsStore.delete(DELETED_CARDS_KEY);
  notifyCatalogUpdated();
  return { success: true, message: "Catalogue restauré aux 60 cartes d'origine." };
}

/**
 * Exporte l'intégralité du catalogue actuel au format JSON
 */
export function adminExportCardsCatalog(): string {
  const catalog = getCardsCatalog();
  return JSON.stringify(catalog, null, 2);
}

/**
 * Importe un catalogue de cartes depuis une chaîne JSON
 */
export function adminImportCardsCatalog(jsonString: string): { success: boolean; count: number; message: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!Array.isArray(parsed)) {
      return { success: false, count: 0, message: "Format JSON invalide : un tableau de cartes est requis." };
    }

    const customCards: TerraCard[] = [];
    const overrides: Record<string, Partial<TerraCard>> = {};
    const builtInIds = new Set(TERRA_CARDS_CATALOG.map((c) => c.id));

    parsed.forEach((c) => {
      if (!c.id || !c.name || !c.category || !c.rarity) return;
      if (builtInIds.has(c.id)) {
        overrides[c.id] = c;
      } else {
        customCards.push(c);
      }
    });

    setStoredString(CUSTOM_CARDS_KEY, JSON.stringify(customCards));
    setStoredString(CARDS_OVERRIDES_KEY, JSON.stringify(overrides));
    notifyCatalogUpdated();

    return {
      success: true,
      count: parsed.length,
      message: `${parsed.length} cartes importées avec succès dans le catalogue.`,
    };
  } catch (err: any) {
    return { success: false, count: 0, message: `Erreur lors de l'import : ${err?.message || "JSON invalide"}` };
  }
}

/**
 * Récupère l'état de la collection d'un joueur
 */
export function getPlayerCardsState(userId?: string): PlayerCardsState {
  const key = getStorageKey(userId);
  try {
    const raw = getStoredString(key);
    if (!raw) {
      // Si connecté et aucune donnée trouvée, tenter de fusionner avec guest
      if (userId) {
        const guestRaw = getStoredString(getStorageKey());
        if (guestRaw) {
          const guestState = JSON.parse(guestRaw);
          savePlayerCardsState(userId, guestState);
          return guestState;
        }
      }
      return getDefaultCardsState();
    }
    const parsed = JSON.parse(raw);
    return {
      ownedCards: parsed.ownedCards || {},
      stardust: typeof parsed.stardust === "number" ? parsed.stardust : 50,
      totalPacksOpened: parsed.totalPacksOpened || 0,
      lastDailyPackClaimedAt: parsed.lastDailyPackClaimedAt || null,
      favoriteCardIds: Array.isArray(parsed.favoriteCardIds) ? parsed.favoriteCardIds : [],
    };
  } catch (e) {
    console.error("Error reading cards state:", e);
    return getDefaultCardsState();
  }
}

let syncTimeout: any = null;

/**
 * Synchronise l'état des cartes avec le compte cloud Supabase
 */
export async function syncCardsToCloud(userId: string, state: PlayerCardsState): Promise<void> {
  if (!userId || userId === "guest") return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === userId) {
      await supabase.auth.updateUser({
        data: {
          terracoast_cards_state: state,
        },
      });
    }
  } catch {
    // Synchronisation cloud non-bloquante
  }
}

/**
 * Hydrate et fusionne les cartes depuis le cloud Supabase vers le local
 */
export async function hydrateCardsFromCloud(userId: string): Promise<PlayerCardsState | null> {
  if (!userId || userId === "guest") return null;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === userId && user.user_metadata?.terracoast_cards_state) {
      const cloudState = user.user_metadata.terracoast_cards_state as PlayerCardsState;
      const localState = getPlayerCardsState(userId);

      // Fusion intelligente des cartes
      const mergedOwned = { ...(localState.ownedCards || {}) };
      Object.entries(cloudState.ownedCards || {}).forEach(([cardId, entry]) => {
        if (!mergedOwned[cardId] || entry.count > mergedOwned[cardId].count) {
          mergedOwned[cardId] = entry;
        } else if (entry.shiny && !mergedOwned[cardId].shiny) {
          mergedOwned[cardId].shiny = true;
        }
      });

      const mergedState: PlayerCardsState = {
        ownedCards: mergedOwned,
        stardust: Math.max(localState.stardust || 0, cloudState.stardust || 0),
        totalPacksOpened: Math.max(localState.totalPacksOpened || 0, cloudState.totalPacksOpened || 0),
        lastDailyPackClaimedAt: localState.lastDailyPackClaimedAt || cloudState.lastDailyPackClaimedAt,
        favoriteCardIds:
          localState.favoriteCardIds && localState.favoriteCardIds.length > 0
            ? localState.favoriteCardIds
            : cloudState.favoriteCardIds || [],
      };

      savePlayerCardsState(userId, mergedState, false);
      return mergedState;
    }
  } catch {
    // Mode dégradé hors ligne
  }
  return null;
}

/**
 * Sauvegarde l'état de la collection et émet un événement réactif (avec sync cloud optionnelle)
 */
export function savePlayerCardsState(
  userId: string | undefined,
  state: PlayerCardsState,
  syncCloud: boolean = true
): void {
  const key = getStorageKey(userId);
  try {
    setStoredString(key, JSON.stringify(state));
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("terracoast_cards_updated", { detail: { userId, state } })
      );
    }
    if (syncCloud && userId && userId !== "guest") {
      if (syncTimeout) clearTimeout(syncTimeout);
      syncTimeout = setTimeout(() => {
        syncCardsToCloud(userId, state);
      }, 1500);
    }
  } catch (e) {
    console.error("Error saving cards state:", e);
  }
}

/**
 * Vérifie si le booster quotidien gratuit est disponible
 */
export function canClaimDailyPack(userId?: string): {
  available: boolean;
  remainingMs: number;
} {
  const state = getPlayerCardsState(userId);
  if (!state.lastDailyPackClaimedAt) {
    return { available: true, remainingMs: 0 };
  }
  const elapsed = Date.now() - state.lastDailyPackClaimedAt;
  const remaining = Math.max(0, DAILY_PACK_COOLDOWN_MS - elapsed);
  return {
    available: remaining === 0,
    remainingMs: remaining,
  };
}

/**
 * Tire une rareté selon les probabilités pondérées
 */
function rollRarity(guaranteedRarity?: CardRarity): CardRarity {
  const rarities: CardRarity[] = ["mythic", "legendary", "epic", "rare", "common"];
  if (guaranteedRarity) {
    const minIndex = rarities.indexOf(guaranteedRarity);
    const eligibleRarities = rarities.slice(0, minIndex + 1);
    const rand = Math.random();
    if (guaranteedRarity === "epic") {
      if (rand < 0.05) return "mythic";
      if (rand < 0.25) return "legendary";
      return "epic";
    }
    if (guaranteedRarity === "rare") {
      if (rand < 0.02) return "mythic";
      if (rand < 0.10) return "legendary";
      if (rand < 0.35) return "epic";
      return "rare";
    }
    return eligibleRarities[Math.floor(Math.random() * eligibleRarities.length)];
  }

  const rand = Math.random();
  if (rand < 0.006) return "mythic"; // 0.6%
  if (rand < 0.045) return "legendary"; // 3.9%
  if (rand < 0.16) return "epic"; // 11.5%
  if (rand < 0.42) return "rare"; // 26%
  return "common"; // 58%
}

/**
 * Sélectionne une carte aléatoire du catalogue correspondant aux critères
 */
function pickCard(rarity: CardRarity, continent?: CardContinent): TerraCard {
  const catalog = getCardsCatalog();
  let candidates = catalog.filter((c) => c.rarity === rarity);
  if (continent && continent !== "Monde") {
    const continentCandidates = candidates.filter(
      (c) => c.continent === continent || c.continent === "Monde"
    );
    if (continentCandidates.length > 0) {
      candidates = continentCandidates;
    }
  }

  // Fallback si aucune carte trouvée pour cette rareté/continent précis
  if (candidates.length === 0) {
    candidates = catalog.filter((c) => c.rarity === rarity);
  }
  if (candidates.length === 0) {
    candidates = catalog;
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Ouvre un booster de cartes
 */
export function openBoosterPack(
  userId: string | undefined,
  packId: string,
  targetContinent?: CardContinent
): {
  success: boolean;
  message: string;
  cards: DrawnCard[];
  totalStardustEarned: number;
  state: PlayerCardsState;
} {
  const pack = BOOSTER_PACKS.find((p) => p.id === packId);
  const cardsState = getPlayerCardsState(userId);
  const gamificationState = getPlayerGamificationState(userId);

  if (!pack) {
    return {
      success: false,
      message: "Booster introuvable.",
      cards: [],
      totalStardustEarned: 0,
      state: cardsState,
    };
  }

  // Vérification pack quotidien
  if (pack.category === "daily") {
    const dailyCheck = canClaimDailyPack(userId);
    if (!dailyCheck.available) {
      const hours = Math.ceil(dailyCheck.remainingMs / (1000 * 60 * 60));
      return {
        success: false,
        message: `Booster quotidien déjà réclamé ! Revenez dans ${hours}h.`,
        cards: [],
        totalStardustEarned: 0,
        state: cardsState,
      };
    }
    cardsState.lastDailyPackClaimedAt = Date.now();
  } else {
    // Vérification des TerraGems
    if (gamificationState.gems < pack.priceGems) {
      return {
        success: false,
        message: `TerraGems insuffisantes ! Il vous manque ${pack.priceGems - gamificationState.gems} 💎.`,
        cards: [],
        totalStardustEarned: 0,
        state: cardsState,
      };
    }
    // Déduire les gemmes
    gamificationState.gems -= pack.priceGems;
    savePlayerGamificationState(userId, gamificationState);
  }

  const drawnCards: DrawnCard[] = [];
  let totalStardust = 0;
  const pickedCardIds = new Set<string>();

  for (let i = 0; i < pack.cardsCount; i++) {
    // Si c'est la dernière carte du pack et qu'une rareté minimale est garantie
    const isGuaranteedSlot = i === pack.cardsCount - 1 && pack.guaranteedRarity;
    const rarity = isGuaranteedSlot
      ? rollRarity(pack.guaranteedRarity)
      : rollRarity();

    let card = pickCard(rarity, targetContinent);

    // Éviter les doublons exacts DANS LE MÊME PACK si possible
    let attempts = 0;
    while (pickedCardIds.has(card.id) && attempts < 5) {
      card = pickCard(rarity, targetContinent);
      attempts++;
    }
    pickedCardIds.add(card.id);

    // 2% de chance d'obtenir une carte SHINY (holographique dorée/prismatique)
    const isShiny = Math.random() < 0.02;

    const existing = cardsState.ownedCards[card.id];
    let stardustEarned = 0;
    const isNew = !existing;

    if (!existing) {
      // Nouvelle carte !
      cardsState.ownedCards[card.id] = {
        count: 1,
        firstAcquiredAt: Date.now(),
        shiny: isShiny,
      };
    } else {
      // Doublon : conversion en Poussière d'Étoile 🪐
      existing.count += 1;
      if (isShiny && !existing.shiny) {
        existing.shiny = true;
      }
      const baseDust = RARITY_CONFIG[card.rarity].dustValue;
      stardustEarned = isShiny ? baseDust * 2 : baseDust;
      totalStardust += stardustEarned;
    }

    drawnCards.push({
      card,
      isNew,
      isShiny,
      stardustEarned,
    });
  }

  cardsState.stardust += totalStardust;
  cardsState.totalPacksOpened += 1;
  savePlayerCardsState(userId, cardsState);

  return {
    success: true,
    message: `${pack.name} ouvert avec succès !`,
    cards: drawnCards,
    totalStardustEarned: totalStardust,
    state: cardsState,
  };
}

/**
 * Forge (fabrique) une carte manquante en dépensant de la poussière d'étoile 🪐
 */
export function craftCardWithStardust(
  userId: string | undefined,
  cardId: string
): {
  success: boolean;
  message: string;
  state: PlayerCardsState;
} {
  const card = getCardById(cardId);
  const state = getPlayerCardsState(userId);

  if (!card) {
    return { success: false, message: "Carte introuvable.", state };
  }

  const cost = RARITY_CONFIG[card.rarity].craftCost;
  if (state.stardust < cost) {
    return {
      success: false,
      message: `Poussières d'Étoile insuffisantes ! Il vous manque ${cost - state.stardust} 🪐.`,
      state,
    };
  }

  state.stardust -= cost;
  if (!state.ownedCards[card.id]) {
    state.ownedCards[card.id] = {
      count: 1,
      firstAcquiredAt: Date.now(),
      shiny: false,
    };
  } else {
    state.ownedCards[card.id].count += 1;
  }

  savePlayerCardsState(userId, state);
  return {
    success: true,
    message: `Carte « ${card.name} » forgée avec succès dans votre TerraDex ! ✨`,
    state,
  };
}

/**
 * Répond au mini-quiz d'une carte pour remporter +5 TerraGems bonus (une seule fois par carte)
 */
export function answerCardTrivia(
  userId: string | undefined,
  cardId: string,
  answerIndex: number
): {
  correct: boolean;
  rewardGems: number;
  explanation: string;
  message: string;
} {
  const card = getCardById(cardId);
  const cardsState = getPlayerCardsState(userId);
  const cardEntry = cardsState.ownedCards[cardId];

  if (!card) {
    return {
      correct: false,
      rewardGems: 0,
      explanation: "",
      message: "Carte introuvable.",
    };
  }

  const isCorrect = answerIndex === card.trivia.correctIndex;

  if (!isCorrect) {
    return {
      correct: false,
      rewardGems: 0,
      explanation: card.trivia.explanation,
      message: "Mauvaise réponse ! Réessayez pour comprendre la géographie de cette carte.",
    };
  }

  // Si c'est la première fois qu'on réussit le quiz de cette carte
  if (cardEntry && !cardEntry.answeredTrivia) {
    cardEntry.answeredTrivia = true;
    savePlayerCardsState(userId, cardsState);

    // Créditer 5 gemmes
    const gamification = getPlayerGamificationState(userId);
    gamification.gems += 5;
    savePlayerGamificationState(userId, gamification);

    return {
      correct: true,
      rewardGems: 5,
      explanation: card.trivia.explanation,
      message: "Excellente réponse ! +5 TerraGems 💎 ajoutées à votre trésor !",
    };
  }

  return {
    correct: true,
    rewardGems: 0,
    explanation: card.trivia.explanation,
    message: "Bonne réponse ! (Récompense en gemmes déjà obtenue pour cette carte).",
  };
}

/**
 * Définit les cartes favorites affichées en vitrine sur le profil (max 3)
 */
export function setFavoriteCards(
  userId: string | undefined,
  cardIds: string[]
): PlayerCardsState {
  const state = getPlayerCardsState(userId);
  state.favoriteCardIds = cardIds.slice(0, 3);
  savePlayerCardsState(userId, state);
  return state;
}

/**
 * Calcule les statistiques globales de la collection TerraDex
 */
export function getCollectionStats(userId?: string): {
  totalCollected: number;
  totalCards: number;
  percentage: number;
  totalPacksOpened: number;
  stardust: number;
  byCategory: Record<CardCategory, { collected: number; total: number }>;
  byRarity: Record<CardRarity, { collected: number; total: number }>;
  collectorRank: { title: string; badge: string; minPercentage: number };
} {
  const state = getPlayerCardsState(userId);
  const catalog = getCardsCatalog();
  const totalCards = catalog.length;
  const ownedIds = new Set(Object.keys(state.ownedCards));
  const totalCollected = ownedIds.size;
  const percentage = Math.round((totalCollected / (totalCards || 1)) * 100);

  const byCategory: Record<CardCategory, { collected: number; total: number }> = {
    country: { collected: 0, total: 0 },
    region: { collected: 0, total: 0 },
    language: { collected: 0, total: 0 },
    figure: { collected: 0, total: 0 },
    wonder: { collected: 0, total: 0 },
  };

  const byRarity: Record<CardRarity, { collected: number; total: number }> = {
    common: { collected: 0, total: 0 },
    rare: { collected: 0, total: 0 },
    epic: { collected: 0, total: 0 },
    legendary: { collected: 0, total: 0 },
    mythic: { collected: 0, total: 0 },
  };

  catalog.forEach((c) => {
    byCategory[c.category].total += 1;
    byRarity[c.rarity].total += 1;
    if (ownedIds.has(c.id)) {
      byCategory[c.category].collected += 1;
      byRarity[c.rarity].collected += 1;
    }
  });

  // Titres de collectionneur
  let collectorRank = {
    title: "Apprenti Explorateur",
    badge: "🌱",
    minPercentage: 0,
  };
  if (percentage >= 100) {
    collectorRank = { title: "Maître Suprême du TerraDex", badge: "👑", minPercentage: 100 };
  } else if (percentage >= 80) {
    collectorRank = { title: "Grand Conservateur Mondial", badge: "🏛️", minPercentage: 80 };
  } else if (percentage >= 50) {
    collectorRank = { title: "Cartographe Expert", badge: "🗺️", minPercentage: 50 };
  } else if (percentage >= 25) {
    collectorRank = { title: "Voyageur Passionné", badge: "🧭", minPercentage: 25 };
  } else if (percentage >= 10) {
    collectorRank = { title: "Chercheur de Trésors", badge: "🔍", minPercentage: 10 };
  }

  return {
    totalCollected,
    totalCards,
    percentage,
    totalPacksOpened: state.totalPacksOpened,
    stardust: state.stardust,
    byCategory,
    byRarity,
    collectorRank,
  };
}
