import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Timer,
  Zap,
  Flame,
  Trophy,
  Volume2,
  VolumeX,
  RotateCcw,
  Share2,
  Sparkles,
} from "lucide-react";
import {
  generateChronoRushQuestion,
  getComboMultiplier,
  getChronoRushHighScore,
  saveChronoRushHighScore,
  CHRONO_RUSH_CONFIG,
  type ChronoRushQuestion,
  type ChronoRushOption,
} from "../../../lib/chronoRushGame";
import { useLanguage } from "../../../contexts/LanguageContext";
import { triggerConfetti } from "../../common/Confetti";
import {
  isSoundEnabled,
  toggleSound,
  playCorrectSound,
  playIncorrectSound,
  playTickSound,
  playVictoryFanfare,
  playClickSound,
} from "../../../lib/soundManager";

export function ChronoRushGamePage() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const [timeLeft, setTimeLeft] = useState(CHRONO_RUSH_CONFIG.initialTimeSeconds);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const [score, setScore] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => getChronoRushHighScore());

  const [currentQuestion, setCurrentQuestion] = useState<ChronoRushQuestion | null>(null);
  const [recentIso3s, setRecentIso3s] = useState<string[]>([]);
  const [timeDeltaBadge, setTimeDeltaBadge] = useState<{ text: string; isPositive: boolean } | null>(null);
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());
  const [copiedShare, setCopiedShare] = useState(false);

  const timerRef = useRef<any>(null);

  const handleSoundToggle = () => {
    const next = toggleSound();
    setSoundOn(next);
  };

  // Démarrage d'une partie
  const startGame = () => {
    playClickSound();
    setTimeLeft(CHRONO_RUSH_CONFIG.initialTimeSeconds);
    setScore(0);
    setCurrentStreak(0);
    setMaxStreak(0);
    setTotalQuestions(0);
    setCorrectAnswers(0);
    setIsGameOver(false);
    setIsPlaying(true);
    setCopiedShare(false);

    const firstQ = generateChronoRushQuestion(language, []);
    setCurrentQuestion(firstQ);
    setRecentIso3s([firstQ.targetCountry.iso3]);
  };

  // Décompte du chronomètre
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsPlaying(false);
          setIsGameOver(true);
          playVictoryFanfare();
          return 0;
        }

        if (prev <= 6) {
          playTickSound(true);
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isPlaying, isGameOver]);

  // Fin de partie : vérification du record
  useEffect(() => {
    if (isGameOver) {
      const isNewBest = saveChronoRushHighScore(score);
      if (isNewBest) {
        setHighScore(score);
        triggerConfetti();
      }
    }
  }, [isGameOver, score]);

  // Réponse du joueur
  const handleAnswer = (option: ChronoRushOption) => {
    if (!isPlaying || isGameOver || !currentQuestion) return;

    setTotalQuestions((q) => q + 1);

    if (option.isCorrect) {
      playCorrectSound();
      const nextStreak = currentStreak + 1;
      setCurrentStreak(nextStreak);
      if (nextStreak > maxStreak) setMaxStreak(nextStreak);

      const combo = getComboMultiplier(nextStreak);
      const points = CHRONO_RUSH_CONFIG.basePoints * combo;
      setScore((s) => s + points);
      setCorrectAnswers((c) => c + 1);

      // Bonus temps (+3s, plafonné à maxTimeSeconds)
      setTimeLeft((t) => Math.min(CHRONO_RUSH_CONFIG.maxTimeSeconds, t + CHRONO_RUSH_CONFIG.bonusTimeCorrect));
      setTimeDeltaBadge({ text: `+${CHRONO_RUSH_CONFIG.bonusTimeCorrect}s`, isPositive: true });
    } else {
      playIncorrectSound();
      setCurrentStreak(0);

      // Pénalité temps (-5s)
      setTimeLeft((t) => {
        const next = Math.max(0, t - CHRONO_RUSH_CONFIG.penaltyTimeWrong);
        if (next === 0) {
          setIsPlaying(false);
          setIsGameOver(true);
        }
        return next;
      });
      setTimeDeltaBadge({ text: `-${CHRONO_RUSH_CONFIG.penaltyTimeWrong}s`, isPositive: false });
    }

    setTimeout(() => {
      setTimeDeltaBadge(null);
    }, 800);

    // Nouvelle question
    const nextQ = generateChronoRushQuestion(language, recentIso3s);
    setCurrentQuestion(nextQ);
    setRecentIso3s((prev) => [...prev.slice(-6), nextQ.targetCountry.iso3]);
  };

  const handleShare = () => {
    playClickSound();
    const text = `⚡ TerraCoast Chrono Rush / Survie\n🏆 Score : ${score} pts\n🔥 Série max : ${maxStreak} d'affilée\n🎯 Précision : ${
      totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
    }%\n🌍 Essaye de battre mon score : https://terracoast.ch/games/chrono-rush`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    });
  };

  const comboMultiplier = getComboMultiplier(currentStreak);
  const timePercentage = Math.min(100, (timeLeft / CHRONO_RUSH_CONFIG.maxTimeSeconds) * 100);

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
              <span className="text-2xl">⚡</span>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-amber-400 via-rose-400 to-red-500 bg-clip-text text-transparent">
                  Chrono Rush
                </h1>
                <p className="text-xs text-slate-400">45 secondes sous haute tension</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Combo Badge */}
            {comboMultiplier > 1 && isPlaying && (
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-600 text-white font-black text-xs px-3 py-1.5 rounded-full shadow-lg shadow-red-950 animate-bounce">
                <Flame className="w-4 h-4" />
                <span>COMBO x{comboMultiplier} !</span>
              </div>
            )}

            {/* Score */}
            <div className="bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-700 text-xs font-bold text-slate-300">
              Score : <span className="text-amber-400 font-mono text-sm">{score}</span>
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

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {!isPlaying && !isGameOver ? (
          /* Start Screen */
          <div className="max-w-md mx-auto w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-rose-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-rose-950">
              <Zap className="w-10 h-10 text-white" />
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Chrono Rush</h2>
              <p className="text-slate-400 text-sm mt-2">
                Réponds au maximum de questions géographiques avant que le temps ne soit écoulé !
              </p>
            </div>

            <div className="bg-slate-800/60 rounded-2xl p-4 text-xs text-slate-300 space-y-2 text-left border border-slate-700/60">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Bonne réponse : <strong>+3 secondes</strong> & points combo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span>Mauvaise réponse : <strong>-5 secondes</strong> de pénalité</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Enchaîne 3+ bonnes réponses pour débloquer les combos</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                Record personnel :
              </span>
              <span className="font-bold text-white font-mono text-sm">{highScore} pts</span>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 hover:brightness-110 text-white font-black text-lg rounded-2xl shadow-xl shadow-rose-950/50 transition-all transform hover:scale-102 active:scale-98"
            >
              Lancer le Chrono 🚀
            </button>
          </div>
        ) : isPlaying && currentQuestion ? (
          /* Active Game Session */
          <div className="space-y-6 my-auto">
            {/* Timer Bar & Alert */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-bold">
                <span className="flex items-center gap-2 text-slate-300">
                  <Timer className={`w-5 h-5 ${timeLeft <= 8 ? "text-red-500 animate-spin" : "text-amber-400"}`} />
                  Temps restant
                </span>

                <div className="flex items-center gap-3">
                  {/* Floating Time Delta Badge */}
                  {timeDeltaBadge && (
                    <span
                      className={`text-xs font-mono font-black px-2 py-0.5 rounded-full animate-bounce ${
                        timeDeltaBadge.isPositive
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-red-500/20 text-red-400 border border-red-500/40"
                      }`}
                    >
                      {timeDeltaBadge.text}
                    </span>
                  )}

                  <span
                    className={`font-mono text-2xl font-black ${
                      timeLeft <= 8 ? "text-red-400 animate-pulse" : "text-white"
                    }`}
                  >
                    {timeLeft}s
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    timeLeft <= 8
                      ? "bg-gradient-to-r from-red-600 to-rose-500"
                      : timeLeft <= 15
                      ? "bg-gradient-to-r from-amber-500 to-orange-500"
                      : "bg-gradient-to-r from-emerald-500 to-teal-400"
                  }`}
                  style={{ width: `${timePercentage}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl relative overflow-hidden">
              <span className="text-xs uppercase font-bold tracking-widest text-slate-500 block">
                Question Rapide
              </span>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-200">
                {currentQuestion.prompt}
              </h2>

              {currentQuestion.subPrompt && (
                <div className="text-3xl sm:text-4xl font-extrabold text-white py-2">
                  {currentQuestion.subPrompt}
                </div>
              )}

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                {currentQuestion.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleAnswer(opt)}
                    className="p-4 bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-700 border border-slate-700 hover:border-amber-500/50 rounded-2xl text-base sm:text-lg font-bold text-slate-100 transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-101 active:scale-98"
                  >
                    {opt.flagEmoji && <span className="text-2xl">{opt.flagEmoji}</span>}
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Game Over Screen */
          <div className="max-w-md mx-auto w-full bg-slate-900 border-2 border-rose-500/50 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl animate-scaleUp">
            <div className="w-20 h-20 bg-gradient-to-tr from-rose-500 to-red-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-red-950">
              <Timer className="w-10 h-10 text-white" />
            </div>

            <div>
              <h2 className="text-3xl font-black text-white">Temps Écoulé !</h2>
              <p className="text-slate-400 text-sm mt-1">Superbe session de vitesse.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Score Final</p>
                <p className="text-3xl font-black text-amber-400 mt-1 font-mono">{score}</p>
              </div>
              <div className="border-l border-slate-700">
                <p className="text-xs text-slate-400 font-bold uppercase">Série Max</p>
                <p className="text-3xl font-black text-white mt-1 font-mono">{maxStreak}</p>
              </div>
              <div className="pt-3 border-t border-slate-700">
                <p className="text-xs text-slate-400 font-bold uppercase">Précision</p>
                <p className="text-xl font-bold text-emerald-400 mt-1 font-mono">
                  {totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0}%
                </p>
              </div>
              <div className="pt-3 border-t border-l border-slate-700">
                <p className="text-xs text-slate-400 font-bold uppercase">Record</p>
                <p className="text-xl font-bold text-white mt-1 font-mono">{highScore}</p>
              </div>
            </div>

            {score >= highScore && score > 0 && (
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-300 bg-amber-950/50 border border-amber-500/40 py-2 rounded-xl">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Nouveau Record Chrono Battu ! 🎉</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={startGame}
                className="flex-1 py-3 px-5 bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 hover:brightness-110 text-white font-bold rounded-xl shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 transition-all"
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
