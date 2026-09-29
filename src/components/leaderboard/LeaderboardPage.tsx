import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { Avatar } from "../common/Avatar";
import {
  Trophy,
  Medal,
  Crown,
  TrendingUp,
  Calendar,
  Users,
  Flame,
  Shield,
  Zap,
  Sparkles,
  Swords,
  Clock,
  ArrowUp,
  ChevronRight,
  Star,
  Info,
} from "lucide-react";
import type { Database } from "../../lib/database.types";
import { fetchUserFriends } from "../../lib/queries/friendQueries";
import {
  aggregateFederationLeaderboard,
  getUserFederation,
  type FederationLeaderboardEntry,
  type Federation,
} from "../../lib/federations";
import {
  DUOLINGO_LEAGUES,
  getUserLeagueProgress,
} from "../../lib/gamificationManager";
import { FederationSelectModal } from "../profile/modals/FederationSelectModal";
import { TerritorialConquestSection } from "./TerritorialConquestSection";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface LeaderboardEntry extends Profile {
  total_score: number;
  games_played: number;
  wins: number;
  rank?: number;
}

export interface LeaderboardPageProps {
  onNavigate?: (view: string, data?: any) => void;
}

function getWeeklyTimeRemaining(): { label: string; days: number; hours: number } {
  const now = new Date();
  const day = now.getDay(); // 0 is Sunday, 1 is Monday...
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  const hoursUntilMidnight = Math.max(0, 23 - now.getHours());

  if (daysUntilSunday === 0) {
    if (hoursUntilMidnight <= 1) return { label: "Dernière heure !", days: 0, hours: hoursUntilMidnight };
    return { label: `${hoursUntilMidnight}h restantes`, days: 0, hours: hoursUntilMidnight };
  }
  return {
    label: `${daysUntilSunday}j ${hoursUntilMidnight}h restants`,
    days: daysUntilSunday,
    hours: hoursUntilMidnight,
  };
}

