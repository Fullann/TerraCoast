import { X, Clock, Award, Flame } from "lucide-react";
import { Avatar } from "../common/Avatar";
import { useLanguage } from "../../contexts/LanguageContext";
import type { DailyLeaderboardEntry } from "../../lib/dailyChallenge";

interface DailyLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: DailyLeaderboardEntry[];
  loading: boolean;
  currentUserId?: string;
  quizTitle: string;
}

export function DailyLeaderboardModal({
  isOpen,
  onClose,
  entries,
  loading,
  currentUserId,
  quizTitle,
}: DailyLeaderboardModalProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const topThree = entries.slice(0, 3);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-amber-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors text-white"
            title={t("common.close")}
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shadow-inner">
              🏆
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-300/30 border border-amber-200 text-white text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {t("daily.badge") || "Défi Quotidien"}
                </span>
                <span className="text-amber-100 text-xs flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
                  {t("daily.todayRanking") || "Classement du Jour"}
                </span>
              </div>
              <h2 className="text-xl font-black mt-1 line-clamp-1">{quizTitle}</h2>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">{t("common.loading")}</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 bg-amber-50/60 rounded-2xl border border-dashed border-amber-200">
              <span className="text-5xl mb-3 block">🌟</span>
              <h3 className="text-lg font-bold text-gray-800">
                {t("daily.noEntriesTitle") || "Sois le premier sur le podium !"}
              </h3>
              <p className="text-sm text-gray-600 mt-1 max-w-md mx-auto">
                {t("daily.noEntriesDesc") ||
                  "Personne n'a encore enregistré de score aujourd'hui sur ce quiz. Joue dès maintenant pour prendre la tête du classement !"}
              </p>
            </div>
          ) : (
            <>
              {/* Podium for top 3 */}
              {topThree.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 pb-2 items-end">
                  {/* 2nd Place */}
                  {topThree[1] ? (
                    <div className="flex flex-col items-center p-3 rounded-xl bg-gray-50 border border-gray-200 relative order-1">
                      <span className="text-2xl mb-1">🥈</span>
                      <Avatar
                        url={topThree[1].avatarUrl}
                        pseudo={topThree[1].pseudo}
                        frameStyle={topThree[1].frameStyle}
                        size="md"
                      />
                      <p className="text-xs sm:text-sm font-bold text-gray-800 mt-2 line-clamp-1 text-center">
                        {topThree[1].pseudo}
                      </p>
                      <span className="text-sm sm:text-base font-black text-gray-700 mt-1">
                        {topThree[1].score} pts
                      </span>
                      <span className="text-[11px] text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {topThree[1].timeTakenSeconds}s
                      </span>
                    </div>
                  ) : (
                    <div className="order-1" />
                  )}

                  {/* 1st Place */}
                  {topThree[0] && (
                    <div className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-b from-amber-50 to-orange-50 border-2 border-amber-300 relative order-2 shadow-md scale-105">
                      <span className="text-3xl mb-1 animate-bounce">🥇</span>
                      <Avatar
                        url={topThree[0].avatarUrl}
                        pseudo={topThree[0].pseudo}
                        frameStyle={topThree[0].frameStyle}
                        size="lg"
                      />
                      <p className="text-sm sm:text-base font-black text-gray-900 mt-2 line-clamp-1 text-center">
                        {topThree[0].pseudo}
                      </p>
                      <span className="text-base sm:text-lg font-black text-orange-600 mt-1">
                        {topThree[0].score} pts
                      </span>
                      <span className="text-xs text-orange-700 font-semibold flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        {topThree[0].accuracyPercentage}% ({topThree[0].timeTakenSeconds}s)
                      </span>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {topThree[2] ? (
                    <div className="flex flex-col items-center p-3 rounded-xl bg-amber-50/40 border border-amber-200 relative order-3">
                      <span className="text-2xl mb-1">🥉</span>
                      <Avatar
                        url={topThree[2].avatarUrl}
                        pseudo={topThree[2].pseudo}
                        frameStyle={topThree[2].frameStyle}
                        size="md"
                      />
                      <p className="text-xs sm:text-sm font-bold text-gray-800 mt-2 line-clamp-1 text-center">
                        {topThree[2].pseudo}
                      </p>
                      <span className="text-sm sm:text-base font-black text-amber-800 mt-1">
                        {topThree[2].score} pts
                      </span>
                      <span className="text-[11px] text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {topThree[2].timeTakenSeconds}s
                      </span>
                    </div>
                  ) : (
                    <div className="order-3" />
                  )}
                </div>
              )}

              {/* Leaderboard rows */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 px-1">
                  {t("daily.allParticipants") || "Tous les participants du jour"} ({entries.length})
                </h4>

                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                  {entries.map((entry) => {
                    const isCurrentUser = entry.playerId === currentUserId;
                    return (
                      <div
                        key={entry.sessionId}
                        className={`flex items-center justify-between p-3 transition-colors ${
                          isCurrentUser
                            ? "bg-orange-100/70 font-semibold border-l-4 border-orange-500"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 text-center font-bold text-sm ${
                              entry.rank === 1
                                ? "text-amber-500 font-extrabold"
                                : entry.rank === 2
                                ? "text-gray-400 font-extrabold"
                                : entry.rank === 3
                                ? "text-amber-700 font-extrabold"
                                : "text-gray-500"
                            }`}
                          >
                            #{entry.rank}
                          </span>
                          <Avatar
                            url={entry.avatarUrl}
                            pseudo={entry.pseudo}
                            frameStyle={entry.frameStyle}
                            size="sm"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-gray-900">
                                {entry.pseudo}
                              </span>
                              {isCurrentUser && (
                                <span className="text-[10px] bg-orange-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                                  {t("common.you") || "Moi"}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              Niv. {entry.level} • {entry.accuracyPercentage}% précision
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-black text-orange-600 block">
                            {entry.score} pts
                          </span>
                          <span className="text-xs text-gray-400 flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3" />
                            {entry.timeTakenSeconds}s
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-sm transition-colors"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}
