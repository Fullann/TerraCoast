import type { QuestionItem, QuizFormData } from "./types";

export interface ValidationResult {
  valid: boolean;
  errorKey?: string;
  errorMessage?: string;
}

export function validateQuestionItem(q: QuestionItem): ValidationResult {
  const hasText = String(q.question_text || "").trim().length > 0;
  const isCountryMultiWithAlt =
    q.question_type === "country_multi" &&
    (String(q.image_url || "").trim().length > 0 ||
      String(q.map_data?.countryMultiPrompt || "").trim().length > 0);

  if (!hasText && !isCountryMultiWithAlt) {
    return { valid: false, errorKey: "createQuiz.errors.questionEmpty" };
  }

  const isAutoAnswerType =
    q.question_type === "puzzle_map" ||
    q.question_type === "top10_order" ||
    q.question_type === "map_click" ||
    q.question_type === "country_multi";

  if (!q.correct_answer?.trim() && !isAutoAnswerType) {
    return { valid: false, errorKey: "createQuiz.errors.answerEmpty" };
  }

  if (q.question_type === "puzzle_map") {
    const selectedCount = q.map_data?.selectedCountries?.length || 0;
    if (selectedCount < 1) {
      return { valid: false, errorKey: "createQuiz.errors.puzzleMinCountries" };
    }
  }

  if (q.question_type === "map_click") {
    const selectedCount = q.map_data?.selectedCountries?.length || 0;
    if (selectedCount < 1) {
      return { valid: false, errorKey: "createQuiz.errors.mapClickMinCountries" };
    }
  }

  if (
    (q.question_type === "puzzle_map" || q.question_type === "map_click") &&
    q.map_data?.mapLevel === "custom_geojson"
  ) {
    if (!String(q.map_data?.customGeojsonMapId || "").trim()) {
      return {
        valid: false,
        errorKey: "createQuiz.errors.customGeojsonMapRequired",
      };
    }
  }

  if (q.question_type === "top10_order") {
    const items = (q.options || []).map((item) => item.trim()).filter(Boolean);
    if (items.length < 2) {
      return { valid: false, errorKey: "createQuiz.errors.top10MinItems" };
    }
  }

  if (q.question_type === "country_multi") {
    const selectedCount = q.map_data?.selectedCountries?.length || 0;
    if (selectedCount < 1) {
      return {
        valid: false,
        errorKey: "createQuiz.countryMulti.minCountriesError",
      };
    }
    const requiredFields = q.map_data?.requiredFields || [];
    if (requiredFields.length < 1) {
      return {
        valid: false,
        errorKey: "createQuiz.countryMulti.minFieldsError",
      };
    }
  }

  if (q.question_type === "mcq") {
    const validOptions = (q.options || []).filter((opt) => opt.trim());
    if (validOptions.length < 2) {
      return { valid: false, errorKey: "createQuiz.errors.minTwoOptions" };
    }
    const hasValidAnswer =
      validOptions.includes(q.correct_answer) ||
      Boolean(
        q.correct_answers &&
          q.correct_answers.some((ans) => validOptions.includes(ans))
      );
    if (!hasValidAnswer) {
      return { valid: false, errorKey: "createQuiz.errors.answerMustBeOption" };
    }
  }

  if (q.points > 500) {
    return {
      valid: false,
      errorMessage: "Une question ne peut pas dépasser 500 points",
    };
  }

  return { valid: true };
}

export function validateQuizMetadata(
  formData: QuizFormData,
  questionsCount: number,
  isAdmin: boolean = false
): ValidationResult {
  if (!formData.title.trim() && !formData.coverImageUrl) {
    return { valid: false, errorKey: "editQuiz.titleRequired" };
  }

  if (!formData.difficulty) {
    return { valid: false, errorMessage: "La difficulté est obligatoire" };
  }

  if (questionsCount === 0) {
    return { valid: false, errorKey: "editQuiz.atLeastOneQuestion" };
  }

  if (isAdmin) {
    const lat = formData.locationLat.trim();
    const lng = formData.locationLng.trim();
    const parsedLat = lat === "" ? null : Number(lat);
    const parsedLng = lng === "" ? null : Number(lng);

    if (
      (lat !== "" &&
        (!Number.isFinite(parsedLat) ||
          parsedLat! < -90 ||
          parsedLat! > 90)) ||
      (lng !== "" &&
        (!Number.isFinite(parsedLng) ||
          parsedLng! < -180 ||
          parsedLng! > 180))
    ) {
      return {
        valid: false,
        errorKey: "createQuiz.errors.invalidQuizCoordinates",
      };
    }
  }

  return { valid: true };
}

export function normalizeQuestionBeforeSave(q: QuestionItem): QuestionItem {
  if (q.question_type === "top10_order") {
    return {
      ...q,
      correct_answer: "__ORDER__",
      correct_answers: [],
      options: (q.options || []).map((i) => i.trim()).filter(Boolean),
    };
  }
  if (
    q.question_type === "puzzle_map" ||
    q.question_type === "map_click" ||
    q.question_type === "country_multi"
  ) {
    return {
      ...q,
      correct_answer: "__AUTO__",
      correct_answers: [],
      options: [],
    };
  }
  return q;
}
