import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  BookOpen,
  AlertTriangle,
  Ban,
} from "lucide-react";
import { DailyChallengeCard } from "../daily/DailyChallengeCard";
import { DailyMissionsCard } from "../missions/DailyMissionsCard";
import type { Database } from "../../lib/database.types";
import { getDailyQuizForDate } from "../../lib/dailyChallenge";
import { StreakModal } from "../profile/StreakModal";
import { isStreakPlayedToday } from "../../lib/streakUtils";
import { getConquestStats } from "../../lib/conquestManager";
import { DuolingoQuestPath } from "./DuolingoQuestPath";
import {
  getLeagueForXp,
  getUserLeagueProgress,
  getActiveTitleDetails,
  getQuestPath,
} from "../../lib/gamificationManager";
import { FeaturedCountryCard } from "./FeaturedCountryCard";
import { BOOSTER_PACKS, type BoosterPack } from "../../lib/cardsData";
import {
  canClaimDailyPack,
  getCollectionStats,
} from "../../lib/cardsManager";
import { BoosterOpeningModal } from "../cards/BoosterOpeningModal";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
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
  const [activeTitle, setActiveTitle] = useState(() => getActiveTitleDetails(profile?.id));

  useEffect(() => {
    const handleGamification = () => {
      setActiveTitle(getActiveTitleDetails(profile?.id));
    };
    window.addEventListener("terracost_gamification_updated", handleGamification);
    window.addEventListener("terracoast:profile_updated", handleGamification);
    return () => {
      window.removeEventListener("terracost_gamification_updated", handleGamification);
      window.removeEventListener("terracoast:profile_updated", handleGamification);
    };
  }, [profile?.id]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [dailyQuiz, setDailyQuiz] = useState<Quiz | null>(null);
  const [loadingDailyQuiz, setLoadingDailyQuiz] = useState(true);
  const [activeBoosterPack, setActiveBoosterPack] = useState<BoosterPack | null>(null);
  const [dailyStatus, setDailyStatus] = useState(() => canClaimDailyPack(profile?.id));
  const [collectionStats, setCollectionStats] = useState(() => getCollectionStats(profile?.id));
  const [mobileTab, setMobileTab] = useState<"missions" | "daily" | "country">("missions");

  const currentQuestNode = useMemo(() => {
    const units = getQuestPath(profile?.id);
    for (const unit of units) {
      const found = unit.nodes.find((n) => n.status === "active");
      if (found) return { node: found, unit };
    }
    if (units[0]?.nodes[0]) {
      return { node: units[0].nodes[0], unit: units[0] };
    }
    return null;
  }, [profile?.id]);

  useEffect(() => {
    const updateCards = () => {
      setDailyStatus(canClaimDailyPack(profile?.id));
      setCollectionStats(getCollectionStats(profile?.id));
    };

    updateCards();
    window.addEventListener("terracoast_cards_updated", updateCards);
    window.addEventListener("terracoast_cards_catalog_updated", updateCards);
    const interval = setInterval(() => {
      setDailyStatus(canClaimDailyPack(profile?.id));
    }, 60000);
    return () => {
      window.removeEventListener("terracoast_cards_updated", updateCards);
      window.removeEventListener("terracoast_cards_catalog_updated", updateCards);
      clearInterval(interval);
    };
  }, [profile?.id]);

  const formatRemainingTime = (ms: number) => {
    if (ms <= 0) return "";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins.toString().padStart(2, "0")}m`;
  };

  useEffect(() => {
    if (!profile?.id) return;

    const userId = profile.id;
    const userLang = profile.language;
    const showAllLangs = profile.show_all_languages;

    const loadData = async () => {
      try {
        let quizzesQuery = supabase
          .from("quizzes")
          .select("*")
          .or("is_public.eq.true,is_global.eq.true");

        if (!showAllLangs && userLang) {
          quizzesQuery = quizzesQuery.eq("language", userLang);
        }

        const [quizzesRes, warningsRes] = await Promise.all([
          quizzesQuery,
          supabase
            .from("warnings")
            .select("id, reason, admin_notes, created_at")
            .eq("reported_user_id", userId)
            .in("status", ["action_taken"])
            .order("created_at", { ascending: false })
            .limit(3),
        ]);

        if (!quizzesRes.error && quizzesRes.data && quizzesRes.data.length > 0) {
          const pickedDaily = getDailyQuizForDate(quizzesRes.data);
          setDailyQuiz(pickedDaily);
        }
        setLoadingDailyQuiz(false);

        if (warningsRes.data) {
          setWarnings(warningsRes.data);
        }
      } catch (err) {
        console.error("Erreur:", err);
        setLoadingDailyQuiz(false);
      }
    };

    loadData();

    const sessionSubscription = supabase
      .channel(`sessions_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "game_sessions",
          filter: `player_id=eq.${userId}`,
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionSubscription);
    };
  }, [profile?.id, profile?.language, profile?.show_all_languages]);

  const userLeague = getLeagueForXp(profile?.experience_points || 0);
  const leagueProgress = getUserLeagueProgress(profile?.experience_points || 0);
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
          {activeTitle && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-purple-100 via-indigo-50 to-purple-100 text-purple-900 border border-purple-200 shadow-2xs mt-1.5 mb-1 animate-fade-in">
              <span>{activeTitle.icon}</span>
              <span>{activeTitle.name}</span>
            </div>
          )}
          <p className="text-xs sm:text-sm font-bold text-slate-500 mt-1">
            {t("home.learningPathSubtitle") || "Parcours d'apprentissage géographique • Progressez étape par étape !"}
          </p>
        </div>

        {/* Badges statut gamifiés avec Ligue & Rang en direct */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 🏆 Ligue et Rang en direct avec jauge */}
          <div
            onClick={() => navigate("/leaderboard")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-black bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-900 border border-amber-300 cursor-pointer shadow-sm hover:border-amber-400 active:scale-95 transition-all"
            title={`${leagueProgress.rankLabel} • ${leagueProgress.statusText} • ${leagueProgress.progressPercent}% vers ${leagueProgress.nextLeague?.name || (t("home.maxTier") || "Palier Max")}`}
          >
            <span className="text-base">{leagueProgress.currentLeague.icon}</span>
            <div className="flex flex-col text-left leading-tight">
              <span>{leagueProgress.rankLabel}</span>
              <div className="w-20 h-1.5 bg-amber-200/90 rounded-full overflow-hidden mt-0.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${leagueProgress.progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div
            onClick={() => setShowStreakModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-black cursor-pointer shadow-sm border ${
              isStreakPlayedToday(profile?.last_activity_date)
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-600"
                : "bg-orange-50 text-orange-800 border-orange-200"
            }`}
          >
            <span>🔥</span>
            <span>{profile?.current_streak || 0} {t("home.streakDays") || "jours de série"}</span>
          </div>

          <div
            onClick={() => navigate("/conquest")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-pointer shadow-sm hover:bg-emerald-100"
          >
            <span>🗺️</span>
            <span>{conquest.conquestPercentage}% {t("home.ofTheWorld") || "du Monde"}</span>
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
                  <div className="text-[11px] text-slate-500 font-bold">{profile?.experience_points || 0} {t("home.totalXp") || "XP au total"}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/leaderboard")}
                className="text-xs font-black text-emerald-700 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-sm active:scale-95"
              >
                {t("home.leagues") || "Ligues 🏆"}
              </button>
            </div>

            {/* Sélecteur compact à onglets sur mobile (Missions / Défi / Pays) */}
            <div className="bg-slate-100 p-1 rounded-2xl flex text-xs font-black gap-1">
              <button
                type="button"
                onClick={() => setMobileTab("missions")}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  mobileTab === "missions"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>🎯</span>
                <span>Missions</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("daily")}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  mobileTab === "daily"
                    ? "bg-white text-amber-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>⭐</span>
                <span>Défi du Jour</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("country")}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  mobileTab === "country"
                    ? "bg-white text-sky-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>🌍</span>
                <span>À l'honneur</span>
              </button>
            </div>

            {/* Carte active sur mobile */}
            <div className="mb-4">
              {mobileTab === "missions" && <DailyMissionsCard />}
              {mobileTab === "daily" && <DailyChallengeCard quiz={dailyQuiz} loading={loadingDailyQuiz} />}
              {mobileTab === "country" && <FeaturedCountryCard />}
            </div>
          </div>

          {/* 🚀 Hero CTA Principal : 1 action évidente sans hésitation */}
          <div className="w-full max-w-xl mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg border-2 border-emerald-400/40 flex items-center justify-between gap-3 sm:gap-4 transition-all">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shrink-0 shadow-inner border border-white/20">
                🧭
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-black uppercase tracking-wider text-emerald-200">
                  {currentQuestNode?.unit ? currentQuestNode.unit.title : (t("home.adventure") || "Votre Aventure")}
                </div>
                <div className="text-base sm:text-lg font-black truncate">
                  {currentQuestNode?.node.title || (t("home.continueAdventure") || "Continuer le Parcours")}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (currentQuestNode) {
                  const targetQuizId = currentQuestNode.node.assignedQuizId || currentQuestNode.node.id;
                  navigate(`/quizzes/play/${targetQuizId}?pathNodeId=${currentQuestNode.node.id}`);
                } else {
                  navigate("/quizzes");
                }
              }}
              className="btn-duo btn-duo-white text-xs sm:text-sm font-black text-emerald-800 px-4 py-2.5 sm:px-5 sm:py-3 shrink-0 shadow-md flex items-center gap-1.5 active:scale-95 transition-transform"
            >
              <span>{t("home.playNow") || "JOUER"}</span>
              <span>⚡</span>
            </button>
          </div>

          {/* Composant Parcours Sinueux Duolingo */}
          <DuolingoQuestPath
            userId={profile?.id}
            onNodeStart={(node, chosenQuizId) => {
              const targetQuizId = chosenQuizId || node.assignedQuizId || node.id;
              navigate(`/quizzes/play/${targetQuizId}?pathNodeId=${node.id}`);
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
              <span>{t("home.exploreQuizzesCatalog") || "EXPLORER LE CATALOGUE DES 200+ QUIZ 📚"}</span>
            </button>
          </div>
        </div>

        {/* 🏆 Colonne Latérale : Widgets Gamifiés & Compétition (Desktop Sidebar) */}
        <div className="hidden lg:flex lg:col-span-5 xl:col-span-4 flex-col space-y-6 sticky top-20">
          {/* ⭐ 0. Pays de la Semaine (Admin Featured Country) */}
          <FeaturedCountryCard />

          {/* 🎯 1. Missions du Jour (3 objectifs rapides + Grand Coffre) */}
          <DailyMissionsCard />

          {/* 2. Défi du Jour */}
          <DailyChallengeCard quiz={dailyQuiz} loading={loadingDailyQuiz} />

          {/* 2. Ligue Duolingo Hebdomadaire */}
          <div className={`card-duo p-5 bg-gradient-to-b ${userLeague.bgGradient}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                {t("home.weeklyCompetition") || "Compétition Hebdomadaire"}
              </span>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white/80 shadow-sm text-slate-800">
                {t("home.activeSeason") || "Saison en cours ⚡"}
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
                  {profile?.experience_points || 0} XP • {t("home.promotionZone") || "Zone de promotion"} ⬆️
                </p>
              </div>
            </div>

            <div className="bg-white/80 rounded-2xl p-3 text-xs mb-4 border border-slate-200/60 flex items-center justify-between">
              <span className="text-slate-600 font-bold">{t("home.nextLeague") || "Prochaine ligue :"}</span>
              <span className="font-black text-purple-700">
                {userLeague.tier < 6 ? `${t("home.higherLeague") || "Ligue Supérieure"} (${userLeague.minXp + 500} XP)` : (t("home.maxTier") || "Palier Maximum 👑")}
              </span>
            </div>

            <button
              type="button"
              onClick={() => navigate("/leaderboard")}
              className="w-full py-2.5 px-4 btn-duo btn-duo-amber text-xs font-black"
            >
              {t("home.viewLeaderboard") || "VOIR LE CLASSEMENT DE LA LIGUE 🏆"}
            </button>
          </div>

          {/* 3. TerraDex & Booster Quotidien */}
          <div className="card-duo p-5 bg-gradient-to-br from-indigo-950 via-slate-900 to-amber-950/40 text-white border-amber-500/30 shadow-xl relative overflow-hidden group">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-all duration-700" />
            
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🎴</span>
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  TerraDex Géographique
                </span>
              </div>
              {dailyStatus.available ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md">
                  <span>🎁</span> DISPO
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  ⏳ {formatRemainingTime(dailyStatus.remainingMs)}
                </span>
              )}
            </div>

            <div className="relative z-10">
              <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors flex items-center justify-between">
                <span>Album & Booster</span>
                <span className="text-xs font-black text-amber-400">
                  {collectionStats.totalCollected}/{collectionStats.totalCards}
                </span>
              </h3>
              
              <p className="text-xs text-slate-300 mt-1 mb-3">
                {dailyStatus.available
                  ? "Votre pack de 3 cartes gratuites est disponible ! Ouvrez-le maintenant pour enrichir votre album."
                  : `Album complété à ${collectionStats.percentage}%. Consultez votre vitrine ou obtenez de nouvelles cartes !`}
              </p>

              <div className="w-full bg-slate-800/80 rounded-full h-2 p-0.5 mb-4 border border-slate-700/50">
                <div
                  className="bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(4, collectionStats.percentage)}%` }}
                />
              </div>

              {dailyStatus.available ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      const pack = BOOSTER_PACKS.find((p) => p.id === "pack_daily") || BOOSTER_PACKS[0];
                      setActiveBoosterPack(pack);
                    }}
                    className="w-full py-2.5 px-4 btn-duo btn-duo-green text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
                  >
                    <span>🎁</span> OUVRIR MON PACK DU JOUR (3 CARTES)
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/terradex")}
                    className="w-full py-2 px-3 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                  >
                    Voir mon TerraDex ({collectionStats.percentage}% complété) →
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate("/terradex")}
                  className="w-full py-2.5 px-4 btn-duo btn-duo-purple text-xs font-black flex items-center justify-center gap-2"
                >
                  <span>🎴</span> EXPLORER MON TERRADEX
                </button>
              )}
            </div>
          </div>

          {/* 4. Carte de Conquête & Pokédex Géographique */}
          <div
            onClick={() => navigate("/conquest")}
            className="card-duo p-5 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 text-white border-emerald-800/40 shadow-xl cursor-pointer hover:border-emerald-500 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                {t("home.geoPokedex") || "Pokédex Géographique"}
              </span>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                {conquest.conquestPercentage}% {t("home.conquered") || "Conquis"}
              </span>
            </div>

            <h3 className="text-base font-black text-white group-hover:text-emerald-300 transition-colors">
              {t("home.worldConquestMap") || "Carte de Conquête Mondiale 🗺️"}
            </h3>
            <p className="text-xs text-slate-300 mt-1 mb-3">
              {conquest.conqueredCount} {t("home.conquestSubtitle") || "pays explorés sur"} {conquest.totalCountries} {t("home.conquestSubtitleEnd") || "• Dissipez le brouillard et complétez votre collection !"}
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
              {t("home.explore3dMap") || "EXPLORER LA CARTE EN 3D 🧭"}
            </button>
          </div>

          {/* 5. Arcade & Nouveaux Modes de Jeu */}
          <div className="card-duo p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                {t("home.quickArcade") || "Arcade Rapide 🕹️"}
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500 text-white">
                {t("home.news") || "Nouveautés"}
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
                <div className="text-[10px] text-slate-500 font-bold">{t("home.satelliteView") || "Vue Satellite"}</div>
              </button>

              <button
                type="button"
                onClick={() => navigate("/games/silhouette")}
                className="p-3 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-left transition-all active:scale-95"
              >
                <div className="text-xl mb-1">👤</div>
                <div className="text-xs font-black text-slate-800">Silhouette</div>
                <div className="text-[10px] text-slate-500 font-bold">{t("home.blindMap") || "Blind Map"}</div>
              </button>

              <button
                type="button"
                onClick={() => navigate("/games/chrono-rush")}
                className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-left transition-all active:scale-95"
              >
                <div className="text-xl mb-1">⚡</div>
                <div className="text-xs font-black text-slate-800">Chrono Rush</div>
                <div className="text-[10px] text-slate-500 font-bold">{t("home.seconds45") || "45 secondes"}</div>
              </button>

              <button
                type="button"
                onClick={() => navigate("/games/higher-lower")}
                className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-left transition-all active:scale-95"
              >
                <div className="text-xl mb-1">⚖️</div>
                <div className="text-xs font-black text-slate-800">{t("home.higherLower") || "Plus Grand / Petit"}</div>
                <div className="text-[10px] text-slate-500 font-bold">{t("home.statsDuels") || "Duels de stats"}</div>
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

      {activeBoosterPack && (
        <BoosterOpeningModal
          isOpen={true}
          onClose={() => {
            setActiveBoosterPack(null);
            setDailyStatus(canClaimDailyPack(profile?.id));
            setCollectionStats(getCollectionStats(profile?.id));
          }}
          pack={activeBoosterPack}
          userId={profile?.id}
          onPackOpened={() => {
            setDailyStatus(canClaimDailyPack(profile?.id));
            setCollectionStats(getCollectionStats(profile?.id));
          }}
        />
      )}
    </div>
  );
}

