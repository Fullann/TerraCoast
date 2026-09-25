import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  BookOpen,
  AlertTriangle,
  Ban,
  CheckCircle2,
} from "lucide-react";
import type { Database } from "../../lib/database.types";
import { DailyChallengeCard } from "../daily/DailyChallengeCard";
import { getDailyQuizForDate } from "../../lib/dailyChallenge";
import { StreakModal } from "../profile/StreakModal";
import { isStreakPlayedToday } from "../../lib/streakUtils";
import { getConquestStats } from "../../lib/conquestManager";
import { DuolingoQuestPath } from "./DuolingoQuestPath";
import {
  getLeagueForXp,
} from "../../lib/gamificationManager";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
type GameSession = Database["public"]["Tables"]["game_sessions"]["Row"];
type Warning = {
  id: string;
  reason: string;
  admin_notes?: string | null;
  created_at: string;
};

export function HomePage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [, setRecentQuizzes] = useState<Quiz[]>([]);
  const [, setRecentSessions] = useState<GameSession[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [dailyQuiz, setDailyQuiz] = useState<Quiz | null>(null);
  const [loadingDailyQuiz, setLoadingDailyQuiz] = useState(true);
  const [stats, setStats] = useState({
    totalPlays: 0,
    averageScore: 0,
    dailyPoints: 0,
    maxDailyPoints: 0,
  });

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
          const pickedDaily = getDailyQuizForDate(allQuizzes);
          setDailyQuiz(pickedDaily);
          setLoadingDailyQuiz(false);

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

  const userLeague = getLeagueForXp(profile?.experience_points || 0);
  const conquest = getConquestStats(profile?.id);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-24 md:pb-10 select-none">
      {/* 👑 En-tête de Bienvenue Gamifié */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
            <span>{t("home.welcome")},</span>
            <span className="text-emerald-600 underline decoration-emerald-300 decoration-wavy decoration-2">
              {profile?.pseudo}
            </span>
            <span>👋</span>
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-500 mt-1">
            Parcours d'apprentissage géographique • Progressez étape par étape !
          </p>
        </div>

        {/* Badges statut compacts sur mobile & tablette */}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            onClick={() => setShowStreakModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-black cursor-pointer shadow-sm border ${
              isStreakPlayedToday(profile?.last_activity_date)
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-600"
                : "bg-orange-50 text-orange-800 border-orange-200"
            }`}
          >
            <span>🔥</span>
            <span>{profile?.current_streak || 0} jours de série</span>
          </div>

          <div
            onClick={() => navigate("/conquest")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-pointer shadow-sm hover:bg-emerald-100"
          >
            <span>🗺️</span>
            <span>{conquest.conquestPercentage}% du Monde</span>
          </div>
        </div>
      </div>

      {profile?.is_banned && (
        <div className="bg-red-50 border-red-400 border-2 rounded-2xl p-5 mb-8 flex items-start space-x-4">
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
        <div className="bg-yellow-50 border-yellow-400 border-2 rounded-2xl p-5 mb-8 flex items-start space-x-4">
          <AlertTriangle className="w-8 h-8 text-yellow-600 flex-shrink-0" />
          <div>
            <h3 className="text-yellow-800 text-xl font-semibold mb-4">
              {t("home.warningsReceived")}
            </h3>
            <div className="space-y-3">
              {warnings.map((warning, idx) => (
                <div
                  key={warning.id}
                  className="bg-white rounded-xl p-4 border border-yellow-200"
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

      {/* 🎮 2-Column Responsive Layout (Duolingo Web & Mobile Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* 🗺️ Colonne Centrale : Le Parcours d'Apprentissage (Winding Quest Path) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col items-center">
          {/* Bannière d'accueil mobile compacte avec raccourcis */}
          <div className="w-full lg:hidden mb-4 space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-amber-500/10 rounded-2xl border border-emerald-200/60">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{userLeague.icon}</span>
                <div>
                  <div className="text-xs font-black text-slate-800">{userLeague.name}</div>
                  <div className="text-[11px] text-slate-500 font-bold">{profile?.experience_points || 0} XP au total</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/leaderboard")}
                className="text-xs font-black text-emerald-700 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-sm active:scale-95"
              >
                Ligues 🏆
              </button>
            </div>

            {/* Mini Défi du Jour sur mobile */}
            <div className="mb-4">
              <DailyChallengeCard quiz={dailyQuiz} loading={loadingDailyQuiz} />
            </div>
          </div>

          {/* Composant Parcours Sinueux Duolingo */}
          <DuolingoQuestPath
            userId={profile?.id}
            onNodeStart={(node) => {
              if (node.category === "flags") {
                navigate("/games");
              } else if (dailyQuiz && node.isBoss) {
                navigate(`/quizzes/play/${dailyQuiz.id}`);
              } else {
                navigate(`/quizzes?search=${encodeURIComponent(node.category)}`);
              }
            }}
          />

          {/* Bouton tactile pour explorer l'ensemble des quiz */}
          <div className="w-full max-w-md my-8 text-center px-4">
            <button
              type="button"
              onClick={() => navigate("/quizzes")}
              className="w-full py-3.5 px-6 btn-duo btn-duo-white text-sm font-black flex items-center justify-center gap-2 shadow-sm"
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>EXPLORER LE CATALOGUE DES 200+ QUIZ 📚</span>
            </button>
          </div>
        </div>

        {/* 🏆 Colonne Latérale : Widgets Gamifiés & Compétition (Desktop Sidebar) */}
        <div className="hidden lg:flex lg:col-span-5 xl:col-span-4 flex-col space-y-6 sticky top-20">
          {/* 1. Défi du Jour */}
          <DailyChallengeCard quiz={dailyQuiz} loading={loadingDailyQuiz} />

          {/* 2. Ligue Duolingo Hebdomadaire */}
          <div className={`card-duo p-5 bg-gradient-to-b ${userLeague.bgGradient}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                Compétition Hebdomadaire
              </span>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white/80 shadow-sm text-slate-800">
                Saison en cours ⚡
              </span>
            </div>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center text-3xl border border-slate-200/80">
                {userLeague.icon}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  {userLeague.name}
                </h3>
                <p className="text-xs font-bold text-slate-600 mt-0.5">
                  {profile?.experience_points || 0} XP • Zone de promotion ⬆️
                </p>
              </div>
            </div>

            <div className="bg-white/80 rounded-2xl p-3 text-xs mb-4 border border-slate-200/60 flex items-center justify-between">
              <span className="text-slate-600 font-bold">Prochaine ligue :</span>
              <span className="font-black text-purple-700">
                {userLeague.tier < 6 ? `Ligue Supérieure (${userLeague.minXp + 500} XP)` : "Palier Maximum 👑"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => navigate("/leaderboard")}
              className="w-full py-2.5 px-4 btn-duo btn-duo-amber text-xs font-black"
            >
              VOIR LE CLASSEMENT DE LA LIGUE 🏆
            </button>
          </div>

          {/* 3. Quêtes du Jour (3/3 Objectifs Gamifiés) */}
          <div className="card-duo p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <span>🎯</span>
                <span>Quêtes du Jour</span>
              </h3>
              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {isStreakPlayedToday(profile?.last_activity_date) ? "2/3" : "1/3"} Complétées
              </span>
            </div>

            <div className="space-y-3.5">
              {/* Quête 1 */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-xl shrink-0 mt-0.5">⚡</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs font-extrabold text-slate-800 mb-1">
                    <span>Gagner 40 XP aujourd'hui</span>
                    <span className="text-emerald-600 font-black">
                      {Math.min(40, stats.dailyPoints || 25)} / 40 XP
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.round(((stats.dailyPoints || 25) / 40) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Quête 2 */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-xl shrink-0 mt-0.5">🗺️</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs font-extrabold text-slate-800 mb-1">
                    <span>Franchir 1 étape du parcours</span>
                    <span className="text-emerald-600 font-black flex items-center gap-0.5">
                      1 / 1 <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="w-full bg-emerald-500 rounded-full h-2" />
                </div>
              </div>

              {/* Quête 3 */}
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="text-xl shrink-0 mt-0.5">🔥</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs font-extrabold text-slate-800 mb-1">
                    <span>Valider la série du jour</span>
                    <span
                      className={`text-xs font-black ${
                        isStreakPlayedToday(profile?.last_activity_date)
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }`}
                    >
                      {isStreakPlayedToday(profile?.last_activity_date) ? "Validée ✅" : "À faire ⏳"}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isStreakPlayedToday(profile?.last_activity_date)
                          ? "bg-emerald-500 w-full"
                          : "bg-amber-400 w-1/4"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Carte de Conquête & Pokédex Géographique */}
          <div
            onClick={() => navigate("/conquest")}
            className="card-duo p-5 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 text-white border-emerald-800/40 shadow-xl cursor-pointer hover:border-emerald-500 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Pokédex Géographique
              </span>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                {conquest.conquestPercentage}% Conquis
              </span>
            </div>

            <h3 className="text-base font-black text-white group-hover:text-emerald-300 transition-colors">
              Carte de Conquête Mondiale 🗺️
            </h3>
            <p className="text-xs text-slate-300 mt-1 mb-3">
              {conquest.conqueredCount} pays explorés sur {conquest.totalCountries} • Dissipez le brouillard et complétez votre collection !
            </p>

            <div className="w-full bg-slate-800 rounded-full h-2.5 p-0.5 mb-4">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.max(4, conquest.conquestPercentage)}%` }}
              />
            </div>

            <button
              type="button"
              className="w-full py-2.5 px-4 btn-duo btn-duo-teal text-xs font-black"
            >
              EXPLORER LA CARTE EN 3D 🧭
            </button>
          </div>

          {/* 5. Arcade & Nouveaux Modes de Jeu */}
          <div className="card-duo p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                Arcade Rapide 🕹️
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500 text-white">
                Nouveautés
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => navigate("/games/geo-detective")}
                className="p-3 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-left transition-all active:scale-95"
              >
                <div className="text-xl mb-1">🛰️</div>
                <div className="text-xs font-black text-slate-800">Geo-Detective</div>
                <div className="text-[10px] text-slate-500 font-bold">Vue Satellite</div>
              </button>

              <button
                type="button"
                onClick={() => navigate("/games/silhouette")}
                className="p-3 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-left transition-all active:scale-95"
              >
                <div className="text-xl mb-1">👤</div>
                <div className="text-xs font-black text-slate-800">Silhouette</div>
                <div className="text-[10px] text-slate-500 font-bold">Blind Map</div>
              </button>

              <button
                type="button"
                onClick={() => navigate("/games/chrono-rush")}
                className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-left transition-all active:scale-95"
              >
                <div className="text-xl mb-1">⚡</div>
                <div className="text-xs font-black text-slate-800">Chrono Rush</div>
                <div className="text-[10px] text-slate-500 font-bold">45 secondes</div>
              </button>

              <button
                type="button"
                onClick={() => navigate("/games/higher-lower")}
                className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-left transition-all active:scale-95"
              >
                <div className="text-xl mb-1">⚖️</div>
                <div className="text-xs font-black text-slate-800">Plus Grand / Petit</div>
                <div className="text-[10px] text-slate-500 font-bold">Duels de stats</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <StreakModal
        isOpen={showStreakModal}
        onClose={() => setShowStreakModal(false)}
        profile={profile}
        onPlayNow={() => {
          if (dailyQuiz) {
            navigate(`/quizzes/play/${dailyQuiz.id}?daily=true`);
          } else {
            navigate("/quizzes");
          }
        }}
      />
    </div>
  );
}

