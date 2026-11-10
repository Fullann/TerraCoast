import { useState } from "react";
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
  Puzzle,
  Clock,
  Swords,
  Users,
  BookOpen,
  Dumbbell,
  Compass,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { getAllGamePersonalRecords } from "../../lib/gameRecordsManager";
import { DailyMissionsCard } from "../missions/DailyMissionsCard";

export function GamesHubPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const records = getAllGamePersonalRecords(user?.id || null);
  const [activeTab, setActiveTab] = useState<"all" | "arcade" | "solo" | "multi">("all");

  const gameModes = [
    // ⚔️ MULTIJOUEUR & COMPÉTITION
    {
      id: "duels",
      category: "multi",
      title: "Duels 1v1 Classés & Amis",
      badge: "Compétition ⚔️",
      badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
      iconBg: "bg-rose-50 border-rose-200 text-rose-600",
      accentHover: "hover:border-rose-500 group-hover:text-rose-700",
      btnClass: "bg-rose-600 hover:bg-rose-700 border-rose-800 text-white",
      icon: "⚔️",
      description:
        "Défiez vos amis ou des joueurs en ligne dans des affrontements au tour par tour ou en direct. Gagnez des points ELO et montez au classement !",
      path: "/duels",
      cta: "Lancer un duel",
      stat: "Matchmaking & Classement ELO",
      statIcon: Swords,
    },
    {
      id: "party",
      category: "multi",
      title: "Salons Party Multijoueur",
      badge: "En Groupe 🎉",
      badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
      iconBg: "bg-purple-50 border-purple-200 text-purple-600",
      accentHover: "hover:border-purple-500 group-hover:text-purple-700",
      btnClass: "bg-purple-600 hover:bg-purple-700 border-purple-800 text-white",
      icon: "🎉",
      description:
        "Créez une partie en direct sur grand écran ou rejoignez avec un simple code PIN sur smartphone. Idéal pour jouer en famille ou en classe !",
      path: "/party",
      cta: "Rejoindre un salon",
      stat: "Code PIN instantané",
      statIcon: Users,
    },
    {
      id: "leaderboard",
      category: "multi",
      title: "Championnat des Ligues",
      badge: "Hebdomadaire 🏆",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
      iconBg: "bg-amber-50 border-amber-200 text-amber-600",
      accentHover: "hover:border-amber-500 group-hover:text-amber-700",
      btnClass: "bg-amber-500 hover:bg-amber-600 border-amber-700 text-white",
      icon: "🏆",
      description:
        "Affrontez 30 explorateurs chaque semaine. Les meilleurs sont promus dans la ligue supérieure (Bronze, Argent, Or, Saphir, Rubis, Diamant) !",
      path: "/leaderboard",
      cta: "Voir le classement",
      stat: "Saison en direct",
      statIcon: Trophy,
    },

    // 🧭 AVENTURE & PROGRESSION (SOLO)
    {
      id: "parcours",
      category: "solo",
      title: "Parcours d'Apprentissage",
      badge: "Aventure 🌟",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
      iconBg: "bg-emerald-50 border-emerald-200 text-emerald-600",
      accentHover: "hover:border-emerald-500 group-hover:text-emerald-700",
      btnClass: "bg-emerald-600 hover:bg-emerald-700 border-emerald-800 text-white",
      icon: "🗺️",
      description:
        "Progressez étape par étape sur la carte d'aventure interactive. Débloquez des coffres, remportez des gemmes et validez vos séries de jours !",
      path: "/terra",
      cta: "Continuer l'aventure",
      stat: "Niveaux & Coffres",
      statIcon: Compass,
    },
    {
      id: "quizzes-catalog",
      category: "solo",
      title: "Catalogue des 200+ Quiz",
      badge: "Bibliothèque 📚",
      badgeClass: "bg-sky-100 text-sky-800 border-sky-200",
      iconBg: "bg-sky-50 border-sky-200 text-sky-600",
      accentHover: "hover:border-sky-500 group-hover:text-sky-700",
      btnClass: "bg-sky-600 hover:bg-sky-700 border-sky-800 text-white",
      icon: "📚",
      description:
        "Explorez la totalité des quiz classés par continent (Europe, Asie, Afrique, Amériques, Océanie) et par thème (Drapeaux, Capitales, Cartes).",
      path: "/quizzes",
      cta: "Explorer les quiz",
      stat: "200+ quiz disponibles",
      statIcon: BookOpen,
    },
    {
      id: "training",
      category: "solo",
      title: "Mode Entraînement Libre",
      badge: "Zen 🧘",
      badgeClass: "bg-teal-100 text-teal-800 border-teal-200",
      iconBg: "bg-teal-50 border-teal-200 text-teal-600",
      accentHover: "hover:border-teal-500 group-hover:text-teal-700",
      btnClass: "bg-teal-600 hover:bg-teal-700 border-teal-800 text-white",
      icon: "🏋️",
      description:
        "Apprenez sans stress : pas de chronomètre, explications détaillées après chaque question, réessayez autant de fois que vous le souhaitez.",
      path: "/quizzes/training",
      cta: "S'entraîner sans limite",
      stat: "Sans timer ni pénalité",
      statIcon: Dumbbell,
    },
    {
      id: "srs",
      category: "solo",
      title: "Carnet de Révision SRS",
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

    // 🎮 MINI-JEUX & DÉFIS INSTANTANÉS (ARCADE)
    {
      id: "geo-detective",
      category: "arcade",
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
      category: "arcade",
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
      category: "arcade",
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
      category: "arcade",
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
      category: "arcade",
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
      category: "arcade",
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
      category: "arcade",
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
      id: "border-puzzle",
      category: "arcade",
      title: "Border Puzzle : Tangram Frontalier",
      badge: "Nouveau • Puzzle 🧩",
      badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
      iconBg: "bg-purple-50 border-purple-200 text-purple-600",
      accentHover: "hover:border-purple-500 group-hover:text-purple-700",
      btnClass: "bg-purple-600 hover:bg-purple-700 border-purple-800 text-white",
      icon: "🧩",
      description:
        "3 ou 4 pays limitrophes détachés sous forme de pièces vectorielles TopoJSON. Glissez-les et assemblez-les comme un puzzle sur le socle !",
      path: "/games/border-puzzle",
      cta: "Assembler le puzzle",
      stat: records.borderPuzzle.display,
      statIcon: Puzzle,
    },
    {
      id: "time-guessr",
      category: "arcade",
      title: "TimeGuessr Géo-Historique",
      badge: "Nouveau • Où & Quand ⏳",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
      iconBg: "bg-amber-50 border-amber-200 text-amber-600",
      accentHover: "hover:border-amber-500 group-hover:text-amber-700",
      btnClass: "bg-amber-600 hover:bg-amber-700 border-amber-800 text-white",
      icon: "⏳",
      description:
        "Une photo d'archive ou un monument historique. Pointez le lieu exact sur la mappemonde et ajustez l'année sur la frise (1850-2024) !",
      path: "/games/time-guessr",
      cta: "Explorer l'Histoire",
      stat: records.timeGuessr.display,
      statIcon: Clock,
    },
    {
      id: "city-guesser",
      category: "arcade",
      title: "City Guesser / Satellite Zoom-In",
      badge: "Nouveau • Buzz Rapide 🛰️",
      badgeClass: "bg-sky-100 text-sky-800 border-sky-200",
      iconBg: "bg-sky-50 border-sky-200 text-sky-600",
      accentHover: "hover:border-sky-500 group-hover:text-sky-700",
      btnClass: "bg-sky-600 hover:bg-sky-700 border-sky-800 text-white",
      icon: "🛰️",
      description:
        "Plongez depuis l'orbite géostationnaire (25 000 km) vers une métropole mondiale. Plus vous buzzez tôt en haute altitude, plus vous scorez !",
      path: "/games/city-guesser",
      cta: "Buzzer en orbite",
      stat: records.cityGuesser.display,
      statIcon: Crosshair,
    },
  ];

  const filteredModes = activeTab === "all"
    ? gameModes
    : gameModes.filter((g) => g.category === activeTab);

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

        {/* 🎯 Missions du Jour dans l'Arcade */}
        <section>
          <DailyMissionsCard />
        </section>

        {/* 🧭 Sélecteur d'intention de jeu : 3 Piliers clairs */}
        <section className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all shrink-0 flex items-center gap-2 border-2 ${
              activeTab === "all"
                ? "bg-slate-900 text-white border-slate-900 shadow-md"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            <span>🌟</span>
            <span>Tous les modes ({gameModes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("arcade")}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all shrink-0 flex items-center gap-2 border-2 ${
              activeTab === "arcade"
                ? "bg-amber-500 text-white border-amber-600 shadow-md"
                : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
            }`}
          >
            <span>🎮</span>
            <span>Mini-Jeux & Réflexes (10)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("solo")}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all shrink-0 flex items-center gap-2 border-2 ${
              activeTab === "solo"
                ? "bg-emerald-600 text-white border-emerald-700 shadow-md"
                : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
            }`}
          >
            <span>🧭</span>
            <span>Solo & Progression (4)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("multi")}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all shrink-0 flex items-center gap-2 border-2 ${
              activeTab === "multi"
                ? "bg-rose-600 text-white border-rose-700 shadow-md"
                : "bg-white text-slate-600 border-slate-200 hover:border-rose-300"
            }`}
          >
            <span>⚔️</span>
            <span>Multijoueur & Duels (3)</span>
          </button>
        </section>

        {/* Grid of Game Cards */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {filteredModes.map((game) => {
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
