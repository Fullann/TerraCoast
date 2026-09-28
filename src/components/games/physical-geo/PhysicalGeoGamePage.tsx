import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Waves,
  Mountain,
  Ship,
  Landmark,
  Sparkles,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  Lightbulb,
  ArrowRight,
  Flame,
  Timer,
  Camera,
} from "lucide-react";
import { PHYSICAL_GEO_ITEMS, PhysicalGeoItem } from "../../../lib/physicalGeoData";
import { useAuth } from "../../../contexts/AuthContext";
import { playSound } from "../../../lib/soundManager";
import { triggerConfetti } from "../../common/Confetti";
import { toast } from "../../common/ToastContainer";
import { addGems } from "../../../lib/gamificationManager";
import { savePhysicalGeoRecord } from "../../../lib/gameRecordsManager";

const CHRONO_DURATION_SECONDS = 60;

export function PhysicalGeoGamePage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [gameMode, setGameMode] = useState<"zen" | "chrono">("zen");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [chronoAnswers, setChronoAnswers] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(CHRONO_DURATION_SECONDS);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Filtrer et mélanger les questions selon la catégorie
  const questions: PhysicalGeoItem[] = useMemo(() => {
    let pool = PHYSICAL_GEO_ITEMS;
    if (selectedCategory !== "all") {
      pool = PHYSICAL_GEO_ITEMS.filter((item) => item.category === selectedCategory);
    }
    return [...pool].sort(() => 0.5 - Math.random());
  }, [selectedCategory]);

  const currentItem = questions[currentIndex % questions.length] || questions[0];

  // Gestion du chronomètre 60 secondes
  useEffect(() => {
    if (gameMode !== "chrono" || isGameOver) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsGameOver(true);
          playSound("fanfare");
          triggerConfetti();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameMode, isGameOver]);

  // Sauvegarde du score lors de la fin de partie
  useEffect(() => {
    if (isGameOver) {
      savePhysicalGeoRecord(score, chronoAnswers);
    }
  }, [isGameOver, score, chronoAnswers]);

  const handleSelectOption = (index: number) => {
    if (isAnswered || isGameOver) return;
    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === currentItem.correctIndex;
    if (isCorrect) {
      playSound("correct");
      const multiplier = combo >= 3 ? 2 : combo >= 1 ? 1.5 : 1;
      setScore((s) => s + Math.round(100 * multiplier));
      setCombo((c) => c + 1);
      setChronoAnswers((a) => a + 1);
    } else {
      playSound("wrong");
      setCombo(0);
    }

    // En mode chrono, auto-avance rapide pour un rythme survitaminé
    if (gameMode === "chrono") {
      setTimeout(() => {
        handleNext();
      }, 700);
    }
  };

  const handleNext = () => {
    if (gameMode === "chrono") {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      return;
    }

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsGameOver(true);
      if (score >= questions.length * 70) {
        playSound("fanfare");
        triggerConfetti();
        addGems(profile?.id, 30);
        toast.success("Bravo ! Géographie physique maîtrisée (+30 💎) !");
      }
    }
  };

  const handleRestart = (newCategory?: string, newMode: "zen" | "chrono" = gameMode) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (newCategory) setSelectedCategory(newCategory);
    setGameMode(newMode);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setCombo(0);
    setChronoAnswers(0);
    setTimeLeft(CHRONO_DURATION_SECONDS);
    setIsGameOver(false);
  };

  const categories = [
    { id: "all", label: "Grand Chelem 🌍", icon: Sparkles },
    { id: "rivers", label: "Grands Fleuves 🌊", icon: Waves },
    { id: "mountains", label: "Sommets & Reliefs 🏔️", icon: Mountain },
    { id: "straits", label: "Détroits & Canaux 🚢", icon: Ship },
    { id: "wonders", label: "Merveilles UNESCO 🏛️", icon: Landmark },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-6 px-3 sm:px-6 pb-28">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/games")}
            className="p-2.5 rounded-2xl bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 shadow-xs transition-all flex items-center gap-2 text-xs font-black w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Hub des Jeux</span>
          </button>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-200/80 rounded-2xl p-1 text-xs font-black">
              <button
                type="button"
                onClick={() => handleRestart(undefined, "zen")}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  gameMode === "zen"
                    ? "bg-white text-emerald-800 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🧘 Mode Zen
              </button>
              <button
                type="button"
                onClick={() => handleRestart(undefined, "chrono")}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  gameMode === "chrono"
                    ? "bg-rose-500 text-white shadow-sm border border-rose-600 animate-pulse"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>Course 60s ⚡</span>
              </button>
            </div>

            {/* Timer Capsule in Chrono Mode */}
            {gameMode === "chrono" && !isGameOver && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-black border-2 transition-all ${
                  timeLeft <= 15
                    ? "bg-rose-100 text-rose-800 border-rose-300 animate-bounce"
                    : "bg-amber-50 text-amber-900 border-amber-300"
                }`}
              >
                <Timer className="w-3.5 h-3.5 text-amber-600" />
                <span>{timeLeft}s</span>
              </div>
            )}

            {/* Score & Combo */}
            <div className="flex items-center gap-2">
              {combo >= 2 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-700 text-xs font-black animate-pulse">
                  <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>x{combo}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-white border-2 border-slate-200 text-slate-800 text-xs font-black shadow-xs">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>{score} pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Pills (Zen Mode) */}
        {gameMode === "zen" && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none animate-fadeIn">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleRestart(cat.id, "zen")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all border-2 ${
                    isSelected
                      ? "bg-teal-500 text-white border-teal-600 shadow-xs border-b-4 border-b-teal-700"
                      : "bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300 shadow-xs"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {!isGameOver && currentItem ? (
          <div className="space-y-5 animate-fade-in">
            {/* Question Card */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-7 shadow-xs relative overflow-hidden">
              {/* 📸 HD Photograph Banner if available */}
              {currentItem.photoUrl && (
                <div className="relative w-full h-48 sm:h-60 rounded-2xl overflow-hidden mb-5 border border-slate-200/90 shadow-inner group">
                  <img
                    src={currentItem.photoUrl}
                    alt={currentItem.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs font-black">
                    <span className="bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 flex items-center gap-1.5 shadow-sm">
                      <Camera className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Photographie HD</span>
                    </span>
                    <span className="drop-shadow-md text-[11px] font-bold text-slate-200">
                      📍 {currentItem.location}
                    </span>
                  </div>
                </div>
              )}

              {/* Top Meta Bar */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl">{currentItem.emoji}</span>
                  <div>
                    <h3 className="text-base font-black text-slate-900">{currentItem.name}</h3>
                    <p className="text-xs text-teal-600 font-extrabold">
                      {currentItem.metric} • {currentItem.location}
                    </p>
                  </div>
                </div>

                <div className="text-xs font-black px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
                  {gameMode === "chrono"
                    ? `Réussis : ${chronoAnswers}`
                    : `Question ${currentIndex + 1} / ${questions.length}`}
                </div>
              </div>

              {/* Question Text */}
              <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug mb-6">
                {currentItem.question}
              </h2>

              {/* 4 Tactile Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {currentItem.options.map((option, idx) => {
                  const isChosen = selectedOption === idx;
                  const isCorrect = idx === currentItem.correctIndex;

                  let btnStyle =
                    "bg-slate-50 text-slate-800 border-slate-200 border-b-4 border-b-slate-300 hover:bg-slate-100 hover:border-teal-300 active:border-b-2 active:translate-y-0.5";
                  let badgeStyle = "bg-slate-200 text-slate-700";

                  if (isAnswered) {
                    if (isCorrect) {
                      btnStyle =
                        "bg-emerald-500 text-white border-emerald-600 border-b-4 border-b-emerald-700 shadow-md";
                      badgeStyle = "bg-emerald-600 text-white";
                    } else if (isChosen && !isCorrect) {
                      btnStyle =
                        "bg-rose-500 text-white border-rose-600 border-b-4 border-b-rose-700";
                      badgeStyle = "bg-rose-600 text-white";
                    } else {
                      btnStyle =
                        "bg-slate-50 text-slate-400 border-slate-100 border-b-2 border-b-slate-200 opacity-50";
                      badgeStyle = "bg-slate-100 text-slate-400";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(idx)}
                      className={`p-4 rounded-2xl border-2 text-left font-black text-sm transition-all duration-150 flex items-center justify-between gap-3 ${btnStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${badgeStyle}`}
                        >
                          {["A", "B", "C", "D"][idx]}
                        </span>
                        <span>{option}</span>
                      </div>

                      {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-white shrink-0" />}
                      {isAnswered && isChosen && !isCorrect && (
                        <XCircle className="w-5 h-5 text-white shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation & Anecdote Reveal Card in Zen Mode */}
              {isAnswered && gameMode === "zen" && (
                <div className="mt-6 pt-5 border-t border-slate-200 space-y-3 animate-fade-in">
                  <div className="p-4 bg-teal-50 rounded-2xl border-2 border-teal-200 text-xs leading-relaxed space-y-2">
                    <div className="flex items-center gap-2 text-teal-800 font-black">
                      <Lightbulb className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>Explication Géographique :</span>
                    </div>
                    <p className="text-slate-700 font-medium">{currentItem.explanation}</p>

                    <div className="pt-2 text-slate-600 font-medium">
                      <strong className="text-slate-800">Le saviez-vous ?</strong> {currentItem.anecdote}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black border-2 border-emerald-600 border-b-4 border-b-emerald-700 active:border-b-0 active:translate-y-1 shadow-md flex items-center justify-center gap-2 transition-all"
                  >
                    <span>
                      {currentIndex + 1 < questions.length
                        ? "Question Suivante"
                        : "Voir mon Résultat 🏆"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Game Over Summary */
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-xs animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-amber-50 border-2 border-amber-200 text-4xl flex items-center justify-center mx-auto shadow-xs">
              {gameMode === "chrono" ? "⚡" : "🏆"}
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900">
                {gameMode === "chrono" ? "Course 60s Terminée !" : "Quiz Géographie Physique Terminé !"}
              </h3>
              <p className="text-sm text-slate-600 mt-1 font-medium">
                {gameMode === "chrono" ? (
                  <>
                    Vous avez réussi <strong className="text-emerald-600">{chronoAnswers} questions</strong>{" "}
                    en 60 secondes pour un score total de{" "}
                    <strong className="text-teal-600">{score} points</strong> !
                  </>
                ) : (
                  <>
                    Vous avez accumulé un score de{" "}
                    <strong className="text-teal-600">{score} points</strong> sur{" "}
                    {questions.length} merveilles terrestres.
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleRestart(undefined, gameMode)}
                className="py-3 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black border-2 border-emerald-600 border-b-4 border-b-emerald-700 active:border-b-0 active:translate-y-1 shadow-xs flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Rejouer ({gameMode === "chrono" ? "Chrono 60s" : "Même Thème"})</span>
              </button>

              <button
                type="button"
                onClick={() => handleRestart(undefined, gameMode === "chrono" ? "zen" : "chrono")}
                className="py-3 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black border-2 border-amber-600 border-b-4 border-b-amber-700 active:border-b-0 active:translate-y-1 shadow-xs flex items-center justify-center gap-2 transition-all"
              >
                <span>Changer de Mode ({gameMode === "chrono" ? "Passer en Zen" : "Essayer Chrono 60s"})</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/games")}
                className="py-3 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black border-2 border-slate-200 border-b-4 border-b-slate-300 active:border-b-0 active:translate-y-1 shadow-xs flex items-center justify-center gap-2 transition-all"
              >
                <span>Hub des Jeux 🕹️</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
