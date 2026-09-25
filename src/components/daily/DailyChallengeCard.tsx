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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 p-5 sm:p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-orange-400/30">
        {/* Background decorative glow effects */}
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-44 h-44 rounded-full bg-amber-300/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-3.5">
          {/* Top Bar: Header pill + Countdown */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-black uppercase tracking-wider shadow-sm text-white shrink-0">
                <Calendar className="w-3.5 h-3.5 text-amber-200" />
                {t("daily.title") || "Quiz du Jour"}
              </span>
              <span className="text-amber-100 text-xs font-medium capitalize truncate hidden sm:inline">
                • {todayFormatted}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/25 backdrop-blur-sm text-xs font-bold text-amber-200 border border-white/10 shadow-inner shrink-0">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>{countdown}</span>
            </div>
          </div>

          {/* Quiz Title & Description */}
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-sm leading-snug line-clamp-2">
              {quiz.title}
            </h2>
            {quiz.description && (
              <p className="text-amber-100/90 text-xs sm:text-sm mt-1 line-clamp-2 leading-relaxed">
                {quiz.description}
              </p>
            )}
          </div>

          {/* Quiz Badges */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span
              className={`text-[11px] px-2.5 py-0.5 rounded-full font-black border ${
                difficultyColors[difficultyKey] || "bg-white/20 text-white border-white/30"
              }`}
            >
              {quiz.difficulty.toUpperCase()}
            </span>

            {quiz.category && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-white/15 px-2.5 py-0.5 rounded-full backdrop-blur-sm text-white font-bold capitalize">
                <HelpCircle className="w-3 h-3 text-amber-200" />
                {quiz.category}
              </span>
            )}

            <span className="inline-flex items-center gap-1 text-[11px] bg-white/15 px-2.5 py-0.5 rounded-full backdrop-blur-sm text-amber-200 font-bold">
              <Flame className="w-3 h-3 text-amber-300 fill-amber-300" />
              {t("daily.streakBonus") || "+ Bonus Flamme 🔥"}
            </span>
          </div>

          {/* User Score or Community Prompt */}
          {userDailyEntry ? (
            <div className="bg-black/25 backdrop-blur-md rounded-2xl p-3 border border-white/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-2xl shrink-0">
                  {userDailyEntry.rank === 1
                    ? "🥇"
                    : userDailyEntry.rank === 2
                    ? "🥈"
                    : userDailyEntry.rank === 3
                    ? "🥉"
                    : "🎯"}
                </span>
                <div className="min-w-0">
                  <span className="text-[10px] text-amber-200 uppercase font-black tracking-wide block">
                    {t("daily.completedToday") || "Défi Réussi !"}
                  </span>
                  <span className="text-sm font-black text-white truncate block">
                    {userDailyEntry.score} pts • Rang #{userDailyEntry.rank}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLeaderboardOpen(true)}
                className="text-xs bg-white/25 hover:bg-white/35 text-white px-3 py-1.5 rounded-xl transition-all font-black border border-white/20 active:scale-95 shrink-0"
              >
                Voir
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-100 font-bold bg-black/15 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0 animate-pulse" />
              <span className="truncate">
                {t("daily.challengeCommunityPrompt") || "Toute la communauté s'affronte aujourd'hui !"}
              </span>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => navigate(`/quizzes/play/${quiz.id}?daily=true`)}
              className="flex-1 py-3 px-4 rounded-2xl bg-white hover:bg-amber-50 text-orange-600 font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 border-2 border-white border-b-4 border-b-amber-200 active:translate-y-0.5 active:border-b-2"
            >
              <span>
                {userDailyEntry
                  ? t("daily.replayChallenge") || "Rejouer le Défi"
                  : t("daily.playChallenge") || "RELEVER LE DÉFI"}
              </span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>

            <button
              type="button"
              onClick={() => setLeaderboardOpen(true)}
              className="py-3 px-3.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-black text-xs sm:text-sm backdrop-blur-md border-2 border-white/20 border-b-4 border-b-black/20 transition-all flex items-center justify-center gap-1.5 active:translate-y-0.5 active:border-b-2 shrink-0"
              title={t("daily.viewLeaderboard") || "Classement du Jour"}
            >
              <Trophy className="w-4 h-4 text-amber-200" />
              <span>{t("daily.todayRanking") || "Classement"}</span>
              {leaderboardEntries.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 bg-white/30 text-white font-black rounded-full">
                  {leaderboardEntries.length}
                </span>
              )}
            </button>
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
