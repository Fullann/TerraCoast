import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useNotifications } from "../../contexts/NotificationContext";
import {
  BookOpen,
  Search,
  Play,
  Dumbbell,
  Filter,
  Plus,
  Share2,
  PenIcon as Edit,
  Trash2,
  Globe,
} from "lucide-react";
import { ShareQuizModal } from "./ShareQuizModal";
import type { Database } from "../../lib/database.types";
import { ConfirmModal } from "../common/ConfirmModal";
import {
  useCategoriesQuery,
  useDifficultiesQuery,
  useQuizTypesQuery,
} from "../../lib/queries/quizMetadataQueries";

const QuizzesMapView = lazy(() =>
  import("./QuizzesMapView").then((m) => ({ default: m.QuizzesMapView }))
);

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
type QuizType = Database["public"]["Tables"]["quiz_types"]["Row"];

export interface QuizWithType extends Quiz {
  quiz_types?: QuizType | null;
}

interface QuizzesPageProps {
  onNavigate?: (view: string, data?: unknown) => void;
}

export function QuizzesPage({ onNavigate: _onNavigate }: QuizzesPageProps = {}) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { language, showAllLanguages, t } = useLanguage();
  const { showAppNotification } = useNotifications();
  const [quizzes, setQuizzes] = useState<QuizWithType[]>([]);
  const [myQuizzes, setMyQuizzes] = useState<QuizWithType[]>([]);
  const [sharedQuizzes, setSharedQuizzes] = useState<QuizWithType[]>([]);
  const { data: quizTypes = [] } = useQuizTypesQuery();
  const { data: categories = [] } = useCategoriesQuery();
  const { data: difficulties = [] } = useDifficultiesQuery();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<"public" | "my" | "shared">(
    "public"
  );
  const [shareQuiz, setShareQuiz] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    message: string;
    onConfirm: null | (() => void | Promise<void>);
  }>({ open: false, message: "", onConfirm: null });

  const getGamesText = (count: number) => {
    // Règle demandée: 0 ou 1 => "partie", sinon "parties"
    return count <= 1 ? t("quizzes.game") : t("quizzes.games");
  };

  const openConfirmModal = (
    message: string,
    onConfirm: () => void | Promise<void>
  ) => {
    setConfirmModal({ open: true, message, onConfirm });
  };

  useEffect(() => {
    loadQuizzes();
  }, [
    profile,
    categoryFilter,
    difficultyFilter,
    typeFilter,
    language,
    showAllLanguages,
  ]);
  useEffect(() => {
    if (!profile) return;

    // Abonnement aux mises à jour des quiz (total_plays, average_score)
    const quizzesSubscription = supabase
      .channel("quizzes_updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "quizzes",
        },
        (payload) => {
          const updatedQuiz = payload.new as Quiz;

          // Mettre à jour dans la liste des quiz publics
          setQuizzes((prev) =>
            prev.map((q) =>
              q.id === updatedQuiz.id
                ? {
                    ...q,
                    total_plays: updatedQuiz.total_plays,
                    average_score: updatedQuiz.average_score,
                  }
                : q
            )
          );

          // Mettre à jour dans la liste de mes quiz
          setMyQuizzes((prev) =>
            prev.map((q) =>
              q.id === updatedQuiz.id
                ? {
                    ...q,
                    total_plays: updatedQuiz.total_plays,
                    average_score: updatedQuiz.average_score,
                  }
                : q
            )
          );

          // Mettre à jour dans la liste des quiz partagés
          setSharedQuizzes((prev) =>
            prev.map((q) =>
              q.id === updatedQuiz.id
                ? {
                    ...q,
                    total_plays: updatedQuiz.total_plays,
                    average_score: updatedQuiz.average_score,
                  }
                : q
            )
          );
        }
      )
      .subscribe();

    return () => {
      quizzesSubscription.unsubscribe();
    };
  }, [profile]);
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadQuizzes();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    profile,
    categoryFilter,
    difficultyFilter,
    typeFilter,
    language,
    showAllLanguages,
  ]);


  const requestPublish = async (quizId: string, quizTitle: string) => {
    openConfirmModal(
      t("quizzes.confirmPublishRequest").replace("{title}", quizTitle),
      async () => {
        await performPublishRequest(quizId);
      }
    );
  };

  const performPublishRequest = async (quizId: string) => {
    const { error } = await (supabase as any)
      .from("quizzes")
      .update({ pending_validation: true, validation_status: "pending" })
      .eq("id", quizId);

    if (error) {
      showAppNotification({ type: "error", message: t("quizzes.publishRequestError") });
      return;
    }

    showAppNotification({ type: "success", message: t("quizzes.publishRequestSuccess") });
    loadQuizzes();
  };

  const publishQuizDirectly = async (quizId: string) => {
    const { error } = await (supabase as any)
      .from("quizzes")
      .update({
        is_public: true,
        is_global: true,
        published_at: new Date().toISOString(),
      })
      .eq("id", quizId);

    if (error) {
      showAppNotification({ type: "error", message: t("quizzes.publishError") });
      return;
    }

    showAppNotification({ type: "success", message: t("quizzes.publishSuccess") });
    loadQuizzes();
  };

  const removeSharedQuiz = async (quizId: string) => {
    openConfirmModal(t("quizzes.confirmRemoveShared"), async () => {
      await performRemoveSharedQuiz(quizId);
    });
  };

  const performRemoveSharedQuiz = async (quizId: string) => {
    if (!profile?.id) return;
    const { error } = await supabase
      .from("quiz_shares")
      .delete()
      .eq("quiz_id", quizId)
      .eq("shared_with_user_id", profile.id);

    if (error) {
      console.error("Error removing shared quiz:", error);
      showAppNotification({ type: "error", message: t("quizzes.removeError") });
      return;
    }

    setSharedQuizzes(sharedQuizzes.filter((q) => q.id !== quizId));

    showAppNotification({
      type: "success",
      message: t("quizzes.removeSuccess"),
    });
  };
  const deleteQuiz = async (quizId: string, quizTitle: string) => {
    openConfirmModal(
      t("quizzes.confirmDelete").replace("{title}", quizTitle),
      async () => {
        await performDeleteQuiz(quizId);
      }
    );
  };

  const performDeleteQuiz = async (quizId: string) => {
    // Supprimer d'abord les questions associées
    const { error: questionsError } = await supabase
      .from("questions")
      .delete()
      .eq("quiz_id", quizId);

    if (questionsError) {
      console.error("Error deleting questions:", questionsError);
      showAppNotification({ type: "error", message: t("quizzes.deleteQuestionsError") });
      return;
    }

    // Supprimer les partages associés
    await supabase.from("quiz_shares").delete().eq("quiz_id", quizId);

    // Supprimer le quiz
    const { error: quizError } = await supabase
      .from("quizzes")
      .delete()
      .eq("id", quizId);

    if (quizError) {
      console.error("Error deleting quiz:", quizError);
      showAppNotification({ type: "error", message: t("quizzes.deleteError") });
      return;
    }

    // Mettre à jour la liste locale
    setMyQuizzes(myQuizzes.filter((q) => q.id !== quizId));

    showAppNotification({ type: "success", message: t("quizzes.deleteSuccess") });
  };

  const loadQuizzes = async () => {
    if (!profile) return;

    let query = supabase
      .from("quizzes")
      .select("*, quiz_types(*)")
      .or("is_public.eq.true,is_global.eq.true")
      .order("total_plays", { ascending: false });

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      query = query.or(
        `title.ilike.%${searchLower}%,description.ilike.%${searchLower}%,tags.cs.{"${searchLower}"}`
      );
    }
    if (categoryFilter !== "all") {
      query = query.eq("category", categoryFilter as any);
    }

    if (difficultyFilter !== "all") {
      query = query.eq("difficulty", difficultyFilter as any);
    }

    if (typeFilter !== "all") {
      query = query.eq("quiz_type_id", typeFilter);
    }

    if (!showAllLanguages) {
      query = query.eq("language", language);
    }

    const { data } = await query;
    if (data) setQuizzes(data as unknown as QuizWithType[]);

    const { data: myData } = await supabase
      .from("quizzes")
      .select("*, quiz_types(*)")
      .eq("creator_id", profile.id)
      .order("created_at", { ascending: false });

    if (myData) setMyQuizzes(myData as unknown as QuizWithType[]);

    const { data: sharedData } = await supabase
      .from("quiz_shares")
      .select("quiz:quizzes(*)")
      .eq("shared_with_user_id", profile.id);

    if (sharedData) {
      const sharedQuizzesList = sharedData
        .map((share: any) => share.quiz)
        .filter((quiz: Quiz | null) => quiz !== null) as Quiz[];
      setSharedQuizzes(sharedQuizzesList);
    }
  };

  const filteredQuizzes = (
    activeTab === "public"
      ? quizzes
      : activeTab === "my"
      ? myQuizzes
      : sharedQuizzes
  ).filter(
    (quiz) =>
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quiz.tags &&
        quiz.tags.some((tag) => tag.includes(searchTerm.toLowerCase())))
  );
  const isSearching = searchTerm.trim().length > 0;

  const getCategoryLabel = (categoryName: string) => {
    const category = categories.find((c) => c.name === categoryName);
    return category ? category.label : categoryName;
  };

  const getDifficultyLabel = (difficultyName: string) => {
    const difficulty = difficulties.find((d) => d.name === difficultyName);
    return difficulty ? difficulty.label : difficultyName;
  };

  const getDifficultyColor = (difficultyName: string) => {
    const difficulty = difficulties.find((d) => d.name === difficultyName);
    if (!difficulty) return "bg-gray-100 text-gray-700";

    return `bg-${difficulty.color}-100 text-${difficulty.color}-700`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* HEADER AVEC TITRE ET BADGE */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black uppercase tracking-wider">
              Bibliothèque Officielle 📚
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            {t("quizzes.title")}
          </h1>
          <p className="text-slate-600 font-bold mt-1">{t("quizzes.subtitle")}</p>
        </div>

        <button
          onClick={() => navigate("/quizzes/create")}
          className="btn-duo btn-duo-teal py-3 px-5 text-sm font-black flex items-center gap-2 shadow-sm self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>{t("quiz.create") || "Créer un Quiz"}</span>
        </button>
      </div>

      <div className="card-duo p-5 sm:p-6 mb-8 bg-white shadow-sm">
        {/* Recherche + Bouton filtres */}
        <div className="flex gap-2.5 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t("quizzes.searchPlaceholder") || "Rechercher par titre, continent, tag..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-200 border-b-4 focus:border-emerald-500 focus:bg-white rounded-2xl outline-none font-bold text-slate-800 transition-all text-sm sm:text-base focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          {/* Bouton pour afficher/masquer les filtres */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 btn-duo text-sm font-black transition-all flex items-center gap-2 shadow-xs ${
              showFilters
                ? "btn-duo-green"
                : "btn-duo-white"
            }`}
          >
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">Filtres</span>
          </button>
        </div>

        {/* Filtres (cachables) */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 animate-slide-down">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 pr-8 border-2 border-slate-200 border-b-4 rounded-2xl font-bold text-slate-700 focus:border-emerald-500 focus:bg-white outline-none appearance-none bg-slate-50 cursor-pointer text-sm shadow-2xs"
            >
              <option value="all">{t("quizzes.allCategories")}</option>
              {categories.map((category) => (
                <option key={category.name} value={category.name}>
                  {category.label}
                </option>
              ))}
            </select>

            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-4 py-3 pr-8 border-2 border-slate-200 border-b-4 rounded-2xl font-bold text-slate-700 focus:border-emerald-500 focus:bg-white outline-none appearance-none bg-slate-50 cursor-pointer text-sm shadow-2xs"
            >
              <option value="all">{t("quizzes.allDifficulties")}</option>
              {difficulties.map((difficulty) => (
                <option key={difficulty.name} value={difficulty.name}>
                  {difficulty.label}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 pr-8 border-2 border-slate-200 border-b-4 rounded-2xl font-bold text-slate-700 focus:border-emerald-500 focus:bg-white outline-none appearance-none bg-slate-50 cursor-pointer text-sm shadow-2xs"
            >
              <option value="all">{t("quizzes.allTypes")}</option>
              {quizTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Onglets Tactiles */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          <button
            onClick={() => setActiveTab("public")}
            className={`btn-duo py-3 px-3 sm:px-4 text-xs sm:text-sm font-black flex items-center justify-center gap-2 ${
              activeTab === "public"
                ? "btn-duo-green"
                : "btn-duo-white text-slate-600"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{t("quiz.publicQuizzes")}</span>
          </button>

          <button
            onClick={() => setActiveTab("my")}
            className={`btn-duo py-3 px-3 sm:px-4 text-xs sm:text-sm font-black flex items-center justify-center gap-2 ${
              activeTab === "my"
                ? "btn-duo-blue"
                : "btn-duo-white text-slate-600"
            }`}
          >
            <Edit className="w-4 h-4" />
            <span>{t("quiz.myQuizzes")}</span>
          </button>

          <button
            onClick={() => setActiveTab("shared")}
            className={`btn-duo py-3 px-3 sm:px-4 text-xs sm:text-sm font-black flex items-center justify-center gap-2 relative ${
              activeTab === "shared"
                ? "btn-duo-purple"
                : "btn-duo-white text-slate-600"
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>{t("quiz.sharedQuizzes")}</span>
            {sharedQuizzes.length > 0 && (
              <span className="ml-1 bg-rose-500 text-white text-[10px] rounded-full px-1.5 py-0.2 font-black shadow-xs">
                {sharedQuizzes.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === "public" && !isSearching && (
        <Suspense
          fallback={
            <div className="w-full h-[420px] rounded-xl border border-gray-200 bg-sky-50 flex items-center justify-center mb-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
            </div>
          }
        >
          <QuizzesMapView
            quizzes={filteredQuizzes}
            activeTab={activeTab}
            getDifficultyLabel={getDifficultyLabel}
            getGamesText={getGamesText}
          />
        </Suspense>
      )}

      {/* Style pour l'animation */}
      <style>{`
  .animate-slide-down {
    animation: slideDown 0.3s ease-out;
  }
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .quiz-map-marker-pulse {
    animation: mapMarkerPulse 1.8s ease-out infinite;
  }
  @keyframes mapMarkerPulse {
    0% {
      transform: scale(0.8);
      opacity: 0.35;
    }
    70% {
      transform: scale(1.7);
      opacity: 0;
    }
    100% {
      transform: scale(1.7);
      opacity: 0;
    }
  }
`}</style>

      {filteredQuizzes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {t("quizzes.noQuizFound")}
          </h3>
          <p className="text-gray-500">
            {activeTab === "my"
              ? t("quizzes.noQuizCreated")
              : activeTab === "shared"
              ? t("quizzes.noQuizShared")
              : t("quizzes.tryDifferentFilters")}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 p-4 rounded-xl border border-purple-200 bg-purple-50">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-purple-900">
                  {t("quizzes.trainingBannerTitle")}
                </p>
                <p className="text-sm text-purple-700">
                  {t("quizzes.trainingBannerDesc")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/quizzes/training")}
                className="px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {t("home.trainingMode")}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              onClick={() => navigate(`/quizzes/play/${quiz.id }`)}
              className="card-duo card-duo-interactive group overflow-hidden flex flex-col h-full bg-white shadow-sm hover:shadow-lg transition-all duration-150 rounded-3xl"
            >
              {/* IMAGE / COUVERTURE AVEC BADGE */}
              <div className="relative w-full h-48 overflow-hidden bg-slate-100">
                {quiz.cover_image_url ? (
                  <img
                    src={quiz.cover_image_url}
                    alt={quiz.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <BookOpen className="w-16 h-16 text-white/70" />
                  </div>
                )}

                {/* BADGE GLOBAL / CATÉGORIE EN OVERLAY */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider bg-white/95 text-slate-800 px-2.5 py-1 rounded-full shadow-xs border border-slate-200/80 backdrop-blur-xs">
                    {getCategoryLabel(quiz.category)}
                  </span>
                  {quiz.is_global && (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-sky-500 text-white px-2 py-0.5 rounded-full shadow-xs">
                      {t("quizzes.global") || "Officiel"}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 sm:p-6 flex flex-col flex-1">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors mb-2">
                  {quiz.title}
                </h3>

                <p className="text-slate-600 font-medium text-xs sm:text-sm mb-4 line-clamp-2 leading-relaxed">
                  {quiz.description || "Testez vos connaissances géographiques sur ce quiz !"}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span
                    className={`text-[11px] font-black px-2.5 py-1 rounded-xl border ${getDifficultyColor(
                      quiz.difficulty
                    )}`}
                  >
                    {getDifficultyLabel(quiz.difficulty)}
                  </span>
                  {quiz.quiz_types && (
                    <span
                      className="text-[11px] font-black px-2.5 py-1 rounded-xl"
                      style={{
                        backgroundColor: `${quiz.quiz_types.color}15`,
                        color: quiz.quiz_types.color,
                        border: `1px solid ${quiz.quiz_types.color}30`,
                      }}
                    >
                      {quiz.quiz_types.name}
                    </span>
                  )}
                </div>

                <div className="mt-auto space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>
                      {quiz.total_plays} {getGamesText(quiz.total_plays)}
                    </span>
                    {quiz.average_score > 0 && (
                      <span className="text-emerald-700 font-black">
                        Moy. {Math.round(quiz.average_score)} pts
                      </span>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/quizzes/play/${quiz.id }`);
                      }}
                      className="flex-1 py-3 px-4 btn-duo btn-duo-green text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Play className="w-4 h-4 fill-white stroke-none" />
                      <span>{t("quiz.play") || "JOUER"}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/quizzes/training/${quiz.id}?count=${10 }`);
                      }}
                      className="btn-duo btn-duo-white px-3 py-3 text-xs font-black text-purple-700 hover:bg-purple-50"
                      title={t("quizzes.trainNow")}
                    >
                      <Dumbbell className="w-4 h-4" />
                    </button>

                    {activeTab === "my" && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/quizzes/edit/${quiz.id }`);
                          }}
                          className="btn-duo btn-duo-white px-3 py-3 text-xs text-slate-600"
                          title={t("quiz.edit")}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {!quiz.is_public && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShareQuiz({ id: quiz.id, title: quiz.title });
                              }}
                              className="btn-duo btn-duo-white px-3 py-3 text-xs text-sky-700"
                              title={t("quizzes.shareWithFriends")}
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                profile?.role === "admin"
                                  ? publishQuizDirectly(quiz.id)
                                  : requestPublish(quiz.id, quiz.title);
                              }}
                              className="btn-duo btn-duo-white px-3 py-3 text-xs text-emerald-700"
                              title={
                                profile?.role === "admin"
                                  ? t("quizzes.publishDirectly")
                                  : t("quizzes.requestPublish")
                              }
                            >
                              <Globe className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteQuiz(quiz.id, quiz.title);
                              }}
                              className="btn-duo btn-duo-rose px-3 py-3 text-xs shadow-xs"
                              title={t("quizzes.deleteQuiz")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </>
                    )}
                    {activeTab === "shared" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSharedQuiz(quiz.id);
                        }}
                        className="btn-duo btn-duo-rose px-3 py-3 text-xs shadow-xs"
                        title={t("quizzes.removeFromList")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        </>
      )}

      {shareQuiz && (
        <ShareQuizModal
          quizId={shareQuiz.id}
          quizTitle={shareQuiz.title}
          onClose={() => setShareQuiz(null)}
        />
      )}
      <ConfirmModal
        open={confirmModal.open}
        message={confirmModal.message}
        cancelLabel={t("common.cancel")}
        confirmLabel={t("common.confirm")}
        onCancel={() => setConfirmModal({ open: false, message: "", onConfirm: null })}
        onConfirm={async () => {
          const fn = confirmModal.onConfirm;
          setConfirmModal({ open: false, message: "", onConfirm: null });
          if (fn) await fn();
        }}
      />
    </div>
  );
}
