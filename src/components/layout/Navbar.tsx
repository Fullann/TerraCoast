import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { Avatar } from "../common/Avatar";
import {
  Trophy,
  Home,
  BookOpen,
  Users,
  Shield,
  Swords,
  MessageCircle,
  X,
} from "lucide-react";

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentView = location.pathname;
  const { profile } = useAuth();
  const {
    unreadMessages,
    pendingFriendRequests,
    pendingDuelsToPlay,
    newDuelResults,
  } = useNotifications();
  const { t } = useLanguage();
  const [socialMenuOpen, setSocialMenuOpen] = useState(false);

  const totalSocialNotifications =
    unreadMessages +
    pendingFriendRequests +
    (pendingDuelsToPlay || 0) +
    (newDuelResults || 0);

  return (
    <>
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <button
                onClick={() => navigate("/terra")}
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <img
                  src="/logo.png"
                  alt="TerraCoast Logo"
                  className="h-12 w-auto"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className="ml-3 text-2xl font-bold text-emerald-600">
                  TerraCoast
                </span>
              </button>

              {/* Desktop menu */}
              <div className="hidden md:flex space-x-1">
                <button
                  onClick={() => navigate("/terra")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === "/terra" || currentView === "/"
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Home className="w-5 h-5 inline mr-2" />
                  {t("nav.home")}
                </button>

                <button
                  onClick={() => navigate("/quizzes")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView.startsWith("/quizzes")
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <BookOpen className="w-5 h-5 inline mr-2" />
                  {t("nav.quizzes")}
                </button>

                <button
                  onClick={() => navigate("/leaderboard")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView.startsWith("/leaderboard")
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Trophy className="w-5 h-5 inline mr-2" />
                  {t("nav.leaderboard")}
                </button>

                <button
                  onClick={() => navigate("/friends")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
                    currentView.startsWith("/friends")
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Users className="w-5 h-5 inline mr-2" />
                  {t("nav.friends")}
                  {pendingFriendRequests > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {pendingFriendRequests}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => navigate("/duels")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
                    currentView.startsWith("/duels")
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Swords className="w-5 h-5 inline mr-2" />
                  {t("nav.duels")}
                  {(pendingDuelsToPlay || 0) + (newDuelResults || 0) > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {(pendingDuelsToPlay || 0) + (newDuelResults || 0)}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => navigate("/chat")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors relative ${
                    currentView.startsWith("/chat")
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <MessageCircle className="w-5 h-5 inline mr-2" />
                  {t("nav.chat")}
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {unreadMessages}
                    </span>
                  )}
                </button>

                {profile?.role === "admin" && (
                  <button
                    onClick={() => navigate("/admin")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      currentView.startsWith("/admin")
                        ? "bg-emerald-100 text-emerald-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Shield className="w-5 h-5 inline mr-2" />
                    {t("nav.admin")}
                  </button>
                )}
              </div>
            </div>

            {/* ✅ Bouton profil uniquement (déconnexion supprimée) */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/profile")}
                className="hidden md:block text-right hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                <p className="text-sm font-medium text-gray-800">
                  {profile?.pseudo}
                </p>
                <p className="text-xs text-gray-500">
                  {t("profile.level")} {profile?.level}
                </p>
              </button>

              <button
                type="button"
                onClick={() => navigate("/profile")}
                aria-label={t("nav.profile")}
                title={t("nav.profile")}
                className={`hidden md:block p-2 rounded-lg transition-colors ${
                  currentView.startsWith("/profile")
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Avatar
                  url={(profile as any)?.avatar_url}
                  pseudo={profile?.pseudo}
                  frameStyle={(profile as any)?.frame_style}
                  size="sm"
                />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-40 safe-area-inset-bottom">
        <div className="grid grid-cols-5 h-16">
          <button
            onClick={() => navigate("/terra")}
            className={`flex flex-col items-center justify-center transition-colors ${
              currentView === "/terra" ? "text-emerald-600" : "text-gray-600"
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs mt-1">{t("nav.home")}</span>
          </button>

          <button
            onClick={() => navigate("/quizzes")}
            className={`flex flex-col items-center justify-center transition-colors ${
              currentView.startsWith("/quizzes") ? "text-emerald-600" : "text-gray-600"
            }`}
          >
            <BookOpen className="w-6 h-6" />
            <span className="text-xs mt-1">{t("nav.quizzes")}</span>
          </button>

          <button
            type="button"
            onClick={() => setSocialMenuOpen(!socialMenuOpen)}
            aria-label={t("nav.social")}
            aria-expanded={socialMenuOpen}
            aria-haspopup="dialog"
            className={`flex flex-col items-center justify-center transition-colors relative ${
              currentView.startsWith("/friends") || currentView.startsWith("/duels") || currentView.startsWith("/chat")
                ? "text-emerald-600"
                : "text-gray-600"
            }`}
          >
            <Users className="w-6 h-6" />
            <span className="text-xs mt-1">{t("nav.social")}</span>
            {totalSocialNotifications > 0 && (
              <span className="absolute top-1 right-4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {totalSocialNotifications}
              </span>
            )}
          </button>

          <button
            onClick={() => navigate("/leaderboard")}
            className={`flex flex-col items-center justify-center transition-colors ${
              currentView.startsWith("/leaderboard")
                ? "text-emerald-600"
                : "text-gray-600"
            }`}
          >
            <Trophy className="w-6 h-6" />
            <span className="text-xs mt-1">{t("nav.leaderboard")}</span>
          </button>

          <button
            onClick={() => navigate("/profile")}
            className={`flex flex-col items-center justify-center transition-colors ${
              currentView.startsWith("/profile") ? "text-emerald-600" : "text-gray-600"
            }`}
          >
            <Avatar
              url={(profile as any)?.avatar_url}
              pseudo={profile?.pseudo}
              frameStyle={(profile as any)?.frame_style}
              size="xs"
            />
            <span className="text-xs mt-1">{t("nav.profile")}</span>
          </button>
        </div>
      </div>

      {/* Sous-menu Social Mobile */}
      {socialMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setSocialMenuOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.social")}
            className="fixed bottom-16 left-0 right-0 bg-white rounded-t-2xl shadow-2xl p-4 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                {t("nav.social")}
              </h3>
              <button
                type="button"
                onClick={() => setSocialMenuOpen(false)}
                aria-label={t("common.close")}
                title={t("common.close")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  navigate("/friends");
                  setSocialMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
                  currentView.startsWith("/friends")
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-3" />
                  <span className="font-medium">{t("nav.friends")}</span>
                </div>
                {pendingFriendRequests > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold">
                    {pendingFriendRequests}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  navigate("/duels");
                  setSocialMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
                  currentView.startsWith("/duels")
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center">
                  <Swords className="w-5 h-5 mr-3" />
                  <span className="font-medium">{t("nav.duels")}</span>
                </div>
                {(pendingDuelsToPlay || 0) + (newDuelResults || 0) > 0 && (
                  <div className="flex items-center gap-1">
                    {(pendingDuelsToPlay || 0) > 0 && (
                      <span
                        className="bg-amber-500 text-white text-xs rounded-full px-2 py-1 font-bold"
                        title={t("notifications.toPlay")}
                      >
                        {pendingDuelsToPlay}
                      </span>
                    )}
                    {(newDuelResults || 0) > 0 && (
                      <span
                        className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold"
                        title={t("notifications.newResults")}
                      >
                        {newDuelResults}
                      </span>
                    )}
                  </div>
                )}
              </button>

              <button
                onClick={() => {
                  navigate("/chat");
                  setSocialMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
                  currentView.startsWith("/chat")
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center">
                  <MessageCircle className="w-5 h-5 mr-3" />
                  <span className="font-medium">{t("nav.chat")}</span>
                </div>
                {unreadMessages > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold">
                    {unreadMessages}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          body {
            padding-bottom: 4rem;
          }
          .animate-slide-up {
            animation: slideUp 0.3s ease-out;
          }
          @keyframes slideUp {
            from {
              transform: translateY(100%);
            }
            to {
              transform: translateY(0);
            }
          }
        }
      `}</style>
    </>
  );
}