export function LeaderboardPage({ onNavigate: _onNavigate }: LeaderboardPageProps = {}) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"global" | "friends" | "nations">("global");
  const [period, setPeriod] = useState<"monthly" | "alltime">("monthly");
  const [mode, setMode] = useState<"xp" | "duel_ranked">("xp");
  const [federationLeaderboard, setFederationLeaderboard] = useState<FederationLeaderboardEntry[]>([]);
  const [federationFilter, setFederationFilter] = useState<"all" | "country" | "canton" | "academic_club">("all");
  const [showFederationModal, setShowFederationModal] = useState(false);
  const [myFederation, setMyFederation] = useState<Federation>(() => getUserFederation(profile?.id));

  const weeklyTime = getWeeklyTimeRemaining();
  const userLeagueProgress = profile
    ? getUserLeagueProgress(profile.experience_points || 0)
    : null;

  useEffect(() => {
    loadLeaderboard();
  }, [view, period, mode]);

  const loadLeaderboard = async () => {
    setLoading(true);
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    if (view === "nations") {
      const query = supabase
        .from("profiles")
        .select("id, pseudo, experience_points, monthly_score")
        .eq("is_banned", false)
        .order(period === "monthly" ? "monthly_score" : "experience_points", { ascending: false })
        .limit(200);

      const { data } = await query;
      const aggregated = aggregateFederationLeaderboard(
        (data as any[]) || [],
        period
      );
      setFederationLeaderboard(aggregated);
      setLoading(false);
      return;
    }

    let profiles: Profile[] = [];

    if (view === "global") {
      const orderBy =
        mode === "duel_ranked"
          ? "duel_rating"
          : period === "monthly"
          ? "monthly_score"
          : "experience_points";
      let query = supabase
        .from("profiles")
        .select(
          "id, pseudo, avatar_url, frame_style, experience_points, monthly_score, duel_rating, level, role, is_banned, last_reset_month, current_streak, longest_streak"
        )
        .eq("is_banned", false)
        .order(orderBy, { ascending: false })
        .limit(100);

      // En mode mensuel : ne garder que les joueurs ayant joué ce mois-ci
      if (mode === "xp" && period === "monthly") {
        query = query.eq("last_reset_month", currentMonth);
      }

      const { data } = await query;
      profiles = (data as Profile[]) || [];
    } else if (view === "friends" && profile) {
      const uniqueFriends = await fetchUserFriends(profile.id);
      profiles = [profile, ...uniqueFriends];

      // En mode mensuel : ne garder que les amis (et soi) ayant joué ce mois-ci
      if (mode === "xp" && period === "monthly") {
        profiles = profiles.filter(
          (p) => (p as Profile & { last_reset_month?: string | null }).last_reset_month === currentMonth
        );
      }
    }

    if (profiles.length > 0) {
      const enrichedData: LeaderboardEntry[] = profiles.map((p) => {
        if (mode === "duel_ranked") {
          return {
            ...p,
            total_score: p.duel_rating || 1000,
            games_played: p.duel_ranked_games || 0,
            wins: p.duel_ranked_wins || 0,
          };
        }
        if (period === "monthly") {
          return {
            ...p,
            total_score: p.monthly_score || 0,
            games_played: p.monthly_games_played || 0,
            wins: 0,
          };
        } else {
          return {
            ...p,
            total_score: p.experience_points || 0,
            games_played: 0,
            wins: 0,
          };
        }
      });

      // Trier et ajouter le rang
      enrichedData.sort((a, b) => b.total_score - a.total_score);
      enrichedData.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      setLeaderboard(enrichedData);
    } else {
      setLeaderboard([]);
    }

    setLoading(false);
  };

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <div className="w-11 h-11 rounded-2xl bg-amber-400 border-2 border-amber-200 border-b-4 border-amber-600 flex items-center justify-center text-amber-950 font-black shadow-md shrink-0">
          <Crown className="w-6 h-6 text-amber-950" />
        </div>
      );
    }
    if (index === 1) {
      return (
        <div className="w-11 h-11 rounded-2xl bg-slate-200 border-2 border-slate-100 border-b-4 border-slate-400 flex items-center justify-center text-slate-800 font-black shadow-md shrink-0">
          <Medal className="w-6 h-6 text-slate-700" />
        </div>
      );
    }
    if (index === 2) {
      return (
        <div className="w-11 h-11 rounded-2xl bg-amber-600 border-2 border-amber-400 border-b-4 border-amber-800 flex items-center justify-center text-amber-100 font-black shadow-md shrink-0">
          <Medal className="w-6 h-6 text-amber-200" />
        </div>
      );
    }
    if (index < 10) {
      return (
        <div className="w-11 h-11 rounded-2xl bg-emerald-100 border-2 border-emerald-300 border-b-4 border-b-emerald-500 flex items-center justify-center text-emerald-800 font-black text-sm shadow-sm shrink-0">
          #{index + 1}
        </div>
      );
    }
    return (
      <div className="w-11 h-11 rounded-2xl bg-slate-100 border-2 border-slate-200 border-b-4 border-b-slate-300 flex items-center justify-center text-slate-600 font-black text-sm shrink-0">
        #{index + 1}
      </div>
    );
  };

  const getGameText = (count: number) => {
    return count <= 1 ? t("leaderboard.game") : t("leaderboard.games");
  };

  const getWinRate = (entry: LeaderboardEntry) => {
    if (!entry.games_played) return 0;
    return Math.round((entry.wins / entry.games_played) * 100);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">

        {/* 🏆 HEADER GAMING CARTE DUOLINGO */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 border-b-4 border-b-slate-300 shadow-sm p-6 sm:p-8 relative overflow-hidden">
          {/* Ruban Supérieur Décoratif */}
          <div className="h-24 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-6 bg-gradient-to-r from-amber-500 via-yellow-500 to-emerald-500 relative flex items-center justify-between px-6 sm:px-8 overflow-hidden rounded-t-[22px]">
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="relative z-10 flex items-center gap-2 text-white font-black text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Arène Compétitive & Divisions Duolingo</span>
            </div>
            <div className="relative z-10 flex items-center gap-1.5 bg-black/20 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-full text-white text-xs font-bold shadow-sm">
              <Clock className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
              <span>{weeklyTime.label}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Trophée 3D Tactile */}
            <div className="relative -mt-12 group shrink-0">
              <div className="w-20 h-20 rounded-3xl bg-amber-400 border-2 border-amber-200 border-b-4 border-amber-600 text-slate-900 flex items-center justify-center shadow-xl rotate-[-3deg] transition-transform group-hover:scale-105">
                <Trophy className="w-10 h-10 text-amber-950 fill-amber-300 drop-shadow" />
              </div>
            </div>

            {/* Titre & Description */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 justify-center sm:justify-start flex-wrap">
                <span>{t("leaderboard.title")}</span>
                <span className="text-xs uppercase tracking-widest px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold border border-emerald-300">
                  Saison Active ⚡
                </span>
              </h1>
              <p className="text-slate-600 font-medium text-sm sm:text-base mt-1 max-w-2xl">
                {t("leaderboard.subtitle")} — Grimpez de division en division, cumulez de l'XP et hissez votre blason au sommet !
              </p>
            </div>
          </div>
        </div>

        {/* 💎 VITRINE DES 6 LIGUES DUOLINGO */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 border-2 border-slate-700 border-b-4 border-b-slate-900 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* En-tête de division du joueur */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10 border-b border-white/10 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase tracking-widest font-black text-amber-300">
                  Système de Ligues Hebdomadaires
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2 text-white">
                <span>Votre Division :</span>
                {userLeagueProgress ? (
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
                    {userLeagueProgress.currentLeague.name} {userLeagueProgress.currentLeague.icon}
                  </span>
                ) : (
                  <span className="text-amber-300">Ligue Bronze 🥉</span>
                )}
              </h2>
            </div>

            {/* Barre de progression vers la ligue suivante */}
            {userLeagueProgress && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 min-w-[280px]">
                <div className="flex justify-between items-center text-xs font-black mb-1.5">
                  <span className="text-slate-300">
                    {userLeagueProgress.nextLeague
                      ? `Objectif : ${userLeagueProgress.nextLeague.name}`
                      : "Division Ultime"}
                  </span>
                  <span className="text-amber-300 font-mono">
                    {userLeagueProgress.nextLeague
                      ? `${userLeagueProgress.xpToNext.toLocaleString()} XP requis`
                      : "MAX 👑"}
                  </span>
                </div>
                <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-full transition-all duration-700"
                    style={{ width: `${userLeagueProgress.progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Grille des 6 Ligues */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 relative z-10">
            {DUOLINGO_LEAGUES.map((league) => {
              const isCurrent = userLeagueProgress?.currentLeague.tier === league.tier;
              const isUnlocked = (profile?.experience_points || 0) >= league.minXp;

              return (
                <div
                  key={league.tier}
                  className={`rounded-2xl p-3 text-center transition-all flex flex-col items-center justify-between border-2 relative overflow-hidden ${
                    isCurrent
                      ? "border-amber-400 border-b-4 border-b-amber-600 bg-gradient-to-b from-amber-500/25 to-amber-900/40 shadow-lg scale-102 ring-2 ring-amber-400/50"
                      : isUnlocked
                      ? "border-emerald-600/50 border-b-4 border-b-emerald-800 bg-slate-800/80 hover:bg-slate-800"
                      : "border-slate-700 border-b-4 border-b-slate-800 bg-slate-900/50 opacity-60"
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute top-1 right-1 bg-amber-400 text-slate-950 font-black text-[9px] uppercase px-1.5 py-0.5 rounded-full shadow-sm">
                      VOUS
                    </div>
                  )}
                  <span className="text-3xl sm:text-4xl my-1 filter drop-shadow">
                    {league.icon}
                  </span>
                  <div className="w-full">
                    <span className="block font-black text-xs sm:text-sm text-white truncate">
                      {league.name.replace("Ligue ", "")}
                    </span>
                    <span className="block text-[11px] font-mono text-slate-400 mt-0.5">
                      {league.minXp.toLocaleString()} XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 🎮 SELECTEURS TACTILES 3D DUOLINGO (MODE & PORTEE) */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 border-b-4 border-b-slate-300 shadow-sm p-4 sm:p-5 space-y-4">
          {/* Modes de Jeu (XP vs Duels) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode("xp")}
              className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-black text-sm sm:text-base border-2 transition-all active:translate-y-1 active:border-b-2 cursor-pointer ${
                mode === "xp"
                  ? "bg-emerald-500 text-white border-emerald-400 border-b-4 border-b-emerald-700 shadow-md"
                  : "bg-white text-slate-700 border-slate-200 border-b-4 border-b-slate-300 hover:bg-slate-50"
              }`}
            >
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
              <span>{t("leaderboard.modeXp")}</span>
            </button>
            <button
              onClick={() => {
                setMode("duel_ranked");
                setPeriod("alltime");
              }}
              className={`flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-black text-sm sm:text-base border-2 transition-all active:translate-y-1 active:border-b-2 cursor-pointer ${
                mode === "duel_ranked"
                  ? "bg-purple-600 text-white border-purple-400 border-b-4 border-b-purple-800 shadow-md"
                  : "bg-white text-slate-700 border-slate-200 border-b-4 border-b-slate-300 hover:bg-slate-50"
              }`}
            >
              <Swords className="w-5 h-5 text-purple-200" />
              <span>{t("leaderboard.modeDuelRanked")}</span>
            </button>
          </div>

          {/* Portée (Mondial / Amis / Fédérations) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            <button
              onClick={() => setView("global")}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-black text-xs sm:text-sm border-2 transition-all active:translate-y-0.5 active:border-b-2 cursor-pointer ${
                view === "global"
                  ? "bg-emerald-600 text-white border-emerald-500 border-b-4 border-b-emerald-800 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 border-b-4 border-b-slate-300 hover:bg-slate-50"
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span>{t("leaderboard.global")}</span>
            </button>
            <button
              onClick={() => setView("friends")}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-black text-xs sm:text-sm border-2 transition-all active:translate-y-0.5 active:border-b-2 cursor-pointer ${
                view === "friends"
                  ? "bg-blue-600 text-white border-blue-500 border-b-4 border-b-blue-800 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 border-b-4 border-b-slate-300 hover:bg-slate-50"
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>{t("leaderboard.friends")}</span>
            </button>
            <button
              onClick={() => setView("nations")}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-black text-xs sm:text-sm border-2 transition-all active:translate-y-0.5 active:border-b-2 cursor-pointer ${
                view === "nations"
                  ? "bg-indigo-600 text-white border-indigo-500 border-b-4 border-b-indigo-800 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 border-b-4 border-b-slate-300 hover:bg-slate-50"
              }`}
            >
              <Shield className="w-4 h-4 shrink-0 text-amber-300" />
              <span>Fédérations & Blasons 🏛️</span>
            </button>
          </div>
        </div>

        {/* 📅 SELECTEUR DE PERIODE (MENSUEL / ALL-TIME) */}
        {mode === "xp" && view !== "nations" && (
          <div className="bg-white rounded-3xl border-2 border-slate-200 border-b-4 border-b-slate-300 shadow-sm p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                onClick={() => setPeriod("monthly")}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-black text-sm border-2 transition-all active:translate-y-0.5 active:border-b-2 cursor-pointer ${
                  period === "monthly"
                    ? "bg-blue-500 text-white border-blue-400 border-b-4 border-b-blue-700 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 border-b-4 border-b-slate-300 hover:bg-slate-50"
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>{t("leaderboard.thisMonth")}</span>
              </button>
              <button
                onClick={() => setPeriod("alltime")}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-black text-sm border-2 transition-all active:translate-y-0.5 active:border-b-2 cursor-pointer ${
                  period === "alltime"
                    ? "bg-purple-600 text-white border-purple-400 border-b-4 border-b-purple-800 shadow-sm"
                    : "bg-white text-slate-700 border-slate-200 border-b-4 border-b-slate-300 hover:bg-slate-50"
                }`}
              >
                <Flame className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>{t("leaderboard.allTime")}</span>
              </button>
            </div>
            {period === "monthly" && (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-4 py-2.5 text-xs font-semibold">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{t("leaderboard.monthlyReset")}</span>
              </div>
            )}
          </div>
        )}

        {/* 🏛️ VUE FEDERATIONS & NATIONS */}
        {view === "nations" ? (
          (() => {
            const myFedEntry = federationLeaderboard.find((f) => f.federation.id === myFederation.id);
            return (
              <div className="space-y-6">
                {/* Conquête des Nations ⚔️ */}
                <TerritorialConquestSection
                  userFederation={myFederation}
                  onOpenFederationModal={() => setShowFederationModal(true)}
                />

                {/* Bannière Tactile Blason Actuel */}
                <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white rounded-3xl p-6 sm:p-7 border-2 border-emerald-400 border-b-4 border-b-emerald-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5">
                  <div className="flex items-center gap-4 text-center sm:text-left">
                    <span className="text-5xl filter drop-shadow-md">{myFederation.flagEmoji}</span>
                    <div>
                      <span className="text-xs uppercase tracking-wider text-emerald-200 font-black block">
                        Votre Blason Actuel
                      </span>
                      <h3 className="text-2xl font-black text-white">
                        {myFederation.name} ({myFederation.shortCode})
                      </h3>
                      {myFedEntry && (
                        <p className="text-xs text-emerald-100 font-semibold mt-1">
                          Rang <strong className="text-white">#{myFedEntry.rank}</strong> • {myFedEntry.totalScore.toLocaleString()} points collectifs • {myFedEntry.membersCount} membre(s)
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowFederationModal(true)}
                    className="px-6 py-3 rounded-2xl bg-white text-emerald-900 font-black text-sm border-2 border-slate-200 border-b-4 border-b-slate-300 hover:bg-slate-50 transition-all shadow-md active:translate-y-1 active:border-b-2 cursor-pointer shrink-0"
                  >
                    Changer de Blason 🏛️
                  </button>
                </div>

                {/* Filtres de Fédérations */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  <button
                    onClick={() => setFederationFilter("all")}
                    className={`px-4 py-2.5 rounded-2xl font-black border-2 transition shrink-0 active:translate-y-0.5 active:border-b-2 cursor-pointer ${
                      federationFilter === "all"
                        ? "bg-purple-600 text-white border-purple-400 border-b-4 border-b-purple-800 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 border-b-4 border-b-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    Toutes les Fédérations ({federationLeaderboard.length})
                  </button>
                  <button
                    onClick={() => setFederationFilter("country")}
                    className={`px-4 py-2.5 rounded-2xl font-black border-2 transition shrink-0 active:translate-y-0.5 active:border-b-2 cursor-pointer ${
                      federationFilter === "country"
                        ? "bg-purple-600 text-white border-purple-400 border-b-4 border-b-purple-800 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 border-b-4 border-b-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    🌍 Pays
                  </button>
                  <button
                    onClick={() => setFederationFilter("canton")}
                    className={`px-4 py-2.5 rounded-2xl font-black border-2 transition shrink-0 active:translate-y-0.5 active:border-b-2 cursor-pointer ${
                      federationFilter === "canton"
                        ? "bg-purple-600 text-white border-purple-400 border-b-4 border-b-purple-800 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 border-b-4 border-b-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    🏔️ Cantons Suisses
                  </button>
                  <button
                    onClick={() => setFederationFilter("academic_club")}
                    className={`px-4 py-2.5 rounded-2xl font-black border-2 transition shrink-0 active:translate-y-0.5 active:border-b-2 cursor-pointer ${
                      federationFilter === "academic_club"
                        ? "bg-purple-600 text-white border-purple-400 border-b-4 border-b-purple-800 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 border-b-4 border-b-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    🎓 Écoles & Clubs
                  </button>
                </div>

                {/* 3D-Style Podium pour le Top 3 Fédérations */}
                {federationLeaderboard.length >= 3 && (
                  <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border-2 border-slate-700 border-b-4 border-b-slate-900">
                    <div className="text-center mb-6">
                      <span className="text-xs uppercase tracking-widest font-black text-amber-300">
                        Podium des Fédérations • {period === "monthly" ? "Ce Mois" : "Tous Temps"}
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500">
                        Les Nations Conquérantes 🏆
                      </h2>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-2xl mx-auto pt-4 pb-2">
                      {/* 2ème Place */}
                      {federationLeaderboard[1] && (
                        <div className="flex flex-col items-center">
                          <span className="text-3xl sm:text-4xl mb-1 filter drop-shadow">
                            {federationLeaderboard[1].federation.flagEmoji}
                          </span>
                          <span className="text-xs sm:text-sm font-black truncate max-w-full text-center text-slate-200">
                            {federationLeaderboard[1].federation.name}
                          </span>
                          <span className="text-xs font-mono font-black text-slate-300 mb-2">
                            {federationLeaderboard[1].totalScore.toLocaleString()} pts
                          </span>
                          <div className="w-full h-28 sm:h-36 rounded-t-2xl bg-gradient-to-t from-slate-800 to-slate-600 border-2 border-slate-400 border-b-0 border-t-4 border-t-slate-300 flex flex-col items-center justify-center shadow-lg">
                            <span className="text-2xl sm:text-3xl font-black text-slate-200">2</span>
                            <span className="text-[10px] font-black uppercase text-slate-400">Argent</span>
                          </div>
                        </div>
                      )}

                      {/* 1ère Place */}
                      {federationLeaderboard[0] && (
                        <div className="flex flex-col items-center">
                          <Crown className="w-7 h-7 sm:w-9 sm:h-9 text-amber-400 animate-bounce mb-1 filter drop-shadow" />
                          <span className="text-4xl sm:text-5xl mb-1 filter drop-shadow">
                            {federationLeaderboard[0].federation.flagEmoji}
                          </span>
                          <span className="text-sm sm:text-base font-black truncate max-w-full text-center text-amber-200">
                            {federationLeaderboard[0].federation.name}
                          </span>
                          <span className="text-xs sm:text-sm font-mono font-black text-amber-300 mb-2">
                            {federationLeaderboard[0].totalScore.toLocaleString()} pts
                          </span>
                          <div className="w-full h-36 sm:h-48 rounded-t-2xl bg-gradient-to-t from-amber-900/90 via-yellow-700/80 to-amber-500/90 border-2 border-amber-300 border-b-0 border-t-4 border-t-amber-200 flex flex-col items-center justify-center shadow-2xl shadow-amber-500/20">
                            <span className="text-3xl sm:text-4xl font-black text-amber-100">1</span>
                            <span className="text-[10px] sm:text-xs font-black uppercase text-amber-200">Or</span>
                          </div>
                        </div>
                      )}

                      {/* 3ème Place */}
                      {federationLeaderboard[2] && (
                        <div className="flex flex-col items-center">
                          <span className="text-3xl sm:text-4xl mb-1 filter drop-shadow">
                            {federationLeaderboard[2].federation.flagEmoji}
                          </span>
                          <span className="text-xs sm:text-sm font-black truncate max-w-full text-center text-amber-200">
                            {federationLeaderboard[2].federation.name}
                          </span>
                          <span className="text-xs font-mono font-black text-amber-400 mb-2">
                            {federationLeaderboard[2].totalScore.toLocaleString()} pts
                          </span>
                          <div className="w-full h-24 sm:h-30 rounded-t-2xl bg-gradient-to-t from-amber-950 to-amber-800 border-2 border-amber-600 border-b-0 border-t-4 border-t-amber-500 flex flex-col items-center justify-center shadow-lg">
                            <span className="text-2xl sm:text-3xl font-black text-amber-300">3</span>
                            <span className="text-[10px] font-black uppercase text-amber-500">Bronze</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tableau Complet des Fédérations */}
                <div className="bg-white rounded-3xl shadow-sm overflow-hidden border-2 border-slate-200 border-b-4 border-b-slate-300">
                  <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <h3 className="font-black text-slate-800 text-base sm:text-lg flex items-center gap-2">
                      <Shield className="w-5 h-5 text-indigo-600" />
                      Classement Complet des Blasons
                    </h3>
                    <span className="text-xs font-bold text-slate-500">
                      {federationLeaderboard.filter((item) => {
                        if (federationFilter === "country") return item.federation.category === "country";
                        if (federationFilter === "canton") return item.federation.category === "canton";
                        if (federationFilter === "academic_club")
                          return item.federation.category === "academic" || item.federation.category === "club";
                        return true;
                      }).length}{" "}
                      fédérations
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
                          <th className="py-3.5 px-4 text-center w-16">Rang</th>
                          <th className="py-3.5 px-4">Fédération / Nation</th>
                          <th className="py-3.5 px-4 hidden sm:table-cell">Catégorie</th>
                          <th className="py-3.5 px-4 text-center">Membres</th>
                          <th className="py-3.5 px-4 text-right">Score Total</th>
                          <th className="py-3.5 px-4 text-right hidden md:table-cell">Moyenne / joueur</th>
                          <th className="py-3.5 px-4 hidden lg:table-cell">Top Champion</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {federationLeaderboard
                          .filter((item) => {
                            if (federationFilter === "country") return item.federation.category === "country";
                            if (federationFilter === "canton") return item.federation.category === "canton";
                            if (federationFilter === "academic_club")
                              return item.federation.category === "academic" || item.federation.category === "club";
                            return true;
                          })
                          .map((item) => {
                            const isMyFed = item.federation.id === myFederation.id;
                            const medal =
                              item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : item.rank === 3 ? "🥉" : `#${item.rank}`;

                            return (
                              <tr
                                key={item.federation.id}
                                className={`transition ${
                                  isMyFed
                                    ? "bg-emerald-50/90 font-bold"
                                    : "hover:bg-slate-50"
                                }`}
                              >
                                <td className="py-3.5 px-4 text-center font-black text-slate-700">
                                  {medal}
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-3">
                                    <span className="text-2xl filter drop-shadow-sm">{item.federation.flagEmoji}</span>
                                    <div>
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-black text-slate-900">
                                          {item.federation.name}
                                        </span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono font-bold">
                                          {item.federation.shortCode}
                                        </span>
                                        {isMyFed && (
                                          <span className="text-[10px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded-full shadow-sm">
                                            Votre Blason
                                          </span>
                                        )}
                                      </div>
                                      {item.federation.description && (
                                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                          {item.federation.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 hidden sm:table-cell">
                                  <span className="text-xs px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold capitalize">
                                    {item.federation.category === "country"
                                      ? "Pays"
                                      : item.federation.category === "canton"
                                      ? "Canton"
                                      : item.federation.category === "academic"
                                      ? "École / Club"
                                      : "Club"}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center font-black text-slate-700">
                                  {item.membersCount}
                                </td>
                                <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600 text-base">
                                  {item.totalScore.toLocaleString()}
                                </td>
                                <td className="py-3.5 px-4 text-right font-mono text-slate-500 text-xs hidden md:table-cell">
                                  {item.averageScore.toLocaleString()} pts
                                </td>
                                <td className="py-3.5 px-4 text-slate-600 text-xs hidden lg:table-cell">
                                  {item.topPlayerPseudo ? (
                                    <span className="font-bold text-indigo-600">
                                      👑 {item.topPlayerPseudo} ({item.topPlayerScore?.toLocaleString()} pts)
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          /* 👥 CLASSEMENT JOUEURS (MONDIAL OU AMIS) */
          <>
            {loading ? (
              <div className="bg-white rounded-3xl border-2 border-slate-200 border-b-4 border-b-slate-300 p-12 text-center shadow-sm">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-emerald-600 mx-auto" />
                <p className="mt-4 font-black text-slate-700">{t("leaderboard.loading")}</p>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="bg-white rounded-3xl border-2 border-slate-200 border-b-4 border-b-slate-300 p-12 text-center shadow-sm">
                <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-black text-slate-800 mb-2">
                  {t("leaderboard.noPlayers")}
                </h3>
                <p className="text-slate-500 font-medium">{t("leaderboard.emptyLeaderboard")}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 🌟 PODIUM 3D DUOLINGO POUR LE TOP 3 JOUEURS */}
                {leaderboard.length >= 3 && (
                  <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border-2 border-slate-700 border-b-4 border-b-slate-900">
                    <div className="text-center mb-6">
                      <span className="text-xs uppercase tracking-widest font-black text-amber-300">
                        Top Conquérants • {mode === "duel_ranked" ? "Duels Elo" : period === "monthly" ? "Ce Mois" : "Tous Temps"}
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500">
                        Podium des Champions 🏆
                      </h2>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-2xl mx-auto pt-6 pb-2">
                      {/* 2ème Place */}
                      {leaderboard[1] && (
                        <div
                          onClick={() => navigate(`/profile/${leaderboard[1].id}`)}
                          className="flex flex-col items-center cursor-pointer group transition-transform hover:scale-102"
                        >
                          <div className="relative mb-2">
                            <Avatar
                              url={(leaderboard[1] as any).avatar_url}
                              pseudo={leaderboard[1].pseudo}
                              frameStyle={(leaderboard[1] as any).frame_style}
                              size="lg"
                              className="rounded-2xl"
                            />
                            <div className="absolute -bottom-2 -right-1 bg-slate-200 border-2 border-slate-400 text-slate-800 text-[10px] font-black rounded-lg px-1.5 py-0.5 shadow">
                              Niv. {leaderboard[1].level}
                            </div>
                          </div>
                          <span className="text-xs sm:text-sm font-black truncate max-w-full text-center text-slate-200 group-hover:text-amber-300">
                            {leaderboard[1].pseudo}
                          </span>
                          <span className="text-xs font-mono font-black text-slate-300 mb-2">
                            {leaderboard[1].total_score.toLocaleString()} {mode === "duel_ranked" ? "Elo" : "XP"}
                          </span>
                          <div className="w-full h-28 sm:h-36 rounded-t-2xl bg-gradient-to-t from-slate-800 to-slate-600 border-2 border-slate-400 border-b-0 border-t-4 border-t-slate-300 flex flex-col items-center justify-center shadow-lg">
                            <span className="text-2xl sm:text-3xl font-black text-slate-200">2</span>
                            <span className="text-[10px] font-black uppercase text-slate-400">Argent</span>
                          </div>
                        </div>
                      )}

                      {/* 1ère Place */}
                      {leaderboard[0] && (
                        <div
                          onClick={() => navigate(`/profile/${leaderboard[0].id}`)}
                          className="flex flex-col items-center cursor-pointer group transition-transform hover:scale-102"
                        >
                          <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 animate-bounce mb-1 filter drop-shadow" />
                          <div className="relative mb-2">
                            <Avatar
                              url={(leaderboard[0] as any).avatar_url}
                              pseudo={leaderboard[0].pseudo}
                              frameStyle={(leaderboard[0] as any).frame_style}
                              size="xl"
                              className="rounded-2xl ring-4 ring-amber-400/50"
                            />
                            <div className="absolute -bottom-2 -right-1 bg-amber-400 border-2 border-amber-600 text-amber-950 text-[11px] font-black rounded-lg px-2 py-0.5 shadow">
                              Niv. {leaderboard[0].level}
                            </div>
                          </div>
                          <span className="text-sm sm:text-base font-black truncate max-w-full text-center text-amber-200 group-hover:text-amber-100">
                            {leaderboard[0].pseudo}
                          </span>
                          <span className="text-xs sm:text-sm font-mono font-black text-amber-300 mb-2">
                            {leaderboard[0].total_score.toLocaleString()} {mode === "duel_ranked" ? "Elo" : "XP"}
                          </span>
                          <div className="w-full h-36 sm:h-48 rounded-t-2xl bg-gradient-to-t from-amber-900/90 via-yellow-700/80 to-amber-500/90 border-2 border-amber-300 border-b-0 border-t-4 border-t-amber-200 flex flex-col items-center justify-center shadow-2xl shadow-amber-500/30">
                            <span className="text-3xl sm:text-4xl font-black text-amber-100">1</span>
                            <span className="text-[10px] sm:text-xs font-black uppercase text-amber-200">Or</span>
                          </div>
                        </div>
                      )}

                      {/* 3ème Place */}
                      {leaderboard[2] && (
                        <div
                          onClick={() => navigate(`/profile/${leaderboard[2].id}`)}
                          className="flex flex-col items-center cursor-pointer group transition-transform hover:scale-102"
                        >
                          <div className="relative mb-2">
                            <Avatar
                              url={(leaderboard[2] as any).avatar_url}
                              pseudo={leaderboard[2].pseudo}
                              frameStyle={(leaderboard[2] as any).frame_style}
                              size="lg"
                              className="rounded-2xl"
                            />
                            <div className="absolute -bottom-2 -right-1 bg-amber-600 border-2 border-amber-800 text-amber-100 text-[10px] font-black rounded-lg px-1.5 py-0.5 shadow">
                              Niv. {leaderboard[2].level}
                            </div>
                          </div>
                          <span className="text-xs sm:text-sm font-black truncate max-w-full text-center text-amber-200 group-hover:text-amber-300">
                            {leaderboard[2].pseudo}
                          </span>
                          <span className="text-xs font-mono font-black text-amber-400 mb-2">
                            {leaderboard[2].total_score.toLocaleString()} {mode === "duel_ranked" ? "Elo" : "XP"}
                          </span>
                          <div className="w-full h-24 sm:h-30 rounded-t-2xl bg-gradient-to-t from-amber-950 to-amber-800 border-2 border-amber-600 border-b-0 border-t-4 border-t-amber-500 flex flex-col items-center justify-center shadow-lg">
                            <span className="text-2xl sm:text-3xl font-black text-amber-300">3</span>
                            <span className="text-[10px] font-black uppercase text-amber-500">Bronze</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Bannière Zone de Promotion Duolingo */}
                <div className="flex items-center justify-between px-5 py-3 rounded-2xl bg-emerald-100 border-2 border-emerald-300 border-b-4 border-b-emerald-500 text-emerald-900 shadow-sm">
                  <div className="flex items-center gap-2">
                    <ArrowUp className="w-5 h-5 text-emerald-700 animate-bounce" />
                    <span className="font-black text-xs sm:text-sm uppercase tracking-wide">
                      Zone de Promotion • Top 10 (Montée en Division Supérieure)
                    </span>
                  </div>
                  <span className="text-xs font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-full shadow-sm">
                    10 places
                  </span>
                </div>

                {/* Liste des Joueurs */}
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => {
                    const isCurrentUser = entry.id === profile?.id;
                    const isTop10 = index < 10;
                    const showRelegationDivider = index === 10;

                    return (
                      <div key={entry.id}>
                        {/* Séparateur Zone de Maintien */}
                        {showRelegationDivider && (
                          <div className="my-4 flex items-center justify-between px-5 py-2.5 rounded-2xl bg-slate-100 border-2 border-slate-300 border-b-4 border-b-slate-400 text-slate-700 shadow-sm">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-slate-500" />
                              <span className="font-black text-xs uppercase tracking-wide">
                                Zone de Maintien de Division
                              </span>
                            </div>
                            <span className="text-[11px] font-bold text-slate-500">
                              Rang 11 à {leaderboard.length}
                            </span>
                          </div>
                        )}

                        <div
                          onClick={() => navigate(`/profile/${entry.id}`)}
                          className={`rounded-2xl border-2 p-4 sm:p-5 transition-all cursor-pointer relative overflow-hidden flex items-center justify-between gap-4 group ${
                            isCurrentUser
                              ? "bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-400 border-b-4 border-b-emerald-600 shadow-md ring-2 ring-emerald-400/40"
                              : isTop10
                              ? "bg-white border-slate-200 border-b-4 border-b-slate-300 hover:border-emerald-300 hover:border-b-emerald-500 shadow-sm hover:-translate-y-0.5"
                              : "bg-white border-slate-200 border-b-4 border-b-slate-300 hover:border-slate-300 hover:border-b-slate-400 shadow-sm hover:-translate-y-0.5"
                          }`}
                        >
                          {/* Badge Utilisateur Courant */}
                          {isCurrentUser && (
                            <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                              <span>{t("leaderboard.you")}</span>
                            </div>
                          )}

                          {/* Gauche: Rang + Avatar + Infos */}
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                            {/* Rang Tactile */}
                            {getRankBadge(index)}

                            {/* Avatar Joueur */}
                            <div className="relative shrink-0">
                              <Avatar
                                url={(entry as any).avatar_url}
                                pseudo={entry.pseudo}
                                frameStyle={(entry as any).frame_style}
                                size="md"
                                className="rounded-2xl shadow-sm"
                              />
                            </div>

                            {/* Pseudo et Métadonnées */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-black text-slate-900 text-base sm:text-lg truncate group-hover:text-emerald-700 transition-colors">
                                  {entry.pseudo}
                                </h3>
                                {entry.role === "admin" && (
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-200">
                                    Admin
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap text-xs font-semibold text-slate-500">
                                <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 text-slate-700">
                                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                                  {t("profile.level")} {entry.level}
                                </span>

                                {(entry.current_streak ?? 0) > 0 && (
                                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-lg">
                                    <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                                    {entry.current_streak} j
                                  </span>
                                )}

                                {mode === "xp" && period === "monthly" && entry.games_played > 0 && (
                                  <span className="hidden sm:inline-block">
                                    {entry.games_played} {getGameText(entry.games_played)}
                                  </span>
                                )}

                                {mode === "duel_ranked" && entry.games_played > 0 && (
                                  <span className="hidden sm:inline-block text-purple-700">
                                    {entry.games_played} {t("leaderboard.rankedGames")} • {getWinRate(entry)}% victoires
                                  </span>
                                )}

                                {mode === "xp" && (entry.top_10_count ?? 0) > 0 && isTop10 && (
                                  <span className="hidden md:inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 border border-yellow-200 px-2 py-0.5 rounded-lg">
                                    <Crown className="w-3 h-3 text-amber-600" />
                                    {entry.top_10_count}x {t("leaderboard.top10")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Droite: Score & Flèche */}
                          <div className="flex items-center gap-3 shrink-0 text-right">
                            <div>
                              <p className={`text-2xl sm:text-3xl font-black font-mono leading-none ${
                                mode === "duel_ranked" ? "text-purple-600" : "text-emerald-600"
                              }`}>
                                {entry.total_score.toLocaleString()}
                              </p>
                              <p className="text-[11px] font-black uppercase text-slate-400 mt-1">
                                {mode === "duel_ranked"
                                  ? t("leaderboard.duelRating")
                                  : period === "monthly"
                                  ? t("leaderboard.monthlyPoints")
                                  : t("leaderboard.totalXP")}
                              </p>
                            </div>

                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal choix de fédération */}
        <FederationSelectModal
          isOpen={showFederationModal}
          onClose={() => setShowFederationModal(false)}
          currentFederationId={myFederation.id}
          userId={profile?.id}
          onFederationChanged={(fed) => {
            setMyFederation(fed);
            loadLeaderboard();
          }}
        />
      </div>
    </div>
  );
}
