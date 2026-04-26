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

const FALLBACK_TESTIMONIALS = [
  {
    id: "fallback-1",
    name: "Lina",
    role: "Joueuse quotidienne",
    text: "La meilleure app pour progresser en géographie sans s'ennuyer.",
    position: 1,
  },
  {
    id: "fallback-2",
    name: "Mathis",
    role: "Créateur de quiz",
    text: "Créer et partager mes quiz est super rapide, la communauté joue vraiment.",
    position: 2,
  },
  {
    id: "fallback-3",
    name: "Sara",
    role: "Mode duel",
    text: "Les défis entre amis rendent tout plus fun et motivant.",
    position: 3,
  },
];

interface LandingTestimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  position: number;
}

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
  const [testimonials, setTestimonials] = useState<LandingTestimonial[]>(FALLBACK_TESTIMONIALS);

  const offers = useMemo(
    () => [
      t("landing.about.offer1"),
      t("landing.about.offer2"),
      t("landing.about.offer3"),
      t("landing.about.offer4"),
      t("landing.about.offer5"),
    ],
    [t]
  );

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

  useEffect(() => {
    let cancelled = false;
    const loadTestimonials = async () => {
      try {
        const { data, error } = await supabase
          .from("landing_testimonials")
          .select("id, name, role, text, position")
          .eq("is_active", true)
          .order("position", { ascending: true });

        if (error) throw error;

        if (!cancelled && data && data.length > 0) {
          setTestimonials(data);
        }
      } catch (e) {
        console.error("Landing testimonials load failed:", e);
      }
    };

    loadTestimonials();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.35),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.30),transparent_35%),radial-gradient(circle_at_70%_80%,rgba(14,116,144,0.25),transparent_40%)]" />
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-emerald-400/10 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-20 w-72 h-72 rounded-full bg-cyan-400/10 blur-3xl animate-pulse [animation-delay:700ms]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => onNavigate("landing")}
            className="flex items-center hover:opacity-90 transition-opacity"
          >
            <img
              src="/logo.png"
              alt="TerraCoast"
              className="h-10 w-auto"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <span className="ml-3 text-2xl font-black bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
              TerraCoast
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-200">
            <a href="#features" className="hover:text-emerald-300 transition-colors">
              {t("landing.nav.features")}
            </a>
            <a href="#about" className="hover:text-emerald-300 transition-colors">
              {t("landing.nav.about")}
            </a>
            <a href="#contact" className="hover:text-emerald-300 transition-colors">
              {t("landing.nav.contact")}
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen((v) => !v)}
                className="px-3 py-2 rounded-lg border border-white/15 hover:bg-white/10 transition-colors flex items-center gap-2 text-sm"
              >
                <Globe className="w-4 h-4" />
                {language.toUpperCase()}
                <ChevronDown className="w-4 h-4" />
              </button>
              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-white/10 bg-slate-900 shadow-2xl p-1">
                  {(Object.keys(languageNames) as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        language === lang
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "text-slate-200 hover:bg-white/10"
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
              className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors"
            >
              {t("landing.hero.login")}
            </button>
            <button
              onClick={() => onNavigate("register")}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold hover:brightness-110 transition-all"
            >
              {t("landing.hero.startAdventure")}
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg border border-white/20"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pb-4 space-y-2 border-t border-white/10">
            <button onClick={() => onNavigate("login")} className="w-full px-4 py-2 rounded-lg border border-white/20 text-left">
              {t("landing.hero.login")}
            </button>
            <button onClick={() => onNavigate("register")} className="w-full px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 text-left font-semibold">
              {t("landing.hero.startAdventure")}
            </button>
          </div>
        )}
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 pb-14 sm:pb-16">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="animate-[fadeInUp_.6s_ease-out]">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-200 text-xs sm:text-sm mb-5 sm:mb-6">
              <ShieldCheck className="w-4 h-4" />
              Quiz geo moderne, social et compétitif
            </div>
            <h1 className="text-3xl sm:text-5xl xl:text-6xl font-black leading-tight mb-4 sm:mb-5">
              {t("landing.hero.welcome")}{" "}
              <span className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent">
                TerraCoast
              </span>
            </h1>
            <p className="text-slate-300 text-base sm:text-xl mb-6 sm:mb-8 max-w-2xl">
              {t("landing.hero.subtitle")} {t("landing.hero.subtitleHighlight")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onNavigate("register")}
                className="px-7 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold hover:brightness-110 transition-all flex items-center justify-center hover:scale-[1.02] active:scale-[0.99]"
              >
                {t("landing.hero.startAdventure")}
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button
                onClick={() => onNavigate("login")}
                className="px-7 py-4 rounded-xl border border-white/20 hover:bg-white/10 font-semibold transition-colors hover:scale-[1.02] active:scale-[0.99]"
              >
                {t("landing.hero.login")}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-2 sm:p-3 shadow-2xl animate-[fadeInUp_.7s_ease-out] [animation-delay:120ms]">
            <QuizGlobe points={globePoints} onPointClick={() => onNavigate("register")} />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 -mt-4 sm:-mt-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 sm:p-6">
          <p className="text-xs uppercase tracking-wider text-slate-300 mb-4">
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
                className="px-4 py-2 rounded-xl border border-white/10 bg-slate-900/40 text-slate-200 text-sm font-semibold animate-[floatY_4s_ease-in-out_infinite]"
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
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-7 sm:p-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">{t("landing.about.title")}</h2>
          <p className="text-slate-200 mb-5">{t("landing.about.intro")}</p>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-400/20 p-5">
              <h3 className="font-bold text-xl mb-2 flex items-center gap-2"><TargetIcon />{t("landing.about.mission")}</h3>
              <p className="text-slate-200">{t("landing.about.missionText")}</p>
            </div>
            <div className="rounded-2xl bg-blue-500/10 border border-blue-400/20 p-5">
              <h3 className="font-bold text-xl mb-2 flex items-center gap-2"><Zap className="w-5 h-5 text-blue-300" />{t("landing.about.goal")}</h3>
              <p className="text-slate-200">{t("landing.about.goalText")}</p>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-900/50 border border-white/10 p-5">
            <h3 className="font-bold text-xl mb-3">{t("landing.about.offers")}</h3>
            <ul className="space-y-2 text-slate-200">
              {offers.map((offer, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Star className="w-4 h-4 mt-1 text-emerald-300" />
                  {offer}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-7 sm:p-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-6">
            Ils adorent TerraCoast
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 hover:bg-slate-900/70 transition-colors"
              >
                <p className="text-slate-200 mb-4">“{item.text}”</p>
                <div className="text-sm">
                  <p className="font-bold text-white">{item.name}</p>
                  <p className="text-slate-400">{item.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 text-center">
          <h3 className="text-3xl sm:text-4xl font-black mb-5">{t("landing.cta.ready")}</h3>
          <button
            onClick={() => onNavigate("register")}
            className="px-10 py-4 rounded-xl bg-slate-950 text-white font-bold hover:bg-slate-900 transition-colors hover:scale-[1.02] active:scale-[0.99]"
          >
            {t("landing.cta.createAccount")}
          </button>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400">
          <p>© {new Date().getFullYear()} TerraCoast</p>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowLegal(true)} className="hover:text-white transition-colors">
              {t("landing.footer.legal")}
            </button>
            <button onClick={() => onNavigate("privacy")} className="hover:text-white transition-colors">
              {t("landing.footer.privacy")}
            </button>
            <button onClick={() => onNavigate("terms")} className="hover:text-white transition-colors">
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
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 hover:bg-white/10 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-slate-300">{description}</p>
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
      ? "from-emerald-500/20 to-emerald-400/5 border-emerald-300/20 text-emerald-200"
      : tone === "cyan"
      ? "from-cyan-500/20 to-cyan-400/5 border-cyan-300/20 text-cyan-200"
      : tone === "violet"
      ? "from-violet-500/20 to-violet-400/5 border-violet-300/20 text-violet-200"
      : "from-amber-500/20 to-amber-400/5 border-amber-300/20 text-amber-200";

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br ${toneClass} backdrop-blur-sm p-5 hover:scale-[1.02] transition-transform`}
    >
      <p className="text-3xl sm:text-4xl font-black mb-1">{value}</p>
      <p className="text-sm text-slate-300">{label}</p>
    </div>
  );
}

function TargetIcon() {
  return (
    <svg className="w-5 h-5 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

