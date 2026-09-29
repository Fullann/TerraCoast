import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  WifiOff,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Brain,
  Sparkles,
  Check,
  Share2,
} from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAuth } from "../../../contexts/AuthContext";
import { triggerConfetti } from "../../common/Confetti";
import { addCardToSrs } from "../../../lib/srsManager";
import { recordConqueredCountries } from "../../../lib/conquestManager";
import { VisualShareModal } from "../../common/VisualShareModal";
import {
  getUserFederation,
  mapQuizToConquestZone,
  recordFederationInfluence,
  CONQUEST_ZONES_CONFIG,
} from "../../../lib/federations";
import {
  saveSentGhostRun,
  recordCompletedGhostRun,
  type GhostRunChallenge,
} from "../../../lib/ghostRunManager";
import { GhostRunModal } from "../../duels/GhostRunModal";
import { Swords } from "lucide-react";
import type { Question, QuizAnswer, PuzzleState } from "./types";
import { normalizeAnswer } from "./utils";

interface QuizResultsScreenProps {
  trainingMode: boolean;
  mode: "solo" | "duel";
  quizId: string;
  quizTitle?: string;
  quizCategory?: string;
  ghostChallenge?: GhostRunChallenge | null;
  totalScore: number;
  xpGained: number;
  answers: QuizAnswer[];
  questions: Question[];
  puzzleStates: Record<string, PuzzleState>;
  isOfflinePendingSync: boolean;
  isSyncing: boolean;
  onRetrySync: () => void;
  onReviewMistakes?: () => void;
  onReplayQuiz?: () => void;
  isDailyChallenge?: boolean;
  pathNodeResult?: {
    nodeId: string;
    stars: number;
    gemsAwarded: number;
    score: number;
  } | null;
}

