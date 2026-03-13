import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { Clock, CheckCircle, XCircle, Trophy, ArrowLeft } from "lucide-react";
import type { Database } from "../../lib/database.types";
import {
  CountryMetric,
  CountryGameEntry,
  getAllCountries,
  getCountriesByIso3,
  getTop10CountriesByMetric,
  pickCountries,
  shuffleSeeded,
} from "../../lib/countryGameData";
import { PuzzleMapQuestion } from "./PuzzleMapQuestion";
import { Top10OrderQuestion } from "./Top10OrderQuestion";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
type Question = Database["public"]["Tables"]["questions"]["Row"];

interface PlayQuizPageProps {
  quizId: string;
  mode?: "solo" | "duel";
  duelId?: string;
  trainingMode?: boolean;
  questionCount?: number;
  onNavigate: (view: string) => void;
}

export function PlayQuizPage({
  quizId,
  mode = "solo",
  duelId,
  trainingMode = false,
  questionCount,
  onNavigate,
}: PlayQuizPageProps) {
  const { profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<
    {
      question_id: string;
      user_answer: string;
      is_correct: boolean;
      time_taken: number;
      points_earned: number;
    }[]
  >([]);
  const [showResult, setShowResult] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [xpGained, setXpGained] = useState(0);
  const [puzzleStates, setPuzzleStates] = useState<
    Record<
      string,
      {
        countries: CountryGameEntry[];
        assignments: Record<string, string>;
        pickedIso3s: string[];
      }
    >
  >({});
  const [top10States, setTop10States] = useState<
    Record<string, { metric: CountryMetric; expected: string[]; order: string[] }>
  >({});
  const isCompletingRef = useRef(false);
  const isCreatingSessionRef = useRef(false);
  const hasTimedOutRef = useRef(false);
  const textInputRef = useRef<HTMLInputElement>(null);
  const allCountries = getAllCountries();
  const countryNameByIso = Object.fromEntries(
    allCountries.map((country) => [country.iso3, country.name])
  ) as Record<string, string>;

  useEffect(() => {
    isCompletingRef.current = false;
    isCreatingSessionRef.current = false;
    loadQuiz();
  }, [quizId]);
  // Détecter quand toutes les questions ont été répondues
  useEffect(() => {
    if (
      answers.length === questions.length &&
      answers.length > 0 &&
      !gameComplete &&
      !isCompletingRef.current
    ) {
      completeGame();
    }
  }, [answers.length, questions.length, gameComplete]);
  useEffect(() => {
    if (
      quiz &&
      questions.length > 0 &&
      !sessionId &&
      !gameComplete &&
      !isCreatingSessionRef.current
    ) {
      isCreatingSessionRef.current = true;
      createSession();
    }
  }, [quiz, questions, gameComplete]);

  const saveAnswer = async (answerData: any) => {
    if (!sessionId) return;

    await supabase.from("game_answers").insert({
      session_id: sessionId,
      question_id: answerData.question_id,
      user_answer: answerData.user_answer,
      is_correct: answerData.is_correct,
      time_taken_seconds: answerData.time_taken,
      points_earned: answerData.points_earned,
    });
  };

  const moveToNextQuestion = () => {
    if (gameComplete) {
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer("");
      setSelectedOption("");
      setShowResult(false);
      setIsAnswered(false);
      setTimeLeft(quiz?.time_limit_seconds || 30);
      setQuestionStartTime(Date.now());
      hasTimedOutRef.current = false;
    }
  };

  const handleTimeout = useCallback(() => {
    if (isAnswered || gameComplete || hasTimedOutRef.current) return;

    hasTimedOutRef.current = true;
    handleSubmitAnswer(undefined, { fromTimeout: true });
  }, [
    isAnswered,
    gameComplete,
    handleSubmitAnswer,
  ]);

  const normalizeAnswer = (answer: string): string => {
    return answer
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const arraysEqual = (a: string[], b: string[]) =>
    a.length === b.length && a.every((value, index) => value === b[index]);

  useEffect(() => {
    if (gameComplete || isAnswered || trainingMode) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    currentQuestionIndex,
    isAnswered,
    gameComplete,
    trainingMode,
    handleTimeout,
  ]);

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

  const loadQuiz = async () => {
    const { data: quizData } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .single();

    if (quizData) {
      setQuiz(quizData);
      setTimeLeft(quizData.time_limit_seconds || 30);

      const { data: questionsData } = await supabase
        .from("questions")
        .select("*")
        .eq("quiz_id", quizId)
        .order("order_index");

      if (questionsData) {
        let processedQuestions = [...questionsData];

        if (trainingMode || quizData.randomize_questions) {
          processedQuestions = processedQuestions.sort(
            () => Math.random() - 0.5
          );
        }
        if (trainingMode && questionCount && questionCount > 0) {
          processedQuestions = processedQuestions.slice(0, questionCount);
        }

        if (quizData.randomize_answers) {
          processedQuestions = processedQuestions.map((q) => ({
            ...q,
            options: q.options
              ? [...q.options].sort(() => Math.random() - 0.5)
              : q.options,
          }));
        }

        const nextPuzzleStates: Record<
          string,
          {
            countries: CountryGameEntry[];
            assignments: Record<string, string>;
            pickedIso3s: string[];
          }
        > = {};
        const nextTop10States: Record<
          string,
          { metric: CountryMetric; expected: string[]; order: string[] }
        > = {};

        for (const question of processedQuestions) {
          if (question.question_type === "puzzle_map") {
            const mapData = (question.map_data || {}) as {
              continent?: string;
              selectedCountries?: string[];
              showTargetList?: boolean;
            };
            const selectedPool = getCountriesByIso3(mapData.selectedCountries || []);
            const countries =
              selectedPool.length > 0
                ? shuffleSeeded(selectedPool, `${quizId}:${question.id}:puzzle`)
                : pickCountries(
                    12,
                    `${quizId}:${question.id}:puzzle`,
                    mapData.continent || "world"
                  );
            nextPuzzleStates[question.id] = {
              countries,
              assignments: Object.fromEntries(
                countries.map((country) => [country.iso3, ""])
              ),
              pickedIso3s: [],
            };
          }

          if (question.question_type === "top10_order") {
            const mapData = (question.map_data || {}) as {
              metric?: CountryMetric;
              continent?: string;
              selectedCountries?: string[];
            };
            const customItems = (Array.isArray(question.options)
              ? question.options
              : []
            )
              .map((item) => String(item).trim())
              .filter(Boolean)
              .slice(0, 10);

            const metric: CountryMetric =
              mapData.metric === "area_km2" ? "area_km2" : "population";
            const selectedPool = getCountriesByIso3(mapData.selectedCountries || []);
            const expected =
              customItems.length > 0
                ? customItems
                : (
                    selectedPool.length > 0
                      ? [...selectedPool]
                          .sort((a, b) => (b[metric] || 0) - (a[metric] || 0))
                          .slice(0, 10)
                      : getTop10CountriesByMetric(
                          metric,
                          mapData.continent || "world"
                        )
                  ).map((country) => country.name);
            let order = shuffleSeeded(expected, `${quizId}:${question.id}:top10`);
            if (arraysEqual(order, expected)) {
              order = [...order].reverse();
            }
            nextTop10States[question.id] = { metric, expected, order };
          }
        }

        setQuestions(processedQuestions);
        setPuzzleStates(nextPuzzleStates);
        setTop10States(nextTop10States);
      }
    }
  };

  const createSession = async () => {
    if (!profile || trainingMode) {
      isCreatingSessionRef.current = false;
      return;
    }

    const { data: session, error } = await supabase
      .from("game_sessions")
      .insert({
        quiz_id: quizId,
        player_id: profile.id,
        mode,
      })
      .select()
      .single();

    if (error) {
      isCreatingSessionRef.current = false;
      return;
    }

    if (session) {
      setSessionId(session.id);
      isCreatingSessionRef.current = false;
    }
  };

  const calculatePoints = (timeTaken: number, basePoints: number): number => {
    const timeLimit = quiz?.time_limit_seconds || 30;
    const speedBonus = Math.max(0, 1 - timeTaken / timeLimit) * 0.5;
    return Math.round(basePoints * (1 + speedBonus));
  };

  // ✅ GESTION DU DOUBLE-CLIC POUR VALIDATION
  const handleAnswerClick = (option: string, event: React.MouseEvent) => {
    if (isAnswered) return;

    setSelectedOption(option);

    // Si double-clic, valider automatiquement
    if (event.detail === 2) {
      setTimeout(() => handleSubmitAnswer(option), 50);
    }
  };

  function handleSubmitAnswer(
    forcedAnswer?: string,
    options?: { fromTimeout?: boolean }
  ) {
    if (isAnswered || gameComplete) return;

    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;
    const currentPuzzleState = puzzleStates[currentQuestion.id];
    const currentTop10State = top10States[currentQuestion.id];
    const fromTimeout = options?.fromTimeout === true;
    const answer =
      forcedAnswer ||
      (currentQuestion.question_type === "mcq" ||
      currentQuestion.question_type === "true_false"
        ? selectedOption
        : userAnswer);

    if (currentQuestion.question_type === "puzzle_map") {
      if (!currentPuzzleState) return;
      const mapData = (currentQuestion.map_data || {}) as {
        showTargetList?: boolean;
      };
      const showTargetList = mapData.showTargetList !== false;
      const totalSlots = currentPuzzleState.countries.length;

      if (showTargetList) {
        const filledSlots = Object.values(currentPuzzleState.assignments).filter(
          (value) => value
        ).length;
        if (!fromTimeout && filledSlots < totalSlots) {
          alert(t("playQuiz.puzzle.completeBeforeValidate"));
          return;
        }

        const exactMatches = currentPuzzleState.countries.filter(
          (country) => currentPuzzleState.assignments[country.iso3] === country.iso3
        ).length;
        const ratio = totalSlots > 0 ? exactMatches / totalSlots : 0;
        const pointsEarned = Math.round(
          calculatePoints(timeTaken, currentQuestion.points) * ratio
        );
        const isCorrect = exactMatches === totalSlots;

        const answerData = {
          question_id: currentQuestion.id,
          user_answer: JSON.stringify({
            type: "puzzle_map",
            assignments: currentPuzzleState.assignments,
            exactMatches,
            totalSlots,
          }),
          is_correct: isCorrect,
          time_taken: timeTaken,
          points_earned: pointsEarned,
        };

        setAnswers((prev) => [...prev, answerData]);
        setTotalScore((prev) => prev + pointsEarned);
        setShowResult(true);
        setIsAnswered(true);
        saveAnswer(answerData);

        if (!trainingMode) {
          setTimeout(() => {
            hasTimedOutRef.current = false;
            moveToNextQuestion();
          }, 1500);
        }
        return;
      }

      const pickedIso3s = Array.from(new Set(currentPuzzleState.pickedIso3s));
      if (!fromTimeout && pickedIso3s.length === 0) {
        alert(t("playQuiz.selectAnswer"));
        return;
      }
      const targetSet = new Set(currentPuzzleState.countries.map((country) => country.iso3));
      const exactMatches = pickedIso3s.filter((iso3) => targetSet.has(iso3)).length;
      const wrongIso3s = pickedIso3s.filter((iso3) => !targetSet.has(iso3));
      const denominator = Math.max(totalSlots, pickedIso3s.length || 0);
      const ratio = denominator > 0 ? exactMatches / denominator : 0;
      const pointsEarned = Math.round(
        calculatePoints(timeTaken, currentQuestion.points) * ratio
      );
      const isCorrect = exactMatches === totalSlots && wrongIso3s.length === 0;

      const answerData = {
        question_id: currentQuestion.id,
        user_answer: JSON.stringify({
          type: "puzzle_map",
          pickedIso3s,
          exactMatches,
          totalSlots,
          wrongIso3s,
        }),
        is_correct: isCorrect,
        time_taken: timeTaken,
        points_earned: pointsEarned,
      };

      setAnswers((prev) => [...prev, answerData]);
      setTotalScore((prev) => prev + pointsEarned);
      setShowResult(true);
      setIsAnswered(true);
      saveAnswer(answerData);

      if (!trainingMode) {
        setTimeout(() => {
          hasTimedOutRef.current = false;
          moveToNextQuestion();
        }, 1500);
      }
      return;
    }

    if (currentQuestion.question_type === "top10_order") {
      if (!currentTop10State) return;
      if (currentTop10State.order.length !== currentTop10State.expected.length) {
        alert(t("playQuiz.top10.invalidOrder"));
        return;
      }

      const exactMatches = currentTop10State.order.filter(
        (country, index) => country === currentTop10State.expected[index]
      ).length;
      const total = currentTop10State.expected.length;
      const ratio = total > 0 ? exactMatches / total : 0;
      const pointsEarned = Math.round(
        calculatePoints(timeTaken, currentQuestion.points) * ratio
      );
      const isCorrect = exactMatches === total;

      const answerData = {
        question_id: currentQuestion.id,
        user_answer: JSON.stringify({
          type: "top10_order",
          order: currentTop10State.order,
          expected: currentTop10State.expected,
          exactMatches,
          total,
        }),
        is_correct: isCorrect,
        time_taken: timeTaken,
        points_earned: pointsEarned,
      };

      setAnswers((prev) => [...prev, answerData]);
      setTotalScore((prev) => prev + pointsEarned);
      setShowResult(true);
      setIsAnswered(true);
      saveAnswer(answerData);

      if (!trainingMode) {
        setTimeout(() => {
          hasTimedOutRef.current = false;
          moveToNextQuestion();
        }, 1500);
      }
      return;
    }

    if (!answer.trim()) {
      alert(t("playQuiz.selectAnswer"));
      return;
    }

    const correctAnswers =
      currentQuestion.correct_answers &&
      currentQuestion.correct_answers.length > 0
        ? [currentQuestion.correct_answer, ...currentQuestion.correct_answers]
        : [currentQuestion.correct_answer];

    const isCorrect = correctAnswers.some(
      (ca) => normalizeAnswer(answer) === normalizeAnswer(ca)
    );

    const pointsEarned = isCorrect
      ? calculatePoints(timeTaken, currentQuestion.points)
      : 0;

    const answerData = {
      question_id: currentQuestion.id,
      user_answer: answer,
      is_correct: isCorrect,
      time_taken: timeTaken,
      points_earned: pointsEarned,
    };
    setAnswers((prev) => [...prev, answerData]);
    setTotalScore((prev) => prev + pointsEarned);
    setShowResult(true);
    setIsAnswered(true);

    saveAnswer(answerData);

    if (!trainingMode) {
      setTimeout(() => {
        hasTimedOutRef.current = false;
        moveToNextQuestion();
      }, 1500);
    }
  }

  const completeGame = async () => {
    if (gameComplete || isCompletingRef.current) {
      return;
    }

    isCompletingRef.current = true;
    setGameComplete(true);

    if (trainingMode) return;
    if (!sessionId || !profile) return;

    const correctAnswers = answers.filter((a) => a.is_correct).length;
    const accuracy = (correctAnswers / questions.length) * 100;
    const totalTime = answers.reduce((sum, a) => sum + a.time_taken, 0);

    const normalizedScore = Math.min(
      100,
      Math.round((totalScore / (questions.length * 150)) * 100)
    );

    const { error } = await supabase
      .from("game_sessions")
      .update({
        score: normalizedScore,
        accuracy_percentage: accuracy,
        time_taken_seconds: totalTime,
        completed: true,
        completed_at: new Date().toISOString(),
        correct_answers: correctAnswers,
        total_questions: questions.length,
      })
      .eq("id", sessionId);

    if (mode === "duel" && duelId) {
      await updateDuel();
    }

    const shouldGiveXP = (quiz?.is_public || quiz?.is_global) && !trainingMode;
    let earnedXP = 0;

    if (shouldGiveXP) {
      earnedXP = Math.round(normalizedScore / 10);
      setXpGained(earnedXP);
      const newXP = profile.experience_points + earnedXP;
      const newLevel = Math.floor(newXP / 100) + 1;

      const currentMonth = new Date().toISOString().slice(0, 7);
      const needsReset = profile.last_reset_month !== currentMonth;

      await supabase
        .from("profiles")
        .update({
          experience_points: newXP,
          level: newLevel,
          monthly_score: needsReset
            ? normalizedScore
            : (profile.monthly_score || 0) + normalizedScore,
          monthly_games_played: needsReset
            ? 1
            : (profile.monthly_games_played || 0) + 1,
          last_reset_month: currentMonth,
        })
        .eq("id", profile.id);

      if (needsReset && profile.last_reset_month) {
        await recordMonthlyRanking(profile.last_reset_month);
      }
    } else {
      setXpGained(0);
    }

    // Quiz stats are updated server-side by DB trigger when session becomes completed.

    if (shouldGiveXP) {
      await checkAndAwardBadges(profile.level);
    }
    await refreshProfile();
  };

  const updateDuel = async () => {
    if (!duelId || !sessionId || !profile) return;

    const { data: duel } = await supabase
      .from("duels")
      .select("*")
      .eq("id", duelId)
      .single();

    if (!duel) return;

    const isPlayer1 = duel.player1_id === profile.id;
    const updateField = isPlayer1 ? "player1_session_id" : "player2_session_id";
    const otherPlayerSessionField = isPlayer1
      ? "player2_session_id"
      : "player1_session_id";

    const updates: any = { [updateField]: sessionId };

    if (duel[otherPlayerSessionField]) {
      const { data: otherSession } = await supabase
        .from("game_sessions")
        .select("score")
        .eq("id", duel[otherPlayerSessionField])
        .single();

      const { data: mySession } = await supabase
        .from("game_sessions")
        .select("score")
        .eq("id", sessionId)
        .single();

      if (otherSession && mySession) {
        let winnerId = null;
        if (mySession.score > otherSession.score) {
          winnerId = profile.id;
        } else if (otherSession.score > mySession.score) {
          winnerId = isPlayer1 ? duel.player2_id : duel.player1_id;
        }

        updates.status = "completed";
        updates.winner_id = winnerId;
        updates.completed_at = new Date().toISOString();
      }
    }

    await supabase.from("duels").update(updates).eq("id", duelId);
  };

  const recordMonthlyRanking = async (lastMonth: string) => {
    const { data: topPlayers } = await supabase
      .from("profiles")
      .select("id, pseudo, monthly_score, top_10_count")
      .order("monthly_score", { ascending: false })
      .limit(10);

    if (topPlayers && topPlayers.length > 0) {
      for (let i = 0; i < topPlayers.length; i++) {
        const player = topPlayers[i];

        await supabase.from("monthly_rankings_history").upsert({
          user_id: player.id,
          month: lastMonth,
          final_rank: i + 1,
          final_score: player.monthly_score || 0,
        });

        await supabase
          .from("profiles")
          .update({
            top_10_count: (player.top_10_count || 0) + 1,
          })
          .eq("id", player.id);
      }
    }
  };

  const checkAndAwardBadges = async (level: number) => {
    if (!profile) return;

    const { data: badges } = await supabase
      .from("badges")
      .select("*")
      .eq("requirement_type", "level")
      .lte("requirement_value", level);

    if (badges) {
      for (const badge of badges) {
        const { data: existing } = await supabase
          .from("user_badges")
          .select("id")
          .eq("user_id", profile.id)
          .eq("badge_id", badge.id)
          .maybeSingle();

        if (!existing) {
          await supabase.from("user_badges").insert({
            user_id: profile.id,
            badge_id: badge.id,
          });
        }
      }
    }
  };

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
    const correctAnswers = answers.filter((a) => a.is_correct).length;
    const accuracy = (correctAnswers / questions.length) * 100;

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

              {/* ✅ GRILLE RESPONSIVE STATS */}
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
                      <p className="text-2xl md:text-4xl font-bold">
                        {totalScore}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 md:p-6 text-white text-center">
                      <p className="text-purple-100 text-xs sm:text-sm mb-2">
                        {t("playQuiz.xpGained")}
                      </p>
                      <p className="text-2xl md:text-4xl font-bold">
                        +{xpGained}
                      </p>
                    </div>
                  </>
                )}

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 md:p-6 text-white text-center">
                  <p className="text-blue-100 text-xs sm:text-sm mb-2">
                    {t("playQuiz.accuracy")}
                  </p>
                  <p className="text-2xl md:text-4xl font-bold">
                    {Math.round(accuracy)}%
                  </p>
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
                    if (
                      question.question_type === "puzzle_map" &&
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

                    const isCorrectAnswer =
                      answer?.is_correct ||
                      (answer?.user_answer &&
                        (question.correct_answers &&
                        question.correct_answers.length > 0
                          ? question.correct_answers.some(
                              (ca) =>
                                normalizeAnswer(answer.user_answer) ===
                                normalizeAnswer(ca)
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
                                {question.question_type === "puzzle_map"
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
                                  : answer?.user_answer || t("playQuiz.noAnswer")}
                              </span>
                            </p>
                            <p className="text-sm text-gray-600">
                              {t("playQuiz.correctAnswer")}:{" "}
                              <span className="font-medium text-emerald-600">
                                {question.question_type === "puzzle_map"
                                  ? t("playQuiz.puzzle.expectedCountries")
                                  : question.question_type === "top10_order"
                                  ? t("playQuiz.top10.exactOrder")
                                  : question.correct_answer}
                              </span>
                            </p>
                            {question.question_type === "puzzle_map" && puzzleState && (
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
                            {question.question_type === "puzzle_map" &&
                              parsedPuzzle?.assignments &&
                              puzzleState && (
                                <div className="mt-3 bg-white border border-gray-200 rounded p-2">
                                  <p className="text-xs font-semibold text-gray-700 mb-2">
                                    {t("playQuiz.puzzle.placementsByCountry")}
                                  </p>
                                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                                    {puzzleState.countries.map((country) => {
                                      const placedIso =
                                        parsedPuzzle?.assignments?.[country.iso3] || "";
                                      const placedName =
                                        puzzleState.countries.find(
                                          (entry) => entry.iso3 === placedIso
                                        )?.name || t("playQuiz.puzzle.notPlaced");
                                      const isCorrect = placedIso === country.iso3;
                                      return (
                                        <div
                                          key={`puzzle-summary-${question.id}-${country.iso3}`}
                                          className={`text-xs rounded px-2 py-1 ${
                                            isCorrect
                                              ? "bg-emerald-50 text-emerald-700"
                                              : "bg-red-50 text-red-700"
                                          }`}
                                        >
                                          {country.name} {"->"} {placedName}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            {question.question_type === "puzzle_map" &&
                              parsedPuzzle?.pickedIso3s &&
                              parsedPuzzle.pickedIso3s.length > 0 && (
                                <div className="mt-3 bg-white border border-gray-200 rounded p-2">
                                  <p className="text-xs font-semibold text-gray-700 mb-2">
                                    {t("playQuiz.puzzle.selectedCountries")}
                                  </p>
                                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                                    {parsedPuzzle.pickedIso3s.map((iso3) => {
                                      const isWrong =
                                        parsedPuzzle?.wrongIso3s?.includes(iso3) || false;
                                      return (
                                        <div
                                          key={`picked-summary-${question.id}-${iso3}`}
                                          className={`text-xs rounded px-2 py-1 ${
                                            isWrong
                                              ? "bg-red-50 text-red-700"
                                              : "bg-emerald-50 text-emerald-700"
                                          }`}
                                        >
                                          {countryNameByIso[iso3] || iso3}
                                        </div>
                                      );
                                    })}
                                  </div>
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

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => onNavigate("quizzes")}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  {t("playQuiz.exploreOtherQuizzes")}
                </button>
                {mode === "duel" ? (
                  <button
                    onClick={() => onNavigate("duels")}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {t("duels.viewResults")}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onNavigate("play-quiz", {
                        quizId,
                        resetKey: Date.now(),
                      });
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
  }

  if (currentQuestionIndex >= questions.length && !gameComplete) {
    completeGame();
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentPuzzleState = currentQuestion
    ? puzzleStates[currentQuestion.id]
    : undefined;
  const currentTop10State = currentQuestion
    ? top10States[currentQuestion.id]
    : undefined;

  if (!currentQuestion) {
    return null;
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* HEADER FIXE AVEC PROGRESSION */}
      <div className="bg-white shadow-sm px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => {
                if (confirm(t("playQuiz.confirmQuit"))) {
                  onNavigate("quizzes");
                }
              }}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">{t("playQuiz.quit")}</span>
            </button>

            <div className="flex items-center space-x-2 md:space-x-4">
              {!trainingMode && (
                <>
                  <div className="flex items-center space-x-2 px-3 py-2 bg-blue-100 rounded-lg">
                    <Trophy className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                    <span className="font-bold text-blue-600 text-sm md:text-base">
                      {totalScore}
                    </span>
                  </div>
                  <div
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                      timeLeft <= 5 ? "bg-red-100" : "bg-gray-100"
                    }`}
                  >
                    <Clock
                      className={`w-4 h-4 md:w-5 md:h-5 ${
                        timeLeft <= 5 ? "text-red-600" : "text-gray-600"
                      }`}
                    />
                    <span
                      className={`font-bold text-sm md:text-base ${
                        timeLeft <= 5 ? "text-red-600" : "text-gray-600"
                      }`}
                    >
                      {timeLeft}s
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-between text-xs md:text-sm text-gray-600 mb-2">
            <span>
              {t("playQuiz.question")} {currentQuestionIndex + 1} /{" "}
              {questions.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

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
            <p className="text-sm text-gray-500 mb-2">{quiz.title}</p>
            <h3 className="text-xl md:text-2xl font-bold text-gray-800">
              {currentQuestion.question_text}
            </h3>
            {(currentQuestion.question_type === "puzzle_map" ||
              currentQuestion.question_type === "top10_order") && (
              <p className="mt-2 text-sm text-gray-600 bg-gray-100 border border-gray-200 rounded px-3 py-2">
                {currentQuestion.question_type === "puzzle_map"
                  ? "Objectif: place chaque élément au bon endroit, puis valide."
                  : "Objectif: réorganise les éléments dans le bon ordre avec le drag-and-drop, puis valide."}
              </p>
            )}
          </div>

          {currentQuestion.question_type === "mcq" &&
            currentQuestion.options && (
              <div className="grid grid-cols-2 gap-3">
                {(Array.isArray(currentQuestion.options)
                  ? currentQuestion.options
                  : []
                ).map((option: string, index: number) => {
                  const optionImages = currentQuestion.option_images as Record<
                    string,
                    string
                  > | null;
                  const imageUrl = optionImages?.[option];

                  return (
                    <button
                      key={index}
                      onClick={(e) => handleAnswerClick(option, e)}
                      disabled={isAnswered}
                      className={`p-2 md:p-4 rounded-lg border-2 transition-all text-left ${
                        isAnswered &&
                        (currentQuestion.correct_answers &&
                        currentQuestion.correct_answers.length > 0
                          ? currentQuestion.correct_answers.includes(option)
                          : option === currentQuestion.correct_answer)
                          ? "border-green-500 bg-green-50"
                          : isAnswered &&
                            option === selectedOption &&
                            !(currentQuestion.correct_answers &&
                            currentQuestion.correct_answers.length > 0
                              ? currentQuestion.correct_answers.includes(option)
                              : option === currentQuestion.correct_answer)
                          ? "border-red-500 bg-red-50"
                          : selectedOption === option
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-emerald-300"
                      } ${
                        isAnswered ? "cursor-not-allowed" : "cursor-pointer"
                      }`}
                    >
                      {imageUrl && (
                        <div className="mb-3 flex justify-center">
                          <img
                            src={imageUrl}
                            alt={option}
                            className="max-w-full h-20 md:h-40 rounded object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                      <span className="font-medium text-center block text-sm md:text-base">
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

          {/* VRAI/FAUX */}
          {currentQuestion.question_type === "true_false" && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={(e) =>
                  handleAnswerClick(
                    currentQuestion.correct_answer ===
                      t("createQuiz.trueFalse.true")
                      ? t("createQuiz.trueFalse.true")
                      : "Vrai",
                    e
                  )
                }
                disabled={isAnswered}
                className={`p-6 rounded-lg border-2 transition-all font-bold text-lg ${
                  isAnswered &&
                  (currentQuestion.correct_answer ===
                    t("createQuiz.trueFalse.true") ||
                    currentQuestion.correct_answer === "Vrai")
                    ? "border-green-500 bg-green-50 text-green-700"
                    : isAnswered &&
                      selectedOption === t("createQuiz.trueFalse.true") &&
                      currentQuestion.correct_answer !==
                        t("createQuiz.trueFalse.true")
                    ? "border-red-500 bg-red-50 text-red-700"
                    : selectedOption === t("createQuiz.trueFalse.true")
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 hover:border-emerald-300"
                } ${isAnswered ? "cursor-not-allowed" : "cursor-pointer"}`}
              >
                ✓ {t("createQuiz.trueFalse.true")}
              </button>
              <button
                onClick={(e) =>
                  handleAnswerClick(
                    currentQuestion.correct_answer ===
                      t("createQuiz.trueFalse.false")
                      ? t("createQuiz.trueFalse.false")
                      : "Faux",
                    e
                  )
                }
                disabled={isAnswered}
                className={`p-6 rounded-lg border-2 transition-all font-bold text-lg ${
                  isAnswered &&
                  (currentQuestion.correct_answer ===
                    t("createQuiz.trueFalse.false") ||
                    currentQuestion.correct_answer === "Faux")
                    ? "border-green-500 bg-green-50 text-green-700"
                    : isAnswered &&
                      selectedOption === t("createQuiz.trueFalse.false") &&
                      currentQuestion.correct_answer !==
                        t("createQuiz.trueFalse.false")
                    ? "border-red-500 bg-red-50 text-red-700"
                    : selectedOption === t("createQuiz.trueFalse.false")
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 hover:border-emerald-300"
                } ${isAnswered ? "cursor-not-allowed" : "cursor-pointer"}`}
              >
                ✗ {t("createQuiz.trueFalse.false")}
              </button>
            </div>
          )}

          {/* RÉPONSE TEXTE */}
          {(currentQuestion.question_type === "single_answer" ||
            currentQuestion.question_type === "text_free") && (
            <input
              ref={textInputRef}
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !isAnswered && handleSubmitAnswer()
              }
              autoFocus
              disabled={isAnswered}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none disabled:bg-gray-100"
              placeholder={t("playQuiz.enterAnswer")}
            />
          )}

          {currentQuestion.question_type === "puzzle_map" && currentPuzzleState && (
            <PuzzleMapQuestion
              countries={currentPuzzleState.countries}
              showTargetList={
                ((currentQuestion.map_data as any)?.showTargetList ?? true) !== false
              }
              revealResult={showResult || isAnswered}
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

          {/* MAP CLICK */}
          {currentQuestion.question_type === "map_click" && (
            <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <p className="text-gray-600">{t("playQuiz.mapClickComing")}</p>
            </div>
          )}

          {/* FEEDBACK */}
          {showResult && (
            <div
              className={`mt-6 p-4 rounded-lg ${
                answers[answers.length - 1]?.is_correct ||
                (isAnswered &&
                  (currentQuestion.question_type === "mcq" ||
                  currentQuestion.question_type === "true_false"
                    ? normalizeAnswer(selectedOption) ===
                      normalizeAnswer(currentQuestion.correct_answer)
                    : [
                        currentQuestion.correct_answer,
                        ...(currentQuestion.correct_answers || []),
                      ].some(
                        (ca) =>
                          normalizeAnswer(userAnswer) === normalizeAnswer(ca)
                      )))
                  ? "bg-green-50 border-2 border-green-300"
                  : "bg-red-50 border-2 border-red-300"
              }`}
            >
              <div className="flex items-center space-x-3">
                {answers[answers.length - 1]?.is_correct ||
                (isAnswered &&
                  (currentQuestion.question_type === "mcq" ||
                  currentQuestion.question_type === "true_false"
                    ? normalizeAnswer(selectedOption) ===
                      normalizeAnswer(currentQuestion.correct_answer)
                    : [
                        currentQuestion.correct_answer,
                        ...(currentQuestion.correct_answers || []),
                      ].some(
                        (ca) =>
                          normalizeAnswer(userAnswer) === normalizeAnswer(ca)
                      ))) ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-bold text-green-800">
                        {t("playQuiz.correct")}
                      </p>
                      <p className="text-sm text-green-700">
                        +
                        {answers[answers.length - 1]?.points_earned ||
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
                      <p className="font-bold text-red-800">
                        {t("playQuiz.incorrect")}
                      </p>
                      <p className="text-sm text-red-700">
                        {t("playQuiz.correctAnswerWas")}:{" "}
                        {currentQuestion.question_type === "puzzle_map"
                          ? t("playQuiz.puzzle.expectedCountries")
                          : currentQuestion.question_type === "top10_order"
                          ? t("playQuiz.top10.exactOrder")
                          : currentQuestion.correct_answer}
                        {currentQuestion.question_type !== "puzzle_map" &&
                          currentQuestion.question_type !== "top10_order" &&
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
            </div>
          )}
        </div>
      </div>

      {/* ✅ FOOTER FIXE AVEC BOUTONS */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          {!isAnswered ? (
            <button
              onClick={() => handleSubmitAnswer()}
              disabled={
                currentQuestion.question_type === "mcq" ||
                currentQuestion.question_type === "true_false"
                  ? !selectedOption
                  : currentQuestion.question_type === "puzzle_map"
                  ? !currentPuzzleState ||
                    (((currentQuestion.map_data as any)?.showTargetList ?? true) !==
                    false
                      ? Object.values(currentPuzzleState.assignments).some(
                          (value) => !value
                        )
                      : currentPuzzleState.pickedIso3s.length === 0)
                  : currentQuestion.question_type === "top10_order"
                  ? !currentTop10State ||
                    currentTop10State.order.length !==
                      currentTop10State.expected.length ||
                    currentTop10State.expected.length < 2
                  : !userAnswer.trim()
              }
              className="w-full py-3 md:py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {t("playQuiz.validate")}
            </button>
          ) : (
            trainingMode && (
              <>
                {currentQuestion.complement_if_wrong && (
                  <div className="my-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded shadow">
                    <strong>{t("playQuiz.explanation")} :</strong>
                    <p>{currentQuestion.complement_if_wrong}</p>
                  </div>
                )}

                <button
                  onClick={moveToNextQuestion}
                  className="w-full py-3 md:py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
                >
                  {currentQuestionIndex < questions.length - 1
                    ? t("playQuiz.nextQuestion")
                    : t("playQuiz.finishQuiz")}
                </button>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}
