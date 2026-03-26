import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useNotifications } from "../../contexts/NotificationContext";
import {
  Clock,
  CheckCircle,
  XCircle,
  Trophy,
  ArrowLeft,
  Lightbulb,
} from "lucide-react";
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
import {
  getSubdivisions,
  getSubdivisionsByIds,
  type SubdivisionGameEntry,
  type SubdivisionScope,
} from "../../lib/subdivisionGameData";
import {
  countryEntriesFromGeoJson,
  fetchGeoJsonFeatureCollection,
  presetFromRowPreset,
  type CustomGeoJsonMapRow,
} from "../../lib/customGeojsonMaps";
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
  onNavigate: (view: string, data?: Record<string, unknown>) => void;
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
  const { showAppNotification } = useNotifications();
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
  const [countryMultiInputs, setCountryMultiInputs] = useState<
    Record<string, Record<string, { countryName: string; capital: string }>>
  >({});
  /** Pays / régions déjà « consommés » après une question puzzle (carte cumulative). */
  const [consumedPuzzleIso3s, setConsumedPuzzleIso3s] = useState<string[]>([]);
  const isCompletingRef = useRef(false);
  const isCreatingSessionRef = useRef(false);
  const hasTimedOutRef = useRef(false);
  const textInputRef = useRef<HTMLInputElement>(null);
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
  const allSubdivisions = [
    ...getSubdivisions("ch_cantons"),
    ...getSubdivisions("fr_departements"),
    ...getSubdivisions("us_states"),
  ].map(toCountryEntry);
  const countryNameByIso = Object.fromEntries(
    [...allCountries, ...allSubdivisions].map((country) => [
      country.iso3,
      country.name,
    ])
  ) as Record<string, string>;

  useEffect(() => {
    isCompletingRef.current = false;
    isCreatingSessionRef.current = false;
    loadQuiz();
  }, [quizId]);

  const firstMcqQuestionIndex = useMemo(
    () => questions.findIndex((q) => q.question_type === "mcq"),
    [questions]
  );

  const getPostAnswerDelayMs = (question: Question, isCorrect: boolean) => {
    if (trainingMode) return 0;
    return (question.complement_if_wrong || "").trim() ? 5000 : 1500;
  };

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
    const t = window.setTimeout(() => {
      completeGame();
    }, delayMs);
    return () => clearTimeout(t);
  }, [answers, questions, gameComplete, trainingMode]);
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
      return;
    }

    // In training mode there is no server-side completion call,
    // so finishing on the last question must mark the game complete locally.
    if (trainingMode) {
      setGameComplete(true);
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
  const levenshteinDistance = (a: string, b: string): number => {
    const aa = a || "";
    const bb = b || "";
    const dp: number[][] = Array.from({ length: aa.length + 1 }, () =>
      Array(bb.length + 1).fill(0)
    );
    for (let i = 0; i <= aa.length; i += 1) dp[i][0] = i;
    for (let j = 0; j <= bb.length; j += 1) dp[0][j] = j;
    for (let i = 1; i <= aa.length; i += 1) {
      for (let j = 1; j <= bb.length; j += 1) {
        const cost = aa[i - 1] === bb[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[aa.length][bb.length];
  };
  const matchesWithTolerance = (
    userInput: string,
    expected: string,
    mode: "strict" | "lenient"
  ) => {
    const ua = normalizeAnswer(userInput);
    const ea = normalizeAnswer(expected);
    if (!ua || !ea) return false;
    if (ua === ea) return true;
    if (mode === "strict") return false;
    return levenshteinDistance(ua, ea) <= 1;
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
        const nextCountryMultiInputs: Record<
          string,
          Record<string, { countryName: string; capital: string }>
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
                const m = (q.map_data || {}) as { mapLevel?: string; customGeojsonMapId?: string };
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
                let pool = countryEntriesFromGeoJson(
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
            const customItems = (Array.isArray(question.options)
              ? question.options
              : []
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
  };

  const createSession = async () => {
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

    if (
      currentQuestion.question_type === "puzzle_map" ||
      currentQuestion.question_type === "map_click"
    ) {
      if (!currentPuzzleState) return;
      const totalSlots = currentPuzzleState.countries.length;

      const pickedIso3s = Array.from(new Set(currentPuzzleState.pickedIso3s));
      if (!fromTimeout && pickedIso3s.length === 0) {
        showAppNotification({ type: "error", message: t("playQuiz.selectAnswer") });
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
        calculatePoints(timeTaken, currentQuestion.points) * ratio
      );
      const isCorrect = exactMatches === totalSlots && wrongIso3s.length === 0;

      const answerData = {
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
          const next = new Set(
            prev.map((id) => String(id).toUpperCase())
          );
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
        showAppNotification({ type: "error", message: t("playQuiz.selectAnswer") });
        return;
      }
      const requiredFields: ("name" | "capital" | "map_click")[] = [
        "name",
        "capital",
        "map_click",
      ];
      const nameTolerance = mapData.nameTolerance || "lenient";
      const capitalTolerance = mapData.capitalTolerance || "strict";
      const inputByIso = countryMultiInputs[currentQuestion.id] || {};
      const pickedIso3s = currentPuzzleState?.pickedIso3s || [];
      const pickedSet = new Set(
        pickedIso3s.map((iso) => String(iso).toUpperCase())
      );
      const targetSet = new Set(targets.map((country) => country.iso3.toUpperCase()));

      if (requiredFields.includes("map_click") && pickedSet.size === 0) {
        showAppNotification({ type: "error", message: t("playQuiz.selectAnswer") });
        return;
      }
      if (requiredFields.includes("name")) {
        const hasMissing = targets.some((target) => {
          const input = inputByIso[target.iso3];
          return !String(input?.countryName || "").trim();
        });
        if (hasMissing) {
          showAppNotification({ type: "error", message: t("playQuiz.selectAnswer") });
          return;
        }
      }
      if (requiredFields.includes("capital")) {
        const hasMissing = targets.some((target) => {
          const input = inputByIso[target.iso3];
          return !String(input?.capital || "").trim();
        });
        if (hasMissing) {
          showAppNotification({ type: "error", message: t("playQuiz.selectAnswer") });
          return;
        }
      }

      const details = targets.map((target) => {
        const input = inputByIso[target.iso3] || { countryName: "", capital: "" };
        const isNameCorrect = !requiredFields.includes("name")
          ? true
          : matchesWithTolerance(input.countryName, target.name, nameTolerance);
        const isCapitalCorrect = !requiredFields.includes("capital")
          ? true
          : matchesWithTolerance(
              input.capital,
              String(target.capital || ""),
              capitalTolerance
            );
        const isMapCorrect = !requiredFields.includes("map_click")
          ? true
          : pickedSet.has(String(target.iso3).toUpperCase());
        return {
          iso3: target.iso3,
          targetName: target.name,
          targetCapital: target.capital || "",
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
        calculatePoints(timeTaken, currentQuestion.points) * ratio
      );
      const isCorrect = adjustedCorrect === totalChecks;

      const answerData = {
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
      showAppNotification({ type: "error", message: t("playQuiz.selectAnswer") });
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
      const delayMs = getPostAnswerDelayMs(currentQuestion, isCorrect);
      setTimeout(() => {
        hasTimedOutRef.current = false;
        moveToNextQuestion();
      }, delayMs);
    }
  }

  const completeGame = async () => {
    if (gameComplete || isCompletingRef.current) {
      return;
    }

    if (trainingMode) return;
    if (!sessionId) {
      // Session can be created asynchronously just after the quiz starts.
      // Retry shortly instead of marking game complete too early.
      setTimeout(() => {
        completeGame();
      }, 300);
      return;
    }

    isCompletingRef.current = true;
    setGameComplete(true);

    const correctAnswers = answers.filter((a) => a.is_correct).length;
    const accuracy = (correctAnswers / questions.length) * 100;
    const totalTime = answers.reduce((sum, a) => sum + a.time_taken, 0);

    const normalizedScore = Math.min(
      100,
      Math.round((totalScore / (questions.length * 150)) * 100)
    );

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
      console.error("[progression-rpc] failed:", serverProgressError);
      isCompletingRef.current = false;
      setGameComplete(false);
      return;
    }

    if (mode === "duel" && duelId) {
      await updateDuel();
    }

    const payload = (serverProgressData || {}) as { earned_xp?: number };
    setXpGained(Number(payload.earned_xp || 0));
    await refreshProfile();
    isCompletingRef.current = false;
  };

  const updateDuel = async () => {
    if (!duelId || !sessionId) return;
    const { error } = await supabase.rpc("link_duel_session_and_finalize", {
      p_duel_id: duelId,
      p_session_id: sessionId,
    });
    if (error) {
      console.error("Error linking duel session atomically:", error);
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
                                  ? puzzleState.countries
                                      .map((c) => c.name)
                                      .join(", ")
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
                                        <span className="mr-1">{row.targetFlagEmoji || "🏳️"}</span>
                                        {row.targetName}
                                      </p>
                                      <p
                                        className={
                                          row.isNameCorrect
                                            ? "text-green-700"
                                            : "text-red-700"
                                        }
                                      >
                                        {row.isNameCorrect ? "✅" : "❌"}{" "}
                                        {t("playQuiz.countryMulti.fieldName")}
                                      </p>
                                      <p
                                        className={
                                          row.isCapitalCorrect
                                            ? "text-green-700"
                                            : "text-red-700"
                                        }
                                      >
                                        {row.isCapitalCorrect ? "✅" : "❌"}{" "}
                                        {t("playQuiz.countryMulti.fieldCapital")}
                                      </p>
                                      <p
                                        className={
                                          row.isMapCorrect
                                            ? "text-green-700"
                                            : "text-red-700"
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
  const handleQuit = () => {
    const confirmed =
      typeof window === "undefined" ? true : window.confirm(t("playQuiz.confirmQuit"));
    if (!confirmed) return;
    if (mode === "duel") {
      onNavigate("duels");
      return;
    }
    if (trainingMode) {
      onNavigate("training-mode");
      return;
    }
    onNavigate("quizzes");
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* HEADER FIXE AVEC PROGRESSION */}
      <div className="bg-white shadow-sm px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handleQuit}
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
              {currentQuestion.question_text ||
                ((currentQuestion.map_data as { countryMultiPrompt?: string } | null)
                  ?.countryMultiPrompt || "")}
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

          {currentQuestion.question_type === "mcq" &&
            currentQuestion.options && (
              <>
                {!trainingMode &&
                  firstMcqQuestionIndex >= 0 &&
                  currentQuestionIndex === firstMcqQuestionIndex &&
                  !isAnswered && (
                    <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      <Lightbulb className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                      <span>{t("playQuiz.mcqDoubleClickHint")}</span>
                    </div>
                  )}
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
              </>
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

          {(currentQuestion.question_type === "puzzle_map" ||
            currentQuestion.question_type === "map_click") &&
            currentPuzzleState && (
            <PuzzleMapQuestion
              countries={currentPuzzleState.countries}
              geographySource={
                (currentQuestion.map_data as { mapLevel?: string })?.mapLevel ===
                "custom_geojson"
                  ? "custom_geojson"
                  : (currentQuestion.map_data as { mapLevel?: string })?.mapLevel ===
                      "subdivisions" &&
                    (currentQuestion.map_data as { subdivisionScope?: SubdivisionScope })
                      ?.subdivisionScope
                  ? ((currentQuestion.map_data as { subdivisionScope?: SubdivisionScope })
                      .subdivisionScope as SubdivisionScope)
                  : "world"
              }
              customGeoJsonUrl={
                (currentQuestion.map_data as { mapLevel?: string })?.mapLevel ===
                "custom_geojson"
                  ? String(
                      (currentQuestion.map_data as { customGeojsonPublicUrl?: string })
                        .customGeojsonPublicUrl || ""
                    ) || null
                  : null
              }
              customIdProperty={String(
                (currentQuestion.map_data as { customGeojsonIdProperty?: string })
                  .customGeojsonIdProperty || "tc_id"
              )}
              showTargetList={false}
              excludedIso3s={
                currentQuestion.question_type === "puzzle_map"
                  ? consumedPuzzleIso3s
                  : []
              }
              revealResult={showResult || isAnswered}
              initialView={(currentQuestion.map_data as any)?.initialView || null}
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
            <div className="space-y-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
              {(() => {
                const mapData = (currentQuestion.map_data || {}) as {
                  selectedCountries?: string[];
                  requiredFields?: ("name" | "capital" | "map_click")[];
                  countryMultiPrompt?: string;
                };
                const targets = getCountriesByIso3(mapData.selectedCountries || []);
                const requiredFields: ("name" | "capital" | "map_click")[] = [
                  "name",
                  "capital",
                  "map_click",
                ];
                const inputByIso = countryMultiInputs[currentQuestion.id] || {};
                const isCompact = targets.length >= 8;
                return (
                  <>
                    {(mapData.countryMultiPrompt || "").trim() && (
                      <p className="text-sm text-indigo-900">
                        {mapData.countryMultiPrompt}
                      </p>
                    )}
                    <p className="text-sm text-indigo-900">
                      {t("playQuiz.countryMulti.targetCountries")}:{" "}
                      <span className="font-semibold">{targets.length}</span>
                    </p>
                    <div
                      className={
                        isCompact
                          ? "max-h-80 overflow-auto rounded border border-indigo-200"
                          : "grid grid-cols-1 md:grid-cols-2 gap-3"
                      }
                    >
                      {targets.map((target) => {
                        const rowInput = inputByIso[target.iso3] || {
                          countryName: "",
                          capital: "",
                        };
                        return (
                          <div
                            key={target.iso3}
                            className={`rounded-lg border border-indigo-200 bg-white p-3 ${
                              isCompact ? "border-x-0 border-t-0 last:border-b-0 rounded-none" : ""
                            }`}
                          >
                            <p className="text-sm font-semibold text-indigo-800 mb-2">
                              {t("playQuiz.countryMulti.targetIndex").replace(
                                "{index}",
                                String(
                                  targets.findIndex((t) => t.iso3 === target.iso3) + 1
                                )
                              )}
                            </p>
                            {requiredFields.includes("name") && (
                              <input
                                type="text"
                                value={rowInput.countryName}
                                disabled={isAnswered}
                                onChange={(e) =>
                                  setCountryMultiInputs((prev) => ({
                                    ...prev,
                                    [currentQuestion.id]: {
                                      ...(prev[currentQuestion.id] || {}),
                                      [target.iso3]: {
                                        ...((prev[currentQuestion.id] || {})[
                                          target.iso3
                                        ] || {
                                          countryName: "",
                                          capital: "",
                                        }),
                                        countryName: e.target.value,
                                      },
                                    },
                                  }))
                                }
                                className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none disabled:bg-gray-100"
                                placeholder={t("playQuiz.countryMulti.fieldName")}
                              />
                            )}
                            {requiredFields.includes("capital") && (
                              <input
                                type="text"
                                value={rowInput.capital}
                                disabled={isAnswered}
                                onChange={(e) =>
                                  setCountryMultiInputs((prev) => ({
                                    ...prev,
                                    [currentQuestion.id]: {
                                      ...(prev[currentQuestion.id] || {}),
                                      [target.iso3]: {
                                        ...((prev[currentQuestion.id] || {})[
                                          target.iso3
                                        ] || {
                                          countryName: "",
                                          capital: "",
                                        }),
                                        capital: e.target.value,
                                      },
                                    },
                                  }))
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none disabled:bg-gray-100"
                                placeholder={t("playQuiz.countryMulti.fieldCapital")}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {currentQuestion.question_type === "country_multi" &&
            (() => {
              const mapData = (currentQuestion.map_data || {}) as {
                requiredFields?: ("name" | "capital" | "map_click")[];
              };
              const requiredFields = mapData.requiredFields || [
                "name",
                "capital",
                "map_click",
              ];
              return requiredFields.includes("map_click");
            })() &&
            currentPuzzleState && (
              <PuzzleMapQuestion
                countries={currentPuzzleState.countries}
                geographySource="world"
                showTargetList={false}
                excludedIso3s={[]}
                revealResult={showResult || isAnswered}
                initialView={(currentQuestion.map_data as any)?.initialView || null}
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
              {currentQuestion.question_type === "country_multi" &&
                (() => {
                  const last = answers[answers.length - 1];
                  if (!last?.user_answer?.trim()?.startsWith("{")) return null;
                  try {
                    const parsed = JSON.parse(last.user_answer) as {
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
                        {currentQuestion.question_type === "map_click" &&
                        (currentPuzzleState?.countries?.length || 0) > 0
                          ? currentPuzzleState!.countries
                              .map((c) => c.name)
                              .join(", ")
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
                  : currentQuestion.question_type === "puzzle_map" ||
                    currentQuestion.question_type === "map_click"
                  ? !currentPuzzleState ||
                    currentPuzzleState.pickedIso3s.length === 0
                  : currentQuestion.question_type === "top10_order"
                  ? !currentTop10State ||
                    currentTop10State.order.length !==
                      currentTop10State.expected.length ||
                    currentTop10State.expected.length < 2
                  : currentQuestion.question_type === "country_multi"
                  ? (() => {
                      const mapData = (currentQuestion.map_data || {}) as {
                        selectedCountries?: string[];
                        requiredFields?: ("name" | "capital" | "map_click")[];
                      };
                      const requiredFields = mapData.requiredFields || [];
                      const targets = getCountriesByIso3(
                        mapData.selectedCountries || []
                      );
                      const inputByIso = countryMultiInputs[currentQuestion.id] || {};
                      const hasNameMissing = requiredFields.includes("name")
                        ? targets.some(
                            (target) =>
                              !String(
                                (inputByIso[target.iso3] || {}).countryName || ""
                              ).trim()
                          )
                        : false;
                      const hasCapitalMissing = requiredFields.includes("capital")
                        ? targets.some(
                            (target) =>
                              !String(
                                (inputByIso[target.iso3] || {}).capital || ""
                              ).trim()
                          )
                        : false;
                      const hasMapMissing = requiredFields.includes("map_click")
                        ? !currentPuzzleState ||
                          currentPuzzleState.pickedIso3s.length === 0
                        : false;
                      return (
                        targets.length === 0 ||
                        requiredFields.length === 0 ||
                        hasNameMissing ||
                        hasCapitalMissing ||
                        hasMapMissing
                      );
                    })()
                  : !userAnswer.trim()
              }
              className="w-full py-3 md:py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {t("playQuiz.validate")}
            </button>
          ) : (
            trainingMode && (
              <>
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