export const QuizResultsScreen: React.FC<QuizResultsScreenProps> = ({
  trainingMode,
  mode,
  quizId,
  quizTitle,
  quizCategory,
  ghostChallenge,
  totalScore,
  xpGained,
  answers,
  questions,
  puzzleStates,
  isOfflinePendingSync,
  isSyncing,
  onRetrySync,
  onReviewMistakes,
  onReplayQuiz,
  isDailyChallenge,
  pathNodeResult,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [addedErrorsToSrs, setAddedErrorsToSrs] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showGhostModal, setShowGhostModal] = useState(false);
  const [influenceResult, setInfluenceResult] = useState<{
    points: number;
    zoneName: string;
    zoneEmoji: string;
    fedFlag: string;
    fedName: string;
  } | null>(null);
  const [ghostRunOutcome, setGhostRunOutcome] = useState<{
    won: boolean;
    scoreDiff: number;
    challengerPseudo: string;
    challengerScore: number;
  } | null>(null);

  const correctAnswers = answers.filter((a) => a.is_correct).length;
  const accuracy = questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0;
  const wrongAnswersCount = answers.filter((a) => !a.is_correct).length;
  const [conquestResult, setConquestResult] = useState<{
    newlyConquered: string[];
    totalConquered: number;
  } | null>(null);

  useEffect(() => {
    if (accuracy === 100 || totalScore === 100 || isDailyChallenge) {
      triggerConfetti();
    }
  }, [accuracy, totalScore, isDailyChallenge]);

  // Influence Conquête des Nations ⚔️
  useEffect(() => {
    if (totalScore > 0 || accuracy >= 50) {
      const fed = getUserFederation(user?.id);
      const zoneKey = mapQuizToConquestZone(quizCategory || quizTitle);
      const zoneConfig = CONQUEST_ZONES_CONFIG[zoneKey];
      const points = Math.max(25, Math.round(totalScore / 4));
      recordFederationInfluence(fed.id, zoneKey, points);
      setInfluenceResult({
        points,
        zoneName: zoneConfig.name,
        zoneEmoji: zoneConfig.emoji,
        fedFlag: fed.flagEmoji,
        fedName: fed.name,
      });
    }
  }, [totalScore, accuracy, quizCategory, quizTitle, user?.id]);

  // Résultat du Ghost Run s'il y avait un défi actif 👻
  useEffect(() => {
    if (ghostChallenge) {
      const won = totalScore > ghostChallenge.challengerScore;
      const scoreDiff = Math.abs(totalScore - ghostChallenge.challengerScore);
      const opponentPseudo =
        user?.user_metadata?.username ||
        user?.user_metadata?.full_name ||
        user?.email?.split("@")[0] ||
        "Explorateur";

      recordCompletedGhostRun({
        id: `res_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        challengeId: ghostChallenge.id,
        quizId,
        quizTitle: quizTitle || ghostChallenge.quizTitle,
        challengerPseudo: ghostChallenge.challengerPseudo,
        challengerScore: ghostChallenge.challengerScore,
        opponentPseudo,
        opponentScore: totalScore,
        opponentAccuracy: Math.round(accuracy),
        opponentWon: won,
        scoreDifference: scoreDiff,
        completedAt: new Date().toISOString(),
      });

      setGhostRunOutcome({
        won,
        scoreDiff,
        challengerPseudo: ghostChallenge.challengerPseudo,
        challengerScore: ghostChallenge.challengerScore,
      });
    }
  }, [ghostChallenge, totalScore, accuracy, quizId, quizTitle, user]);

  useEffect(() => {
    if (accuracy >= 80 && questions.length > 0) {
      const isos: string[] = [];
      for (const q of questions) {
        const mapData = q.map_data as any;
        if (Array.isArray(mapData?.selectedCountries)) {
          isos.push(...mapData.selectedCountries);
        }
        if (mapData?.targetCountry && typeof mapData.targetCountry === "string") {
          isos.push(mapData.targetCountry);
        }
        if (mapData?.iso3 && typeof mapData.iso3 === "string") {
          isos.push(mapData.iso3);
        }
      }
      if (isos.length > 0) {
        const res = recordConqueredCountries(
          isos,
          accuracy,
          user?.id,
          isDailyChallenge ? "daily" : "quiz"
        );
        setConquestResult(res);
      }
    }
  }, [accuracy, questions, user?.id, isDailyChallenge]);

  const currentGhostChallenge: GhostRunChallenge = {
    id: `ghost_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    quizId,
    quizTitle: quizTitle || "Quiz TerraCoast",
    quizCategory,
    challengerId: user?.id,
    challengerPseudo:
      user?.user_metadata?.username ||
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      "Explorateur",
    challengerAvatar: user?.user_metadata?.avatar_url,
    challengerScore: totalScore,
    challengerAccuracy: Math.round(accuracy),
    challengerTimeSeconds: answers.reduce((acc, a) => acc + (a.time_taken || 0), 0),
    createdAt: new Date().toISOString(),
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-sky-50/20 to-emerald-50/20">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="card-duo p-6 sm:p-8 md:p-10 bg-white shadow-xl rounded-3xl">
            {/* HERO TROPHY & CELEBRATION */}
            <div className="text-center mb-8 relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-4 rounded-full bg-gradient-to-b from-amber-100 to-amber-200/60 border-2 border-amber-300 border-b-4 flex items-center justify-center shadow-md animate-duo-bounce relative">
                <Trophy className="w-14 h-14 sm:w-16 sm:h-16 text-amber-500 drop-shadow-sm" />
                <Sparkles className="w-6 h-6 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 mb-2 tracking-tight">
                {trainingMode
                  ? t("playQuiz.trainingComplete") || "Entraînement Terminé !"
                  : accuracy >= 80
                  ? "Incroyable Performance ! 🎉"
                  : t("playQuiz.quizComplete") || "Quiz Terminé !"}
              </h1>
              <p className="text-slate-600 font-bold text-sm sm:text-base max-w-lg mx-auto">
                {trainingMode
                  ? t("playQuiz.trainingMessage")
                  : t("playQuiz.congratsMessage")}
              </p>
            </div>

            {/* DÉNOUEMENT GHOST RUN S'IL Y EN AVAIT UN 👻 */}
            {ghostRunOutcome && (
              <div
                className={`mb-6 p-4 sm:p-5 rounded-2xl border-2 text-center shadow-md animate-fade-in ${
                  ghostRunOutcome.won
                    ? "bg-emerald-50 border-emerald-500 text-emerald-950"
                    : "bg-purple-50 border-purple-500 text-purple-950"
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-2xl">{ghostRunOutcome.won ? "🏆" : "👻"}</span>
                  <h3 className="text-base sm:text-lg font-black">
                    {ghostRunOutcome.won
                      ? `Victoire ! Tu as battu le fantôme de ${ghostRunOutcome.challengerPseudo} !`
                      : `Le fantôme de ${ghostRunOutcome.challengerPseudo} l'emporte !`}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-700">
                  Votre score : <strong className="text-emerald-700">{totalScore} pts</strong> •
                  Score fantôme : <strong className="text-purple-700">{ghostRunOutcome.challengerScore} pts</strong>{" "}
                  (
                  {ghostRunOutcome.won
                    ? `+${ghostRunOutcome.scoreDiff} pts d'avance !`
                    : `-${ghostRunOutcome.scoreDiff} pts`}
                  )
                </p>
              </div>
            )}

            {/* INFLUENCE CONQUÊTE DES NATIONS ⚔️ */}
            {influenceResult && (
              <div className="mb-6 p-3.5 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl border border-indigo-700/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{influenceResult.zoneEmoji}</span>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 block">
                      Guerre des Fédérations • Zone {influenceResult.zoneName}
                    </span>
                    <p className="text-xs font-bold text-slate-100">
                      Votre score fortifie les positions de votre Blason territorial !
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-xs shrink-0 shadow-sm self-start sm:self-auto">
                  <Swords className="w-3.5 h-3.5" />
                  <span>+{influenceResult.points} pts d'influence {influenceResult.fedFlag}</span>
                </div>
              </div>
            )}

            {isOfflinePendingSync && (
              <div
                role="status"
                aria-live="polite"
                className="mb-8 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 border-b-4 text-amber-950 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <WifiOff className="w-6 h-6 text-amber-600 shrink-0" aria-hidden="true" />
                  <div className="text-left">
                    <h3 className="font-black text-sm">{t("offline.title")}</h3>
                    <p className="text-xs text-amber-800 mt-0.5">
                      {t("offline.savePending")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onRetrySync}
                  disabled={isSyncing}
                  className="btn-duo btn-duo-amber px-4 py-2 text-xs font-black shrink-0"
                >
                  {isSyncing ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" aria-hidden="true" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-1.5" aria-hidden="true" />
                  )}
                  {t("offline.retrySave")}
                </button>
              </div>
            )}

            {/* BANNIÈRE DÉFI DU JOUR */}
            {isDailyChallenge && (
              <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white shadow-lg flex items-center justify-between gap-4 border-2 border-amber-400 border-b-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl sm:text-4xl">📅🔥</span>
                  <div>
                    <h3 className="font-black text-base sm:text-lg">
                      {t("daily.challengeCompletedTitle") || "Défi Quotidien Validé !"}
                    </h3>
                    <p className="text-amber-100 text-xs sm:text-sm font-medium">
                      {t("daily.challengeCompletedDesc") || "Ton score est enregistré au classement du jour et ta flamme est alimentée !"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/terra")}
                  className="btn-duo btn-duo-white shrink-0 px-4 py-2 text-xs sm:text-sm font-black text-orange-600"
                >
                  {t("daily.viewLeaderboard") || "Classement"}
                </button>
              </div>
            )}

            {/* BANNIÈRE CONQUÊTE & POKÉDEX */}
            {conquestResult && conquestResult.newlyConquered.length > 0 && (
              <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-emerald-500 border-b-4 animate-slide-in-right">
                <div className="flex items-center gap-3.5">
                  <span className="text-3xl sm:text-4xl filter drop-shadow">🗺️✨</span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-base sm:text-lg">
                        {conquestResult.newlyConquered.length} Nouveau(x) Territoire(s) Conquis !
                      </h3>
                      <span className="bg-emerald-400 text-slate-950 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                        Pokédex Débloqué
                      </span>
                    </div>
                    <p className="text-emerald-100 text-xs sm:text-sm mt-0.5 font-medium">
                      Le brouillard s'est dissipé sur : <strong>{conquestResult.newlyConquered.join(", ")}</strong>. Nouvelles fiches prêtes !
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/conquest")}
                  className="btn-duo btn-duo-white shrink-0 px-4 py-2.5 text-xs sm:text-sm font-black text-emerald-900"
                >
                  <span>Voir ma Carte 🗺️</span>
                </button>
              </div>
            )}

            {/* BANNIÈRE VALIDATION DU PARCOURS D'AVENTURE */}
            {pathNodeResult && (
              <div className="mb-6 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-emerald-400 border-b-4 animate-slide-in-right">
                <div className="flex items-center gap-3.5">
                  <span className="text-4xl sm:text-5xl filter drop-shadow animate-duo-bounce">🌟</span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-lg sm:text-xl">
                        Étape du Parcours Validée ! {pathNodeResult.stars === 3 ? "⭐⭐⭐" : pathNodeResult.stars === 2 ? "⭐⭐" : "⭐"}
                      </h3>
                      <span className="bg-amber-300 text-amber-950 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                        Niveau Réussi
                      </span>
                    </div>
                    <p className="text-emerald-100 text-xs sm:text-sm mt-1 font-medium">
                      +{pathNodeResult.gemsAwarded} 💎 TerraGems gagnées • Le palier suivant de ton aventure est débloqué !
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/terra")}
                  className="btn-duo btn-duo-white shrink-0 px-5 py-3 text-xs sm:text-sm font-black text-emerald-900"
                >
                  <span>Continuer le Parcours ➔</span>
                </button>
              </div>
            )}

            {/* GRILLE TACTILE STATS 3D */}
            <div
              className={`grid gap-3.5 sm:gap-4 mb-8 ${
                trainingMode
                  ? "grid-cols-2 max-w-2xl mx-auto"
                  : "grid-cols-2 lg:grid-cols-4"
              }`}
            >
              {!trainingMode && (
                <>
                  <div className="card-duo p-4 sm:p-5 text-center bg-emerald-50/80 border-emerald-200 border-b-emerald-400">
                    <p className="text-emerald-800 text-xs font-black uppercase tracking-wider mb-1">
                      {t("playQuiz.totalScore")}
                    </p>
                    <p className="text-2xl sm:text-4xl font-black text-emerald-950">
                      {totalScore} <span className="text-xs sm:text-sm font-bold text-emerald-700">pts</span>
                    </p>
                  </div>

                  <div className="card-duo p-4 sm:p-5 text-center bg-purple-50/80 border-purple-200 border-b-purple-400">
                    <p className="text-purple-800 text-xs font-black uppercase tracking-wider mb-1">
                      {t("playQuiz.xpGained")}
                    </p>
                    <p className="text-2xl sm:text-4xl font-black text-purple-950">
                      +{xpGained} <span className="text-xs sm:text-sm font-bold text-purple-700">XP</span>
                    </p>
                  </div>
                </>
              )}

              <div className="card-duo p-4 sm:p-5 text-center bg-sky-50/80 border-sky-200 border-b-sky-400">
                <p className="text-sky-800 text-xs font-black uppercase tracking-wider mb-1">
                  {t("playQuiz.accuracy")}
                </p>
                <p className="text-2xl sm:text-4xl font-black text-sky-950">
                  {Math.round(accuracy)}%
                </p>
              </div>

              <div className="card-duo p-4 sm:p-5 text-center bg-amber-50/80 border-amber-200 border-b-amber-400">
                <p className="text-amber-800 text-xs font-black uppercase tracking-wider mb-1">
                  {t("playQuiz.correctAnswers")}
                </p>
                <p className="text-2xl sm:text-4xl font-black text-amber-950">
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

            {/* Boutons Réviser mes erreurs & Carnet SRS */}
            {wrongAnswersCount > 0 && mode !== "duel" && (
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                {onReviewMistakes && (
                  <button
                    type="button"
                    onClick={onReviewMistakes}
                    className="flex-1 py-3.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-md shadow-amber-500/25 transition transform hover:scale-[1.01] active:scale-98 flex items-center justify-center gap-2 text-sm"
                  >
                    <Brain className="w-5 h-5 text-white" />
                    <span>
                      {t("playQuiz.reviewMistakes")} ({wrongAnswersCount}) 🧠
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const wrongQuestions = questions.filter((_, idx) => {
                      const ans = answers[idx];
                      return ans && !ans.is_correct;
                    });
                    const isos: string[] = [];
                    for (const q of wrongQuestions) {
                      const mapData = q.map_data as any;
                      if (mapData?.selectedCountries) {
                        isos.push(...mapData.selectedCountries);
                      }
                    }
                    if (isos.length > 0) {
                      isos.forEach((iso) => addCardToSrs(iso, "capital", user?.id || null));
                    }
                    setAddedErrorsToSrs(true);
                  }}
                  className={`py-3.5 px-5 btn-duo text-sm font-black transition-all flex items-center justify-center gap-2 ${
                    addedErrorsToSrs
                      ? "btn-duo-green"
                      : "btn-duo-purple"
                  }`}
                >
                  {addedErrorsToSrs ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{t("playQuiz.srsAdded")}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>{t("playQuiz.addToSrs")}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Boutons Partage : Ghost Run & Résultat Visuel */}
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  saveSentGhostRun(currentGhostChallenge);
                  setShowGhostModal(true);
                }}
                className="w-full py-4 px-5 btn-duo btn-duo-purple text-sm sm:text-base font-black shadow-md flex items-center justify-center gap-2.5"
              >
                <span className="text-xl">👻</span>
                <span>DÉFIER UN AMI (GHOST RUN)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="w-full py-4 px-5 btn-duo btn-duo-teal text-sm sm:text-base font-black shadow-md flex items-center justify-center gap-2.5"
              >
                <Share2 className="w-5 h-5" />
                <span>{t("playQuiz.shareResult") || "PARTAGER MON RÉSULTAT 📤"}</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4">
              <button
                onClick={() => navigate("/quizzes")}
                className="flex-1 py-3.5 px-5 btn-duo btn-duo-white text-sm sm:text-base font-black shadow-xs"
              >
                {t("playQuiz.exploreOtherQuizzes") || "Explorer d'autres quiz 📚"}
              </button>
              {mode === "duel" ? (
                <button
                  onClick={() => navigate("/duels")}
                  className="flex-1 py-3.5 px-5 btn-duo btn-duo-blue text-sm sm:text-base font-black shadow-md"
                >
                  {t("duels.viewResults")}
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (onReplayQuiz) {
                      onReplayQuiz();
                    } else {
                      navigate(`/quizzes/play/${quizId}`);
                    }
                  }}
                  className="flex-1 py-3.5 px-5 btn-duo btn-duo-green text-sm sm:text-base font-black shadow-md"
                >
                  {t("playQuiz.playAgain") || "Rejouer ce Quiz 🔄"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <VisualShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        data={{
          title: isDailyChallenge ? "Défi du Jour" : "Quiz Géo",
          subtitle: trainingMode ? "Mode Entraînement" : undefined,
          playerPseudo:
            user?.user_metadata?.username ||
            user?.user_metadata?.full_name ||
            user?.email?.split("@")[0] ||
            "Explorateur",
          playerAvatar: user?.user_metadata?.avatar_url,
          scoreDisplay: `${totalScore} pts`,
          accuracyPercent: Math.round(accuracy),
          timeTakenSeconds: answers.reduce((acc, a) => acc + (a.time_taken || 0), 0),
          emojiGrid: answers.map((a) => (a.is_correct ? "🟩" : "🟥")).join(""),
          url: typeof window !== "undefined" ? window.location.origin : undefined,
        }}
      />

      <GhostRunModal
        isOpen={showGhostModal}
        challenge={currentGhostChallenge}
        onClose={() => setShowGhostModal(false)}
      />
    </div>
  );
};
