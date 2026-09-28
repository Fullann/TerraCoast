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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col pb-20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b-2 border-slate-200 px-4 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/quizzes")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 text-slate-700 hover:text-slate-900 transition text-xs sm:text-sm font-black active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t("common.back") || "Retour"}</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-mono">
              Espace Révision
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 sm:py-8 space-y-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-white border-2 border-slate-200 shadow-xs space-y-3">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Entraînement Libre & Sans Pression</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <span>Mode Entraînement</span>
              <span className="text-3xl sm:text-4xl">🧘</span>
            </h1>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
              Révisez vos connaissances à votre rythme. Aucun chronomètre pour vous stresser, aucune vie perdue,
              et un feedback pédagogique immédiat avec explications pour progresser sereinement.
            </p>
          </div>

          {/* 4 Feature Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t-2 border-slate-100">
            <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-start gap-3 shadow-2xs">
              <div className="p-2 rounded-xl bg-sky-100 text-sky-700 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-black text-slate-900">Zéro Chrono</h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Prenez tout votre temps pour analyser</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-start gap-3 shadow-2xs">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-black text-slate-900">Feedback Immédiat</h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Explications et réponses détaillées</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-start gap-3 shadow-2xs">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-black text-slate-900">Sur Mesure</h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">De 5 questions à l'intégralité</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-start gap-3 shadow-2xs">
              <div className="p-2 rounded-xl bg-teal-100 text-teal-700 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-black text-slate-900">Sans Risque</h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Aucune vie perdue ni impact de ligue</p>
              </div>
            </div>
          </div>
        </section>

        {/* STEP 1: Quiz Selector Section */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 font-mono text-sm border-2 border-emerald-200 font-black">
                  1
                </span>
                <span>Choisissez un questionnaire</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Sélectionnez le thème ou le pays sur lequel vous souhaitez vous entraîner
              </p>
            </div>

            {/* Total count badge */}
            <span className="text-xs font-black text-slate-600 bg-white px-3 py-1.5 rounded-xl border-2 border-slate-200 shadow-2xs self-start sm:self-auto">
              {filteredQuizzes.length} quiz disponibles
            </span>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-3 sm:p-4 space-y-3 shadow-xs">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Rechercher par titre, capitale, pays, océan, tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 font-bold focus:outline-none focus:border-emerald-500 transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition"
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
                className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition flex items-center gap-1.5 border-2 ${
                  searchMode === "all" && selectedCategory === "all"
                    ? "bg-emerald-500 text-white border-emerald-600 border-b-4 border-b-emerald-700 shadow-xs"
                    : "bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300 shadow-2xs"
                }`}
              >
                <span>🌍 Tous</span>
              </button>

              <button
                type="button"
                onClick={() => setSearchMode(searchMode === "popular" ? "all" : "popular")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition flex items-center gap-1.5 border-2 ${
                  searchMode === "popular"
                    ? "bg-amber-500 text-white border-amber-600 border-b-4 border-b-amber-700 shadow-xs"
                    : "bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300 shadow-2xs"
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                <span>Populaires</span>
              </button>

              <button
                type="button"
                onClick={() => setSearchMode(searchMode === "short" ? "all" : "short")}
                className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition flex items-center gap-1.5 border-2 ${
                  searchMode === "short"
                    ? "bg-sky-500 text-white border-sky-600 border-b-4 border-b-sky-700 shadow-xs"
                    : "bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300 shadow-2xs"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-sky-200" />
                <span>Quiz Rapides</span>
              </button>

              {/* Category tags */}
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(selectedCategory === cat ? "all" : cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition capitalize border-2 ${
                    selectedCategory === cat
                      ? "bg-teal-500 text-white border-teal-600 border-b-4 border-b-teal-700 shadow-xs"
                      : "bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300 shadow-2xs"
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
              <p className="text-xs text-slate-500 font-bold mt-3">Chargement des questionnaires...</p>
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="py-12 text-center rounded-3xl bg-white border-2 border-slate-200 p-6 space-y-2 shadow-xs">
              <p className="text-slate-800 font-black">Aucun quiz ne correspond à votre recherche</p>
              <p className="text-xs text-slate-500 font-medium">Essayez de retirer vos filtres ou de chercher un autre mot-clé.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setSearchMode("all");
                  setSelectedCategory("all");
                }}
                className="mt-3 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-700 border-2 border-slate-200 border-b-4 border-b-slate-300 active:border-b-0 active:translate-y-0.5 transition"
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
                    className={`group relative rounded-3xl p-4 sm:p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between border-2 select-none ${
                      isSelected
                        ? "bg-emerald-50/60 border-emerald-500 shadow-md scale-[1.01]"
                        : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-xs"
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                            {quiz.category || "Géographie"}
                          </span>
                          {quiz.difficulty && (
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border ${
                                quiz.difficulty === "easy"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : quiz.difficulty === "medium"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
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
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-xs">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-slate-300 group-hover:border-slate-400 shrink-0" />
                        )}
                      </div>

                      {/* Title & Description */}
                      <h3
                        className={`font-black text-sm sm:text-base leading-snug line-clamp-1 transition-colors ${
                          isSelected ? "text-emerald-800" : "text-slate-900 group-hover:text-emerald-700"
                        }`}
                      >
                        {quiz.title}
                      </h3>
                      {quiz.description && (
                        <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-1">
                          {quiz.description}
                        </p>
                      )}
                    </div>

                    {/* Footer Info */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-bold">
                      <span className="flex items-center gap-1 font-mono">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                        {quiz.total_plays || 0} parties
                      </span>
                      <span className="flex items-center gap-1 text-slate-500 font-bold">
                        <Compass className="w-3.5 h-3.5 text-slate-400" />
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
            className="rounded-3xl p-6 sm:p-8 bg-white border-2 border-emerald-300 shadow-sm space-y-6 animate-scale-in"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-100 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 font-mono text-sm border-2 border-emerald-200 font-black">
                    2
                  </span>
                  <span>Réglez la taille de votre séance</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Quiz sélectionné : <strong className="text-emerald-700">{selectedQuiz.title}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 rounded-xl border-2 border-slate-200 text-xs font-mono font-black text-slate-700">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Durée estimée : ~{estimatedMinutes} min</span>
              </div>
            </div>

            {/* Quick Presets Pills */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                Nombre de questions souhaité :
              </label>

              <div className="flex flex-wrap gap-2.5">
                {questionPresets.map((val) => {
                  const isActive = questionCount === val;
                  const isMax = val === maxQuestions;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setQuestionCount(val)}
                      className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition border-2 flex items-center gap-1.5 ${
                        isActive
                          ? "bg-emerald-500 text-white border-emerald-600 border-b-4 border-b-emerald-700 active:border-b-0 active:translate-y-1 shadow-md"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 border-b-4 border-b-slate-300 active:border-b-0 active:translate-y-0.5 shadow-2xs"
                      }`}
                    >
                      <span>{val} questions</span>
                      {isMax && (
                        <span className="text-[10px] font-mono uppercase bg-emerald-700/20 text-emerald-900 px-1.5 py-0.5 rounded-full font-black">
                          Max
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Interactive Range Slider */}
            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-600">Curseur libre :</span>
                <span className="text-base font-black text-emerald-700 font-mono">
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
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />

              <div className="flex justify-between text-[11px] font-mono font-bold text-slate-500">
                <span>1 question (Flash)</span>
                <span>{maxQuestions} questions (Intégral)</span>
              </div>
            </div>

            {/* Launch Action Button */}
            <button
              type="button"
              onClick={startTraining}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-base sm:text-lg border-2 border-emerald-600 border-b-4 border-b-emerald-700 active:border-b-0 active:translate-y-1 shadow-lg transition flex items-center justify-center gap-3 cursor-pointer"
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
