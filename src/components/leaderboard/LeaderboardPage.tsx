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
} from "lucide-react";
import type { Database } from "../../lib/database.types";
import { fetchUserFriends } from "../../lib/queries/friendQueries";
import {
  aggregateFederationLeaderboard,
  getUserFederation,
  type FederationLeaderboardEntry,
  type Federation,
} from "../../lib/federations";
import { FederationSelectModal } from "../profile/modals/FederationSelectModal";

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
      // (last_reset_month = mois en cours quand ils ont joué au moins une partie)
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
          // Pour "all time", utiliser experience_points comme score total
          return {
            ...p,
            total_score: p.experience_points || 0,
            games_played: 0, // Pas de compteur de parties pour all-time
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

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-8 h-8 text-yellow-500" />;
    if (index === 1)
      return (
        <div className="relative w-8 h-8">
          <Medal className="w-8 h-8 text-gray-400" />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
            2
          </span>
        </div>
      );
    if (index === 2)
      return (
        <div className="relative w-8 h-8">
          <Medal className="w-8 h-8 text-amber-600" />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-amber-800">
            3
          </span>
        </div>
      );
    return (
      <span className="text-lg font-bold text-gray-500 w-8 text-center">
        #{index + 1}
      </span>
    );
  };

  const getRankBackground = (index: number, entry: LeaderboardEntry) => {
    const isCurrentUser = entry.id === profile?.id;

    if (index === 0)
      return `border-4 ${
        isCurrentUser
          ? "border-yellow-500 bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 shadow-2xl"
          : "border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-100 shadow-xl"
      }`;
    if (index === 1)
      return `border-4 ${
        isCurrentUser
          ? "border-gray-400 bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 shadow-2xl"
          : "border-gray-300 bg-gradient-to-br from-gray-50 to-gray-200 shadow-lg"
      }`;
    if (index === 2)
      return `border-4 ${
        isCurrentUser
          ? "border-amber-500 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 shadow-2xl"
          : "border-amber-400 bg-gradient-to-br from-amber-50 to-orange-100 shadow-lg"
      }`;
    if (index < 10 && period === "monthly" && mode === "xp")
      return `border-2 ${
        isCurrentUser
          ? "border-emerald-500 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 shadow-xl"
          : "border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-md"
      }`;

    return `border-2 ${
      isCurrentUser
        ? "border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg"
        : "border-gray-200 bg-white hover:border-gray-300 shadow-sm"
    }`;
  };

  const getGameText = (count: number) => {
    return count <= 1 ? t("leaderboard.game") : t("leaderboard.games");
  };
  const getWinRate = (entry: LeaderboardEntry) => {
    if (!entry.games_played) return 0;
    return Math.round((entry.wins / entry.games_played) * 100);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
          <Trophy className="w-10 h-10 mr-3 text-emerald-600" />
          {t("leaderboard.title")}
        </h1>
        <p className="text-gray-600">{t("leaderboard.subtitle")}</p>
      </div>

      {/* Sélecteur Global/Amis */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl shadow-md p-4 mb-4">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            onClick={() => setMode("xp")}
            className={`flex items-center justify-center px-6 py-3 rounded-xl font-bold transition-all ${
              mode === "xp"
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg scale-105"
                : "bg-white text-gray-600 hover:bg-gray-50 shadow"
            }`}
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            {t("leaderboard.modeXp")}
          </button>
          <button
            onClick={() => {
              setMode("duel_ranked");
              setPeriod("alltime");
            }}
            className={`flex items-center justify-center px-6 py-3 rounded-xl font-bold transition-all ${
              mode === "duel_ranked"
                ? "bg-gradient-to-r from-purple-500 to-purple-700 text-white shadow-lg scale-105"
                : "bg-white text-gray-600 hover:bg-gray-50 shadow"
            }`}
          >
            <Trophy className="w-5 h-5 mr-2" />
            {t("leaderboard.modeDuelRanked")}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          <button
            onClick={() => setView("global")}
            className={`flex items-center justify-center px-4 py-3 rounded-xl font-bold transition-all text-sm ${
              view === "global"
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg scale-102"
                : "bg-white text-gray-600 hover:bg-gray-50 shadow"
            }`}
          >
            <TrendingUp className="w-4 h-4 mr-2 shrink-0" />
            {t("leaderboard.global")}
          </button>
          <button
            onClick={() => setView("friends")}
            className={`flex items-center justify-center px-4 py-3 rounded-xl font-bold transition-all text-sm ${
              view === "friends"
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-102"
                : "bg-white text-gray-600 hover:bg-gray-50 shadow"
            }`}
          >
            <Users className="w-4 h-4 mr-2 shrink-0" />
            {t("leaderboard.friends")}
          </button>
          <button
            onClick={() => setView("nations")}
            className={`flex items-center justify-center px-4 py-3 rounded-xl font-bold transition-all text-sm ${
              view === "nations"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg scale-102"
                : "bg-white text-gray-600 hover:bg-gray-50 shadow"
            }`}
          >
            <Shield className="w-4 h-4 mr-2 shrink-0 text-amber-300" />
            <span>Fédérations & Nations 🏛️</span>
          </button>
        </div>
      </div>

      {/* Sélecteur Mensuel/Tout temps */}
      {mode === "xp" && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-md p-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPeriod("monthly")}
            className={`flex flex-col items-center justify-center px-6 py-4 rounded-xl font-bold transition-all ${
              period === "monthly"
                ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg scale-105"
                : "bg-white text-gray-600 hover:bg-gray-50 shadow"
            }`}
          >
            <Calendar className="w-6 h-6 mb-1" />
            <span className="text-sm">{t("leaderboard.thisMonth")}</span>
          </button>
          <button
            onClick={() => setPeriod("alltime")}
            className={`flex flex-col items-center justify-center px-6 py-4 rounded-xl font-bold transition-all ${
              period === "alltime"
                ? "bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg scale-105"
                : "bg-white text-gray-600 hover:bg-gray-50 shadow"
            }`}
          >
            <Flame className="w-6 h-6 mb-1" />
            <span className="text-sm">{t("leaderboard.allTime")}</span>
          </button>
        </div>
        {period === "monthly" && (
          <p className="text-sm text-gray-600 mt-3 text-center bg-white bg-opacity-70 rounded-lg py-2 px-4">
            {t("leaderboard.monthlyReset")}
          </p>
        )}
      </div>
      )}

      {/* Affichage Fédérations & Nations */}
      {view === "nations" ? (
        (() => {
          const myFedEntry = federationLeaderboard.find((f) => f.federation.id === myFederation.id);
          return (
            <div className="space-y-6">
          {/* User's current federation banner */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <span className="text-4xl">{myFederation.flagEmoji}</span>
              <div>
                <span className="text-xs uppercase tracking-wider text-emerald-200 font-bold block">
                  Votre Blason Actuel
                </span>
                <h3 className="text-xl font-black text-white">
                  {myFederation.name} ({myFederation.shortCode})
                </h3>
                {myFedEntry && (
                  <p className="text-xs text-emerald-100 mt-0.5">
                    Rang <strong>#{myFedEntry.rank}</strong> • {myFedEntry.totalScore.toLocaleString()} points collectifs • {myFedEntry.membersCount} membre(s)
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFederationModal(true)}
              className="px-5 py-2.5 rounded-xl bg-white text-emerald-800 font-extrabold text-sm hover:bg-emerald-50 transition-all shadow-md transform active:scale-98 shrink-0"
            >
              Changer de Blason 🏛️
            </button>
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setFederationFilter("all")}
              className={`px-3.5 py-2 rounded-xl font-bold transition shrink-0 ${
                federationFilter === "all"
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              Toutes les Fédérations ({federationLeaderboard.length})
            </button>
            <button
              onClick={() => setFederationFilter("country")}
              className={`px-3.5 py-2 rounded-xl font-bold transition shrink-0 ${
                federationFilter === "country"
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              🌍 Pays
            </button>
            <button
              onClick={() => setFederationFilter("canton")}
              className={`px-3.5 py-2 rounded-xl font-bold transition shrink-0 ${
                federationFilter === "canton"
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              🏔️ Cantons Suisses
            </button>
            <button
              onClick={() => setFederationFilter("academic_club")}
              className={`px-3.5 py-2 rounded-xl font-bold transition shrink-0 ${
                federationFilter === "academic_club"
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              🎓 Écoles & Clubs
            </button>
          </div>

          {/* 3D-Style Podium for Top 3 Federations */}
          {federationLeaderboard.length >= 3 && (
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-indigo-900/50">
              <div className="text-center mb-6">
                <span className="text-xs uppercase tracking-widest font-extrabold text-amber-300">
                  Podium des Fédérations • {period === "monthly" ? "Ce Mois" : "Tous Temps"}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500">
                  Les Nations les plus Conquérantes 🏆
                </h2>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-2xl mx-auto pt-4 pb-2">
                {/* 2nd Place */}
                {federationLeaderboard[1] && (
                  <div className="flex flex-col items-center">
                    <span className="text-3xl sm:text-4xl mb-1">
                      {federationLeaderboard[1].federation.flagEmoji}
                    </span>
                    <span className="text-xs sm:text-sm font-bold truncate max-w-full text-center text-slate-200">
                      {federationLeaderboard[1].federation.name}
                    </span>
                    <span className="text-xs font-mono font-black text-slate-300 mb-2">
                      {federationLeaderboard[1].totalScore.toLocaleString()} pts
                    </span>
                    <div className="w-full h-28 sm:h-36 rounded-t-2xl bg-gradient-to-t from-slate-800 to-slate-600 border-t-4 border-slate-300 flex flex-col items-center justify-center shadow-lg">
                      <span className="text-2xl sm:text-3xl font-black text-slate-200">2</span>
                      <span className="text-[10px] font-bold uppercase text-slate-400">Argent</span>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {federationLeaderboard[0] && (
                  <div className="flex flex-col items-center">
                    <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400 animate-bounce mb-1" />
                    <span className="text-4xl sm:text-5xl mb-1">
                      {federationLeaderboard[0].federation.flagEmoji}
                    </span>
                    <span className="text-sm sm:text-base font-extrabold truncate max-w-full text-center text-amber-200">
                      {federationLeaderboard[0].federation.name}
                    </span>
                    <span className="text-xs sm:text-sm font-mono font-black text-amber-300 mb-2">
                      {federationLeaderboard[0].totalScore.toLocaleString()} pts
                    </span>
                    <div className="w-full h-36 sm:h-48 rounded-t-2xl bg-gradient-to-t from-amber-900/90 via-yellow-700/80 to-amber-500/90 border-t-4 border-amber-300 flex flex-col items-center justify-center shadow-2xl shadow-amber-500/20">
                      <span className="text-3xl sm:text-4xl font-black text-amber-100">1</span>
                      <span className="text-[10px] sm:text-xs font-bold uppercase text-amber-200">Or</span>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {federationLeaderboard[2] && (
                  <div className="flex flex-col items-center">
                    <span className="text-3xl sm:text-4xl mb-1">
                      {federationLeaderboard[2].federation.flagEmoji}
                    </span>
                    <span className="text-xs sm:text-sm font-bold truncate max-w-full text-center text-amber-200">
                      {federationLeaderboard[2].federation.name}
                    </span>
                    <span className="text-xs font-mono font-black text-amber-400 mb-2">
                      {federationLeaderboard[2].totalScore.toLocaleString()} pts
                    </span>
                    <div className="w-full h-24 sm:h-30 rounded-t-2xl bg-gradient-to-t from-amber-950 to-amber-800 border-t-4 border-amber-600 flex flex-col items-center justify-center shadow-lg">
                      <span className="text-2xl sm:text-3xl font-black text-amber-300">3</span>
                      <span className="text-[10px] font-bold uppercase text-amber-500">Bronze</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Full Nations Table */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            <div className="p-4 sm:p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-base sm:text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                Classement Complet des Blasons
              </h3>
              <span className="text-xs text-gray-500">
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
                  <tr className="bg-gray-100 text-[11px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                    <th className="py-3 px-4 text-center w-16">Rang</th>
                    <th className="py-3 px-4">Fédération / Nation</th>
                    <th className="py-3 px-4 hidden sm:table-cell">Catégorie</th>
                    <th className="py-3 px-4 text-center">Membres</th>
                    <th className="py-3 px-4 text-right">Score Total</th>
                    <th className="py-3 px-4 text-right hidden md:table-cell">Moyenne / joueur</th>
                    <th className="py-3 px-4 hidden lg:table-cell">Top Champion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
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
                              ? "bg-emerald-50/80 font-semibold"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <td className="py-3.5 px-4 text-center font-bold text-gray-700">
                            {medal}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{item.federation.flagEmoji}</span>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-gray-900">
                                    {item.federation.name}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600 font-mono">
                                    {item.federation.shortCode}
                                  </span>
                                  {isMyFed && (
                                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full shadow-sm">
                                      Votre Blason
                                    </span>
                                  )}
                                </div>
                                {item.federation.description && (
                                  <p className="text-xs text-gray-500 line-clamp-1">
                                    {item.federation.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 hidden sm:table-cell">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium capitalize">
                              {item.federation.category === "country"
                                ? "Pays"
                                : item.federation.category === "canton"
                                ? "Canton"
                                : item.federation.category === "academic"
                                ? "École / Académie"
                                : "Club"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-semibold text-gray-700">
                            {item.membersCount}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600 text-base">
                            {item.totalScore.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-gray-500 text-xs hidden md:table-cell">
                            {item.averageScore.toLocaleString()} pts
                          </td>
                          <td className="py-3.5 px-4 text-gray-600 text-xs hidden lg:table-cell">
                            {item.topPlayerPseudo ? (
                              <span className="font-semibold text-indigo-600">
                                👑 {item.topPlayerPseudo} ({item.topPlayerScore?.toLocaleString()} pts)
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
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
        /* Liste du classement Joueurs (Global ou Amis) */
        <>
          {loading ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">{t("leaderboard.loading")}</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {t("leaderboard.noPlayers")}
              </h3>
              <p className="text-gray-500">{t("leaderboard.emptyLeaderboard")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.id}
                  onClick={() => navigate(`/profile/${entry.id}`)}
                  className={`${getRankBackground(
                    index,
                    entry
                  )} rounded-xl p-6 transition-all hover:scale-[1.02] cursor-pointer relative overflow-hidden`}
                >
                  {/* Badge utilisateur actuel */}
                  {entry.id === profile?.id && (
                    <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      {t("leaderboard.you")}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Icône de rang */}
                      <div className="flex-shrink-0">{getRankIcon(index)}</div>

                      <Avatar
                        url={(entry as any).avatar_url}
                        pseudo={entry.pseudo}
                        frameStyle={(entry as any).frame_style}
                        size="md"
                      />

                      {/* Info joueur */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-gray-800 truncate">
                          {entry.pseudo}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1 flex-wrap">
                          <span className="text-sm text-gray-600 flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {t("profile.level")} {entry.level}
                          </span>
                          {mode === "xp" && period === "monthly" && entry.games_played > 0 && (
                            <span className="text-sm text-gray-500">
                              {entry.games_played} {getGameText(entry.games_played)}
                            </span>
                          )}
                          {mode === "duel_ranked" && entry.games_played > 0 && (
                            <span className="text-sm text-gray-500">
                              {entry.games_played} {t("leaderboard.rankedGames")} -{" "}
                              {getWinRate(entry)}%
                            </span>
                          )}
                          {mode === "xp" && (entry.top_10_count ?? 0) > 0 && index < 10 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow">
                              <Crown className="w-3 h-3 mr-1" />
                              {entry.top_10_count}x {t("leaderboard.top10")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right ml-4">
                      <p className="text-3xl font-bold text-emerald-600">
                        {entry.total_score.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {mode === "duel_ranked"
                          ? t("leaderboard.duelRating")
                          : period === "monthly"
                          ? t("leaderboard.monthlyPoints")
                          : t("leaderboard.totalXP")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
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
  );
}
