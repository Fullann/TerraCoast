import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Navigation,
  RotateCcw,
  Share2,
  ArrowRight,
} from "lucide-react";
import {
  startTravleGame,
  submitTravleGuess,
  generateTravleShareText,
  TravleGameSession,
  getTravleGraph,
  getRandomPairForFilter,
  type TravleFilterType,
} from "../../../lib/travleGame";
import { saveTravleWin } from "../../../lib/gameRecordsManager";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAuth } from "../../../contexts/AuthContext";
import { playSound } from "../../../lib/soundManager";
import { triggerConfetti } from "../../common/Confetti";
import { toast } from "../../common/ToastContainer";
import { addGems } from "../../../lib/gamificationManager";

const VOYAGE_FILTERS: Array<{ id: TravleFilterType; label: string; icon: string }> = [
  { id: "all", label: "Tous les Voyages", icon: "🗺️" },
  { id: "express", label: "Voyage Express (3-4 frontières)", icon: "⚡" },
  { id: "transcontinental", label: "Grand Voyage Transcontinental (6-10)", icon: "🌍" },
  { id: "europe", label: "100% Europe", icon: "🇪🇺" },
  { id: "asia", label: "100% Asie", icon: "🌏" },
  { id: "americas", label: "100% Amériques", icon: "🌎" },
  { id: "africa", label: "100% Afrique", icon: "🌍" },
];

