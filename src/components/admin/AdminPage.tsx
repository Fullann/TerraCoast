import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  Shield,
  Users,
  BookOpen,
  AlertTriangle,
  Activity,
  Clock,
  Map,
  CheckCircle2,
  UserCheck,
  BarChart3,
  Flame,
} from "lucide-react";
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
import {
  normalizeTopQuizzes,
  scoreHealthTone,
  toOneDecimal,
  toPercent,
  type QuizTopRow,
} from "./utils/adminDashboardStats";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
type Report = Database["public"]["Tables"]["reports"]["Row"];
type AdminActivityLog = Database["public"]["Tables"]["admin_activity_logs"]["Row"];
type AdminActor = Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "pseudo">;
type SessionTrendRow = Pick<
  Database["public"]["Tables"]["game_sessions"]["Row"],
  "started_at" | "player_id"
>;
type ProfileTrendRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "created_at"
>;
type TopQuizSummaryRow = Pick<
  Database["public"]["Tables"]["quizzes"]["Row"],
  "id" | "title" | "total_plays" | "average_score"
>;

interface TrendPoint {
  label: string;
  gamesPlayed: number;
  newAccounts: number;
  activePlayers: number;
}

interface AdminPageProps {
  onNavigate?: (view: string, data?: Record<string, unknown>) => void;
}

