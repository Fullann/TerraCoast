import { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Search,
  Gift,
  Globe,
  Star,
  CheckCircle2,
  Lock,
  RotateCcw,
  Layers,
  ArrowUpDown,
  X,
  Compass,
} from "lucide-react";
import {
  BOOSTER_PACKS,
  RARITY_CONFIG,
  CATEGORY_CONFIG,
  type TerraCard,
  type BoosterPack,
  type CardCategory,
  type CardRarity,
  type CardContinent,
} from "../../lib/cardsData";
import {
  getPlayerCardsState,
  getCardsCatalog,
  getCollectionStats,
  canClaimDailyPack,
  CARDS_CATALOG_UPDATED_EVENT,
  syncCardsCatalogFromSupabase,
  type PlayerCardsState,
} from "../../lib/cardsManager";
import {
  cardTranslationAPI,
  CATEGORY_TRANSLATIONS,
  RARITY_TRANSLATIONS,
  CONTINENT_TRANSLATIONS,
} from "../../lib/cardsTranslationService";
import { languageNames } from "../../i18n/translations";
import { useLanguage } from "../../contexts/LanguageContext";
import { getPlayerGamificationState } from "../../lib/gamificationManager";
import { useAuth } from "../../contexts/AuthContext";
import { CollectibleCard } from "./CollectibleCard";
import { BoosterOpeningModal } from "./BoosterOpeningModal";
import { CardDetailModal } from "./CardDetailModal";
import { playSound } from "../../lib/soundManager";

type SortOption = "number-asc" | "number-desc" | "rarity-desc" | "rarity-asc" | "name" | "recent";
type FilterOwnedOption = "all" | "owned" | "missing" | "shiny" | "favorites";

const RARITY_WEIGHT: Record<CardRarity, number> = {
  mythic: 5,
  legendary: 4,
  epic: 3,
  rare: 2,
  common: 1,
};

