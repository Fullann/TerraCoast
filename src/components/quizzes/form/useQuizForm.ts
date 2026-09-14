import { useState, useCallback } from "react";
import { useLanguage } from "../../../contexts/LanguageContext";
import {
  type QuestionItem,
  type QuizFormData,
  createDefaultQuestion,
} from "./types";
import {
  validateQuestionItem,
  validateQuizMetadata,
  normalizeQuestionBeforeSave,
} from "./validation";

interface UseQuizFormOptions {
  initialFormData?: Partial<QuizFormData>;
  initialQuestions?: QuestionItem[];
}

export function useQuizForm(options: UseQuizFormOptions = {}) {
  const { t, language } = useLanguage();

  const [formData, setFormData] = useState<QuizFormData>({
    title: "",
    description: "",
    category: "capitals",
    difficulty: "medium",
    quizLanguage: language,
    selectedQuizType: "",
    timeLimitSeconds: 30,
    randomizeQuestions: false,
    randomizeAnswers: false,
    isPublic: false,
    coverImageUrl: "",
    locationLat: "",
    locationLng: "",
    tags: [],
    ...options.initialFormData,
  });

  const [questions, setQuestions] = useState<QuestionItem[]>(
    options.initialQuestions || []
  );
  const [currentQuestion, setCurrentQuestion] = useState<QuestionItem>(
    createDefaultQuestion(0)
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const updateFormField = useCallback(
    <K extends keyof QuizFormData>(field: K, value: QuizFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const normalizeQuestionsOrder = useCallback(
    (list: QuestionItem[]) =>
      list.map((item, index) => ({ ...item, order_index: index })),
    []
  );

  const startEditing = useCallback(
    (index: number) => {
      if (index >= 0 && index < questions.length) {
        setCurrentQuestion({ ...questions[index] });
        setEditingIndex(index);
      }
    },
    [questions]
  );

  const cancelEditing = useCallback(() => {
    setCurrentQuestion(createDefaultQuestion(questions.length));
    setEditingIndex(null);
    setError("");
  }, [questions.length]);

  const moveQuestion = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (
        toIndex < 0 ||
        toIndex >= questions.length ||
        fromIndex === toIndex
      ) {
        return;
      }
      const reordered = [...questions];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      setQuestions(normalizeQuestionsOrder(reordered));

      if (editingIndex !== null) {
        if (editingIndex === fromIndex) {
          setEditingIndex(toIndex);
        } else if (fromIndex < editingIndex && editingIndex <= toIndex) {
          setEditingIndex(editingIndex - 1);
        } else if (toIndex <= editingIndex && editingIndex < fromIndex) {
          setEditingIndex(editingIndex + 1);
        }
      }
    },
    [questions, editingIndex, normalizeQuestionsOrder]
  );

  const moveUp = useCallback(
    (index: number) => {
      moveQuestion(index, index - 1);
    },
    [moveQuestion]
  );

  const moveDown = useCallback(
    (index: number) => {
      moveQuestion(index, index + 1);
    },
    [moveQuestion]
  );

  const deleteQuestion = useCallback(
    (index: number) => {
      setQuestions((prev) =>
        normalizeQuestionsOrder(prev.filter((_, i) => i !== index))
      );
      if (editingIndex !== null) {
        if (editingIndex === index) {
          cancelEditing();
        } else if (editingIndex > index) {
          setEditingIndex(editingIndex - 1);
        }
      }
    },
    [editingIndex, cancelEditing, normalizeQuestionsOrder]
  );

  const validateQuestionData = useCallback(
    (q: QuestionItem): boolean => {
      const res = validateQuestionItem(q);
      if (!res.valid) {
        setError(res.errorKey ? t(res.errorKey as any) : res.errorMessage || "Erreur de validation");
        return false;
      }
      return true;
    },
    [t]
  );

  const commitCurrentQuestion = useCallback((): boolean => {
    if (!validateQuestionData(currentQuestion)) {
      return false;
    }

    const normalized = normalizeQuestionBeforeSave(currentQuestion);

    if (editingIndex !== null) {
      const updated = [...questions];
      updated[editingIndex] = {
        ...normalized,
        order_index: editingIndex,
      };
      setQuestions(normalizeQuestionsOrder(updated));
      setEditingIndex(null);
    } else {
      setQuestions(
        normalizeQuestionsOrder([
          ...questions,
          { ...normalized, order_index: questions.length },
        ])
      );
    }

    setCurrentQuestion(createDefaultQuestion(questions.length));
    setError("");
    return true;
  }, [
    currentQuestion,
    editingIndex,
    questions,
    validateQuestionData,
    normalizeQuestionsOrder,
  ]);

  const validateAll = useCallback(
    (isAdmin: boolean = false): boolean => {
      const res = validateQuizMetadata(formData, questions.length, isAdmin);
      if (!res.valid) {
        setError(res.errorKey ? t(res.errorKey as any) : res.errorMessage || "Erreur de validation");
        return false;
      }

      for (let i = 0; i < questions.length; i++) {
        if (!validateQuestionData(questions[i])) {
          return false;
        }
      }

      return true;
    },
    [formData, questions, t, validateQuestionData]
  );

  return {
    formData,
    setFormData,
    updateFormField,
    questions,
    setQuestions,
    currentQuestion,
    setCurrentQuestion,
    editingIndex,
    setEditingIndex,
    startEditing,
    cancelEditing,
    moveQuestion,
    moveUp,
    moveDown,
    deleteQuestion,
    commitCurrentQuestion,
    validateQuestionData,
    validateAll,
    error,
    setError,
    saving,
    setSaving,
  };
}
