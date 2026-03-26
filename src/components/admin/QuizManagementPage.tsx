import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  BookOpen,
  Search,
  Copy,
  Trash2,
  Shield,
  AlertTriangle,
  Edit2,
  Eye,
  EyeOff,
  RotateCcw,
  User,
  Flag,
  BarChart3,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { Database } from "../../lib/database.types";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Question = Database["public"]["Tables"]["questions"]["Row"];

interface QuizWithCreator extends Quiz {
  creator?: Profile;
}

interface QuestionPerformance {
  questionId: string;
  questionText: string;
  orderIndex: number;
  attempts: number;
  correct: number;
  successRate: number;
  averageTimeSeconds: number;
}

interface QuizPerformanceSummary {
  quiz: QuizWithCreator;
  totalSessions: number;
  totalAnswers: number;
  overallSuccessRate: number;
  averageScore: number;
  averageAccuracy: number;
  questionPerformances: QuestionPerformance[];
}

interface QuizManagementPageProps {
  onNavigate?: (view: string, data?: any) => void;
}

export function QuizManagementPage({ onNavigate }: QuizManagementPageProps) {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [quizzes, setQuizzes] = useState<QuizWithCreator[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<QuizWithCreator[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"created" | "plays" | "score">(
    "created"
  );
  const [filterStatus, setFilterStatus] = useState<
    "all" | "public" | "private"
  >("all");
  const [filterReported, setFilterReported] = useState(false);
  const [filterMissingLocation, setFilterMissingLocation] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizWithCreator | null>(
    null
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceSummary, setPerformanceSummary] =
    useState<QuizPerformanceSummary | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationModalQuizId, setLocationModalQuizId] = useState<string | null>(null);
  const [locationModalLat, setLocationModalLat] = useState("");
  const [locationModalLng, setLocationModalLng] = useState("");

  useEffect(() => {
    loadQuizzes();
  }, [sortBy, filterStatus, filterReported, filterMissingLocation]);

  const loadQuizzes = async () => {
    setLoading(true);
    let query = supabase.from("quizzes").select(`
        *,
        creator:profiles!quizzes_creator_id_fkey(*)
      `);

    if (filterStatus === "public") {
      query = query.eq("is_public", true);
    } else if (filterStatus === "private") {
      query = query.eq("is_public", false);
    }

    if (filterReported) {
      query = query.eq("is_reported", true);
    }
    if (filterMissingLocation) {
      query = query.or("location_lat.is.null,location_lng.is.null");
    }

    const { data, error } = await query
      .order(
        sortBy === "created"
          ? "created_at"
          : sortBy === "plays"
          ? "total_plays"
          : "average_score",
        { ascending: false }
      )
      .limit(100);

    if (data) {
      const quizzesWithCreator = data.map((quiz: any) => ({
        ...quiz,
        creator: Array.isArray(quiz.creator) ? quiz.creator[0] : quiz.creator,
      }));
      setQuizzes(quizzesWithCreator);
    }
    setLoading(false);
  };

  const searchQuizzes = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const { data } = await supabase
      .from("quizzes")
      .select(
        `
        *,
        creator:profiles!quizzes_creator_id_fkey(*)
      `
      )
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(20);

    if (data) {
      const quizzesWithCreator = data.map((quiz: any) => ({
        ...quiz,
        creator: Array.isArray(quiz.creator) ? quiz.creator[0] : quiz.creator,
      }));
      setSearchResults(quizzesWithCreator);
    }
  };

  const toggleQuizVisibility = async (
    quizId: string,
    isPublic: boolean,
    isGlobal: boolean
  ) => {
    let newIsPublic: boolean;
    let newIsGlobal: boolean;
    let statusText: string;

    // Cycle : Privé → Public → Global → Privé
    if (!isPublic && !isGlobal) {
      // État actuel: Privé → Passer à Public
      newIsPublic = true;
      newIsGlobal = false;
      statusText = "public";
    } else if (isPublic && !isGlobal) {
      // État actuel: Public → Passer à Global
      newIsPublic = true;
      newIsGlobal = true;
      statusText = "global";
    } else {
      // État actuel: Global (isPublic=true, isGlobal=true) → Passer à Privé
      newIsPublic = false;
      newIsGlobal = false;
      statusText = "privé";
    }

    if (!confirm(`Rendre ce quiz ${statusText} ?`)) return;

    if (!isPublic && !isGlobal) {
      setLocationModalQuizId(quizId);
      setLocationModalLat("");
      setLocationModalLng("");
      setShowLocationModal(true);
      return;
    }

    const updatePayload: Database["public"]["Tables"]["quizzes"]["Update"] = {
      is_public: newIsPublic,
      is_global: newIsGlobal,
    };

    const { error } = await supabase
      .from("quizzes")
      .update(updatePayload)
      .eq("id", quizId);

    if (error) {
      alert("Erreur : " + error.message);
      return;
    }

    alert(`Quiz rendu ${statusText} !`);
    loadQuizzes();
  };

  const confirmPublishWithLocation = async () => {
    if (!locationModalQuizId) return;

    const latTrimmed = locationModalLat.trim();
    const lngTrimmed = locationModalLng.trim();
    const locationLat = latTrimmed === "" ? null : Number(latTrimmed);
    const locationLng = lngTrimmed === "" ? null : Number(lngTrimmed);

    if (
      (latTrimmed !== "" &&
        (!Number.isFinite(locationLat) || locationLat < -90 || locationLat > 90)) ||
      (lngTrimmed !== "" &&
        (!Number.isFinite(locationLng) || locationLng < -180 || locationLng > 180))
    ) {
      alert("Coordonnées invalides. Lat: -90..90, Lng: -180..180");
      return;
    }

    const { error } = await supabase
      .from("quizzes")
      .update({
        is_public: true,
        is_global: false,
        location_lat: locationLat,
        location_lng: locationLng,
      })
      .eq("id", locationModalQuizId);

    if (error) {
      alert("Erreur : " + error.message);
      return;
    }

    setShowLocationModal(false);
    setLocationModalQuizId(null);
    setLocationModalLat("");
    setLocationModalLng("");
    alert("Quiz rendu public !");
    loadQuizzes();
  };

  const duplicateQuiz = async (quiz: QuizWithCreator) => {
    if (!confirm(`Dupliquer le quiz "${quiz.title}" ?`)) return;

    try {
      const { data, error } = await supabase.rpc("duplicate_quiz", {
        p_quiz_id: quiz.id,
        p_new_title: `${quiz.title} (copie)`,
      });

      if (error) {
        console.error("Erreur:", error);
        alert("Erreur lors de la duplication : " + error.message);
        return;
      }

      alert(`Quiz "${quiz.title}" dupliqué avec succès ! ID: ${data}`);
      loadQuizzes();
    } catch (error: any) {
      alert("Erreur : " + error.message);
    }
  };

  const resetQuizStats = async (quizId: string, quizTitle: string) => {
    if (
      !confirm(
        `Réinitialiser les statistiques de "${quizTitle}" ?\n\nCela remettra à zéro :\n- Le nombre de parties jouées\n- Le score moyen\n- Les signalements`
      )
    )
      return;

    const { error } = await supabase
      .from("quizzes")
      .update({
        total_plays: 0,
        average_score: 0,
        is_reported: false,
        report_count: 0,
      })
      .eq("id", quizId);

    if (error) {
      alert("Erreur : " + error.message);
      return;
    }

    alert(`Statistiques réinitialisées pour "${quizTitle}" !`);
    loadQuizzes();
  };

  const deleteQuiz = async () => {
    if (!selectedQuiz) return;

    if (!deleteReason.trim()) {
      alert("Tu dois indiquer une raison");
      return;
    }

    try {
      // Supprimer les réponses des sessions de jeu
      const { data: sessions } = await supabase
        .from("game_sessions")
        .select("id")
        .eq("quiz_id", selectedQuiz.id);

      if (sessions) {
        for (const session of sessions) {
          await supabase
            .from("game_answers")
            .delete()
            .eq("session_id", session.id);
        }
      }

      // Supprimer les questions du quiz
      await supabase.from("questions").delete().eq("quiz_id", selectedQuiz.id);

      // Supprimer les sessions de jeu
      await supabase
        .from("game_sessions")
        .delete()
        .eq("quiz_id", selectedQuiz.id);

      // Supprimer les partages
      await supabase
        .from("quiz_shares")
        .delete()
        .eq("quiz_id", selectedQuiz.id);

      // Supprimer les duels
      await supabase.from("duels").delete().eq("quiz_id", selectedQuiz.id);

      // Supprimer les rapports
      await supabase.from("reports").delete().eq("quiz_id", selectedQuiz.id);

      // Supprimer le quiz
      const { error } = await supabase
        .from("quizzes")
        .delete()
        .eq("id", selectedQuiz.id);

      if (error) {
        alert("Erreur : " + error.message);
        return;
      }

      // Mettre à jour le compteur de quiz publiés du créateur
      if (selectedQuiz.is_public) {
        const { data: creatorProfile } = await supabase
          .from("profiles")
          .select("published_quiz_count")
          .eq("id", selectedQuiz.creator_id)
          .single();

        if (creatorProfile) {
          await supabase
            .from("profiles")
            .update({
              published_quiz_count: Math.max(
                0,
                (creatorProfile.published_quiz_count || 0) - 1
              ),
            })
            .eq("id", selectedQuiz.creator_id);
        }
      }

      alert(`Quiz "${selectedQuiz.title}" supprimé avec succès !`);
      setShowDeleteModal(false);
      setDeleteReason("");
      setSelectedQuiz(null);
      loadQuizzes();
    } catch (error: any) {
      alert("Erreur lors de la suppression : " + error.message);
    }
  };

  const loadQuizPerformance = async (quiz: QuizWithCreator) => {
    setPerformanceLoading(true);
    setPerformanceSummary(null);
    setShowPerformanceModal(true);

    const { data: sessionsData } = await supabase
      .from("game_sessions")
      .select("id, score, accuracy_percentage")
      .eq("quiz_id", quiz.id)
      .eq("completed", true);

    const { data: questionsData } = await supabase
      .from("questions")
      .select("id, question_text, order_index")
      .eq("quiz_id", quiz.id)
      .order("order_index", { ascending: true });

    const typedQuestions =
      (questionsData as Pick<Question, "id" | "question_text" | "order_index">[]) ||
      [];
    const questionIds = typedQuestions.map((q) => q.id);

    let answersData:
      | {
          question_id: string;
          is_correct: boolean;
          time_taken_seconds: number;
        }[]
      | null = null;

    if (questionIds.length > 0) {
      const { data } = await supabase
        .from("game_answers")
        .select("question_id, is_correct, time_taken_seconds")
        .in("question_id", questionIds);
      answersData = data;
    }

    const typedAnswers = answersData || [];
    const typedSessions = sessionsData || [];

    const byQuestion = new Map<
      string,
      { attempts: number; correct: number; totalTime: number }
    >();

    typedAnswers.forEach((a) => {
      const current = byQuestion.get(a.question_id) || {
        attempts: 0,
        correct: 0,
        totalTime: 0,
      };
      current.attempts += 1;
      current.correct += a.is_correct ? 1 : 0;
      current.totalTime += a.time_taken_seconds || 0;
      byQuestion.set(a.question_id, current);
    });

    const questionPerformances: QuestionPerformance[] = typedQuestions.map((q) => {
      const agg = byQuestion.get(q.id) || { attempts: 0, correct: 0, totalTime: 0 };
      const successRate =
        agg.attempts > 0 ? (agg.correct / agg.attempts) * 100 : 0;
      const averageTimeSeconds =
        agg.attempts > 0 ? agg.totalTime / agg.attempts : 0;
      return {
        questionId: q.id,
        questionText: q.question_text,
        orderIndex: q.order_index,
        attempts: agg.attempts,
        correct: agg.correct,
        successRate,
        averageTimeSeconds,
      };
    });

    questionPerformances.sort((a, b) => a.successRate - b.successRate);

    const totalAnswers = typedAnswers.length;
    const totalCorrect = typedAnswers.filter((a) => a.is_correct).length;
    const overallSuccessRate =
      totalAnswers > 0 ? (totalCorrect / totalAnswers) * 100 : 0;

    const averageScore =
      typedSessions.length > 0
        ? typedSessions.reduce((sum, s) => sum + (s.score || 0), 0) /
          typedSessions.length
        : 0;
    const averageAccuracy =
      typedSessions.length > 0
        ? typedSessions.reduce((sum, s) => sum + (s.accuracy_percentage || 0), 0) /
          typedSessions.length
        : 0;

    setPerformanceSummary({
      quiz,
      totalSessions: typedSessions.length,
      totalAnswers,
      overallSuccessRate,
      averageScore,
      averageAccuracy,
      questionPerformances,
    });
    setPerformanceLoading(false);
  };

  if (profile?.role !== "admin") {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Accès refusé
          </h2>
          <p className="text-gray-600">
            Tu dois être administrateur pour accéder à cette page
          </p>
        </div>
      </div>
    );
  }

  const displayQuizzes =
    searchTerm.trim().length >= 2 ? searchResults : quizzes;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
          <BookOpen className="w-10 h-10 mr-3 text-emerald-600" />
          Gestion des quiz
        </h1>
        <p className="text-gray-600">
          Gère les quiz, leur visibilité et leurs statistiques
        </p>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="space-y-4">
          {/* Recherche */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher un quiz
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cherche par titre ou description..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  searchQuizzes(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Tri */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trier par
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              >
                <option value="created">Date de création</option>
                <option value="plays">Nombre de parties</option>
                <option value="score">Score moyen</option>
              </select>
            </div>

            {/* Filtre statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              >
                <option value="all">Tous les quiz</option>
                <option value="public">Publics uniquement</option>
                <option value="private">Privés uniquement</option>
              </select>
            </div>

            {/* Filtre signalés */}
            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterReported}
                  onChange={(e) => setFilterReported(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Signalés uniquement
                </span>
              </label>
            </div>

            {/* Filtre sans localisation */}
            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterMissingLocation}
                  onChange={(e) => setFilterMissingLocation(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Sans localisation
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des quiz */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : displayQuizzes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucun quiz trouvé</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Titre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Créateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Catégorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Difficulté
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Parties
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Score moy.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayQuizzes.map((quiz) => (
                  <tr
                    key={quiz.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800">
                        {quiz.title}
                      </p>
                      {quiz.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {quiz.description.substring(0, 50)}
                          {quiz.description.length > 50 ? "..." : ""}
                        </p>
                      )}
                      {quiz.is_reported && (
                        <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 mt-1">
                          <Flag className="w-3 h-3" />
                          <span>{quiz.report_count} signalement(s)</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {quiz.creator ? (
                        <button
                          onClick={() =>
                            onNavigate?.("view-profile", {
                              userId: quiz.creator?.id,
                            })
                          }
                          className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {quiz.creator.pseudo}
                          </span>
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400">Inconnu</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 capitalize">
                        {quiz.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          quiz.difficulty === "easy"
                            ? "bg-green-100 text-green-700"
                            : quiz.difficulty === "medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {quiz.difficulty === "easy"
                          ? "Facile"
                          : quiz.difficulty === "medium"
                          ? "Moyen"
                          : "Difficile"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-800">
                        {quiz.total_plays}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-800">
                        {quiz.average_score
                          ? quiz.average_score.toFixed(1)
                          : "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          quiz.is_global
                            ? "bg-blue-100 text-blue-700"
                            : quiz.is_public
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {quiz.is_global
                          ? "Global"
                          : quiz.is_public
                          ? "Public"
                          : "Privé"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {/* Bouton Modifier */}
                        <button
                          onClick={() =>
                            onNavigate?.("edit-quiz", { quizId: quiz.id })
                          }
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {/* Bouton Dupliquer */}
                        <button
                          onClick={() => duplicateQuiz(quiz)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Dupliquer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* Bouton Stats réponses */}
                        <button
                          onClick={() => loadQuizPerformance(quiz)}
                          className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Analyser les réponses"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>

                        {/* Bouton Visibilité */}
                        <button
                          onClick={() =>
                            toggleQuizVisibility(
                              quiz.id,
                              quiz.is_public,
                              quiz.is_global
                            )
                          }
                          className={`p-2 rounded-lg transition-colors ${
                            quiz.is_global
                              ? "text-blue-600 hover:bg-blue-50"
                              : quiz.is_public
                              ? "text-green-600 hover:bg-green-50"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                          title={
                            quiz.is_global
                              ? "Global → Privé"
                              : quiz.is_public
                              ? "Public → Global"
                              : "Privé → Public"
                          }
                        >
                          {quiz.is_global ? (
                            <BookOpen className="w-4 h-4" />
                          ) : quiz.is_public ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </button>

                        {/* Bouton Reset Stats */}
                        <button
                          onClick={() => resetQuizStats(quiz.id, quiz.title)}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Réinitialiser les statistiques"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>

                        {/* Bouton Supprimer */}
                        <button
                          onClick={() => {
                            setSelectedQuiz(quiz);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Suppression */}
      {showDeleteModal && selectedQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Supprimer "{selectedQuiz.title}"
            </h3>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Action irréversible
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Le quiz, ses questions, sessions et partages seront
                    définitivement supprimés
                  </p>
                </div>
              </div>
            </div>

            {selectedQuiz.creator && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Créateur :</span>{" "}
                  {selectedQuiz.creator.pseudo}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Son compteur de quiz sera mis à jour
                </p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison de la suppression
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Ex: Contenu inapproprié, violation des règles..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteReason("");
                  setSelectedQuiz(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={deleteQuiz}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Performance Quiz */}
      {showPerformanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">
                Performance des réponses -{" "}
                {performanceSummary?.quiz.title || "Quiz"}
              </h3>
              <button
                onClick={() => {
                  setShowPerformanceModal(false);
                  setPerformanceSummary(null);
                }}
                className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Fermer
              </button>
            </div>

            <div className="p-5 overflow-auto">
              {performanceLoading || !performanceSummary ? (
                <p className="text-gray-500">Chargement des statistiques...</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
                    <div className="rounded-lg border p-3 bg-blue-50">
                      <p className="text-xs text-blue-700">Parties terminées</p>
                      <p className="text-2xl font-bold text-blue-800">
                        {performanceSummary.totalSessions}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3 bg-emerald-50">
                      <p className="text-xs text-emerald-700">Réponses total</p>
                      <p className="text-2xl font-bold text-emerald-800">
                        {performanceSummary.totalAnswers}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3 bg-purple-50">
                      <p className="text-xs text-purple-700">Réussite globale</p>
                      <p className="text-2xl font-bold text-purple-800">
                        {performanceSummary.overallSuccessRate.toFixed(1)}%
                      </p>
                    </div>
                    <div className="rounded-lg border p-3 bg-amber-50">
                      <p className="text-xs text-amber-700">Score moyen</p>
                      <p className="text-2xl font-bold text-amber-800">
                        {performanceSummary.averageScore.toFixed(1)}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3 bg-rose-50">
                      <p className="text-xs text-rose-700">Précision moyenne</p>
                      <p className="text-2xl font-bold text-rose-800">
                        {performanceSummary.averageAccuracy.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                            Q#
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                            Question
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                            Tentatives
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                            Correctes
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                            Taux réussite
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                            Temps moyen
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                            État
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {performanceSummary.questionPerformances.map((q) => {
                          const isGood = q.successRate >= 70;
                          const isBad = q.successRate < 40;
                          return (
                            <tr key={q.questionId} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-sm text-gray-700">
                                {q.orderIndex + 1}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-800">
                                {q.questionText}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-700">
                                {q.attempts}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-700">
                                {q.correct}
                              </td>
                              <td className="px-3 py-2 text-sm font-semibold text-gray-800">
                                {q.successRate.toFixed(1)}%
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-700">
                                {q.averageTimeSeconds.toFixed(1)}s
                              </td>
                              <td className="px-3 py-2 text-sm">
                                {isGood ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Fonctionne bien
                                  </span>
                                ) : isBad ? (
                                  <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-2 py-1 rounded-full">
                                    <XCircle className="w-3 h-3" />A améliorer
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                                    Moyen
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Publier avec localisation
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Tu peux définir des coordonnées pour placer ce quiz sur le globe.
              Laisse vide pour ne pas définir de point manuel.
            </p>
            <div className="space-y-3">
              <input
                type="number"
                step="0.0001"
                min={-90}
                max={90}
                value={locationModalLat}
                onChange={(e) => setLocationModalLat(e.target.value)}
                placeholder="Latitude (ex: 46.2044)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
              <input
                type="number"
                step="0.0001"
                min={-180}
                max={180}
                value={locationModalLng}
                onChange={(e) => setLocationModalLng(e.target.value)}
                placeholder="Longitude (ex: 6.1432)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowLocationModal(false);
                  setLocationModalQuizId(null);
                  setLocationModalLat("");
                  setLocationModalLng("");
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmPublishWithLocation}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                Publier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
