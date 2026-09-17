import { useNavigate } from "react-router-dom";
import { X, Award, Calendar, ChevronRight, Check } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  isStreakPlayedToday,
  isStreakAtRisk,
  getNextStreakMilestone,
  getWeekStreakStatus,
} from "../../lib/streakUtils";
import type { Database } from "../../lib/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  onPlayNow?: () => void;
}

export function StreakModal({
  isOpen,
  onClose,
  profile,
  onPlayNow,
}: StreakModalProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (!isOpen) return null;

  const currentStreak = profile?.current_streak || 0;
  const longestStreak = profile?.longest_streak || 0;
  const lastActivityDate = profile?.last_activity_date;

  const playedToday = isStreakPlayedToday(lastActivityDate);
  const atRisk = isStreakAtRisk(lastActivityDate, currentStreak);
  const milestone = getNextStreakMilestone(currentStreak);
  const weekDays = getWeekStreakStatus(lastActivityDate, currentStreak);

  const handleAction = () => {
    onClose();
    if (onPlayNow) {
      onPlayNow();
    } else {
      navigate("/quizzes");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-orange-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Flame Banner */}
        <div className="relative bg-gradient-to-b from-orange-500 via-amber-500 to-orange-600 text-white p-6 text-center overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 text-white transition-colors"
            title={t("common.close")}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-5xl shadow-inner mb-3">
              <span className={playedToday ? "animate-bounce" : "animate-pulse"}>
                🔥
              </span>
            </div>

            <div className="text-5xl font-black tracking-tight drop-shadow-sm">
              {currentStreak}
            </div>
            <p className="text-orange-100 font-bold uppercase tracking-wider text-xs mt-1">
              {currentStreak > 1
                ? t("streak.daysStreak") || "Jours Consécutifs de Flamme"
                : t("streak.dayStreak") || "Jour de Flamme"}
            </p>

            {/* Status Pill */}
            <div className="mt-3">
              {playedToday ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-xs font-black shadow-sm">
                  <Check className="w-3.5 h-3.5" />
                  {t("streak.validatedToday") || "Série validée pour aujourd'hui !"}
                </span>
              ) : atRisk ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black shadow-sm animate-pulse">
                  ⚠️ {t("streak.dangerPrompt") || "Série en danger ! Joue avant minuit"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/25 text-amber-100 text-xs font-semibold">
                  {t("streak.startPrompt") || "Joue aujourd'hui pour allumer ta flamme !"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Week Calendar (Mon -> Sun) */}
          <div>
            <div className="flex items-center justify-between mb-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-orange-500" />
                {t("streak.weekProgress") || "Cette Semaine"}
              </span>
              <span className="text-gray-400">Lun - Dim</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 bg-orange-50/50 p-3 rounded-2xl border border-orange-100">
              {weekDays.map((d, index) => (
                <div
                  key={index}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                    d.isToday
                      ? "bg-white shadow-md border-2 border-orange-400"
                      : d.isCompleted
                      ? "bg-orange-100/70"
                      : "bg-transparent"
                  }`}
                >
                  <span
                    className={`text-[11px] font-bold ${
                      d.isToday ? "text-orange-600" : "text-gray-500"
                    }`}
                  >
                    {d.dayLabel}
                  </span>
                  <div className="mt-1 flex items-center justify-center w-7 h-7">
                    {d.isCompleted ? (
                      <span className="text-base" title="Complété !">
                        🔥
                      </span>
                    ) : d.isToday ? (
                      <div className="w-6 h-6 rounded-full border-2 border-dashed border-orange-400 flex items-center justify-center text-xs font-bold text-orange-600">
                        {d.dayNumber}
                      </div>
                    ) : (
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          d.isPast ? "bg-gray-300" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Milestone */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-2xl border border-orange-200/70 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-orange-950 flex items-center gap-1.5">
                <span className="text-base">{milestone.badgeEmoji}</span>
                {milestone.label} ({milestone.nextDays} jours)
              </span>
              <span className="text-orange-700">
                {currentStreak}/{milestone.nextDays} jours
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-orange-200/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${milestone.progressPercent}%` }}
              />
            </div>

            <p className="text-[11px] text-orange-800 font-medium text-right">
              {milestone.remainingDays > 0
                ? `Plus que ${milestone.remainingDays} jour${
                    milestone.remainingDays > 1 ? "s" : ""
                  } pour atteindre ce palier !`
                : "Palier validé ! 🎉"}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-xl text-center border border-gray-100">
              <span className="text-xs text-gray-500 font-semibold block">
                {t("home.record") || "Meilleure Série"}
              </span>
              <span className="text-xl font-black text-gray-800 mt-0.5 block">
                {longestStreak} {longestStreak > 1 ? "jours" : "jour"}
              </span>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl text-center border border-gray-100">
              <span className="text-xs text-gray-500 font-semibold block">
                {t("streak.totalFire") || "Bonus XP Flamme"}
              </span>
              <span className="text-xl font-black text-orange-600 mt-0.5 block flex items-center justify-center gap-1">
                <Award className="w-4 h-4 text-orange-500" />
                +{Math.min(50, currentStreak * 5)}%
              </span>
            </div>
          </div>

          {/* Call to action */}
          <button
            onClick={handleAction}
            className={`w-full py-3.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
              playedToday
                ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/25 hover:scale-101 active:scale-99"
            }`}
          >
            <span>
              {playedToday
                ? t("streak.playMore") || "Continuer à s'entraîner"
                : t("streak.playNow") || "Jouer pour valider ma flamme 🔥"}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
