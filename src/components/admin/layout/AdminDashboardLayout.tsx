import { useState } from "react";
import { useNavigate, useLocation, Outlet, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Shield,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Users,
  Settings,
  Tags,
  Trophy,
  Map,
  BarChart3,
  MessageSquareQuote,
  Compass,
  Globe,
  Palette,
  Camera,
  ExternalLink,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAuth } from "../../../contexts/AuthContext";
import type { ReactNode } from "react";

interface AdminNavItem {
  view: string;
  path: string;
  label: string;
  badge?: string;
  icon: ReactNode;
}

export function AdminDashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { profile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Déduire la vue courante à partir du pathname
  const currentView = (() => {
    const path = location.pathname;
    if (path === '/admin') return 'admin';
    if (path.includes('/admin/analytics')) return 'admin-analytics';
    if (path.includes('/admin/countries')) return 'country-tracking';
    if (path.includes('/admin/site-config')) return 'site-config';
    if (path.includes('/admin/cards')) return 'cards-management';
    if (path.includes('/admin/path')) return 'path-management';
    if (path.includes('/admin/geodetective')) return 'geodetective-management';
    if (path.includes('/admin/quizzes')) return 'quiz-management';
    if (path.includes('/admin/validation')) return 'quiz-validation';
    if (path.includes('/admin/geojson')) return 'geojson-maps-management';
    if (path.includes('/admin/warnings')) return 'warnings-management';
    if (path.includes('/admin/users')) return 'user-management';
    if (path.includes('/admin/duels')) return 'duel-features';
    if (path.includes('/admin/badges')) return 'badge-management';
    if (path.includes('/admin/titles')) return 'title-management';
    if (path.includes('/admin/categories')) return 'category-management';
    if (path.includes('/admin/difficulties')) return 'difficulty-management';
    if (path.includes('/admin/types')) return 'quiz-type-management';
    if (path.includes('/admin/homepage-testimonials-management')) return 'homepage-testimonials-management';
    return 'admin';
  })();

  const sections: Array<{ title: string; icon: string; items: AdminNavItem[] }> = [
    {
      title: "Pilotage & Intelligence",
      icon: "📊",
      items: [
        {
          view: "admin",
          path: "/admin",
          label: t("admin.nav.overview") || "Vue d'ensemble & KPI",
          icon: <LayoutDashboard className="w-4 h-4 text-emerald-600" />,
        },
        {
          view: "country-tracking",
          path: "/admin/countries",
          label: "Intelligence Géo (250 Pays)",
          badge: "Radar",
          icon: <Globe className="w-4 h-4 text-sky-600" />,
        },
        {
          view: "admin-analytics",
          path: "/admin/analytics",
          label: t("admin.nav.analytics") || "Statistiques & Rétention",
          icon: <BarChart3 className="w-4 h-4 text-indigo-600" />,
        },
      ],
    },
    {
      title: "Quêtes, Cartes & GeoGuessr",
      icon: "🗺️",
      items: [
        {
          view: "path-management",
          path: "/admin/path",
          label: "Parcours Pédagogique",
          badge: "Quêtes",
          icon: <Compass className="w-4 h-4 text-emerald-600" />,
        },
        {
          view: "geodetective-management",
          path: "/admin/geodetective",
          label: "GeoGuessr & Lieux Photo",
          badge: "Photos",
          icon: <Camera className="w-4 h-4 text-teal-600" />,
        },
        {
          view: "quiz-management",
          path: "/admin/quizzes",
          label: t("admin.nav.quizManagement") || "Quiz & Banques de Questions",
          icon: <BookOpen className="w-4 h-4 text-blue-600" />,
        },
        {
          view: "quiz-validation",
          path: "/admin/validation",
          label: t("admin.nav.quizValidation") || "Modération & Approbations",
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
        },
        {
          view: "geojson-maps-management",
          path: "/admin/geojson",
          label: t("admin.nav.geojsonMaps") || "Subdivisions Régionales GeoJSON",
          icon: <Map className="w-4 h-4 text-amber-600" />,
        },
        {
          view: "cards-management",
          path: "/admin/cards",
          label: "Cartes TerraDex & Raretés",
          badge: "Cartes",
          icon: <Sparkles className="w-4 h-4 text-amber-500" />,
        },
      ],
    },
    {
      title: "Modération & Communauté",
      icon: "🛡️",
      items: [
        {
          view: "user-management",
          path: "/admin/users",
          label: t("admin.nav.userManagement") || "Utilisateurs & Permissions",
          icon: <Users className="w-4 h-4 text-violet-600" />,
        },
        {
          view: "warnings-management",
          path: "/admin/warnings",
          label: t("admin.nav.reports") || "Signalements & Sanctions",
          icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
        },
        {
          view: "homepage-testimonials-management",
          path: "/admin/homepage-testimonials-management",
          label: "Avis & Témoignages Homepage",
          icon: <MessageSquareQuote className="w-4 h-4 text-pink-600" />,
        },
      ],
    },
    {
      title: "Configuration & Économie",
      icon: "⚙️",
      items: [
        {
          view: "site-config",
          path: "/admin/site-config",
          label: "Personnalisation & Réglages du Site",
          badge: "Live",
          icon: <Palette className="w-4 h-4 text-violet-600" />,
        },
        {
          view: "duel-features",
          path: "/admin/duels",
          label: t("admin.nav.duelFeatures") || "Duels, Kahoot & Battle Royale",
          icon: <Trophy className="w-4 h-4 text-amber-600" />,
        },
        {
          view: "badge-management",
          path: "/admin/badges",
          label: t("admin.nav.badges") || "Badges & Trophées",
          icon: <Shield className="w-4 h-4 text-yellow-600" />,
        },
        {
          view: "title-management",
          path: "/admin/titles",
          label: t("admin.nav.titles") || "Titres Honorifiques",
          icon: <Sparkles className="w-4 h-4 text-purple-600" />,
        },
        {
          view: "category-management",
          path: "/admin/categories",
          label: t("admin.nav.categories") || "Catégories Thématiques",
          icon: <Tags className="w-4 h-4 text-emerald-600" />,
        },
        {
          view: "difficulty-management",
          path: "/admin/difficulties",
          label: t("admin.nav.difficulties") || "Niveaux de Difficulté",
          icon: <Settings className="w-4 h-4 text-slate-600" />,
        },
        {
          view: "quiz-type-management",
          path: "/admin/types",
          label: t("admin.nav.quizTypes") || "Formats & Types de Quiz",
          icon: <Settings className="w-4 h-4 text-slate-600" />,
        },
      ],
    },
  ];

  const currentNav = sections.flatMap((s) => s.items).find((i) => i.view === currentView);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Top Executive Header ── */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/admin"
              className="flex items-center gap-2.5 group"
              title="Tableau de bord administrateur"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                    TerraCoast Admin
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                    v2.4 Live
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Console Globale de Pilotage & Paramétrage
                </p>
              </div>
            </Link>
          </div>

          {/* Quick Breadcrumbs on desktop */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-semibold bg-slate-800/60 px-3.5 py-1.5 rounded-xl border border-slate-700/60">
            <span>Admin</span>
            <span>/</span>
            <span className="text-emerald-400 font-bold">{currentNav?.label || "Pilotage"}</span>
          </div>

          {/* Actions on right */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition-all shadow-xs"
            >
              <span>Voir le site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-bold truncate max-w-[120px]">
                {profile?.pseudo || "Admin"}
              </span>
            </div>

            {/* Mobile toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white border border-slate-700"
              aria-label="Menu administration"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${mobileMenuOpen ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Layout Body ── */}
      <div className="max-w-[1520px] w-full mx-auto px-4 sm:px-6 py-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── Left Sidebar Navigation ── */}
          <aside className={`lg:col-span-3 xl:col-span-2.5 ${mobileMenuOpen ? "block" : "hidden lg:block"}`}>
            <div className="sticky top-20 bg-white rounded-2xl shadow-sm border border-slate-200 p-3.5 divide-y divide-slate-100 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin">
              {sections.map((section, idx) => (
                <div key={section.title} className={`${idx > 0 ? "pt-3.5" : ""} pb-2`}>
                  <div className="px-2 mb-2 flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span>{section.icon}</span>
                      <span>{section.title}</span>
                    </span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded-full text-slate-500 font-bold">
                      {section.items.length}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const active = currentView === item.view;
                      return (
                        <button
                          key={item.view}
                          onClick={() => {
                            navigate(item.path);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left group ${
                            active
                              ? "bg-gradient-to-r from-emerald-50 to-teal-50/80 text-emerald-900 border-l-4 border-emerald-600 shadow-xs font-black"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="shrink-0 group-hover:scale-110 transition-transform">
                              {item.icon}
                            </span>
                            <span className="truncate">{item.label}</span>
                          </div>

                          {item.badge && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md uppercase font-black shrink-0 ${
                              active
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* ── Main Workspace Area ── */}
          <section className="lg:col-span-9 xl:col-span-9.5 min-w-0">
            <Outlet />
          </section>
        </div>
      </div>
    </div>
  );
}

