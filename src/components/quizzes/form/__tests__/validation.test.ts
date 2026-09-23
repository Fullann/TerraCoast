import { describe, it, expect } from "vitest";
import {
  validateQuestionItem,
  validateQuizMetadata,
  normalizeQuestionBeforeSave,
} from "../validation";
import type { QuestionItem, QuizFormData } from "../types";

describe("Quiz Form Validation", () => {
  describe("validateQuestionItem", () => {
    it("should fail when question text is empty for standard questions", () => {
      const q: QuestionItem = {
        question_text: "   ",
        question_type: "mcq",
        correct_answer: "Paris",
        options: ["Paris", "Lyon"],
        points: 100,
        order_index: 0,
      };
      const result = validateQuestionItem(q);
      expect(result.valid).toBe(false);
      expect(result.errorKey).toBe("createQuiz.errors.questionEmpty");
    });

    it("should allow empty question_text for country_multi if prompt is provided", () => {
      const q: QuestionItem = {
        question_text: "",
        question_type: "country_multi",
        correct_answer: "",
        options: [],
        map_data: {
          selectedCountries: ["FRA", "DEU"],
          requiredFields: ["name", "capital"],
          countryMultiPrompt: "Identify these countries",
        },
        points: 100,
        order_index: 0,
      };
      const result = validateQuestionItem(q);
      expect(result.valid).toBe(true);
    });

    it("should fail for MCQ with fewer than 2 valid options", () => {
      const q: QuestionItem = {
        question_text: "Quelle est la capitale de la France ?",
        question_type: "mcq",
        correct_answer: "Paris",
        options: ["Paris", "  "],
        points: 100,
        order_index: 0,
      };
      const result = validateQuestionItem(q);
      expect(result.valid).toBe(false);
      expect(result.errorKey).toBe("createQuiz.errors.minTwoOptions");
    });

    it("should fail for MCQ if correct_answer is not in options", () => {
      const q: QuestionItem = {
        question_text: "Quelle est la capitale de la France ?",
        question_type: "mcq",
        correct_answer: "Berlin",
        options: ["Paris", "Lyon", "Marseille"],
        points: 100,
        order_index: 0,
      };
      const result = validateQuestionItem(q);
      expect(result.valid).toBe(false);
      expect(result.errorKey).toBe("createQuiz.errors.answerMustBeOption");
    });

    it("should pass for valid MCQ question", () => {
      const q: QuestionItem = {
        question_text: "Quelle est la capitale de la France ?",
        question_type: "mcq",
        correct_answer: "Paris",
        options: ["Paris", "Lyon", "Marseille", "Toulouse"],
        points: 100,
        order_index: 0,
      };
      const result = validateQuestionItem(q);
      expect(result.valid).toBe(true);
    });

    it("should fail for puzzle_map without any selected country", () => {
      const q: QuestionItem = {
        question_text: "Placez les pays",
        question_type: "puzzle_map",
        correct_answer: "__AUTO__",
        options: [],
        map_data: {
          selectedCountries: [],
        },
        points: 100,
        order_index: 0,
      };
      const result = validateQuestionItem(q);
      expect(result.valid).toBe(false);
      expect(result.errorKey).toBe("createQuiz.errors.puzzleMinCountries");
    });

    it("should fail for top10_order with fewer than 2 items", () => {
      const q: QuestionItem = {
        question_text: "Classez par taille",
        question_type: "top10_order",
        correct_answer: "__ORDER__",
        options: ["Seul item"],
        points: 100,
        order_index: 0,
      };
      const result = validateQuestionItem(q);
      expect(result.valid).toBe(false);
      expect(result.errorKey).toBe("createQuiz.errors.top10MinItems");
    });

    it("should reject points exceeding 500", () => {
      const q: QuestionItem = {
        question_text: "Question difficile",
        question_type: "single_answer",
        correct_answer: "Réponse",
        options: [],
        points: 600,
        order_index: 0,
      };
      const result = validateQuestionItem(q);
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toBe("Une question ne peut pas dépasser 500 points");
    });
  });

  describe("validateQuizMetadata", () => {
    const validFormData: QuizFormData = {
      title: "Quiz Géographie",
      description: "Super quiz",
      category: "capitals",
      difficulty: "medium",
      quizLanguage: "fr",
      selectedQuizType: "",
      timeLimitSeconds: 30,
      randomizeQuestions: false,
      randomizeAnswers: false,
      isPublic: true,
      coverImageUrl: "https://example.com/cover.jpg",
      locationLat: "46.2",
      locationLng: "6.1",
      tags: ["geo"],
    };

    it("should fail if title and coverImageUrl are both empty", () => {
      const res = validateQuizMetadata(
        { ...validFormData, title: "", coverImageUrl: "" },
        5
      );
      expect(res.valid).toBe(false);
      expect(res.errorKey).toBe("editQuiz.titleRequired");
    });

    it("should fail if quiz has 0 questions", () => {
      const res = validateQuizMetadata(validFormData, 0);
      expect(res.valid).toBe(false);
      expect(res.errorKey).toBe("editQuiz.atLeastOneQuestion");
    });

    it("should validate GPS coordinates boundaries for admin", () => {
      const invalidLat = validateQuizMetadata(
        { ...validFormData, locationLat: "95.5" },
        1,
        true
      );
      expect(invalidLat.valid).toBe(false);
      expect(invalidLat.errorKey).toBe("createQuiz.errors.invalidQuizCoordinates");

      const validCoords = validateQuizMetadata(validFormData, 1, true);
      expect(validCoords.valid).toBe(true);
    });
  });

  describe("normalizeQuestionBeforeSave", () => {
    it("should set __ORDER__ for top10_order", () => {
      const normalized = normalizeQuestionBeforeSave({
        question_text: "Top 10",
        question_type: "top10_order",
        correct_answer: "",
        options: [" A ", " B "],
        points: 100,
        order_index: 0,
      });
      expect(normalized.correct_answer).toBe("__ORDER__");
      expect(normalized.options).toEqual(["A", "B"]);
    });

    it("should set __AUTO__ for puzzle_map", () => {
      const normalized = normalizeQuestionBeforeSave({
        question_text: "Puzzle",
        question_type: "puzzle_map",
        correct_answer: "",
        options: ["A"],
        points: 100,
        order_index: 0,
      });
      expect(normalized.correct_answer).toBe("__AUTO__");
      expect(normalized.options).toEqual([]);
    });
  });
});
