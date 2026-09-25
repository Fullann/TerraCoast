import React from "react";
import { CheckCircle2, XCircle, Sparkles, BookOpen } from "lucide-react";
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

  const pointsEarned =
    lastAnswer?.points_earned ||
    calculatePoints(
      Math.round((Date.now() - questionStartTime) / 1000),
      currentQuestion.points
    );

  return (
    <div
      className={`mt-6 p-5 sm:p-6 rounded-3xl border-2 border-b-4 transition-all duration-200 shadow-md ${
        isSuccess
          ? "bg-emerald-50/95 border-emerald-400 border-b-emerald-600 ring-2 ring-emerald-300/30"
          : "bg-rose-50/95 border-rose-400 border-b-rose-600 ring-2 ring-rose-300/30"
      }`}
    >
      {/* COUNTRY MULTI DETAILS IF APPLICABLE */}
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
                <div className="mb-2 text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-3">
                  <span className="inline-flex items-center text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Correct
                  </span>
                  <span className="inline-flex items-center text-rose-700">
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Incorrect
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {rows.map((row) => (
                    <div
                      key={`cm-row-${row.iso3}`}
                      className="rounded-2xl border-2 border-slate-200 bg-white p-3 text-xs shadow-2xs"
                    >
                      <p className="font-black text-slate-800 mb-1">
                        {row.targetName}
                      </p>
                      {req.includes("name") && (
                        <p className={row.isNameCorrect ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"}>
                          {row.isNameCorrect ? "✅" : "❌"}{" "}
                          {t("playQuiz.countryMulti.fieldName")}:{" "}
                          {row.userCountryName || "—"}{" "}
                          {!row.isNameCorrect ? `(${row.targetName})` : ""}
                        </p>
                      )}
                      {req.includes("capital") && (
                        <p
                          className={
                            row.isCapitalCorrect ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"
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
                            row.isMapCorrect ? "text-emerald-700 font-bold" : "text-rose-700 font-bold"
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

      {/* MAIN BANNER STATUS */}
      <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 border-b-4 shrink-0 shadow-sm ${
              isSuccess
                ? "bg-[#58cc02] text-white border-[#46a302] border-b-[#3c8c02] animate-duo-bounce"
                : "bg-rose-500 text-white border-rose-600 border-b-rose-700 animate-duo-wiggle"
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="w-7 h-7" />
            ) : (
              <XCircle className="w-7 h-7" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4
                className={`text-xl sm:text-2xl font-black tracking-tight ${
                  isSuccess ? "text-emerald-950" : "text-rose-950"
                }`}
              >
                {isSuccess
                  ? t("playQuiz.correct") || "Bonne réponse !"
                  : t("playQuiz.incorrect") || "Pas tout à fait..."}
              </h4>
              {isSuccess && <Sparkles className="w-5 h-5 text-amber-500" />}
            </div>

            {!isSuccess && (
              <div className="text-sm font-bold text-rose-900 mt-1">
                <span>{t("playQuiz.correctAnswerWas") || "La bonne réponse était :"} </span>
                <span className="inline-block bg-white px-2.5 py-0.5 rounded-lg border border-rose-300 font-black text-slate-800 shadow-2xs">
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
                </span>
                {currentQuestion.question_type !== "puzzle_map" &&
                  currentQuestion.question_type !== "map_click" &&
                  currentQuestion.question_type !== "top10_order" &&
                  currentQuestion.question_type !== "country_multi" &&
                  currentQuestion.correct_answers &&
                  currentQuestion.correct_answers.length > 0 && (
                    <span className="block text-xs font-semibold text-rose-700 mt-1">
                      ({t("playQuiz.variants")}: {currentQuestion.correct_answers.join(", ")})
                    </span>
                  )}
              </div>
            )}
          </div>
        </div>

        {isSuccess && (
          <div className="flex items-center gap-1.5 px-3.5 py-2 bg-white rounded-2xl border-2 border-emerald-300 border-b-4 shadow-xs">
            <span className="text-amber-500 text-lg">⚡</span>
            <span className="font-black text-emerald-700 text-base">
              +{pointsEarned} {t("home.pts")}
            </span>
          </div>
        )}
      </div>

      {/* EDUCATIONAL EXPLANATION CARD */}
      {(currentQuestion.complement_if_wrong || "").trim() && (
        <div className="mt-4 rounded-2xl border-2 border-amber-200 border-b-4 bg-white/90 p-4 text-sm text-slate-700 shadow-xs">
          <div className="flex items-center gap-2 font-black text-amber-900 mb-1.5">
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>{t("playQuiz.explanation") || "Explication géographique"}</span>
          </div>
          <p className="font-medium text-slate-800 leading-relaxed">
            {currentQuestion.complement_if_wrong}
          </p>
        </div>
      )}
    </div>
  );
};