export function TravleGamePage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { profile } = useAuth();

  const [mode, setMode] = useState<"daily" | "practice">("daily");
  const [selectedFilter, setSelectedFilter] = useState<TravleFilterType>("all");
  const [session, setSession] = useState<TravleGameSession>(() =>
    startTravleGame(true, undefined, language as any)
  );
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { countriesMap } = useMemo(() => getTravleGraph(language as any), [language]);

  // Autocomplete suggestions
  const suggestions = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase().trim();
    const list: Array<{ name: string; flagEmoji: string; iso3: string }> = [];

    for (const c of countriesMap.values()) {
      if (
        c.name.toLowerCase().includes(q) ||
        c.officialName.toLowerCase().includes(q) ||
        c.iso3.toLowerCase() === q
      ) {
        list.push({ name: c.name, flagEmoji: c.flagEmoji, iso3: c.iso3 });
        if (list.length >= 6) break;
      }
    }
    return list;
  }, [query, countriesMap]);

  const handleStartNewGame = (isDailyMode: boolean, filter: TravleFilterType = selectedFilter) => {
    setMode(isDailyMode ? "daily" : "practice");
    const customPair = isDailyMode ? undefined : getRandomPairForFilter(filter);
    const newSession = startTravleGame(isDailyMode, customPair, language as any);
    setSession(newSession);
    setQuery("");
  };

  const handleFilterChange = (filter: TravleFilterType) => {
    setSelectedFilter(filter);
    setMode("practice");
    const customPair = getRandomPairForFilter(filter);
    const newSession = startTravleGame(false, customPair, language as any);
    setSession(newSession);
    setQuery("");
    playSound("click");
  };

  const handleGuess = (countryName: string) => {
    if (!countryName.trim() || session.isFinished) return;

    const { session: newSession, attempt } = submitTravleGuess(
      session,
      countryName,
      language as any
    );
    setSession(newSession);
    setQuery("");

    if (attempt.status === "success") {
      playSound("correct");
      if (newSession.isFinished && newSession.won) {
        saveTravleWin(newSession.guessesUsed, newSession.optimalStepsCount);
        triggerConfetti();
        playSound("fanfare");
        addGems(profile?.id, 25);
        toast.success("Victoire ! Vous avez atteint la destination 🌍 (+25 💎)");
      } else {
        toast.success(attempt.message);
      }
    } else {
      playSound("wrong");
      toast.error(attempt.message);
    }
  };

  const handleCopyShare = async () => {
    const text = generateTravleShareText(session);
    try {
      await navigator.clipboard.writeText(text);
      playSound("click");
      toast.success("Résultat copié dans le presse-papier !");
    } catch {
      toast.error("Impossible de copier automatiquement.");
    }
  };

  const stepsCount = session.path.length - 1;
  const isOptimal = stepsCount === session.optimalStepsCount;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-6 px-3 sm:px-6 pb-28">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation & Mode Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/games")}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all flex items-center gap-2 text-xs font-black shadow-2xs w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Hub des Jeux</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-200/70 rounded-2xl p-1 text-xs font-black">
              <button
                type="button"
                onClick={() => handleStartNewGame(true)}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  mode === "daily"
                    ? "bg-white text-emerald-800 shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📅 Défi du Jour
              </button>
              <button
                type="button"
                onClick={() => handleStartNewGame(false)}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  mode === "practice"
                    ? "bg-white text-emerald-800 shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🎲 Voyages Libres
              </button>
            </div>

            {mode === "practice" && (
              <button
                type="button"
                onClick={() => handleStartNewGame(false, selectedFilter)}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-black shadow-2xs flex items-center gap-1"
                title="Générer un autre itinéraire dans cette catégorie"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Autre Itinéraire</span>
              </button>
            )}
          </div>
        </div>

        {/* 🗺️ Barre de Filtres de Voyage Tactiles */}
        {mode === "practice" && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none animate-fadeIn">
            {VOYAGE_FILTERS.map((f) => {
              const isActive = selectedFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleFilterChange(f.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all border-2 ${
                    isActive
                      ? "bg-teal-600 text-white border-teal-700 border-b-4 border-b-teal-900 shadow-xs"
                      : "bg-white text-slate-700 hover:text-slate-900 border-slate-200 hover:border-slate-300 shadow-2xs"
                  }`}
                >
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Grand En-tête de Mission */}
        <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-5 sm:p-7 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Départ */}
            <div className="flex items-center gap-3">
              <div className="text-4xl sm:text-5xl filter drop-shadow">
                {session.startCountry.flagEmoji}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                  Point de Départ
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-800">{session.startCountry.name}</h2>
                <span className="text-xs text-slate-500 font-bold">{session.startCountry.continent}</span>
              </div>
            </div>

            {/* Flèche indicatrice */}
            <div className="flex items-center justify-center py-2 sm:py-0">
              <div className="flex flex-col items-center">
                <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
                  Plus court chemin : {session.optimalStepsCount} étapes
                </span>
                <ArrowRight className="w-6 h-6 text-emerald-600 mt-1 animate-pulse" />
              </div>
            </div>

            {/* Destination */}
            <div className="flex items-center gap-3 justify-end text-right">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-sky-600">
                  Destination Finale
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-800">{session.targetCountry.name}</h2>
                <span className="text-xs text-slate-500 font-bold">{session.targetCountry.continent}</span>
              </div>
              <div className="text-4xl sm:text-5xl filter drop-shadow">
                {session.targetCountry.flagEmoji}
              </div>
            </div>
          </div>

          {/* Baromètre de Progression */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>
              Étapes franchies : <strong className="text-slate-800">{stepsCount}</strong>
            </span>
            <span>
              Essais restants :{" "}
              <strong className="text-emerald-700">
                {session.maxGuesses - session.guessesUsed} / {session.maxGuesses}
              </strong>
            </span>
          </div>
        </div>

        {/* Itinéraire Actuel (Fil d'Ariane Sinueux) */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-500">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <Navigation className="w-4 h-4" />
              Votre Itinéraire de Voyage
            </span>
            <span>Position : {session.currentCountry.name}</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
            {session.path.map((step, idx) => {
              const isCurrent = idx === session.path.length - 1;
              return (
                <div key={step.iso3} className="flex items-center gap-2 shrink-0">
                  <div
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border-2 text-xs font-black transition-all ${
                      isCurrent
                        ? "bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20 scale-105"
                        : "bg-slate-100 text-slate-800 border-slate-200"
                    }`}
                  >
                    <span className="text-base">{step.flagEmoji}</span>
                    <span>{step.name}</span>
                  </div>
                  {idx < session.path.length - 1 && (
                    <span className="text-slate-400 font-bold">➔</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Input de Saisie avec Autocomplétion */}
        {!session.isFinished ? (
          <div className="relative">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && suggestions.length > 0) {
                    handleGuess(suggestions[0].name);
                  }
                }}
                placeholder={`Nommez un pays frontalier avec ${session.currentCountry.name}...`}
                className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-4 text-slate-800 placeholder-slate-400 font-bold text-sm focus:border-emerald-500 focus:outline-none transition-all shadow-xs"
                autoFocus
              />

              <button
                type="button"
                disabled={!query.trim()}
                onClick={() => {
                  const targetName = suggestions[0]?.name || query;
                  handleGuess(targetName);
                }}
                className={`px-6 py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center shrink-0 border-b-4 ${
                  query.trim()
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-700 active:border-b-0 active:translate-y-1 shadow-md shadow-emerald-500/20"
                    : "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
                }`}
              >
                Franchir ➔
              </button>
            </div>

            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border-2 border-slate-200 shadow-2xl p-2 z-30 space-y-1 animate-in fade-in">
                {suggestions.map((item, idx) => (
                  <button
                    key={item.iso3}
                    type="button"
                    onClick={() => handleGuess(item.name)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-emerald-50 text-left transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{item.flagEmoji}</span>
                      <span className="text-sm font-bold text-slate-800 group-hover:text-emerald-800">
                        {item.name}
                      </span>
                    </div>
                    {idx === 0 && (
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                        Entrée ↵
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Écran de Victoire / Fin de Partie */
          <div className="bg-white border-3 border-emerald-500 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-3xl bg-emerald-100 border border-emerald-300 text-4xl flex items-center justify-center mx-auto shadow-inner">
              {session.won ? "🏆" : "🧭"}
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-800">
                {session.won ? "Voyage Réussi ! Félicitations !" : "Voyage Inachevé"}
              </h3>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                {session.won
                  ? `Vous avez relié ${session.startCountry.name} à ${session.targetCountry.name} en ${stepsCount} étape${
                      stepsCount > 1 ? "s" : ""
                    } (Chemin parfait : ${session.optimalStepsCount}).`
                  : `Vous n'avez pas réussi à atteindre ${session.targetCountry.name}.`}
              </p>
            </div>

            {session.won && (
              <div className="flex justify-center gap-2 text-2xl my-2">
                <span>⭐</span>
                <span className={stepsCount <= session.optimalStepsCount + 2 ? "" : "opacity-30"}>
                  ⭐
                </span>
                <span className={isOptimal ? "" : "opacity-30"}>⭐</span>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
              <button
                type="button"
                onClick={handleCopyShare}
                className="py-3 px-5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-2xl border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all"
              >
                <Share2 className="w-4 h-4 stroke-[2.5]" />
                <span>Partager le Trajet 📲</span>
              </button>

              <button
                type="button"
                onClick={() => handleStartNewGame(false)}
                className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-2xl border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 flex items-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                <span>Nouvel Itinéraire Aléatoire 🎲</span>
              </button>
            </div>
          </div>
        )}

        {/* Historique des Tentatives */}
        {session.attempts.length > 0 && (
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Journal de Bord ({session.attempts.length})
            </h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {session.attempts
                .slice()
                .reverse()
                .map((att, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-2xl border-2 text-xs font-bold ${
                      att.status === "success"
                        ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                        : "bg-rose-50 border-rose-300 text-rose-900"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{att.flagEmoji || "⚠️"}</span>
                      <span>{att.message}</span>
                    </div>
                    <span
                      className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-lg ${
                        att.status === "success"
                          ? "bg-emerald-200/80 text-emerald-900"
                          : "bg-rose-200/80 text-rose-900"
                      }`}
                    >
                      {att.status === "success" ? "Validé" : "Erreur"}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
