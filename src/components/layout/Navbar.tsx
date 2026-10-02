import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { Avatar } from "../common/Avatar";
import {
  Trophy,
  BookOpen,
  Users,
  Shield,
  Swords,
  Gamepad2,
  MessageCircle,
  X,
  Compass,
  Sparkles,
  Map as MapIcon,
  ChevronDown,
  Settings,
  LogOut,
  User,
  Dumbbell,
  Award,
  ShoppingBag,
} from "lucide-react";
import { StreakModal } from "../profile/StreakModal";
import { ShopModal } from "../shop/ShopModal";
import { isStreakPlayedToday, isStreakAtRisk } from "../../lib/streakUtils";
import {
  getPlayerGamificationState,
  getUserLeagueProgress,
  getActiveTitleDetails,
} from "../../lib/gamificationManager";
import { MobileBottomNav } from "./MobileBottomNav";

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentView = location.pathname;
  const { profile, signOut } = useAuth();
  const {
    unreadMessages,
    pendingFriendRequests,
    pendingDuelsToPlay,
    newDuelResults,
  } = useNotifications();
  const { t } = useLanguage();
  const [socialMenuOpen, setSocialMenuOpen] = useState(false);
  const [streakModalOpen, setStreakModalOpen] = useState(false);
  const [shopModalOpen, setShopModalOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<"arcade" | "atlas" | "social" | "profile" | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const [gamification, setGamification] = useState(() =>
    getPlayerGamificationState(profile?.id)
  );

  useEffect(() => {
    setGamification(getPlayerGamificationState(profile?.id));

    const handleUpdate = () => {
      setGamification(getPlayerGamificationState(profile?.id));
    };

    window.addEventListener("terracost_gamification_updated", handleUpdate);
    return () => {
      window.removeEventListener("terracost_gamification_updated", handleUpdate);
    };
  }, [profile?.id]);

  // Ferme les menus au changement d'URL
  useEffect(() => {
    setOpenDropdown(null);
  }, [currentView]);

  // Ferme les menus lors d'un clic en dehors
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);



  const totalSocialNotifications =
    unreadMessages +
    pendingFriendRequests +
    (pendingDuelsToPlay || 0) +
    (newDuelResults || 0);

  return (
    <>
      <nav
        ref={navRef}
        className="bg-white/95 backdrop-blur-md border-b-2 border-slate-200 shadow-sm sticky top-0 z-40 select-none"
      >
        <div className="w-full max-w-[1720px] mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-16 sm:h-18 py-1.5 gap-2 lg:gap-3">
            {/* 🌍 Logo & Brand */}
            <div className="flex items-center gap-1 sm:gap-2 xl:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setOpenDropdown(null);
                  navigate("/terra");
                }}
                className="flex items-center shrink-0 hover:scale-105 active:scale-95 transition-transform"
              >
                <img
                  src="/logo.png"
                  alt="TerraCoast Logo"
                  className="h-8 sm:h-9 md:h-10 w-auto shrink-0 drop-shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className="ml-1.5 sm:ml-2 text-base lg:text-lg xl:text-xl font-black tracking-tight text-emerald-600 whitespace-nowrap shrink-0">
                  TerraCoast
                </span>
              </button>

              {/* 🎮 Duolingo Desktop Tactile 5-Tab System */}
              <div className="hidden md:flex items-center gap-1 lg:gap-1.5 xl:gap-2 shrink-0">
                {/* 1. 🗺️ PARCOURS */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown(null);
                    navigate("/terra");
                  }}
                  title="Parcours & Missions"
                  className={`flex items-center gap-1 xl:gap-1.5 px-2 lg:px-2.5 xl:px-3 py-1.5 lg:py-2 rounded-2xl text-xs xl:text-sm font-black transition-all duration-100 border-2 border-b-4 active:translate-y-0.5 active:border-b-2 whitespace-nowrap shrink-0 ${
                    currentView === "/terra" || currentView === "/"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-400 border-b-emerald-600 shadow-sm"
                      : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-200"
                  }`}
                >
                  <MapIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="hidden lg:inline">PARCOURS</span>
                </button>

                {/* 2. 🕹️ ARCADE & QUIZ (Dropdown) */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenDropdown(openDropdown === "arcade" ? null : "arcade")
                    }
                    title="Modes Arcade & Quiz"
                    className={`flex items-center gap-1 xl:gap-1.5 px-2 lg:px-2.5 xl:px-3 py-1.5 lg:py-2 rounded-2xl text-xs xl:text-sm font-black transition-all duration-100 border-2 border-b-4 active:translate-y-0.5 active:border-b-2 whitespace-nowrap shrink-0 ${
                      currentView.startsWith("/games") || currentView.startsWith("/quizzes")
                        ? "bg-amber-50 text-amber-900 border-amber-400 border-b-amber-500 shadow-sm"
                        : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-200"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse ring-1 ring-white" />
                    </div>
                    <span className="hidden lg:inline">ARCADE</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${
                        openDropdown === "arcade" ? "rotate-180 text-amber-600" : ""
                      }`}
                    />
                  </button>

                  {openDropdown === "arcade" && (
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border-2 border-slate-200 p-2.5 z-50 animate-fadeIn">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          navigate("/games");
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-amber-50 transition-all text-left group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-rose-500 text-white flex items-center justify-center text-lg shadow-sm">
                          🕹️
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm text-slate-800 group-hover:text-amber-700">
                              Modes Arcade
                            </span>
                            <span className="text-[9px] bg-rose-500 text-white font-black px-1 rounded">
                              HOT
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-semibold">
                            Geo-Detective, Silhouette, Chrono Rush
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          navigate("/quizzes");
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-emerald-50 transition-all text-left group mt-1"
                      >
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-black text-sm text-slate-800 group-hover:text-emerald-700">
                            Catalogue de Quiz
                          </span>
                          <p className="text-[11px] text-slate-500 font-semibold">
                            Plus de 200 quiz par thème & continent
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          navigate("/quizzes/training");
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-purple-50 transition-all text-left group mt-1"
                      >
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg">
                          <Dumbbell className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-black text-sm text-slate-800 group-hover:text-purple-700">
                            Mode Entraînement
                          </span>
                          <p className="text-[11px] text-slate-500 font-semibold">
                            Révisez à votre rythme, sans limite
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          navigate("/quizzes/create");
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-sky-50 transition-all text-left group mt-1 border-t border-slate-100"
                      >
                        <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center text-lg">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-black text-sm text-slate-800 group-hover:text-sky-700">
                            Créer un Quiz
                          </span>
                          <p className="text-[11px] text-slate-500 font-semibold">
                            Partagez vos questions à la communauté
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          setShopModalOpen(true);
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-emerald-50 transition-all text-left group mt-1 border-t border-slate-100"
                      >
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm text-slate-800 group-hover:text-emerald-700">
                              Boutique TerraGems
                            </span>
                            <span className="text-[9px] bg-emerald-500 text-white font-black px-1 rounded">
                              💎 SHOP
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-semibold">
                            Gels de flamme, thèmes de globe, cadres
                          </p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. 🧭 ATLAS & CONQUÊTE (Dropdown) */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenDropdown(openDropdown === "atlas" ? null : "atlas")
                    }
                    title="Atlas 3D & Conquête"
                    className={`flex items-center gap-1 xl:gap-1.5 px-2 lg:px-2.5 xl:px-3 py-1.5 lg:py-2 rounded-2xl text-xs xl:text-sm font-black transition-all duration-100 border-2 border-b-4 active:translate-y-0.5 active:border-b-2 whitespace-nowrap shrink-0 ${
                      currentView.startsWith("/atlas") || currentView.startsWith("/conquest")
                        ? "bg-teal-50 text-teal-900 border-teal-400 border-b-teal-500 shadow-sm"
                        : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-200"
                    }`}
                  >
                    <Compass className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="hidden lg:inline">ATLAS</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${
                        openDropdown === "atlas" ? "rotate-180 text-teal-600" : ""
                      }`}
                    />
                  </button>

                  {openDropdown === "atlas" && (
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border-2 border-slate-200 p-2.5 z-50 animate-fadeIn">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          navigate("/conquest");
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-teal-50 transition-all text-left group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-700 text-white flex items-center justify-center text-lg shadow-sm">
                          🗺️
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm text-slate-800 group-hover:text-teal-800">
                              Carte de Conquête
                            </span>
                            <span className="text-[9px] bg-teal-600 text-white font-black px-1 rounded">
                              POKÉDEX
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-semibold">
                            Brouillard de guerre & cartes collector
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          navigate("/atlas");
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-sky-50 transition-all text-left group mt-1"
                      >
                        <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center text-lg">
                          🌐
                        </div>
                        <div>
                          <span className="font-black text-sm text-slate-800 group-hover:text-sky-700">
                            Atlas 3D & Radios
                          </span>
                          <p className="text-[11px] text-slate-500 font-semibold">
                            Globe interactif & radios locales en direct
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          navigate("/terradex");
                        }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-indigo-50 transition-all text-left group mt-1 border-t border-slate-100"
                      >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-lg shadow-sm">
                          🎴
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm text-slate-800 group-hover:text-indigo-800">
                              Le TerraDex
                            </span>
                            <span className="text-[9px] bg-indigo-600 text-white font-black px-1 rounded">
                              CARTES
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-semibold">
                            60 cartes à collectionner & boosters
                          </p>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* 4. 🏆 LIGUES */}
                <button
                  type="button"
                  onClick={() => {
                    setOpenDropdown(null);
                    navigate("/leaderboard");
                  }}
                  title="Ligues & Classements"
                  className={`flex items-center gap-1 xl:gap-1.5 px-2 lg:px-2.5 xl:px-3 py-1.5 lg:py-2 rounded-2xl text-xs xl:text-sm font-black transition-all duration-100 border-2 border-b-4 active:translate-y-0.5 active:border-b-2 whitespace-nowrap shrink-0 ${
                    currentView.startsWith("/leaderboard")
                      ? "bg-amber-50 text-amber-900 border-amber-400 border-b-amber-500 shadow-sm"
                      : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-200"
                  }`}
                >
                  <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="hidden lg:inline">LIGUES</span>
                </button>

                {/* 5. 👥 COMMUNAUTÉ & MULTIJOUEUR (Dropdown) */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenDropdown(openDropdown === "social" ? null : "social")
                    }
                    title="Communauté & Multijoueur"
                    className={`relative flex items-center gap-1 xl:gap-1.5 px-2 lg:px-2.5 xl:px-3 py-1.5 lg:py-2 rounded-2xl text-xs xl:text-sm font-black transition-all duration-100 border-2 border-b-4 active:translate-y-0.5 active:border-b-2 whitespace-nowrap shrink-0 ${
                      currentView.startsWith("/duels") ||
                      currentView.startsWith("/party") ||
                      currentView.startsWith("/friends") ||
                      currentView.startsWith("/chat")
                        ? "bg-indigo-50 text-indigo-900 border-indigo-400 border-b-indigo-500 shadow-sm"
                        : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-200"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                      {totalSocialNotifications > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center animate-pulse">
                          {totalSocialNotifications}
                        </span>
                      )}
                    </div>
                    <span className="hidden 2xl:inline">COMMUNAUTÉ</span>
                    <span className="hidden lg:inline 2xl:hidden">SOCIAL</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${
                        openDropdown === "social" ? "rotate-180 text-indigo-600" : ""
                      }`}
                    />
                  </button>

                  {openDropdown === "social" && (
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border-2 border-slate-200 p-2.5 z-50 animate-fadeIn">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          navigate("/duels");
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-indigo-50 transition-all text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-lg">
                            <Swords className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-black text-sm text-slate-800 group-hover:text-indigo-700">
                              Duels 1v1
                            </span>
                            <p className="text-[11px] text-slate-500 font-semibold">
                              Défiez vos amis en temps réel
                            </p>
                          </div>
                        </div>
                        {(pendingDuelsToPlay || 0) + (newDuelResults || 0) > 0 && (
                          <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                            {(pendingDuelsToPlay || 0) + (newDuelResults || 0)}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          navigate("/party");
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-purple-50 transition-all text-left group mt-1"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg">
                            <Gamepad2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-sm text-slate-800 group-hover:text-purple-700">
                                Salon Party
                              </span>
                              <span className="text-[9px] bg-purple-600 text-white font-black px-1 rounded">
                                KAHOOT
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-semibold">
                              Multijoueur direct avec code PIN
                            </p>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          navigate("/friends");
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-emerald-50 transition-all text-left group mt-1"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg">
                            <Users className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-black text-sm text-slate-800 group-hover:text-emerald-700">
                              Amis
                            </span>
                            <p className="text-[11px] text-slate-500 font-semibold">
                              Trouvez et suivez vos camarades
                            </p>
                          </div>
                        </div>
                        {pendingFriendRequests > 0 && (
                          <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                            {pendingFriendRequests}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          navigate("/chat");
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-sky-50 transition-all text-left group mt-1"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center text-lg">
                            <MessageCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-black text-sm text-slate-800 group-hover:text-sky-700">
                              Messagerie
                            </span>
                            <p className="text-[11px] text-slate-500 font-semibold">
                              Discussions privées
                            </p>
                          </div>
                        </div>
                        {unreadMessages > 0 && (
                          <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                            {unreadMessages}
                          </span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 🎮 Duolingo Gamified Status Bar & Profile Dropdown */}
            <div className="flex items-center gap-1 sm:gap-1.5 xl:gap-2 shrink-0">
              {/* 🔥 Streak Flame Capsule */}
              {profile && (
                <div className="relative flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => setStreakModalOpen(true)}
                    className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-2xl text-xs xl:text-sm font-black transition-all shadow-sm border-2 border-b-4 active:translate-y-0.5 active:border-b-2 whitespace-nowrap shrink-0 ${
                      isStreakPlayedToday(profile.last_activity_date)
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:brightness-105 border-orange-400 border-b-orange-600 shadow-orange-500/20"
                        : isStreakAtRisk(profile.last_activity_date, profile.current_streak)
                        ? "bg-gradient-to-r from-red-600 to-orange-500 text-white animate-pulse border-red-500 border-b-red-700 shadow-red-500/30"
                        : "bg-orange-50 text-orange-800 border-orange-200 border-b-orange-300 hover:bg-orange-100"
                    }`}
                    title={
                      isStreakPlayedToday(profile.last_activity_date)
                        ? `${profile.current_streak || 0} jours • Série validée aujourd'hui ! 🔥`
                        : isStreakAtRisk(profile.last_activity_date, profile.current_streak)
                        ? `${profile.current_streak || 0} jours • Série en danger ! Joue aujourd'hui`
                        : `${profile.current_streak || 0} jours consécutifs`
                    }
                  >
                    <span
                      className={`text-sm sm:text-base ${
                        isStreakPlayedToday(profile.last_activity_date) ? "animate-bounce" : ""
                      }`}
                    >
                      🔥
                    </span>
                    <span>{profile.current_streak || 0}</span>
                  </button>

                  {/* 🧊 Booster Gel de Flamme actif */}
                  {gamification.streakFreezes > 0 && (
                    <span
                      className="absolute -top-1.5 -right-1.5 bg-sky-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-white shadow-xs flex items-center cursor-pointer"
                      title={`${gamification.streakFreezes} Gel(s) de Flamme actif(s) pour protéger votre série !`}
                      onClick={() => setShopModalOpen(true)}
                    >
                      🧊
                    </span>
                  )}
                </div>
              )}

              {/* ⚡ Booster Double XP actif */}
              {Boolean(gamification.doubleXpUntil && gamification.doubleXpUntil > Date.now()) && (
                <div
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-2xl text-xs font-black bg-amber-400 text-amber-950 border-2 border-amber-300 border-b-4 border-b-amber-600 shadow-sm animate-pulse whitespace-nowrap shrink-0"
                  title="Booster Double XP actif !"
                >
                  <span>⚡</span>
                  <span className="hidden xl:inline">2X XP</span>
                  <span className="xl:hidden">2X</span>
                </div>
              )}

              {/* 💎 TerraGems Capsule */}
              <button
                type="button"
                onClick={() => setShopModalOpen(true)}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-2xl text-xs xl:text-sm font-black bg-sky-50 text-sky-800 border-2 border-sky-200 border-b-4 border-b-sky-300 hover:bg-sky-100 transition-all shadow-sm active:translate-y-0.5 active:border-b-2 whitespace-nowrap shrink-0"
                title={`${gamification.gems} TerraGems 💎 - Ouvrir la Boutique`}
              >
                <span className="text-sm sm:text-base">💎</span>
                <span>{gamification.gems}</span>
              </button>



              {/* 🏆 Ligue Duolingo Capsule en direct */}
              {profile && (() => {
                const leagueProgress = getUserLeagueProgress(profile.experience_points || 0);
                return (
                  <button
                    type="button"
                    onClick={() => navigate("/leaderboard")}
                    className="hidden xl:flex items-center gap-1.5 2xl:gap-2 px-2 2xl:px-2.5 py-1 rounded-2xl bg-amber-50/90 hover:bg-amber-100 text-amber-950 border-2 border-amber-200 border-b-4 border-b-amber-400 shadow-2xs transition-all active:translate-y-0.5 active:border-b-2 whitespace-nowrap shrink-0 group"
                    title={`${leagueProgress.rankLabel} • ${leagueProgress.statusText} • ${leagueProgress.progressPercent}% vers ${leagueProgress.nextLeague?.name || "Palier Max"}`}
                  >
                    <span className="text-sm 2xl:text-base group-hover:scale-110 transition-transform shrink-0">
                      {leagueProgress.currentLeague.icon}
                    </span>
                    <div className="hidden 2xl:flex flex-col text-left leading-none">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-black text-slate-800">
                          {leagueProgress.currentLeague.name}
                        </span>
                        <span className="text-[10px] font-bold text-amber-700">
                          • #{leagueProgress.divisionRank}
                        </span>
                      </div>
                      <div className="w-16 h-1.5 bg-amber-200/80 rounded-full overflow-hidden mt-1">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${leagueProgress.progressPercent}%` }}
                        />
                      </div>
                    </div>
                    <span className="2xl:hidden text-xs font-black text-slate-800">
                      #{leagueProgress.divisionRank}
                    </span>
                  </button>
                );
              })()}

              {/* 👑 Niveau Capsule (visible sur très grand écran 2xl) */}
              <div className="hidden 2xl:flex items-center gap-1 px-2.5 py-1.5 rounded-2xl text-xs sm:text-sm font-black bg-purple-50 text-purple-800 border-2 border-purple-200 border-b-4 border-b-purple-300 shadow-sm shrink-0 whitespace-nowrap">
                <span>👑</span>
                <span>Niv. {profile?.level || 1}</span>
              </div>

              {/* 👤 Profil Avatar & Dropdown */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setOpenDropdown(openDropdown === "profile" ? null : "profile")
                  }
                  className={`p-1 rounded-2xl border-2 transition-all flex items-center gap-0.5 sm:gap-1 active:scale-95 shrink-0 ${
                    openDropdown === "profile"
                      ? "border-emerald-500 bg-emerald-50 shadow-sm"
                      : "border-transparent hover:bg-slate-100"
                  }`}
                >
                  <Avatar
                    url={(profile as any)?.avatar_url}
                    pseudo={profile?.pseudo}
                    frameStyle={(profile as any)?.frame_style && (profile as any).frame_style !== "none" ? (profile as any).frame_style : gamification.activeAvatarFrame}
                    size="sm"
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block shrink-0" />
                </button>

                {openDropdown === "profile" && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-3xl shadow-2xl border-2 border-slate-200 p-2.5 z-50 animate-fadeIn">
                    {/* Header profil */}
                    <div className="p-3 bg-slate-50 rounded-2xl mb-2 border border-slate-100 text-left">
                      <p className="font-black text-slate-900 text-sm truncate">
                        {profile?.pseudo}
                      </p>
                      {getActiveTitleDetails(profile?.id) && (
                        <p className="text-[11px] font-black text-purple-700 truncate mt-0.5 flex items-center gap-1">
                          <span>{getActiveTitleDetails(profile?.id)?.icon || "⭐"}</span>
                          <span>{getActiveTitleDetails(profile?.id)?.name}</span>
                        </p>
                      )}
                      <p className="text-xs text-slate-500 font-bold mt-0.5">
                        {t("profile.level")} {profile?.level || 1} • {profile?.experience_points || 0} XP
                      </p>
                    </div>

                    {/* 🏆 Badge & Jauge de Ligue en direct dans le profil */}
                    {(() => {
                      const lp = getUserLeagueProgress(profile?.experience_points || 0);
                      return (
                        <div
                          onClick={() => {
                            setOpenDropdown(null);
                            navigate("/leaderboard");
                          }}
                          className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl mb-2.5 border border-amber-200/80 cursor-pointer hover:border-amber-300 shadow-2xs group transition-all text-left"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xl group-hover:scale-110 transition-transform">
                                {lp.currentLeague.icon}
                              </span>
                              <div>
                                <p className="font-black text-slate-900 text-xs leading-tight">
                                  {lp.currentLeague.name}
                                </p>
                                <p className="text-[10px] font-bold text-amber-700">
                                  Rang #{lp.divisionRank} • {lp.statusText}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-200/60 text-amber-900">
                              {lp.progressPercent}%
                            </span>
                          </div>

                          {/* Jauge vers la ligue suivante */}
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${lp.progressPercent}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold mt-1 text-right">
                            {lp.nextLeague
                              ? `Encore ${lp.xpToNext} XP vers ${lp.nextLeague.name} ⬆️`
                              : "Palier de Ligue Maximum 👑"}
                          </p>
                        </div>
                      );
                    })()}

                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        navigate("/profile");
                      }}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-2xl hover:bg-emerald-50 font-black text-xs text-slate-700 hover:text-emerald-700 transition-colors text-left"
                    >
                      <User className="w-4 h-4 text-emerald-600" />
                      <span>Mon Profil & Trophées</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        navigate("/terradex");
                      }}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-2xl hover:bg-indigo-50 font-black text-xs text-slate-700 hover:text-indigo-700 transition-colors text-left"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Mon TerraDex (Cartes 🎴)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        navigate("/settings");
                      }}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-2xl hover:bg-slate-100 font-black text-xs text-slate-700 transition-colors text-left"
                    >
                      <Settings className="w-4 h-4 text-slate-500" />
                      <span>Paramètres du Compte</span>
                    </button>

                    {profile?.role === "admin" && (
                      <button
                        type="button"
                        onClick={() => {
                          setOpenDropdown(null);
                          navigate("/admin");
                        }}
                        className="w-full flex items-center gap-2.5 p-2.5 rounded-2xl hover:bg-purple-50 font-black text-xs text-purple-700 transition-colors text-left"
                      >
                        <Shield className="w-4 h-4 text-purple-600" />
                        <span>Panneau d'Administration</span>
                      </button>
                    )}

                    <div className="my-1.5 border-t border-slate-100" />

                    <button
                      type="button"
                      onClick={() => {
                        setOpenDropdown(null);
                        signOut();
                      }}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-2xl hover:bg-rose-50 font-black text-xs text-rose-600 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>


      {/* 📱 Navigation mobile fixe Duolingo */}
      <MobileBottomNav />




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
                  navigate("/party");
                  setSocialMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
                  currentView.startsWith("/party")
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center">
                  <Gamepad2 className="w-5 h-5 mr-3 text-indigo-600" />
                  <span className="font-medium">{t("party.title") || "Salon Party 🏆"}</span>
                </div>
                <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-bold">
                  Direct
                </span>
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

              <button
                onClick={() => {
                  navigate("/atlas");
                  setSocialMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
                  currentView.startsWith("/atlas")
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center">
                  <Compass className="w-5 h-5 mr-3 text-emerald-600" />
                  <span className="font-medium">{t("nav.atlas") || "Atlas / Exploration libre"}</span>
                </div>
                <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-bold">
                  3D
                </span>
              </button>

              <button
                onClick={() => {
                  navigate("/conquest");
                  setSocialMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
                  currentView.startsWith("/conquest")
                    ? "bg-emerald-100 text-emerald-700 font-bold"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center">
                  <MapIcon className="w-5 h-5 mr-3 text-teal-600" />
                  <span className="font-medium">Conquête & Pokédex 🗺️</span>
                </div>
                <span className="bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded-full font-bold">
                  Nouveau
                </span>
              </button>

              <button
                onClick={() => {
                  navigate("/games");
                  setSocialMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
                  currentView.startsWith("/games")
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center">
                  <Sparkles className="w-5 h-5 mr-3 text-amber-500" />
                  <span className="font-medium">{t("nav.games") || "Modes de jeu & Arcade"}</span>
                </div>
                <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-bold">
                  Nouveau
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      <StreakModal
        isOpen={streakModalOpen}
        onClose={() => setStreakModalOpen(false)}
        profile={profile}
      />

      <ShopModal
        isOpen={shopModalOpen}
        onClose={() => setShopModalOpen(false)}
      />

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
