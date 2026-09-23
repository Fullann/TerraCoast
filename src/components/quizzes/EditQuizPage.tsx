import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useNotifications } from "../../contexts/NotificationContext";
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
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

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
          {t("editQuiz.title")}
        </h1>
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
        isEditMode={true}
        onMakePrivate={makeQuizPrivate}
      />

      {/* Questions List with inline QuestionEditor support */}
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

      {/* Footer Actions */}
      <div className="flex space-x-4 pt-6">
        <button
          onClick={handleNavigateBack}
          className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          {t("common.cancel")}
        </button>
        <button
          onClick={saveQuiz}
          disabled={saving}
          className="flex-1 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center"
        >
          <Save className="w-5 h-5 mr-2" />
          {saving ? t("editQuiz.saving") : t("editQuiz.saveChanges")}
        </button>
      </div>
    </div>
  );
}
