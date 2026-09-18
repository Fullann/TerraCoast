import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../../contexts/LanguageContext";
import { PuzzleMapQuestion } from "./PuzzleMapQuestion";
import { Top10OrderQuestion } from "./Top10OrderQuestion";
import { getCountriesByIso3 } from "../../lib/countryGameData";
import type { SubdivisionScope } from "../../lib/subdivisionGameData";

import { usePlayQuiz } from "./play/usePlayQuiz";
import { QuizHeader } from "./play/QuizHeader";
import { QuizResultsScreen } from "./play/QuizResultsScreen";
import { QuestionFeedbackBanner } from "./play/QuestionFeedbackBanner";
import { McqQuestionView } from "./play/McqQuestionView";
import { TrueFalseQuestionView } from "./play/TrueFalseQuestionView";
import { TextQuestionView } from "./play/TextQuestionView";
import { CountryMultiQuestionView } from "./play/CountryMultiQuestionView";
import { ReportQuestionModal } from "./play/ReportQuestionModal";
import { Flag } from "lucide-react";

interface PlayQuizPageProps {
  quizId?: string;
  mode?: "solo" | "duel";
  duelId?: string;
  challengeId?: string;
  trainingMode?: boolean;
  questionCount?: number;
  onNavigate?: (view: string, data?: Record<string, unknown>) => void;
}

