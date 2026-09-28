import React from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  Trophy,
  Compass,
  CheckCircle2,
  ShieldCheck,
  Award,
} from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  activeTab: "login" | "register";
  title?: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  activeTab,
  title,
  subtitle,
}) => {
  const navigate = useNavigate();

  const perks = [
    {
      icon: "🎴",
      title: "Pokédex Géographique",
      desc: "Débloquez plus de 200 pays avec raretés, monuments réels et cartes holographiques.",
      bg: "bg-amber-50 text-amber-800 border-amber-200",
    },
    {
      icon: "🏆",
      title: "Ligues Compétitives 2.0",
      desc: "Grimpez de Bronze à Légende avec promotions et classements hebdomadaires.",
      bg: "bg-blue-50 text-blue-800 border-blue-200",
    },
    {
      icon: "🗺️",
      title: "Mode Travle & 9 Modes Arcade",
      desc: "Chrono Rush 60s, reliefs HD, duels asynchrones et party mobile sur smartphone.",
      bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    {
      icon: "🎁",
      title: "+500 XP et 50 Gemmes Offerts",
      desc: "Crédités dès la création de votre profil pour démarrer votre conquête.",
      bg: "bg-purple-50 text-purple-800 border-purple-200",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f7f9fa] text-slate-800 flex flex-col justify-between font-sans selection:bg-[#58cc02] selection:text-white">
      {/* Header avec le vrai logo */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 group hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          <img
            src="/logo.png"
            alt="TerraCoast Logo"
            className="h-10 sm:h-11 w-auto shrink-0 drop-shadow-xs"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-black tracking-tight text-emerald-600">
              TerraCoast
            </span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300">
              2.0
            </span>
          </div>
        </Link>

        <button
          onClick={() => navigate("/")}
          className="btn-duo btn-duo-white px-4 py-2 text-xs font-black text-slate-600"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>Accueil</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="w-full max-w-5xl mx-auto grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Colonne de Gauche : Atouts du jeu façon Duolingo */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-center space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-black uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Mise à Jour 2.0
              </div>
              <h1 className="text-3xl font-black text-slate-900 leading-snug">
                Apprends, Conquiers &{" "}
                <span className="text-[#58cc02]">Défie le Monde</span> !
              </h1>
              <p className="mt-2 text-slate-600 text-sm leading-relaxed font-medium">
                La méthode la plus amusante et addictive pour maîtriser la géographie mondiale, collectionner des pays et jouer avec ses amis.
              </p>
            </div>

            {/* Cartes d'atouts colorées façon Duolingo */}
            <div className="space-y-3">
              {perks.map((p) => (
                <div
                  key={p.title}
                  className={`p-3.5 rounded-2xl border-2 border-b-4 ${p.bg} flex items-start gap-3 transition-transform hover:-translate-y-0.5`}
                >
                  <span className="text-2xl shrink-0 p-1.5 rounded-xl bg-white shadow-2xs border border-black/5">
                    {p.icon}
                  </span>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wide">
                      {p.title}
                    </h4>
                    <p className="text-xs opacity-90 mt-0.5 font-medium leading-snug">
                      {p.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Badge de ligue actif */}
            <div className="p-3.5 rounded-2xl bg-white border-2 border-slate-200 border-b-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-xl">🥈</span>
                <div>
                  <span className="font-black text-slate-800 block">Ligues Hebdomadaires Ouvertes</span>
                  <span className="text-[11px] text-slate-500 font-semibold">Promotion chaque dimanche soir</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-800 font-black text-xs border border-amber-300">
                Ligue Argent
              </span>
            </div>
          </div>

          {/* Colonne de Droite : Formulaire Card Duolingo */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-md">
              {/* Onglets Tactiles Duolingo */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className={`btn-duo py-3 text-xs font-black uppercase tracking-wider ${
                    activeTab === "login"
                      ? "btn-duo-green"
                      : "btn-duo-white"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 mr-1.5" />
                  <span>Connexion</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className={`btn-duo py-3 text-xs font-black uppercase tracking-wider ${
                    activeTab === "register"
                      ? "btn-duo-green"
                      : "btn-duo-white"
                  }`}
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  <span>Créer un compte</span>
                </button>
              </div>

              {/* Form Card */}
              <div className="card-duo p-6 sm:p-8 bg-white border-b-slate-300">
                {title && (
                  <div className="mb-6 text-center">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      {title}
                    </h2>
                    {subtitle && (
                      <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                        {subtitle}
                      </p>
                    )}
                  </div>
                )}

                {children}
              </div>

              {/* Reassurance */}
              <div className="mt-4 flex items-center justify-center gap-4 text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-[#58cc02]" /> 100% Gratuit & Sans Pub
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-[#1cb0f6]" /> Données Sécurisées
                </span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-xs font-semibold text-slate-400">
        <p>© {new Date().getFullYear()} TerraCoast • La plateforme éducative & gaming de géographie.</p>
      </footer>
    </div>
  );
};
