import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  useQuizForm,
  QuizGeneralSettings,
  QuestionEditor,
  QuestionList,
} from "./form";

interface CreateQuizPageProps {
  onNavigate?: (view: string) => void;
}

export function CreateQuizPage({ onNavigate }: CreateQuizPageProps = {}) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { t } = useLanguage();
  const { showAppNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<"settings" | "questions">("settings");

  const {
    formData,
    updateFormField,
    questions,
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

  const saveQuiz = async () => {
    if (!profile) return;

    if (!validateAll(profile.role === "admin")) {
      return;
    }

    if (formData.isPublic && profile.published_quiz_count >= 10) {
      setError(t("createQuiz.errors.maxQuizReached"));
      return;
    }

    setSaving(true);
    setError("");

    try {
      const isGlobal = profile.role === "admin" && formData.isPublic;
      const parsedLocationLat =
        formData.locationLat.trim() === ""
          ? null
          : Number(formData.locationLat);
      const parsedLocationLng =
        formData.locationLng.trim() === ""
          ? null
          : Number(formData.locationLng);

      const quizData: any = {
        creator_id: profile.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        difficulty: formData.difficulty,
        time_limit_seconds: formData.timeLimitSeconds,
        cover_image_url: formData.coverImageUrl || null,
        randomize_questions: formData.randomizeQuestions,
        randomize_answers: formData.randomizeAnswers,
        language: formData.quizLanguage,
        quiz_type_id: formData.selectedQuizType || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
      };

      if (profile.role === "admin") {
        quizData.is_public = formData.isPublic;
        quizData.is_global = isGlobal;
        quizData.validation_status = "approved";
        quizData.pending_validation = false;
        quizData.published_at = formData.isPublic
          ? new Date().toISOString()
          : null;
        quizData.location_lat = parsedLocationLat;
        quizData.location_lng = parsedLocationLng;
      } else if (formData.isPublic) {
        quizData.is_public = false;
        quizData.validation_status = "pending";
        quizData.pending_validation = true;
        quizData.published_at = null;
      } else {
        quizData.is_public = false;
        quizData.validation_status = "approved";
        quizData.pending_validation = false;
        quizData.published_at = null;
      }

      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert(quizData)
        .select()
        .single();

      if (quizError) throw quizError;

      const questionsToInsert = questions.map((q, index) => ({
        quiz_id: quiz.id,
        question_text: q.question_text,
        question_type: q.question_type,
        correct_answer: q.correct_answer,
        correct_answers:
          q.correct_answers && q.correct_answers.length > 0
            ? q.correct_answers
            : null,
        options:
          q.question_type === "mcq" || q.question_type === "top10_order"
            ? (q.options || []).filter((opt) => opt.trim())
            : null,
        map_data: (
          (q.question_type === "puzzle_map" ||
            q.question_type === "map_click") &&
          q.map_data
            ? { ...q.map_data, showTargetList: false }
            : q.map_data || null
        ) as any,
        image_url: q.image_url || null,
        option_images:
          q.option_images && Object.keys(q.option_images).length > 0
            ? q.option_images
            : null,
        points: q.points,
        order_index: index,
        complement_if_wrong: q.complement_if_wrong || null,
      }));

      const { error: questionsError } = await supabase
        .from("questions")
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      if (formData.isPublic) {
        await supabase
          .from("profiles")
          .update({ published_quiz_count: profile.published_quiz_count + 1 })
          .eq("id", profile.id);
      }

      // Celebrate!
      triggerConfetti();

      showAppNotification({
        type: "success",
        message: t("createQuiz.success"),
      });
      handleNavigateBack();
    } catch (err: any) {
      setError(err.message || t("createQuiz.errors.createError"));
    } finally {
      setSaving(false);
    }
  };

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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-6 sm:p-8 shadow-xl shadow-emerald-700/10 mb-6">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-52 h-52 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-44 h-44 bg-emerald-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-emerald-100 text-xs font-black tracking-wide uppercase mb-3 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Studio de Création TerraCoast</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
            <span>{t("createQuiz.title")}</span>
            <span className="text-2xl sm:text-3xl">🎨</span>
          </h1>

          <p className="text-emerald-100 text-sm sm:text-base font-medium max-w-2xl leading-relaxed mb-6">
            {t("createQuiz.subtitle")}
          </p>

          {/* Live Quiz Stats Capsule */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-white/15">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/40 text-emerald-100 flex items-center justify-center font-black text-base shrink-0">
                🧩
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-emerald-200 font-bold uppercase tracking-wider">
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
                <div className="text-[11px] text-emerald-200 font-bold uppercase tracking-wider">
                  XP Total
                </div>
                <div className="text-base sm:text-lg font-black text-white">
                  {totalPoints} XP
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/40 text-sky-100 flex items-center justify-center font-black text-base shrink-0">
                ⏱️
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-emerald-200 font-bold uppercase tracking-wider">
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
                <div className="text-[11px] text-emerald-200 font-bold uppercase tracking-wider">
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
          onClick={() => setActiveTab("settings")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all ${
            activeTab === "settings"
              ? "bg-white text-emerald-800 shadow-sm border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>🎨</span>
          <span>1. Paramètres & Ambiance</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("questions")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all ${
            activeTab === "questions"
              ? "bg-white text-emerald-800 shadow-sm border border-slate-200/80"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>🧩</span>
          <span>2. Atelier des Questions</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-black ${
              questions.length > 0
                ? "bg-emerald-100 text-emerald-800"
                : "bg-slate-200 text-slate-600"
            }`}
          >
            {questions.length}
          </span>
        </button>
      </div>

      {/* Tab 1: General Settings */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <QuizGeneralSettings
            formData={formData}
            onChange={updateFormField}
            isEditMode={false}
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setActiveTab("questions")}
              className="py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-black text-sm border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
            >
              <span>Continuer vers les questions</span>
              <span>🧩 →</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Questions Workshop */}
      {activeTab === "questions" && (
        <div className="space-y-6">
          {/* Question Editor Card */}
          <div className="bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-5 sm:p-7">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-emerald-500/20">
                  {editingIndex !== null ? "✏️" : "✨"}
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                    {editingIndex !== null
                      ? t("createQuiz.editingQuestion").replace(
                          "{number}",
                          String(editingIndex + 1)
                        )
                      : t("createQuiz.addQuestion")}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {editingIndex !== null
                      ? "Ajustez les détails puis validez les modifications"
                      : "Sélectionnez le type de défi et configurez votre question"}
                  </p>
                </div>
              </div>
              {editingIndex !== null && (
                <span className="text-xs font-black text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
                  Question #{editingIndex + 1}
                </span>
              )}
            </div>

            <QuestionEditor
              question={currentQuestion}
              onChange={setCurrentQuestion}
              onSave={commitCurrentQuestion}
              onCancel={editingIndex !== null ? cancelEditing : undefined}
              isEditing={editingIndex !== null}
            />
          </div>

          {/* Questions List */}
          {questions.length > 0 && (
            <QuestionList
              questions={questions}
              onMoveUp={moveUp}
              onMoveDown={moveDown}
              onEdit={(idx) => {
                startEditing(idx);
                window.scrollTo({ top: 350, behavior: "smooth" });
              }}
              onDelete={deleteQuestion}
              editingIndex={editingIndex}
            />
          )}
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
          disabled={saving || questions.length === 0}
          className="w-full sm:flex-1 py-3.5 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white rounded-2xl hover:brightness-105 transition-all font-black text-base border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 shadow-xl shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5 stroke-[2.5]" />
          <span>
            {saving
              ? t("editQuiz.saving")
              : questions.length === 0
              ? "Ajoutez au moins 1 question"
              : t("createQuiz.saveQuiz")}
          </span>
          {questions.length > 0 && !saving && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full ml-1 font-bold">
              {questions.length} Q
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
