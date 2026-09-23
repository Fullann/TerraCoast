import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useNotifications } from "../../contexts/NotificationContext";
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
      <div className="mb-6">
        <button
          onClick={handleNavigateBack}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          {t("editQuiz.backToQuizzes")}
        </button>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          {t("createQuiz.title")}
        </h1>
        <p className="text-gray-600">{t("createQuiz.subtitle")}</p>
      </div>

      {error && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">⚠️ Erreur</h3>
              <button
                onClick={() => setError("")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => setError("")}
              className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* General Settings Card */}
      <QuizGeneralSettings
        formData={formData}
        onChange={updateFormField}
        isEditMode={false}
      />

      {/* Question Editor Card */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {editingIndex !== null
            ? t("createQuiz.editingQuestion").replace(
                "{number}",
                String(editingIndex + 1)
              )
            : t("createQuiz.addQuestion")}
        </h2>
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
          onEdit={startEditing}
          onDelete={deleteQuestion}
          editingIndex={editingIndex}
        />
      )}

      {/* Footer Actions */}
      <div className="flex space-x-4">
        <button
          onClick={handleNavigateBack}
          className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          {t("common.cancel")}
        </button>
        <button
          onClick={saveQuiz}
          disabled={saving || questions.length === 0}
          className="flex-1 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Save className="w-5 h-5 mr-2" />
          {saving ? t("editQuiz.saving") : t("createQuiz.saveQuiz")}
        </button>
      </div>
    </div>
  );
}
