import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  X,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { triggerConfetti } from "../common/Confetti";
import type { Database } from "../../lib/database.types";
import {
  useQuizForm,
  QuizGeneralSettings,
  QuestionList,
  createDefaultQuestion,
  type QuestionItem,
} from "./form";

interface EditQuizPageProps {
  quizId?: string;
  onNavigate?: (view: string) => void;
}

export function EditQuizPage({
  quizId: propQuizId,
  onNavigate,
}: EditQuizPageProps = {}) {
  const navigate = useNavigate();
  const params = useParams<{ quizId?: string }>();
  const quizId = propQuizId || params.quizId;

  const { profile } = useAuth();
  const { t } = useLanguage();
  const { showAppNotification } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"settings" | "questions">("questions");

  const {
    formData,
    setFormData,
    updateFormField,
    questions,
    setQuestions,
    currentQuestion,
    setCurrentQuestion,
    editingIndex,
    startEditing,
    cancelEditing,
    moveUp,
    moveDown,
    deleteQuestion,
    commitCurrentQuestion,
    validateAll,
    error,
    setError,
    saving,
    setSaving,
  } = useQuizForm();

  const totalPoints = questions.reduce(
    (sum, q) => sum + (Number(q.points) || 100),
    0
  );
  const estimatedMinutes = Math.max(1, Math.round((questions.length * 20) / 60));

  const handleNavigateBack = () => {
    if (onNavigate) {
      onNavigate("quizzes");
    } else {
      navigate("/quizzes");
    }
  };

  useEffect(() => {
    if (!quizId) {
      setError("ID de quiz manquant");
      setLoading(false);
      return;
    }

    const loadQuizData = async () => {
      try {
        const { data: quizData, error: quizFetchError } = await supabase
          .from("quizzes")
          .select("*")
          .eq("id", quizId)
          .single();

        if (quizFetchError || !quizData) {
          setError(t("editQuiz.errors.notFound"));
          setLoading(false);
          return;
        }

        if (quizData.creator_id !== profile?.id && profile?.role !== "admin") {
          setError("Tu n'as pas la permission d'éditer ce quiz");
          setLoading(false);
          return;
        }

        setFormData({
          title: quizData.title,
          description: quizData.description || "",
          category: quizData.category,
          difficulty: quizData.difficulty as any,
          timeLimitSeconds: quizData.time_limit_seconds || 30,
          coverImageUrl: quizData.cover_image_url || "",
          quizLanguage: (quizData.language as any) || "fr",
          selectedQuizType: quizData.quiz_type_id || "",
          randomizeQuestions: quizData.randomize_questions || false,
          randomizeAnswers: quizData.randomize_answers || false,
          isPublic: quizData.is_public || false,
          tags: quizData.tags || [],
          locationLat:
            quizData.location_lat !== null && quizData.location_lat !== undefined
              ? String(quizData.location_lat)
              : "",
          locationLng:
            quizData.location_lng !== null && quizData.location_lng !== undefined
              ? String(quizData.location_lng)
              : "",
        });

        const { data: questionsData } = await supabase
          .from("questions")
          .select("*")
          .eq("quiz_id", quizId)
          .order("order_index");

        if (questionsData) {
          setQuestions(
            questionsData.map((q) => ({
              ...q,
              isNew: false,
            })) as QuestionItem[]
          );
        }
      } catch (err: any) {
        setError(err.message || "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    };

    loadQuizData();
  }, [quizId, profile?.id, profile?.role, setFormData, setQuestions, setError, t]);

  const handleAddNewQuestion = () => {
    const newQ: QuestionItem = {
      ...createDefaultQuestion(questions.length),
      id: `temp_${Date.now()}`,
      quiz_id: quizId,
      isNew: true,
    };
    const nextList = [...questions, newQ];
    setQuestions(nextList);
    setCurrentQuestion(newQ);
    startEditing(nextList.length - 1);
  };

  const makeQuizPrivate = async () => {
    if (!quizId) return;

    if (confirm("Voulez-vous vraiment rendre ce quiz privé ?")) {
      const { error: updateError } = await supabase
        .from("quizzes")
        .update({
          is_public: false,
          is_global: false,
          validation_status: null,
          pending_validation: false,
        })
        .eq("id", quizId);

      if (updateError) {
        showAppNotification({
          type: "error",
          message: "Erreur lors de la modification",
        });
      } else {
        showAppNotification({
          type: "success",
          message: "Quiz rendu privé avec succès !",
        });
        updateFormField("isPublic", false);
      }
    }
  };

  const saveQuiz = async () => {
    if (!profile || !quizId) return;

    if (!validateAll(profile.role === "admin")) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const parsedLocationLat =
        formData.locationLat.trim() === ""
          ? null
          : Number(formData.locationLat);
      const parsedLocationLng =
        formData.locationLng.trim() === ""
          ? null
          : Number(formData.locationLng);

      const quizUpdatePayload: Database["public"]["Tables"]["quizzes"]["Update"] = {
        title: formData.title,
        description: formData.description,
        category: formData.category as any,
        difficulty: formData.difficulty as any,
        time_limit_seconds: formData.timeLimitSeconds,
        cover_image_url: formData.coverImageUrl || null,
        language: formData.quizLanguage,
        quiz_type_id: formData.selectedQuizType || null,
        randomize_questions: formData.randomizeQuestions,
        randomize_answers: formData.randomizeAnswers,
        tags: formData.tags.length > 0 ? formData.tags : null,
      };

      if (profile.role === "admin") {
        quizUpdatePayload.location_lat = parsedLocationLat;
        quizUpdatePayload.location_lng = parsedLocationLng;
      }

      const { error: quizUpdateError } = await supabase
        .from("quizzes")
        .update(quizUpdatePayload)
        .eq("id", quizId);

      if (quizUpdateError) {
        throw quizUpdateError;
      }

      const { data: existingQuestions } = await supabase
        .from("questions")
        .select("id")
        .eq("quiz_id", quizId);

      const orderedQuestions = questions.map((q, index) => {
        const base = { ...q, order_index: index };
        if (base.question_type === "map_click") {
          return {
            ...base,
            correct_answer: "__AUTO__",
          };
        }
        return base;
      });

      if (existingQuestions) {
        const currentQuestionIds = orderedQuestions
          .filter((q) => !q.isNew && q.id && !q.id.startsWith("temp_"))
          .map((q) => q.id);

        const questionsToDelete = existingQuestions
          .filter((eq) => !currentQuestionIds.includes(eq.id))
          .map((eq) => eq.id);

        if (questionsToDelete.length > 0) {
          const { error: deleteQuestionsError } = await supabase
            .from("questions")
            .delete()
            .in("id", questionsToDelete);

          if (deleteQuestionsError) {
            throw deleteQuestionsError;
          }
        }
      }

      for (const question of orderedQuestions) {
        const isNew =
          question.isNew || !question.id || question.id.startsWith("temp_");

        const puzzleMapData =
          (question.question_type === "puzzle_map" ||
            question.question_type === "map_click") &&
          question.map_data
            ? { ...question.map_data, showTargetList: false }
            : question.map_data || null;

        const optionsToStore =
          question.question_type === "mcq" ||
          question.question_type === "top10_order"
            ? (question.options || []).filter((opt) => opt.trim())
            : null;

        const correctAnswersToStore =
          question.question_type === "mcq" ||
          question.question_type === "single_answer" ||
          question.question_type === "text_free"
            ? (question.correct_answers || []).filter((v) => v.trim())
            : null;

        if (isNew) {
          const { id: _, isNew: __, ...insertPayload } = question;
          const { error: insertError } = await supabase
            .from("questions")
            .insert({
              ...insertPayload,
              quiz_id: quizId,
              map_data: puzzleMapData as any,
              options: optionsToStore,
              correct_answers: correctAnswersToStore,
              image_url: question.image_url || null,
              option_images:
                question.option_images &&
                Object.keys(question.option_images).length > 0
                  ? question.option_images
                  : null,
              complement_if_wrong: question.complement_if_wrong || null,
            });

          if (insertError) throw insertError;
        } else {
          const { id: _, isNew: __, ...updatePayload } = question;
          const { error: updateError } = await supabase
            .from("questions")
            .update({
              question_text: updatePayload.question_text,
              question_type: updatePayload.question_type,
              correct_answer: updatePayload.correct_answer,
              correct_answers: correctAnswersToStore,
              options: optionsToStore,
              map_data: puzzleMapData as any,
              image_url: updatePayload.image_url || null,
              option_images:
                updatePayload.option_images &&
                Object.keys(updatePayload.option_images).length > 0
                  ? updatePayload.option_images
                  : null,
              points: updatePayload.points,
              order_index: updatePayload.order_index,
              complement_if_wrong: updatePayload.complement_if_wrong || null,
            })
            .eq("id", question.id!);

          if (updateError) throw updateError;
        }
      }

      triggerConfetti();

      showAppNotification({
        type: "success",
        message: t("editQuiz.updateSuccess"),
      });
      handleNavigateBack();
    } catch (err: any) {
      setError(err.message || t("createQuiz.errors.createError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
        <p className="text-sm font-black text-slate-600">Chargement de votre atelier quiz...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Back Navigation */}
      <div className="mb-5">
        <button
          onClick={handleNavigateBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs font-bold text-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("editQuiz.backToQuizzes")}</span>
        </button>
      </div>

      {/* Hero Creator Studio Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-700 text-white p-6 sm:p-8 shadow-xl shadow-indigo-700/10 mb-6">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-52 h-52 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-44 h-44 bg-indigo-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-indigo-100 text-xs font-black tracking-wide uppercase mb-3 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Atelier de Modification</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
            <span>{formData.title || t("editQuiz.title")}</span>
            <span className="text-2xl sm:text-3xl">🛠️</span>
          </h1>

          <p className="text-indigo-100 text-sm sm:text-base font-medium max-w-2xl leading-relaxed mb-6">
            Peaufinez les questions, les anecdotes pédagogiques et la configuration générale de votre quiz.
          </p>

          {/* Live Quiz Stats Capsule */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-white/15">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/40 text-sky-100 flex items-center justify-center font-black text-base shrink-0">
                🧩
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-indigo-200 font-bold uppercase tracking-wider">
                  Questions
                </div>
                <div className="text-base sm:text-lg font-black text-white">
                  {questions.length}
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/40 text-amber-100 flex items-center justify-center font-black text-base shrink-0">
                ⭐
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-indigo-200 font-bold uppercase tracking-wider">
                  XP Total
                </div>
                <div className="text-base sm:text-lg font-black text-white">
                  {totalPoints} XP
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/40 text-indigo-100 flex items-center justify-center font-black text-base shrink-0">
                ⏱️
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-indigo-200 font-bold uppercase tracking-wider">
                  Durée estimée
                </div>
                <div className="text-base sm:text-lg font-black text-white">
                  ~{estimatedMinutes} min
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/40 text-purple-100 flex items-center justify-center font-black text-base shrink-0">
                🎯
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-indigo-200 font-bold uppercase tracking-wider">
                  Niveau
                </div>
                <div className="text-base sm:text-lg font-black text-white capitalize truncate">
                  {formData.difficulty}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      {error && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border-2 border-rose-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-black text-slate-800">Attention</h3>
              </div>
              <button
                onClick={() => setError("")}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-600 text-sm font-medium mb-6 leading-relaxed">
              {error}
            </p>
            <button
              onClick={() => setError("")}
              className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl transition-all font-black text-sm border-b-4 border-rose-700 active:border-b-0 active:translate-y-1 shadow-md shadow-rose-500/20"
            >
              Compris !
            </button>
          </div>
        </div>
      )}

      {/* Stepper Navigation Pills */}
      <div className="flex items-center gap-2 mb-6 p-1.5 bg-slate-200/70 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("questions")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all ${
            activeTab === "questions"
              ? "bg-white text-indigo-900 shadow-sm border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>🧩</span>
          <span>Questions</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-black ${
              questions.length > 0
                ? "bg-indigo-100 text-indigo-800"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {questions.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all ${
            activeTab === "settings"
              ? "bg-white text-indigo-900 shadow-sm border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>🎨</span>
          <span>Paramètres & Ambiance</span>
        </button>
      </div>

      {/* Tab 1: Questions Workshop */}
      {activeTab === "questions" && (
        <div className="space-y-6">
          <QuestionList
            questions={questions}
            onMoveUp={moveUp}
            onMoveDown={moveDown}
            onEdit={startEditing}
            onDelete={deleteQuestion}
            onAddNew={handleAddNewQuestion}
            editingIndex={editingIndex}
            editingQuestion={currentQuestion}
            onEditingQuestionChange={setCurrentQuestion}
            onSaveQuestion={commitCurrentQuestion}
            onCancelEdit={cancelEditing}
            mode="inline"
          />
        </div>
      )}

      {/* Tab 2: General Settings */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <QuizGeneralSettings
            formData={formData}
            onChange={updateFormField}
            isEditMode={true}
            onMakePrivate={makeQuizPrivate}
          />
        </div>
      )}

      {/* Footer Bottom Actions Bar */}
      <div className="mt-8 pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={handleNavigateBack}
          className="w-full sm:w-1/3 py-3.5 px-5 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 transition-all font-black text-sm border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 text-center"
        >
          {t("common.cancel")}
        </button>

        <button
          onClick={saveQuiz}
          disabled={saving}
          className="w-full sm:flex-1 py-3.5 px-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-2xl hover:brightness-105 transition-all font-black text-base border-b-4 border-indigo-900 active:border-b-0 active:translate-y-1 shadow-xl shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5 stroke-[2.5]" />
          <span>{saving ? t("editQuiz.saving") : t("editQuiz.saveChanges")}</span>
        </button>
      </div>
    </div>
  );
}
