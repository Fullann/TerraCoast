import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../contexts/NotificationContext";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  Mail,
  UserPlus,
  Swords,
  CheckCircle,
  Trophy,
  AlertCircle,
  Info,
  X,
} from "lucide-react";

export function ToastContainer() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    duelNotification,
    messageNotification,
    friendRequestNotification,
    appNotification,
    clearDuelNotification,
    clearMessageNotification,
    clearFriendRequestNotification,
    clearAppNotification,
  } = useNotifications();

  // Auto-fermeture des toasts
  useEffect(() => {
    if (duelNotification) {
      const timer = setTimeout(clearDuelNotification, 6000);
      return () => clearTimeout(timer);
    }
  }, [duelNotification, clearDuelNotification]);

  useEffect(() => {
    if (messageNotification) {
      const timer = setTimeout(clearMessageNotification, 6000);
      return () => clearTimeout(timer);
    }
  }, [messageNotification, clearMessageNotification]);

  useEffect(() => {
    if (friendRequestNotification) {
      const timer = setTimeout(clearFriendRequestNotification, 6000);
      return () => clearTimeout(timer);
    }
  }, [friendRequestNotification, clearFriendRequestNotification]);

  useEffect(() => {
    if (appNotification) {
      const timer = setTimeout(clearAppNotification, 4500);
      return () => clearTimeout(timer);
    }
  }, [appNotification, clearAppNotification]);

  const hasAnyNotification =
    Boolean(messageNotification) ||
    Boolean(friendRequestNotification) ||
    Boolean(duelNotification) ||
    Boolean(appNotification);

  if (!hasAnyNotification) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full px-4 sm:px-0"
    >
      {/* Toast Message */}
      {messageNotification && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-auto w-full bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border-2 border-blue-500/80 p-4 transition-all transform animate-slide-in-right backdrop-blur-md"
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {t("notifications.newMessage")}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 truncate">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {messageNotification.from}
                </span>{" "}
                : {messageNotification.message}
              </p>
              <button
                type="button"
                onClick={() => {
                  navigate("/chat");
                  clearMessageNotification();
                }}
                className="mt-3 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                {t("notifications.viewMessage")}
              </button>
            </div>
            <button
              type="button"
              onClick={clearMessageNotification}
              aria-label={t("common.close")}
              title={t("common.close")}
              className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Toast Friend Request */}
      {friendRequestNotification && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-auto w-full bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border-2 border-purple-500/80 p-4 transition-all transform animate-slide-in-right backdrop-blur-md"
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50">
              <UserPlus className="w-5 h-5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {t("notifications.newFriendRequest")}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                <span className="font-semibold text-gray-900 dark:text-white">
                  {friendRequestNotification.from}
                </span>{" "}
                {t("notifications.wantsFriend")}
              </p>
              <button
                type="button"
                onClick={() => {
                  navigate("/friends");
                  clearFriendRequestNotification();
                }}
                className="mt-3 w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                {t("notifications.viewRequests")}
              </button>
            </div>
            <button
              type="button"
              onClick={clearFriendRequestNotification}
              aria-label={t("common.close")}
              title={t("common.close")}
              className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Toast Duel */}
      {duelNotification && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-auto w-full bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border-2 border-emerald-500/80 p-4 transition-all transform animate-slide-in-right backdrop-blur-md"
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
              {duelNotification.type === "invitation" && (
                <Swords className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              )}
              {duelNotification.type === "accepted" && (
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              )}
              {duelNotification.type === "completed" && (
                <Trophy className="w-5 h-5 text-amber-500 dark:text-amber-400" aria-hidden="true" />
              )}
              {duelNotification.type === "found" && (
                <Swords className="w-5 h-5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {duelNotification.type === "invitation" && (
                <div
                  className="cursor-pointer text-sm text-gray-700 dark:text-gray-200"
                  onClick={() => {
                    navigate("/duels", { state: { tab: "invitations" } });
                    clearDuelNotification();
                  }}
                >
                  <strong className="text-gray-900 dark:text-white">{duelNotification.from}</strong>{" "}
                  {t("notifications.challengedYou")}{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400">{duelNotification.quizTitle}</strong>
                </div>
              )}
              {duelNotification.type === "accepted" && (
                <div
                  className="cursor-pointer text-sm text-gray-700 dark:text-gray-200"
                  onClick={() => {
                    navigate("/duels", { state: { tab: "active" } });
                    clearDuelNotification();
                  }}
                >
                  <strong className="text-gray-900 dark:text-white">{duelNotification.from}</strong>{" "}
                  {t("notifications.acceptedDuel")}{" "}
                  <strong className="text-blue-600 dark:text-blue-400">{duelNotification.quizTitle}</strong>
                </div>
              )}
              {duelNotification.type === "completed" && (
                <div
                  className="cursor-pointer text-sm text-gray-700 dark:text-gray-200"
                  onClick={() => {
                    navigate("/duels", { state: { tab: "history" } });
                    clearDuelNotification();
                  }}
                >
                  {t("notifications.duelFinished")}{" "}
                  <strong className="text-gray-900 dark:text-white">{duelNotification.from}</strong>{" "}
                  {t("notifications.on")}{" "}
                  <strong className="text-amber-600 dark:text-amber-400">{duelNotification.quizTitle}</strong>
                </div>
              )}
              {duelNotification.type === "found" && (
                <div
                  className="cursor-pointer text-sm text-gray-700 dark:text-gray-200"
                  onClick={() => {
                    navigate("/duels", { state: { tab: "matchmaking" } });
                    clearDuelNotification();
                  }}
                >
                  <strong className="text-purple-600 dark:text-purple-400">{t("duels.matchFound")}</strong> -{" "}
                  <strong className="text-gray-900 dark:text-white">{duelNotification.from}</strong>{" "}
                  {t("notifications.on")}{" "}
                  <strong>{duelNotification.quizTitle}</strong>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  if (duelNotification.type === "completed") {
                    navigate("/duels", { state: { tab: "history" } });
                  } else if (duelNotification.type === "found") {
                    navigate("/duels", { state: { tab: "matchmaking" } });
                  } else if (duelNotification.type === "accepted") {
                    navigate("/duels", { state: { tab: "active" } });
                  } else {
                    navigate("/duels", { state: { tab: "invitations" } });
                  }
                  clearDuelNotification();
                }}
                className="mt-3 w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                {duelNotification.type === "completed"
                  ? t("duels.viewResults")
                  : t("notifications.viewDuels")}
              </button>
            </div>
            <button
              type="button"
              onClick={clearDuelNotification}
              aria-label={t("common.close")}
              title={t("common.close")}
              className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Toast App */}
      {appNotification && (
        <div
          role="status"
          aria-live="polite"
          className={`pointer-events-auto w-full bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border-2 p-4 transition-all transform animate-slide-in-right backdrop-blur-md ${
            appNotification.type === "success"
              ? "border-emerald-500/80"
              : appNotification.type === "error"
              ? "border-red-500/80"
              : "border-sky-500/80"
          }`}
        >
          <div className="flex items-start space-x-3">
            <div
              className={`flex-shrink-0 p-1.5 rounded-xl ${
                appNotification.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/50"
                  : appNotification.type === "error"
                  ? "bg-red-50 dark:bg-red-950/50"
                  : "bg-sky-50 dark:bg-sky-950/50"
              }`}
            >
              {appNotification.type === "success" ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              ) : appNotification.type === "error" ? (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden="true" />
              ) : (
                <Info className="w-5 h-5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{appNotification.message}</p>
            </div>
            <button
              type="button"
              onClick={clearAppNotification}
              aria-label={t("common.close")}
              title={t("common.close")}
              className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
