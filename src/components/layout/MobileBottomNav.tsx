import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import { useNotifications } from "../../contexts/NotificationContext";
import {
  Map,
  Gamepad2,
  Compass,
  Trophy,
  User,
} from "lucide-react";

export function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const {
    unreadMessages,
    pendingFriendRequests,
    pendingDuelsToPlay,
    newDuelResults,
  } = useNotifications();

  const totalNotifications =
    unreadMessages +
    pendingFriendRequests +
    (pendingDuelsToPlay || 0) +
    (newDuelResults || 0);

  const currentPath = location.pathname;

  const navItems = [
    {
      id: "parcours",
      label: "Parcours",
      icon: Map,
      emoji: "🗺️",
      path: "/terra",
      isActive: currentPath === "/terra" || currentPath === "/",
      color: "text-emerald-600",
      activeBg: "bg-emerald-50 text-emerald-600 border-emerald-300",
      pillBg: "bg-emerald-500",
    },
    {
      id: "arcade",
      label: "Arcade",
      icon: Gamepad2,
      emoji: "🕹️",
      path: "/games",
      isActive: currentPath.startsWith("/games"),
      color: "text-amber-600",
      activeBg: "bg-amber-50 text-amber-600 border-amber-300",
      pillBg: "bg-amber-500",
      badge: "Nouveau",
    },
    {
      id: "atlas",
      label: "Atlas",
      icon: Compass,
      emoji: "🧭",
      path: "/atlas",
      isActive: currentPath.startsWith("/atlas") || currentPath.startsWith("/conquest"),
      color: "text-teal-600",
      activeBg: "bg-teal-50 text-teal-600 border-teal-300",
      pillBg: "bg-teal-500",
    },
    {
      id: "leaderboard",
      label: "Ligues",
      icon: Trophy,
      emoji: "🏆",
      path: "/leaderboard",
      isActive: currentPath.startsWith("/leaderboard"),
      color: "text-amber-500",
      activeBg: "bg-yellow-50 text-amber-600 border-amber-300",
      pillBg: "bg-amber-500",
    },
    {
      id: "profile",
      label: t("nav.profile") || "Profil",
      icon: User,
      emoji: "👤",
      path: "/profile",
      isActive: currentPath.startsWith("/profile") || currentPath.startsWith("/friends"),
      color: "text-indigo-600",
      activeBg: "bg-indigo-50 text-indigo-600 border-indigo-300",
      pillBg: "bg-indigo-600",
      badgeCount: totalNotifications,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t-2 border-slate-200/90 shadow-[0_-4px_25px_rgba(0,0,0,0.07)] px-2 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom,0.6rem))] select-none">
      <nav className="grid grid-cols-5 gap-1 max-w-md mx-auto items-center">
        {navItems.map((item) => {
          const active = item.isActive;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.path)}
              className={`group relative flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all duration-150 active:scale-95 touch-manipulation ${
                active ? "font-black" : "font-semibold text-slate-500 hover:text-slate-700"
              }`}
            >
              <div
                className={`relative flex items-center justify-center w-11 h-9 rounded-2xl transition-all duration-200 ${
                  active
                    ? "bg-slate-100 shadow-inner scale-105 border border-slate-200"
                    : "group-hover:bg-slate-50"
                }`}
              >
                <span className="text-xl" role="img" aria-hidden="true">
                  {item.emoji}
                </span>

                {/* Notification count */}
                {item.badgeCount && item.badgeCount > 0 ? (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center shadow-md animate-pulse">
                    {item.badgeCount}
                  </span>
                ) : null}

                {/* New badge */}
                {item.badge && !active && (
                  <span className="absolute -top-1 -right-2 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[8px] font-black px-1 rounded-full uppercase tracking-tighter">
                    {item.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[11px] mt-0.5 tracking-tight transition-colors ${
                  active ? "text-slate-900 font-extrabold" : "text-slate-500"
                }`}
              >
                {item.label}
              </span>

              {/* Active tactile bottom indicator pill */}
              {active && (
                <span className={`w-3.5 h-1 rounded-full mt-0.5 ${item.pillBg} shadow-sm animate-duo-bounce`} />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
