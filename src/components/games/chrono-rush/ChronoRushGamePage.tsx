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
import { saveChronoRushRecord } from "../../../lib/gameRecordsManager";
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
      saveChronoRushRecord(score, correctAnswers);
      const isNewBest = saveChronoRushHighScore(score);
      if (isNewBest) {
        setHighScore(score);
        triggerConfetti();
      }
    }
  }, [isGameOver, score, correctAnswers]);

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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col pb-28 safe-area-bottom">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/games")}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              title="Retour aux modes"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-800">
                  Chrono Rush
                </h1>
                <p className="text-xs text-slate-500 font-medium">45 secondes sous haute tension</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Combo Badge */}
            {comboMultiplier > 1 && isPlaying && (
              <div className="flex items-center gap-1.5 bg-orange-100 text-orange-800 border border-orange-300 font-black text-xs px-3 py-1.5 rounded-full shadow-xs animate-bounce">
                <Flame className="w-4 h-4 text-orange-600 fill-orange-600" />
                <span>COMBO x{comboMultiplier} !</span>
              </div>
            )}

            {/* Score */}
            <div className="bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-200 text-xs font-black text-amber-900 shadow-2xs">
              Score : <span className="text-amber-600 font-mono text-sm">{score}</span>
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

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {!isPlaying && !isGameOver ? (
          /* Start Screen */
          <div className="max-w-md mx-auto w-full bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-xs">
            <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
              <Zap className="w-10 h-10 text-white" />
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800">Chrono Rush</h2>
              <p className="text-slate-500 text-sm mt-2 font-medium">
                Répondez au maximum de questions géographiques avant la fin du compte à rebours !
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-700 space-y-2.5 text-left border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Bonne réponse : <strong className="text-emerald-700">+3 secondes</strong> & points combo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <span>Mauvaise réponse : <strong className="text-rose-700">-5 secondes</strong> de pénalité</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span>Enchaînez 3+ bonnes réponses pour débloquer les combos</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 font-bold bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                Record personnel :
              </span>
              <span className="font-black text-slate-800 font-mono text-sm">{highScore} pts</span>
            </div>

            <button
              onClick={startGame}
              className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-black text-lg rounded-2xl border-b-4 border-rose-700 active:border-b-0 active:translate-y-1 shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-2"
            >
              <span>Lancer le Chrono</span>
              <span>🚀</span>
            </button>
          </div>
        ) : isPlaying && currentQuestion ? (
          /* Active Game Session */
          <div className="space-y-6 my-auto">
            {/* Timer Bar & Alert */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-bold">
                <span className="flex items-center gap-2 text-slate-700">
                  <Timer className={`w-5 h-5 ${timeLeft <= 8 ? "text-rose-500 animate-spin" : "text-amber-500"}`} />
                  Temps restant
                </span>

                <div className="flex items-center gap-3">
                  {/* Floating Time Delta Badge */}
                  {timeDeltaBadge && (
                    <span
                      className={`text-xs font-mono font-black px-2.5 py-0.5 rounded-full animate-bounce ${
                        timeDeltaBadge.isPositive
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-rose-100 text-rose-800 border border-rose-300"
                      }`}
                    >
                      {timeDeltaBadge.text}
                    </span>
                  )}

                  <span
                    className={`font-mono text-2xl font-black ${
                      timeLeft <= 8 ? "text-rose-600 animate-pulse" : "text-slate-800"
                    }`}
                  >
                    {timeLeft}s
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-3.5 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    timeLeft <= 8
                      ? "bg-rose-500"
                      : timeLeft <= 15
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${timePercentage}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-xs relative overflow-hidden">
              <span className="text-xs uppercase font-black tracking-widest text-slate-400 block">
                Question Rapide
              </span>

              <h2 className="text-xl sm:text-2xl font-black text-slate-800">
                {currentQuestion.prompt}
              </h2>

              {currentQuestion.subPrompt && (
                <div className="text-3xl sm:text-4xl font-black text-slate-900 py-2">
                  {currentQuestion.subPrompt}
                </div>
              )}

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                {currentQuestion.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleAnswer(opt)}
                    className="p-4 min-h-[56px] bg-white hover:bg-slate-50 active:bg-slate-100 border-2 border-slate-200 hover:border-amber-400 rounded-2xl text-base sm:text-lg font-black text-slate-800 transition-all flex items-center justify-center gap-3 shadow-xs border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 cursor-pointer"
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
          <div className="max-w-md mx-auto w-full bg-white border-3 border-rose-400 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="w-20 h-20 bg-gradient-to-tr from-rose-500 to-red-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
              <Timer className="w-10 h-10 text-white" />
            </div>

            <div>
              <h2 className="text-3xl font-black text-slate-800">Temps Écoulé !</h2>
              <p className="text-slate-500 text-sm mt-1 font-medium">Superbe session de vitesse.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border-2 border-slate-200">
              <div>
                <p className="text-xs text-slate-500 font-black uppercase">Score Final</p>
                <p className="text-3xl font-black text-amber-600 mt-1 font-mono">{score}</p>
              </div>
              <div className="border-l-2 border-slate-200">
                <p className="text-xs text-slate-500 font-black uppercase">Série Max</p>
                <p className="text-3xl font-black text-slate-800 mt-1 font-mono">{maxStreak}</p>
              </div>
              <div className="pt-3 border-t-2 border-slate-200">
                <p className="text-xs text-slate-500 font-black uppercase">Précision</p>
                <p className="text-xl font-black text-emerald-600 mt-1 font-mono">
                  {totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0}%
                </p>
              </div>
              <div className="pt-3 border-t-2 border-l-2 border-slate-200">
                <p className="text-xs text-slate-500 font-black uppercase">Record</p>
                <p className="text-xl font-black text-slate-800 mt-1 font-mono">{highScore}</p>
              </div>
            </div>

            {score >= highScore && score > 0 && (
              <div className="flex items-center justify-center gap-2 text-xs font-black text-amber-900 bg-amber-100 border border-amber-300 py-2.5 rounded-2xl">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Nouveau Record Chrono Battu ! 🎉</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={startGame}
                className="flex-1 py-3.5 px-5 bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 text-white font-black text-sm rounded-2xl border-b-4 border-rose-700 active:border-b-0 active:translate-y-1 shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 transition-all"
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
