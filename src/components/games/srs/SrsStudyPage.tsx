import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Brain,
  Layers,
  Sparkles,
  Plus,
  Search,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  loadDeck,
  getDueCards,
  getSrsStats,
  reviewCard,
  addCardToSrs,
  seedStarterDeckIfEmpty,
  type SrsCard,
  type SrsRating,
  type SrsStats,
} from "../../../lib/srsManager";
import { getAllAtlasCountries } from "../../../lib/atlasData";
import { SrsFlashcard } from "./SrsFlashcard";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAuth } from "../../../contexts/AuthContext";
import { triggerConfetti } from "../../common/Confetti";
import {
  isSoundEnabled,
  toggleSound,
  playCorrectSound,
  playVictoryFanfare,
  playClickSound,
} from "../../../lib/soundManager";

export function SrsStudyPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();

  const userId = user?.id || null;

  const [stats, setStats] = useState<SrsStats>(() => getSrsStats(userId));
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionCards, setSessionCards] = useState<SrsCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());

  // Modale d'ajout manuel
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [justAddedIso, setJustAddedIso] = useState<string | null>(null);

  const allCountries = useMemo(() => getAllAtlasCountries(language), [language]);

  const refreshDeckStats = () => {
    setStats(getSrsStats(userId));
  };

  useEffect(() => {
    seedStarterDeckIfEmpty(userId);
    refreshDeckStats();
  }, [userId]);

  const handleStartSession = () => {
    playClickSound();
    const due = getDueCards(userId);
    if (due.length === 0) {
      // Si aucune carte n'est échue, réviser jusqu'à 10 cartes de la boîte 1 ou du deck
      const all = loadDeck(userId);
      const fallback = all.slice(0, 10);
      setSessionCards(fallback);
    } else {
      setSessionCards(due);
    }

    setCurrentCardIndex(0);
    setIsSessionActive(true);
  };

  const handleRateCard = (rating: SrsRating) => {
    const card = sessionCards[currentCardIndex];
    if (!card) return;

    playCorrectSound();
    reviewCard(card.id, rating, userId);

    if (currentCardIndex + 1 < sessionCards.length) {
      setCurrentCardIndex((i) => i + 1);
    } else {
      // Fin de session !
      setIsSessionActive(false);
      refreshDeckStats();
      playVictoryFanfare();
      triggerConfetti();
    }
  };

  const handleAddCountry = (iso3: string) => {
    playClickSound();
    const added = addCardToSrs(iso3, "capital", userId);
    if (added) {
      setJustAddedIso(iso3);
      refreshDeckStats();
      setTimeout(() => setJustAddedIso(null), 1800);
    }
  };

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return allCountries.slice(0, 8);
    const q = searchQuery.toLowerCase().trim();
    return allCountries
      .filter((c) => c.name.toLowerCase().includes(q) || c.capital.toLowerCase().includes(q))
      .slice(0, 10);
  }, [allCountries, searchQuery]);

  const currentCard = sessionCards[currentCardIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => (isSessionActive ? setIsSessionActive(false) : navigate("/games"))}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Retour"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🧠</span>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Carnet de Révision
                </h1>
                <p className="text-xs text-slate-400">Répétition espacée de Leitner</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = toggleSound();
                setSoundOn(next);
              }}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              {soundOn ? <Volume2 className="w-5 h-5 text-indigo-400" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {isSessionActive && currentCard ? (
          /* Active Flashcard Review */
          <div className="space-y-6 my-auto">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
              <span>Session en cours</span>
              <span className="bg-indigo-950 text-indigo-300 px-3 py-1 rounded-full border border-indigo-800">
                Carte {currentCardIndex + 1} / {sessionCards.length}
              </span>
            </div>

            <SrsFlashcard card={currentCard} onRate={handleRateCard} />
          </div>
        ) : (
          /* SRS Dashboard Overview */
          <div className="space-y-6">
            {/* Top Banner Card */}
            <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
              <div className="space-y-2 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                  <Brain className="w-4 h-4" />
                  <span>Méthode Scientifique de Leitner</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  Prêt pour ta session ?
                </h2>
                <p className="text-slate-400 text-xs sm:text-sm max-w-md">
                  Chaque bonne réponse décale la prochaine révision plus loin dans le temps
                  pour ancrer les pays dans ta mémoire à long terme.
                </p>
              </div>

              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <button
                  onClick={handleStartSession}
                  className="py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-black rounded-2xl shadow-xl shadow-indigo-950 flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>
                    {stats.dueToday > 0
                      ? `Réviser (${stats.dueToday} dues)`
                      : "S'entraîner (Libre)"}
                  </span>
                </button>

                <button
                  onClick={() => setShowAddModal(true)}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter des pays au carnet</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center">
                <p className="text-xs text-slate-400 font-bold uppercase">Total Cartes</p>
                <p className="text-2xl sm:text-3xl font-black text-white mt-1 font-mono">
                  {stats.totalCards}
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center">
                <p className="text-xs text-slate-400 font-bold uppercase">À revoir aujourd'hui</p>
                <p className="text-2xl sm:text-3xl font-black text-amber-400 mt-1 font-mono">
                  {stats.dueToday}
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center">
                <p className="text-xs text-slate-400 font-bold uppercase">Maîtrisées (B5)</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 font-mono">
                  {stats.masteredCount}
                </p>
              </div>
            </div>

            {/* The 5 Leitner Boxes Visual Grid */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Répartition des 5 Boîtes de Leitner</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {/* Box 1 */}
                <div className="bg-red-950/30 border border-red-500/30 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-red-400">Boîte 1</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Tous les jours</p>
                  </div>
                  <p className="text-2xl font-black text-red-300 mt-3 font-mono">
                    {stats.boxCounts[1] || 0}
                  </p>
                </div>

                {/* Box 2 */}
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-400">Boîte 2</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Tous les 3 jours</p>
                  </div>
                  <p className="text-2xl font-black text-amber-300 mt-3 font-mono">
                    {stats.boxCounts[2] || 0}
                  </p>
                </div>

                {/* Box 3 */}
                <div className="bg-yellow-950/30 border border-yellow-500/30 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-yellow-400">Boîte 3</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Chaque semaine</p>
                  </div>
                  <p className="text-2xl font-black text-yellow-300 mt-3 font-mono">
                    {stats.boxCounts[3] || 0}
                  </p>
                </div>

                {/* Box 4 */}
                <div className="bg-blue-950/30 border border-blue-500/30 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-blue-400">Boîte 4</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Toutes les 2 sem.</p>
                  </div>
                  <p className="text-2xl font-black text-blue-300 mt-3 font-mono">
                    {stats.boxCounts[4] || 0}
                  </p>
                </div>

                {/* Box 5 */}
                <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-400">Boîte 5 (Acquis)</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Tous les mois</p>
                  </div>
                  <p className="text-2xl font-black text-emerald-300 mt-3 font-mono">
                    {stats.boxCounts[5] || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal : Ajouter un pays au carnet */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-400" />
                  <span>Ajouter au Carnet</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  ✕
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un pays ou capitale..."
                  className="w-full bg-slate-800 border border-slate-700 text-white pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-800">
                {filteredCountries.map((c) => (
                  <div
                    key={c.iso3}
                    className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-800/50 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{c.flagEmoji}</span>
                      <div>
                        <p className="text-sm font-semibold text-white">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.capital}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddCountry(c.iso3)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        justAddedIso === c.iso3
                          ? "bg-emerald-600 text-white"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white"
                      }`}
                    >
                      {justAddedIso === c.iso3 ? "Ajouté ! ✅" : "Ajouter +"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
