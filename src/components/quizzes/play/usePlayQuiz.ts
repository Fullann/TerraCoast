import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useNotifications } from "../../../contexts/NotificationContext";
import type {
  Quiz,
  Question,
  QuizAnswer,
  PuzzleState,
  Top10State,
  CountryMultiInputRow,
  QuizChallenge,
  PendingSessionPayload,
} from "./types";
import {
  normalizeAnswer,
  matchesWithTolerance,
  calculatePoints,
  arraysEqual,
} from "./utils";
import {
  CountryGameEntry,
  CountryMetric,
  getAllCountries,
  getCountriesByIso3,
  getCountryNameVariantsByIso3,
  getCountryCapitalVariantsByIso3,
  getTop10CountriesByMetric,
  pickCountries,
  shuffleSeeded,
} from "../../../lib/countryGameData";
import {
  getSubdivisions,
  getSubdivisionsByIds,
  type SubdivisionGameEntry,
  type SubdivisionScope,
} from "../../../lib/subdivisionGameData";
import {
  countryEntriesFromGeoJson,
  fetchGeoJsonFeatureCollection,
  presetFromRowPreset,
  type CustomGeoJsonMapRow,
} from "../../../lib/customGeojsonMaps";

interface UsePlayQuizOptions {
  quizId: string;
  mode: "solo" | "duel";
  duelId?: string;
  challengeId?: string;
  trainingMode: boolean;
  questionCount?: number;
}

