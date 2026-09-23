import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Compass,
  Map as MapIcon,
  LayoutGrid,
  Search,
  Lock,
  Sparkles,
  ArrowRight,
  Filter,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  getConquestStats,
  getAllConquestCards,
  type ConquestCard,
} from "../../lib/conquestManager";
import { ConquestWorldMap } from "./ConquestWorldMap";
import { ConquestCardModal } from "./ConquestCardModal";

type ActiveTab = "map" | "album";

export function ConquestPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();

  const [activeTab, setActiveTab] = useState<ActiveTab>("map");
  const [selectedCard, setSelectedCard] = useState<ConquestCard | null>(null);
  const [selectedContinent, setSelectedContinent] = useState<string>("all");
  const [selectedRarity, setSelectedRarity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUnlockedOnly, setFilterUnlockedOnly] = useState(false);

  const stats = useMemo(() => {
    return getConquestStats(user?.id, language);
  }, [user?.id, language]);

  const allCards = useMemo(() => {
    return getAllConquestCards(user?.id, language);
  }, [user?.id, language]);

  const filteredCards = useMemo(() => {
    return allCards.filter((card) => {
      if (filterUnlockedOnly && !card.isConquered) return false;
      if (selectedContinent !== "all" && card.continent !== selectedContinent) {
        return false;
      }
      if (selectedRarity !== "all" && card.rarity !== selectedRarity) {
        return false;
      }
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      return (
        card.name.toLowerCase().includes(q) ||
        card.capital.toLowerCase().includes(q) ||
        card.iso3.toLowerCase().includes(q)
      );
    });
  }, [
    allCards,
    filterUnlockedOnly,
    selectedContinent,
    selectedRarity,
    searchQuery,
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-cyan-950 border-b border-emerald-900/50 py-8 px-4 sm:px-6 lg:px-8 shadow-2xl relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-wider mb-3">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Le Pokédex Géographique Mondial</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Carte de Conquête & Brouillard de Guerre 🗺️
            </h1>
            <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Dissipez le brouillard planétaire en maîtrisant des quiz (≥ 80% de précision). Chaque pays conquis s'illumine et débloque sa carte holographique de collection !
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/20 shadow-xl">
            <div className="text-center px-3 border-r border-slate-800">
              <p className="text-2xl sm:text-3xl font-black text-emerald-400">
                {stats.conquestPercentage}%
              </p>
              <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                Monde Conquis
              </p>
            </div>

            <div className="text-center px-3 border-r border-slate-800">
              <p className="text-2xl sm:text-3xl font-black text-white">
                {stats.conqueredCount}/{stats.totalCountries}
              </p>
              <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                Territoires
              </p>
            </div>

            <div className="flex items-center gap-1.5 pl-2">
              <div className="text-center px-2">
                <span className="text-xs">⭐</span>
                <p className="text-sm font-bold text-amber-300">
                  {stats.legendaryCount}
                </p>
                <p className="text-[9px] text-slate-500 uppercase">Légende</p>
              </div>
              <div className="text-center px-2">
                <span className="text-xs">💎</span>
                <p className="text-sm font-bold text-purple-300">
                  {stats.epicCount}
                </p>
                <p className="text-[9px] text-slate-500 uppercase">Épique</p>
              </div>
              <div className="text-center px-2">
                <span className="text-xs">🔷</span>
                <p className="text-sm font-bold text-cyan-300">
                  {stats.rareCount}
                </p>
                <p className="text-[9px] text-slate-500 uppercase">Rare</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Continent Progress Gauges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {stats.continentProgress.map((cont) => (
            <div
              key={cont.continent}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between shadow-md hover:border-emerald-500/40 transition"
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-200">{cont.continent}</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {cont.percentage}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-1.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${cont.percentage}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-400">
                {cont.conqueredCountries} / {cont.totalCountries} conquis
              </p>
            </div>
          ))}
        </div>

        {/* View Switcher & Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-1 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("map")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "map"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-700/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <MapIcon className="w-4 h-4" />
              <span>Mappemonde du Brouillard</span>
            </button>

            <button
              onClick={() => setActiveTab("album")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "album"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-700/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Album Pokédex ({stats.unlockedCardsCount})</span>
            </button>
          </div>

          <button
            onClick={() => navigate("/quizzes")}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md shadow-emerald-900/20"
          >
            <span>Conquérir de nouveaux territoires</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* TAB 1: Mappemonde du Brouillard */}
        {activeTab === "map" && (
          <div className="space-y-3">
            <ConquestWorldMap
              userId={user?.id}
              onSelectCard={(card) => setSelectedCard(card)}
            />
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
              <span>💡 Astuce : Cliquez sur n'importe quel pays sur la mappemonde pour inspecter sa fiche Pokédex ou voir les conditions de déblocage.</span>
              <button
                onClick={() => setActiveTab("album")}
                className="text-emerald-400 hover:text-emerald-300 font-bold underline ml-2 shrink-0"
              >
                Voir la galerie complète →
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Album Pokédex / Galerie de cartes */}
        {activeTab === "album" && (
          <div className="space-y-4">
            {/* Filter controls */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center gap-3">
              {/* Search bar */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Rechercher un pays, une capitale..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Continent Selector */}
              <select
                value={selectedContinent}
                onChange={(e) => setSelectedContinent(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Tous les continents</option>
                <option value="Europe">Europe</option>
                <option value="Asia">Asie</option>
                <option value="Africa">Afrique</option>
                <option value="Americas">Amériques</option>
                <option value="Oceania">Océanie</option>
              </select>

              {/* Rarity Selector */}
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">Toutes raretés</option>
                <option value="legendary">⭐ Légendaires</option>
                <option value="epic">💎 Épiques</option>
                <option value="rare">🔷 Rares</option>
                <option value="common">🧭 Communes</option>
              </select>

              {/* Toggle Unlocked Only */}
              <button
                type="button"
                onClick={() => setFilterUnlockedOnly((prev) => !prev)}
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition border flex items-center gap-1.5 ${
                  filterUnlockedOnly
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Débloquées seulement</span>
              </button>
            </div>

            {/* Pokédex Card Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredCards.map((card) => {
                const isConquered = card.isConquered;

                return (
                  <div
                    key={card.iso3}
                    onClick={() => setSelectedCard(card)}
                    className={`group relative rounded-2xl p-3 border transition-all cursor-pointer flex flex-col justify-between ${
                      isConquered
                        ? card.rarity === "legendary"
                          ? "bg-gradient-to-b from-amber-950/40 to-slate-900 border-amber-500/40 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/20"
                          : card.rarity === "epic"
                          ? "bg-gradient-to-b from-purple-950/40 to-slate-900 border-purple-500/40 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20"
                          : card.rarity === "rare"
                          ? "bg-gradient-to-b from-blue-950/40 to-slate-900 border-blue-500/40 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20"
                          : "bg-gradient-to-b from-emerald-950/40 to-slate-900 border-emerald-500/40 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20"
                        : "bg-slate-900/60 border-slate-800/80 opacity-60 hover:opacity-90 hover:border-slate-700"
                    }`}
                  >
                    {/* Top flag + rarity badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl filter drop-shadow">
                        {isConquered ? card.flagEmoji : "🌫️"}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          card.rarity === "legendary"
                            ? "bg-amber-500/20 text-amber-300"
                            : card.rarity === "epic"
                            ? "bg-purple-500/20 text-purple-300"
                            : card.rarity === "rare"
                            ? "bg-blue-500/20 text-blue-300"
                            : "bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        {card.rarity === "legendary"
                          ? "⭐ LÉG."
                          : card.rarity === "epic"
                          ? "💎 ÉPIQUE"
                          : card.rarity === "rare"
                          ? "🔷 RARE"
                          : "🧭 COMM."}
                      </span>
                    </div>

                    {/* Country Name & Capital */}
                    <div className="mb-2">
                      <h4 className="text-sm font-black text-white truncate group-hover:text-emerald-300 transition-colors">
                        {card.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {card.capital}
                      </p>
                    </div>

                    {/* Bottom Status / Landmark */}
                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                      {isConquered ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Conquis
                        </span>
                      ) : (
                        <span className="text-slate-500 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Verrouillé
                        </span>
                      )}
                      <span className="text-slate-500 font-mono text-[10px]">
                        #{card.iso3}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredCards.length === 0 && (
              <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800">
                <p className="text-slate-400 text-sm">
                  Aucune carte ne correspond à vos filtres actuels.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Holographic Card Modal */}
      <ConquestCardModal
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
        onPlayCountryQuiz={() => {
          setSelectedCard(null);
          navigate("/quizzes");
        }}
      />
    </div>
  );
}
