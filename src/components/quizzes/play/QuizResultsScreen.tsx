import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  WifiOff,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Brain,
} from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { triggerConfetti } from "../../common/Confetti";
import type { Question, QuizAnswer, PuzzleState } from "./types";
import { normalizeAnswer } from "./utils";

interface QuizResultsScreenProps {
  trainingMode: boolean;
  mode: "solo" | "duel";
  quizId: string;
  totalScore: number;
  xpGained: number;
  answers: QuizAnswer[];
  questions: Question[];
  puzzleStates: Record<string, PuzzleState>;
  isOfflinePendingSync: boolean;
  isSyncing: boolean;
  onRetrySync: () => void;
  onReviewMistakes?: () => void;
  isDailyChallenge?: boolean;
}

export const QuizResultsScreen: React.FC<QuizResultsScreenProps> = ({
  trainingMode,
  mode,
  quizId,
  totalScore,
  xpGained,
  answers,
  questions,
  puzzleStates,
  isOfflinePendingSync,
  isSyncing,
  onRetrySync,
  onReviewMistakes,
  isDailyChallenge,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const correctAnswers = answers.filter((a) => a.is_correct).length;
  const accuracy = questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0;
  const wrongAnswersCount = answers.filter((a) => !a.is_correct).length;

  useEffect(() => {
    if (accuracy === 100 || totalScore === 100 || isDailyChallenge) {
      triggerConfetti();
    }
  }, [accuracy, totalScore, isDailyChallenge]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
            <div className="text-center mb-8">
              <Trophy className="w-16 h-16 md:w-20 md:h-20 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2">
                {trainingMode
                  ? t("playQuiz.trainingComplete")
                  : t("playQuiz.quizComplete")}
              </h1>
              <p className="text-gray-600">
                {trainingMode
                  ? t("playQuiz.trainingMessage")
                  : t("playQuiz.congratsMessage")}
              </p>
            </div>

            {isOfflinePendingSync && (
              <div
                role="status"
                aria-live="polite"
                className="mb-8 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <WifiOff className="w-6 h-6 text-amber-600 shrink-0" aria-hidden="true" />
                  <div className="text-left">
                    <h3 className="font-semibold text-sm">{t("offline.title")}</h3>
                    <p className="text-xs text-amber-800 mt-0.5">
                      {t("offline.savePending")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onRetrySync}
                  disabled={isSyncing}
                  className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 shadow-sm"
                >
                  {isSyncing ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  )}
                  {t("offline.retrySave")}
                </button>
              </div>
            )}

            {/* BANNIÈRE DÉFI DU JOUR */}
            {isDailyChallenge && (
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white shadow-lg flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📅🔥</span>
                  <div>
                    <h3 className="font-extrabold text-base sm:text-lg">
                      {t("daily.challengeCompletedTitle") || "Défi Quotidien Validé !"}
                    </h3>
                    <p className="text-amber-100 text-xs sm:text-sm">
                      {t("daily.challengeCompletedDesc") || "Ton score est enregistré au classement du jour et ta flamme est alimentée !"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/terra")}
                  className="shrink-0 px-4 py-2 bg-white text-orange-600 font-bold rounded-xl text-xs sm:text-sm shadow hover:bg-amber-50 transition-colors"
                >
                  {t("daily.viewLeaderboard") || "Classement"}
                </button>
              </div>
            )}

            {/* GRILLE RESPONSIVE STATS */}
            <div
              className={`grid gap-4 mb-8 ${
                trainingMode
                  ? "grid-cols-2 sm:grid-cols-2 max-w-2xl mx-auto"
                  : "grid-cols-2 lg:grid-cols-4"
              }`}
            >
              {!trainingMode && (
                <>
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 md:p-6 text-white text-center">
                    <p className="text-emerald-100 text-xs sm:text-sm mb-2">
                      {t("playQuiz.totalScore")}
                    </p>
                    <p className="text-2xl md:text-4xl font-bold">{totalScore}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 md:p-6 text-white text-center">
                    <p className="text-purple-100 text-xs sm:text-sm mb-2">
                      {t("playQuiz.xpGained")}
                    </p>
                    <p className="text-2xl md:text-4xl font-bold">+{xpGained}</p>
                  </div>
                </>
              )}

              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 md:p-6 text-white text-center">
                <p className="text-blue-100 text-xs sm:text-sm mb-2">
                  {t("playQuiz.accuracy")}
                </p>
                <p className="text-2xl md:text-4xl font-bold">{Math.round(accuracy)}%</p>
              </div>

              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 md:p-6 text-white text-center">
                <p className="text-amber-100 text-xs sm:text-sm mb-2">
                  {t("playQuiz.correctAnswers")}
                </p>
                <p className="text-2xl md:text-4xl font-bold">
                  {correctAnswers}/{questions.length}
                </p>
              </div>
            </div>

            {/* RÉSUMÉ DES RÉPONSES */}
            <div className="mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
                {t("playQuiz.summary")}
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {questions.map((question, index) => {
                  const answer = answers[index];
                  const puzzleState = puzzleStates[question.id];
                  let parsedPuzzle: {
                    assignments?: Record<string, string>;
                    pickedIso3s?: string[];
                    wrongIso3s?: string[];
                    exactMatches?: number;
                    totalSlots?: number;
                  } | null = null;
                  let parsedTop10: {
                    order?: string[];
                    expected?: string[];
                    exactMatches?: number;
                    total?: number;
                  } | null = null;
                  let parsedCountryMulti: {
                    details?: Array<{
                      iso3: string;
                      targetName: string;
                      targetCapital: string;
                      targetFlagEmoji?: string;
                      isNameCorrect: boolean;
                      isCapitalCorrect: boolean;
                      isMapCorrect: boolean;
                    }>;
                    correctChecks?: number;
                    totalChecks?: number;
                  } | null = null;

                  if (
                    (question.question_type === "puzzle_map" ||
                      question.question_type === "map_click") &&
                    answer?.user_answer &&
                    answer.user_answer.trim().startsWith("{")
                  ) {
                    try {
                      parsedPuzzle = JSON.parse(answer.user_answer);
                    } catch {
                      parsedPuzzle = null;
                    }
                  }
                  if (
                    question.question_type === "top10_order" &&
                    answer?.user_answer &&
                    answer.user_answer.trim().startsWith("{")
                  ) {
                    try {
                      parsedTop10 = JSON.parse(answer.user_answer);
                    } catch {
                      parsedTop10 = null;
                    }
                  }
                  if (
                    question.question_type === "country_multi" &&
                    answer?.user_answer &&
                    answer.user_answer.trim().startsWith("{")
                  ) {
                    try {
                      parsedCountryMulti = JSON.parse(answer.user_answer);
                    } catch {
                      parsedCountryMulti = null;
                    }
                  }

                  const isCorrectAnswer =
                    answer?.is_correct ||
                    (answer?.user_answer &&
                      (question.correct_answers && question.correct_answers.length > 0
                        ? question.correct_answers.some(
                            (ca) =>
                              normalizeAnswer(answer.user_answer) === normalizeAnswer(ca)
                          )
                        : normalizeAnswer(answer.user_answer) ===
                          normalizeAnswer(question.correct_answer)));

                  return (
                    <div
                      key={question.id}
                      className={`p-4 rounded-lg border-2 ${
                        isCorrectAnswer
                          ? "border-green-300 bg-green-50"
                          : "border-red-300 bg-red-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 mb-2">
                            {index + 1}. {question.question_text}
                          </p>
                          <p className="text-sm text-gray-600">
                            {t("playQuiz.yourAnswer")}:{" "}
                            <span className="font-medium">
                              {question.question_type === "puzzle_map" ||
                              question.question_type === "map_click"
                                ? parsedPuzzle?.totalSlots
                                  ? `${parsedPuzzle.exactMatches || 0}/${
                                      parsedPuzzle.totalSlots
                                    } ${t("playQuiz.puzzle.correctlyPlaced")}`
                                  : t("playQuiz.noAnswer")
                                : question.question_type === "top10_order"
                                ? parsedTop10?.order?.length
                                  ? `${parsedTop10.order.length} ${t(
                                      "playQuiz.top10.itemsRanked"
                                    )}`
                                  : t("playQuiz.noAnswer")
                                : question.question_type === "country_multi"
                                ? parsedCountryMulti?.totalChecks
                                  ? `${parsedCountryMulti.correctChecks || 0}/${
                                      parsedCountryMulti.totalChecks
                                    }`
                                  : t("playQuiz.noAnswer")
                                : answer?.user_answer || t("playQuiz.noAnswer")}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600">
                            {t("playQuiz.correctAnswer")}:{" "}
                            <span className="font-medium text-emerald-600">
                              {question.question_type === "map_click" &&
                              puzzleState?.countries?.length
                                ? puzzleState.countries.map((c) => c.name).join(", ")
                                : question.question_type === "puzzle_map"
                                ? t("playQuiz.puzzle.expectedCountries")
                                : question.question_type === "top10_order"
                                ? t("playQuiz.top10.exactOrder")
                                : question.question_type === "country_multi"
                                ? t("createQuiz.countryMulti.fieldsLabel")
                                : question.correct_answer}
                            </span>
                          </p>
                          {(question.question_type === "puzzle_map" ||
                            question.question_type === "map_click") &&
                            puzzleState && (
                              <div className="mt-2 bg-white border border-emerald-200 rounded p-2">
                                <p className="text-xs font-semibold text-emerald-700 mb-1">
                                  {t("playQuiz.puzzle.expectedCountries")}
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {puzzleState.countries.map((country) => (
                                    <span
                                      key={`expected-country-${question.id}-${country.iso3}`}
                                      className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    >
                                      {country.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          {question.question_type === "top10_order" &&
                            parsedTop10?.order &&
                            parsedTop10?.expected && (
                              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="bg-white border border-gray-200 rounded p-2">
                                  <p className="text-xs font-semibold text-gray-700 mb-1">
                                    {t("playQuiz.top10.yourOrder")}
                                  </p>
                                  <ol className="list-decimal list-inside text-xs text-gray-700 space-y-0.5">
                                    {parsedTop10.order.map((item, itemIndex) => (
                                      <li key={`user-order-${itemIndex}`}>{item}</li>
                                    ))}
                                  </ol>
                                </div>
                                <div className="bg-white border border-emerald-200 rounded p-2">
                                  <p className="text-xs font-semibold text-emerald-700 mb-1">
                                    {t("playQuiz.top10.expectedOrder")}
                                  </p>
                                  <ol className="list-decimal list-inside text-xs text-emerald-700 space-y-0.5">
                                    {parsedTop10.expected.map((item, itemIndex) => (
                                      <li key={`expected-order-${itemIndex}`}>{item}</li>
                                    ))}
                                  </ol>
                                </div>
                              </div>
                            )}
                          {question.question_type === "country_multi" &&
                            parsedCountryMulti?.details &&
                            parsedCountryMulti.details.length > 0 && (
                              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                                {parsedCountryMulti.details.map((row) => (
                                  <div
                                    key={`country-multi-summary-${question.id}-${row.iso3}`}
                                    className="bg-white border border-indigo-200 rounded p-2 text-xs"
                                  >
                                    <p className="font-semibold text-indigo-800 mb-1">
                                      <span className="mr-1">
                                        {row.targetFlagEmoji || "🏳️"}
                                      </span>
                                      {row.targetName}
                                    </p>
                                    <p
                                      className={
                                        row.isNameCorrect ? "text-green-700" : "text-red-700"
                                      }
                                    >
                                      {row.isNameCorrect ? "✅" : "❌"}{" "}
                                      {t("playQuiz.countryMulti.fieldName")}
                                    </p>
                                    <p
                                      className={
                                        row.isCapitalCorrect ? "text-green-700" : "text-red-700"
                                      }
                                    >
                                      {row.isCapitalCorrect ? "✅" : "❌"}{" "}
                                      {t("playQuiz.countryMulti.fieldCapital")}
                                    </p>
                                    <p
                                      className={
                                        row.isMapCorrect ? "text-green-700" : "text-red-700"
                                      }
                                    >
                                      {row.isMapCorrect ? "✅" : "❌"}{" "}
                                      {t("playQuiz.countryMulti.fieldMapClick")}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                        <div className="ml-4">
                          {isCorrectAnswer ? (
                            <CheckCircle className="w-8 h-8 text-green-600" />
                          ) : (
                            <XCircle className="w-8 h-8 text-red-600" />
                          )}
                        </div>
                      </div>
                      {!trainingMode && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">
                            {answer?.points_earned || 0} {t("home.pts")}
                          </span>
                          {" • "}
                          {answer?.time_taken || 0}s
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bouton Réviser mes erreurs */}
            {wrongAnswersCount > 0 && onReviewMistakes && mode !== "duel" && (
              <button
                type="button"
                onClick={onReviewMistakes}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg shadow-amber-500/25 transition transform hover:scale-[1.01] active:scale-98 flex items-center justify-center gap-2 mb-4 text-base"
              >
                <Brain className="w-5 h-5 text-white" />
                <span>
                  {t("playQuiz.reviewMistakes") || "Réviser mes erreurs"} ({wrongAnswersCount} question{wrongAnswersCount > 1 ? "s" : ""}) 🧠
                </span>
              </button>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate("/quizzes")}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                {t("playQuiz.exploreOtherQuizzes")}
              </button>
              {mode === "duel" ? (
                <button
                  onClick={() => navigate("/duels")}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {t("duels.viewResults")}
                </button>
              ) : (
                <button
                  onClick={() => {
                    navigate(`/quizzes/play/${quizId}`);
                  }}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {t("playQuiz.playAgain")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
