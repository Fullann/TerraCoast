import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Trophy,
  Flame,
  ArrowRight,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  getTimeUntilNextChallenge,
  fetchDailyLeaderboard,
  fetchUserDailyStatus,
  type DailyLeaderboardEntry,
} from "../../lib/dailyChallenge";
import { DailyLeaderboardModal } from "./DailyLeaderboardModal";
import type { Database } from "../../lib/database.types";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];

interface DailyChallengeCardProps {
  quiz: Quiz | null;
  loading?: boolean;
}

export function DailyChallengeCard({ quiz, loading }: DailyChallengeCardProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { profile } = useAuth();

  const [countdown, setCountdown] = useState(getTimeUntilNextChallenge().formatted);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [leaderboardEntries, setLeaderboardEntries] = useState<DailyLeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [userDailyEntry, setUserDailyEntry] = useState<DailyLeaderboardEntry | null>(null);

  // Mise à jour continue du compte à rebours
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilNextChallenge().formatted);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Chargement des données du jour pour ce quiz
  useEffect(() => {
    if (!quiz) return;

    let isMounted = true;
    setLeaderboardLoading(true);

    fetchDailyLeaderboard(quiz.id)
      .then((entries) => {
        if (!isMounted) return;
        setLeaderboardEntries(entries);
        setLeaderboardLoading(false);
      })
      .catch(() => {
        if (isMounted) setLeaderboardLoading(false);
      });

    if (profile?.id) {
      fetchUserDailyStatus(quiz.id, profile.id).then((status) => {
        if (isMounted) {
          setUserDailyEntry(status.userBestEntry);
        }
      });
    }

    return () => {
      isMounted = false;
    };
  }, [quiz, profile?.id]);

  if (loading || !quiz) {
    return (
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 rounded-2xl p-6 border border-amber-200/50 animate-pulse">
        <div className="h-6 w-48 bg-amber-200/60 rounded-md mb-4" />
        <div className="h-8 w-3/4 bg-amber-200/40 rounded-md mb-3" />
        <div className="h-4 w-1/2 bg-amber-200/30 rounded-md" />
      </div>
    );
  }

  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const difficultyColors = {
    easy: "bg-emerald-100 text-emerald-800 border-emerald-300",
    medium: "bg-amber-100 text-amber-800 border-amber-300",
    hard: "bg-rose-100 text-rose-800 border-rose-300",
  };

  const difficultyKey = quiz.difficulty as "easy" | "medium" | "hard";

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-6 sm:p-7 text-white shadow-xl hover:shadow-2xl transition-all duration-300">
        {/* Background decorative glow effects */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-amber-300/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Main Info */}
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-black uppercase tracking-wider shadow-sm">
                <Calendar className="w-3.5 h-3.5 text-amber-200" />
                {t("daily.title") || "Quiz du Jour"}
              </span>

              <span className="text-amber-100 text-xs font-medium capitalize">
                • {todayFormatted}
              </span>

              <div className="ml-auto lg:ml-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/25 backdrop-blur-sm text-xs font-semibold text-amber-100">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                <span>{countdown}</span>
              </div>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm line-clamp-1">
                {quiz.title}
              </h2>
              {quiz.description && (
                <p className="text-amber-100/90 text-sm mt-1 line-clamp-2 leading-relaxed">
                  {quiz.description}
                </p>
              )}
            </div>

            {/* Quiz Badges / Meta */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                  difficultyColors[difficultyKey] || "bg-white/20 text-white border-white/30"
                }`}
              >
                {quiz.difficulty.toUpperCase()}
              </span>

              {quiz.category && (
                <span className="inline-flex items-center gap-1 text-xs bg-white/15 px-2.5 py-0.5 rounded-full backdrop-blur-sm text-white font-medium capitalize">
                  <HelpCircle className="w-3.5 h-3.5" />
                  {quiz.category}
                </span>
              )}

              <span className="inline-flex items-center gap-1 text-xs bg-white/15 px-2.5 py-0.5 rounded-full backdrop-blur-sm text-white font-medium">
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                {t("daily.streakBonus") || "+ Bonus Flamme 🔥"}
              </span>
            </div>
          </div>

          {/* Right Action & User Status Section */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-3 shrink-0">
            {/* User Daily Status Card */}
            {userDailyEntry ? (
              <div className="w-full sm:w-auto bg-black/20 backdrop-blur-md rounded-xl p-3 border border-white/20 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {userDailyEntry.rank === 1
                      ? "🥇"
                      : userDailyEntry.rank === 2
                      ? "🥈"
                      : userDailyEntry.rank === 3
                      ? "🥉"
                      : "🎯"}
                  </span>
                  <div>
                    <span className="text-[11px] text-amber-200 uppercase font-bold block">
                      {t("daily.completedToday") || "Défi Réussi !"}
                    </span>
                    <span className="text-sm font-black text-white">
                      {userDailyEntry.score} pts (Rang #{userDailyEntry.rank})
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setLeaderboardOpen(true)}
                  className="text-xs bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg transition-colors font-semibold"
                >
                  Voir
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-amber-100 font-medium">
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>
                  {t("daily.challengeCommunityPrompt") || "Toute la communauté s'affronte aujourd'hui !"}
                </span>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setLeaderboardOpen(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-sm backdrop-blur-md border border-white/25 transition-all"
                title={t("daily.viewLeaderboard") || "Classement du Jour"}
              >
                <Trophy className="w-4 h-4 text-amber-200" />
                <span className="hidden sm:inline">
                  {t("daily.todayRanking") || "Classement"}
                </span>
                {leaderboardEntries.length > 0 && (
                  <span className="text-xs px-1.5 py-0.2 bg-white/25 rounded-full">
                    {leaderboardEntries.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => navigate(`/quizzes/play/${quiz.id}?daily=true`)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-amber-50 text-orange-600 font-black text-sm shadow-lg hover:shadow-xl hover:scale-102 active:scale-98 transition-all"
              >
                <span>
                  {userDailyEntry
                    ? t("daily.replayChallenge") || "Rejouer"
                    : t("daily.playChallenge") || "Relever le Défi"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Leaderboard Modal */}
      <DailyLeaderboardModal
        isOpen={leaderboardOpen}
        onClose={() => setLeaderboardOpen(false)}
        entries={leaderboardEntries}
        loading={leaderboardLoading}
        currentUserId={profile?.id}
        quizTitle={quiz.title}
      />
    </>
  );
}
