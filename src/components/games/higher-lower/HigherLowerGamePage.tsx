import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Flame,
  Trophy,
  Volume2,
  VolumeX,
  RotateCcw,
  Share2,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import {
  initHigherLowerGame,
  pickNextChallenger,
  evaluateHigherLowerChoice,
  formatMetricValue,
  getHigherLowerRecord,
  saveHigherLowerRecord,
  type HigherLowerMetric,
  type HigherLowerRound,
} from "../../../lib/higherLowerGame";
import { useLanguage } from "../../../contexts/LanguageContext";
import { triggerConfetti } from "../../common/Confetti";
import {
  isSoundEnabled,
  toggleSound,
  playCorrectSound,
  playIncorrectSound,
  playClickSound,
} from "../../../lib/soundManager";

export function HigherLowerGamePage() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const [metricMode, setMetricMode] = useState<HigherLowerMetric | "random">("population");
  const [round, setRound] = useState<HigherLowerRound>(() =>
    initHigherLowerGame("population", language)
  );

  const [streak, setStreak] = useState(0);
  const [highScore, setHighScore] = useState<number>(() =>
    getHigherLowerRecord(metricMode)
  );
  const [isGameOver, setIsGameOver] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [lastChoiceCorrect, setLastChoiceCorrect] = useState<boolean | null>(null);
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const [copiedShare, setCopiedShare] = useState(false);
  const [recentIso3s, setRecentIso3s] = useState<string[]>([]);

  // Mise à jour du record lors d'un changement de métrique
  useEffect(() => {
    setHighScore(getHigherLowerRecord(metricMode));
  }, [metricMode]);

  const handleStartGame = (metric = metricMode) => {
    playClickSound();
    const newRound = initHigherLowerGame(metric, language);
    setRound(newRound);
    setStreak(0);
    setIsGameOver(false);
    setRevealed(false);
    setLastChoiceCorrect(null);
    setCopiedShare(false);
    setRecentIso3s([newRound.currentCountry.iso3, newRound.nextCountry.iso3]);
  };

  const handleSoundToggle = () => {
    const next = toggleSound();
    setSoundOn(next);
  };

  const handleChoice = (choice: "higher" | "lower") => {
    if (revealed || isGameOver) return;

    playClickSound();
    const { isCorrect } = evaluateHigherLowerChoice(
      round.currentCountry,
      round.nextCountry,
      round.activeMetric,
      choice
    );

    setRevealed(true);
    setLastChoiceCorrect(isCorrect);

    if (isCorrect) {
      playCorrectSound();
      const newStreak = streak + 1;
      setStreak(newStreak);

      const isNewBest = saveHigherLowerRecord(metricMode, newStreak);
      if (isNewBest) {
        setHighScore(newStreak);
        triggerConfetti();
      }

      // Passer au tour suivant après animation
      setTimeout(() => {
        const nextChallenger = pickNextChallenger(round.nextCountry, language, [
          ...recentIso3s,
          round.currentCountry.iso3,
        ]);

        const nextMetric: HigherLowerMetric =
          metricMode === "random"
            ? Math.random() > 0.5
              ? "population"
              : "area_km2"
            : metricMode;

        setRound({
          currentCountry: round.nextCountry,
          nextCountry: nextChallenger,
          activeMetric: nextMetric,
        });
        setRecentIso3s((prev) => [...prev.slice(-6), nextChallenger.iso3]);
        setRevealed(false);
        setLastChoiceCorrect(null);
      }, 1400);
    } else {
      playIncorrectSound();
      setTimeout(() => {
        setIsGameOver(true);
      }, 1200);
    }
  };

  const handleShare = () => {
    playClickSound();
    const metricLabel =
      metricMode === "population"
        ? "Population 👥"
        : metricMode === "area_km2"
        ? "Superficie 📐"
        : "Mixte 🎲";
    const text = `⚖️ TerraCoast Plus Grand / Plus Petit (${metricLabel})\n🔥 Série : ${streak} bonnes réponses consécutives !\n🏆 Record : ${highScore}\n🌍 Viens défier mon record : https://terracoast.ch/games/higher-lower`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    });
  };

  const currentMetric = round.activeMetric;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 py-3 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/games")}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Retour aux modes"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚖️</span>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                  Plus Grand ou Plus Petit
                </h1>
                <p className="text-xs text-slate-400">Le duel des chiffres mondiaux</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Streak Counter */}
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 px-3.5 py-1.5 rounded-full">
              <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
              <div className="text-xs">
                <span className="text-slate-400">Série : </span>
                <span className="font-extrabold text-amber-300 text-sm">{streak}</span>
              </div>
            </div>

            {/* High Score */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span>Record : </span>
              <span className="font-bold text-white">{highScore}</span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={handleSoundToggle}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title={soundOn ? "Couper le son" : "Activer le son"}
            >
              {soundOn ? <Volume2 className="w-5 h-5 text-amber-400" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Metric Mode Filter Bar */}
      <div className="max-w-5xl mx-auto w-full px-4 pt-4 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => {
              setMetricMode("population");
              handleStartGame("population");
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              metricMode === "population"
                ? "bg-amber-600 text-white shadow-md shadow-amber-900/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            👥 Population
          </button>
          <button
            onClick={() => {
              setMetricMode("area_km2");
              handleStartGame("area_km2");
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              metricMode === "area_km2"
                ? "bg-amber-600 text-white shadow-md shadow-amber-900/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            📐 Superficie
          </button>
          <button
            onClick={() => {
              setMetricMode("random");
              handleStartGame("random");
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              metricMode === "random"
                ? "bg-amber-600 text-white shadow-md shadow-amber-900/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🎲 Aléatoire
          </button>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Métrique active : {currentMetric === "population" ? "Population" : "Superficie"}
        </span>
      </div>

      {/* Main Game Arena */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {!isGameOver ? (
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-stretch my-auto">
            {/* Card A : Pays de Référence (Valeur Connue) */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-between shadow-2xl relative overflow-hidden group">
              <div className="w-full flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                <span>Pays de référence</span>
                <span>{round.currentCountry.continent}</span>
              </div>

              <div className="my-6 text-center space-y-3">
                <span className="text-6xl sm:text-7xl block filter drop-shadow-md">
                  {round.currentCountry.flagEmoji}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {round.currentCountry.name}
                </h2>
                <p className="text-xs text-slate-400">
                  Capitale : {round.currentCountry.capital}
                </p>
              </div>

              {/* Highlighted Value */}
              <div className="w-full bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-center">
                <p className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-1">
                  {currentMetric === "population" ? "Population" : "Superficie"}
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                  {formatMetricValue(
                    currentMetric === "population"
                      ? round.currentCountry.population
                      : round.currentCountry.areaKm2,
                    currentMetric,
                    language
                  )}
                </p>
              </div>
            </div>

            {/* VS Badge in the center */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-full border-4 border-slate-950 shadow-xl text-white font-black text-xs">
              VS
            </div>

            {/* Card B : Pays Challenger (À Deviner) */}
            <div
              className={`bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-between shadow-2xl relative overflow-hidden transition-all duration-500 ${
                revealed
                  ? lastChoiceCorrect
                    ? "border-emerald-500 ring-2 ring-emerald-500/30"
                    : "border-red-500 ring-2 ring-red-500/30"
                  : "border-slate-800"
              }`}
            >
              <div className="w-full flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
                <span>Challenger</span>
                <span>{round.nextCountry.continent}</span>
              </div>

              <div className="my-6 text-center space-y-3">
                <span className="text-6xl sm:text-7xl block filter drop-shadow-md">
                  {round.nextCountry.flagEmoji}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {round.nextCountry.name}
                </h2>
                <p className="text-xs text-slate-400">
                  Capitale : {round.nextCountry.capital}
                </p>
              </div>

              {/* Interactive choice or revealed value */}
              <div className="w-full">
                {!revealed ? (
                  <div className="space-y-2">
                    <p className="text-xs text-center text-slate-400 font-medium mb-2">
                      {currentMetric === "population"
                        ? `A-t-il une population plus élevée ou moins élevée que ${round.currentCountry.name} ?`
                        : `A-t-il une superficie plus grande ou plus petite que ${round.currentCountry.name} ?`}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleChoice("higher")}
                        className="py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm sm:text-base rounded-2xl shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98"
                      >
                        <ArrowUp className="w-5 h-5 stroke-[3]" />
                        <span>Plus {currentMetric === "population" ? "Élevé" : "Grand"}</span>
                      </button>

                      <button
                        onClick={() => handleChoice("lower")}
                        className="py-3.5 px-4 bg-red-600 hover:bg-red-500 text-white font-black text-sm sm:text-base rounded-2xl shadow-lg shadow-red-900/40 flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98"
                      >
                        <ArrowDown className="w-5 h-5 stroke-[3]" />
                        <span>Plus {currentMetric === "population" ? "Faible" : "Petit"}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`w-full rounded-2xl p-4 text-center border animate-scaleUp ${
                      lastChoiceCorrect
                        ? "bg-emerald-950/60 border-emerald-500 text-emerald-300"
                        : "bg-red-950/60 border-red-500 text-red-300"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 mb-1 font-bold text-xs">
                      {lastChoiceCorrect ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Exact !</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 text-red-400" />
                          <span>Faux !</span>
                        </>
                      )}
                    </div>
                    <p className="text-2xl sm:text-3xl font-extrabold font-mono">
                      {formatMetricValue(
                        currentMetric === "population"
                          ? round.nextCountry.population
                          : round.nextCountry.areaKm2,
                        currentMetric,
                        language
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Game Over Recap Card */
          <div className="max-w-md mx-auto w-full bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl animate-scaleUp">
            <div className="w-20 h-20 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-orange-950">
              <Flame className="w-10 h-10 text-white" />
            </div>

            <div>
              <h2 className="text-3xl font-black text-white">Série Terminée !</h2>
              <p className="text-slate-400 mt-1 text-sm">
                Tu as enchaîné une belle série de comparaisons.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <div className="text-center">
                <p className="text-xs text-slate-400 font-bold uppercase">Ton Score</p>
                <p className="text-3xl font-black text-amber-400 mt-1">{streak}</p>
              </div>
              <div className="text-center border-l border-slate-700">
                <p className="text-xs text-slate-400 font-bold uppercase">Meilleur Record</p>
                <p className="text-3xl font-black text-white mt-1">{highScore}</p>
              </div>
            </div>

            {streak >= highScore && streak > 0 && (
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-500/40 py-2 rounded-xl">
                <Sparkles className="w-4 h-4" />
                <span>Nouveau Record Personnel Établi ! 🎉</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => handleStartGame()}
                className="flex-1 py-3 px-5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-950/40 flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Rejouer</span>
              </button>

              <button
                onClick={handleShare}
                className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>{copiedShare ? "Copié ! ✅" : "Partager"}</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
