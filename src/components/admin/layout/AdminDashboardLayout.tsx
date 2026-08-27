import { useNavigate, useLocation, Outlet } from "react-router-dom";
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
} from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";

import type { ReactNode } from "react";

interface AdminNavItem {
  view: string;
  label: string;
  icon: ReactNode;
}

export function AdminDashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  // Déduire la vue courante à partir du pathname
  const currentView = (() => {
    const path = location.pathname;
    if (path === '/admin') return 'admin';
    if (path.includes('/admin/analytics')) return 'admin-analytics';
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
    return 'admin';
  })();

  const sections: Array<{ title: string; items: AdminNavItem[] }> = [
    {
      title: t("admin.nav.dashboard"),
      items: [
        {
          view: "admin",
          label: t("admin.nav.overview"),
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          view: "admin-analytics",
          label: t("admin.nav.analytics"),
          icon: <BarChart3 className="w-4 h-4" />,
        },
      ],
    },
    {
      title: t("admin.nav.quizOps"),
      items: [
        {
          view: "quiz-management",
          label: t("admin.nav.quizManagement"),
          icon: <BookOpen className="w-4 h-4" />,
        },
        {
          view: "quiz-validation",
          label: t("admin.nav.quizValidation"),
          icon: <CheckCircle2 className="w-4 h-4" />,
        },
        {
          view: "geojson-maps-management",
          label: t("admin.nav.geojsonMaps"),
          icon: <Map className="w-4 h-4" />,
        },
      ],
    },
    {
      title: t("admin.nav.moderation"),
      items: [
        {
          view: "warnings-management",
          label: t("admin.nav.reports"),
          icon: <AlertTriangle className="w-4 h-4" />,
        },
        {
          view: "user-management",
          label: t("admin.nav.userManagement"),
          icon: <Users className="w-4 h-4" />,
        },
      ],
    },
    {
      title: t("admin.nav.settings"),
      items: [
        {
          view: "duel-features",
          label: t("admin.nav.duelFeatures"),
          icon: <Trophy className="w-4 h-4" />,
        },
        {
          view: "badge-management",
          label: t("admin.nav.badges"),
          icon: <Shield className="w-4 h-4" />,
        },
        {
          view: "title-management",
          label: t("admin.nav.titles"),
          icon: <Shield className="w-4 h-4" />,
        },
        {
          view: "category-management",
          label: t("admin.nav.categories"),
          icon: <Tags className="w-4 h-4" />,
        },
        {
          view: "difficulty-management",
          label: t("admin.nav.difficulties"),
          icon: <Settings className="w-4 h-4" />,
        },
        {
          view: "quiz-type-management",
          label: t("admin.nav.quizTypes"),
          icon: <Settings className="w-4 h-4" />,
        },
      ],
    },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-3 xl:col-span-2">
          <div className="sticky top-24 bg-white rounded-xl shadow-md border border-gray-100 p-3">
            {sections.map((section) => (
              <div key={section.title} className="mb-4 last:mb-0">
                <p className="px-2 mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const active = currentView === item.view;
                    return (
                      <button
                        key={item.view}
                        onClick={() => {
                          const viewToPath: Record<string, string> = {
                            'admin': '/admin',
                            'admin-analytics': '/admin/analytics',
                            'quiz-management': '/admin/quizzes',
                            'quiz-validation': '/admin/validation',
                            'geojson-maps-management': '/admin/geojson',
                            'warnings-management': '/admin/warnings',
                            'user-management': '/admin/users',
                            'duel-features': '/admin/duels',
                            'badge-management': '/admin/badges',
                            'title-management': '/admin/titles',
                            'category-management': '/admin/categories',
                            'difficulty-management': '/admin/difficulties',
                            'quiz-type-management': '/admin/types',
                          };
                          navigate(viewToPath[item.view] ?? `/admin/${item.view}`);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          active
                            ? "bg-emerald-100 text-emerald-800 font-semibold"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>
        <section className="lg:col-span-9 xl:col-span-10"><Outlet /></section>
      </div>
    </div>
  );
}
