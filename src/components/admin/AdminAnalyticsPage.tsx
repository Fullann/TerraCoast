import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { BarChart3, Download, Shield, TrendingUp, Users, BookOpen } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { Database } from "../../lib/database.types";

type SessionRow = Pick<
  Database["public"]["Tables"]["game_sessions"]["Row"],
  "started_at" | "player_id" | "score" | "accuracy_percentage"
>;
type QuizTagRow = Pick<Database["public"]["Tables"]["quizzes"]["Row"], "category" | "tags" | "total_plays">;

interface RangeMetrics {
  sessions: number;
  uniquePlayers: number;
  averageScore: number;
  averageAccuracy: number;
  newUsers: number;
  newQuizzes: number;
}

interface AnalyticsWindow {
  label: string;
  days: number;
  current: RangeMetrics;
  previous: RangeMetrics;
}

interface TopItem {
  key: string;
  value: number;
}

interface PlayerStats {
  totalUsers: number;
  active24h: number;
  active7d: number;
  active30d: number;
  avgSessionsPerActivePlayer30d: number;
  avgScorePerActivePlayer30d: number;
  returningUsers30dFrom7d: number;
  retentionApproxPercent: number;
  newPlayers30d: number;
  existingPlayers30d: number;
  activeRatio30d: number;
  topPlayers30d: Array<{ playerId: string; pseudo: string; sessions: number; avgScore: number }>;
}

