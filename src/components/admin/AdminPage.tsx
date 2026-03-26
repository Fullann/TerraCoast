import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import {
  Shield,
  Users,
  BookOpen,
  AlertTriangle,
  Award,
  Star,
  Tag,
  Target,
  Activity,
  Clock,
  Map,
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

interface TrendPoint {
  label: string;
  gamesPlayed: number;
  newAccounts: number;
  activePlayers: number;
}

interface AdminPageProps {
  onNavigate?: (view: string, data?: any) => void;
}

export function AdminPage({ onNavigate }: AdminPageProps) {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuizzes: 0,
    pendingReports: 0,
    totalBadges: 0,
  });
  const [users, setUsers] = useState<Profile[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [quizSearch, setQuizSearch] = useState("");
  const [quizSearchResults, setQuizSearchResults] = useState<Quiz[]>([]);
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

    setStats({
      totalUsers: usersCount || 0,
      totalQuizzes: quizzesCount || 0,
      pendingReports: warningsCount || 0,
      totalBadges: badgesCount || 0,
    });

    const { data: usersData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (usersData) setUsers(usersData);

    const { data: quizzesData } = await supabase
      .from("quizzes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (quizzesData) setQuizzes(quizzesData);

    const { data: reportsData } = await supabase
      .from("reports")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (reportsData) setReports(reportsData);

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

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";

    const { error, data } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId)
      .select();

    if (error) {
      console.error("Error updating role:", error);
      alert(`Erreur lors de la modification du rôle: ${error.message}`);
      return;
    }

    if (!data || data.length === 0) {
      alert("Aucune ligne mise à jour. Vérifiez les permissions.");
      return;
    }

    alert(`Rôle mis à jour avec succès pour ${userId}`);
    loadAdminData();
  };

  const toggleUserBan = async (userId: string, isBanned: boolean) => {
    const confirmMessage = isBanned
      ? "Voulez-vous vraiment débannir cet utilisateur ?"
      : "Voulez-vous vraiment bannir cet utilisateur ?";

    if (!confirm(confirmMessage)) return;

    const reason = !isBanned ? prompt("Raison du ban (optionnel):") : null;

    const updateData = isBanned
      ? { is_banned: false, banned_at: null, ban_reason: null }
      : {
          is_banned: true,
          banned_at: new Date().toISOString(),
          ban_reason: reason || "Non spécifié",
        };

    const { error, data } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId)
      .select();

    if (error) {
      console.error("Error updating ban status:", error);
      alert(
        `Erreur lors de la modification du statut de ban: ${error.message}`
      );
      return;
    }

    if (!data || data.length === 0) {
      alert("Aucune ligne mise à jour. Vérifiez les permissions.");
      return;
    }

    alert(`Statut de ban mis à jour avec succès`);
    loadAdminData();
  };

  const searchQuizzes = async (query: string) => {
    if (query.trim().length < 2) {
      setQuizSearchResults([]);
      return;
    }

    const { data } = await supabase
      .from("quizzes")
      .select("*")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (data) setQuizSearchResults(data);
  };

  const deleteQuiz = async (quizId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce quiz?")) return;

    await supabase.from("quizzes").delete().eq("id", quizId);
    loadAdminData();
    if (quizSearch) searchQuizzes(quizSearch);
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
          Administration
        </h1>
        <p className="text-gray-600">Gestion de la plateforme TerraCoast</p>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <button
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-left"
          onClick={() => goToSection("user-management", "utilisateurs")}
        >
          <Users className="w-10 h-10 mb-3" />
          <p className="text-blue-100 text-sm">Utilisateurs</p>
          <p className="text-4xl font-bold">{stats.totalUsers}</p>
          <p className="text-amber-100 text-xs">Cliquez pour traiter</p>
        </button>

        <button
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-left"
          onClick={() => goToSection("quiz-management", "quiz")}
        >
          <BookOpen className="w-10 h-10 mb-3" />
          <p className="text-blue-100 text-sm">Quiz</p>
          <p className="text-4xl font-bold">{stats.totalQuizzes}</p>
          <p className="text-amber-100 text-xs">Cliquez pour traiter</p>
        </button>

        <button
          onClick={() => goToSection("warnings-management", "warnings")}
          className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-left"
        >
          <AlertTriangle className="w-10 h-10 mb-3" />
          <p className="text-amber-100 text-sm">Signalements en attente</p>
          <p className="text-4xl font-bold mb-2">{stats.pendingReports}</p>
          <p className="text-amber-100 text-xs">Cliquez pour traiter</p>
        </button>

        <button
          onClick={() => goToSection("badge-management", "badges")}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-left"
        >
          <Award className="w-10 h-10 mb-3" />
          <p className="text-purple-100 text-sm">Badges</p>
          <p className="text-4xl font-bold mb-2">{stats.totalBadges}</p>
          <p className="text-xs text-purple-100">Cliquer pour gérer →</p>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <button
          onClick={() => goToSection("quiz-validation", "validation quiz")}
          className="bg-gradient-to-br from-teal-400 to-teal-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-left"
        >
          <BookOpen className="w-10 h-10 mb-3" />
          <p className="text-teal-100 text-sm">Validation des quiz</p>
          <p className="text-xs text-teal-100 mt-2">
            Approuver les quiz publics →
          </p>
        </button>

        <button
          onClick={() => goToSection("title-management", "titres")}
          className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-left"
        >
          <Star className="w-10 h-10 mb-3" />
          <p className="text-amber-100 text-sm">Gestion des titres</p>
          <p className="text-xs text-amber-100 mt-2">
            Créer et gérer les titres →
          </p>
        </button>

        <button
          onClick={() => goToSection("category-management", "categories")}
          className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-left"
        >
          <Tag className="w-10 h-10 mb-3" />
          <p className="text-blue-100 text-sm">Gestion des catégories</p>
          <p className="text-xs text-blue-100 mt-2">
            Gérer les catégories de quiz →
          </p>
        </button>

        <button
          onClick={() => goToSection("difficulty-management", "difficultes")}
          className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-left"
        >
          <Target className="w-10 h-10 mb-3" />
          <p className="text-orange-100 text-sm">Gestion des difficultés</p>
          <p className="text-xs text-orange-100 mt-2">
            Gérer les niveaux de difficulté →
          </p>
        </button>

        <button
          onClick={() => goToSection("quiz-type-management", "types quiz")}
          className="bg-gradient-to-br from-indigo-400 to-indigo-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-left"
        >
          <Tag className="w-10 h-10 mb-3" />
          <p className="text-indigo-100 text-sm">Types de quiz</p>
          <p className="text-xs text-indigo-100 mt-2">
            QCM, Texte, Mixte... {"->"}
          </p>
        </button>

        <button
          onClick={() => goToSection("duel-features", "duel features")}
          className="bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-left"
        >
          <Shield className="w-10 h-10 mb-3" />
          <p className="text-purple-100 text-sm">Fonctions duels classes</p>
          <p className="text-xs text-purple-100 mt-2">
            Activer/desactiver anti-rematch, expansion et apercu MMR {"->"}
          </p>
        </button>

        <button
          onClick={() => goToSection("geojson-maps-management", "cartes geojson")}
          className="bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer text-left"
        >
          <Map className="w-10 h-10 mb-3" />
          <p className="text-cyan-100 text-sm">Cartes GeoJSON</p>
          <p className="text-xs text-cyan-100 mt-2">
            Importer, prévisualiser, preset, approuver — disponible pour les quiz
          </p>
        </button>
      </div>
    </div>
  );
}
