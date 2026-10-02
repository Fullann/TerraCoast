import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  BarChart3,
  Flame,
  Compass,
  Trophy,
  Camera,
  Globe,
  Palette,
  Zap,
  Star,
  ArrowRight,
  Sliders,
  Sparkles,
} from "lucide-react";
import {
  getPlayerGamificationState,
  adminGrantResources,
  PlayerGamificationState,
} from "../../lib/gamificationManager";
import { adminUpdateUserXp } from "../../lib/queries/profileQueries";
import { getSiteConfig, type SiteConfig } from "../../lib/siteConfigManager";
import { fetchCountryIntelligence, type GlobalCountryIntelligence } from "../../lib/countryTrackingManager";
import { toast } from "../common/ToastContainer";
import { playSound } from "../../lib/soundManager";
import { triggerConfetti } from "../common/Confetti";
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

export interface AdminPageProps {
  onNavigate?: (view: string, data?: Record<string, unknown>) => void;
}

export function AdminPage({ onNavigate }: AdminPageProps = {}) {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
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
  const [adminGamification, setAdminGamification] = useState<PlayerGamificationState>(() =>
    getPlayerGamificationState(profile?.id)
  );
  const [customGrantGems, setCustomGrantGems] = useState("");
  const [customGrantXp, setCustomGrantXp] = useState("");
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => getSiteConfig());
  const [countryIntel, setCountryIntel] = useState<GlobalCountryIntelligence | null>(null);

  const handleAdminGrantXp = async (options: { xpDelta?: number; setXp?: number }) => {
    if (!profile?.id) return;
    try {
      const res = await adminUpdateUserXp(profile.id, options, profile);
      if (res.success && res.profile) {
        playSound("success");
        if (refreshProfile) {
          await refreshProfile();
        }
        const s = getPlayerGamificationState(profile.id);
        setAdminGamification(s);

        const delta = res.xpDelta ?? 0;
        if (options.setXp !== undefined) {
          toast.success(`XP fixés à ${res.newXp} ⭐ (Niv. ${res.newLevel}) !`);
        } else {
          if (delta >= 5000) triggerConfetti();
          toast.success(
            `${delta >= 0 ? "+" : ""}${delta} XP ⭐ ajoutés (Total: ${res.newXp} XP, Niv. ${res.newLevel}) !`
          );
        }
      } else {
        toast.error(`Erreur: ${res.error || "Échec de l'ajustement de l'XP"}`);
      }
    } catch (err: any) {
      toast.error(`Erreur inattendue: ${err.message}`);
    }
  };

  useEffect(() => {
    setAdminGamification(getPlayerGamificationState(profile?.id));
    const handleGamificationUpdate = () => {
      setAdminGamification(getPlayerGamificationState(profile?.id));
    };
    const handleConfigUpdate = (e: Event) => {
      const ce = e as CustomEvent<SiteConfig>;
      if (ce.detail) setSiteConfig(ce.detail);
    };
    window.addEventListener("terracost_gamification_updated", handleGamificationUpdate);
    window.addEventListener("terracost_site_config_updated", handleConfigUpdate);
    return () => {
      window.removeEventListener("terracost_gamification_updated", handleGamificationUpdate);
      window.removeEventListener("terracost_site_config_updated", handleConfigUpdate);
    };
  }, [profile?.id]);

  useEffect(() => {
    if (profile?.role === "admin") {
      loadAdminData();
      logAdminEvent("open_admin_dashboard", null, null, {});
      void fetchCountryIntelligence("fr").then((data) => setCountryIntel(data));
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
      p_details: details as any,
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
    const viewToPath: Record<string, string> = {
      "admin": "/admin",
      "admin-analytics": "/admin/analytics",
      "path-management": "/admin/path",
      "geodetective-management": "/admin/geodetective",
      "quiz-management": "/admin/quizzes",
      "quiz-validation": "/admin/validation",
      "geojson-maps-management": "/admin/geojson",
      "warnings-management": "/admin/warnings",
      "user-management": "/admin/users",
      "duel-features": "/admin/duels",
      "badge-management": "/admin/badges",
      "title-management": "/admin/titles",
      "category-management": "/admin/categories",
      "difficulty-management": "/admin/difficulties",
      "quiz-type-management": "/admin/types",
      "cards-management": "/admin/cards",
    };
    navigate(viewToPath[view] ?? `/admin/${view}`);
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

      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3 mb-8">
        <button
          onClick={() => goToSection("user-management", "utilisateurs")}
          className="bg-white rounded-xl border border-gray-200 p-3.5 text-left hover:shadow-md transition-shadow"
        >
          <Users className="w-5 h-5 text-blue-600 mb-1.5" />
          <p className="text-xs text-gray-500">{t("admin.dashboard.totalUsers")}</p>
          <p className="text-xl font-bold text-gray-900">{stats.totalUsers}</p>
        </button>
        <button
          onClick={() => goToSection("quiz-management", "quiz")}
          className="bg-white rounded-xl border border-gray-200 p-3.5 text-left hover:shadow-md transition-shadow"
        >
          <BookOpen className="w-5 h-5 text-emerald-600 mb-1.5" />
          <p className="text-xs text-gray-500">{t("admin.dashboard.totalQuizzes")}</p>
          <p className="text-xl font-bold text-gray-900">{stats.totalQuizzes}</p>
        </button>
        <button
          onClick={() => goToSection("country-tracking", "statistiques pays")}
          className="bg-white rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white p-3.5 text-left hover:shadow-md transition-shadow"
        >
          <Globe className="w-5 h-5 text-emerald-600 mb-1.5" />
          <p className="text-xs text-emerald-800 font-semibold">Géo-Suivi</p>
          <p className="text-xl font-bold text-slate-900">195 pays</p>
        </button>
        <button
          onClick={() => goToSection("site-config", "personnalisation")}
          className="bg-white rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50/50 to-white p-3.5 text-left hover:shadow-md transition-shadow"
        >
          <Palette className="w-5 h-5 text-violet-600 mb-1.5" />
          <p className="text-xs text-violet-800 font-semibold">Réglages Site</p>
          <p className="text-xl font-bold text-slate-900">En direct</p>
        </button>
        <button
          onClick={() => goToSection("quiz-validation", "validation quiz")}
          className="bg-white rounded-xl border border-gray-200 p-3.5 text-left hover:shadow-md transition-shadow"
        >
          <CheckCircle2 className="w-5 h-5 text-teal-600 mb-1.5" />
          <p className="text-xs text-gray-500">{t("admin.dashboard.pendingValidation")}</p>
          <p className="text-xl font-bold text-gray-900">{stats.pendingValidations}</p>
        </button>
        <button
          onClick={() => goToSection("warnings-management", "warnings")}
          className="bg-white rounded-xl border border-gray-200 p-3.5 text-left hover:shadow-md transition-shadow"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 mb-1.5" />
          <p className="text-xs text-gray-500">{t("admin.dashboard.pendingReports")}</p>
          <p className="text-xl font-bold text-gray-900">{stats.pendingReports}</p>
        </button>
        <button
          onClick={() => goToSection("quiz-management", "quiz sans localisation")}
          className="bg-white rounded-xl border border-gray-200 p-3.5 text-left hover:shadow-md transition-shadow"
        >
          <Map className="w-5 h-5 text-cyan-600 mb-1.5" />
          <p className="text-xs text-gray-500">{t("admin.dashboard.missingLocation")}</p>
          <p className="text-xl font-bold text-gray-900">{stats.missingLocations}</p>
        </button>
        <button
          onClick={() => goToSection("path-management", "parcours")}
          className="bg-white rounded-xl border border-gray-200 p-3.5 text-left hover:shadow-md transition-shadow"
        >
          <Compass className="w-5 h-5 text-emerald-600 mb-1.5" />
          <p className="text-xs text-gray-500">Parcours</p>
          <p className="text-xl font-bold text-gray-900">14 étapes</p>
        </button>
        <button
          onClick={() => goToSection("geodetective-management", "photos geoguessr")}
          className="bg-white rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50/50 to-white p-3.5 text-left hover:shadow-md transition-shadow col-span-2 sm:col-span-4 xl:col-span-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-1.5 rounded-xl bg-teal-100 border border-teal-200">🛰️</span>
            <div>
              <p className="text-xs text-teal-800 font-bold uppercase tracking-wider">Mode GeoGuessr & Photos Satellites</p>
              <p className="text-xs text-slate-500 font-medium">Gérer, ajouter, modifier ou supprimer les photos réelles, vues satellites et indices</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-xl bg-teal-600 text-white font-black text-xs shadow-xs">
            Gérer les photos →
          </span>
        </button>
      </div>

      {/* ⚡ Outils Développeur : Gestion des Ressources (Gemmes & Cœurs) */}
      <div className="bg-gradient-to-br from-white via-amber-50/30 to-amber-100/20 rounded-2xl shadow-md border-2 border-amber-200/80 p-5 sm:p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-amber-200/70">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-2xl shrink-0">
              💎
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <span>Console Développeur : Ressources, Niveaux & Bonus</span>
                  <span className="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-black uppercase">
                    Admin
                  </span>
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                Attribuez-vous des ressources en un clic pour tester la boutique cosmétique, les montées de niveau et les fonctionnalités sans limitation.
              </p>
            </div>
          </div>

          {/* Solde actuel de l'admin */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-sky-50 border border-sky-200 text-sky-900 rounded-xl font-black text-xs sm:text-sm shadow-sm">
              <span>💎</span>
              <span>{adminGamification.gems.toLocaleString()} Gems</span>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl font-black text-xs sm:text-sm shadow-sm">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>Niv. {profile?.level || adminGamification.level || 1} ({(profile?.experience_points ?? adminGamification.xp ?? 0).toLocaleString()} XP)</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 border border-cyan-200 text-cyan-800 rounded-xl font-black text-xs sm:text-sm shadow-sm">
              <span>🧊</span>
              <span>{adminGamification.streakFreezes || 0} Gels</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-800 rounded-xl font-black text-xs sm:text-sm shadow-sm">
              <span>🎨</span>
              <span>{adminGamification.inventory?.themes?.length || 1} Thèmes</span>
            </div>
          </div>
        </div>

        {/* Boutons d'octroi rapide */}
        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
            Actions Rapides en 1 Clic
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            <button
              type="button"
              onClick={() => {
                const s = adminGrantResources(profile?.id, { gemsDelta: 500 });
                playSound("success");
                toast.success("+500 TerraGems 💎 ajoutées !");
                setAdminGamification(s);
              }}
              className="py-2.5 px-3 bg-white hover:bg-sky-50 text-sky-900 font-black text-xs rounded-xl border border-sky-300 shadow-sm active:scale-95 transition-all text-center flex flex-col items-center gap-1"
            >
              <span className="text-base">💎</span>
              <span>+500 Gems</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const s = adminGrantResources(profile?.id, { gemsDelta: 2500 });
                playSound("success");
                toast.success("+2 500 TerraGems 💎 ajoutées !");
                setAdminGamification(s);
              }}
              className="py-2.5 px-3 bg-white hover:bg-sky-50 text-sky-900 font-black text-xs rounded-xl border border-sky-300 shadow-sm active:scale-95 transition-all text-center flex flex-col items-center gap-1"
            >
              <span className="text-base">💎</span>
              <span>+2 500 Gems</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const s = adminGrantResources(profile?.id, { gemsDelta: 10000 });
                playSound("success");
                triggerConfetti();
                toast.success("+10 000 TerraGems 💎 ajoutées !");
                setAdminGamification(s);
              }}
              className="py-2.5 px-3 bg-white hover:bg-sky-50 text-sky-900 font-black text-xs rounded-xl border border-sky-300 shadow-sm active:scale-95 transition-all text-center flex flex-col items-center gap-1"
            >
              <span className="text-base">💎</span>
              <span>+10 000 Gems</span>
            </button>

            <button
              type="button"
              onClick={() => handleAdminGrantXp({ xpDelta: 1000 })}
              className="py-2.5 px-3 bg-white hover:bg-amber-50 text-amber-900 font-black text-xs rounded-xl border border-amber-300 shadow-sm active:scale-95 transition-all text-center flex flex-col items-center gap-1"
            >
              <span className="text-base">⭐</span>
              <span>+1 000 XP</span>
            </button>

            <button
              type="button"
              onClick={() => handleAdminGrantXp({ xpDelta: 5000 })}
              className="py-2.5 px-3 bg-white hover:bg-amber-50 text-amber-900 font-black text-xs rounded-xl border border-amber-300 shadow-sm active:scale-95 transition-all text-center flex flex-col items-center gap-1"
            >
              <span className="text-base">🌟</span>
              <span>+5 000 XP</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const s = adminGrantResources(profile?.id, { streakFreezesDelta: 3 });
                playSound("success");
                toast.success("+3 Gels de Flamme 🧊 ajoutés !");
                setAdminGamification(s);
              }}
              className="py-2.5 px-3 bg-white hover:bg-indigo-50 text-indigo-900 font-black text-xs rounded-xl border border-indigo-300 shadow-sm active:scale-95 transition-all text-center flex flex-col items-center gap-1"
            >
              <span className="text-base">🧊</span>
              <span>+3 Gels 🧊</span>
            </button>

            <button
              type="button"
              onClick={async () => {
                const s = adminGrantResources(profile?.id, { setGems: 100, setXp: 0 });
                if (profile?.id) {
                  await adminUpdateUserXp(profile.id, { setXp: 0 }, profile);
                  if (refreshProfile) await refreshProfile();
                }
                playSound("click");
                toast.success("Ressources réinitialisées (100 💎, 0 XP) !");
                setAdminGamification(s);
              }}
              className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-700 font-black text-xs rounded-xl border border-slate-300 shadow-sm active:scale-95 transition-all text-center flex flex-col items-center gap-1"
            >
              <span className="text-base">🔄</span>
              <span>Reset Solde</span>
            </button>
          </div>
        </div>

        {/* Formulaires d'ajustement personnalisé */}
        <div className="pt-3 border-t border-amber-200/70 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Custom Gems */}
          <div className="bg-white/80 p-3 rounded-xl border border-slate-200">
            <label className="block text-xs font-black text-slate-700 mb-1.5">
              💎 Ajustement Personnalisé des TerraGems
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Montant (ex: 1500)..."
                value={customGrantGems}
                onChange={(e) => setCustomGrantGems(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => {
                  const val = parseInt(customGrantGems, 10);
                  if (!isNaN(val) && val !== 0) {
                    const s = adminGrantResources(profile?.id, { gemsDelta: val });
                    playSound("success");
                    toast.success(`${val >= 0 ? "+" : ""}${val} 💎 ajoutées !`);
                    setAdminGamification(s);
                    setCustomGrantGems("");
                  }
                }}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-black text-xs rounded-lg whitespace-nowrap active:scale-95 shadow-sm transition-all"
              >
                + Ajouter
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = parseInt(customGrantGems, 10);
                  if (!isNaN(val) && val >= 0) {
                    const s = adminGrantResources(profile?.id, { setGems: val });
                    playSound("success");
                    toast.success(`Solde fixé à ${val} 💎 !`);
                    setAdminGamification(s);
                    setCustomGrantGems("");
                  }
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs rounded-lg whitespace-nowrap active:scale-95 shadow-sm transition-all"
              >
                = Définir
              </button>
            </div>
          </div>

          {/* Custom XP */}
          <div className="bg-white/80 p-3 rounded-xl border border-slate-200">
            <label className="block text-xs font-black text-slate-700 mb-1.5">
              ⭐ Ajustement Personnalisé de l'Expérience (XP)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Points d'XP (ex: 2000)..."
                value={customGrantXp}
                onChange={(e) => setCustomGrantXp(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={async () => {
                  const val = parseInt(customGrantXp, 10);
                  if (!isNaN(val) && val !== 0) {
                    await handleAdminGrantXp({ xpDelta: val });
                    setCustomGrantXp("");
                  }
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-lg whitespace-nowrap active:scale-95 shadow-sm transition-all"
              >
                + Ajouter
              </button>
              <button
                type="button"
                onClick={async () => {
                  const val = parseInt(customGrantXp, 10);
                  if (!isNaN(val) && val >= 0) {
                    await handleAdminGrantXp({ setXp: val });
                    setCustomGrantXp("");
                  }
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs rounded-lg whitespace-nowrap active:scale-95 shadow-sm transition-all"
              >
                = Définir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Deux Nouvelles Cartes Exécutives : Géo-Intelligence & Personnalisation Active ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Carte 1 : Intelligence Géo & Radar Pays */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Globe className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Intelligence Géo : Radar des Pays
                  </h3>
                  <p className="text-xs text-slate-500">
                    Détection en temps réel des pays les plus maîtrisés et des pièges
                  </p>
                </div>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-black bg-emerald-100 text-emerald-800 uppercase">
                195 Pays Suivis
              </span>
            </div>

            {countryIntel ? (
              <div className="grid grid-cols-2 gap-3 my-4">
                {/* Top 3 Reconnus */}
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <p className="text-xs font-black text-emerald-800 uppercase mb-2 flex items-center gap-1">
                    <span>🌟 Top 3 Reconnus</span>
                  </p>
                  <div className="space-y-1.5">
                    {countryIntel.mostRecognizedCountries.slice(0, 3).map((c) => (
                      <div key={c.iso3} className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 truncate">
                          {c.flagEmoji} {c.name}
                        </span>
                        <span className="font-black text-emerald-700">
                          {c.recognitionRate.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top 3 Pièges */}
                <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200">
                  <p className="text-xs font-black text-rose-800 uppercase mb-2 flex items-center gap-1">
                    <span>⚠️ Top 3 Pièges Géo</span>
                  </p>
                  <div className="space-y-1.5">
                    {countryIntel.mostFailedCountries.slice(0, 3).map((c) => (
                      <div key={c.iso3} className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 truncate">
                          {c.flagEmoji} {c.name}
                        </span>
                        <span className="font-black text-rose-700">
                          {c.recognitionRate.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                Chargement des données géographiques...
              </div>
            )}
          </div>

          <button
            onClick={() => goToSection("country-tracking", "radar des pays")}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-emerald-200"
          >
            <span>Explorer le classement complet & exporter CSV</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Carte 2 : Personnalisation Active du Site */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-violet-100 text-violet-800">
                  <Palette className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Personnalisation Active du Site
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bannière globale, pays vedette et multiplicateurs en temps réel
                  </p>
                </div>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-black bg-violet-100 text-violet-800 uppercase">
                Configuration
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 my-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-500 font-semibold mb-1">Bannière Globale</p>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      siteConfig.announcement.enabled ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                    }`}
                  />
                  <span className="font-bold text-slate-800 truncate">
                    {siteConfig.announcement.enabled ? "Active en ligne" : "Désactivée"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-500 font-semibold mb-1">Multiplicateur XP</p>
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    {siteConfig.gameplay.isEventActive
                      ? `${siteConfig.gameplay.globalXpMultiplier}x XP (Actif)`
                      : "1.0x (Standard)"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-500 font-semibold mb-1">Pays à l'Honneur</p>
                <div className="flex items-center gap-1.5 font-bold text-slate-800 truncate">
                  <Star className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">
                    {siteConfig.featuredCountry.isActive
                      ? `${siteConfig.featuredCountry.flagEmoji} ${siteConfig.featuredCountry.name}`
                      : "Aucun pays vedette"}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-500 font-semibold mb-1">Seuil Pokédex</p>
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    ≥ {siteConfig.gameplay.conquestAccuracyThreshold ?? 80}% de précision
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => goToSection("site-config", "personnalisation")}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-900 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-violet-200"
          >
            <span>Modifier la bannière d'annonce, les multiplicateurs & règles</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Hub Central de Configuration & Paramétrage Direct ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xs">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Hub Central de Configuration
              </h2>
              <p className="text-xs text-slate-500">
                Accès direct à tous les modules paramétrables de TerraCoast
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
            ⚡ Configuration en direct
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <button
            onClick={() => goToSection("path-management", "parcours")}
            className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-lg bg-emerald-100 text-emerald-700 group-hover:scale-110 transition-transform">
                  <Compass className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                  Quêtes
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                Parcours Pédagogique
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Configurez les mondes, les étapes, les embranchements et les boss de progression.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-3 pt-2 border-t border-slate-100 group-hover:translate-x-0.5 transition-transform">
              <span>Ouvrir l'éditeur</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>

          <button
            onClick={() => goToSection("geodetective-management", "geoguessr")}
            className="p-4 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/40 transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-lg bg-teal-100 text-teal-700 group-hover:scale-110 transition-transform">
                  <Camera className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded-full">
                  Photos
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-teal-700 transition-colors">
                GeoGuessr & Lieux
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Ajoutez, modifiez ou supprimez des panoramas réels avec coordonnées GPS et indices.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-teal-600 mt-3 pt-2 border-t border-slate-100 group-hover:translate-x-0.5 transition-transform">
              <span>Gérer les panoramas</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>

          <button
            onClick={() => goToSection("site-config", "personnalisation")}
            className="p-4 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50/40 transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-lg bg-violet-100 text-violet-700 group-hover:scale-110 transition-transform">
                  <Palette className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-violet-700 bg-violet-100/60 px-2 py-0.5 rounded-full">
                  Global
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-violet-700 transition-colors">
                Personnalisation & Site
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Bannière d'annonce, Double XP, pays de la semaine, thèmes 3D et mode maintenance.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-violet-600 mt-3 pt-2 border-t border-slate-100 group-hover:translate-x-0.5 transition-transform">
              <span>Configurer le site</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>

          <button
            onClick={() => goToSection("geojson-maps-management", "geojson")}
            className="p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-lg bg-amber-100 text-amber-700 group-hover:scale-110 transition-transform">
                  <Map className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-full">
                  Cartes
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-amber-700 transition-colors">
                Subdivisions GeoJSON
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Importez et prévisualisez les cartes de provinces, départements et régions.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 mt-3 pt-2 border-t border-slate-100 group-hover:translate-x-0.5 transition-transform">
              <span>Gérer les cartes</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>

          <button
            onClick={() => goToSection("cards-management", "cartes")}
            className="p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-lg bg-amber-100 text-amber-700 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-full">
                  TerraDex
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-amber-700 transition-colors">
                Cartes TerraDex & Raretés
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Catalogue de cartes, création, attribution des raretés et drop rates des boosters.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 mt-3 pt-2 border-t border-slate-100 group-hover:translate-x-0.5 transition-transform">
              <span>Gérer les cartes</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>

          <button
            onClick={() => goToSection("duel-features", "duels")}
            className="p-4 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/40 transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-lg bg-rose-100 text-rose-700 group-hover:scale-110 transition-transform">
                  <Trophy className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-100/60 px-2 py-0.5 rounded-full">
                  PvP
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-rose-700 transition-colors">
                Duels, Kahoot & Royale
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Règles des parties multijoueurs, timer de questions et formats compétitifs.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600 mt-3 pt-2 border-t border-slate-100 group-hover:translate-x-0.5 transition-transform">
              <span>Ajuster les duels</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>

          <button
            onClick={() => goToSection("badge-management", "badges")}
            className="p-4 rounded-xl border border-slate-200 hover:border-yellow-300 hover:bg-yellow-50/40 transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-lg bg-yellow-100 text-yellow-700 group-hover:scale-110 transition-transform">
                  <Shield className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-yellow-700 bg-yellow-100/60 px-2 py-0.5 rounded-full">
                  Succès
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-yellow-700 transition-colors">
                Badges & Titres
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Conditions de déblocage, récompenses en gemmes, icônes et raretés.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-yellow-700 mt-3 pt-2 border-t border-slate-100 group-hover:translate-x-0.5 transition-transform">
              <span>Éditer les succès</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>

          <button
            onClick={() => goToSection("quiz-validation", "validation")}
            className="p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-lg bg-emerald-100 text-emerald-700 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                  Modération
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                Validation des Quiz
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Inspectez, approuvez ou rejetez les quiz soumis par les utilisateurs.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-3 pt-2 border-t border-slate-100 group-hover:translate-x-0.5 transition-transform">
              <span>Voir la file ({stats.pendingValidations})</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>

          <button
            onClick={() => goToSection("user-management", "utilisateurs")}
            className="p-4 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50/40 transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-lg bg-violet-100 text-violet-700 group-hover:scale-110 transition-transform">
                  <Users className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-violet-700 bg-violet-100/60 px-2 py-0.5 rounded-full">
                  Comptes
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-violet-700 transition-colors">
                Utilisateurs & Rôles
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                Gestion des droits admin/modérateur, octrois de gemmes et historique de bans.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-violet-600 mt-3 pt-2 border-t border-slate-100 group-hover:translate-x-0.5 transition-transform">
              <span>Gérer les comptes</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>
        </div>
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
