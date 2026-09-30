import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowRight,
  Sparkles,
  Trophy,
  ShieldCheck,
  Play,
  Layers,
  Award,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Star,
  Check,
  Smartphone,
  Swords,
  Share2,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { PageTransition } from "../ui/PageTransition";
import { languageNames, type Language } from "../../i18n/translations";
import { supabase } from "../../lib/supabase";
import type { QuizGlobePoint } from "../home/QuizGlobe";

const QuizGlobe = lazy(() =>
  import("../home/QuizGlobe").then((m) => ({ default: m.QuizGlobe }))
);

export interface LandingPageProps {
  onNavigate?: (view: string) => void;
}

export function LandingPage({ onNavigate: _onNavigate }: LandingPageProps = {}) {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [heroActiveTab, setHeroActiveTab] = useState<"card" | "atlas" | "featured">("card");
  const [activeAtlasLayer, setActiveAtlasLayer] = useState<"political" | "satellite" | "relief" | "night">("satellite");
  const [collectorCopied, setCollectorCopied] = useState(false);

  const [liveStats, setLiveStats] = useState({
    activeQuizzes: 450,
    completedSessions: 18200,
    loading: false,
  });

  useEffect(() => {
    let cancelled = false;
    const loadStats = async () => {
      try {
        const { data, error } = await supabase.rpc("get_public_landing_stats");
        if (error) throw error;
        const row = (Array.isArray(data) ? data[0] : null) as
          | { active_quizzes?: number | string | null; completed_sessions?: number | string | null }
          | null;
        if (!cancelled && row) {
          setLiveStats({
            activeQuizzes: Number(row.active_quizzes) || 450,
            completedSessions: Number(row.completed_sessions) || 18200,
            loading: false,
          });
        }
      } catch {
        // Fallback smooth stats
      }
    };
    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const globePoints = useMemo<QuizGlobePoint[]>(
    () => [
      { quizId: "landing-eu", title: "Europe Capitals", difficulty: "easy", totalPlays: 1450, lat: 48.8566, lng: 2.3522 },
      { quizId: "landing-sa", title: "South America", difficulty: "medium", totalPlays: 980, lat: -15.78, lng: -47.93 },
      { quizId: "landing-af", title: "Africa Challenge", difficulty: "hard", totalPlays: 720, lat: 6.5244, lng: 3.3792 },
      { quizId: "landing-na", title: "US States", difficulty: "medium", totalPlays: 1280, lat: 38.9072, lng: -77.0369 },
      { quizId: "landing-as", title: "Asia Mega Quiz", difficulty: "hard", totalPlays: 840, lat: 35.6762, lng: 139.6503 },
    ],
    []
  );

  const novelties = [
    {
      badge: "COLLECTION 🎴",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      title: "Pokédex & Cartes Holographiques",
      desc: "Conquérez plus de 200 pays et débloquez leurs cartes de rareté Commune, Rare, Épique ou Légendaire avec monuments réels. Téléchargez ou copiez votre carte HD en un clic !",
      icon: "🎴",
      accent: "border-b-amber-400",
    },
    {
      badge: "3D RÉEL 🛰️",
      badgeColor: "bg-sky-100 text-sky-800 border-sky-300",
      title: "Globe 3D Atlas avec 4 Calques HD",
      desc: "Basculez instantanément sur le globe entre la vue Politique, Satellite réel HD, Reliefs topographiques et Vue Nocturne des grandes métropoles illuminées.",
      icon: "🛰️",
      accent: "border-b-sky-400",
    },
    {
      badge: "NOUVEAU 🗺️",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      title: "Mode Travle & Filtres de Voyages",
      desc: "Ralliez deux pays en traversant le moins de frontières possible ! Choisissez entre Voyage Express (3-4 pays), Grand Voyage Transcontinental (6-10 pays) ou 100% Continental.",
      icon: "🗺️",
      accent: "border-b-emerald-400",
    },
    {
      badge: "CHRONO 60S 🏔️",
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
      title: "Reliefs, Fleuves et Merveilles",
      desc: "Course contre la montre effrénée de 60 secondes et questions enrichies de photographies réelles HD (Pétra, Machu Picchu, Fosse des Mariannes, Grand Canyon...).",
      icon: "🏔️",
      accent: "border-b-indigo-400",
    },
    {
      badge: "COMPÉTITION 🏆",
      badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-300",
      title: "Ligues en Direct & Jauge de Montée",
      desc: "Badge de Ligue en direct sur votre profil avec affichage instantané de votre division (Bronze à Légende), rang en temps réel et jauge vers la promotion hebdomadaire.",
      icon: "🏆",
      accent: "border-b-yellow-400",
    },
    {
      badge: "ÉVÉNEMENT ⭐",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
      title: "Pays de la Semaine & Bonus +50% XP",
      desc: "Chaque semaine, un pays sélectionné bénéficie d'un boost d'expérience (+50%), de gemmes gratuites, d'une anecdote culturelle sonore et d'un défi dédié.",
      icon: "⭐",
      accent: "border-b-rose-400",
    },
    {
      badge: "ARCADE 🏅",
      badgeColor: "bg-teal-100 text-teal-800 border-teal-300",
      title: "Hub Arcade & Records Personnels",
      desc: "Chrono Rush 60s, Higher-Lower de populations, Silhouettes Mystères, Géo-Détective Satellite : vos records personnels s'affichent en direct sur chaque jeu !",
      icon: "🎮",
      accent: "border-b-teal-400",
    },
    {
      badge: "MULTIBOUCLE 📻",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
      title: "Radio Globe & Mode Fête Smartphone",
      desc: "Écoutez les stations radio FM en direct de chaque pays pendant vos parties, ou organisez un quiz géant avec vos amis via QR code sans application !",
      icon: "📻",
      accent: "border-b-purple-400",
    },
  ];

  const gameModes = [
    {
      title: "Chrono Rush 60s",
      badge: "Vitesse",
      icon: "⚡",
      desc: "Identifiez un maximum de capitales et drapeaux en 60 secondes chrono.",
      tagBg: "bg-amber-100 text-amber-800",
    },
    {
      title: "Mode Travle",
      badge: "Stratégie",
      icon: "🗺️",
      desc: "Ralliez deux pays distants en traversant le chemin frontalier le plus court.",
      tagBg: "bg-emerald-100 text-emerald-800",
    },
    {
      title: "Higher / Lower",
      badge: "Statistiques",
      icon: "📊",
      desc: "Devinez qui a la plus grande population ou la plus vaste superficie.",
      tagBg: "bg-blue-100 text-blue-800",
    },
    {
      title: "Silhouette Mystère",
      badge: "Observation",
      icon: "🔍",
      desc: "Reconnaissez le tracé géographique d'une nation à travers les indices.",
      tagBg: "bg-purple-100 text-purple-800",
    },
    {
      title: "Géo-Détective Satellite",
      badge: "Enquête",
      icon: "🛰️",
      desc: "Retrouvez l'emplacement exact d'une vue satellite orbitale sur la carte.",
      tagBg: "bg-cyan-100 text-cyan-800",
    },
    {
      title: "Reliefs & Merveilles",
      badge: "Photos HD",
      icon: "🏔️",
      desc: "Explorez les plus grands volcans, canyons, fleuves et trésors antiques.",
      tagBg: "bg-rose-100 text-rose-800",
    },
    {
      title: "Répétition Espacée SRS",
      badge: "Mémoire",
      icon: "🧠",
      desc: "Un algorithme d'apprentissage intelligent pour ne plus rien oublier.",
      tagBg: "bg-indigo-100 text-indigo-800",
    },
    {
      title: "Party Mode Smartphone",
      badge: "Multijoueur",
      icon: "🎉",
      desc: "Jusqu'à 20 amis dans votre salon : ils scannent le QR code et jouent !",
      tagBg: "bg-fuchsia-100 text-fuchsia-800",
    },
  ];

  const leagues = [
    { rank: "Ligue Bronze", icon: "🥉", border: "border-amber-700/40", pts: "0 - 499 XP", color: "bg-amber-100 text-amber-900" },
    { rank: "Ligue Argent", icon: "🥈", border: "border-slate-400", pts: "500 - 1 499 XP", color: "bg-slate-100 text-slate-800" },
    { rank: "Ligue Or", icon: "🥇", border: "border-yellow-400", pts: "1 500 - 3 499 XP", color: "bg-yellow-100 text-yellow-800" },
    { rank: "Ligue Platine", icon: "💎", border: "border-cyan-400", pts: "3 500 - 6 999 XP", color: "bg-cyan-100 text-cyan-800" },
    { rank: "Ligue Diamant", icon: "🔮", border: "border-purple-400", pts: "7 000 - 11 999 XP", color: "bg-purple-100 text-purple-800" },
    { rank: "Ligue Légende", icon: "👑", border: "border-amber-400", pts: "12 000+ XP", color: "bg-gradient-to-r from-amber-200 to-yellow-200 text-amber-900" },
  ];

  const testimonials = [
    {
      name: "Alexandre D.",
      role: "Professeur d'Histoire-Géographie",
      text: "Le mode Travle et le Pokédex ont totalement captivé mes élèves. C'est le meilleur outil d'apprentissage que j'ai vu en 10 ans.",
      avatar: "👨‍🏫",
    },
    {
      name: "Sarah M.",
      role: "Joueuse en Ligue Diamant",
      text: "La compétition hebdomadaire et le switch de calques satellite HD rendent l'application ultra addictive. Impossible de s'en passer !",
      avatar: "🧭",
    },
    {
      name: "Maxime L.",
      role: "Amateur de quiz géographiques",
      text: "Télécharger ses cartes collector holographiques pour les envoyer à ses potes après avoir fait 100% sur un pays... Une idée de génie.",
      avatar: "🏆",
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#f7f9fa] text-slate-800 font-sans selection:bg-[#58cc02] selection:text-white">
        
        {/* 1. Bandeau Annonce 2.0 façon Duolingo */}
        <div className="bg-[#58cc02] text-white text-xs py-2 px-4 text-center font-black flex items-center justify-center gap-2 shadow-xs">
          <span className="px-2 py-0.5 rounded-full bg-white text-[#58cc02] text-[10px] uppercase tracking-wider">
            NOUVEAU
          </span>
          <span className="hidden sm:inline">
            TerraCoast 2.0 est en ligne : Mode Travle, Calques Satellite HD, Cartes Pokédex & Ligues !
          </span>
          <span className="sm:hidden">
            TerraCoast 2.0 est en ligne !
          </span>
          <a
            href="#novelties"
            className="underline hover:text-emerald-100 ml-1 transition-colors flex items-center gap-0.5"
          >
            Découvrir <ChevronRight className="w-3 h-3" />
          </a>
        </div>

        {/* 2. En-tête Navigation avec le VRAI Logo */}
        <header className="sticky top-0 z-40 bg-white border-b-2 border-slate-200 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3">
            {/* Vrai Logo TerraCoast */}
            <Link
              to="/"
              className="flex items-center gap-2.5 shrink-0 min-w-max group hover:scale-[1.02] active:scale-[0.98] transition-transform mr-2 xl:mr-4"
            >
              <img
                src="/logo.png"
                alt="TerraCoast Logo"
                className="h-10 sm:h-11 w-auto shrink-0 drop-shadow-xs"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-emerald-600 whitespace-nowrap">
                  TerraCoast
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0 whitespace-nowrap">
                  2.0
                </span>
              </div>
            </Link>

            {/* Navigation Desktop - Jamais de saut de ligne grâce à whitespace-nowrap & responsive gap */}
            <nav className="hidden xl:flex items-center gap-4 2xl:gap-6 text-sm font-black text-slate-600 shrink-0">
              <a
                href="#novelties"
                className="hover:text-emerald-600 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t("landing.nav.novelties")}</span>
              </a>
              <a
                href="#gamemodes"
                className="hover:text-emerald-600 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Play className="w-4 h-4 text-sky-500 shrink-0" />
                <span>{t("landing.nav.gameModes")}</span>
              </a>
              <a
                href="#pokedex"
                className="hover:text-emerald-600 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Award className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{t("landing.nav.pokedex")}</span>
              </a>
              <a
                href="#leagues"
                className="hover:text-emerald-600 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Trophy className="w-4 h-4 text-yellow-500 shrink-0" />
                <span>{t("landing.nav.leagues")}</span>
              </a>
              <button
                type="button"
                onClick={() => navigate("/party")}
                className="hover:text-purple-600 text-purple-700 transition-colors flex items-center gap-1.5 cursor-pointer font-black whitespace-nowrap shrink-0"
              >
                <Smartphone className="w-4 h-4 text-purple-600 shrink-0" />
                <span>{t("landing.nav.mobileParty")}</span>
              </button>
            </nav>

            {/* Boutons d'Action Duolingo */}
            <div className="hidden md:flex items-center gap-2 xl:gap-3 shrink-0">
              {/* Sélecteur de Langue */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setLangMenuOpen((v) => !v)}
                  className="px-3 py-2 rounded-2xl border-2 border-slate-200 border-b-4 bg-white hover:bg-slate-50 text-slate-700 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>{language.toUpperCase()}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                {langMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white border-2 border-slate-200 border-b-4 shadow-xl p-1.5 z-50">
                    {(Object.keys(languageNames) as Language[]).map((lng) => (
                      <button
                        key={lng}
                        onClick={() => {
                          setLanguage(lng);
                          setLangMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-between ${
                          language === lng
                            ? "bg-emerald-50 text-emerald-700 font-black"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span>{languageNames[lng]}</span>
                        {language === lng && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Bouton Connexion */}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="btn-duo btn-duo-white px-4 xl:px-5 py-2.5 text-xs uppercase whitespace-nowrap shrink-0"
              >
                {t("landing.nav.login")}
              </button>

              {/* Bouton Commencer */}
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="btn-duo btn-duo-green px-4 xl:px-5 py-2.5 text-xs uppercase whitespace-nowrap shrink-0"
              >
                {t("landing.nav.start")}
              </button>
            </div>

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="xl:hidden p-2 rounded-2xl border-2 border-slate-200 border-b-4 bg-white text-slate-700 cursor-pointer shrink-0"
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Menu Mobile Déroulant */}
          {mobileMenuOpen && (
            <div className="xl:hidden px-4 pt-2 pb-6 space-y-2.5 bg-white border-t-2 border-slate-100">
              <a
                href="#novelties"
                onClick={() => setMobileMenuOpen(false)}
                className="block p-3 rounded-2xl bg-slate-50 text-sm font-black text-slate-800 flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-emerald-600" /> {t("landing.nav.novelties")}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
              <a
                href="#gamemodes"
                onClick={() => setMobileMenuOpen(false)}
                className="block p-3 rounded-2xl bg-slate-50 text-sm font-black text-slate-800 flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><Play className="w-4 h-4 text-sky-600" /> {t("landing.nav.gameModes")}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
              <a
                href="#pokedex"
                onClick={() => setMobileMenuOpen(false)}
                className="block p-3 rounded-2xl bg-slate-50 text-sm font-black text-slate-800 flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><Award className="w-4 h-4 text-amber-600" /> {t("landing.nav.pokedex")}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
              <a
                href="#leagues"
                onClick={() => setMobileMenuOpen(false)}
                className="block p-3 rounded-2xl bg-slate-50 text-sm font-black text-slate-800 flex items-center justify-between"
              >
                <span className="flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-600" /> {t("landing.nav.leagues")}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/party");
                }}
                className="w-full text-left p-3 rounded-2xl bg-purple-50 text-sm font-black text-purple-800 flex items-center justify-between border-2 border-purple-200"
              >
                <span className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-purple-600" /> {t("landing.nav.mobileParty")}</span>
                <ChevronRight className="w-4 h-4 text-purple-600" />
              </button>

              <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigate("/login")}
                  className="btn-duo btn-duo-white py-3 text-xs uppercase"
                >
                  {t("landing.nav.login")}
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="btn-duo btn-duo-green py-3 text-xs uppercase"
                >
                  {t("auth.signUp")}
                </button>
              </div>
            </div>
          )}
        </header>

        {/* 3. HERO SECTION FAÇON DUOLINGO */}
        <section className="pt-10 sm:pt-16 pb-16 sm:pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Texte & Boutons */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge Duolingo */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-800 text-xs font-black uppercase tracking-wider">
                <span className="text-base">🌍</span>
                <span>{t("landing.hero.badge")}</span>
              </div>

              {/* Titre percutant */}
              <h1 className="text-4xl sm:text-6xl xl:text-7xl font-black text-slate-900 tracking-tight leading-[1.08]">
                {t("landing.hero.titleMain")}{" "}
                <span className="text-[#58cc02]">{t("landing.hero.titleHighlight")}</span> !
              </h1>

              {/* Sous-titre clair */}
              <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-semibold">
                {t("landing.hero.desc")}
              </p>

              {/* Badges de confiance */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 text-xs font-black text-slate-600 pt-1">
                <span className="px-3.5 py-1.5 rounded-2xl bg-white border-2 border-slate-200 border-b-4 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#58cc02]" /> {t("landing.hero.freeBadge")}
                </span>
                <span className="px-3.5 py-1.5 rounded-2xl bg-white border-2 border-slate-200 border-b-4 flex items-center gap-1.5">
                  <Swords className="w-4 h-4 text-[#ffc800]" /> {t("landing.hero.modesBadge")}
                </span>
                <span className="px-3.5 py-1.5 rounded-2xl bg-white border-2 border-slate-200 border-b-4 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#ce82ff]" /> {t("landing.hero.mobileBadge")}
                </span>
              </div>

              {/* Boutons Tactiles Duolingo */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                <button
                  onClick={() => navigate("/register")}
                  className="btn-duo btn-duo-green w-full sm:w-auto px-8 py-4 text-base uppercase"
                >
                  <span>{t("landing.nav.start")}</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>

                <button
                  onClick={() => navigate("/login")}
                  className="btn-duo btn-duo-white w-full sm:w-auto px-7 py-4 text-base uppercase"
                >
                  {t("landing.hero.haveAccount")}
                </button>
              </div>

              {/* Bonus Tag */}
              <p className="text-xs text-slate-500 font-bold flex items-center justify-center lg:justify-start gap-2 pt-1">
                <span>🎁</span>
                <span>{t("landing.hero.welcomeBonus")}</span>
              </p>
            </div>

            {/* Widget Interactif Tactile sur la droite */}
            <div className="lg:col-span-5">
              <div className="card-duo p-5 bg-white border-b-slate-300 shadow-md">
                
                {/* Switcher d'onglets du widget */}
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200 mb-4">
                  <button
                    onClick={() => setHeroActiveTab("card")}
                    className={`py-2 text-xs font-black rounded-xl transition cursor-pointer ${
                      heroActiveTab === "card"
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    🎴 Pokédex
                  </button>
                  <button
                    onClick={() => setHeroActiveTab("atlas")}
                    className={`py-2 text-xs font-black rounded-xl transition cursor-pointer ${
                      heroActiveTab === "atlas"
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    🛰️ Calques 3D
                  </button>
                  <button
                    onClick={() => setHeroActiveTab("featured")}
                    className={`py-2 text-xs font-black rounded-xl transition cursor-pointer ${
                      heroActiveTab === "featured"
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    ⭐ Vedette
                  </button>
                </div>

                {/* Tab 1: Carte Collector Pokédex Tactile */}
                {heroActiveTab === "card" && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-3xl bg-amber-50 border-2 border-amber-300 border-b-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                          ⭐ LÉGENDAIRE • #FRA
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black uppercase">
                          Holographique
                        </span>
                      </div>

                      <div className="flex items-center gap-3.5 mb-3 bg-white p-3 rounded-2xl border-2 border-amber-200 shadow-2xs">
                        <div className="text-4xl">🇫🇷</div>
                        <div>
                          <h4 className="text-lg font-black text-slate-900">France</h4>
                          <p className="text-xs text-amber-800 font-bold">Capitale : Paris • Europe</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs mb-3 font-semibold">
                        <div className="p-2.5 rounded-xl bg-white border border-amber-200">
                          <span className="text-[10px] text-slate-400 uppercase font-black block">Monument</span>
                          <span className="font-black text-slate-900">🗼 Tour Eiffel</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white border border-amber-200">
                          <span className="text-[10px] text-slate-400 uppercase font-black block">Statut</span>
                          <span className="font-black text-emerald-600">👑 Conquis 100%</span>
                        </div>
                      </div>

                      <p className="text-xs text-amber-900 bg-amber-100/70 p-2.5 rounded-xl font-medium">
                        💡 <strong>Le saviez-vous ?</strong> Premier pays touristique mondial avec plus de 100 millions de visiteurs par an.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setCollectorCopied(true);
                          setTimeout(() => setCollectorCopied(false), 2500);
                        }}
                        className="btn-duo btn-duo-white flex-1 py-2.5 text-xs font-black"
                      >
                        {collectorCopied ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600 mr-1.5" />
                            <span>Image Copiée !</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-4 h-4 text-amber-500 mr-1.5" />
                            <span>Partager Carte HD</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => navigate("/register")}
                        className="btn-duo btn-duo-amber px-4 py-2.5 text-xs uppercase"
                      >
                        Collectionner 🎴
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab 2: Calques 3D de l'Atlas */}
                {heroActiveTab === "atlas" && (
                  <div className="space-y-3">
                    <div className="relative rounded-3xl bg-slate-900 border-2 border-slate-200 p-3 h-52 flex flex-col justify-between overflow-hidden">
                      {/* Globe WebGL */}
                      <div className="absolute inset-0 opacity-80 pointer-events-none">
                        <Suspense fallback={<div className="h-full flex items-center justify-center text-xs text-white">Chargement du globe...</div>}>
                          <QuizGlobe points={globePoints.slice(0, 3)} onPointClick={() => {}} />
                        </Suspense>
                      </div>

                      {/* Tag du calque actif */}
                      <div className="relative z-10 flex items-center justify-between">
                        <span className="px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md text-xs font-black text-sky-300 border border-sky-400/40">
                          {activeAtlasLayer === "satellite" && "🛰️ Satellite HD Réel"}
                          {activeAtlasLayer === "political" && "🗺️ Vue Politique"}
                          {activeAtlasLayer === "relief" && "🏔️ Vue Relief Topographique"}
                          {activeAtlasLayer === "night" && "🌃 Vue Nocturne Métropoles"}
                        </span>
                        <span className="text-[10px] text-white/80 bg-black/50 px-2 py-0.5 rounded-full font-bold">
                          Globe 3D
                        </span>
                      </div>

                      {/* Sélecteur de boutons */}
                      <div className="relative z-10 grid grid-cols-4 gap-1 p-1 bg-black/80 backdrop-blur-md rounded-2xl border border-white/20">
                        <button
                          onClick={() => setActiveAtlasLayer("political")}
                          className={`py-1 text-[10px] font-black rounded-lg transition cursor-pointer ${
                            activeAtlasLayer === "political" ? "bg-[#1cb0f6] text-white" : "text-slate-300 hover:text-white"
                          }`}
                        >
                          Politique
                        </button>
                        <button
                          onClick={() => setActiveAtlasLayer("satellite")}
                          className={`py-1 text-[10px] font-black rounded-lg transition cursor-pointer ${
                            activeAtlasLayer === "satellite" ? "bg-[#1cb0f6] text-white" : "text-slate-300 hover:text-white"
                          }`}
                        >
                          Satellite
                        </button>
                        <button
                          onClick={() => setActiveAtlasLayer("relief")}
                          className={`py-1 text-[10px] font-black rounded-lg transition cursor-pointer ${
                            activeAtlasLayer === "relief" ? "bg-[#1cb0f6] text-white" : "text-slate-300 hover:text-white"
                          }`}
                        >
                          Relief
                        </button>
                        <button
                          onClick={() => setActiveAtlasLayer("night")}
                          className={`py-1 text-[10px] font-black rounded-lg transition cursor-pointer ${
                            activeAtlasLayer === "night" ? "bg-[#1cb0f6] text-white" : "text-slate-300 hover:text-white"
                          }`}
                        >
                          Nocturne
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate("/register")}
                      className="btn-duo btn-duo-blue w-full py-2.5 text-xs uppercase"
                    >
                      <Layers className="w-4 h-4 mr-1.5" />
                      <span>Explorer l'Atlas 3D en Plein Écran</span>
                    </button>
                  </div>
                )}

                {/* Tab 3: Pays de la Semaine */}
                {heroActiveTab === "featured" && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-3xl bg-emerald-50 border-2 border-emerald-300 border-b-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1">
                          ⭐ PAYS DE LA SEMAINE
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black animate-pulse">
                          +50% XP & GEMMES
                        </span>
                      </div>

                      <div className="flex items-center gap-3 my-2 bg-white p-3 rounded-2xl border-2 border-emerald-200 shadow-2xs">
                        <span className="text-4xl">🇯🇵</span>
                        <div>
                          <h4 className="text-base font-black text-slate-900">Japon • 日本</h4>
                          <p className="text-xs text-emerald-700 font-bold">Capitale : Tokyo • Asie</p>
                        </div>
                      </div>

                      <p className="text-xs text-emerald-900 leading-snug bg-emerald-100/70 p-2.5 rounded-xl font-medium">
                        🗾 <em>Archipel de 6 800 îles volcaniques, le Mont Fuji culmine à 3 776 mètres.</em>
                      </p>
                    </div>

                    <button
                      onClick={() => navigate("/register")}
                      className="btn-duo btn-duo-green w-full py-2.5 text-xs uppercase"
                    >
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      <span>Conquérir le Japon & Doubler mon XP</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>

        {/* 4. SECTION NOVEAUTÉS 2.0 (La demande clé de l'utilisateur) */}
        <section id="novelties" className="py-16 sm:py-24 border-t-2 border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Titre de section */}
            <div className="text-center max-w-3xl mx-auto mb-14">
              <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-800 text-xs font-black uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Mise à Jour 2.0
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
                Tout ce qui change dans{" "}
                <span className="text-[#58cc02]">TerraCoast 2.0</span> !
              </h2>
              <p className="text-sm sm:text-base text-slate-500 font-semibold mt-3">
                Des mécaniques de jeu inédites et tactiles pour transformer chaque partie en une véritable expédition géographique.
              </p>
            </div>

            {/* Grille de Tuiles Duolingo */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {novelties.map((item) => (
                <div
                  key={item.title}
                  className={`card-duo p-5 bg-white ${item.accent} flex flex-col justify-between hover:-translate-y-1 transition-transform`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                      <span className="text-2xl p-1 rounded-xl bg-slate-50 border border-slate-100">
                        {item.icon}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t-2 border-slate-100 flex items-center justify-between text-xs font-black text-[#58cc02]">
                    <span>Déjà disponible</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* 5. SECTION 9 MODES DE JEU FAÇON DUOLINGO */}
        <section id="gamemodes" className="py-16 sm:py-24 border-t-2 border-slate-200 bg-[#f7f9fa]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="text-xs font-black uppercase tracking-widest text-[#1cb0f6] mb-2 block">
                🎮 ARCADE & DÉFIS
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
                9 Modes de Jeu Uniques pour Tester vos Limites
              </h2>
              <p className="text-sm sm:text-base text-slate-500 font-semibold mt-2">
                Chaque mode développe une compétence clé : vitesse, déduction frontalière, observation satellite ou mémoire à long terme.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {gameModes.map((gm) => (
                <div
                  key={gm.title}
                  className="card-duo p-4 bg-white flex flex-col justify-between hover:border-slate-300"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl p-2 rounded-2xl bg-slate-50 border border-slate-200">
                        {gm.icon}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${gm.tagBg}`}>
                        {gm.badge}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-slate-900">{gm.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">{gm.desc}</p>
                  </div>

                  <button
                    onClick={() => navigate("/register")}
                    className="btn-duo btn-duo-white w-full py-2 text-xs uppercase mt-4"
                  >
                    <span>Jouer</span>
                    <Play className="w-3 h-3 ml-1.5 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. SECTION LIGUES COMPÉTITIVES FAÇON DUOLINGO */}
        <section id="leagues" className="py-16 sm:py-24 border-t-2 border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-14">
              <span className="text-xs font-black uppercase tracking-widest text-amber-500 mb-2 block">
                🏆 SYSTÈME COMPÉTITIF HEBDOMADAIRE
              </span>
              <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
                Gravissez les Échelons vers la{" "}
                <span className="text-[#ffc800]">Ligue Légende</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-500 font-semibold mt-2">
                Chaque semaine, affrontez 30 explorateurs de votre division. Les premiers montent dans la division supérieure, les derniers sont relégués !
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {leagues.map((lg) => (
                <div
                  key={lg.rank}
                  className={`card-duo p-4 bg-white border-2 ${lg.border} text-center flex flex-col items-center justify-between`}
                >
                  <span className="text-3xl mb-2">{lg.icon}</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase">{lg.rank}</h4>
                    <span className="text-[10px] font-black text-slate-500 mt-1 block">
                      {lg.pts}
                    </span>
                  </div>
                  <span className={`mt-3 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${lg.color}`}>
                    Division Active
                  </span>
                </div>
              ))}
            </div>

            {/* Bannière Promotion */}
            <div className="mt-8 p-4 rounded-3xl bg-amber-50 border-2 border-amber-300 border-b-4 max-w-2xl mx-auto flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2.5 text-amber-900 font-bold">
                <Trophy className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  <strong>Promotion hebdomadaire :</strong> Tous les dimanches soir à minuit. Coffres de gemmes pour le Top 3 !
                </span>
              </div>
              <button
                onClick={() => navigate("/register")}
                className="btn-duo btn-duo-amber px-4 py-2 text-xs uppercase shrink-0"
              >
                Participer
              </button>
            </div>
          </div>
        </section>

        {/* 7. STATS EN DIRECT */}
        <section className="py-12 border-t-2 border-slate-200 bg-[#f7f9fa]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <div className="card-duo p-4 bg-white">
                <span className="text-3xl sm:text-4xl font-black text-[#58cc02]">197</span>
                <span className="text-xs uppercase tracking-wider text-slate-500 block mt-1 font-black">
                  Pays Conquérables
                </span>
              </div>
              <div className="card-duo p-4 bg-white">
                <span className="text-3xl sm:text-4xl font-black text-[#1cb0f6]">
                  {liveStats.activeQuizzes > 0 ? liveStats.activeQuizzes.toLocaleString("fr-FR") : "500+"}
                </span>
                <span className="text-xs uppercase tracking-wider text-slate-500 block mt-1 font-black">
                  Quiz & Défis Actifs
                </span>
              </div>
              <div className="card-duo p-4 bg-white">
                <span className="text-3xl sm:text-4xl font-black text-[#ffc800]">9</span>
                <span className="text-xs uppercase tracking-wider text-slate-500 block mt-1 font-black">
                  Modes de Jeu Uniques
                </span>
              </div>
              <div className="card-duo p-4 bg-white">
                <span className="text-3xl sm:text-4xl font-black text-[#ce82ff]">
                  {liveStats.completedSessions > 0 ? liveStats.completedSessions.toLocaleString("fr-FR") : "18 000+"}
                </span>
                <span className="text-xs uppercase tracking-wider text-slate-500 block mt-1 font-black">
                  Parties & Duels Validés
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 8. TÉMOIGNAGES */}
        <section className="py-16 sm:py-24 border-t-2 border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-black uppercase tracking-widest text-[#58cc02] mb-2 block">
                COMMUNAUTÉ D'EXPLORATEURS
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Ils Adorent TerraCoast
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((tItem) => (
                <div
                  key={tItem.name}
                  className="card-duo p-6 bg-white flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1 text-amber-400 mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed font-semibold italic">
                      “{tItem.text}”
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t-2 border-slate-100 flex items-center gap-3">
                    <span className="text-3xl p-1.5 rounded-2xl bg-slate-100 border border-slate-200">
                      {tItem.avatar}
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{tItem.name}</h4>
                      <p className="text-xs text-slate-500 font-semibold">{tItem.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 9. BANNIÈRE FINALE DUOLINGO VERTE */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#f7f9fa]">
          <div className="max-w-5xl mx-auto rounded-3xl p-8 sm:p-14 bg-[#58cc02] text-white text-center shadow-lg border-b-8 border-[#46a302]">
            <div className="max-w-2xl mx-auto space-y-5">
              <span className="px-3.5 py-1.5 rounded-full bg-white text-[#58cc02] text-xs font-black uppercase tracking-wider inline-block">
                Prêt pour le grand voyage ?
              </span>

              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Rejoignez des milliers de passionnés gratuitement !
              </h2>

              <p className="text-emerald-100 text-sm sm:text-base font-semibold">
                Créez votre profil en 30 secondes, débloquez vos 500 premiers XP et commencez à bâtir votre Pokédex géographique.
              </p>

              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => navigate("/register")}
                  className="btn-duo btn-duo-white w-full sm:w-auto px-8 py-4 text-base uppercase text-[#58cc02]"
                >
                  <Sparkles className="w-5 h-5 mr-2 text-[#58cc02]" />
                  <span>{t("landing.cta.createAccount")}</span>
                </button>

                <button
                  onClick={() => navigate("/login")}
                  className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-[#46a302] hover:bg-[#3d8c02] text-white font-black text-sm uppercase transition cursor-pointer"
                >
                  {t("landing.hero.login")}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 10. PIED DE PAGE DUOLINGO */}
        <footer className="border-t-2 border-slate-200 bg-white py-12 text-slate-500 text-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            
            {/* Vrai Logo et Marque */}
            <div className="col-span-2 md:col-span-1 space-y-3">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="TerraCoast" className="h-8 w-auto" />
                <span className="font-black text-lg text-emerald-600">TerraCoast 2.0</span>
              </div>
              <p className="text-slate-600 text-xs font-medium leading-relaxed">
                La plateforme de quiz et de conquête géographique en 3D la plus fun et moderne.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider mb-3">Nouveautés 2.0</h4>
              <ul className="space-y-2 font-semibold">
                <li><a href="#novelties" className="hover:text-emerald-600 transition">Pokédex Cartes HD</a></li>
                <li><a href="#novelties" className="hover:text-emerald-600 transition">Mode Travle 2.0</a></li>
                <li><a href="#novelties" className="hover:text-emerald-600 transition">Calques 3D Satellite</a></li>
                <li><a href="#novelties" className="hover:text-emerald-600 transition">Reliefs & Merveilles</a></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider mb-3">Gameplay</h4>
              <ul className="space-y-2 font-semibold">
                <li><a href="#gamemodes" className="hover:text-emerald-600 transition">Chrono Rush 60s</a></li>
                <li><a href="#gamemodes" className="hover:text-emerald-600 transition">Higher / Lower</a></li>
                <li><a href="#leagues" className="hover:text-emerald-600 transition">Ligues Compétitives</a></li>
                <li><Link to="/party" className="hover:text-emerald-600 transition">Party Mode Smartphone</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-black text-slate-900 text-xs uppercase tracking-wider mb-3">Légal</h4>
              <ul className="space-y-2 font-semibold">
                <li><Link to="/terms" className="hover:text-emerald-600 transition">Conditions d'Utilisation</Link></li>
                <li><Link to="/privacy" className="hover:text-emerald-600 transition">Confidentialité</Link></li>
                <li><Link to="/login" className="hover:text-emerald-600 transition">Espace Membre</Link></li>
              </ul>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t-2 border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left font-semibold">
            <p>© {new Date().getFullYear()} TerraCoast • Tous droits réservés.</p>
            <div className="flex items-center gap-4 text-slate-400">
              <span>Plateforme éducative certifiée sans publicité intrusive</span>
              <span>•</span>
              <span>Version 2.0</span>
            </div>
          </div>
        </footer>

      </div>
    </PageTransition>
  );
}
