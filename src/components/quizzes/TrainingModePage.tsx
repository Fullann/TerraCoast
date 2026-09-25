import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  ArrowLeft,
  Search,
  X,
  Play,
  Sparkles,
  Clock,
  ShieldCheck,
  CheckCircle2,
  SlidersHorizontal,
  Flame,
  Zap,
  BookOpen,
  HelpCircle,
  Compass,
} from "lucide-react";
import type { Database } from "../../lib/database.types";
import { PATH_QUIZZES } from "../../lib/pathQuizzesData";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];

interface TrainingModePageProps {
  onNavigate?: (view: string, data?: unknown) => void;
}

export function TrainingModePage(_props: TrainingModePageProps = {}) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [questionCount, setQuestionCount] = useState(10);
  const [maxQuestions, setMaxQuestions] = useState(50);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMode, setSearchMode] = useState<"all" | "popular" | "short">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const configSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      const { data } = await supabase
        .from("quizzes")
        .select("*")
        .or("is_public.eq.true,is_global.eq.true")
        .order("total_plays", { ascending: false });

      // Extraire les quiz officiels intégrés pour garantir un catalogue toujours riche
      const officialPathQuizzes = Object.values(PATH_QUIZZES).map((bundle) => bundle.quiz as Quiz);
      const map = new Map<string, Quiz>();
      officialPathQuizzes.forEach((q) => map.set(q.id, q));
      if (data && data.length > 0) {
        data.forEach((q) => map.set(q.id, q as Quiz));
      }

      const list = Array.from(map.values());
      setQuizzes(list);

      // Pré-sélectionner le premier quiz populaire par défaut
      if (list.length > 0) {
        handleQuizSelection(list[0], false);
      }
    } catch (err) {
      console.warn("Could not fetch remote quizzes, using built-in quizzes:", err);
      const fallback = Object.values(PATH_QUIZZES).map((bundle) => bundle.quiz as Quiz);
      setQuizzes(fallback);
      if (fallback.length > 0) {
        handleQuizSelection(fallback[0], false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSelection = async (quiz: Quiz, shouldScroll: boolean = true) => {
    setSelectedQuiz(quiz);

    // Vérifier si c'est un quiz officiel embarqué
    if (PATH_QUIZZES[quiz.id]) {
      const count = PATH_QUIZZES[quiz.id].questions.length;
      setMaxQuestions(count);
      setQuestionCount(Math.min(10, count));
    } else {
      try {
        const { count } = await supabase
          .from("questions")
          .select("*", { count: "exact", head: true })
          .eq("quiz_id", quiz.id);

        const quizQuestionCount = count || 10;
        setMaxQuestions(quizQuestionCount);
        setQuestionCount(Math.min(10, quizQuestionCount));
      } catch {
        setMaxQuestions(10);
        setQuestionCount(10);
      }
    }

    if (shouldScroll && configSectionRef.current) {
      setTimeout(() => {
        configSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 80);
    }
  };

  const startTraining = () => {
    if (!selectedQuiz) return;
    navigate(`/quizzes/training/${selectedQuiz.id}?count=${questionCount}`);
  };

  const normalizedQuery = searchTerm.trim().toLowerCase();
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

  const categories = useMemo(() => {
    const set = new Set<string>();
    quizzes.forEach((q) => {
      if (q.category) set.add(q.category);
    });
    return Array.from(set).sort();
  }, [quizzes]);

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      const searchable = [
        quiz.title,
        quiz.description || "",
        quiz.category || "",
        quiz.difficulty || "",
        Array.isArray(quiz.tags) ? quiz.tags.join(" ") : "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery =
        queryTokens.length === 0 ||
        queryTokens.every((token) => searchable.includes(token));

      const matchesMode =
        searchMode === "all" ||
        (searchMode === "popular" && (quiz.total_plays || 0) >= 15) ||
        (searchMode === "short" && (quiz.time_limit_seconds || 30) <= 20);

      const matchesCategory =
        selectedCategory === "all" || quiz.category === selectedCategory;

      return matchesQuery && matchesMode && matchesCategory;
    });
  }, [quizzes, queryTokens, searchMode, selectedCategory]);

  const estimatedMinutes = selectedQuiz
    ? Math.max(
        1,
        Math.ceil(
          (questionCount * Math.max(12, selectedQuiz.time_limit_seconds || 25)) / 60
        )
      )
    : 0;

  // Presets de questions rapides
  const questionPresets = useMemo(() => {
    const raw = [5, 10, 15, 20, maxQuestions].filter((v) => v <= maxQuestions);
    return Array.from(new Set(raw));
  }, [maxQuestions]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/quizzes")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition text-xs sm:text-sm font-bold active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t("common.back") || "Retour"}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono">
              Espace Révision
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-8 space-y-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/30 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Entraînement Libre & Sans Pression</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Mode Entraînement</span>
              <span className="text-3xl sm:text-4xl">🧘</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Révisez vos connaissances à votre rythme. Aucun chronomètre pour vous stresser, aucune vie perdue,
              et un feedback pédagogique immédiat avec explications pour progresser sereinement.
            </p>
          </div>

          {/* 4 Feature Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800/80">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-black text-white">Zéro Chrono</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Prenez tout votre temps pour analyser</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-black text-white">Feedback Immédiat</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Explications et réponses détaillées</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-black text-white">Sur Mesure</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">De 5 questions à l'intégralité</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-black text-white">Sans Risque</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Aucune vie perdue ni impact de ligue</p>
              </div>
            </div>
          </div>
        </section>

        {/* STEP 1: Quiz Selector Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-mono text-sm border border-emerald-500/40">
                  1
                </span>
                <span>Choisissez un questionnaire</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Sélectionnez le thème ou le pays sur lequel vous souhaitez vous entraîner
              </p>
            </div>

            {/* Total count badge */}
            <span className="text-xs font-bold text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
              {filteredQuizzes.length} quiz disponibles
            </span>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-3 sm:p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Rechercher par titre, capitale, pays, océan, tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition"
                  title="Effacer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => {
                  setSearchMode("all");
                  setSelectedCategory("all");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  searchMode === "all" && selectedCategory === "all"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span>🌍 Tous</span>
              </button>

              <button
                type="button"
                onClick={() => setSearchMode(searchMode === "popular" ? "all" : "popular")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  searchMode === "popular"
                    ? "bg-amber-600 text-white shadow-md shadow-amber-950"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Populaires</span>
              </button>

              <button
                type="button"
                onClick={() => setSearchMode(searchMode === "short" ? "all" : "short")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  searchMode === "short"
                    ? "bg-sky-600 text-white shadow-md shadow-sky-950"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-sky-400" />
                <span>Quiz Rapides</span>
              </button>

              {/* Category tags */}
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(selectedCategory === cat ? "all" : cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition capitalize ${
                    selectedCategory === cat
                      ? "bg-teal-600 text-white shadow-md shadow-teal-950"
                      : "bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  #{cat}
                </button>
              ))}
            </div>
          </div>

          {/* Quiz Cards Grid */}
          {loading ? (
            <div className="py-16 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent mx-auto" />
              <p className="text-xs text-slate-400 mt-3">Chargement des questionnaires...</p>
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 p-6 space-y-2">
              <p className="text-slate-300 font-bold">Aucun quiz ne correspond à votre recherche</p>
              <p className="text-xs text-slate-500">Essayez de retirer vos filtres ou de chercher un autre mot-clé.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSearchMode("all");
                  setSelectedCategory("all");
                }}
                className="mt-3 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredQuizzes.map((quiz) => {
                const isSelected = selectedQuiz?.id === quiz.id;
                return (
                  <div
                    key={quiz.id}
                    onClick={() => handleQuizSelection(quiz)}
                    className={`group relative rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between border-2 select-none ${
                      isSelected
                        ? "bg-slate-900 border-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.25)] scale-[1.01]"
                        : "bg-slate-900/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                            {quiz.category || "Géographie"}
                          </span>
                          {quiz.difficulty && (
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg border ${
                                quiz.difficulty === "easy"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                  : quiz.difficulty === "medium"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                  : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                              }`}
                            >
                              {quiz.difficulty === "easy"
                                ? "Facile"
                                : quiz.difficulty === "medium"
                                ? "Moyen"
                                : "Difficile"}
                            </span>
                          )}
                        </div>

                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-slate-700 group-hover:border-slate-500 shrink-0" />
                        )}
                      </div>

                      {/* Title & Description */}
                      <h3
                        className={`font-black text-sm sm:text-base leading-snug line-clamp-1 transition-colors ${
                          isSelected ? "text-emerald-300" : "text-white group-hover:text-emerald-400"
                        }`}
                      >
                        {quiz.title}
                      </h3>
                      {quiz.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                          {quiz.description}
                        </p>
                      )}
                    </div>

                    {/* Footer Info */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                        {quiz.total_plays || 0} parties
                      </span>
                      <span className="flex items-center gap-1 text-slate-400 font-medium">
                        <Compass className="w-3.5 h-3.5 text-slate-500" />
                        Sélectionner
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* STEP 2: Configuration & Launch Section */}
        {selectedQuiz && (
          <section
            ref={configSectionRef}
            className="rounded-3xl p-6 sm:p-8 bg-slate-900 border-2 border-emerald-500/40 shadow-2xl space-y-6 animate-scale-in"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-mono text-sm border border-emerald-500/40">
                    2
                  </span>
                  <span>Réglez la taille de votre séance</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Quiz sélectionné : <strong className="text-emerald-400">{selectedQuiz.title}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Durée estimée : ~{estimatedMinutes} min</span>
              </div>
            </div>

            {/* Quick Presets Pills */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 block">
                Nombre de questions souhaité :
              </label>

              <div className="flex flex-wrap gap-2">
                {questionPresets.map((val) => {
                  const isActive = questionCount === val;
                  const isMax = val === maxQuestions;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setQuestionCount(val)}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition transform active:scale-95 flex items-center gap-1.5 ${
                        isActive
                          ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                      }`}
                    >
                      <span>{val} questions</span>
                      {isMax && (
                        <span className="text-[10px] font-mono uppercase bg-slate-950/20 px-1 rounded">
                          Max
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Interactive Range Slider */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Curseur libre :</span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  {questionCount} / {maxQuestions} questions
                </span>
              </div>

              <input
                type="range"
                min="1"
                max={maxQuestions}
                step="1"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />

              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>1 question (Flash)</span>
                <span>{maxQuestions} questions (Intégral)</span>
              </div>
            </div>

            {/* Launch Action Button */}
            <button
              type="button"
              onClick={startTraining}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-base sm:text-lg shadow-xl shadow-emerald-950/60 transition transform active:scale-[0.99] flex items-center justify-center gap-3 animate-pulse hover:animate-none cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Lancer l'entraînement ({questionCount} questions) 🚀</span>
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
