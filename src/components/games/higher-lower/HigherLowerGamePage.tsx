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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col pb-28 safe-area-bottom">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/games")}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              title="Retour aux modes"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚖️</span>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-800">
                  Plus Grand ou Plus Petit
                </h1>
                <p className="text-xs text-slate-500 font-medium">Le duel des chiffres mondiaux</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Streak Counter */}
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3.5 py-1.5 rounded-full shadow-2xs">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <div className="text-xs font-black">
                <span className="text-amber-800">Série : </span>
                <span className="text-amber-950 text-sm">{streak}</span>
              </div>
            </div>

            {/* High Score */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 font-bold">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Record : </span>
              <span className="font-black text-slate-800">{highScore}</span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={handleSoundToggle}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              title={soundOn ? "Couper le son" : "Activer le son"}
            >
              {soundOn ? <Volume2 className="w-5 h-5 text-amber-600" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Metric Mode Filter Bar */}
      <div className="max-w-5xl mx-auto w-full px-4 pt-4 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-black">
          <button
            onClick={() => {
              setMetricMode("population");
              handleStartGame("population");
            }}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              metricMode === "population"
                ? "bg-white text-amber-900 shadow-sm border border-slate-200/80"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            👥 Population
          </button>
          <button
            onClick={() => {
              setMetricMode("area_km2");
              handleStartGame("area_km2");
            }}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              metricMode === "area_km2"
                ? "bg-white text-amber-900 shadow-sm border border-slate-200/80"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            📐 Superficie
          </button>
          <button
            onClick={() => {
              setMetricMode("random");
              handleStartGame("random");
            }}
            className={`px-3.5 py-1.5 rounded-xl transition-all ${
              metricMode === "random"
                ? "bg-white text-amber-900 shadow-sm border border-slate-200/80"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🎲 Aléatoire
          </button>
        </div>

        <span className="text-xs text-slate-500 font-bold bg-white px-3 py-1 rounded-xl border border-slate-200">
          Métrique : {currentMetric === "population" ? "Population" : "Superficie"}
        </span>
      </div>

      {/* Main Game Arena */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {!isGameOver ? (
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-stretch my-auto">
            {/* Card A : Pays de Référence (Valeur Connue) */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-between shadow-xs relative overflow-hidden group">
              <div className="w-full flex items-center justify-between text-xs text-slate-500 font-black uppercase tracking-wider">
                <span>Pays de référence</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-lg">{round.currentCountry.continent}</span>
              </div>

              <div className="my-6 text-center space-y-3">
                <span className="text-6xl sm:text-7xl block filter drop-shadow-md">
                  {round.currentCountry.flagEmoji}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-800">
                  {round.currentCountry.name}
                </h2>
                <p className="text-xs text-slate-500 font-bold">
                  Capitale : {round.currentCountry.capital}
                </p>
              </div>

              {/* Highlighted Value */}
              <div className="w-full bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 text-center">
                <p className="text-xs text-amber-800 font-black uppercase tracking-wider mb-1">
                  {currentMetric === "population" ? "Population" : "Superficie"}
                </p>
                <p className="text-2xl sm:text-3xl font-black text-amber-950 font-mono">
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
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center w-12 h-12 bg-amber-400 text-slate-900 rounded-full border-4 border-slate-100 shadow-xl font-black text-xs">
              VS
            </div>

            {/* Card B : Pays Challenger (À Deviner) */}
            <div
              className={`bg-white border-2 rounded-3xl p-6 sm:p-8 flex flex-col items-center justify-between shadow-xs relative overflow-hidden transition-all duration-300 ${
                revealed
                  ? lastChoiceCorrect
                    ? "border-emerald-500 ring-4 ring-emerald-100"
                    : "border-rose-500 ring-4 ring-rose-100"
                  : "border-slate-200"
              }`}
            >
              <div className="w-full flex items-center justify-between text-xs text-slate-500 font-black uppercase tracking-wider">
                <span>Challenger</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-lg">{round.nextCountry.continent}</span>
              </div>

              <div className="my-6 text-center space-y-3">
                <span className="text-6xl sm:text-7xl block filter drop-shadow-md">
                  {round.nextCountry.flagEmoji}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-800">
                  {round.nextCountry.name}
                </h2>
                <p className="text-xs text-slate-500 font-bold">
                  Capitale : {round.nextCountry.capital}
                </p>
              </div>

              {/* Interactive choice or revealed value */}
              <div className="w-full">
                {!revealed ? (
                  <div className="space-y-3">
                    <p className="text-xs text-center text-slate-500 font-bold mb-1">
                      {currentMetric === "population"
                        ? `A-t-il une population plus ou moins élevée que ${round.currentCountry.name} ?`
                        : `A-t-il une superficie plus grande ou plus petite que ${round.currentCountry.name} ?`}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleChoice("higher")}
                        className="py-4 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm sm:text-base rounded-2xl border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                      >
                        <ArrowUp className="w-5 h-5 stroke-[3]" />
                        <span>Plus {currentMetric === "population" ? "Élevé" : "Grand"}</span>
                      </button>

                      <button
                        onClick={() => handleChoice("lower")}
                        className="py-4 px-4 bg-rose-500 hover:bg-rose-600 text-white font-black text-sm sm:text-base rounded-2xl border-b-4 border-rose-700 active:border-b-0 active:translate-y-1 shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 transition-all"
                      >
                        <ArrowDown className="w-5 h-5 stroke-[3]" />
                        <span>Plus {currentMetric === "population" ? "Faible" : "Petit"}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`w-full rounded-2xl p-4 text-center border-2 animate-in zoom-in-95 ${
                      lastChoiceCorrect
                        ? "bg-emerald-50 border-emerald-500 text-emerald-950"
                        : "bg-rose-50 border-rose-500 text-rose-950"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 mb-1 font-black text-xs">
                      {lastChoiceCorrect ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                          <span>Exact !</span>
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 text-rose-600 stroke-[3]" />
                          <span>Faux !</span>
                        </>
                      )}
                    </div>
                    <p className="text-2xl sm:text-3xl font-black font-mono">
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
          <div className="max-w-md mx-auto w-full bg-white border-3 border-amber-400 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-orange-500/20">
              <Flame className="w-10 h-10 text-white" />
            </div>

            <div>
              <h2 className="text-3xl font-black text-slate-800">Série Terminée !</h2>
              <p className="text-slate-500 font-medium mt-1 text-sm">
                Vous avez enchaîné une belle série de comparaisons.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border-2 border-slate-200">
              <div className="text-center">
                <p className="text-xs text-slate-500 font-black uppercase">Votre Score</p>
                <p className="text-3xl font-black text-amber-600 mt-1">{streak}</p>
              </div>
              <div className="text-center border-l-2 border-slate-200">
                <p className="text-xs text-slate-500 font-black uppercase">Meilleur Record</p>
                <p className="text-3xl font-black text-slate-800 mt-1">{highScore}</p>
              </div>
            </div>

            {streak >= highScore && streak > 0 && (
              <div className="flex items-center justify-center gap-2 text-xs font-black text-emerald-800 bg-emerald-100 border border-emerald-300 py-2.5 rounded-2xl">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Nouveau Record Personnel Établi ! 🎉</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => handleStartGame()}
                className="flex-1 py-3.5 px-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-sm rounded-2xl border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                <span>Rejouer</span>
              </button>

              <button
                onClick={handleShare}
                className="py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm rounded-2xl border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 flex items-center justify-center gap-2 transition-all"
              >
                <Share2 className="w-4 h-4 stroke-[2.5]" />
                <span>{copiedShare ? "Copié ! ✅" : "Partager"}</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
