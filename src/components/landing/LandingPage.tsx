import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Globe,
  Menu,
  ShieldCheck,
  Star,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { languageNames, type Language } from "../../i18n/translations";
import { QuizGlobe, type QuizGlobePoint } from "../home/QuizGlobe";
import { supabase } from "../../lib/supabase";

interface LandingPageProps {
  onNavigate: (view: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const { t, language, setLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [liveStats, setLiveStats] = useState({
    activeQuizzes: 0,
    completedSessions: 0,
    loading: true,
  });

  const offers = [
    t("landing.about.offer1"),
    t("landing.about.offer2"),
    t("landing.about.offer3"),
    t("landing.about.offer4"),
    t("landing.about.offer5"),
  ];

  const testimonials = [
    {
      name: "Lina",
      role: "Joueuse quotidienne",
      text: "La meilleure app pour progresser en géographie sans s’ennuyer.",
    },
    {
      name: "Mathis",
      role: "Créateur de quiz",
      text: "Créer et partager mes quiz est super rapide, la communauté joue vraiment.",
    },
    {
      name: "Sara",
      role: "Mode duel",
      text: "Les défis entre amis rendent tout plus fun et motivant.",
    },
  ];

  const globePoints = useMemo<QuizGlobePoint[]>(
    () => [
      {
        quizId: "landing-eu",
        title: "Europe Capitals",
        difficulty: "easy",
        totalPlays: 1450,
        lat: 48.8566,
        lng: 2.3522,
      },
      {
        quizId: "landing-sa",
        title: "South America",
        difficulty: "medium",
        totalPlays: 980,
        lat: -15.78,
        lng: -47.93,
      },
      {
        quizId: "landing-af",
        title: "Africa Challenge",
        difficulty: "hard",
        totalPlays: 720,
        lat: 6.5244,
        lng: 3.3792,
      },
      {
        quizId: "landing-na",
        title: "US States",
        difficulty: "medium",
        totalPlays: 1280,
        lat: 38.9072,
        lng: -77.0369,
      },
      {
        quizId: "landing-as",
        title: "Asia Mega Quiz",
        difficulty: "hard",
        totalPlays: 840,
        lat: 35.6762,
        lng: 139.6503,
      },
    ],
    []
  );

  useEffect(() => {
    let cancelled = false;
    const loadStats = async () => {
      try {
        const { data, error } = await supabase.rpc("get_public_landing_stats");
        if (error) throw error;
        const row = (Array.isArray(data) ? data[0] : null) as
          | { active_quizzes?: number | string | null; completed_sessions?: number | string | null }
          | null;
        const activeQuizzes = Number(row?.active_quizzes || 0);
        const completedSessions = Number(row?.completed_sessions || 0);

        if (!cancelled) {
          setLiveStats({
            activeQuizzes,
            completedSessions,
            loading: false,
          });
        }
      } catch (e) {
        console.error("Landing stats load failed:", e);
        if (!cancelled) {
          setLiveStats((prev) => ({ ...prev, loading: false }));
        }
      }
    };

    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => onNavigate("landing")}
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <img
              src="/logo.png"
              alt="TerraCoast"
              className="h-10 w-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <span className="ml-3 text-2xl font-extrabold text-emerald-600 tracking-tight">
              TerraCoast
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-emerald-600 transition-colors">
              {t("landing.nav.features")}
            </a>
            <a href="#about" className="hover:text-emerald-600 transition-colors">
              {t("landing.nav.about")}
            </a>
            <a href="#contact" className="hover:text-emerald-600 transition-colors">
              {t("landing.nav.contact")}
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen((v) => !v)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Globe className="w-4 h-4" />
                {language.toUpperCase()}
                <ChevronDown className="w-4 h-4" />
              </button>
              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white shadow-xl p-1">
                  {(Object.keys(languageNames) as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors font-medium ${
                        language === lang
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {languageNames[lang]}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => onNavigate("login")}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              {t("landing.hero.login")}
            </button>
            <button
              onClick={() => onNavigate("register")}
              className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow-sm transition-all"
            >
              {t("landing.hero.startAdventure")}
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg border border-slate-200 text-slate-600"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pb-4 space-y-2 border-t border-slate-200 bg-white">
            <button onClick={() => onNavigate("login")} className="w-full mt-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-left font-medium">
              {t("landing.hero.login")}
            </button>
            <button onClick={() => onNavigate("register")} className="w-full px-4 py-2 rounded-lg bg-emerald-600 text-white text-left font-semibold shadow-sm">
              {t("landing.hero.startAdventure")}
            </button>
          </div>
        )}
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-14 sm:pb-16">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="animate-[fadeInUp_.6s_ease-out]">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs sm:text-sm font-medium mb-5 sm:mb-6 shadow-sm">
              <ShieldCheck className="w-4 h-4" />
              Quiz geo moderne, social et compétitif
            </div>
            <h1 className="text-3xl sm:text-5xl xl:text-6xl font-black leading-tight text-slate-900 mb-4 sm:mb-5">
              {t("landing.hero.welcome")}{" "}
              <span className="text-emerald-600">
                TerraCoast
              </span>
            </h1>
            <p className="text-slate-600 text-base sm:text-xl mb-6 sm:mb-8 max-w-2xl">
              {t("landing.hero.subtitle")} {t("landing.hero.subtitleHighlight")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onNavigate("register")}
                className="px-7 py-4 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-md transition-all flex items-center justify-center hover:scale-[1.02] active:scale-[0.99]"
              >
                {t("landing.hero.startAdventure")}
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button
                onClick={() => onNavigate("login")}
                className="px-7 py-4 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 shadow-sm transition-colors hover:scale-[1.02] active:scale-[0.99]"
              >
                {t("landing.hero.login")}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-2 sm:p-3 shadow-xl animate-[fadeInUp_.7s_ease-out] [animation-delay:120ms]">
            <QuizGlobe points={globePoints} onPointClick={() => onNavigate("register")} />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 -mt-4 sm:-mt-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-4">
            TerraCoast ecosystem
          </p>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {[
              "Supabase",
              "React",
              "TypeScript",
              "Tailwind",
              "Recharts",
              "GeoJSON",
              "Multilang",
            ].map((logo, idx) => (
              <div
                key={logo}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-semibold animate-[floatY_4s_ease-in-out_infinite]"
                style={{ animationDelay: `${idx * 180}ms` }}
              >
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            value={liveStats.loading ? "..." : formatCompact(liveStats.activeQuizzes)}
            label="Quiz actifs"
            tone="emerald"
          />
          <StatCard
            value={liveStats.loading ? "..." : formatCompact(liveStats.completedSessions)}
            label="Parties jouées"
            tone="cyan"
          />
          <StatCard value={String(Object.keys(languageNames).length)} label="Langues supportées" tone="violet" />
          <StatCard value="24/7" label="Disponible" tone="amber" />
        </div>
      </section>

      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div className="grid md:grid-cols-3 gap-5">
          <FeatureCard icon={<BookOpen className="w-6 h-6" />} title={t("landing.features.free.title")} description={t("landing.features.free.desc")} />
          <FeatureCard icon={<Users className="w-6 h-6" />} title={t("landing.features.community.title")} description={t("landing.features.community.desc")} />
          <FeatureCard icon={<Star className="w-6 h-6" />} title={t("landing.features.progress.title")} description={t("landing.features.progress.desc")} />
        </div>
      </section>

      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-10 shadow-sm">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-6">{t("landing.about.title")}</h2>
          <p className="text-slate-600 mb-5">{t("landing.about.intro")}</p>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5">
              <h3 className="font-bold text-xl mb-2 flex items-center gap-2 text-emerald-800"><TargetIcon />{t("landing.about.mission")}</h3>
              <p className="text-slate-700">{t("landing.about.missionText")}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-5">
              <h3 className="font-bold text-xl mb-2 flex items-center gap-2 text-blue-800"><Zap className="w-5 h-5 text-blue-600" />{t("landing.about.goal")}</h3>
              <p className="text-slate-700">{t("landing.about.goalText")}</p>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
            <h3 className="font-bold text-xl text-slate-900 mb-3">{t("landing.about.offers")}</h3>
            <ul className="space-y-2 text-slate-700">
              {offers.map((offer, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Star className="w-4 h-4 mt-1 text-emerald-500" />
                  {offer}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-10 shadow-sm">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-6">
            Ils adorent TerraCoast
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map((item) => (
              <div
                key={item.name}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-5 hover:bg-slate-100 transition-colors shadow-sm"
              >
                <p className="text-slate-700 mb-4">“{item.text}”</p>
                <div className="text-sm">
                  <p className="font-bold text-slate-900">{item.name}</p>
                  <p className="text-slate-500">{item.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="rounded-3xl p-8 sm:p-12 bg-emerald-600 text-white text-center shadow-lg">
          <h3 className="text-3xl sm:text-4xl font-black mb-5">{t("landing.cta.ready")}</h3>
          <button
            onClick={() => onNavigate("register")}
            className="px-10 py-4 rounded-xl bg-white text-emerald-700 font-bold hover:bg-slate-50 shadow-md transition-colors hover:scale-[1.02] active:scale-[0.99]"
          >
            {t("landing.cta.createAccount")}
          </button>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} TerraCoast</p>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowLegal(true)} className="hover:text-slate-800 transition-colors">
              {t("landing.footer.legal")}
            </button>
            <button onClick={() => onNavigate("privacy")} className="hover:text-slate-800 transition-colors">
              {t("landing.footer.privacy")}
            </button>
            <button onClick={() => onNavigate("terms")} className="hover:text-slate-800 transition-colors">
              {t("landing.footer.terms")}
            </button>
          </div>
        </div>
      </footer>

      {showLegal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white text-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold">{t("landing.footer.legal")}</h3>
              <button onClick={() => setShowLegal(false)} className="p-2 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 text-sm leading-relaxed">
              <p>
                <strong>TerraCoast</strong>
                <br />
                Site web: terracoast.com
              </p>
              <p>Hébergement: Supabase.</p>
              <p>
                L’ensemble des contenus de TerraCoast est protégé par le droit
                d’auteur. Toute reproduction non autorisée est interdite.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md transition-shadow">
      <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </div>
  );
}

function StatCard({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone: "emerald" | "cyan" | "violet" | "amber";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-700 bg-emerald-50 border-emerald-100"
      : tone === "cyan"
      ? "text-blue-700 bg-blue-50 border-blue-100"
      : tone === "violet"
      ? "text-purple-700 bg-purple-50 border-purple-100"
      : "text-amber-700 bg-amber-50 border-amber-100";

  return (
    <div
      className={`rounded-2xl border ${toneClass} p-5 hover:scale-[1.02] shadow-sm transition-transform`}
    >
      <p className="text-3xl sm:text-4xl font-black mb-1">{value}</p>
      <p className="text-sm font-medium opacity-80">{label}</p>
    </div>
  );
}

function TargetIcon() {
  return (
    <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (value >= 1_000_000) return `${Math.round(value / 100_000) / 10}M+`;
  if (value >= 1_000) return `${Math.round(value / 100) / 10}k+`;
  return `${Math.max(0, Math.floor(value))}`;
}

