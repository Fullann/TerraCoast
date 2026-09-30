import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Flame,
  Trophy,
  Layers,
  Gamepad2,
  Crosshair,
  Sparkles,
  Navigation,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { getAllGamePersonalRecords } from "../../lib/gameRecordsManager";

export function GamesHubPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const records = getAllGamePersonalRecords(user?.id || null);

  const gameModes = [
    {
      id: "geo-detective",
      title: "Geo-Detective Satellite",
      badge: "Nouveau • Style GeoGuessr 🎯",
      badgeClass: "bg-cyan-100 text-cyan-800 border-cyan-200",
      iconBg: "bg-cyan-50 border-cyan-200 text-cyan-600",
      accentHover: "hover:border-cyan-500 group-hover:text-cyan-700",
      btnClass: "bg-cyan-600 hover:bg-cyan-700 border-cyan-800 text-white",
      icon: "🛰️",
      description:
        "Analysez des images satellites HD de merveilles du globe. Placez votre repère sur la carte et marquez jusqu'à 25 000 points !",
      path: "/games/geo-detective",
      cta: "Lancer l'enquête",
      stat: records.geoDetective.display,
      statIcon: Crosshair,
    },
    {
      id: "silhouette",
      title: "Silhouette Mystère",
      badge: "Viral 🔥",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
      iconBg: "bg-emerald-50 border-emerald-200 text-emerald-600",
      accentHover: "hover:border-emerald-500 group-hover:text-emerald-700",
      btnClass: "bg-emerald-500 hover:bg-emerald-600 border-emerald-700 text-white",
      icon: "🗺️",
      description:
        "Devinez le pays mystère à partir de sa seule frontière. Calcul de distance, orientation boussole et indices progressifs.",
      path: "/games/silhouette",
      cta: "Deviner la silhouette",
      stat: records.silhouette.display,
      statIcon: Trophy,
    },
    {
      id: "higher-lower",
      title: "Plus Grand / Plus Petit",
      badge: "Addictif ⚖️",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
      iconBg: "bg-amber-50 border-amber-200 text-amber-600",
      accentHover: "hover:border-amber-500 group-hover:text-amber-700",
      btnClass: "bg-amber-500 hover:bg-amber-600 border-amber-700 text-white",
      icon: "⚖️",
      description:
        "Comparez la population ou la superficie de deux pays en série infinie. Sauriez-vous battre votre record de réponses consécutives ?",
      path: "/games/higher-lower",
      cta: "Lancer le duel",
      stat: records.higherLower.display,
      statIcon: Flame,
    },
    {
      id: "chrono-rush",
      title: "Chrono Rush",
      badge: "Survie ⏱️",
      badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
      iconBg: "bg-rose-50 border-rose-200 text-rose-600",
      accentHover: "hover:border-rose-500 group-hover:text-rose-700",
      btnClass: "bg-rose-500 hover:bg-rose-600 border-rose-700 text-white",
      icon: "⚡",
      description:
        "45 secondes sous haute tension. Chaque bonne réponse ajoute +3s, chaque erreur retire -5s. Multiplicateurs de combos !",
      path: "/games/chrono-rush",
      cta: "Défier le chrono",
      stat: records.chronoRush.display,
      statIcon: Trophy,
    },
    {
      id: "travle",
      title: "Travle : Relieur de Continents",
      badge: "Frontières 🧭",
      badgeClass: "bg-teal-100 text-teal-800 border-teal-200",
      iconBg: "bg-teal-50 border-teal-200 text-teal-600",
      accentHover: "hover:border-teal-500 group-hover:text-teal-700",
      btnClass: "bg-teal-600 hover:bg-teal-700 border-teal-800 text-white",
      icon: "🧭",
      description:
        "Reliez deux pays distants (ex: Portugal ➔ Thaïlande) en ne nommant que des pays frontaliers directs en un minimum d'étapes.",
      path: "/games/travle",
      cta: "Commencer le voyage",
      stat: records.travle.display,
      statIcon: Navigation,
    },
    {
      id: "map-blitz",
      title: "Blind Map Blitz",
      badge: "10 Min Chrono ⚡",
      badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
      iconBg: "bg-orange-50 border-orange-200 text-orange-600",
      accentHover: "hover:border-orange-500 group-hover:text-orange-700",
      btnClass: "bg-orange-500 hover:bg-orange-600 border-orange-700 text-white",
      icon: "🗺️",
      description:
        "Une carte muette du monde ou d'un continent. Tapez les pays le plus vite possible pour illuminer la carte avant la fin du temps !",
      path: "/games/map-blitz",
      cta: "Lancer le blitz",
      stat: records.mapBlitz.display,
      statIcon: Trophy,
    },
    {
      id: "physical-geo",
      title: "Reliefs, Fleuves & Merveilles",
      badge: "Nature & UNESCO 🏔️",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
      iconBg: "bg-emerald-50 border-emerald-200 text-emerald-600",
      accentHover: "hover:border-emerald-500 group-hover:text-emerald-700",
      btnClass: "bg-emerald-600 hover:bg-emerald-700 border-emerald-800 text-white",
      icon: "🏔️",
      description:
        "Grands fleuves, sommets himalayens, détroits maritimes et merveilles antiques. Explorez la géographie physique du monde !",
      path: "/games/physical-geo",
      cta: "Explorer la Terre",
      stat: records.physicalGeo.display,
      statIcon: Layers,
    },
    {
      id: "srs",
      title: "Carnet de Révision",
      badge: "Scientifique 🧠",
      badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-200",
      iconBg: "bg-indigo-50 border-indigo-200 text-indigo-600",
      accentHover: "hover:border-indigo-500 group-hover:text-indigo-700",
      btnClass: "bg-indigo-600 hover:bg-indigo-700 border-indigo-800 text-white",
      icon: "🧠",
      description:
        "Mémorisation à long terme par répétition espacée (méthode de Leitner). Flashcards interactives avec progression en 5 boîtes.",
      path: "/games/srs",
      cta: "Ouvrir mon carnet",
      stat: records.srs.display,
      statIcon: Layers,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Top Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-8">
        {/* Hero Studio Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-7 sm:p-10 shadow-xl shadow-emerald-700/10">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 -mb-10 w-48 h-48 bg-emerald-400/20 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-emerald-100 text-xs font-black tracking-wide uppercase mb-3.5 border border-white/20">
              <Gamepad2 className="w-4 h-4 text-amber-300" />
              <span>Salle d'Arcade TerraCoast</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
              Mini-Jeux & Défis 🌍
            </h1>

            <p className="text-emerald-100 text-sm sm:text-base font-medium leading-relaxed mb-6">
              Entraînez vos réflexes géographiques, devinez les silhouettes, comparez les puissances mondiales et ancrez la mappemonde dans votre mémoire !
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-xs font-bold text-white">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{gameModes.length} modes de jeu interactifs</span>
              </div>
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-xs font-bold text-white">
                <Trophy className="w-4 h-4 text-amber-300" />
                <span>Gagnez des TerraGems 💎 et de l'XP</span>
              </div>
            </div>
          </div>
        </section>

        {/* Grid of Game Cards */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {gameModes.map((game) => {
              return (
                <div
                  key={game.id}
                  onClick={() => navigate(game.path)}
                  className={`group relative rounded-3xl p-6 sm:p-7 bg-white border-2 border-slate-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden ${game.accentHover}`}
                >
                  {/* Top: Icon + Badge + Texts */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border shadow-2xs group-hover:scale-105 transition-transform ${game.iconBg}`}
                      >
                        {game.icon}
                      </div>
                      <span
                        className={`text-xs font-black px-3 py-1 rounded-full border ${game.badgeClass}`}
                      >
                        {game.badge}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight transition-colors">
                      {game.title}
                    </h2>

                    <p className="text-slate-600 text-sm mt-2 leading-relaxed font-medium">
                      {game.description}
                    </p>
                  </div>

                  {/* Bottom: Stat & 3D Action Button */}
                  <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-black text-amber-950 bg-gradient-to-r from-amber-50 to-orange-50/80 px-3 py-1.5 rounded-xl border border-amber-200/90 shadow-2xs group-hover:border-amber-300 transition-colors">
                      <span className="text-amber-500">🏅</span>
                      <span className="truncate max-w-[190px] sm:max-w-[240px]">{game.stat}</span>
                    </div>

                    <button
                      type="button"
                      className={`inline-flex items-center gap-1.5 text-xs font-black px-4 py-2 rounded-xl border-b-2 transition-all active:translate-y-0.5 shadow-xs ${game.btnClass}`}
                    >
                      <span>{game.cta}</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