function percentDelta(current: number, previous: number): string {
  if (previous === 0) {
    if (current === 0) return "0%";
    return "+100%";
  }
  const delta = ((current - previous) / previous) * 100;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)}%`;
}

export function AdminAnalyticsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [windows, setWindows] = useState<AnalyticsWindow[]>([]);
  const [topCategories, setTopCategories] = useState<TopItem[]>([]);
  const [topTags, setTopTags] = useState<TopItem[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    totalUsers: 0,
    active24h: 0,
    active7d: 0,
    active30d: 0,
    avgSessionsPerActivePlayer30d: 0,
    avgScorePerActivePlayer30d: 0,
    returningUsers30dFrom7d: 0,
    retentionApproxPercent: 0,
    newPlayers30d: 0,
    existingPlayers30d: 0,
    activeRatio30d: 0,
    topPlayers30d: [],
  });

  useEffect(() => {
    if (profile?.role === "admin") {
      void loadAnalytics();
    }
  }, [profile]);

  const fetchRangeMetrics = async (from: Date, to: Date): Promise<RangeMetrics> => {
    const fromIso = from.toISOString();
    const toIso = to.toISOString();

    const { data: sessionsData } = await supabase
      .from("game_sessions")
      .select("started_at, player_id, score, accuracy_percentage")
      .eq("completed", true)
      .gte("started_at", fromIso)
      .lt("started_at", toIso);
    const sessions = (sessionsData || []) as SessionRow[];

    const { count: newUsersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", fromIso)
      .lt("created_at", toIso);
    const { count: newQuizzesCount } = await supabase
      .from("quizzes")
      .select("*", { count: "exact", head: true })
      .gte("created_at", fromIso)
      .lt("created_at", toIso);

    const uniquePlayers = new Set(sessions.map((s) => s.player_id).filter(Boolean)).size;
    const averageScore =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length
        : 0;
    const averageAccuracy =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (s.accuracy_percentage || 0), 0) / sessions.length
        : 0;

    return {
      sessions: sessions.length,
      uniquePlayers,
      averageScore,
      averageAccuracy,
      newUsers: newUsersCount || 0,
      newQuizzes: newQuizzesCount || 0,
    };
  };

  const buildWindow = async (label: string, days: number): Promise<AnalyticsWindow> => {
    const endCurrent = new Date();
    const startCurrent = new Date(endCurrent);
    startCurrent.setDate(startCurrent.getDate() - days);
    const startPrevious = new Date(startCurrent);
    startPrevious.setDate(startPrevious.getDate() - days);

    const [current, previous] = await Promise.all([
      fetchRangeMetrics(startCurrent, endCurrent),
      fetchRangeMetrics(startPrevious, startCurrent),
    ]);

    return { label, days, current, previous };
  };

  const loadTopTagsAndCategories = async () => {
    const { data } = await supabase
      .from("quizzes")
      .select("category, tags, total_plays")
      .order("total_plays", { ascending: false })
      .limit(300);
    const rows = (data || []) as QuizTagRow[];

    const categoryScores = new Map<string, number>();
    const tagScores = new Map<string, number>();

    rows.forEach((row) => {
      const weight = row.total_plays || 0;
      categoryScores.set(row.category, (categoryScores.get(row.category) || 0) + weight);
      (row.tags || []).forEach((tag) => {
        const key = tag.trim().toLowerCase();
        if (!key) return;
        tagScores.set(key, (tagScores.get(key) || 0) + weight);
      });
    });

    const topCats = [...categoryScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([key, value]) => ({ key, value }));
    const topTagsRows = [...tagScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([key, value]) => ({ key, value }));

    setTopCategories(topCats);
    setTopTags(topTagsRows);
  };

  const loadPlayerStats = async () => {
    const now = new Date();
    const start24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const start7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const start30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: totalUsersCount },
      { data: sessions24h },
      { data: sessions7d },
      { data: sessions30d },
      { data: recentProfiles30d },
    ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase
          .from("game_sessions")
          .select("player_id")
          .eq("completed", true)
          .gte("started_at", start24h),
        supabase
          .from("game_sessions")
          .select("player_id")
          .eq("completed", true)
          .gte("started_at", start7d),
        supabase
          .from("game_sessions")
          .select("player_id, score")
          .eq("completed", true)
          .gte("started_at", start30d),
        supabase
          .from("profiles")
          .select("id, created_at")
          .gte("created_at", start30d),
      ]);

    const active24hSet = new Set((sessions24h || []).map((s) => s.player_id).filter(Boolean));
    const active7dSet = new Set((sessions7d || []).map((s) => s.player_id).filter(Boolean));
    const rows30d = (sessions30d || []) as Array<{ player_id: string | null; score: number | null }>;
    const active30dSet = new Set(rows30d.map((s) => s.player_id).filter(Boolean));
    const active7dIn30d = new Set(
      (sessions7d || []).map((s) => s.player_id).filter((id): id is string => Boolean(id && active30dSet.has(id)))
    );

    const byPlayer = new Map<string, { sessions: number; scoreSum: number }>();
    rows30d.forEach((row) => {
      if (!row.player_id) return;
      const current = byPlayer.get(row.player_id) || { sessions: 0, scoreSum: 0 };
      current.sessions += 1;
      current.scoreSum += row.score || 0;
      byPlayer.set(row.player_id, current);
    });

    const activePlayersCount = Math.max(active30dSet.size, 1);
    const totalSessions30d = rows30d.length;
    const totalScore30d = rows30d.reduce((sum, row) => sum + (row.score || 0), 0);

    const newProfilesSet = new Set((recentProfiles30d || []).map((p) => p.id));
    let newPlayers30d = 0;
    let existingPlayers30d = 0;
    active30dSet.forEach((playerId) => {
      if (newProfilesSet.has(playerId as string)) newPlayers30d += 1;
      else existingPlayers30d += 1;
    });

    const retentionApproxPercent =
      active7dSet.size > 0 ? (active7dIn30d.size / active7dSet.size) * 100 : 0;
    const activeRatio30d =
      (totalUsersCount || 0) > 0 ? (active30dSet.size / (totalUsersCount || 1)) * 100 : 0;

    const topPlayerRows = [...byPlayer.entries()]
      .map(([playerId, stats]) => ({
        playerId,
        sessions: stats.sessions,
        avgScore: stats.sessions > 0 ? stats.scoreSum / stats.sessions : 0,
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 6);

    const topPlayerIds = topPlayerRows.map((p) => p.playerId);
    let pseudoById = new Map<string, string>();
    if (topPlayerIds.length > 0) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, pseudo")
        .in("id", topPlayerIds);
      pseudoById = new Map((profileRows || []).map((p) => [p.id, p.pseudo]));
    }

    setPlayerStats({
      totalUsers: totalUsersCount || 0,
      active24h: active24hSet.size,
      active7d: active7dSet.size,
      active30d: active30dSet.size,
      avgSessionsPerActivePlayer30d: totalSessions30d / activePlayersCount,
      avgScorePerActivePlayer30d: totalScore30d / activePlayersCount,
      returningUsers30dFrom7d: active7dIn30d.size,
      retentionApproxPercent,
      newPlayers30d,
      existingPlayers30d,
      activeRatio30d,
      topPlayers30d: topPlayerRows.map((row) => ({
        playerId: row.playerId,
        pseudo: pseudoById.get(row.playerId) || row.playerId.slice(0, 8),
        sessions: row.sessions,
        avgScore: row.avgScore,
      })),
    });
  };

  const loadAnalytics = async () => {
    setLoading(true);
    const rows = await Promise.all([
      buildWindow("J-1", 1),
      buildWindow("J-7", 7),
      buildWindow("J-30", 30),
    ]);
    setWindows(rows);
    await Promise.all([loadTopTagsAndCategories(), loadPlayerStats()]);
    setLoading(false);
  };

  const exportCsv = () => {
    if (windows.length === 0) return;
    const lines = [
      "window,days,current_sessions,previous_sessions,delta_sessions,current_unique_players,previous_unique_players,delta_players,current_average_score,previous_average_score,current_average_accuracy,previous_average_accuracy,current_new_users,previous_new_users,current_new_quizzes,previous_new_quizzes",
      ...windows.map((w) =>
        [
          w.label,
          w.days,
          w.current.sessions,
          w.previous.sessions,
          percentDelta(w.current.sessions, w.previous.sessions),
          w.current.uniquePlayers,
          w.previous.uniquePlayers,
          percentDelta(w.current.uniquePlayers, w.previous.uniquePlayers),
          w.current.averageScore.toFixed(2),
          w.previous.averageScore.toFixed(2),
          w.current.averageAccuracy.toFixed(2),
          w.previous.averageAccuracy.toFixed(2),
          w.current.newUsers,
          w.previous.newUsers,
          w.current.newQuizzes,
          w.previous.newQuizzes,
        ].join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `admin-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (profile?.role !== "admin") {
    return (
      <div className="w-full px-1 py-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acces refuse</h2>
          <p className="text-gray-600">Vous devez etre administrateur.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-1 py-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-emerald-600" />
            Analytics
          </h1>
          <p className="text-gray-600">Vue comparee J-1 / J-7 / J-30 de la plateforme.</p>
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-md p-10 text-center text-gray-500">
          Chargement des analytics...
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Comparatif des periodes</h2>
            <div className="w-full h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={windows.map((w) => ({
                    label: w.label,
                    sessions: w.current.sessions,
                    players: w.current.uniquePlayers,
                    newUsers: w.current.newUsers,
                    newQuizzes: w.current.newQuizzes,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sessions" stroke="#059669" strokeWidth={2} />
                  <Line type="monotone" dataKey="players" stroke="#2563eb" strokeWidth={2} />
                  <Line type="monotone" dataKey="newUsers" stroke="#7c3aed" strokeWidth={2} />
                  <Line type="monotone" dataKey="newQuizzes" stroke="#ea580c" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {windows.map((w) => (
              <div key={w.label} className="bg-white rounded-xl shadow-md border border-gray-100 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
                  {w.label}
                </p>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center justify-between">
                    <span className="text-gray-600 inline-flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" /> Sessions
                    </span>
                    <span className="font-semibold text-gray-900">
                      {w.current.sessions} ({percentDelta(w.current.sessions, w.previous.sessions)})
                    </span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-gray-600 inline-flex items-center gap-1">
                      <Users className="w-4 h-4" /> Joueurs uniques
                    </span>
                    <span className="font-semibold text-gray-900">
                      {w.current.uniquePlayers} (
                      {percentDelta(w.current.uniquePlayers, w.previous.uniquePlayers)})
                    </span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-gray-600">Score moyen</span>
                    <span className="font-semibold text-gray-900">
                      {w.current.averageScore.toFixed(1)} / {w.previous.averageScore.toFixed(1)}
                    </span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-gray-600">Precision moyenne</span>
                    <span className="font-semibold text-gray-900">
                      {w.current.averageAccuracy.toFixed(1)}% / {w.previous.averageAccuracy.toFixed(1)}%
                    </span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-gray-600">Nouveaux comptes</span>
                    <span className="font-semibold text-gray-900">
                      {w.current.newUsers} ({percentDelta(w.current.newUsers, w.previous.newUsers)})
                    </span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-gray-600 inline-flex items-center gap-1">
                      <BookOpen className="w-4 h-4" /> Nouveaux quiz
                    </span>
                    <span className="font-semibold text-gray-900">
                      {w.current.newQuizzes} (
                      {percentDelta(w.current.newQuizzes, w.previous.newQuizzes)})
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Top categories (par parties)</h3>
              <div className="space-y-2">
                {topCategories.map((row) => (
                  <p key={row.key} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{row.key}</span>
                    <span className="font-semibold text-gray-900">{row.value}</span>
                  </p>
                ))}
                {topCategories.length === 0 && (
                  <p className="text-sm text-gray-500">Aucune donnee.</p>
                )}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Top tags (par parties)</h3>
              <div className="space-y-2">
                {topTags.map((row) => (
                  <p key={row.key} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{row.key}</span>
                    <span className="font-semibold text-gray-900">{row.value}</span>
                  </p>
                ))}
                {topTags.length === 0 && <p className="text-sm text-gray-500">Aucune donnee.</p>}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Stats joueurs</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Utilisateurs total</p>
                <p className="text-2xl font-bold text-gray-900">{playerStats.totalUsers}</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs text-emerald-700">Actifs 24h / 7j / 30j</p>
                <p className="text-xl font-bold text-emerald-800">
                  {playerStats.active24h} / {playerStats.active7d} / {playerStats.active30d}
                </p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs text-blue-700">Engagement 30j</p>
                <p className="text-sm font-semibold text-blue-900">
                  {playerStats.avgSessionsPerActivePlayer30d.toFixed(1)} sessions / joueur actif
                </p>
                <p className="text-sm text-blue-900">
                  score cumule moyen: {playerStats.avgScorePerActivePlayer30d.toFixed(1)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
                <p className="text-xs text-purple-700">Retention approx.</p>
                <p className="text-sm font-semibold text-purple-900">
                  {playerStats.returningUsers30dFrom7d} reviennent / {playerStats.active7d} actifs 7j
                </p>
                <p className="text-sm text-purple-900">
                  {playerStats.retentionApproxPercent.toFixed(1)}%
                </p>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs text-amber-700">Nouveaux vs anciens (30j)</p>
                <p className="text-sm font-semibold text-amber-900">
                  Nouveaux: {playerStats.newPlayers30d}
                </p>
                <p className="text-sm text-amber-900">
                  Anciens: {playerStats.existingPlayers30d}
                </p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs text-emerald-700">Actifs / total (30j)</p>
                <div className="mt-2 h-2 bg-emerald-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600"
                    style={{ width: `${Math.max(0, Math.min(100, playerStats.activeRatio30d))}%` }}
                  />
                </div>
                <p className="text-sm font-semibold text-emerald-900 mt-2">
                  {playerStats.active30d}/{playerStats.totalUsers} ({playerStats.activeRatio30d.toFixed(1)}%)
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Top joueurs actifs (30j)</p>
              <div className="space-y-2">
                {playerStats.topPlayers30d.map((player) => (
                  <div
                    key={player.playerId}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                  >
                    <span className="text-sm text-gray-800">{player.pseudo}</span>
                    <span className="text-xs text-gray-600">
                      {player.sessions} sessions - score moyen {player.avgScore.toFixed(1)}
                    </span>
                  </div>
                ))}
                {playerStats.topPlayers30d.length === 0 && (
                  <p className="text-sm text-gray-500">Aucune activite joueur recente.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