export function TerraDexPage() {
  const { profile } = useAuth();
  const userId = profile?.id;
  const { language } = useLanguage();

  const [cardsState, setCardsState] = useState<PlayerCardsState>(() =>
    getPlayerCardsState(userId)
  );
  const [gamification, setGamification] = useState(() =>
    getPlayerGamificationState(userId)
  );

  // Filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CardCategory | "all">("all");
  const [selectedRarity, setSelectedRarity] = useState<CardRarity | "all">("all");
  const [selectedContinent, setSelectedContinent] = useState<CardContinent | "all">("all");
  const [filterOwned, setFilterOwned] = useState<FilterOwnedOption>("all");
  const [sortOption, setSortOption] = useState<SortOption>("number-asc");

  // Modals
  const [activeBoosterPack, setActiveBoosterPack] = useState<BoosterPack | null>(null);
  const [selectedDetailCard, setSelectedDetailCard] = useState<TerraCard | null>(null);

  // Compte à rebours booster quotidien
  const [dailyRemainingFormatted, setDailyRemainingFormatted] = useState("");
  const [catalogVersion, setCatalogVersion] = useState(0);

  const refreshState = () => {
    setCardsState(getPlayerCardsState(userId));
    setGamification(getPlayerGamificationState(userId));
    setCatalogVersion((v) => v + 1);
  };

  useEffect(() => {
    refreshState();
    syncCardsCatalogFromSupabase();
    const handleCardsUpdate = () => refreshState();
    const handleGemsUpdate = () => refreshState();
    const handleCatalogUpdate = () => refreshState();

    window.addEventListener("terracoast_cards_updated", handleCardsUpdate);
    window.addEventListener("terracost_gamification_updated", handleGemsUpdate);
    window.addEventListener(CARDS_CATALOG_UPDATED_EVENT, handleCatalogUpdate);
    return () => {
      window.removeEventListener("terracoast_cards_updated", handleCardsUpdate);
      window.removeEventListener("terracost_gamification_updated", handleGemsUpdate);
      window.removeEventListener(CARDS_CATALOG_UPDATED_EVENT, handleCatalogUpdate);
    };
  }, [userId]);

  const stats = useMemo(() => getCollectionStats(userId), [cardsState, userId]);
  const dailyPackStatus = useMemo(() => canClaimDailyPack(userId), [cardsState, userId]);
  const catalog = useMemo(() => getCardsCatalog(), [cardsState, catalogVersion]);

  // Compte à rebours dynamique du booster journalier
  useEffect(() => {
    const updateCountdown = () => {
      const { remainingMs } = canClaimDailyPack(userId);
      if (remainingMs <= 0) {
        setDailyRemainingFormatted("");
        return;
      }
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      setDailyRemainingFormatted(`${hours}h ${String(minutes).padStart(2, "0")}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [userId, cardsState.lastDailyPackClaimedAt]);

  const totalShinyCollected = useMemo(() => {
    return Object.values(cardsState.ownedCards).filter((entry) => Boolean(entry.shiny)).length;
  }, [cardsState.ownedCards]);

  // Vérifie si des filtres sont actifs
  const hasActiveFilters = useMemo(() => {
    return (
      Boolean(searchQuery.trim()) ||
      selectedCategory !== "all" ||
      selectedRarity !== "all" ||
      selectedContinent !== "all" ||
      filterOwned !== "all" ||
      sortOption !== "number-asc"
    );
  }, [searchQuery, selectedCategory, selectedRarity, selectedContinent, filterOwned, sortOption]);

  const handleResetFilters = () => {
    playSound("click");
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedRarity("all");
    setSelectedContinent("all");
    setFilterOwned("all");
    setSortOption("number-asc");
  };

  // Filtrage et tri des cartes
  const filteredCards = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    const list = catalog.filter((card) => {
      const entry = cardsState.ownedCards[card.id];
      const isOwned = Boolean(entry);
      const isShiny = Boolean(entry?.shiny);
      const isFavorite = cardsState.favoriteCardIds?.includes(card.id);

      // Filtre statut
      if (filterOwned === "owned" && !isOwned) return false;
      if (filterOwned === "missing" && isOwned) return false;
      if (filterOwned === "shiny" && !isShiny) return false;
      if (filterOwned === "favorites" && !isFavorite) return false;

      // Filtre catégorie
      if (selectedCategory !== "all" && card.category !== selectedCategory) return false;

      // Filtre rareté
      if (selectedRarity !== "all" && card.rarity !== selectedRarity) return false;

      // Filtre continent
      if (selectedContinent !== "all" && card.continent !== selectedContinent) return false;

      // Recherche texte (nom original, nom traduit, slogan, continent, numéro)
      if (q) {
        const translated = cardTranslationAPI.getTranslatedCard(card, language);
        const matchesOriginalName = card.name.toLowerCase().includes(q);
        const matchesTranslatedName = translated.name.toLowerCase().includes(q);
        const matchesOriginalTagline = card.tagline.toLowerCase().includes(q);
        const matchesTranslatedTagline = translated.tagline.toLowerCase().includes(q);
        const matchesContinent =
          card.continent.toLowerCase().includes(q) ||
          (CONTINENT_TRANSLATIONS[language]?.[card.continent] || "").toLowerCase().includes(q);
        const matchesNumber = String(card.number).includes(q) || `#${card.number}`.includes(q);

        if (
          !matchesOriginalName &&
          !matchesTranslatedName &&
          !matchesOriginalTagline &&
          !matchesTranslatedTagline &&
          !matchesContinent &&
          !matchesNumber
        ) {
          return false;
        }
      }

      return true;
    });

    // Tri des cartes
    list.sort((a, b) => {
      if (sortOption === "number-asc") {
        return a.number - b.number;
      }
      if (sortOption === "number-desc") {
        return b.number - a.number;
      }
      if (sortOption === "rarity-desc") {
        const diff = RARITY_WEIGHT[b.rarity] - RARITY_WEIGHT[a.rarity];
        return diff !== 0 ? diff : a.number - b.number;
      }
      if (sortOption === "rarity-asc") {
        const diff = RARITY_WEIGHT[a.rarity] - RARITY_WEIGHT[b.rarity];
        return diff !== 0 ? diff : a.number - b.number;
      }
      if (sortOption === "name") {
        const nameA = cardTranslationAPI.getTranslatedCard(a, language).name;
        const nameB = cardTranslationAPI.getTranslatedCard(b, language).name;
        return nameA.localeCompare(nameB);
      }
      if (sortOption === "recent") {
        const timeA = cardsState.ownedCards[a.id]?.firstAcquiredAt || 0;
        const timeB = cardsState.ownedCards[b.id]?.firstAcquiredAt || 0;
        return timeB - timeA;
      }
      return 0;
    });

    return list;
  }, [
    catalog,
    searchQuery,
    selectedCategory,
    selectedRarity,
    selectedContinent,
    filterOwned,
    sortOption,
    cardsState.ownedCards,
    cardsState.favoriteCardIds,
    language,
  ]);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 pb-28 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* ── ARRIÈRE-PLAN LUMINEUX COSMIQUE & CONSTELLATIONS ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[560px] bg-gradient-to-b from-indigo-900/30 via-purple-900/15 to-transparent pointer-events-none blur-3xl" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-500/15 rounded-full pointer-events-none blur-3xl animate-pulse" />
      <div className="absolute top-72 -right-32 w-96 h-96 bg-pink-500/15 rounded-full pointer-events-none blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:32px_32px] opacity-15 pointer-events-none" />

      {/* ── 🌟 BANNIÈRE HÉROS PRESTIGE : LE GRAND TERRADEX ── */}
      <div className="relative z-10 border-b border-indigo-900/40 bg-gradient-to-b from-slate-900/90 via-slate-950/80 to-[#0B0F19] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Colonne Gauche : Titre, Slogan & Ressources */}
            <div className="text-center lg:text-left space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-purple-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-black uppercase tracking-widest shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>Album Géographique Officiel</span>
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-[11px] font-bold">
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  <span>{languageNames[language]}</span>
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white flex items-center justify-center lg:justify-start gap-3">
                <span className="bg-gradient-to-r from-amber-200 via-white to-amber-300 bg-clip-text text-transparent drop-shadow-sm">
                  Le TerraDex
                </span>
                <span className="text-3xl sm:text-4xl animate-bounce">🎴</span>
              </h1>

              <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed max-w-xl">
                L'encyclopédie géographique vivante : collectionnez les merveilles, nations, cantons et grandes figures de la planète sous forme de cartes d'art holographiques 3D.
              </p>

              {/* Barre de badges de ressources */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-2">
                <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-sky-500/40 flex items-center gap-2 text-xs font-black text-sky-300 shadow-[0_0_15px_rgba(14,165,233,0.15)]">
                  <span>💎</span>
                  <span>{gamification.gems} TerraGems</span>
                </div>

                <div className="px-3.5 py-1.5 rounded-xl bg-purple-950/80 border border-purple-500/50 flex items-center gap-2 text-xs font-black text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                  <span>🪐</span>
                  <span>{cardsState.stardust} Poussières d'Étoile</span>
                </div>

                <div className="px-3.5 py-1.5 rounded-xl bg-pink-950/80 border border-pink-500/50 flex items-center gap-1.5 text-xs font-black text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.2)]">
                  <Sparkles className="w-3.5 h-3.5 fill-current text-pink-400" />
                  <span>{totalShinyCollected} Holo Shiny</span>
                </div>

                <div className="px-3.5 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/50 flex items-center gap-1.5 text-xs font-black text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <span>{stats.collectorRank.badge}</span>
                  <span>{stats.collectorRank.title}</span>
                </div>
              </div>
            </div>

            {/* Colonne Droite : HUD de Progression & Jauge Pokédex */}
            <div className="w-full lg:w-96 bg-gradient-to-br from-slate-900/95 via-indigo-950/80 to-slate-900/95 backdrop-blur-xl rounded-3xl p-6 border-2 border-indigo-500/30 shadow-[0_15px_35px_rgba(0,0,0,0.5)] flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Complétion de l'Album
                  </span>
                </div>
                <span className="font-mono font-black text-2xl bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                  {stats.percentage}%
                </span>
              </div>

              {/* Jauge lumineuse néon */}
              <div className="w-full h-3.5 rounded-full bg-slate-950/90 border border-slate-700/80 p-0.5 overflow-hidden shadow-inner mb-4">
                <div
                  style={{ width: `${stats.percentage}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 transition-all duration-700 shadow-[0_0_12px_rgba(52,211,153,0.8)]"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300 font-bold pb-3 border-b border-slate-800">
                <span>Cartes Uniques Découvertes :</span>
                <span className="font-mono font-black text-white text-sm bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700">
                  {stats.totalCollected} / {stats.totalCards}
                </span>
              </div>

              {/* Répartition par rareté */}
              <div className="grid grid-cols-5 gap-1.5 pt-3 text-center">
                <div className="p-1.5 rounded-xl bg-pink-950/40 border border-pink-500/30">
                  <span className="block text-[9px] font-black text-pink-400 uppercase">Myth.</span>
                  <span className="font-mono text-[11px] font-black text-white">
                    {stats.byRarity.mythic.collected}/{stats.byRarity.mythic.total}
                  </span>
                </div>
                <div className="p-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30">
                  <span className="block text-[9px] font-black text-amber-400 uppercase">Lég.</span>
                  <span className="font-mono text-[11px] font-black text-white">
                    {stats.byRarity.legendary.collected}/{stats.byRarity.legendary.total}
                  </span>
                </div>
                <div className="p-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30">
                  <span className="block text-[9px] font-black text-purple-400 uppercase">Épiq.</span>
                  <span className="font-mono text-[11px] font-black text-white">
                    {stats.byRarity.epic.collected}/{stats.byRarity.epic.total}
                  </span>
                </div>
                <div className="p-1.5 rounded-xl bg-sky-950/40 border border-sky-500/30">
                  <span className="block text-[9px] font-black text-sky-400 uppercase">Rare</span>
                  <span className="font-mono text-[11px] font-black text-white">
                    {stats.byRarity.rare.collected}/{stats.byRarity.rare.total}
                  </span>
                </div>
                <div className="p-1.5 rounded-xl bg-slate-900 border border-slate-700">
                  <span className="block text-[9px] font-black text-slate-400 uppercase">Com.</span>
                  <span className="font-mono text-[11px] font-black text-white">
                    {stats.byRarity.common.collected}/{stats.byRarity.common.total}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10 relative z-10">
        {/* ── 📦 SECTION 1 : LE COMPTOIR DES BOOSTERS FOIL ── */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 fill-current" />
                <span>Ravitaillement de Cartes</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-0.5">
                <span>Le Comptoir des Boosters</span>
                <span className="text-xs font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                  {stats.totalPacksOpened} ouverts
                </span>
              </h2>
            </div>

            {dailyPackStatus.available ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-400/50 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse">
                <Gift className="w-4 h-4 text-emerald-400 fill-current" />
                <span>Booster Quotidien Gratuit Prêt !</span>
              </span>
            ) : dailyRemainingFormatted ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 text-slate-400 text-xs font-bold border border-slate-800">
                <span>⏳ Prochain booster dans {dailyRemainingFormatted}</span>
              </span>
            ) : null}
          </div>

          {/* Grille des 4 types de boosters façon vitrine de cartes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {BOOSTER_PACKS.map((pack) => {
              const isDaily = pack.category === "daily";
              const canAfford = isDaily
                ? dailyPackStatus.available
                : gamification.gems >= pack.priceGems;

              return (
                <div
                  key={pack.id}
                  className={`group relative rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 overflow-hidden border-2 select-none ${
                    isDaily && dailyPackStatus.available
                      ? "bg-gradient-to-b from-emerald-950/70 via-slate-900/90 to-slate-950 border-emerald-400/70 shadow-[0_0_30px_rgba(16,185,129,0.25)] hover:border-emerald-300 hover:-translate-y-1.5"
                      : pack.category === "mythic"
                      ? "bg-gradient-to-b from-amber-950/60 via-slate-900/90 to-slate-950 border-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.2)] hover:border-amber-300 hover:-translate-y-1.5"
                      : pack.category === "continental"
                      ? "bg-gradient-to-b from-purple-950/60 via-slate-900/90 to-slate-950 border-purple-400/50 shadow-[0_0_25px_rgba(168,85,247,0.2)] hover:border-purple-300 hover:-translate-y-1.5"
                      : "bg-gradient-to-b from-sky-950/60 via-slate-900/90 to-slate-950 border-sky-400/50 shadow-[0_0_25px_rgba(14,165,233,0.2)] hover:border-sky-300 hover:-translate-y-1.5"
                  }`}
                >
                  {/* Dentelé métallique décoratif */}
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-slate-400 via-white to-slate-400 booster-crimp-pattern booster-sawtooth-top opacity-50" />

                  <div>
                    {/* Header badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pack.gradient} p-0.5 shadow-xl flex items-center justify-center relative group-hover:scale-110 transition-transform duration-300`}
                      >
                        <div className="w-full h-full rounded-[14px] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center text-3xl drop-shadow">
                          {pack.icon}
                        </div>
                      </div>

                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-900/90 text-amber-300 border border-amber-500/30 shadow-xs">
                        {pack.badge || `${pack.cardsCount} cartes`}
                      </span>
                    </div>

                    <h3 className="font-black text-white text-base sm:text-lg mb-1 group-hover:text-amber-300 transition-colors">
                      {pack.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed mb-4">
                      {pack.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 mt-auto">
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => {
                        playSound("click");
                        setActiveBoosterPack(pack);
                      }}
                      className={`w-full py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                        isDaily && dailyPackStatus.available
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-emerald-300/60"
                          : isDaily
                          ? "bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed"
                          : canAfford
                          ? "bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.35)] border border-amber-200"
                          : "bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed"
                      }`}
                    >
                      {isDaily ? (
                        dailyPackStatus.available ? (
                          <>
                            <Gift className="w-4 h-4" />
                            <span>Déballer (Gratuit !)</span>
                          </>
                        ) : (
                          <span>Recharge ({dailyRemainingFormatted || "..."})</span>
                        )
                      ) : canAfford ? (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Déballer ({pack.priceGems} 💎)</span>
                        </>
                      ) : (
                        <span>Manque {pack.priceGems - gamification.gems} 💎</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 🔍 SECTION 2 : CONSOLE DE RECHERCHE, FILTRES & TRI ── */}
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800/90 shadow-2xl p-5 sm:p-6 space-y-4 relative">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Champ de recherche haute précision */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par pays, région, langue, explorateur, n°..."
                className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-white text-xs sm:text-sm font-medium focus:bg-slate-950 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all placeholder:text-slate-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sélecteur de statut de possession */}
            <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-2xl border border-slate-800 shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setFilterOwned("all")}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                  filterOwned === "all"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Toutes ({catalog.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterOwned("owned")}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                  filterOwned === "owned"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-slate-400 hover:text-emerald-400"
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Débloquées ({stats.totalCollected})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterOwned("missing")}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                  filterOwned === "missing"
                    ? "bg-rose-600 text-white shadow-md"
                    : "text-slate-400 hover:text-rose-400"
                }`}
              >
                <Lock className="w-3 h-3" />
                <span>Manquantes ({stats.totalCards - stats.totalCollected})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterOwned("shiny")}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                  filterOwned === "shiny"
                    ? "bg-pink-600 text-white shadow-md"
                    : "text-slate-400 hover:text-pink-400"
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Shiny ({totalShinyCollected})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterOwned("favorites")}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                  filterOwned === "favorites"
                    ? "bg-amber-500 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-amber-400"
                }`}
              >
                <Star className="w-3 h-3 fill-current" />
                <span>Favoris ({cardsState.favoriteCardIds?.length || 0})</span>
              </button>
            </div>
          </div>

          {/* Onglets de Thèmes / Catégories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-thin">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`py-2 px-4 rounded-xl font-black whitespace-nowrap transition-all border cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-white text-slate-950 border-white shadow-md"
                  : "bg-slate-950/80 hover:bg-slate-800 text-slate-300 border-slate-800"
              }`}
            >
              Tous les Thèmes ({catalog.length})
            </button>

            {(Object.keys(CATEGORY_CONFIG) as CardCategory[]).map((cat) => {
              const meta = CATEGORY_CONFIG[cat];
              const count = stats.byCategory[cat] || { collected: 0, total: 0 };
              const isSelected = selectedCategory === cat;
              const localizedCat = CATEGORY_TRANSLATIONS[language]?.[cat] || meta.label;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`py-2 px-3.5 rounded-xl font-black whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                      : "bg-slate-950/80 hover:bg-slate-800 text-slate-300 border-slate-800"
                  }`}
                >
                  <span>{meta.icon}</span>
                  <span>{localizedCat}</span>
                  <span className="opacity-75 font-mono text-[11px] bg-black/40 px-1.5 py-0.2 rounded-md">
                    {count.collected}/{count.total}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filtres secondaires : Rareté, Continent & Tri */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
            {/* Filtre Rareté */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Rareté :</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedRarity("all")}
                className={`px-2.5 py-1 rounded-lg font-black text-[11px] transition-all cursor-pointer ${
                  selectedRarity === "all"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Toutes
              </button>
              {(["common", "rare", "epic", "legendary", "mythic"] as CardRarity[]).map((r) => {
                const meta = RARITY_CONFIG[r];
                const isSelected = selectedRarity === r;
                const localizedRarity = RARITY_TRANSLATIONS[language]?.[r] || meta.label;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRarity(r)}
                    className={`px-2.5 py-1 rounded-lg font-black text-[11px] transition-all border cursor-pointer ${
                      isSelected
                        ? `${meta.bgBadge} ring-2 ring-amber-400/80 shadow-md`
                        : "bg-slate-950/80 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {localizedRarity}
                  </button>
                );
              })}
            </div>

            {/* Filtre Continent & Tri */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Sélecteur Continent */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-sky-400" />
                  <span>Région :</span>
                </span>
                <select
                  value={selectedContinent}
                  onChange={(e) => setSelectedContinent(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold outline-none cursor-pointer focus:border-indigo-400"
                >
                  <option value="all">Tous les Continents</option>
                  {(["Europe", "Asie", "Afrique", "Amériques", "Océanie", "Monde"] as CardContinent[]).map(
                    (cont) => (
                      <option key={cont} value={cont}>
                        {CONTINENT_TRANSLATIONS[language]?.[cont] || cont}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Sélecteur de Tri */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tri :</span>
                </span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold outline-none cursor-pointer focus:border-indigo-400"
                >
                  <option value="number-asc">N° Croissant (#001 → #060)</option>
                  <option value="number-desc">N° Décroissant (#060 → #001)</option>
                  <option value="rarity-desc">Rareté (Mythiques en premier)</option>
                  <option value="rarity-asc">Rareté (Communes en premier)</option>
                  <option value="name">Nom alphabétique (A → Z)</option>
                  <option value="recent">Récemment Débloquées</option>
                </select>
              </div>

              {/* Bouton de réinitialisation si actif */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-black transition-all flex items-center gap-1 cursor-pointer border border-amber-500/30"
                  title="Réinitialiser tous les filtres"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Effacer</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── 🎴 SECTION 3 : LA GRANDE GALERIE DES CARTES POKÉDEX ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 px-1">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>
                Affichage de <span className="text-white font-black">{filteredCards.length}</span> carte{filteredCards.length > 1 ? "s" : ""}
              </span>
            </span>

            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>💡 Cliquez sur une carte pour l'examiner en 3D et répondre à son quiz</span>
            </div>
          </div>

          {filteredCards.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 justify-items-center">
              {filteredCards.map((card) => {
                const entry = cardsState.ownedCards[card.id];
                const isUnlocked = Boolean(entry);

                return (
                  <div
                    key={card.id}
                    className="flex flex-col items-center group relative transition-transform hover:-translate-y-1.5 duration-200"
                  >
                    {/* Carte 3D Interactive */}
                    <CollectibleCard
                      card={card}
                      entry={entry}
                      isUnlocked={isUnlocked}
                      size="sm"
                      interactive={true}
                      showFlipButton={false}
                      onClick={() => {
                        playSound("click");
                        setSelectedDetailCard(card);
                      }}
                    />

                    {/* Badge d'indication sous la carte */}
                    <div className="mt-2 flex items-center gap-1.5">
                      {isUnlocked ? (
                        <>
                          {entry?.shiny && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-pink-400 to-sky-400 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-sm animate-pulse">
                              <Sparkles className="w-2.5 h-2.5 fill-current" />
                              Holo
                            </span>
                          )}

                          {entry?.count && entry.count > 1 && (
                            <span className="px-2 py-0.5 rounded-full bg-purple-900/90 text-purple-200 border border-purple-500/50 font-mono font-black text-[9px]">
                              x{entry.count}
                            </span>
                          )}

                          {cardsState.favoriteCardIds?.includes(card.id) && (
                            <span className="p-0.5 text-amber-400 drop-shadow">
                              ★
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Non découverte</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* État vide si aucun résultat */
            <div className="bg-slate-900/80 rounded-3xl p-12 text-center border-2 border-dashed border-slate-800 max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center text-3xl mx-auto shadow-inner">
                <Compass className="w-8 h-8 text-amber-400 animate-spin-slow" />
              </div>
              <h3 className="font-black text-white text-lg">
                Aucune carte trouvée
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Aucune carte ne correspond aux filtres ou à la recherche spécifiée. Réinitialisez vos filtres pour explorer l'ensemble des 60 cartes du TerraDex.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── MODALS CONNECTÉES ── */}
      {activeBoosterPack && (
        <BoosterOpeningModal
          isOpen={Boolean(activeBoosterPack)}
          onClose={() => setActiveBoosterPack(null)}
          pack={activeBoosterPack}
          userId={userId}
          onPackOpened={refreshState}
        />
      )}

      {selectedDetailCard && (
        <CardDetailModal
          card={selectedDetailCard}
          entry={cardsState.ownedCards[selectedDetailCard.id]}
          isUnlocked={Boolean(cardsState.ownedCards[selectedDetailCard.id])}
          userId={userId}
          onClose={() => setSelectedDetailCard(null)}
          onStateChanged={refreshState}
        />
      )}
    </div>
  );
}