export function usePlayQuiz({
  quizId,
  mode,
  duelId,
  challengeId,
  trainingMode,
  questionCount,
}: UsePlayQuizOptions) {
  const { profile, refreshProfile } = useAuth();
  const { t, language } = useLanguage();
  const { showAppNotification } = useNotifications();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<QuizChallenge | null>(null);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [xpGained, setXpGained] = useState(0);
  const [isOfflinePendingSync, setIsOfflinePendingSync] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const pendingSessionPayloadRef = useRef<PendingSessionPayload | null>(null);

  const [puzzleStates, setPuzzleStates] = useState<Record<string, PuzzleState>>({});
  const [top10States, setTop10States] = useState<Record<string, Top10State>>({});
  const [countryMultiInputs, setCountryMultiInputs] = useState<
    Record<string, Record<string, CountryMultiInputRow>>
  >({});
  const [consumedPuzzleIso3s, setConsumedPuzzleIso3s] = useState<string[]>([]);

  const isCompletingRef = useRef(false);
  const isCreatingSessionRef = useRef(false);
  const hasTimedOutRef = useRef(false);
  const allCountries = getAllCountries();

  const toCountryEntry = (entry: SubdivisionGameEntry): CountryGameEntry => ({
    iso3: entry.iso3,
    name: entry.name,
    capital: "",
    flagEmoji: "",
    lat: entry.lat ?? 0,
    lng: entry.lng ?? 0,
    numericCode: 0,
    continent: "world",
    population: 0,
    area_km2: 0,
  });

  const firstMcqQuestionIndex = useMemo(
    () => questions.findIndex((q) => q.question_type === "mcq"),
    [questions]
  );

  const getPostAnswerDelayMs = (question: Question, _isCorrect?: boolean) => {
    if (trainingMode) return 0;
    return (question.complement_if_wrong || "").trim() ? 5000 : 1500;
  };

  const createSession = useCallback(async () => {
    if (trainingMode) {
      isCreatingSessionRef.current = false;
      return;
    }

    const currentUserId =
      profile?.id || (await supabase.auth.getUser()).data.user?.id || null;
    if (!currentUserId) {
      isCreatingSessionRef.current = false;
      return;
    }

    const { data: session, error } = await supabase
      .from("game_sessions")
      .insert({
        quiz_id: quizId,
        player_id: currentUserId,
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
  }, [trainingMode, profile?.id, quizId, mode]);

  const loadQuiz = useCallback(async () => {
    if (!quizId) return;

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
          processedQuestions = processedQuestions.sort(() => Math.random() - 0.5);
        }
        if (trainingMode && questionCount && questionCount > 0) {
          processedQuestions = processedQuestions.slice(0, questionCount);
        }

        if (quizData.randomize_answers) {
          processedQuestions = processedQuestions.map((q) => ({
            ...q,
            options: Array.isArray(q.options)
              ? [...(q.options as string[])].sort(() => Math.random() - 0.5)
              : q.options,
          }));
        }

        const nextPuzzleStates: Record<string, PuzzleState> = {};
        const nextTop10States: Record<string, Top10State> = {};
        const nextCountryMultiInputs: Record<
          string,
          Record<string, CountryMultiInputRow>
        > = {};

        const customMapIds = [
          ...new Set(
            processedQuestions
              .filter(
                (q) =>
                  q.question_type === "puzzle_map" ||
                  q.question_type === "map_click"
              )
              .map((q) => {
                const m = (q.map_data || {}) as {
                  mapLevel?: string;
                  customGeojsonMapId?: string;
                };
                return m.mapLevel === "custom_geojson" && m.customGeojsonMapId
                  ? m.customGeojsonMapId
                  : null;
              })
              .filter((id): id is string => Boolean(id))
          ),
        ];

        const customMapsMeta: Record<string, CustomGeoJsonMapRow> = {};
        if (customMapIds.length > 0) {
          const { data: mapRows } = await supabase
            .from("geojson_custom_maps")
            .select("*")
            .in("id", customMapIds)
            .eq("status", "approved");
          for (const row of mapRows || []) {
            customMapsMeta[row.id] = row as CustomGeoJsonMapRow;
          }
        }

        const customFcCache = new Map<
          string,
          Awaited<ReturnType<typeof fetchGeoJsonFeatureCollection>>
        >();

        const getCustomFc = async (
          mapId: string,
          fallbackUrl?: string
        ): Promise<Awaited<ReturnType<typeof fetchGeoJsonFeatureCollection>>> => {
          if (customFcCache.has(mapId)) {
            return customFcCache.get(mapId)!;
          }
          const meta = customMapsMeta[mapId];
          const url = meta?.public_url || fallbackUrl;
          if (!url) {
            customFcCache.set(mapId, null);
            return null;
          }
          const fc = await fetchGeoJsonFeatureCollection(url);
          customFcCache.set(mapId, fc);
          return fc;
        };

        for (const question of processedQuestions) {
          if (question.question_type === "puzzle_map") {
            const mapData = (question.map_data || {}) as {
              continent?: string;
              selectedCountries?: string[];
              showTargetList?: boolean;
              mapLevel?: "countries" | "subdivisions" | "custom_geojson";
              subdivisionScope?: SubdivisionScope;
              customGeojsonMapId?: string;
              customGeojsonPublicUrl?: string;
              customGeojsonIdProperty?: string;
            };

            if (mapData.mapLevel === "custom_geojson" && mapData.customGeojsonMapId) {
              const meta = customMapsMeta[mapData.customGeojsonMapId];
              const rowPreset = presetFromRowPreset(meta?.preset);
              const idProp =
                rowPreset.idProperty ||
                mapData.customGeojsonIdProperty ||
                "tc_id";
              const featureLabels = rowPreset.featureLabels;
              const fc = await getCustomFc(
                mapData.customGeojsonMapId,
                mapData.customGeojsonPublicUrl
              );
              if (fc && fc.features.length > 0) {
                const selectedRaw = mapData.selectedCountries || [];
                const selected = selectedRaw.map((s) =>
                  String(s).trim().toUpperCase()
                );
                const selectedPool = countryEntriesFromGeoJson(
                  fc,
                  selected,
                  idProp,
                  featureLabels
                );
                const countries =
                  selectedPool.length > 0
                    ? shuffleSeeded(
                        selectedPool,
                        `${quizId}:${question.id}:puzzle`
                      )
                    : [];
                if (countries.length > 0) {
                  nextPuzzleStates[question.id] = {
                    countries,
                    assignments: Object.fromEntries(
                      countries.map((country) => [country.iso3, ""])
                    ),
                    pickedIso3s: [],
                  };
                }
              }
            } else {
              const subdivisionScope =
                mapData.mapLevel === "subdivisions" && mapData.subdivisionScope
                  ? mapData.subdivisionScope
                  : null;
              const selectedPool = subdivisionScope
                ? getSubdivisionsByIds(
                    subdivisionScope,
                    mapData.selectedCountries || []
                  ).map(toCountryEntry)
                : getCountriesByIso3(mapData.selectedCountries || []);
              const subdivisionFallback = subdivisionScope
                ? getSubdivisions(subdivisionScope).map(toCountryEntry)
                : [];
              const countries =
                selectedPool.length > 0
                  ? shuffleSeeded(selectedPool, `${quizId}:${question.id}:puzzle`)
                  : subdivisionScope
                  ? shuffleSeeded(
                      subdivisionFallback,
                      `${quizId}:${question.id}:puzzle`
                    ).slice(0, 12)
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
          }

          if (question.question_type === "map_click") {
            const mapData = (question.map_data || {}) as {
              selectedCountries?: string[];
              mapLevel?: "countries" | "subdivisions" | "custom_geojson";
              subdivisionScope?: SubdivisionScope;
              customGeojsonMapId?: string;
              customGeojsonPublicUrl?: string;
              customGeojsonIdProperty?: string;
            };

            if (mapData.mapLevel === "custom_geojson" && mapData.customGeojsonMapId) {
              const meta = customMapsMeta[mapData.customGeojsonMapId];
              const rowPreset = presetFromRowPreset(meta?.preset);
              const idProp =
                rowPreset.idProperty ||
                mapData.customGeojsonIdProperty ||
                "tc_id";
              const featureLabels = rowPreset.featureLabels;
              const fc = await getCustomFc(
                mapData.customGeojsonMapId,
                mapData.customGeojsonPublicUrl
              );
              if (fc && fc.features.length > 0) {
                const selectedRaw = mapData.selectedCountries || [];
                const selected = selectedRaw.map((s) =>
                  String(s).trim().toUpperCase()
                );
                const pool = countryEntriesFromGeoJson(
                  fc,
                  selected,
                  idProp,
                  featureLabels
                );
                if (pool.length > 0) {
                  const countries = shuffleSeeded(
                    pool,
                    `${quizId}:${question.id}:mapclick`
                  );
                  nextPuzzleStates[question.id] = {
                    countries,
                    assignments: Object.fromEntries(
                      countries.map((country) => [country.iso3, ""])
                    ),
                    pickedIso3s: [],
                  };
                }
              }
            } else {
              const subdivisionScope =
                mapData.mapLevel === "subdivisions" && mapData.subdivisionScope
                  ? mapData.subdivisionScope
                  : null;
              const selectedRaw = mapData.selectedCountries || [];
              const selected = selectedRaw.map((s) => String(s).toUpperCase());
              let pool: CountryGameEntry[] = [];

              const matchByCorrectName = () => {
                const raw = (question.correct_answer || "").trim();
                if (!raw) return;
                const n = normalizeAnswer(raw);
                if (subdivisionScope) {
                  const sub = getSubdivisions(subdivisionScope).find(
                    (s) => normalizeAnswer(s.name) === n
                  );
                  if (sub) pool = [toCountryEntry(sub)];
                  return;
                }
                const c = allCountries.find((x) => normalizeAnswer(x.name) === n);
                if (c) pool = [c];
              };

              if (subdivisionScope) {
                pool = getSubdivisionsByIds(subdivisionScope, selected).map(
                  toCountryEntry
                );
                if (pool.length === 0) matchByCorrectName();
              } else {
                pool = getCountriesByIso3(selected);
                if (pool.length === 0) matchByCorrectName();
              }

              if (pool.length > 0) {
                const countries = shuffleSeeded(
                  pool,
                  `${quizId}:${question.id}:mapclick`
                );
                nextPuzzleStates[question.id] = {
                  countries,
                  assignments: Object.fromEntries(
                    countries.map((country) => [country.iso3, ""])
                  ),
                  pickedIso3s: [],
                };
              }
            }
          }

          if (question.question_type === "country_multi") {
            const mapData = (question.map_data || {}) as {
              selectedCountries?: string[];
              requiredFields?: ("name" | "capital" | "map_click")[];
            };
            const selected = getCountriesByIso3(mapData.selectedCountries || []);
            nextCountryMultiInputs[question.id] = Object.fromEntries(
              selected.map((country) => [
                country.iso3,
                { countryName: "", capital: "" },
              ])
            );
            const requiredFields = mapData.requiredFields || [];
            if (requiredFields.includes("map_click")) {
              const countries = selected;
              if (countries.length > 0) {
                nextPuzzleStates[question.id] = {
                  countries,
                  assignments: Object.fromEntries(
                    countries.map((country) => [country.iso3, ""])
                  ),
                  pickedIso3s: [],
                };
              }
            }
          }

          if (question.question_type === "top10_order") {
            const mapData = (question.map_data || {}) as {
              metric?: CountryMetric;
              continent?: string;
              selectedCountries?: string[];
            };
            const customItems = (
              Array.isArray(question.options) ? question.options : []
            )
              .map((item) => String(item).trim())
              .filter(Boolean);

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
        setCountryMultiInputs(nextCountryMultiInputs);
        setConsumedPuzzleIso3s([]);
      }
    }
  }, [quizId, trainingMode, questionCount]);

  useEffect(() => {
    isCompletingRef.current = false;
    isCreatingSessionRef.current = false;
    loadQuiz();
  }, [quizId, loadQuiz]);

  useEffect(() => {
    if (!challengeId || trainingMode) {
      setChallenge(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("quiz_score_challenges")
        .select(
          "*, from_profile:profiles!quiz_score_challenges_from_user_id_fkey(pseudo)"
        )
        .eq("id", challengeId)
        .single();
      if (cancelled) return;
      if (error) {
        console.error("Failed to load challenge:", error);
        setChallenge(null);
        return;
      }
      setChallenge(data as any);
    })();
    return () => {
      cancelled = true;
    };
  }, [challengeId, trainingMode]);

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
  }, [quiz, questions, sessionId, gameComplete, createSession]);

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

  const moveToNextQuestion = useCallback(() => {
    if (gameComplete) return;

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setUserAnswer("");
      setSelectedOption("");
      setShowResult(false);
      setIsAnswered(false);
      setTimeLeft(quiz?.time_limit_seconds || 30);
      setQuestionStartTime(Date.now());
      hasTimedOutRef.current = false;
      return;
    }

    if (trainingMode) {
      setGameComplete(true);
    }
  }, [gameComplete, currentQuestionIndex, questions.length, quiz?.time_limit_seconds, trainingMode]);

  const updateDuel = useCallback(async () => {
    if (!duelId || !sessionId) return;
    const { error } = await supabase.rpc("link_duel_session_and_finalize", {
      p_duel_id: duelId,
      p_session_id: sessionId,
    });
    if (error) {
      console.error("Error linking duel session atomically:", error);
    }
  }, [duelId, sessionId]);

  const completeGame = useCallback(async () => {
    if (gameComplete || isCompletingRef.current) return;

    if (trainingMode) return;
    if (!sessionId) {
      setTimeout(() => {
        completeGame();
      }, 300);
      return;
    }

    isCompletingRef.current = true;
    setGameComplete(true);

    const correctAnswers = answers.filter((a) => a.is_correct).length;
    const accuracy = questions.length > 0 ? (correctAnswers / questions.length) * 100 : 0;
    const totalTime = answers.reduce((sum, a) => sum + a.time_taken, 0);

    const normalizedScore = Math.min(
      100,
      Math.round((totalScore / (questions.length * 150)) * 100)
    );

    const payload: PendingSessionPayload = {
      sessionId,
      score: normalizedScore,
      accuracy,
      totalTime,
      correctAnswers,
      totalQuestions: questions.length,
      challengeId,
      challengeTargetScore: challenge?.target_score ?? 0,
      mode,
      duelId,
    };
    pendingSessionPayloadRef.current = payload;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOfflinePendingSync(true);
      try {
        localStorage.setItem(`terracoast_pending_${sessionId}`, JSON.stringify(payload));
      } catch (_) {}
      isCompletingRef.current = false;
      return;
    }

    try {
      const { data: serverProgressData, error: serverProgressError } = await supabase.rpc(
        "complete_game_session_and_progress",
        {
          p_session_id: sessionId,
          p_score: normalizedScore,
          p_accuracy: accuracy,
          p_time_taken_seconds: totalTime,
          p_correct_answers: correctAnswers,
          p_total_questions: questions.length,
        }
      );

      if (serverProgressError) {
        console.warn("[progression-rpc] Failed, saving offline fallback:", serverProgressError);
        setIsOfflinePendingSync(true);
        try {
          localStorage.setItem(`terracoast_pending_${sessionId}`, JSON.stringify(payload));
        } catch (_) {}
        isCompletingRef.current = false;
        return;
      }

      if (challengeId) {
        try {
          const beaten = normalizedScore >= (challenge?.target_score ?? 0);
          await supabase
            .from("quiz_score_challenges")
            .update({
              status: "completed",
              beaten,
              completed_at: new Date().toISOString(),
            })
            .eq("id", challengeId);
        } catch (e) {
          console.error("Failed to complete challenge:", e);
        }
      }

      if (mode === "duel" && duelId) {
        await updateDuel();
      }

      const progress = (serverProgressData || {}) as { earned_xp?: number };
      setXpGained(Number(progress.earned_xp || 0));
      await refreshProfile();
      pendingSessionPayloadRef.current = null;
    } catch (err) {
      console.warn("[progression-rpc] Network error, falling back to offline sync:", err);
      setIsOfflinePendingSync(true);
      try {
        localStorage.setItem(`terracoast_pending_${sessionId}`, JSON.stringify(payload));
      } catch (_) {}
    } finally {
      isCompletingRef.current = false;
    }
  }, [
    gameComplete,
    trainingMode,
    sessionId,
    answers,
    questions.length,
    totalScore,
    challengeId,
    challenge?.target_score,
    mode,
    duelId,
    updateDuel,
    refreshProfile,
  ]);

  const syncSessionProgress = useCallback(async (payloadOverride?: PendingSessionPayload) => {
    const payload = payloadOverride || pendingSessionPayloadRef.current;
    if (!payload) return;

    setIsSyncing(true);
    try {
      const { data: serverProgressData, error: serverProgressError } = await supabase.rpc(
        "complete_game_session_and_progress",
        {
          p_session_id: payload.sessionId,
          p_score: payload.score,
          p_accuracy: payload.accuracy,
          p_time_taken_seconds: payload.totalTime,
          p_correct_answers: payload.correctAnswers,
          p_total_questions: payload.totalQuestions,
        }
      );

      if (serverProgressError) {
        throw serverProgressError;
      }

      if (payload.challengeId) {
        try {
          const beaten = payload.score >= (payload.challengeTargetScore ?? 0);
          await supabase
            .from("quiz_score_challenges")
            .update({
              status: "completed",
              beaten,
              completed_at: new Date().toISOString(),
            })
            .eq("id", payload.challengeId);
        } catch (e) {
          console.error("Failed to complete challenge:", e);
        }
      }

      if (payload.mode === "duel" && payload.duelId) {
        await updateDuel();
      }

      const progress = (serverProgressData || {}) as { earned_xp?: number };
      setXpGained(Number(progress.earned_xp || 0));
      await refreshProfile();
      setIsOfflinePendingSync(false);
      pendingSessionPayloadRef.current = null;
      try {
        localStorage.removeItem(`terracoast_pending_${payload.sessionId}`);
      } catch (_) {}
    } catch (err) {
      console.warn("[offline-sync] Could not sync session yet:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [refreshProfile, updateDuel]);

  useEffect(() => {
    const handleOnline = () => {
      if (isOfflinePendingSync && pendingSessionPayloadRef.current) {
        syncSessionProgress(pendingSessionPayloadRef.current);
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [isOfflinePendingSync, syncSessionProgress]);

  // Fin de partie : laisser le temps d'afficher le feedback de la dernière question
  useEffect(() => {
    if (
      answers.length !== questions.length ||
      answers.length === 0 ||
      gameComplete ||
      trainingMode ||
      isCompletingRef.current
    ) {
      return;
    }
    const lastAnswer = answers[answers.length - 1];
    const answeredQuestion = questions.find((q) => q.id === lastAnswer.question_id);
    const delayMs = getPostAnswerDelayMs(
      answeredQuestion || questions[questions.length - 1],
      lastAnswer.is_correct
    );
    const tTimer = window.setTimeout(() => {
      completeGame();
    }, delayMs);
    return () => clearTimeout(tTimer);
  }, [answers, questions, gameComplete, trainingMode, completeGame]);

  const handleSubmitAnswer = useCallback(
    (forcedAnswer?: string, options?: { fromTimeout?: boolean }) => {
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

      if (
        currentQuestion.question_type === "puzzle_map" ||
        currentQuestion.question_type === "map_click"
      ) {
        if (!currentPuzzleState) return;
        const totalSlots = currentPuzzleState.countries.length;

        const pickedIso3s = Array.from(new Set(currentPuzzleState.pickedIso3s));
        if (!fromTimeout && pickedIso3s.length === 0) {
          showAppNotification({
            type: "error",
            message: t("playQuiz.selectAnswer"),
          });
          return;
        }
        const targetSet = new Set(
          currentPuzzleState.countries.map((country) =>
            String(country.iso3).toUpperCase()
          )
        );
        const normPick = (iso3: string) =>
          iso3.startsWith("__shape:") ? iso3 : String(iso3).toUpperCase();
        const exactMatches = pickedIso3s.filter((iso3) =>
          targetSet.has(normPick(iso3))
        ).length;
        const wrongIso3s = pickedIso3s.filter(
          (iso3) => !targetSet.has(normPick(iso3))
        );
        const denominator = Math.max(totalSlots, pickedIso3s.length || 0);
        const ratio = denominator > 0 ? exactMatches / denominator : 0;
        const pointsEarned = Math.round(
          calculatePoints(
            timeTaken,
            currentQuestion.points,
            quiz?.time_limit_seconds || 30
          ) * ratio
        );
        const isCorrect = exactMatches === totalSlots && wrongIso3s.length === 0;

        const answerData: QuizAnswer = {
          question_id: currentQuestion.id,
          user_answer: JSON.stringify({
            type: currentQuestion.question_type,
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

        if (currentQuestion.question_type === "puzzle_map") {
          setConsumedPuzzleIso3s((prev) => {
            const next = new Set(prev.map((id) => String(id).toUpperCase()));
            for (const c of currentPuzzleState.countries) {
              if (c.iso3) next.add(String(c.iso3).toUpperCase());
            }
            return [...next];
          });
        }

        if (!trainingMode) {
          const delayMs = getPostAnswerDelayMs(currentQuestion, isCorrect);
          setTimeout(() => {
            hasTimedOutRef.current = false;
            moveToNextQuestion();
          }, delayMs);
        }
        return;
      }

      if (currentQuestion.question_type === "top10_order") {
        if (!currentTop10State) return;
        if (currentTop10State.order.length !== currentTop10State.expected.length) {
          showAppNotification({
            type: "error",
            message: t("playQuiz.top10.invalidOrder"),
          });
          return;
        }

        const exactMatches = currentTop10State.order.filter(
          (country, index) => country === currentTop10State.expected[index]
        ).length;
        const total = currentTop10State.expected.length;
        const ratio = total > 0 ? exactMatches / total : 0;
        const pointsEarned = Math.round(
          calculatePoints(
            timeTaken,
            currentQuestion.points,
            quiz?.time_limit_seconds || 30
          ) * ratio
        );
        const isCorrect = exactMatches === total;

        const answerData: QuizAnswer = {
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
          const delayMs = getPostAnswerDelayMs(currentQuestion, isCorrect);
          setTimeout(() => {
            hasTimedOutRef.current = false;
            moveToNextQuestion();
          }, delayMs);
        }
        return;
      }

      if (currentQuestion.question_type === "country_multi") {
        const mapData = (currentQuestion.map_data || {}) as {
          selectedCountries?: string[];
          nameTolerance?: "strict" | "lenient";
          capitalTolerance?: "strict" | "lenient";
        };
        const targets = getCountriesByIso3(mapData.selectedCountries || []);
        if (targets.length === 0) {
          showAppNotification({
            type: "error",
            message: t("playQuiz.selectAnswer"),
          });
          return;
        }
        const requiredFields: ("name" | "capital" | "map_click")[] = [
          "name",
          "capital",
          "map_click",
        ];
        const nameTolerance = mapData.nameTolerance || "lenient";
        const capitalTolerance = mapData.capitalTolerance || "lenient";
        const inputByIso = countryMultiInputs[currentQuestion.id] || {};
        const pickedIso3s = currentPuzzleState?.pickedIso3s || [];
        const pickedSet = new Set(
          pickedIso3s.map((iso) => String(iso).toUpperCase())
        );
        const targetSet = new Set(
          targets.map((country) => country.iso3.toUpperCase())
        );

        if (requiredFields.includes("map_click") && pickedSet.size === 0) {
          showAppNotification({
            type: "error",
            message: t("playQuiz.selectAnswer"),
          });
          return;
        }
        if (requiredFields.includes("name")) {
          const hasMissing = targets.some((target) => {
            const input = inputByIso[target.iso3];
            return !String(input?.countryName || "").trim();
          });
          if (hasMissing) {
            showAppNotification({
              type: "error",
              message: t("playQuiz.selectAnswer"),
            });
            return;
          }
        }
        if (requiredFields.includes("capital")) {
          const hasMissing = targets.some((target) => {
            const input = inputByIso[target.iso3];
            return !String(input?.capital || "").trim();
          });
          if (hasMissing) {
            showAppNotification({
              type: "error",
              message: t("playQuiz.selectAnswer"),
            });
            return;
          }
        }

        const details = targets.map((target) => {
          const input = inputByIso[target.iso3] || {
            countryName: "",
            capital: "",
          };
          const nameVariants = getCountryNameVariantsByIso3(target.iso3, language);
          const capitalVariants = getCountryCapitalVariantsByIso3(
            target.iso3,
            language
          );
          const isNameCorrect = !requiredFields.includes("name")
            ? true
            : nameVariants.some((variant) =>
                matchesWithTolerance(input.countryName, variant, nameTolerance)
              );
          const isCapitalCorrect = !requiredFields.includes("capital")
            ? true
            : capitalVariants.some((variant) =>
                matchesWithTolerance(
                  input.capital,
                  String(variant || ""),
                  capitalTolerance
                )
              );
          const isMapCorrect = !requiredFields.includes("map_click")
            ? true
            : pickedSet.has(String(target.iso3).toUpperCase());
          return {
            iso3: target.iso3,
            targetName: nameVariants[0] || target.name,
            targetCapital: capitalVariants[0] || target.capital || "",
            targetFlagEmoji: target.flagEmoji || "",
            userCountryName: input.countryName,
            userCapital: input.capital,
            isNameCorrect,
            isCapitalCorrect,
            isMapCorrect,
          };
        });

        const wrongMapClicks = requiredFields.includes("map_click")
          ? [...pickedSet].filter((iso) => !targetSet.has(iso))
          : [];

        const totalChecks = Math.max(requiredFields.length * targets.length, 1);
        const correctChecks = details.reduce((sum, row) => {
          let local = 0;
          if (requiredFields.includes("name") && row.isNameCorrect) local += 1;
          if (requiredFields.includes("capital") && row.isCapitalCorrect) local += 1;
          if (requiredFields.includes("map_click") && row.isMapCorrect) local += 1;
          return sum + local;
        }, 0);
        const mapPenalty = requiredFields.includes("map_click")
          ? Math.min(wrongMapClicks.length, totalChecks)
          : 0;
        const adjustedCorrect = Math.max(0, correctChecks - mapPenalty);
        const ratio = adjustedCorrect / totalChecks;
        const pointsEarned = Math.round(
          calculatePoints(
            timeTaken,
            currentQuestion.points,
            quiz?.time_limit_seconds || 30
          ) * ratio
        );
        const isCorrect = adjustedCorrect === totalChecks;

        const answerData: QuizAnswer = {
          question_id: currentQuestion.id,
          user_answer: JSON.stringify({
            type: "country_multi",
            requiredFields,
            nameTolerance,
            capitalTolerance,
            details,
            pickedIso3s,
            wrongMapClicks,
            correctChecks: adjustedCorrect,
            totalChecks,
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
          const delayMs = getPostAnswerDelayMs(currentQuestion, isCorrect);
          setTimeout(() => {
            hasTimedOutRef.current = false;
            moveToNextQuestion();
          }, delayMs);
        }
        return;
      }

      if (!answer.trim()) {
        showAppNotification({
          type: "error",
          message: t("playQuiz.selectAnswer"),
        });
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
        ? calculatePoints(
            timeTaken,
            currentQuestion.points,
            quiz?.time_limit_seconds || 30
          )
        : 0;

      const answerData: QuizAnswer = {
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
        const delayMs = getPostAnswerDelayMs(currentQuestion, isCorrect);
        setTimeout(() => {
          hasTimedOutRef.current = false;
          moveToNextQuestion();
        }, delayMs);
      }
    },
    [
      isAnswered,
      gameComplete,
      questionStartTime,
      questions,
      currentQuestionIndex,
      puzzleStates,
      top10States,
      selectedOption,
      userAnswer,
      quiz?.time_limit_seconds,
      showAppNotification,
      t,
      trainingMode,
      countryMultiInputs,
      language,
      moveToNextQuestion,
    ]
  );

  const handleTimeout = useCallback(() => {
    if (isAnswered || gameComplete || hasTimedOutRef.current) return;
    hasTimedOutRef.current = true;
    handleSubmitAnswer(undefined, { fromTimeout: true });
  }, [isAnswered, gameComplete, handleSubmitAnswer]);

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

  const handleAnswerClick = (option: string, event: React.MouseEvent) => {
    if (isAnswered) return;

    setSelectedOption(option);

    if (event.detail === 2) {
      setTimeout(() => handleSubmitAnswer(option), 50);
    }
  };

  return {
    quiz,
    questions,
    currentQuestionIndex,
    userAnswer,
    setUserAnswer,
    selectedOption,
    setSelectedOption,
    timeLeft,
    questionStartTime,
    sessionId,
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
  };
}
