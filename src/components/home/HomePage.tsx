import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  Trophy,
  Target,
  Flame,
  Users,
  BookOpen,
  Award,
  Dumbbell,
  AlertTriangle,
  Ban,
  X,
} from "lucide-react";
import type { Database } from "../../lib/database.types";
import { getCountriesByIso3 } from "../../lib/countryGameData";
import { QuizGlobe, type QuizGlobePoint } from "./QuizGlobe";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
type GameSession = Database["public"]["Tables"]["game_sessions"]["Row"];
type Warning = {
  id: string;
  reason: string;
  admin_notes?: string | null;
  created_at: string;
};

export function HomePage({
  onNavigate,
}: {
  onNavigate: (view: string, data?: Record<string, unknown>) => void;
}) {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [, setRecentQuizzes] = useState<Quiz[]>([]);
  const [, setRecentSessions] = useState<GameSession[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [globePoints, setGlobePoints] = useState<QuizGlobePoint[]>([]);
  const [stats, setStats] = useState({
    totalPlays: 0,
    averageScore: 0,
    dailyPoints: 0,
    maxDailyPoints: 0,
  });

  const getDayText = (count: number) =>
    count > 1 ? t("common.days") : t("common.day");

  const getStreakStartDate = () => {
    if (!profile?.current_streak || profile.current_streak === 0) return null;
    const today = new Date();
    const streakStartDate = new Date();
    streakStartDate.setDate(today.getDate() - (profile.current_streak - 1));
    return streakStartDate;
  };

  useEffect(() => {
    if (!profile) return;

    const loadData = async () => {
      try {
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", profile.id)
          .single();

        let query = supabase
          .from("quizzes")
          .select("*")
          .or("is_public.eq.true,is_global.eq.true");

        if (!profile.show_all_languages && profile.language) {
          query = query.eq("language", profile.language);
        }

        const { data: allQuizzes, error } = await query;

        if (error) {
          console.error("Erreur chargement quiz:", error);
          return;
        }

        if (allQuizzes && allQuizzes.length > 0) {
          const now = Date.now();
          const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

          const relevantQuizzes = allQuizzes
            .map((quiz: any) => {
              const quizAge = now - new Date(quiz.created_at).getTime();
              const recencyScore = Math.max(0, 1 - quizAge / thirtyDaysMs);
              const popularityScore = Math.min(
                1,
                (quiz.total_plays || 0) / 100
              );
              const qualityScore = Math.min(1, (quiz.average_score || 0) / 100);
              const relevanceScore =
                popularityScore * 0.55 + recencyScore * 0.3 + qualityScore * 0.15;
              return { ...quiz, relevanceScore };
            })
            .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore)
            .slice(0, 20);

          setRecentQuizzes(relevantQuizzes);

          const quizIds = relevantQuizzes.map((q: Quiz) => q.id);
          const { data: quizQuestions } = await supabase
            .from("questions")
            .select("quiz_id, map_data")
            .in("quiz_id", quizIds)
            .in("question_type", ["puzzle_map", "map_click", "country_multi"]);

          const points = relevantQuizzes.map((quiz: Quiz, idx: number) => {
            const relatedQuestions = (quizQuestions || []).filter(
              (q: any) => q.quiz_id === quiz.id
            );
            if (
              typeof quiz.location_lat === "number" &&
              typeof quiz.location_lng === "number"
            ) {
              return {
                quizId: quiz.id,
                title: quiz.title,
                difficulty: quiz.difficulty,
                totalPlays: quiz.total_plays || 0,
                lat: quiz.location_lat,
                lng: quiz.location_lng,
              } satisfies QuizGlobePoint;
            }
            const selectedIso3s = relatedQuestions.flatMap((q: any) => {
              const mapData = q.map_data as { selectedCountries?: string[] } | null;
              return Array.isArray(mapData?.selectedCountries)
                ? mapData.selectedCountries
                : [];
            });
            const uniqueIso3s = [...new Set(selectedIso3s)].slice(0, 5);
            const countries = getCountriesByIso3(uniqueIso3s);
            if (countries.length > 0) {
              const avgLat =
                countries.reduce((sum, c) => sum + c.lat, 0) / countries.length;
              const avgLng =
                countries.reduce((sum, c) => sum + c.lng, 0) / countries.length;
              return {
                quizId: quiz.id,
                title: quiz.title,
                difficulty: quiz.difficulty,
                totalPlays: quiz.total_plays || 0,
                lat: avgLat,
                lng: avgLng,
              } satisfies QuizGlobePoint;
            }
            // Fallback deterministic spread if quiz has no geographic config.
            const fallbackLat = -40 + idx * 25;
            const fallbackLng = -140 + idx * 90;
            return {
              quizId: quiz.id,
              title: quiz.title,
              difficulty: quiz.difficulty,
              totalPlays: quiz.total_plays || 0,
              lat: fallbackLat,
              lng: fallbackLng,
            } satisfies QuizGlobePoint;
          });
          setGlobePoints(points);
        }

        const { data: sessions, count: totalSessionsCount } = await supabase
          .from("game_sessions")
          .select("*", { count: "exact" })
          .eq("player_id", profile.id)
          .eq("completed", true)
          .order("completed_at", { ascending: false })
          .limit(5);

        if (sessions) {
          const typedSessions = sessions as GameSession[];
          setRecentSessions(typedSessions);

          const totalPlays = totalSessionsCount || 0;
          const averageScore =
            typedSessions.reduce((acc, s) => acc + s.score, 0) / typedSessions.length ||
            0;

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayISO = today.toISOString();

          const { data: todaySessions } = await supabase
            .from("game_sessions")
            .select("score")
            .eq("player_id", profile.id)
            .eq("completed", true)
            .gte("completed_at", todayISO);

          let dailyPoints = 0;
          if (todaySessions) {
            const typedTodaySessions = todaySessions as Array<{ score: number }>;
            dailyPoints = typedTodaySessions.reduce((sum, s) => sum + s.score, 0);
          }

          const { data: allCompletedSessions } = await supabase
            .from("game_sessions")
            .select("score, completed_at")
            .eq("player_id", profile.id)
            .eq("completed", true)
            .order("completed_at", { ascending: false });

          let maxDailyPoints = 0;
          if (allCompletedSessions) {
            const typedCompletedSessions = allCompletedSessions as Array<{
              score: number;
              completed_at: string | null;
            }>;
            const dailyPointsMap = new Map<string, number>();
            typedCompletedSessions.forEach((s) => {
              if (!s.completed_at) return;
              const date = new Date(s.completed_at).toISOString().split("T")[0];
              dailyPointsMap.set(
                date,
                (dailyPointsMap.get(date) || 0) + s.score
              );
            });
            maxDailyPoints = Math.max(...dailyPointsMap.values(), 0);
          }

          setStats({ totalPlays, averageScore, dailyPoints, maxDailyPoints });
        }

        const { data: userWarnings } = await supabase
          .from("warnings")
          .select("*")
          .eq("reported_user_id", profile.id)
          .in("status", ["action_taken"])
          .order("created_at", { ascending: false })
          .limit(3);

        if (userWarnings) setWarnings(userWarnings);
      } catch (err) {
        console.error("Erreur:", err);
      }
    };

    loadData();

    const sessionSubscription = supabase
      .channel(`sessions_${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_sessions",
          filter: `player_id=eq.${profile.id}`,
        },
        () => {
          console.log("🔄 Session mise à jour, rechargement...");
          loadData();
        }
      )
      .subscribe();

    return () => {
      sessionSubscription.unsubscribe();
    };
  }, [profile]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight text-gray-900 mb-2">
          {t("home.welcome")},{" "}
          <span className="text-indigo-600">{profile?.pseudo}</span>!
        </h1>
        <p className="text-gray-600 text-base sm:text-lg">
          {t("home.readyToTest")}
        </p>
      </div>

      {profile?.is_banned && (
        <div className="bg-red-50 border-red-400 border-2 rounded-lg p-5 mb-8 flex items-start space-x-4">
          <Ban className="w-8 h-8 text-red-600 flex-shrink-0" />
          <div className="text-red-700">
            <h3 className="text-xl font-semibold mb-2">
              {t("home.accountBanned")}
            </h3>
            {profile.ban_until ? (
              <p>
                {t("home.temporaryBanUntil")}:{" "}
                <span className="font-bold">
                  {new Date(profile.ban_until).toLocaleString()}
                </span>
              </p>
            ) : (
              <p className="font-bold">{t("home.permanentBan")}</p>
            )}
            <p>
              {t("home.reason")}: {profile.ban_reason || t("home.notSpecified")}
            </p>
          </div>
        </div>
      )}

      {warnings.length > 0 && !profile?.is_banned && (
        <div className="bg-yellow-50 border-yellow-400 border-2 rounded-lg p-5 mb-8 flex items-start space-x-4">
          <AlertTriangle className="w-8 h-8 text-yellow-600 flex-shrink-0" />
          <div>
            <h3 className="text-yellow-800 text-xl font-semibold mb-4">
              {t("home.warningsReceived")}
            </h3>
            <div className="space-y-3">
              {warnings.map((warning, idx) => (
                <div
                  key={warning.id}
                  className="bg-white rounded-lg p-4 border border-yellow-200"
                >
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-800 font-semibold text-sm">
                      {t("home.warning")} #{warnings.length - idx}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {new Date(warning.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm mb-3">
                    <strong>{t("home.reason")}:</strong> {warning.reason}
                  </p>
                  {warning.admin_notes && (
                    <p className="text-blue-700 bg-blue-50 rounded p-2 text-sm">
                      {t("home.note")}: {warning.admin_notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <p className="text-yellow-700 text-sm mt-4">
              {t("home.respectRules")}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white shadow-lg flex flex-col">
          <Target className="w-10 h-10 mb-4" />
          <span className="text-3xl font-extrabold">{stats.totalPlays}</span>
          <h3 className="text-lg font-semibold mt-auto">
            {t("home.gamesPlayed")}
          </h3>
          <p className="text-green-200 text-sm">{t("home.totalSessions")}</p>
        </div>

        <div
          className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow flex flex-col"
          onClick={() => setShowStreakModal(true)}
        >
          <Flame className="w-10 h-10 mb-4" />
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-3xl font-extrabold">
              {profile?.current_streak || 0}
            </span>
            <Flame
              className={`w-8 h-8 ${
                profile?.current_streak ? "animate-pulse" : "opacity-50"
              }`}
            />
          </div>
          <h3 className="text-lg font-semibold">{t("home.currentStreak")}</h3>
          <p className="text-red-200 text-sm mt-auto">
            {t("home.record")}: {profile?.longest_streak || 0}{" "}
            {getDayText(profile?.longest_streak || 0)}
          </p>
          <p className="text-xs text-red-300 mt-2 cursor-pointer hover:underline">
            {t("common.clickForDetails")}
          </p>
        </div>

        <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-xl p-6 text-white shadow-lg flex flex-col">
          <Trophy className="w-10 h-10 mb-4" />
          <span className="text-3xl font-extrabold">{stats.dailyPoints}</span>
          <h3 className="text-lg font-semibold mt-auto">
            {t("home.dailyPoints")}
          </h3>
          <p className="text-yellow-200 text-sm">
            {t("home.record")}: {stats.maxDailyPoints} {t("home.pts")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 items-stretch">
        <div className="bg-white rounded-xl shadow-md p-4 lg:col-span-1 h-full flex flex-col">
          <h2 className="text-xl font-extrabold text-gray-900 mb-4">
            {t("home.quickActions")}
          </h2>

          <div className="mb-3 p-3 rounded-xl border border-purple-200 bg-purple-50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-purple-900">
                  {t("home.trainingSpotlightTitle")}
                </p>
                <p className="text-sm text-purple-700 mt-1">
                  {t("home.trainingSpotlightDesc")}
                </p>
              </div>
              <button
                onClick={() => onNavigate("training-mode")}
                className="shrink-0 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                {t("home.trainingSpotlightCta")}
              </button>
            </div>
          </div>

          <button
            onClick={() => onNavigate("quizzes")}
            className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group mb-3"
          >
            <div className="flex items-center space-x-3">
              <BookOpen className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-gray-900">
                  {t("home.exploreQuizzes")}
                </p>
                <p className="text-gray-600 text-sm">
                  {t("home.discoverNewChallenges")}
                </p>
              </div>
            </div>
            <span className="text-green-600 group-hover:translate-x-1 transition-transform text-2xl">
              →
            </span>
          </button>

          <button
            onClick={() => onNavigate("create-quiz")}
            className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group mb-3"
          >
            <div className="flex items-center space-x-3">
              <Award className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-semibold text-gray-900">
                  {t("quiz.create")}
                </p>
                <p className="text-gray-600 text-sm">
                  {t("home.shareKnowledge")}
                </p>
              </div>
            </div>
            <span className="text-blue-600 group-hover:translate-x-1 transition-transform text-2xl">
              →
            </span>
          </button>

          <button
            onClick={() => onNavigate("training-mode")}
            className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group mb-3"
          >
            <div className="flex items-center space-x-3">
              <Dumbbell className="w-6 h-6 text-purple-600" />
              <div>
                <p className="font-semibold text-gray-900">
                  {t("home.trainingMode")}
                </p>
                <p className="text-gray-600 text-sm">{t("home.noTimeLimit")}</p>
              </div>
            </div>
            <span className="text-purple-600 group-hover:translate-x-1 transition-transform text-2xl">
              →
            </span>
          </button>

          <button
            onClick={() => onNavigate("duels")}
            className="w-full flex items-center justify-between p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-yellow-600" />
              <div>
                <p className="font-semibold text-gray-900">
                  {t("home.challengeFriend")}
                </p>
                <p className="text-gray-600 text-sm">
                  {t("home.realTimeDuel")}
                </p>
              </div>
            </div>
            <span className="text-yellow-600 group-hover:translate-x-1 transition-transform text-2xl">
              →
            </span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 lg:col-span-2 overflow-hidden h-full">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6 flex items-center justify-between">
            <span>{t("home.trendingQuizzes")}</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              Top 20 pertinents
            </span>
          </h2>
          {globePoints.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t("quiz.noQuizzes")}</p>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-3">
                Clique sur un point pour lancer un quiz.
              </p>
              <QuizGlobe
                points={globePoints}
                onPointClick={(quizId) => onNavigate("play-quiz", { quizId })}
              />
            </>
          )}
        </div>
      </div>

      {showStreakModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Flame className="w-6 h-6 mr-2 text-orange-600" />
                {t("home.currentStreak")}
              </h3>
              <button
                onClick={() => setShowStreakModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {profile?.current_streak && profile.current_streak > 0 ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-orange-50 to-red-100 p-6 rounded-lg text-center">
                  <p className="text-5xl font-bold text-orange-600 mb-2">
                    {profile.current_streak}
                  </p>
                  <p className="text-sm text-orange-700 font-medium">
                    {t("home.currentStreak")}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    {t("profile.streakStartedOn")}:
                  </p>
                  <p className="text-lg font-bold text-gray-800">
                    {getStreakStartDate()?.toLocaleDateString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium">
                    💡 {t("profile.playTodayToKeepStreak")}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-xs text-gray-600 mb-1">
                      {t("home.record")}
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {profile.longest_streak || 0}
                    </p>
                    <p className="text-xs text-gray-600">
                      {getDayText(profile.longest_streak || 0)}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-xs text-gray-600 mb-1">
                      {(profile.current_streak || 0) >
                      (profile.longest_streak || 0)
                        ? t("profile.keepGoing")
                        : t("profile.daysToBreakRecord")}
                    </p>
                    {(profile.current_streak || 0) <=
                    (profile.longest_streak || 0) ? (
                      <>
                        <p className="text-2xl font-bold text-gray-800">
                          {Math.max(
                            0,
                            (profile.longest_streak || 0) -
                              (profile.current_streak || 0)
                          )}
                        </p>
                        <p className="text-xs text-gray-600">
                          {getDayText(
                            Math.max(
                              0,
                              (profile.longest_streak || 0) -
                                (profile.current_streak || 0)
                            )
                          )}
                        </p>
                      </>
                    ) : (
                      <div className="mt-2">
                        <p className="text-3xl">🔥🎉</p>
                        <p className="text-xs text-emerald-600 font-bold mt-1">
                          +
                          {(profile.current_streak || 0) -
                            (profile.longest_streak || 0)}{" "}
                          {getDayText(
                            (profile.current_streak || 0) -
                              (profile.longest_streak || 0)
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Flame className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">{t("profile.noActiveStreak")}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {t("profile.playToStartStreak")}
                </p>
              </div>
            )}

            <button
              onClick={() => setShowStreakModal(false)}
              className="w-full mt-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
