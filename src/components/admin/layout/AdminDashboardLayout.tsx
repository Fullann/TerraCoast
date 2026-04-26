import type { ReactNode } from "react";
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
} from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";

interface AdminDashboardLayoutProps {
  currentView: string;
  onNavigate: (view: string, data?: any) => void;
  children: ReactNode;
}

interface AdminNavItem {
  view: string;
  label: string;
  icon: ReactNode;
}

export function AdminDashboardLayout({
  currentView,
  onNavigate,
  children,
}: AdminDashboardLayoutProps) {
  const { t } = useLanguage();
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
        {
          view: "homepage-testimonials-management",
          label: "Testimonials homepage",
          icon: <MessageSquareQuote className="w-4 h-4" />,
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
                        onClick={() => onNavigate(item.view)}
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
        <section className="lg:col-span-9 xl:col-span-10">{children}</section>
      </div>
    </div>
  );
}
