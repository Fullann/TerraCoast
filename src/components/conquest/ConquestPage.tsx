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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col pb-20">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white py-8 px-4 sm:px-6 lg:px-8 shadow-xs relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-black uppercase tracking-wider mb-3 shadow-2xs">
              <Compass className="w-4 h-4 text-emerald-200" />
              <span>Le Pokédex Géographique Mondial</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Carte de Conquête & Brouillard de Guerre 🗺️
            </h1>
            <p className="text-emerald-50 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed font-medium">
              Dissipez le brouillard planétaire en maîtrisant des quiz (≥ 80% de précision). Chaque pays conquis s'illumine et débloque sa carte holographique de collection !
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex flex-wrap items-center gap-3 bg-white/15 backdrop-blur-md p-4 rounded-3xl border border-white/25 shadow-md">
            <div className="text-center px-3 border-r border-white/20">
              <p className="text-2xl sm:text-3xl font-black text-white">
                {stats.conquestPercentage}%
              </p>
              <p className="text-[11px] text-emerald-100 uppercase font-black tracking-wider">
                Monde Conquis
              </p>
            </div>

            <div className="text-center px-3 border-r border-white/20">
              <p className="text-2xl sm:text-3xl font-black text-white">
                {stats.conqueredCount}/{stats.totalCountries}
              </p>
              <p className="text-[11px] text-emerald-100 uppercase font-black tracking-wider">
                Territoires
              </p>
            </div>

            <div className="flex items-center gap-1.5 pl-2">
              <div className="text-center px-2">
                <span className="text-xs">⭐</span>
                <p className="text-sm font-black text-amber-200">
                  {stats.legendaryCount}
                </p>
                <p className="text-[9px] text-emerald-100 uppercase font-bold">Légende</p>
              </div>
              <div className="text-center px-2">
                <span className="text-xs">💎</span>
                <p className="text-sm font-black text-purple-200">
                  {stats.epicCount}
                </p>
                <p className="text-[9px] text-emerald-100 uppercase font-bold">Épique</p>
              </div>
              <div className="text-center px-2">
                <span className="text-xs">🔷</span>
                <p className="text-sm font-black text-cyan-200">
                  {stats.rareCount}
                </p>
                <p className="text-[9px] text-emerald-100 uppercase font-bold">Rare</p>
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
              className="bg-white border-2 border-slate-200 rounded-2xl p-3 flex flex-col justify-between shadow-xs hover:border-emerald-300 transition"
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-black text-slate-800">{cont.continent}</span>
                <span className="text-emerald-600 font-mono font-black">
                  {cont.percentage}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden mb-1.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${cont.percentage}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-500 font-bold">
                {cont.conqueredCountries} / {cont.totalCountries} conquis
              </p>
            </div>
          ))}
        </div>

        {/* View Switcher & Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-3xl border-2 border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("map")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all border-2 ${
                activeTab === "map"
                  ? "bg-emerald-500 text-white border-emerald-600 border-b-4 border-b-emerald-700 shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200"
              }`}
            >
              <MapIcon className="w-4 h-4" />
              <span>Mappemonde du Brouillard</span>
            </button>

            <button
              onClick={() => setActiveTab("album")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all border-2 ${
                activeTab === "album"
                  ? "bg-emerald-500 text-white border-emerald-600 border-b-4 border-b-emerald-700 shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Album Pokédex ({stats.unlockedCardsCount})</span>
            </button>
          </div>

          <button
            onClick={() => navigate("/quizzes")}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl text-xs sm:text-sm border-2 border-emerald-600 border-b-4 border-b-emerald-700 active:border-b-0 active:translate-y-1 shadow-md transition flex items-center justify-center gap-2"
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
            <div className="p-3.5 rounded-2xl bg-white border-2 border-slate-200 text-xs text-slate-600 shadow-xs flex items-center justify-between font-medium">
              <span>💡 Astuce : Cliquez sur n'importe quel pays sur la mappemonde pour inspecter sa fiche Pokédex ou voir les conditions de déblocage.</span>
              <button
                onClick={() => setActiveTab("album")}
                className="text-emerald-600 hover:text-emerald-700 font-black underline ml-2 shrink-0"
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
            <div className="p-4 rounded-3xl bg-white border-2 border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
              {/* Search bar */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher un pays, une capitale..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Continent Selector */}
              <select
                value={selectedContinent}
                onChange={(e) => setSelectedContinent(e.target.value)}
                className="bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
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
                className="bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
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
                className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition border-2 flex items-center gap-1.5 ${
                  filterUnlockedOnly
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900"
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
                    className={`group relative rounded-3xl p-3.5 border-2 transition-all cursor-pointer flex flex-col justify-between select-none ${
                      isConquered
                        ? card.rarity === "legendary"
                          ? "bg-amber-50/80 border-amber-300 hover:border-amber-400 shadow-xs hover:shadow-md hover:scale-102"
                          : card.rarity === "epic"
                          ? "bg-purple-50/80 border-purple-300 hover:border-purple-400 shadow-xs hover:shadow-md hover:scale-102"
                          : card.rarity === "rare"
                          ? "bg-sky-50/80 border-sky-300 hover:border-sky-400 shadow-xs hover:shadow-md hover:scale-102"
                          : "bg-emerald-50/80 border-emerald-300 hover:border-emerald-400 shadow-xs hover:shadow-md hover:scale-102"
                        : "bg-slate-100/70 border-dashed border-slate-200 opacity-60 hover:opacity-90 hover:border-slate-300"
                    }`}
                  >
                    {/* Top flag + rarity badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl filter drop-shadow-xs">
                        {isConquered ? card.flagEmoji : "🌫️"}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-lg border ${
                          card.rarity === "legendary"
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : card.rarity === "epic"
                            ? "bg-purple-100 text-purple-800 border-purple-300"
                            : card.rarity === "rare"
                            ? "bg-sky-100 text-sky-800 border-sky-300"
                            : "bg-emerald-100 text-emerald-800 border-emerald-300"
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
                      <h4 className="text-sm font-black text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                        {card.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-bold truncate">
                        {card.capital}
                      </p>
                    </div>

                    {/* Bottom Status / Landmark */}
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      {isConquered ? (
                        <span className="text-emerald-700 font-black flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-600" /> Conquis
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Verrouillé
                        </span>
                      )}
                      <span className="text-slate-400 font-mono text-[10px]">
                        #{card.iso3}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredCards.length === 0 && (
              <div className="text-center py-12 bg-white rounded-3xl border-2 border-slate-200 shadow-xs">
                <p className="text-slate-500 text-sm font-bold">
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