export function AdminPage({ onNavigate }: AdminPageProps) {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuizzes: 0,
    pendingReports: 0,
    totalBadges: 0,
    pendingValidations: 0,
    missingLocations: 0,
    publicQuizzes: 0,
    globalQuizzes: 0,
    privateQuizzes: 0,
    bannedUsers: 0,
  });
  const [recentUsers, setRecentUsers] = useState<Profile[]>([]);
  const [recentQuizzes, setRecentQuizzes] = useState<Quiz[]>([]);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [topQuizzes, setTopQuizzes] = useState<QuizTopRow[]>([]);
  const [trendPeriod, setTrendPeriod] = useState<"day" | "week" | "month">(
    "day"
  );
  const [trendStats, setTrendStats] = useState({
    gamesPlayed: 0,
    newAccounts: 0,
    activePlayers: 0,
    connectedNow: 0,
  });
  const [adminLogs, setAdminLogs] = useState<AdminActivityLog[]>([]);
  const [trendSeries, setTrendSeries] = useState<TrendPoint[]>([]);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [adminActors, setAdminActors] = useState<AdminActor[]>([]);
  const [logFilters, setLogFilters] = useState({
    action: "",
    actorId: "",
    dateFrom: "",
    dateTo: "",
  });
  const [logsPage, setLogsPage] = useState(1);
  const [logsPageSize] = useState(20);
  const [logsTotalCount, setLogsTotalCount] = useState(0);

  useEffect(() => {
    if (profile?.role === "admin") {
      loadAdminData();
      logAdminEvent("open_admin_dashboard", null, null, {});
    }
  }, [profile]);

  useEffect(() => {
    if (profile?.role === "admin") {
      loadTrendStats(trendPeriod);
    }
  }, [trendPeriod, profile]);

  useEffect(() => {
    if (profile?.role === "admin") {
      loadAdminLogs();
    }
  }, [profile, logsPage, logFilters]);

  const logAdminEvent = async (
    action: string,
    entityType: string | null,
    entityId: string | null,
    details: Record<string, unknown>
  ) => {
    await supabase.rpc("log_admin_event", {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_details: details,
    });
  };

  const loadAdminData = async () => {
    const { count: usersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: quizzesCount } = await supabase
      .from("quizzes")
      .select("*", { count: "exact", head: true });

    const { count: warningsCount } = await supabase
      .from("warnings")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    const { count: badgesCount } = await supabase
      .from("badges")
      .select("*", { count: "exact", head: true });
    const { count: pendingValidationCount } = await supabase
      .from("quizzes")
      .select("*", { count: "exact", head: true })
      .eq("pending_validation", true)
      .eq("validation_status", "pending");
    const { count: missingLocationCount } = await supabase
      .from("quizzes")
      .select("*", { count: "exact", head: true })
      .or("location_lat.is.null,location_lng.is.null");
    const { count: publicQuizzesCount } = await supabase
      .from("quizzes")
      .select("*", { count: "exact", head: true })
      .eq("is_public", true)
      .eq("is_global", false);
    const { count: globalQuizzesCount } = await supabase
      .from("quizzes")
      .select("*", { count: "exact", head: true })
      .eq("is_global", true);
    const { count: privateQuizzesCount } = await supabase
      .from("quizzes")
      .select("*", { count: "exact", head: true })
      .eq("is_public", false)
      .eq("is_global", false);
    const { count: bannedUsersCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_banned", true);

    setStats({
      totalUsers: usersCount || 0,
      totalQuizzes: quizzesCount || 0,
      pendingReports: warningsCount || 0,
      totalBadges: badgesCount || 0,
      pendingValidations: pendingValidationCount || 0,
      missingLocations: missingLocationCount || 0,
      publicQuizzes: publicQuizzesCount || 0,
      globalQuizzes: globalQuizzesCount || 0,
      privateQuizzes: privateQuizzesCount || 0,
      bannedUsers: bannedUsersCount || 0,
    });

    const { data: usersData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (usersData) setRecentUsers(usersData);

    const { data: quizzesData } = await supabase
      .from("quizzes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (quizzesData) setRecentQuizzes(quizzesData);

    const { data: reportsData } = await supabase
      .from("reports")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (reportsData) setRecentReports(reportsData);

    const { data: topQuizzesData } = await supabase
      .from("quizzes")
      .select("id, title, total_plays, average_score")
      .order("total_plays", { ascending: false })
      .limit(6);
    setTopQuizzes(normalizeTopQuizzes((topQuizzesData || []) as TopQuizSummaryRow[]));

    await loadTrendStats(trendPeriod);
    await loadAdminActors();
  };

  const getPeriodStartIso = (period: "day" | "week" | "month") => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (period === "day") return now.toISOString();
    if (period === "week") {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      return start.toISOString();
    }
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    return start.toISOString();
  };

  const buildTrendBuckets = (period: "day" | "week" | "month") => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    if (period === "day") {
      const start = new Date(todayStart);
      const buckets = Array.from({ length: 24 }, (_, i) => {
        const bucketStart = new Date(start.getTime() + i * 60 * 60 * 1000);
        return {
          startMs: bucketStart.getTime(),
          endMs: bucketStart.getTime() + 60 * 60 * 1000,
          label: `${bucketStart.getHours().toString().padStart(2, "0")}h`,
        };
      });
      return {
        startMs: start.getTime(),
        stepMs: 60 * 60 * 1000,
        count: 24,
        buckets,
      };
    }

    if (period === "week") {
      const start = new Date(todayStart);
      start.setDate(start.getDate() - 6);
      const buckets = Array.from({ length: 7 }, (_, i) => {
        const bucketStart = new Date(start);
        bucketStart.setDate(start.getDate() + i);
        const day = bucketStart.toLocaleDateString("fr-FR", { weekday: "short" });
        return {
          startMs: bucketStart.getTime(),
          endMs: bucketStart.getTime() + 24 * 60 * 60 * 1000,
          label: day,
        };
      });
      return {
        startMs: start.getTime(),
        stepMs: 24 * 60 * 60 * 1000,
        count: 7,
        buckets,
      };
    }

    const start = new Date(todayStart);
    start.setDate(start.getDate() - 29);
    const buckets = Array.from({ length: 30 }, (_, i) => {
      const bucketStart = new Date(start);
      bucketStart.setDate(start.getDate() + i);
      return {
        startMs: bucketStart.getTime(),
        endMs: bucketStart.getTime() + 24 * 60 * 60 * 1000,
        label: bucketStart.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
        }),
      };
    });
    return {
      startMs: start.getTime(),
      stepMs: 24 * 60 * 60 * 1000,
      count: 30,
      buckets,
    };
  };

  const loadTrendStats = async (period: "day" | "week" | "month") => {
    const from = getPeriodStartIso(period);
    const bucketConfig = buildTrendBuckets(period);

    const { data: sessionRows } = await supabase
      .from("game_sessions")
      .select("started_at, player_id")
      .eq("completed", true)
      .gte("started_at", from);

    const { data: accountRows } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", from);
    const sessions = (sessionRows || []) as SessionTrendRow[];
    const accounts = (accountRows || []) as ProfileTrendRow[];

    const points: TrendPoint[] = bucketConfig.buckets.map((b) => ({
      label: b.label,
      gamesPlayed: 0,
      newAccounts: 0,
      activePlayers: 0,
    }));
    const perBucketPlayers = bucketConfig.buckets.map(() => new Set<string>());
    const uniquePlayers = new Set<string>();

    sessions.forEach((s) => {
      const ts = new Date(s.started_at).getTime();
      const idx = Math.floor((ts - bucketConfig.startMs) / bucketConfig.stepMs);
      if (idx >= 0 && idx < bucketConfig.count) {
        points[idx].gamesPlayed += 1;
        if (s.player_id) {
          perBucketPlayers[idx].add(s.player_id);
          uniquePlayers.add(s.player_id);
        }
      }
    });

    accounts.forEach((a) => {
      const ts = new Date(a.created_at).getTime();
      const idx = Math.floor((ts - bucketConfig.startMs) / bucketConfig.stepMs);
      if (idx >= 0 && idx < bucketConfig.count) {
        points[idx].newAccounts += 1;
      }
    });

    points.forEach((p, i) => {
      p.activePlayers = perBucketPlayers[i].size;
    });

    const connectedSince = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: connectedRows } = await supabase
      .from("game_sessions")
      .select("player_id")
      .gte("started_at", connectedSince);

    setTrendStats({
      gamesPlayed: points.reduce((sum, p) => sum + p.gamesPlayed, 0),
      newAccounts: points.reduce((sum, p) => sum + p.newAccounts, 0),
      activePlayers: uniquePlayers.size,
      connectedNow: new Set((connectedRows || []).map((r) => r.player_id)).size,
    });
    setTrendSeries(points);
  };

  const loadAdminLogs = async () => {
    const from = (logsPage - 1) * logsPageSize;
    const to = from + logsPageSize - 1;

    let query = supabase
      .from("admin_activity_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (logFilters.action.trim()) {
      query = query.ilike("action", `%${logFilters.action.trim()}%`);
    }
    if (logFilters.actorId) {
      query = query.eq("actor_id", logFilters.actorId);
    }
    if (logFilters.dateFrom) {
      query = query.gte("created_at", new Date(logFilters.dateFrom).toISOString());
    }
    if (logFilters.dateTo) {
      const dateTo = new Date(logFilters.dateTo);
      dateTo.setHours(23, 59, 59, 999);
      query = query.lte("created_at", dateTo.toISOString());
    }

    const { data, count } = await query.range(from, to);
    if (data) setAdminLogs(data);
    setLogsTotalCount(count || 0);
  };

  const loadAdminActors = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, pseudo")
      .eq("role", "admin")
      .order("pseudo", { ascending: true });
    if (data) setAdminActors(data as AdminActor[]);
  };

  const goToSection = async (view: string, label: string) => {
    await logAdminEvent("open_admin_section", "navigation", view, { label });
    onNavigate?.(view);
  };

  const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

  const exportAdminLogsCsv = async () => {
    setExportingCsv(true);
    const chunkSize = 1000;
    let offset = 0;
    let hasMore = true;
    const allRows: AdminActivityLog[] = [];

    while (hasMore) {
      let query = supabase
        .from("admin_activity_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (logFilters.action.trim()) {
        query = query.ilike("action", `%${logFilters.action.trim()}%`);
      }
      if (logFilters.actorId) {
        query = query.eq("actor_id", logFilters.actorId);
      }
      if (logFilters.dateFrom) {
        query = query.gte("created_at", new Date(logFilters.dateFrom).toISOString());
      }
      if (logFilters.dateTo) {
        const dateTo = new Date(logFilters.dateTo);
        dateTo.setHours(23, 59, 59, 999);
        query = query.lte("created_at", dateTo.toISOString());
      }

      const { data } = await query.range(offset, offset + chunkSize - 1);
      const rows = (data || []) as AdminActivityLog[];
      allRows.push(...rows);
      hasMore = rows.length === chunkSize;
      offset += chunkSize;
      if (offset >= 10000) break;
    }

    if (allRows.length === 0) {
      setExportingCsv(false);
      return;
    }

    const lines = [
      "created_at,actor_id,action,entity_type,entity_id,details_json",
      ...allRows.map((log) =>
        [
          escapeCsv(log.created_at),
          escapeCsv(log.actor_id),
          escapeCsv(log.action),
          escapeCsv(log.entity_type || ""),
          escapeCsv(log.entity_id || ""),
          escapeCsv(JSON.stringify(log.details || {})),
        ].join(",")
      ),
    ];

    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `admin-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    await logAdminEvent("export_admin_logs_csv", "admin_activity_logs", null, {
      exported_rows: allRows.length,
      filters: logFilters,
    });
    setExportingCsv(false);
  };

  if (profile?.role !== "admin") {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Accès refusé
          </h2>
          <p className="text-gray-600">
            Vous devez être administrateur pour accéder à cette page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center">
          <Shield className="w-10 h-10 mr-3 text-emerald-600" />
          {t("admin.nav.overview")}
        </h1>
        <p className="text-gray-600">{t("admin.dashboard.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 mb-8">
        <button
          onClick={() => goToSection("user-management", "utilisateurs")}
          className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md transition-shadow"
        >
          <Users className="w-5 h-5 text-blue-600 mb-2" />
          <p className="text-xs text-gray-500">{t("admin.dashboard.totalUsers")}</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
        </button>
        <button
          onClick={() => goToSection("quiz-management", "quiz")}
          className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md transition-shadow"
        >
          <BookOpen className="w-5 h-5 text-emerald-600 mb-2" />
          <p className="text-xs text-gray-500">{t("admin.dashboard.totalQuizzes")}</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalQuizzes}</p>
        </button>
        <button
          onClick={() => goToSection("quiz-validation", "validation quiz")}
          className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md transition-shadow"
        >
          <CheckCircle2 className="w-5 h-5 text-teal-600 mb-2" />
          <p className="text-xs text-gray-500">{t("admin.dashboard.pendingValidation")}</p>
          <p className="text-2xl font-bold text-gray-900">{stats.pendingValidations}</p>
        </button>
        <button
          onClick={() => goToSection("warnings-management", "warnings")}
          className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md transition-shadow"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 mb-2" />
          <p className="text-xs text-gray-500">{t("admin.dashboard.pendingReports")}</p>
          <p className="text-2xl font-bold text-gray-900">{stats.pendingReports}</p>
        </button>
        <button
          onClick={() => goToSection("quiz-management", "quiz sans localisation")}
          className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md transition-shadow"
        >
          <Map className="w-5 h-5 text-cyan-600 mb-2" />
          <p className="text-xs text-gray-500">{t("admin.dashboard.missingLocation")}</p>
          <p className="text-2xl font-bold text-gray-900">{stats.missingLocations}</p>
        </button>
        <button
          onClick={() => goToSection("badge-management", "badges")}
          className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md transition-shadow"
        >
          <UserCheck className="w-5 h-5 text-purple-600 mb-2" />
          <p className="text-xs text-gray-500">{t("admin.dashboard.badges")}</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalBadges}</p>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-5 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-600" />
            Statistiques admin
          </h2>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                setTrendPeriod("day");
                await logAdminEvent("change_admin_stats_period", "admin_stats", "day", {});
              }}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                trendPeriod === "day"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Jour
            </button>
            <button
              onClick={async () => {
                setTrendPeriod("week");
                await logAdminEvent("change_admin_stats_period", "admin_stats", "week", {});
              }}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                trendPeriod === "week"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Semaine
            </button>
            <button
              onClick={async () => {
                setTrendPeriod("month");
                await logAdminEvent("change_admin_stats_period", "admin_stats", "month", {});
              }}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                trendPeriod === "month"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Mois
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-200">
            <p className="text-sm text-emerald-700">Parties jouées</p>
            <p className="text-3xl font-bold text-emerald-800">
              {trendStats.gamesPlayed}
            </p>
          </div>
          <div className="rounded-xl bg-blue-50 p-4 border border-blue-200">
            <p className="text-sm text-blue-700">Nouveaux comptes</p>
            <p className="text-3xl font-bold text-blue-800">
              {trendStats.newAccounts}
            </p>
          </div>
          <div className="rounded-xl bg-purple-50 p-4 border border-purple-200">
            <p className="text-sm text-purple-700">Joueurs actifs</p>
            <p className="text-3xl font-bold text-purple-800">
              {trendStats.activePlayers}
            </p>
          </div>
          <div className="rounded-xl bg-amber-50 p-4 border border-amber-200">
            <p className="text-sm text-amber-700">Joueurs connectés (estim.)</p>
            <p className="text-3xl font-bold text-amber-800">
              {trendStats.connectedNow}
            </p>
            <p className="text-xs text-amber-700 mt-1">
              activité sur les 15 dernières minutes
            </p>
          </div>
        </div>
        <div className="mt-5 rounded-xl border border-gray-200 p-3 bg-gray-50">
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="gamesPlayed"
                  name="Parties"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="newAccounts"
                  name="Comptes"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="activePlayers"
                  name="Joueurs actifs"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-600" />
            Santé plateforme
          </h3>
          <div className="space-y-2 text-sm">
            <p className="flex items-center justify-between">
              <span className="text-gray-600">Quiz privés</span>
              <span className="font-semibold text-gray-900">{stats.privateQuizzes}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-gray-600">Quiz publics</span>
              <span className="font-semibold text-gray-900">{stats.publicQuizzes}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-gray-600">Quiz globaux</span>
              <span className="font-semibold text-gray-900">{stats.globalQuizzes}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-gray-600">Utilisateurs bannis</span>
              <span className="font-semibold text-gray-900">{stats.bannedUsers}</span>
            </p>
            <p className="flex items-center justify-between">
              <span className="text-gray-600">Taux signalements / validations</span>
              <span className="font-semibold text-gray-900">
                {toPercent(
                  stats.pendingValidations > 0
                    ? (stats.pendingReports / stats.pendingValidations) * 100
                    : 0
                )}
              </span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-600" />
            Top quiz (parties)
          </h3>
          <div className="space-y-2">
            {topQuizzes.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune donnée.</p>
            ) : (
              topQuizzes.map((quiz) => {
                const avg = quiz.average_score || 0;
                const tone = scoreHealthTone(avg);
                const toneClass =
                  tone === "good"
                    ? "text-emerald-700 bg-emerald-100"
                    : tone === "warn"
                    ? "text-amber-700 bg-amber-100"
                    : "text-red-700 bg-red-100";
                return (
                  <button
                    key={quiz.id}
                    onClick={() => goToSection("quiz-management", "top quiz")}
                    className="w-full text-left p-2 rounded-lg hover:bg-gray-50"
                  >
                    <p className="text-sm font-medium text-gray-800 truncate">{quiz.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">{quiz.total_plays} parties</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${toneClass}`}>
                        score {toOneDecimal(avg)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">A traiter rapidement</h3>
          <div className="space-y-3">
            <button
              onClick={() => goToSection("quiz-validation", "pending validation")}
              className="w-full p-3 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-left"
            >
              <p className="text-sm text-teal-800 font-semibold">
                {stats.pendingValidations} quiz a valider
              </p>
            </button>
            <button
              onClick={() => goToSection("warnings-management", "pending reports")}
              className="w-full p-3 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-left"
            >
              <p className="text-sm text-amber-800 font-semibold">
                {stats.pendingReports} signalements en attente
              </p>
            </button>
            <button
              onClick={() => goToSection("quiz-management", "missing location")}
              className="w-full p-3 rounded-lg border border-cyan-200 bg-cyan-50 hover:bg-cyan-100 text-left"
            >
              <p className="text-sm text-cyan-800 font-semibold">
                {stats.missingLocations} quiz sans localisation
              </p>
            </button>
            <p className="text-xs text-gray-500">
              Nouveaux utilisateurs: {recentUsers.length} - Nouveaux quiz: {recentQuizzes.length} -
              Rapports recents: {recentReports.length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-5 mb-8">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-600" />
            Logs admin (récent)
          </h2>
          <button
            onClick={exportAdminLogsCsv}
            disabled={exportingCsv}
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {exportingCsv ? "Export..." : "Exporter CSV"}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <input
            value={logFilters.action}
            onChange={(e) => {
              setLogsPage(1);
              setLogFilters((prev) => ({ ...prev, action: e.target.value }));
            }}
            placeholder="Filtrer par action"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <select
            value={logFilters.actorId}
            onChange={(e) => {
              setLogsPage(1);
              setLogFilters((prev) => ({ ...prev, actorId: e.target.value }));
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Tous les admins</option>
            {adminActors.map((actor) => (
              <option key={actor.id} value={actor.id}>
                {actor.pseudo}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={logFilters.dateFrom}
            onChange={(e) => {
              setLogsPage(1);
              setLogFilters((prev) => ({ ...prev, dateFrom: e.target.value }));
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <input
            type="date"
            value={logFilters.dateTo}
            onChange={(e) => {
              setLogsPage(1);
              setLogFilters((prev) => ({ ...prev, dateTo: e.target.value }));
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div className="space-y-2 max-h-80 overflow-auto">
          {adminLogs.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun log pour le moment.</p>
          ) : (
            adminLogs.map((log) => (
              <div
                key={log.id}
                className="border border-gray-200 rounded-lg px-3 py-2"
              >
                <p className="text-sm font-semibold text-gray-800">{log.action}</p>
                <p className="text-xs text-gray-600">
                  {new Date(log.created_at).toLocaleString()} - acteur:{" "}
                  {adminActors.find((a) => a.id === log.actor_id)?.pseudo ||
                    log.actor_id.slice(0, 8)}
                </p>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {logsTotalCount} logs - page {logsPage}/{Math.max(1, Math.ceil(logsTotalCount / logsPageSize))}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
              disabled={logsPage <= 1}
              className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              onClick={() =>
                setLogsPage((p) =>
                  Math.min(Math.max(1, Math.ceil(logsTotalCount / logsPageSize)), p + 1)
                )
              }
              disabled={logsPage >= Math.max(1, Math.ceil(logsTotalCount / logsPageSize))}
              className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
