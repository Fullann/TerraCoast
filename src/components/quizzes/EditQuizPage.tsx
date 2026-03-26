import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { languageNames, Language } from "../../i18n/translations";
import {
  Plus,
  Trash2,
  ArrowLeft,
  CreditCard as Edit,
  X,
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import type { Database } from "../../lib/database.types";
import { ImageDropzone } from "./ImageDropzone";
import { CountryMultiSelect } from "./CountryMultiSelect";
import { CustomGeoJsonMapPicker } from "./CustomGeoJsonMapPicker";
import {
  getSubdivisions,
  type SubdivisionScope,
} from "../../lib/subdivisionGameData";

type QuestionType =
  | "mcq"
  | "single_answer"
  | "map_click"
  | "text_free"
  | "true_false"
  | "puzzle_map"
  | "top10_order"
  | "country_multi";
type QuizCategory = string;
type Difficulty = "easy" | "medium" | "hard";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
type Question = Database["public"]["Tables"]["questions"]["Row"];
type QuizType = Database["public"]["Tables"]["quiz_types"]["Row"];

interface EditQuizPageProps {
  quizId: string;
  onNavigate: (view: string) => void;
}

export function EditQuizPage({ quizId, onNavigate }: EditQuizPageProps) {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const { showAppNotification } = useNotifications();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<QuizCategory>("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(30);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [quizLanguage, setQuizLanguage] = useState<Language>("fr");
  const [quizTypes, setQuizTypes] = useState<QuizType[]>([]);
  const [selectedQuizType, setSelectedQuizType] = useState<string>("");
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [randomizeAnswers, setRandomizeAnswers] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [isGlobal, setIsGlobal] = useState(false);
  const [questions, setQuestions] = useState<
    (Question & { isNew?: boolean })[]
  >([]);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [top10EditDragIndex, setTop10EditDragIndex] = useState<number | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [difficulties, setDifficulties] = useState<
    { id: string; name: string; level: number }[]
  >([]);
  const mapViewPresets: Record<
    string,
    { centerLat: number; centerLng: number; zoom: number }
  > = {
    world: { centerLat: 20, centerLng: 0, zoom: 1 },
    europe: { centerLat: 54, centerLng: 15, zoom: 2.8 },
    africa: { centerLat: 5, centerLng: 20, zoom: 2.4 },
    asia: { centerLat: 30, centerLng: 95, zoom: 2.3 },
    americas: { centerLat: 10, centerLng: -75, zoom: 2.1 },
    oceania: { centerLat: -22, centerLng: 140, zoom: 2.7 },
    switzerland: { centerLat: 46.8, centerLng: 8.2, zoom: 5.2 },
    france: { centerLat: 46.6, centerLng: 2.3, zoom: 4.6 },
    usa: { centerLat: 39.8, centerLng: -98.5, zoom: 2.7 },
  };
  const [categories, setCategories] = useState<
    { id: string; name: string; label: string }[]
  >([]);

  useEffect(() => {
    loadQuiz();
    loadQuizTypes();
    loadCategories();
    loadDifficulties();
  }, [quizId]);

  const loadQuizTypes = async () => {
    const { data } = await supabase
      .from("quiz_types")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (data) setQuizTypes(data);
  };
  const loadDifficulties = async () => {
    const { data, error } = await supabase
      .from("difficulties")
      .select("*")
      .order("multiplier");
    if (error) {
      return;
    }

    if (data) {
      setDifficulties(data);
    }
  };
  const loadCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("label");

    if (error) {
      return;
    }

    if (data) {
      setCategories(data);
    }
  };

  const loadQuiz = async () => {
    const { data: quizData } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .single();

    if (quizData) {
      if (quizData.creator_id !== profile?.id && profile?.role !== "admin") {
        setError("Tu n'as pas la permission d'éditer ce quiz");
        setLoading(false);
        return;
      }

      setQuiz(quizData);
      setTitle(quizData.title);
      setDescription(quizData.description || "");
      setCategory(quizData.category);
      setDifficulty(quizData.difficulty);
      setTimeLimitSeconds(quizData.time_limit_seconds || 30);
      setCoverImageUrl(quizData.cover_image_url || "");
      setQuizLanguage((quizData.language as Language) || "fr");
      setSelectedQuizType(quizData.quiz_type_id || "");
      setRandomizeQuestions(quizData.randomize_questions || false);
      setRandomizeAnswers(quizData.randomize_answers || false);
      setIsPublic(quizData.is_public || false);
      setIsGlobal(quizData.is_global || false);
      setTags(quizData.tags || []);

      const { data: questionsData } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("order_index");

      if (questionsData) {
        setQuestions(questionsData);
      }
    }

    setLoading(false);
  };

  const updateOptionImage = (optionText: string, imageUrl: string) => {
    if (!editingQuestion) return;

    const newOptionImages = { ...(editingQuestion.option_images || {}) };
    if (imageUrl.trim()) {
      newOptionImages[optionText] = imageUrl;
    } else {
      delete newOptionImages[optionText];
    }

    setEditingQuestion({ ...editingQuestion, option_images: newOptionImages });
  };

  const startEditingQuestion = (question: Question) => {
    setEditingQuestion({ ...question });
  };

  const cancelEditingQuestion = () => {
    setEditingQuestion(null);
  };

  const addTag = () => {
    const trimmedTag = currentTag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags([...tags, trimmedTag]);
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const normalizeQuestionsOrder = (list: (Question & { isNew?: boolean })[]) =>
    list.map((question, index) => ({ ...question, order_index: index }));

  const saveQuestion = () => {
    if (!editingQuestion) return;

    const index = questions.findIndex((q) => q.id === editingQuestion.id);

    if (index >= 0) {
      const newQuestions = [...questions];
      newQuestions[index] = editingQuestion;
      setQuestions(normalizeQuestionsOrder(newQuestions));
    } else {
      setQuestions(
        normalizeQuestionsOrder([
          ...questions,
          { ...editingQuestion, order_index: questions.length },
        ])
      );
    }

    setEditingQuestion(null);
  };

  const addNewQuestion = () => {
    const newQuestion: any = {
      id: `temp_${Date.now()}`,
      quiz_id: quizId,
      question_text: "",
      question_type: "mcq" as QuestionType,
      correct_answer: "",
      correct_answers: [],
      options: ["", "", "", ""],
      map_data: null,
      image_url: null,
      points: 100,
      order_index: questions.length,
      created_at: new Date().toISOString(),
      isNew: true,
      complement_if_wrong: "",
    };

    setQuestions(normalizeQuestionsOrder([...questions, newQuestion]));
    setEditingQuestion(newQuestion);
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm(t("editQuiz.confirmDeleteQuestion"))) return;

    setQuestions((prev) =>
      normalizeQuestionsOrder(prev.filter((q) => q.id !== questionId))
    );
    if (editingQuestion?.id === questionId) {
      setEditingQuestion(null);
    }

    if (questionId.startsWith("temp_")) return;

    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", questionId);

    if (error) {
      loadQuiz();
      showAppNotification({
        type: "error",
        message: t("editQuiz.deleteQuestionError"),
      });
      return;
    }
    showAppNotification({
      type: "success",
      message: t("editQuiz.deleteQuestionSuccess"),
    });
  };

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= questions.length || fromIndex === toIndex) return;
    const reordered = [...questions];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setQuestions(normalizeQuestionsOrder(reordered));
  };

  const updateOption = (index: number, value: string) => {
    if (!editingQuestion) return;

    const newOptions = Array.isArray(editingQuestion.options)
      ? [...(editingQuestion.options as string[])]
      : ["", "", "", ""];
    newOptions[index] = value;

    setEditingQuestion({ ...editingQuestion, options: newOptions });
  };

  const addVariant = () => {
    if (!editingQuestion) return;

    const currentVariants = Array.isArray(editingQuestion.correct_answers)
      ? editingQuestion.correct_answers
      : [];

    setEditingQuestion({
      ...editingQuestion,
      correct_answers: [...currentVariants, ""],
    });
  };

  const reorderTop10EditingQuestion = (fromIndex: number, toIndex: number) => {
    if (!editingQuestion || fromIndex === toIndex) return;
    const current = Array.isArray(editingQuestion.options)
      ? [...editingQuestion.options]
      : [];
    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);
    setEditingQuestion({
      ...editingQuestion,
      options: current,
    });
  };

  const updateVariant = (index: number, value: string) => {
    if (!editingQuestion) return;

    const newVariants = [...(editingQuestion.correct_answers || [])];
    newVariants[index] = value;

    setEditingQuestion({
      ...editingQuestion,
      correct_answers: newVariants,
    });
  };

  const removeVariant = (index: number) => {
    if (!editingQuestion) return;

    const newVariants = (editingQuestion.correct_answers || []).filter(
      (_: any, i: number) => i !== index
    );

    setEditingQuestion({
      ...editingQuestion,
      correct_answers: newVariants,
    });
  };

  const makeQuizPrivate = async () => {
    if (!quiz) return;

    if (confirm("Voulez-vous vraiment rendre ce quiz privé ?")) {
      const { error } = await supabase
        .from("quizzes")
        .update({
          is_public: false,
          is_global: false,
          validation_status: null,
          pending_validation: false,
        })
        .eq("id", quizId);

      if (error) {
        showAppNotification({
          type: "error",
          message: "Erreur lors de la modification",
        });
      } else {
        showAppNotification({
          type: "success",
          message: "Quiz rendu privé avec succès !",
        });
        loadQuiz();
      }
    }
  };

  const saveQuiz = async () => {
    if (!profile || !quiz) return;

    if (!title.trim() && !coverImageUrl) {
      setError(t("editQuiz.titleRequired"));
      return;
    }

    if (!difficulty) {
      setError("La difficulté est obligatoire");
      return;
    }

    if (questions.length === 0) {
      setError(t("editQuiz.atLeastOneQuestion"));
      return;
    }

    const hasInvalidPoints = questions.some((q) => q.points > 500);
    if (hasInvalidPoints) {
      setError("Une ou plusieurs questions dépassent 500 points maximum");
      return;
    }

    const hasInvalidTop10 = questions.some((q: any) => {
      if (q.question_type !== "top10_order") return false;
      const items = (Array.isArray(q.options) ? q.options : [])
        .map((item: string) => item.trim())
        .filter(Boolean);
      return items.length < 2;
    });
    if (hasInvalidTop10) {
      setError(t("editQuiz.errors.top10Range"));
      return;
    }

    const hasInvalidCountryMulti = questions.some((q: any) => {
      if (q.question_type !== "country_multi") return false;
      const selected = Array.isArray(q.map_data?.selectedCountries)
        ? q.map_data.selectedCountries.filter((iso: string) => String(iso).trim())
        : [];
      const fields = Array.isArray(q.map_data?.requiredFields)
        ? q.map_data.requiredFields
        : [];
      const hasPromptOrTextOrImage =
        String(q.question_text || "").trim().length > 0 ||
        String(q.image_url || "").trim().length > 0 ||
        String(q.map_data?.countryMultiPrompt || "").trim().length > 0;
      return selected.length < 1 || fields.length < 1 || !hasPromptOrTextOrImage;
    });
    if (hasInvalidCountryMulti) {
      setError(t("createQuiz.countryMulti.invalidConfigError"));
      return;
    }

    const hasInvalidPuzzleMap = questions.some((q: any) => {
      if (q.question_type !== "puzzle_map") return false;
      const selected = Array.isArray(q.map_data?.selectedCountries)
        ? q.map_data.selectedCountries.filter((iso: string) => String(iso).trim())
        : [];
      return selected.length < 1;
    });
    if (hasInvalidPuzzleMap) {
      setError(t("editQuiz.errors.puzzleMinCountries"));
      return;
    }

    const hasInvalidMapClick = questions.some((q: any) => {
      if (q.question_type !== "map_click") return false;
      const selected = Array.isArray(q.map_data?.selectedCountries)
        ? q.map_data.selectedCountries.filter((iso: string) => String(iso).trim())
        : [];
      return selected.length < 1;
    });
    if (hasInvalidMapClick) {
      setError(t("editQuiz.errors.mapClickMinCountries"));
      return;
    }

    const hasInvalidCustomGeo = questions.some((q: any) => {
      if (q.question_type !== "puzzle_map" && q.question_type !== "map_click")
        return false;
      if (q.map_data?.mapLevel !== "custom_geojson") return false;
      return !String(q.map_data?.customGeojsonMapId || "").trim();
    });
    if (hasInvalidCustomGeo) {
      setError(t("createQuiz.errors.customGeojsonMapRequired"));
      return;
    }

    setSaving(true);
    setError("");

    try {
      const { error: quizUpdateError } = await supabase
        .from("quizzes")
        .update({
          title,
          description,
          category,
          difficulty,
          time_limit_seconds: timeLimitSeconds,
          cover_image_url: coverImageUrl || null,
          language: quizLanguage,
          quiz_type_id: selectedQuizType || null,
          randomize_questions: randomizeQuestions,
          randomize_answers: randomizeAnswers,
          tags: tags.length > 0 ? tags : null,
        })
        .eq("id", quizId);

      if (quizUpdateError) {
        throw quizUpdateError;
      }

      const { data: existingQuestions } = await supabase
        .from("questions")
        .select("id")
        .eq("quiz_id", quizId);

      const orderedQuestions = questions.map((question, index) => {
        const base = { ...question, order_index: index };
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
          .filter((q) => !q.isNew)
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
        if (question.isNew) {
          const { id, isNew, ...questionData } = question;
          const puzzleMapData =
            (question.question_type === "puzzle_map" ||
              question.question_type === "map_click") &&
            questionData.map_data
              ? { ...questionData.map_data, showTargetList: false }
              : questionData.map_data;
          const { error: insertQuestionError } = await supabase.from("questions").insert({
            ...questionData,
            map_data: puzzleMapData,
            options:
              question.question_type === "mcq" ||
              question.question_type === "top10_order"
                ? (Array.isArray(question.options)
                    ? question.options
                    : []
                  ).filter((opt: string) => opt.trim())
                : null,
            correct_answers:
              question.question_type === "mcq"
                ? Array.isArray(question.correct_answers)
                  ? question.correct_answers.filter((v: string) => v.trim())
                  : []
                : question.question_type === "single_answer" ||
                  question.question_type === "text_free"
                ? Array.isArray(question.correct_answers)
                  ? question.correct_answers.filter((v: string) => v.trim())
                  : []
                : null,
          });

          if (insertQuestionError) {
            throw insertQuestionError;
          }
        } else {
          const { isNew, ...questionData } = question;
          const { error: updateQuestionError } = await supabase
            .from("questions")
            .update({
              question_text: questionData.question_text,
              question_type: questionData.question_type,
              correct_answer: questionData.correct_answer,
              correct_answers:
                questionData.question_type === "mcq"
                  ? Array.isArray(questionData.correct_answers)
                    ? questionData.correct_answers.filter((v: string) =>
                        v.trim()
                      )
                    : []
                  : questionData.question_type === "single_answer" ||
                    questionData.question_type === "text_free"
                  ? Array.isArray(questionData.correct_answers)
                    ? questionData.correct_answers.filter((v: string) =>
                        v.trim()
                      )
                    : []
                  : null,
              options:
                questionData.question_type === "mcq" ||
                questionData.question_type === "top10_order"
                  ? (Array.isArray(questionData.options)
                      ? questionData.options
                      : []
                    ).filter((opt: string) => opt.trim())
                  : null,
              map_data:
                (questionData.question_type === "puzzle_map" ||
                  questionData.question_type === "map_click") &&
                questionData.map_data
                  ? { ...questionData.map_data, showTargetList: false }
                  : questionData.map_data || null,
              image_url: questionData.image_url,
              option_images: questionData.option_images || null,
              points: questionData.points,
              order_index: questionData.order_index,
              complement_if_wrong: questionData.complement_if_wrong || null,
            })
            .eq("id", question.id);

          if (updateQuestionError) {
            throw updateQuestionError;
          }
        }
      }

      showAppNotification({
        type: "success",
        message: t("editQuiz.updateSuccess"),
      });
      onNavigate("quizzes");
    } catch (err: any) {
      setError(err.message || t("editQuiz.updateError"));
    } finally {
      setSaving(false);
    }
  };

  const getCategoryLabel = (cat: string) => {
    return t(`quizzes.category.${cat}` as any);
  };

  const getDifficultyLabel = (diff: string) => {
    return t(`quizzes.difficulty.${diff}` as any);
  };

  const getQuestionTypeLabel = (type: string) => {
    if (type === "puzzle_map") return t("editQuiz.questionType.puzzle_map");
    if (type === "top10_order") return t("editQuiz.questionType.top10_order");
    if (type === "country_multi") return t("createQuiz.countryMulti.typeLabel");
    return t(`editQuiz.questionType.${type}` as any);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("editQuiz.loadingQuiz")}</p>
        </div>
      </div>
    );
  }

  const editingSubdivisionScope: SubdivisionScope =
    (editingQuestion?.map_data?.subdivisionScope as SubdivisionScope) ||
    "ch_cantons";
  const editingSubdivisionEntries =
    (editingQuestion?.question_type === "puzzle_map" ||
      editingQuestion?.question_type === "map_click") &&
    (editingQuestion?.map_data?.mapLevel || "countries") === "subdivisions"
      ? getSubdivisions(editingSubdivisionScope)
      : [];

  const mapEditStorageMode: "puzzle_map" | "map_click" =
    editingQuestion?.question_type === "map_click" ? "map_click" : "puzzle_map";
  const isMapClickEdit = editingQuestion?.question_type === "map_click";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => onNavigate("quizzes")}
        className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        {t("editQuiz.backToQuizzes")}
      </button>

      <div className="bg-white rounded-xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {t("editQuiz.title")}
        </h1>
        <p className="text-gray-600 mb-8">{t("editQuiz.subtitle")}</p>

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

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {t("editQuiz.quizInfo")}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("editQuiz.quizTitle")} *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder={t("editQuiz.titlePlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("editQuiz.description")}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  rows={3}
                  placeholder={t("editQuiz.descriptionPlaceholder")}
                />
              </div>

              <ImageDropzone
                currentImageUrl={coverImageUrl}
                onImageUploaded={(url) => setCoverImageUrl(url)}
                bucketName="quiz-images"
              />

              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("createQuiz.searchTags")}
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder={t("createQuiz.addTagPlaceholder")}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium flex items-center gap-2"
                      >
                        #{tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="text-emerald-700 hover:text-emerald-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {t("createQuiz.maxTags")} • {tags.length}/10
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("editQuiz.language")} *
                  </label>
                  <select
                    value={quizLanguage}
                    onChange={(e) =>
                      setQuizLanguage(e.target.value as Language)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    {Object.entries(languageNames).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("createQuiz.quizType")}
                  </label>
                  <select
                    value={selectedQuizType}
                    onChange={(e) => setSelectedQuizType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    <option value="">{t("createQuiz.noType")}</option>
                    {quizTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("editQuiz.category")} *
                  </label>
                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as QuizCategory)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    {categories.length > 0 ? (
                      categories.map((cat) => (
                        <option key={cat.name} value={cat.name}>
                          {cat.label}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="flags">
                          {getCategoryLabel("flags")}
                        </option>
                        <option value="capitals">
                          {getCategoryLabel("capitals")}
                        </option>
                        <option value="maps">{getCategoryLabel("maps")}</option>
                        <option value="borders">
                          {getCategoryLabel("borders")}
                        </option>
                        <option value="regions">
                          {getCategoryLabel("regions")}
                        </option>
                        <option value="mixed">
                          {getCategoryLabel("mixed")}
                        </option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("editQuiz.difficulty")} *
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) =>
                      setDifficulty(e.target.value as Difficulty)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    {difficulties.length > 0 ? (
                      difficulties.map((diff) => (
                        <option key={diff.name} value={diff.name}>
                          {diff.label}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="easy">
                          {getDifficultyLabel("easy")}
                        </option>
                        <option value="medium">
                          {getDifficultyLabel("medium")}
                        </option>
                        <option value="hard">
                          {getDifficultyLabel("hard")}
                        </option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("editQuiz.timePerQuestion")}
                </label>
                <input
                  type="number"
                  value={timeLimitSeconds}
                  onChange={(e) =>
                    setTimeLimitSeconds(parseInt(e.target.value) || 30)
                  }
                  min="5"
                  max="120"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="space-y-3 border-t pt-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={randomizeQuestions}
                    onChange={(e) => setRandomizeQuestions(e.target.checked)}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-gray-700">
                    {t("createQuiz.randomizeQuestions")}
                  </span>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={randomizeAnswers}
                    onChange={(e) => setRandomizeAnswers(e.target.checked)}
                    className="w-5 h-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-gray-700">
                    {t("createQuiz.randomizeAnswers")}
                  </span>
                </label>
              </div>

              {quiz && (quiz.is_public || quiz.is_global) && (
                <div className="border-t pt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-blue-800">
                      Statut actuel :{" "}
                      {quiz.is_global
                        ? "✅ Quiz public validé"
                        : quiz.pending_validation
                        ? "⏳ En attente de validation"
                        : "📤 Publié"}
                    </p>
                  </div>
                  <button
                    onClick={makeQuizPrivate}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    🔒 Rendre privé
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {t("editQuiz.questions")} ({questions.length})
              </h2>
              <button
                onClick={addNewQuestion}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>{t("editQuiz.addQuestion")}</span>
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="border border-gray-200 rounded-lg p-6"
                >
                  {editingQuestion?.id === question.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t("editQuiz.question")} *
                        </label>
                        <input
                          type="text"
                          value={editingQuestion.question_text}
                          onChange={(e) =>
                            setEditingQuestion({
                              ...editingQuestion,
                              question_text: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                        />
                      </div>

                      <ImageDropzone
                        label={
                          editingQuestion.question_type === "country_multi"
                            ? t("createQuiz.countryMulti.imageOptionalLabel")
                            : t("editQuiz.questionImageOptional")
                        }
                        currentImageUrl={editingQuestion.image_url || ""}
                        onImageUploaded={(url) =>
                          setEditingQuestion({
                            ...editingQuestion,
                            image_url: url,
                          })
                        }
                        bucketName="quiz-images"
                      />
                      {editingQuestion.question_type === "country_multi" && (
                        <p className="text-xs text-gray-500">
                          {t("createQuiz.countryMulti.imageOrTextHint")}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t("editQuiz.questionType.label")}
                          </label>
                          <select
                            value={editingQuestion.question_type}
                            onChange={(e) => {
                              const nextType = e.target.value as QuestionType;
                              if (nextType === "map_click") {
                                setEditingQuestion({
                                  ...editingQuestion,
                                  question_type: nextType,
                                  options: [],
                                  correct_answer: editingQuestion.correct_answer || "",
                                  correct_answers: [],
                                  map_data: {
                                    mode: "map_click",
                                    mapLevel:
                                      editingQuestion.map_data?.mapLevel || "countries",
                                    subdivisionScope:
                                      editingQuestion.map_data?.subdivisionScope,
                                    selectedCountries: [],
                                    showTargetList: false,
                                    initialView: {
                                      centerLat:
                                        editingQuestion.map_data?.initialView
                                          ?.centerLat ?? 20,
                                      centerLng:
                                        editingQuestion.map_data?.initialView
                                          ?.centerLng ?? 0,
                                      zoom:
                                        editingQuestion.map_data?.initialView?.zoom ??
                                        (editingQuestion.map_data?.mapLevel ===
                                        "subdivisions"
                                          ? 5.2
                                          : 1),
                                    },
                                  },
                                });
                                return;
                              }
                              if (nextType === "puzzle_map") {
                                setEditingQuestion({
                                  ...editingQuestion,
                                  question_type: nextType,
                                  options: [],
                                  correct_answer: "__AUTO__",
                                  correct_answers: [],
                                  map_data: {
                                    mode: "puzzle_map",
                                    mapLevel:
                                      editingQuestion.map_data?.mapLevel || "countries",
                                    subdivisionScope:
                                      editingQuestion.map_data?.subdivisionScope,
                                    selectedCountries:
                                      editingQuestion.map_data
                                        ?.selectedCountries || [],
                                    showTargetList: false,
                                    initialView: {
                                      centerLat:
                                        editingQuestion.map_data?.initialView
                                          ?.centerLat ?? 20,
                                      centerLng:
                                        editingQuestion.map_data?.initialView
                                          ?.centerLng ?? 0,
                                      zoom:
                                        editingQuestion.map_data?.initialView
                                          ?.zoom ??
                                        (editingQuestion.map_data?.mapLevel ===
                                        "subdivisions"
                                          ? 5.2
                                          : 1),
                                    },
                                  },
                                });
                                return;
                              }
                              if (nextType === "top10_order") {
                                setEditingQuestion({
                                  ...editingQuestion,
                                  question_type: nextType,
                                  options: ["", ""],
                                  correct_answer: "__ORDER__",
                                  correct_answers: [],
                                  map_data: {
                                    mode: "top10_order",
                                    selectedCountries: [],
                                  },
                                });
                                return;
                              }
                              if (nextType === "country_multi") {
                                setEditingQuestion({
                                  ...editingQuestion,
                                  question_type: nextType,
                                  options: [],
                                  correct_answer: "__AUTO__",
                                  correct_answers: [],
                                  map_data: {
                                    mode: "country_multi",
                                    selectedCountries: [],
                                    requiredFields: ["name", "capital", "map_click"],
                                    countryMultiPrompt: "",
                                    nameTolerance: "lenient",
                                    capitalTolerance: "strict",
                                  },
                                });
                                return;
                              }
                              setEditingQuestion({
                                ...editingQuestion,
                                question_type: nextType,
                                map_data: null,
                              });
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                          >
                            <option value="mcq">
                              {getQuestionTypeLabel("mcq")}
                            </option>
                            <option value="true_false">
                              {t("createQuiz.trueFalse.type")}
                            </option>
                            <option value="single_answer">
                              {getQuestionTypeLabel("single_answer")}
                            </option>
                            <option value="puzzle_map">
                              {t("editQuiz.questionType.puzzle_map")}
                            </option>
                            <option value="map_click">
                              {t("editQuiz.questionType.map_click")}
                            </option>
                            <option value="top10_order">
                              {t("editQuiz.questionType.top10_order")}
                            </option>
                            <option value="country_multi">
                              {t("createQuiz.countryMulti.typeLabel")}
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t("editQuiz.points")}
                          </label>
                          <input
                            type="number"
                            value={editingQuestion.points}
                            onChange={(e) => {
                              let value = parseInt(e.target.value) || 10;
                              if (value > 500) value = 500;
                              if (value < 10) value = 10;
                              setEditingQuestion({
                                ...editingQuestion,
                                points: value,
                              });
                            }}
                            min="10"
                            max="500"
                            step="10"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                          />
                          {editingQuestion.points > 500 && (
                            <p className="text-xs text-red-600 mt-1">
                              Max 500 points par question
                            </p>
                          )}
                        </div>
                      </div>

                      {editingQuestion.question_type === "true_false" && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm text-blue-800 mb-3">
                            {t("createQuiz.trueFalse.description")}
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() =>
                                setEditingQuestion({
                                  ...editingQuestion,
                                  correct_answer: t(
                                    "createQuiz.trueFalse.true"
                                  ),
                                })
                              }
                              className={`p-3 rounded-lg border-2 font-medium transition-all ${
                                editingQuestion.correct_answer ===
                                t("createQuiz.trueFalse.true")
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                  : "border-gray-300 hover:border-emerald-300"
                              }`}
                            >
                              ✓ {t("createQuiz.trueFalse.true")}
                            </button>
                            <button
                              onClick={() =>
                                setEditingQuestion({
                                  ...editingQuestion,
                                  correct_answer: t(
                                    "createQuiz.trueFalse.false"
                                  ),
                                })
                              }
                              className={`p-3 rounded-lg border-2 font-medium transition-all ${
                                editingQuestion.correct_answer ===
                                t("createQuiz.trueFalse.false")
                                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                  : "border-gray-300 hover:border-emerald-300"
                              }`}
                            >
                              ✗ {t("createQuiz.trueFalse.false")}
                            </button>
                          </div>
                        </div>
                      )}
                      {editingQuestion.question_type === "mcq" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t("editQuiz.options")}
                          </label>
                          <div className="space-y-3">
                            {(Array.isArray(editingQuestion.options)
                              ? editingQuestion.options
                              : ["", "", "", ""]
                            ).map((option: string, idx: number) => (
                              <div key={idx} className="space-y-2">
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) =>
                                    updateOption(idx, e.target.value)
                                  }
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                  placeholder={`${t("editQuiz.option")} ${
                                    idx + 1
                                  }`}
                                />
                                {option.trim() && (
                                  <ImageDropzone
                                    currentImageUrl={
                                      editingQuestion.option_images?.[option] ||
                                      ""
                                    }
                                    onImageUploaded={(url) =>
                                      updateOptionImage(option, url)
                                    }
                                    bucketName="quiz-images"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(editingQuestion.question_type === "puzzle_map" ||
                        editingQuestion.question_type === "map_click") && (
                        <div className="space-y-4 p-4 rounded-lg bg-sky-50 border border-sky-200">
                          {editingQuestion.question_type === "puzzle_map" && (
                            <p className="text-sm text-sky-900 bg-white/80 border border-sky-200 rounded-lg px-3 py-2">
                              {t("createQuiz.puzzle.editorBehaviorHint")}
                            </p>
                          )}
                          {editingQuestion.question_type === "map_click" && (
                            <p className="text-sm text-sky-900 bg-white/80 border border-sky-200 rounded-lg px-3 py-2">
                              {t("createQuiz.mapClick.editorBehaviorHint")}
                            </p>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Niveau de carte
                            </label>
                            <select
                              value={editingQuestion.map_data?.mapLevel || "countries"}
                              onChange={(e) => {
                                const nextLevel = e.target.value as
                                  | "countries"
                                  | "subdivisions"
                                  | "custom_geojson";
                                setEditingQuestion({
                                  ...editingQuestion,
                                  map_data: {
                                    ...(editingQuestion.map_data || {}),
                                    mode: mapEditStorageMode,
                                    mapLevel: nextLevel,
                                    subdivisionScope:
                                      nextLevel === "subdivisions"
                                        ? "ch_cantons"
                                        : undefined,
                                    customGeojsonMapId:
                                      nextLevel === "custom_geojson"
                                        ? ""
                                        : undefined,
                                    customGeojsonPublicUrl:
                                      nextLevel === "custom_geojson"
                                        ? ""
                                        : undefined,
                                    customGeojsonIdProperty:
                                      nextLevel === "custom_geojson"
                                        ? "tc_id"
                                        : undefined,
                                    selectedCountries:
                                      nextLevel === "subdivisions" ||
                                      nextLevel === "custom_geojson"
                                        ? []
                                        : editingQuestion.map_data?.selectedCountries ||
                                          [],
                                    initialView:
                                      nextLevel === "subdivisions"
                                        ? {
                                            centerLat: 46.8,
                                            centerLng: 8.2,
                                            zoom: 1.1,
                                          }
                                        : nextLevel === "custom_geojson"
                                        ? { centerLat: 20, centerLng: 0, zoom: 2 }
                                        : editingQuestion.map_data?.initialView || {
                                            centerLat: 20,
                                            centerLng: 0,
                                            zoom: 1,
                                          },
                                  },
                                });
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                            >
                              <option value="countries">Pays</option>
                              <option value="subdivisions">Sous-divisions</option>
                              <option value="custom_geojson">GeoJSON (catalogue admin)</option>
                            </select>
                          </div>

                          {(editingQuestion.map_data?.mapLevel || "countries") ===
                          "subdivisions" ? (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Scope
                                </label>
                                <select
                                  value={
                                    editingQuestion.map_data?.subdivisionScope ||
                                    "ch_cantons"
                                  }
                                  onChange={(e) =>
                                    setEditingQuestion({
                                      ...editingQuestion,
                                      map_data: {
                                        ...(editingQuestion.map_data || {}),
                                        mode: mapEditStorageMode,
                                        mapLevel: "subdivisions",
                                        subdivisionScope:
                                          e.target.value as SubdivisionScope,
                                        selectedCountries: [],
                                        initialView:
                                          e.target.value === "fr_departements"
                                            ? {
                                                centerLat: 46.6,
                                                centerLng: 2.3,
                                                zoom: 1.1,
                                              }
                                            : e.target.value === "us_states"
                                            ? {
                                                centerLat: 39.8,
                                                centerLng: -98.5,
                                                zoom: 1,
                                              }
                                            : {
                                                centerLat: 46.8,
                                                centerLng: 8.2,
                                                zoom: 1.1,
                                              },
                                      },
                                    })
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                >
                                  <option value="ch_cantons">Cantons suisses</option>
                                  <option value="fr_departements">
                                    Departements francais
                                  </option>
                                  <option value="us_states">Etats americains</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Sous-divisions cibles
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-white">
                                  {editingSubdivisionEntries.map((entry) => {
                                    const checked =
                                      editingQuestion.map_data?.selectedCountries?.includes(
                                        entry.iso3
                                      ) || false;
                                    return (
                                      <label
                                        key={entry.iso3}
                                        className="flex items-center gap-2 text-sm text-gray-700"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={(e) => {
                                            const previous =
                                              editingQuestion.map_data
                                                ?.selectedCountries || [];
                                            const next = e.target.checked
                                              ? [...new Set([...previous, entry.iso3])]
                                              : previous.filter(
                                                  (id: string) => id !== entry.iso3
                                                );
                                            setEditingQuestion({
                                              ...editingQuestion,
                                              map_data: {
                                                ...(editingQuestion.map_data || {}),
                                                mode: mapEditStorageMode,
                                                mapLevel: "subdivisions",
                                                subdivisionScope: editingSubdivisionScope,
                                                selectedCountries: next,
                                              },
                                            });
                                          }}
                                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        {entry.name}
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            </>
                          ) : (editingQuestion.map_data?.mapLevel || "countries") ===
                            "custom_geojson" ? (
                            <CustomGeoJsonMapPicker
                              mapData={editingQuestion.map_data || undefined}
                              storageMode={mapEditStorageMode}
                              onPatch={(patch) =>
                                setEditingQuestion({
                                  ...editingQuestion,
                                  map_data: {
                                    ...(editingQuestion.map_data || {}),
                                    ...patch,
                                    mode: mapEditStorageMode,
                                  } as any,
                                })
                              }
                            />
                          ) : (
                            <CountryMultiSelect
                              label={
                                isMapClickEdit
                                  ? t("createQuiz.mapClick.targetZonesLabel")
                                  : t("createQuiz.puzzle.targetCountriesLabel")
                              }
                              selectedIso3={
                                editingQuestion.map_data?.selectedCountries || []
                              }
                              hint={
                                isMapClickEdit
                                  ? t("createQuiz.mapClick.countryHint")
                                  : undefined
                              }
                              onChange={(next) =>
                                setEditingQuestion({
                                  ...editingQuestion,
                                  map_data: {
                                    ...(editingQuestion.map_data || {}),
                                    mode: mapEditStorageMode,
                                    mapLevel: "countries",
                                    selectedCountries: next,
                                  },
                                })
                              }
                            />
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="md:col-span-3">
                              <label className="block text-xs text-gray-700 mb-1">
                                Preset continent
                              </label>
                              <select
                                onChange={(e) => {
                                  const preset = mapViewPresets[e.target.value];
                                  if (!preset) return;
                                  setEditingQuestion({
                                    ...editingQuestion,
                                    map_data: {
                                      ...(editingQuestion.map_data || {}),
                                      mode: mapEditStorageMode,
                                      initialView: {
                                        centerLat: preset.centerLat,
                                        centerLng: preset.centerLng,
                                        zoom: preset.zoom,
                                      },
                                    },
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                defaultValue=""
                              >
                                <option value="" disabled>
                                  Choisir un preset
                                </option>
                                <option value="world">Monde</option>
                                <option value="europe">Europe</option>
                                <option value="africa">Afrique</option>
                                <option value="asia">Asie</option>
                                <option value="americas">Amériques</option>
                                <option value="oceania">Océanie</option>
                                <option value="switzerland">Suisse</option>
                                <option value="france">France</option>
                                <option value="usa">USA</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-700 mb-1">
                                Centre latitude
                              </label>
                              <input
                                type="number"
                                min={-90}
                                max={90}
                                step={0.1}
                                value={
                                  editingQuestion.map_data?.initialView?.centerLat ??
                                  20
                                }
                                onChange={(e) =>
                                  setEditingQuestion({
                                    ...editingQuestion,
                                    map_data: {
                                      ...(editingQuestion.map_data || {}),
                                      mode: mapEditStorageMode,
                                      initialView: {
                                        ...(editingQuestion.map_data?.initialView ||
                                          {}),
                                        centerLat: Math.max(
                                          -90,
                                          Math.min(90, Number(e.target.value || 20))
                                        ),
                                      },
                                    },
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-700 mb-1">
                                Centre longitude
                              </label>
                              <input
                                type="number"
                                min={-180}
                                max={180}
                                step={0.1}
                                value={
                                  editingQuestion.map_data?.initialView?.centerLng ??
                                  0
                                }
                                onChange={(e) =>
                                  setEditingQuestion({
                                    ...editingQuestion,
                                    map_data: {
                                      ...(editingQuestion.map_data || {}),
                                      mode: mapEditStorageMode,
                                      initialView: {
                                        ...(editingQuestion.map_data?.initialView ||
                                          {}),
                                        centerLng: Math.max(
                                          -180,
                                          Math.min(180, Number(e.target.value || 0))
                                        ),
                                      },
                                    },
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-700 mb-1">
                                Zoom initial
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={8}
                                step={0.1}
                                value={editingQuestion.map_data?.initialView?.zoom ?? 1}
                                onChange={(e) =>
                                  setEditingQuestion({
                                    ...editingQuestion,
                                    map_data: {
                                      ...(editingQuestion.map_data || {}),
                                      mode: mapEditStorageMode,
                                      initialView: {
                                        ...(editingQuestion.map_data?.initialView ||
                                          {}),
                                        zoom: Math.max(
                                          1,
                                          Math.min(8, Number(e.target.value || 1))
                                        ),
                                      },
                                    },
                                  })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {editingQuestion.question_type === "top10_order" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-orange-50 border border-orange-200">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {t("createQuiz.top10.itemsLabel")}
                            </label>
                            <div className="space-y-2">
                              {(Array.isArray(editingQuestion.options)
                                ? editingQuestion.options
                                : []
                              ).map((item: string, index: number) => {
                                const optList = Array.isArray(editingQuestion.options)
                                  ? editingQuestion.options
                                  : [];
                                return (
                                <div
                                  key={index}
                                  draggable
                                  onDragStart={() => setTop10EditDragIndex(index)}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={() => {
                                    if (top10EditDragIndex === null) return;
                                    reorderTop10EditingQuestion(
                                      top10EditDragIndex,
                                      index
                                    );
                                    setTop10EditDragIndex(null);
                                  }}
                                  onDragEnd={() => setTop10EditDragIndex(null)}
                                  className="flex items-center gap-2"
                                >
                                  <span className="text-xs text-gray-500 w-8">
                                    #{index + 1}
                                  </span>
                                  <div className="flex flex-col gap-0.5 shrink-0">
                                    <button
                                      type="button"
                                      title={t("playQuiz.top10.moveUp")}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (index === 0) return;
                                        reorderTop10EditingQuestion(index, index - 1);
                                      }}
                                      disabled={index === 0}
                                      className="p-0.5 rounded border border-orange-200 text-orange-700 hover:bg-orange-100 disabled:opacity-30"
                                    >
                                      <ChevronUp className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      title={t("playQuiz.top10.moveDown")}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (index >= optList.length - 1) return;
                                        reorderTop10EditingQuestion(index, index + 1);
                                      }}
                                      disabled={index >= optList.length - 1}
                                      className="p-0.5 rounded border border-orange-200 text-orange-700 hover:bg-orange-100 disabled:opacity-30"
                                    >
                                      <ChevronDown className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    value={item}
                                    onChange={(e) => {
                                      const next = [
                                        ...(Array.isArray(editingQuestion.options)
                                          ? editingQuestion.options
                                          : []),
                                      ];
                                      next[index] = e.target.value;
                                      setEditingQuestion({
                                        ...editingQuestion,
                                        options: next,
                                      });
                                    }}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                    placeholder={`${
                                      t("createQuiz.top10.itemPlaceholder")
                                    } ${index + 1}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = (
                                        Array.isArray(editingQuestion.options)
                                          ? editingQuestion.options
                                          : []
                                      ).filter((_: string, i: number) => i !== index);
                                      setEditingQuestion({
                                        ...editingQuestion,
                                        options: next.length > 0 ? next : [""],
                                      });
                                    }}
                                    className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                                  >
                                    ×
                                  </button>
                                  <span className="text-xs text-gray-400">
                                    {t("playQuiz.top10.drag")}
                                  </span>
                                </div>
                              );
                              })}
                              <button
                                type="button"
                                onClick={() => {
                                  const current = Array.isArray(editingQuestion.options)
                                    ? editingQuestion.options
                                    : [];
                                  setEditingQuestion({
                                    ...editingQuestion,
                                    options: [...current, ""],
                                  });
                                }}
                                className="text-sm px-3 py-1 border border-orange-300 text-orange-700 rounded hover:bg-orange-100"
                              >
                                {t("createQuiz.top10.addItem")}
                              </button>
                            </div>
                            <p className="text-xs text-gray-500">
                              {t("createQuiz.top10.reorderHint")}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-orange-700 bg-white border border-orange-200 rounded-lg p-3">
                              {t("createQuiz.top10.customHint")}
                            </p>
                          </div>
                        </div>
                      )}

                      {editingQuestion.question_type === "country_multi" && (
                        <div className="space-y-3 p-4 rounded-lg bg-indigo-50 border border-indigo-200">
                          <CountryMultiSelect
                            label={t("createQuiz.countryMulti.targetCountriesLabel")}
                            selectedIso3={editingQuestion.map_data?.selectedCountries || []}
                            hint={t("createQuiz.countryMulti.targetCountriesHint")}
                            onChange={(next) =>
                              setEditingQuestion({
                                ...editingQuestion,
                                map_data: {
                                  ...(editingQuestion.map_data || {}),
                                  mode: "country_multi",
                                  selectedCountries: next,
                                  requiredFields: ["name", "capital", "map_click"],
                                  countryMultiPrompt:
                                    editingQuestion.map_data?.countryMultiPrompt || "",
                                  nameTolerance:
                                    editingQuestion.map_data?.nameTolerance ||
                                    "lenient",
                                  capitalTolerance:
                                    editingQuestion.map_data?.capitalTolerance ||
                                    "strict",
                                },
                              })
                            }
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              {t("createQuiz.countryMulti.fieldsLabel")}
                            </p>
                            <div className="flex flex-wrap gap-2 text-sm">
                              <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-800">
                                {t("createQuiz.countryMulti.fieldName")}
                              </span>
                              <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-800">
                                {t("createQuiz.countryMulti.fieldCapital")}
                              </span>
                              <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-800">
                                {t("createQuiz.countryMulti.fieldMapClick")}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">
                              {t("createQuiz.countryMulti.customPromptLabel")}
                            </label>
                            <input
                              type="text"
                              value={
                                editingQuestion.map_data?.countryMultiPrompt || ""
                              }
                              onChange={(e) =>
                                setEditingQuestion({
                                  ...editingQuestion,
                                  map_data: {
                                    ...(editingQuestion.map_data || {}),
                                    mode: "country_multi",
                                    selectedCountries:
                                      editingQuestion.map_data?.selectedCountries ||
                                      [],
                                    requiredFields: [
                                      "name",
                                      "capital",
                                      "map_click",
                                    ],
                                    countryMultiPrompt: e.target.value,
                                    nameTolerance:
                                      editingQuestion.map_data?.nameTolerance ||
                                      "lenient",
                                    capitalTolerance:
                                      editingQuestion.map_data?.capitalTolerance ||
                                      "strict",
                                  },
                                })
                              }
                              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder={t(
                                "createQuiz.countryMulti.customPromptPlaceholder"
                              )}
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <label className="text-sm text-gray-700">
                              {t("createQuiz.countryMulti.nameToleranceLabel")}
                              <select
                                value={
                                  editingQuestion.map_data?.nameTolerance || "lenient"
                                }
                                onChange={(e) =>
                                  setEditingQuestion({
                                    ...editingQuestion,
                                    map_data: {
                                      ...(editingQuestion.map_data || {}),
                                      mode: "country_multi",
                                      selectedCountries:
                                        editingQuestion.map_data?.selectedCountries ||
                                        [],
                                      requiredFields: ["name", "capital", "map_click"],
                                      nameTolerance: e.target.value as
                                        | "strict"
                                        | "lenient",
                                      capitalTolerance:
                                        editingQuestion.map_data?.capitalTolerance ||
                                        "strict",
                                    },
                                  })
                                }
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                              >
                                <option value="strict">
                                  {t("createQuiz.countryMulti.toleranceStrict")}
                                </option>
                                <option value="lenient">
                                  {t("createQuiz.countryMulti.toleranceLenient")}
                                </option>
                              </select>
                            </label>
                            <label className="text-sm text-gray-700">
                              {t("createQuiz.countryMulti.capitalToleranceLabel")}
                              <select
                                value={
                                  editingQuestion.map_data?.capitalTolerance || "strict"
                                }
                                onChange={(e) =>
                                  setEditingQuestion({
                                    ...editingQuestion,
                                    map_data: {
                                      ...(editingQuestion.map_data || {}),
                                      mode: "country_multi",
                                      selectedCountries:
                                        editingQuestion.map_data?.selectedCountries ||
                                        [],
                                      requiredFields: ["name", "capital", "map_click"],
                                      nameTolerance:
                                        editingQuestion.map_data?.nameTolerance ||
                                        "lenient",
                                      capitalTolerance: e.target.value as
                                        | "strict"
                                        | "lenient",
                                    },
                                  })
                                }
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                              >
                                <option value="strict">
                                  {t("createQuiz.countryMulti.toleranceStrict")}
                                </option>
                                <option value="lenient">
                                  {t("createQuiz.countryMulti.toleranceLenient")}
                                </option>
                              </select>
                            </label>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t("editQuiz.correctAnswer")} *
                        </label>
                        {editingQuestion.question_type === "puzzle_map" ||
                        editingQuestion.question_type === "map_click" ||
                        editingQuestion.question_type === "top10_order" ? (
                          <div className="p-3 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg">
                            {editingQuestion.question_type === "top10_order"
                              ? t("createQuiz.top10.expectedOrderInfo")
                              : editingQuestion.question_type === "map_click"
                              ? t("createQuiz.mapClick.autoAnswerInfo")
                              : t("createQuiz.puzzle.autoAnswerInfo")}
                          </div>
                        ) : editingQuestion.question_type === "country_multi" ? (
                          <div className="p-3 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg">
                            {t("createQuiz.countryMulti.autoAnswerInfo")}
                          </div>
                        ) : editingQuestion.question_type === "mcq" ? (
                          <div className="space-y-2">
                            <div className="space-y-2">
                              {(Array.isArray(editingQuestion.options)
                                ? editingQuestion.options
                                : []
                              )
                                .filter((opt: string) => opt.trim())
                                .map((option: string, idx: number) => {
                                  const isSelected = (
                                    editingQuestion.correct_answers || []
                                  ).includes(option);

                                  return (
                                    <label
                                      key={idx}
                                      className={`flex items-center space-x-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                        isSelected
                                          ? "border-emerald-500 bg-emerald-50"
                                          : "border-gray-200 hover:border-gray-300"
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => {
                                          const answers =
                                            editingQuestion.correct_answers ||
                                            [];
                                          if (e.target.checked) {
                                            setEditingQuestion({
                                              ...editingQuestion,
                                              correct_answers: [
                                                ...answers,
                                                option,
                                              ],
                                              correct_answer: option,
                                            });
                                          } else {
                                            const newAnswers = answers.filter(
                                              (a: string) => a !== option
                                            );
                                            setEditingQuestion({
                                              ...editingQuestion,
                                              correct_answers: newAnswers,
                                              correct_answer:
                                                newAnswers[0] || "",
                                            });
                                          }
                                        }}
                                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                      />
                                      <span
                                        className={`font-medium ${
                                          isSelected
                                            ? "text-emerald-700"
                                            : "text-gray-700"
                                        }`}
                                      >
                                        {option}
                                        {isSelected && " ✓"}
                                      </span>
                                    </label>
                                  );
                                })}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              {t("createQuiz.multipleCorrect")}
                            </p>
                          </div>
                        ) : editingQuestion.question_type !== "true_false" ? (
                          <input
                            type="text"
                            value={editingQuestion.correct_answer}
                            onChange={(e) =>
                              setEditingQuestion({
                                ...editingQuestion,
                                correct_answer: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                          />
                        ) : null}
                      </div>

                      {(editingQuestion.question_type === "single_answer" ||
                        editingQuestion.question_type === "text_free") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t("createQuiz.variants")}
                          </label>
                          <div className="space-y-2">
                            {(editingQuestion.correct_answers || []).map(
                              (variant: string, index: number) => (
                                <div key={index} className="flex space-x-2">
                                  <input
                                    type="text"
                                    value={variant}
                                    onChange={(e) =>
                                      updateVariant(index, e.target.value)
                                    }
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                    placeholder={t(
                                      "createQuiz.variantPlaceholder"
                                    ).replace("{number}", String(index + 1))}
                                  />
                                  <button
                                    onClick={() => removeVariant(index)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                </div>
                              )
                            )}
                            <button
                              onClick={addVariant}
                              className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                            >
                              + {t("createQuiz.addVariant")}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {t("createQuiz.variantsDesc")}
                          </p>
                        </div>
                      )}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t("createQuiz.complementIfWrong")}
                        </label>
                        <textarea
                          value={editingQuestion?.complement_if_wrong || ""}
                          onChange={(e) =>
                            setEditingQuestion({
                              ...editingQuestion,
                              complement_if_wrong: e.target.value,
                            })
                          }
                          placeholder={t(
                            "createQuiz.complementIfWrongPlaceholder"
                          )}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-transparent outline-none"
                        />
                      </div>
                      <div className="flex space-x-3 pt-4">
                        <button
                          onClick={saveQuestion}
                          className="flex-1 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                        >
                          {t("common.save")}
                        </button>
                        <button
                          onClick={cancelEditingQuestion}
                          className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                        >
                          {t("common.cancel")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 mb-2">
                          {index + 1}. {question.question_text}
                        </p>
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          {question.image_url && (
                            <span className="text-blue-600">
                              📷 {t("editQuiz.imageIncluded")}
                            </span>
                          )}
                          <span>
                            {getQuestionTypeLabel(question.question_type)}
                          </span>
                          <span>
                            {question.points} {t("home.pts")}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => moveQuestion(index, index - 1)}
                          disabled={index === 0}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Monter"
                        >
                          <ArrowUp className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => moveQuestion(index, index + 1)}
                          disabled={index === questions.length - 1}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Descendre"
                        >
                          <ArrowDown className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => startEditingQuestion(question)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteQuestion(question.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-4 pt-6">
            <button
              onClick={() => onNavigate("quizzes")}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={saveQuiz}
              disabled={saving}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
            >
              {saving ? t("editQuiz.saving") : t("editQuiz.saveChanges")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
