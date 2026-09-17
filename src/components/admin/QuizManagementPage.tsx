import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useNotifications } from "../../contexts/NotificationContext";
import {
  BookOpen,
  Search,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Download,
  Upload,
} from "lucide-react";
import type { Database } from "../../lib/database.types";
import { ConfirmModal } from "../common/ConfirmModal";
import {
  QuestionPerformanceModal,
  type QuizWithCreator,
  type QuizPerformanceSummary,
  type QuestionPerformance,
} from "./quiz/QuestionPerformanceModal";
import { QuizAdminTable } from "./quiz/QuizAdminTable";
import {
  useCategoriesQuery,
  useDifficultiesQuery,
} from "../../lib/queries/quizMetadataQueries";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Question = Database["public"]["Tables"]["questions"]["Row"];

export interface QuizManagementPageProps {
  onNavigate?: (view: string, data?: Record<string, unknown>) => void;
}

type SortBy = "created" | "plays" | "score";
type FilterStatus = "all" | "public" | "private";
type QuizWithCreatorRaw = Quiz & { creator?: Profile | Profile[] | null };
type SessionPerfRow = { id: string; score: number | null; accuracy_percentage: number | null };

export function QuizManagementPage({ onNavigate: _onNavigate }: QuizManagementPageProps = {}) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { t } = useLanguage();
  const { showAppNotification } = useNotifications();
  const { data: categories = [] } = useCategoriesQuery();
  const { data: difficulties = [] } = useDifficultiesQuery();
  const [quizzes, setQuizzes] = useState<QuizWithCreator[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<QuizWithCreator[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("created");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
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
  const [inlineLocationQuizId, setInlineLocationQuizId] = useState<string | null>(null);
  const [inlineLocationLat, setInlineLocationLat] = useState("");
  const [inlineLocationLng, setInlineLocationLng] = useState("");
  const [savingInlineLocation, setSavingInlineLocation] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    message: string;
    onConfirm: null | (() => void | Promise<void>);
  }>({ open: false, message: "", onConfirm: null });

  // Export Modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportQuizData, setExportQuizData] = useState("");
  const [exportQuizTitle, setExportQuizTitle] = useState("");

  // Import Modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");
  const [importLanguage, setImportLanguage] = useState("en");
  const [importVerificationResult, setImportVerificationResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, [sortBy, filterStatus, filterReported, filterMissingLocation, categoryFilter, difficultyFilter]);

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

    if (categoryFilter !== "all") {
      query = query.eq("category", categoryFilter as any);
    }
    if (difficultyFilter !== "all") {
      query = query.eq("difficulty", difficultyFilter as any);
    }

    if (filterReported) {
      query = query.eq("is_reported", true);
    }
    if (filterMissingLocation) {
      query = query.or("location_lat.is.null,location_lng.is.null");
    }

    const { data } = await query
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
      const quizzesWithCreator = (data as QuizWithCreatorRaw[]).map((quiz) => {
        const rawCreator = Array.isArray(quiz.creator) ? quiz.creator[0] : quiz.creator;
        return {
          ...quiz,
          creator: rawCreator ?? undefined,
        };
      });
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
      const quizzesWithCreator = (data as QuizWithCreatorRaw[]).map((quiz) => {
        const rawCreator = Array.isArray(quiz.creator) ? quiz.creator[0] : quiz.creator;
        return {
          ...quiz,
          creator: rawCreator ?? undefined,
        };
      });
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

    setConfirmModal({
      open: true,
      message: `Rendre ce quiz ${statusText} ?`,
      onConfirm: async () => {
        await applyQuizVisibilityChange(
          quizId,
          isPublic,
          isGlobal,
          newIsPublic,
          newIsGlobal,
          statusText
        );
      },
    });
  };

  const applyQuizVisibilityChange = async (
    quizId: string,
    isPublic: boolean,
    isGlobal: boolean,
    newIsPublic: boolean,
    newIsGlobal: boolean,
    statusText: string
  ) => {

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

    const { error } = await (supabase as any)
      .from("quizzes")
      .update(updatePayload)
      .eq("id", quizId);

    if (error) {
      showAppNotification({ type: "error", message: "Erreur : " + error.message });
      return;
    }

    showAppNotification({ type: "success", message: `Quiz rendu ${statusText} !` });
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
        (locationLat === null || !Number.isFinite(locationLat) || locationLat < -90 || locationLat > 90)) ||
      (lngTrimmed !== "" &&
        (locationLng === null ||
          !Number.isFinite(locationLng) ||
          locationLng < -180 ||
          locationLng > 180))
    ) {
      showAppNotification({
        type: "error",
        message: "Coordonnées invalides. Lat: -90..90, Lng: -180..180",
      });
      return;
    }

    const { error } = await (supabase as any)
      .from("quizzes")
      .update({
        is_public: true,
        is_global: false,
        location_lat: locationLat,
        location_lng: locationLng,
      })
      .eq("id", locationModalQuizId);

    if (error) {
      showAppNotification({ type: "error", message: "Erreur : " + error.message });
      return;
    }

    setShowLocationModal(false);
    setLocationModalQuizId(null);
    setLocationModalLat("");
    setLocationModalLng("");
    showAppNotification({ type: "success", message: "Quiz rendu public !" });
    loadQuizzes();
  };

  const openInlineLocationEditor = (quiz: QuizWithCreator) => {
    setInlineLocationQuizId(quiz.id);
    setInlineLocationLat(
      quiz.location_lat !== null && quiz.location_lat !== undefined
        ? String(quiz.location_lat)
        : ""
    );
    setInlineLocationLng(
      quiz.location_lng !== null && quiz.location_lng !== undefined
        ? String(quiz.location_lng)
        : ""
    );
  };

  const saveInlineLocation = async () => {
    if (!inlineLocationQuizId) return;
    const latTrimmed = inlineLocationLat.trim();
    const lngTrimmed = inlineLocationLng.trim();
    const locationLat = latTrimmed === "" ? null : Number(latTrimmed);
    const locationLng = lngTrimmed === "" ? null : Number(lngTrimmed);
    if (
      (latTrimmed !== "" &&
        (locationLat === null || !Number.isFinite(locationLat) || locationLat < -90 || locationLat > 90)) ||
      (lngTrimmed !== "" &&
        (locationLng === null ||
          !Number.isFinite(locationLng) ||
          locationLng < -180 ||
          locationLng > 180))
    ) {
      showAppNotification({
        type: "error",
        message: "Coordonnées invalides. Lat: -90..90, Lng: -180..180",
      });
      return;
    }
    setSavingInlineLocation(true);
    const { error } = await (supabase as any)
      .from("quizzes")
      .update({
        location_lat: locationLat,
        location_lng: locationLng,
      })
      .eq("id", inlineLocationQuizId);
    setSavingInlineLocation(false);
    if (error) {
      showAppNotification({ type: "error", message: "Erreur : " + error.message });
      return;
    }
    showAppNotification({ type: "success", message: "Localisation enregistrée." });
    setInlineLocationQuizId(null);
    setInlineLocationLat("");
    setInlineLocationLng("");
    loadQuizzes();
  };

  const duplicateQuiz = async (quiz: QuizWithCreator) => {
    setConfirmModal({
      open: true,
      message: `Dupliquer le quiz "${quiz.title}" ?`,
      onConfirm: async () => {
        await performDuplicateQuiz(quiz);
      },
    });
  };

  const performDuplicateQuiz = async (quiz: QuizWithCreator) => {
    try {
      const { data, error } = await (supabase as any).rpc("duplicate_quiz", {
        p_quiz_id: quiz.id,
        p_new_title: `${quiz.title} (copie)`,
      });

      if (error) {
        console.error("Erreur:", error);
        showAppNotification({
          type: "error",
          message: "Erreur lors de la duplication : " + error.message,
        });
        return;
      }

      showAppNotification({
        type: "success",
        message: `Quiz "${quiz.title}" dupliqué avec succès ! ID: ${data}`,
      });
      loadQuizzes();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      showAppNotification({ type: "error", message: "Erreur : " + message });
    }
  };

  const resetQuizStats = async (quizId: string, quizTitle: string) => {
    setConfirmModal({
      open: true,
      message: `Réinitialiser les statistiques de "${quizTitle}" ? Cela remettra à zéro le nombre de parties, le score moyen et les signalements.`,
      onConfirm: async () => {
        await performResetQuizStats(quizId, quizTitle);
      },
    });
  };

  const performResetQuizStats = async (quizId: string, quizTitle: string) => {
    const { error } = await (supabase as any)
      .from("quizzes")
      .update({
        total_plays: 0,
        average_score: 0,
        is_reported: false,
        report_count: 0,
      })
      .eq("id", quizId);

    if (error) {
      showAppNotification({ type: "error", message: "Erreur : " + error.message });
      return;
    }

    showAppNotification({
      type: "success",
      message: `Statistiques réinitialisées pour "${quizTitle}" !`,
    });
    loadQuizzes();
  };

  const deleteQuiz = async () => {
    if (!selectedQuiz) return;

    if (!deleteReason.trim()) {
      showAppNotification({ type: "error", message: "Tu dois indiquer une raison" });
      return;
    }

    try {
      // Supprimer les réponses des sessions de jeu
      const { data: sessions } = await supabase
        .from("game_sessions")
        .select("id")
        .eq("quiz_id", selectedQuiz.id);
      const typedSessions = (sessions || []) as Array<{ id: string }>;

      if (typedSessions.length > 0) {
        for (const session of typedSessions) {
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
        showAppNotification({ type: "error", message: "Erreur : " + error.message });
        return;
      }

      // Mettre à jour le compteur de quiz publiés du créateur
      if (selectedQuiz.is_public) {
        const { data: creatorProfile } = await supabase
          .from("profiles")
          .select("published_quiz_count")
          .eq("id", selectedQuiz.creator_id)
          .single();
        const typedCreatorProfile = creatorProfile as
          | { published_quiz_count: number | null }
          | null;

        if (typedCreatorProfile) {
          await (supabase as any)
            .from("profiles")
            .update({
              published_quiz_count: Math.max(
                0,
                (typedCreatorProfile.published_quiz_count || 0) - 1
              ),
            })
            .eq("id", selectedQuiz.creator_id);
        }
      }

      showAppNotification({
        type: "success",
        message: `Quiz "${selectedQuiz.title}" supprimé avec succès !`,
      });
      setShowDeleteModal(false);
      setDeleteReason("");
      setSelectedQuiz(null);
      loadQuizzes();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      showAppNotification({
        type: "error",
        message: "Erreur lors de la suppression : " + message,
      });
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
    const typedSessions = (sessionsData || []) as SessionPerfRow[];

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

  const handleExportQuiz = async (quiz: QuizWithCreator) => {
    try {
      const { data: questions, error } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", quiz.id)
        .order("order_index", { ascending: true });

      if (error) throw error;

      const exportData = {
        title: quiz.title,
        description: quiz.description,
        category: quiz.category,
        difficulty: quiz.difficulty,
        time_limit_seconds: quiz.time_limit_seconds,
        cover_image_url: quiz.cover_image_url,
        randomize_questions: quiz.randomize_questions,
        randomize_answers: quiz.randomize_answers,
        location_lat: quiz.location_lat,
        location_lng: quiz.location_lng,
        language: quiz.language,
        tags: quiz.tags,
        questions: questions.map((q) => ({
          question_text: q.question_text,
          question_type: q.question_type,
          correct_answer: q.correct_answer,
          correct_answers: q.correct_answers,
          options: q.options,
          points: q.points,
          complement_if_wrong: q.complement_if_wrong,
          map_data: q.map_data,
          image_url: q.image_url,
          option_images: q.option_images,
          randomize_options: q.randomize_options,
        })),
      };

      setExportQuizData(JSON.stringify(exportData, null, 2));
      setExportQuizTitle(quiz.title);
      setShowExportModal(true);
    } catch (err: any) {
      showAppNotification({ type: "error", message: "Erreur lors de l'export: " + err.message });
    }
  };

  const handleVerifyImport = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      if (!parsed.title || !Array.isArray(parsed.questions)) {
        throw new Error("Format JSON invalide. Il manque 'title' ou 'questions'.");
      }
      setImportVerificationResult(parsed);
    } catch (err: any) {
      showAppNotification({ type: "error", message: "Erreur JSON: " + err.message });
      setImportVerificationResult(null);
    }
  };

  const handlePublishImport = async () => {
    if (!importVerificationResult) return;
    setImporting(true);
    try {
      const newQuiz = {
        creator_id: profile!.id,
        title: importVerificationResult.title,
        description: importVerificationResult.description || null,
        category: importVerificationResult.category || "mixed",
        difficulty: importVerificationResult.difficulty || "medium",
        time_limit_seconds: importVerificationResult.time_limit_seconds || null,
        is_public: true,
        is_global: false,
        language: importLanguage,
        tags: importVerificationResult.tags || [],
        cover_image_url: importVerificationResult.cover_image_url || null,
        randomize_questions: importVerificationResult.randomize_questions ?? null,
        randomize_answers: importVerificationResult.randomize_answers ?? null,
        location_lat: importVerificationResult.location_lat ?? null,
        location_lng: importVerificationResult.location_lng ?? null,
      };

      const { data: insertedQuiz, error: quizError } = await supabase
        .from("quizzes")
        .insert(newQuiz)
        .select()
        .single();

      if (quizError) throw quizError;

      const newQuestions = importVerificationResult.questions.map((q: any, idx: number) => ({
        quiz_id: insertedQuiz.id,
        question_text: q.question_text,
        question_type: q.question_type || "mcq",
        correct_answer: q.correct_answer || "",
        correct_answers: q.correct_answers || null,
        options: q.options || null,
        points: q.points || 10,
        order_index: idx,
        complement_if_wrong: q.complement_if_wrong || null,
        map_data: q.map_data || null,
        image_url: q.image_url || null,
        option_images: q.option_images || null,
        randomize_options: q.randomize_options ?? null,
      }));

      const { error: questionsError } = await supabase
        .from("questions")
        .insert(newQuestions);

      if (questionsError) throw questionsError;

      showAppNotification({ type: "success", message: "Quiz importé et publié avec succès !" });
      setShowImportModal(false);
      setImportJsonText("");
      setImportVerificationResult(null);
      loadQuizzes();
    } catch (err: any) {
      showAppNotification({ type: "error", message: "Erreur lors de l'import: " + err.message });
    } finally {
      setImporting(false);
    }
  };


  if (profile?.role !== "admin") {
    return (
      <div className="w-full px-1 py-4">
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
  const missingLocationQuizzes = displayQuizzes.filter(
    (quiz) => quiz.location_lat === null || quiz.location_lng === null
  );

  return (
    <div className="w-full px-1 py-4">
      {/* En-tête */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
            <BookOpen className="w-10 h-10 mr-3 text-emerald-600" />
            Gestion des quiz
          </h1>
          <p className="text-gray-600">
            Gère les quiz, leur visibilité et leurs statistiques
          </p>
        </div>
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
        >
          <Upload className="w-5 h-5" />
          <span>Importer un Quiz JSON</span>
        </button>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Tri */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trier par
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
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
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              >
                <option value="all">Tous les quiz</option>
                <option value="public">Publics uniquement</option>
                <option value="private">Privés uniquement</option>
              </select>
            </div>

            {/* Filtre catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              >
                <option value="all">Toutes</option>
                {categories.map((c) => (
                  <option key={c.id || c.name} value={c.name}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre difficulté */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulté
              </label>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              >
                <option value="all">Toutes</option>
                {difficulties.map((d) => (
                  <option key={d.id || d.name} value={d.name}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre signalés */}
            <div className="flex items-end pb-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterReported}
                  onChange={(e) => setFilterReported(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Signalés
                </span>
              </label>
            </div>

            {/* Filtre sans localisation */}
            <div className="flex items-end pb-2">
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
          {missingLocationQuizzes.length > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-900">
                {missingLocationQuizzes.length} quiz sans localisation.
              </p>
              <button
                onClick={() => openInlineLocationEditor(missingLocationQuizzes[0])}
                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
              >
                Corriger maintenant
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Liste des quiz */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <QuizAdminTable
          loading={loading}
          quizzes={displayQuizzes}
          categories={categories}
          difficulties={difficulties}
          onNavigateEdit={(quizId) => navigate(`/quizzes/edit/${quizId}`)}
          onNavigateProfile={(userId) => navigate(`/profile/${userId}`)}
          onDuplicate={duplicateQuiz}
          onPerformance={loadQuizPerformance}
          onToggleVisibility={toggleQuizVisibility}
          onResetStats={resetQuizStats}
          onExport={handleExportQuiz}
          onDelete={(quiz) => {
            setSelectedQuiz(quiz);
            setShowDeleteModal(true);
          }}
          onOpenInlineLocation={openInlineLocationEditor}
          inlineLocationQuizId={inlineLocationQuizId}
          inlineLocationLat={inlineLocationLat}
          inlineLocationLng={inlineLocationLng}
          onInlineLocationLatChange={setInlineLocationLat}
          onInlineLocationLngChange={setInlineLocationLng}
          onSaveInlineLocation={saveInlineLocation}
          onCancelInlineLocation={() => {
            setInlineLocationQuizId(null);
            setInlineLocationLat("");
            setInlineLocationLng("");
          }}
          savingInlineLocation={savingInlineLocation}
        />
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
      <QuestionPerformanceModal
        isOpen={showPerformanceModal}
        onClose={() => {
          setShowPerformanceModal(false);
          setPerformanceSummary(null);
        }}
        summary={performanceSummary}
        loading={performanceLoading}
      />

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
      {/* Modal Export Quiz */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 flex flex-col max-h-[90vh]">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <Download className="w-6 h-6 mr-2 text-indigo-600" />
              Exporter pour traduction: {exportQuizTitle}
            </h3>
            
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4 text-sm text-indigo-800">
              <p className="font-semibold mb-1">Instruction pour l'IA (ChatGPT, Claude, etc.) :</p>
              <p className="mb-2">Copie le prompt ci-dessous avec le JSON. L'IA traduira tout le contenu texte et renverra un JSON valide que tu pourras importer.</p>
              <div className="bg-white p-3 rounded border border-indigo-100 flex justify-between items-start gap-4">
                <code className="text-xs break-words whitespace-pre-wrap flex-1">
                  Je te fournis un quiz au format JSON. Traduis toutes les valeurs des champs textuels suivants dans la langue souhaitée : 'title', 'description', 'question_text', 'correct_answer', 'correct_answers' (tableau), 'options' (tableau ou objet), 'complement_if_wrong', et 'countryMultiPrompt' (si présent dans map_data). Ne modifie PAS la structure du JSON, ni les clés, ni les champs techniques ('question_type', 'category', 'difficulty', 'points', 'map_data' sauf les textes éventuels, 'image_url', 'option_images', 'randomize_options', 'location_lat', 'location_lng'). Renvoie uniquement le code JSON traduit, sans aucun autre texte avant ou après. Voici le JSON :
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`Je te fournis un quiz au format JSON. Traduis toutes les valeurs des champs textuels suivants dans la langue souhaitée : 'title', 'description', 'question_text', 'correct_answer', 'correct_answers' (tableau), 'options' (tableau ou objet), 'complement_if_wrong', et 'countryMultiPrompt' (si présent dans map_data). Ne modifie PAS la structure du JSON, ni les clés, ni les champs techniques ('question_type', 'category', 'difficulty', 'points', 'map_data' sauf les textes éventuels, 'image_url', 'option_images', 'randomize_options', 'location_lat', 'location_lng'). Renvoie uniquement le code JSON traduit, sans aucun autre texte avant ou après. Voici le JSON :\n\n${exportQuizData}`);
                    showAppNotification({ type: "success", message: "Prompt + JSON copié !" });
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs whitespace-nowrap"
                >
                  Tout copier
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col min-h-0 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Données du Quiz (JSON)</label>
              <textarea 
                className="w-full flex-1 p-3 border border-gray-300 rounded-lg font-mono text-xs outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                readOnly
                value={exportQuizData}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setExportQuizData("");
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([exportQuizData], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `quiz_export_${exportQuizTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger JSON</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import Quiz */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 flex flex-col max-h-[90vh]">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <Upload className="w-6 h-6 mr-2 text-emerald-600" />
              Importer un Quiz JSON
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Langue du quiz importé</label>
              <select
                value={importLanguage}
                onChange={(e) => setImportLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              >
                <option value="fr">Français (fr)</option>
                <option value="en">Anglais (en)</option>
                <option value="es">Espagnol (es)</option>
                <option value="de">Allemand (de)</option>
                <option value="it">Italien (it)</option>
                <option value="pt">Portugais (pt)</option>
              </select>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col min-h-[300px] mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Colle le JSON traduit ici
              </label>
              <textarea 
                className="w-full flex-1 p-3 border border-gray-300 rounded-lg font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                placeholder='{"title": "Mon Quiz", "questions": [...]}'
                value={importJsonText}
                onChange={(e) => {
                  setImportJsonText(e.target.value);
                  setImportVerificationResult(null);
                }}
              />
            </div>

            {importVerificationResult && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      JSON Valide !
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      <strong>Titre :</strong> {importVerificationResult.title}<br/>
                      <strong>Questions :</strong> {importVerificationResult.questions?.length || 0} question(s)
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mt-auto">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportJsonText("");
                  setImportVerificationResult(null);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
              
              <div className="flex space-x-3">
                {!importVerificationResult ? (
                  <button
                    onClick={handleVerifyImport}
                    disabled={!importJsonText.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    Vérifier
                  </button>
                ) : (
                  <button
                    onClick={handlePublishImport}
                    disabled={importing}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center disabled:opacity-50"
                  >
                    {importing ? "Publication..." : "Publier le Quiz"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
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