export function PlayQuizPage({
  quizId: propQuizId,
  mode: propMode = "solo",
  duelId: propDuelId,
  challengeId: propChallengeId,
  trainingMode: propTrainingMode = false,
  questionCount: propQuestionCount,
}: PlayQuizPageProps) {
  const navigate = useNavigate();
  const params = useParams<{ quizId?: string; duelId?: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { t } = useLanguage();

  const duelId =
    propDuelId ||
    params.duelId ||
    searchParams.get("duelId") ||
    (location.state as any)?.duelId;
  const challengeId =
    propChallengeId ||
    searchParams.get("challengeId") ||
    (location.state as any)?.challengeId;
  const mode: "solo" | "duel" =
    propMode !== "solo"
      ? propMode
      : duelId || location.pathname.startsWith("/duels/play")
      ? "duel"
      : ((searchParams.get("mode") as "solo" | "duel") || "solo");
  const trainingMode =
    propTrainingMode ||
    location.pathname.includes("/training") ||
    searchParams.get("training") === "true";
  const questionCount =
    propQuestionCount ||
    (searchParams.get("count")
      ? parseInt(searchParams.get("count")!, 10)
      : undefined);

  const initialQuizId =
    propQuizId ||
    params.quizId ||
    searchParams.get("quizId") ||
    (location.state as any)?.quizId ||
    "";
  const [quizId, setQuizId] = useState<string>(initialQuizId);

  useEffect(() => {
    const directQuizId =
      propQuizId ||
      params.quizId ||
      searchParams.get("quizId") ||
      (location.state as any)?.quizId;
    if (directQuizId) {
      setQuizId(directQuizId);
    } else if (duelId) {
      supabase
        .from("duels")
        .select("quiz_id")
        .eq("id", duelId)
        .single()
        .then(({ data }) => {
          if (data?.quiz_id) {
            setQuizId(data.quiz_id);
          }
        });
    }
  }, [propQuizId, params.quizId, searchParams, location.state, duelId]);

  const {
    quiz,
    questions,
    currentQuestionIndex,
    userAnswer,
    setUserAnswer,
    selectedOption,
    timeLeft,
    questionStartTime,
    challenge,
    answers,
    showResult,
    isAnswered,
    gameComplete,
    totalScore,
    xpGained,
    isOfflinePendingSync,
    isSyncing,
    puzzleStates,
    setPuzzleStates,
    top10States,
    setTop10States,
    countryMultiInputs,
    setCountryMultiInputs,
    consumedPuzzleIso3s,
    firstMcqQuestionIndex,
    handleAnswerClick,
    handleSubmitAnswer,
    moveToNextQuestion,
    completeGame,
    syncSessionProgress,
    restartReviewMistakes,
  } = usePlayQuiz({
    quizId,
    mode,
    duelId,
    challengeId,
    trainingMode,
    questionCount,
  });

  const textInputRef = useRef<HTMLInputElement>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  useEffect(() => {
    const question = questions[currentQuestionIndex];
    if (
      question &&
      (question.question_type === "single_answer" ||
        question.question_type === "text_free") &&
      textInputRef.current
    ) {
      setTimeout(() => textInputRef.current?.focus(), 100);
    }
  }, [currentQuestionIndex, questions]);

  const currentQuestion = questions[currentQuestionIndex];
  const currentPuzzleState = currentQuestion
    ? puzzleStates[currentQuestion.id]
    : undefined;
  const currentTop10State = currentQuestion
    ? top10States[currentQuestion.id]
    : undefined;

  const isValidateDisabled = (() => {
    if (!currentQuestion) return true;
    if (
      currentQuestion.question_type === "mcq" ||
      currentQuestion.question_type === "true_false"
    ) {
      return !selectedOption;
    }
    if (
      currentQuestion.question_type === "puzzle_map" ||
      currentQuestion.question_type === "map_click"
    ) {
      return !currentPuzzleState || currentPuzzleState.pickedIso3s.length === 0;
    }
    if (currentQuestion.question_type === "top10_order") {
      return (
        !currentTop10State ||
        currentTop10State.order.length !== currentTop10State.expected.length ||
        currentTop10State.expected.length < 2
      );
    }
    if (currentQuestion.question_type === "country_multi") {
      const mapData = (currentQuestion.map_data || {}) as {
        selectedCountries?: string[];
        requiredFields?: ("name" | "capital" | "map_click")[];
      };
      const requiredFields = mapData.requiredFields || [];
      const targets = getCountriesByIso3(mapData.selectedCountries || []);
      const inputByIso = countryMultiInputs[currentQuestion.id] || {};
      const hasNameMissing = requiredFields.includes("name")
        ? targets.some(
            (target) =>
              !String((inputByIso[target.iso3] || {}).countryName || "").trim()
          )
        : false;
      const hasCapitalMissing = requiredFields.includes("capital")
        ? targets.some(
            (target) =>
              !String((inputByIso[target.iso3] || {}).capital || "").trim()
          )
        : false;
      const hasMapMissing = requiredFields.includes("map_click")
        ? !currentPuzzleState || currentPuzzleState.pickedIso3s.length === 0
        : false;
      return (
        targets.length === 0 ||
        requiredFields.length === 0 ||
        hasNameMissing ||
        hasCapitalMissing ||
        hasMapMissing
      );
    }
    return !userAnswer.trim();
  })();

  // Raccourcis clavier (1-8, A-H, V/F, Entrée, Espace)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer si le quiz n'est pas prêt, déjà terminé ou si une modale est ouverte
      if (
        !quiz ||
        questions.length === 0 ||
        gameComplete ||
        !currentQuestion ||
        showReportModal ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // 1. Question suivante sur Espace ou Entrée (si la question est déjà répondue)
      if (isAnswered) {
        if (e.key === " " || e.key === "Spacebar" || e.key === "Enter") {
          e.preventDefault();
          moveToNextQuestion();
        }
        return;
      }

      // 2. Valider la réponse sur Entrée
      if (e.key === "Enter") {
        if (!isValidateDisabled) {
          e.preventDefault();
          handleSubmitAnswer();
        }
        return;
      }

      // 3. Sélection des options pour les QCM (touches 1..8 ou A..H)
      if (currentQuestion.question_type === "mcq") {
        const options = (currentQuestion.options as string[]) || [];
        let selectedIndex = -1;

        if (["1", "2", "3", "4", "5", "6", "7", "8"].includes(e.key)) {
          selectedIndex = parseInt(e.key, 10) - 1;
        } else {
          const keyLower = e.key.toLowerCase();
          const letterIndex = ["a", "b", "c", "d", "e", "f", "g", "h"].indexOf(keyLower);
          if (letterIndex !== -1) {
            selectedIndex = letterIndex;
          }
        }

        if (selectedIndex >= 0 && selectedIndex < options.length) {
          e.preventDefault();
          handleAnswerClick(options[selectedIndex]);
        }
        return;
      }

      // 4. Sélection pour les Vrai / Faux (1 ou V -> Vrai, 2 ou F -> Faux)
      if (currentQuestion.question_type === "true_false") {
        const trueLabel = t("createQuiz.trueFalse.true") || "Vrai";
        const falseLabel = t("createQuiz.trueFalse.false") || "Faux";
        const keyLower = e.key.toLowerCase();

        if (e.key === "1" || keyLower === "v" || keyLower === "t" || keyLower === "w") {
          e.preventDefault();
          handleAnswerClick(trueLabel);
        } else if (e.key === "2" || keyLower === "f") {
          e.preventDefault();
          handleAnswerClick(falseLabel);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    quiz,
    questions.length,
    gameComplete,
    isAnswered,
    isValidateDisabled,
    currentQuestion,
    showReportModal,
    moveToNextQuestion,
    handleSubmitAnswer,
    handleAnswerClick,
    t,
  ]);

  if (!quiz || questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("playQuiz.loadingQuiz")}</p>
        </div>
      </div>
    );
  }

  if (gameComplete) {
    return (
      <QuizResultsScreen
        trainingMode={trainingMode}
        mode={mode}
        quizId={quizId}
        totalScore={totalScore}
        xpGained={xpGained}
        answers={answers}
        questions={questions}
        puzzleStates={puzzleStates}
        isOfflinePendingSync={isOfflinePendingSync}
        isSyncing={isSyncing}
        onRetrySync={() => syncSessionProgress()}
        onReviewMistakes={restartReviewMistakes}
        isDailyChallenge={searchParams.get("daily") === "true"}
      />
    );
  }

  if (currentQuestionIndex >= questions.length && !gameComplete) {
    completeGame();
    return null;
  }

  if (!currentQuestion) {
    return null;
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleQuit = () => {
    const confirmed =
      typeof window === "undefined"
        ? true
        : window.confirm(t("playQuiz.confirmQuit"));
    if (!confirmed) return;
    if (mode === "duel") {
      navigate("/duels");
      return;
    }
    if (trainingMode) {
      navigate("/quizzes/training");
      return;
    }
    navigate("/quizzes");
  };

  const handleCountryMultiInputChange = (
    iso3: string,
    field: "countryName" | "capital",
    val: string
  ) => {
    setCountryMultiInputs((prev) => ({
      ...prev,
      [currentQuestion.id]: {
        ...(prev[currentQuestion.id] || {}),
        [iso3]: {
          ...((prev[currentQuestion.id] || {})[iso3] || {
            countryName: "",
            capital: "",
          }),
          [field]: val,
        },
      },
    }));
  };

  const currentMapData = (currentQuestion.map_data || {}) as {
    continent?: string;
    selectedCountries?: string[];
    requiredFields?: ("name" | "capital" | "map_click")[];
    countryMultiPrompt?: string;
    mapLevel?: string;
    subdivisionScope?: SubdivisionScope;
    customGeojsonPublicUrl?: string;
    customGeojsonIdProperty?: string;
    initialView?: any;
  };

  const countryMultiRequiredFields =
    currentMapData.requiredFields || ["name", "capital", "map_click"];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <QuizHeader
        onQuit={handleQuit}
        onReport={() => setShowReportModal(true)}
        trainingMode={trainingMode}
        totalScore={totalScore}
        timeLeft={timeLeft}
        challenge={challenge}
        quizTitle={quiz.title}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={questions.length}
        progress={progress}
      />

      {/* ZONE DE CONTENU SCROLLABLE */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* IMAGE DE LA QUESTION */}
          {currentQuestion.image_url && (
            <div className="mb-6 flex justify-center">
              <img
                src={currentQuestion.image_url}
                alt={t("playQuiz.questionImage")}
                className="max-w-full max-h-64 rounded-lg shadow-md object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}

          {/* TEXTE DE LA QUESTION */}
          <div className="mb-6">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-sm text-gray-500 truncate">{quiz.title}</p>
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-amber-600 transition-colors px-2 py-1 rounded-md hover:bg-amber-50 shrink-0"
                title={t("playQuiz.report.buttonTitle") || "Signaler un problème sur cette question"}
              >
                <Flag className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">{t("playQuiz.report.button") || "Signaler"}</span>
              </button>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-800">
              {currentQuestion.question_text ||
                currentMapData.countryMultiPrompt ||
                ""}
            </h3>
            {(currentQuestion.question_type === "puzzle_map" ||
              currentQuestion.question_type === "map_click" ||
              currentQuestion.question_type === "top10_order" ||
              currentQuestion.question_type === "country_multi") && (
              <p className="mt-2 text-sm text-gray-600 bg-gray-100 border border-gray-200 rounded px-3 py-2">
                {currentQuestion.question_type === "top10_order"
                  ? t("playQuiz.objective.top10Order")
                  : currentQuestion.question_type === "map_click"
                  ? t("playQuiz.objective.mapClick")
                  : currentQuestion.question_type === "country_multi"
                  ? t("playQuiz.countryMulti.objective")
                  : t("playQuiz.objective.puzzleMap")}
              </p>
            )}
          </div>

          {/* QUESTION TYPE VIEWS */}
          {currentQuestion.question_type === "mcq" &&
            currentQuestion.options && (
              <McqQuestionView
                options={
                  (Array.isArray(currentQuestion.options)
                    ? currentQuestion.options
                    : []) as string[]
                }
                optionImages={
                  currentQuestion.option_images as Record<string, string> | null
                }
                selectedOption={selectedOption}
                isAnswered={isAnswered}
                correctAnswer={currentQuestion.correct_answer}
                correctAnswers={currentQuestion.correct_answers}
                onSelectOption={handleAnswerClick}
                showHint={
                  !trainingMode &&
                  firstMcqQuestionIndex >= 0 &&
                  currentQuestionIndex === firstMcqQuestionIndex &&
                  !isAnswered
                }
              />
            )}

          {currentQuestion.question_type === "true_false" && (
            <TrueFalseQuestionView
              selectedOption={selectedOption}
              isAnswered={isAnswered}
              correctAnswer={currentQuestion.correct_answer}
              onSelectOption={handleAnswerClick}
            />
          )}

          {(currentQuestion.question_type === "single_answer" ||
            currentQuestion.question_type === "text_free") && (
            <TextQuestionView
              inputRef={textInputRef}
              userAnswer={userAnswer}
              isAnswered={isAnswered}
              onChange={setUserAnswer}
              onSubmit={handleSubmitAnswer}
            />
          )}

          {(currentQuestion.question_type === "puzzle_map" ||
            currentQuestion.question_type === "map_click") &&
            currentPuzzleState && (
              <PuzzleMapQuestion
                countries={currentPuzzleState.countries}
                geographySource={
                  currentMapData.mapLevel === "custom_geojson"
                    ? "custom_geojson"
                    : currentMapData.mapLevel === "subdivisions" &&
                      currentMapData.subdivisionScope
                    ? (currentMapData.subdivisionScope as SubdivisionScope)
                    : "world"
                }
                customGeoJsonUrl={
                  currentMapData.mapLevel === "custom_geojson"
                    ? String(currentMapData.customGeojsonPublicUrl || "") || null
                    : null
                }
                customIdProperty={String(
                  currentMapData.customGeojsonIdProperty || "tc_id"
                )}
                showTargetList={false}
                excludedIso3s={
                  currentQuestion.question_type === "puzzle_map"
                    ? consumedPuzzleIso3s
                    : []
                }
                revealResult={showResult || isAnswered}
                initialView={currentMapData.initialView || null}
                assignments={currentPuzzleState.assignments}
                pickedIso3s={currentPuzzleState.pickedIso3s}
                onAssignmentsChange={(nextAssignments) =>
                  setPuzzleStates((prev) => ({
                    ...prev,
                    [currentQuestion.id]: {
                      ...currentPuzzleState,
                      assignments: nextAssignments,
                    },
                  }))
                }
                onPickedIso3sChange={(nextPickedIso3s) =>
                  setPuzzleStates((prev) => ({
                    ...prev,
                    [currentQuestion.id]: {
                      ...currentPuzzleState,
                      pickedIso3s: nextPickedIso3s,
                    },
                  }))
                }
              />
            )}

          {currentQuestion.question_type === "top10_order" && currentTop10State && (
            <Top10OrderQuestion
              order={currentTop10State.order}
              onOrderChange={(nextOrder) =>
                setTop10States((prev) => ({
                  ...prev,
                  [currentQuestion.id]: {
                    ...currentTop10State,
                    order: nextOrder,
                  },
                }))
              }
            />
          )}

          {currentQuestion.question_type === "country_multi" && (
            <CountryMultiQuestionView
              question={currentQuestion}
              inputs={countryMultiInputs[currentQuestion.id] || {}}
              isAnswered={isAnswered}
              onInputChange={handleCountryMultiInputChange}
            />
          )}

          {currentQuestion.question_type === "country_multi" &&
            countryMultiRequiredFields.includes("map_click") &&
            currentPuzzleState && (
              <PuzzleMapQuestion
                countries={currentPuzzleState.countries}
                geographySource="world"
                showTargetList={false}
                excludedIso3s={[]}
                revealResult={showResult || isAnswered}
                initialView={currentMapData.initialView || null}
                assignments={currentPuzzleState.assignments}
                pickedIso3s={currentPuzzleState.pickedIso3s}
                onAssignmentsChange={(nextAssignments) =>
                  setPuzzleStates((prev) => ({
                    ...prev,
                    [currentQuestion.id]: {
                      ...currentPuzzleState,
                      assignments: nextAssignments,
                    },
                  }))
                }
                onPickedIso3sChange={(nextPickedIso3s) =>
                  setPuzzleStates((prev) => ({
                    ...prev,
                    [currentQuestion.id]: {
                      ...currentPuzzleState,
                      pickedIso3s: nextPickedIso3s,
                    },
                  }))
                }
              />
            )}

          {/* FEEDBACK BANNER */}
          {showResult && (
            <QuestionFeedbackBanner
              currentQuestion={currentQuestion}
              lastAnswer={answers[answers.length - 1]}
              isAnswered={isAnswered}
              selectedOption={selectedOption}
              userAnswer={userAnswer}
              currentPuzzleState={currentPuzzleState}
              questionStartTime={questionStartTime}
            />
          )}
        </div>
      </div>

      {/* FOOTER FIXE AVEC BOUTONS */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          {!isAnswered ? (
            <button
              onClick={() => handleSubmitAnswer()}
              disabled={isValidateDisabled}
              className="w-full py-3 md:py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center justify-center gap-2"
            >
              <span>{t("playQuiz.validate")}</span>
              <kbd className="hidden sm:inline-flex items-center text-xs bg-emerald-700/60 text-emerald-100 px-2 py-0.5 rounded border border-emerald-500/50 font-sans font-medium">
                {t("playQuiz.keyboard.enter") || "Entrée ↵"}
              </kbd>
            </button>
          ) : (
            <button
              onClick={moveToNextQuestion}
              className="w-full py-3 md:py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg flex items-center justify-center gap-2"
            >
              <span>
                {currentQuestionIndex < questions.length - 1
                  ? t("playQuiz.nextQuestion")
                  : t("playQuiz.finishQuiz")}
              </span>
              <kbd className="hidden sm:inline-flex items-center text-xs bg-blue-700/60 text-blue-100 px-2 py-0.5 rounded border border-blue-500/50 font-sans font-medium">
                {t("playQuiz.keyboard.space") || "Espace ␣"}
              </kbd>
            </button>
          )}
        </div>
      </div>

      <ReportQuestionModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        quizId={quiz.id}
        quizTitle={quiz.title}
        questionId={currentQuestion.id}
        questionIndex={currentQuestionIndex}
        totalQuestions={questions.length}
        questionText={currentQuestion.question_text || currentMapData.countryMultiPrompt || ""}
        questionType={currentQuestion.question_type}
      />
    </div>
  );
}
