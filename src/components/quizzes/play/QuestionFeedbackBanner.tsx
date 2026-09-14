import React from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import type { Question, QuizAnswer, PuzzleState } from "./types";
import { normalizeAnswer, calculatePoints } from "./utils";

interface QuestionFeedbackBannerProps {
  currentQuestion: Question;
  lastAnswer?: QuizAnswer;
  isAnswered: boolean;
  selectedOption: string;
  userAnswer: string;
  currentPuzzleState?: PuzzleState;
  questionStartTime: number;
}

export const QuestionFeedbackBanner: React.FC<QuestionFeedbackBannerProps> = ({
  currentQuestion,
  lastAnswer,
  isAnswered,
  selectedOption,
  userAnswer,
  currentPuzzleState,
  questionStartTime,
}) => {
  const { t } = useLanguage();

  const isSuccess =
    lastAnswer?.is_correct ||
    (isAnswered &&
      (currentQuestion.question_type === "mcq" ||
      currentQuestion.question_type === "true_false"
        ? normalizeAnswer(selectedOption) ===
          normalizeAnswer(currentQuestion.correct_answer)
        : [
            currentQuestion.correct_answer,
            ...(currentQuestion.correct_answers || []),
          ].some(
            (ca) => normalizeAnswer(userAnswer) === normalizeAnswer(ca)
          )));

  return (
    <div
      className={`mt-6 p-4 rounded-lg ${
        isSuccess
          ? "bg-green-50 border-2 border-green-300"
          : "bg-red-50 border-2 border-red-300"
      }`}
    >
      {currentQuestion.question_type === "country_multi" &&
        (() => {
          if (!lastAnswer?.user_answer?.trim()?.startsWith("{")) return null;
          try {
            const parsed = JSON.parse(lastAnswer.user_answer) as {
              details?: Array<{
                iso3: string;
                targetName: string;
                targetCapital: string;
                userCountryName: string;
                userCapital: string;
                isNameCorrect: boolean;
                isCapitalCorrect: boolean;
                isMapCorrect: boolean;
              }>;
              requiredFields?: ("name" | "capital" | "map_click")[];
            };
            const rows = parsed.details || [];
            const req = parsed.requiredFields || [];
            return (
              <div className="mb-4">
                <div className="mb-2 text-xs text-gray-600">
                  <span className="inline-flex items-center mr-3">
                    <CheckCircle className="w-3.5 h-3.5 mr-1 text-green-600" />
                    OK
                  </span>
                  <span className="inline-flex items-center">
                    <XCircle className="w-3.5 h-3.5 mr-1 text-red-600" />
                    KO
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {rows.map((row) => (
                    <div
                      key={`cm-row-${row.iso3}`}
                      className="rounded border border-gray-200 bg-white p-2 text-xs"
                    >
                      <p className="font-semibold text-gray-700 mb-1">
                        {row.targetName}
                      </p>
                      {req.includes("name") && (
                        <p className={row.isNameCorrect ? "text-green-700" : "text-red-700"}>
                          {row.isNameCorrect ? "✅" : "❌"}{" "}
                          {t("playQuiz.countryMulti.fieldName")}:{" "}
                          {row.userCountryName || "—"}{" "}
                          {!row.isNameCorrect ? `(${row.targetName})` : ""}
                        </p>
                      )}
                      {req.includes("capital") && (
                        <p
                          className={
                            row.isCapitalCorrect ? "text-green-700" : "text-red-700"
                          }
                        >
                          {row.isCapitalCorrect ? "✅" : "❌"}{" "}
                          {t("playQuiz.countryMulti.fieldCapital")}:{" "}
                          {row.userCapital || "—"}{" "}
                          {!row.isCapitalCorrect ? `(${row.targetCapital})` : ""}
                        </p>
                      )}
                      {req.includes("map_click") && (
                        <p
                          className={
                            row.isMapCorrect ? "text-green-700" : "text-red-700"
                          }
                        >
                          {row.isMapCorrect ? "✅" : "❌"}{" "}
                          {t("playQuiz.countryMulti.fieldMapClick")}:{" "}
                          {row.isMapCorrect
                            ? t("playQuiz.correct")
                            : t("playQuiz.incorrect")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          } catch {
            return null;
          }
        })()}

      <div className="flex items-center space-x-3">
        {isSuccess ? (
          <>
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="font-bold text-green-800">{t("playQuiz.correct")}</p>
              <p className="text-sm text-green-700">
                +
                {lastAnswer?.points_earned ||
                  calculatePoints(
                    Math.round((Date.now() - questionStartTime) / 1000),
                    currentQuestion.points
                  )}{" "}
                {t("home.pts")}
              </p>
            </div>
          </>
        ) : (
          <>
            <XCircle className="w-8 h-8 text-red-600" />
            <div>
              <p className="font-bold text-red-800">{t("playQuiz.incorrect")}</p>
              <p className="text-sm text-red-700">
                {t("playQuiz.correctAnswerWas")}:{" "}
                {currentQuestion.question_type === "map_click" &&
                (currentPuzzleState?.countries?.length || 0) > 0
                  ? currentPuzzleState!.countries.map((c) => c.name).join(", ")
                  : currentQuestion.question_type === "puzzle_map"
                  ? t("playQuiz.puzzle.expectedCountries")
                  : currentQuestion.question_type === "top10_order"
                  ? t("playQuiz.top10.exactOrder")
                  : currentQuestion.question_type === "country_multi"
                  ? t("createQuiz.countryMulti.fieldsLabel")
                  : currentQuestion.correct_answer}
                {currentQuestion.question_type !== "puzzle_map" &&
                  currentQuestion.question_type !== "map_click" &&
                  currentQuestion.question_type !== "top10_order" &&
                  currentQuestion.question_type !== "country_multi" &&
                  currentQuestion.correct_answers &&
                  currentQuestion.correct_answers.length > 0 && (
                    <span className="block text-xs mt-1">
                      ({t("playQuiz.variants")}:{" "}
                      {currentQuestion.correct_answers.join(", ")})
                    </span>
                  )}
              </p>
            </div>
          </>
        )}
      </div>

      {(currentQuestion.complement_if_wrong || "").trim() && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <strong className="block text-amber-800 mb-1">
            {t("playQuiz.explanation")}
          </strong>
          <p>{currentQuestion.complement_if_wrong}</p>
        </div>
      )}
    </div>
  );
};
