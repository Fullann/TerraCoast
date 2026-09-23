import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import {
  Compass,
  Volume2,
  VolumeX,
  RotateCcw,
  Share2,
  Trophy,
  XCircle,
  ArrowLeft,
  Search,
  Calendar,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  getDailySilhouetteCountry,
  getRandomSilhouetteCountry,
  getSilhouetteFeatureData,
  evaluateGuess,
  getHintsForAttempt,
  type GuessResult,
  type SilhouetteHint,
} from "../../../lib/silhouetteGame";
import { getAllAtlasCountries, type AtlasCountry } from "../../../lib/atlasData";
import { useLanguage } from "../../../contexts/LanguageContext";
import { triggerConfetti } from "../../common/Confetti";
import {
  isSoundEnabled,
  toggleSound,
  playIncorrectSound,
  playVictoryFanfare,
  playClickSound,
} from "../../../lib/soundManager";

const MAX_ATTEMPTS = 5;

export function SilhouetteGamePage() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const [mode, setMode] = useState<"daily" | "training">("daily");
  const [targetCountry, setTargetCountry] = useState<AtlasCountry>(() =>
    getDailySilhouetteCountry(undefined, language)
  );
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [query, setQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">("playing");
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const [zoomMultiplier, setZoomMultiplier] = useState(1);
  const [copiedShare, setCopiedShare] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Tous les pays traduits pour l'autocomplétion
  const allCountries = useMemo(() => getAllAtlasCountries(language), [language]);

  // Données de géométrie TopoJSON du pays mystère
  const featureData = useMemo(() => {
    return getSilhouetteFeatureData(targetCountry.iso3);
  }, [targetCountry.iso3]);

  // Initialisation ou changement de mode
  const startNewGame = (newMode: "daily" | "training") => {
    playClickSound();
    setMode(newMode);
    setGuesses([]);
    setGameStatus("playing");
    setQuery("");
    setZoomMultiplier(1);
    setCopiedShare(false);

    if (newMode === "daily") {
      setTargetCountry(getDailySilhouetteCountry(undefined, language));
    } else {
      setTargetCountry(getRandomSilhouetteCountry(language, targetCountry.iso3));
    }
  };

  // Indices disponibles selon le nombre d'essais manqués
  const unlockedHints: SilhouetteHint[] = useMemo(() => {
    return getHintsForAttempt(targetCountry, guesses.length);
  }, [targetCountry, guesses.length]);

  // Suggestions filtrées
  const filteredSuggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const alreadyGuessed = new Set(guesses.map((g) => g.guessedCountry.iso3));

    return allCountries
      .filter((c) => !alreadyGuessed.has(c.iso3))
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.officialName.toLowerCase().includes(q) ||
          c.iso3.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [allCountries, query, guesses]);

  const handleSoundToggle = () => {
    const next = toggleSound();
    setSoundOn(next);
  };

  // Soumission d'une proposition
  const handleSelectCountry = (country: AtlasCountry) => {
    if (gameStatus !== "playing") return;

    playClickSound();
    const result = evaluateGuess(country, targetCountry);
    const newGuesses = [...guesses, result];
    setGuesses(newGuesses);
    setQuery("");
    setIsDropdownOpen(false);

    if (result.isCorrect) {
      setGameStatus("won");
      playVictoryFanfare();
      triggerConfetti();
    } else {
      if (newGuesses.length >= MAX_ATTEMPTS) {
        setGameStatus("lost");
        playIncorrectSound();
      } else {
        playIncorrectSound();
      }
    }
  };

  // Génération du partage viral (format texte avec emojis)
  const handleShare = () => {
    playClickSound();
    const dateStr = new Date().toISOString().slice(0, 10);
    const modeLabel = mode === "daily" ? `Défi Quotidien #${dateStr}` : "Entraînement";
    const attemptsText = gameStatus === "won" ? `${guesses.length}/${MAX_ATTEMPTS}` : "X/5";

    let squares = "";
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      const g = guesses[i];
      if (!g) {
        squares += "⬛ ";
      } else if (g.isCorrect) {
        squares += "🟩 ";
      } else if (g.proximityPercent >= 80) {
        squares += "🟨 ";
      } else {
        squares += "🟥 ";
      }
    }

    const text = `🗺️ TerraCoast Silhouette Mystère (${modeLabel})\n🎯 Résultat : ${attemptsText}\n${squares}\n🌍 https://terracoast.ch/games/silhouette`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/games")}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Retour aux modes"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🗺️</span>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  Silhouette Mystère
                </h1>
                <p className="text-xs text-slate-400">Devine le pays par sa frontière</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Mode */}
            <div className="bg-slate-800 p-1 rounded-xl flex items-center text-xs font-semibold">
              <button
                onClick={() => startNewGame("daily")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  mode === "daily"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Défi du</span> Jour
              </button>
              <button
                onClick={() => startNewGame("training")}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  mode === "training"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Infini
              </button>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={handleSoundToggle}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title={soundOn ? "Couper le son" : "Activer le son"}
            >
              {soundOn ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Silhouette Visualizer Box */}
        <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-4 sm:p-6 overflow-hidden shadow-2xl flex flex-col items-center">
          {/* Subtle Radar/Grid background overlay */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 50% 50%, #10B981 1px, transparent 1px), linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)`,
              backgroundSize: "24px 24px, 48px 48px, 48px 48px",
            }}
          />

          {/* Zoom controls */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-slate-800/80 backdrop-blur-md rounded-lg p-1 border border-slate-700">
            <button
              onClick={() => setZoomMultiplier((z) => Math.min(2.5, z + 0.25))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Zoom avant"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomMultiplier((z) => Math.max(0.75, z - 0.25))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Zoom arrière"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomMultiplier(1)}
              className="px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Réinitialiser le zoom"
            >
              100%
            </button>
          </div>

          {/* Attempts counter pill */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700 text-xs font-bold text-slate-300">
            <span>Essai :</span>
            <span className={guesses.length >= 4 ? "text-amber-400" : "text-emerald-400"}>
              {guesses.length}
            </span>
            <span className="text-slate-500">/ {MAX_ATTEMPTS}</span>
          </div>

          {/* SVG Map of the single Country Feature */}
          <div className="w-full max-w-sm sm:max-w-md h-64 sm:h-80 flex items-center justify-center my-2">
            {featureData && featureData.feature ? (
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                  scale: featureData.recommendedScale * zoomMultiplier,
                  center: featureData.center,
                }}
                width={400}
                height={320}
                className="w-full h-full drop-shadow-[0_0_25px_rgba(16,185,129,0.25)]"
              >
                <Geographies
                  geography={{
                    type: "FeatureCollection",
                    features: [featureData.feature],
                  }}
                >
                  {({ geographies }: { geographies: any[] }) =>
                    geographies.map((geo: any) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        style={{
                          default: {
                            fill: "#10B981",
                            stroke: "#34D399",
                            strokeWidth: 1.5,
                            outline: "none",
                            filter: "drop-shadow(0 0 8px rgba(16, 185, 129, 0.4))",
                          },
                          hover: {
                            fill: "#059669",
                            stroke: "#6EE7B7",
                            strokeWidth: 2,
                            outline: "none",
                          },
                          pressed: {
                            fill: "#047857",
                            stroke: "#A7F3D0",
                            outline: "none",
                          },
                        }}
                      />
                    ))
                  }
                </Geographies>
              </ComposableMap>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-500 gap-2">
                <Compass className="w-10 h-10 animate-spin" />
                <p className="text-sm">Chargement de la silhouette...</p>
              </div>
            )}
          </div>
        </div>

        {/* Search Input Bar (si partie en cours) */}
        {gameStatus === "playing" && (
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Tape le nom d'un pays (ex: Madagascar, Chili, Japon...)"
                className="w-full bg-slate-900 border border-slate-700 text-white pl-12 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm sm:text-base placeholder:text-slate-500 shadow-lg"
              />
            </div>

            {/* Dropdown Suggestions */}
            {isDropdownOpen && filteredSuggestions.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-20 max-h-64 overflow-y-auto divide-y divide-slate-800">
                {filteredSuggestions.map((country) => (
                  <button
                    key={country.iso3}
                    type="button"
                    onClick={() => handleSelectCountry(country)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-800 flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{country.flagEmoji}</span>
                      <div>
                        <p className="font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                          {country.name}
                        </p>
                        <p className="text-xs text-slate-500">{country.continent}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-500 group-hover:text-slate-300">
                      {country.iso3}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Guess History Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Historique des essais ({guesses.length}/{MAX_ATTEMPTS})</span>
            {guesses.length > 0 && (
              <span className="text-xs font-normal lowercase text-slate-500">
                (distance, direction, proximité)
              </span>
            )}
          </h2>

          <div className="space-y-2">
            {Array.from({ length: MAX_ATTEMPTS }).map((_, idx) => {
              const g = guesses[idx];
              if (!g) {
                return (
                  <div
                    key={idx}
                    className="h-12 rounded-xl border border-dashed border-slate-800/80 bg-slate-950/40 flex items-center px-4 text-slate-600 text-xs font-medium"
                  >
                    Essai #{idx + 1}
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className={`h-14 rounded-xl border px-4 flex items-center justify-between transition-all animate-fadeIn ${
                    g.isCorrect
                      ? "bg-emerald-950/50 border-emerald-500/50 text-emerald-300"
                      : "bg-slate-900 border-slate-700/80 text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl flex-shrink-0">
                      {g.guessedCountry.flagEmoji}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-sm sm:text-base truncate">
                        {g.guessedCountry.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {g.guessedCountry.continent}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
                    {/* Distance */}
                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-mono font-bold">
                        {g.distanceKm === 0 ? "0 km" : `${g.distanceKm.toLocaleString()} km`}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center justify-end gap-1">
                        <span>{g.arrow}</span>
                        <span>{g.direction}</span>
                      </p>
                    </div>

                    {/* Proximity gauge */}
                    <div className="w-16 sm:w-24 flex flex-col items-end gap-1">
                      <span className="text-xs font-mono font-bold">
                        {g.proximityPercent}%
                      </span>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            g.isCorrect
                              ? "bg-emerald-500"
                              : g.proximityPercent >= 80
                              ? "bg-amber-400"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${g.proximityPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Unlocked Hints Section */}
        {unlockedHints.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Indices Débloqués</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {unlockedHints.map((hint) => (
                <div
                  key={hint.type}
                  className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex flex-col"
                >
                  <span className="text-xs text-slate-400 font-medium">{hint.label}</span>
                  <span className="text-base sm:text-lg font-bold text-amber-300 mt-1">
                    {hint.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game Finished Summary Dialog */}
        {gameStatus !== "playing" && (
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-emerald-500/50 rounded-2xl p-6 shadow-2xl text-center space-y-4 animate-scaleUp">
            {gameStatus === "won" ? (
              <>
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto ring-4 ring-emerald-500/30">
                  <Trophy className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    Victoire ! 🎉
                  </h2>
                  <p className="text-emerald-400 font-semibold mt-1">
                    Tu as trouvé en {guesses.length}{" "}
                    {guesses.length > 1 ? "essais" : "essai"} !
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto ring-4 ring-red-500/30">
                  <XCircle className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white">Partie terminée</h2>
                  <p className="text-slate-400 mt-1">
                    La bonne réponse était :
                  </p>
                </div>
              </>
            )}

            <div className="bg-slate-800/80 rounded-xl p-4 flex items-center justify-center gap-4 max-w-sm mx-auto">
              <span className="text-4xl">{targetCountry.flagEmoji}</span>
              <div className="text-left">
                <p className="text-xl font-bold text-white">{targetCountry.name}</p>
                <p className="text-xs text-slate-400">
                  Capitale : {targetCountry.capital} • {targetCountry.continent}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleShare}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/40 flex items-center gap-2 transition-all"
              >
                <Share2 className="w-4 h-4" />
                {copiedShare ? "Copié dans le presse-papier ! ✅" : "Partager mon résultat"}
              </button>

              <button
                onClick={() => startNewGame("training")}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 flex items-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Rejouer un autre pays
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
