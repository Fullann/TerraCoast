import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Flame,
  Trophy,
  Calendar,
  Layers,
  Gamepad2,
  Crosshair,
} from "lucide-react";
import { getHigherLowerRecord } from "../../lib/higherLowerGame";
import { getChronoRushHighScore } from "../../lib/chronoRushGame";
import { getSrsStats } from "../../lib/srsManager";
import { getGeoDetectiveHighScore } from "../../lib/geoDetectiveGame";
import { useAuth } from "../../contexts/AuthContext";

export function GamesHubPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const higherLowerBest = getHigherLowerRecord("population");
  const chronoHighScore = getChronoRushHighScore();
  const srsStats = getSrsStats(user?.id || null);
  const geoHighScore = getGeoDetectiveHighScore();

  const gameModes = [
    {
      id: "geo-detective",
      title: "Geo-Detective Satellite",
      badge: "Nouveau • GeoGuessr 🎯",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
      gradient: "from-cyan-950 via-slate-900 to-emerald-950",
      accentBorder: "hover:border-cyan-500/50",
      icon: "🛰️",
      description:
        "Analyse des images satellites et aériennes HD de merveilles du monde. Place ton repère sur la mappemonde et marque jusqu'à 25 000 points !",
      path: "/games/geo-detective",
      cta: "Lancer l'enquête",
      stat: `Meilleur score : ${geoHighScore.toLocaleString("fr-FR")} pts`,
      statIcon: Crosshair,
    },
    {
      id: "silhouette",
      title: "Silhouette Mystère",
      badge: "Viral 🔥",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      gradient: "from-emerald-950 via-slate-900 to-teal-950",
      accentBorder: "hover:border-emerald-500/50",
      icon: "🗺️",
      description:
        "Devine le pays mystère à partir de sa seule frontière. Calcul de distance en km, orientation boussole et indices progressifs.",
      path: "/games/silhouette",
      cta: "Deviner la silhouette",
      stat: "Défi quotidien disponible",
      statIcon: Calendar,
    },
    {
      id: "higher-lower",
      title: "Plus Grand / Plus Petit",
      badge: "Addictif ⚖️",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      gradient: "from-amber-950 via-slate-900 to-orange-950",
      accentBorder: "hover:border-amber-500/50",
      icon: "⚖️",
      description:
        "Compare la population ou la superficie de deux pays en série infinie. Sauras-tu battre ton record de réponses consécutives ?",
      path: "/games/higher-lower",
      cta: "Lancer le duel",
      stat: `Record : ${higherLowerBest} d'affilée`,
      statIcon: Flame,
    },
    {
      id: "chrono-rush",
      title: "Chrono Rush",
      badge: "Survie ⏱️",
      badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      gradient: "from-rose-950 via-slate-900 to-red-950",
      accentBorder: "hover:border-rose-500/50",
      icon: "⚡",
      description:
        "45 secondes sous haute tension. Chaque bonne réponse ajoute +3s, chaque erreur retire -5s. Multiplicateurs de combos !",
      path: "/games/chrono-rush",
      cta: "Défier le chrono",
      stat: `Meilleur score : ${chronoHighScore} pts`,
      statIcon: Trophy,
    },
    {
      id: "srs",
      title: "Carnet de Révision",
      badge: "Scientifique 🧠",
      badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
      gradient: "from-indigo-950 via-slate-900 to-purple-950",
      accentBorder: "hover:border-indigo-500/50",
      icon: "🧠",
      description:
        "Mémorisation à long terme par répétition espacée (méthode de Leitner). Flashcards interactives avec progression en 5 boîtes.",
      path: "/games/srs",
      cta: "Ouvrir mon carnet",
      stat: `${srsStats.dueToday} cartes à revoir aujourd'hui`,
      statIcon: Layers,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Hero Banner */}
      <section className="relative overflow-hidden pt-12 pb-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-gradient-to-b from-slate-900/80 to-slate-950">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-sm">
            <Gamepad2 className="w-4 h-4" />
            <span>Nouveaux Modes Addictifs</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Arcade & Modes de Jeu 🌍
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Explore de nouvelles façons palpitantes de tester tes connaissances,
            entraîner tes réflexes et ancrer la géographie dans ta mémoire.
          </p>
        </div>
      </section>

      {/* Grid of Game Modes */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {gameModes.map((game) => {
            const StatIcon = game.statIcon;
            return (
              <div
                key={game.id}
                onClick={() => navigate(game.path)}
                className={`group relative rounded-3xl p-6 sm:p-7 border border-slate-800 bg-gradient-to-br ${game.gradient} ${game.accentBorder} transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer flex flex-col justify-between overflow-hidden`}
              >
                {/* Top Badge & Icon */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-4xl filter drop-shadow-md">{game.icon}</span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${game.badgeColor}`}
                    >
                      {game.badge}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-white group-hover:text-emerald-300 transition-colors">
                    {game.title}
                  </h2>

                  <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
                    {game.description}
                  </p>
                </div>

                {/* Bottom Stats & CTA */}
                <div className="pt-6 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                    <StatIcon className="w-4 h-4 text-slate-300" />
                    <span>{game.stat}</span>
                  </div>

                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                    <span>{game.cta}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
