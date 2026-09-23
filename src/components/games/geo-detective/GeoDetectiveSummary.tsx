import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  RotateCcw,
  Share2,
  MapPin,
  ArrowRight,
  Flame,
  Compass,
} from "lucide-react";
import {
  getGeoDetectiveRank,
  getGeoDetectiveHighScore,
  type GeoDetectiveGameState,
} from "../../../lib/geoDetectiveGame";
import { VisualShareModal } from "../../common/VisualShareModal";
import { useAuth } from "../../../contexts/AuthContext";

interface GeoDetectiveSummaryProps {
  gameState: GeoDetectiveGameState;
  onPlayAgain: () => void;
}

export const GeoDetectiveSummary: React.FC<GeoDetectiveSummaryProps> = ({
  gameState,
  onPlayAgain,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showShareModal, setShowShareModal] = useState(false);

  const totalScore = gameState.totalScore;
  const rank = getGeoDetectiveRank(totalScore);
  const highScore = getGeoDetectiveHighScore();
  const isNewRecord = totalScore > 0 && totalScore >= highScore;

  const validGuesses = gameState.rounds
    .map((r) => r.guess)
    .filter((g): g is NonNullable<typeof g> => g !== null);

  const averageDistance =
    validGuesses.length > 0
      ? Math.round(
          validGuesses.reduce((acc, g) => acc + g.distanceKm, 0) /
            validGuesses.length
        )
      : 0;

  const percentScore = Math.round((totalScore / 25000) * 100);

  // Emojis for share
  const emojiGrid = validGuesses
    .map((g) => {
      if (g.score >= 4500) return "🟢";
      if (g.score >= 3000) return "🟡";
      return "🔴";
    })
    .join("");

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 animate-fade-in text-white space-y-6">
      {/* Hero Card */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-emerald-500/30 shadow-2xl relative overflow-hidden text-center">
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span>Mission Satellite Terminée</span>
          </div>

          <div className="text-5xl sm:text-6xl my-2 filter drop-shadow">{rank.icon}</div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            {rank.title}
          </h1>
          <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            {rank.description}
          </p>

          {/* Big Score Counter */}
          <div className="py-4">
            <div className="inline-block p-4 rounded-3xl bg-slate-900/90 border border-emerald-500/40 shadow-inner">
              <span className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 font-mono">
                {totalScore.toLocaleString()}
              </span>
              <span className="text-sm sm:text-base text-slate-400 font-bold block mt-1">
                sur 25 000 points ({percentScore}%)
              </span>
            </div>
            {isNewRecord && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black animate-bounce">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Nouveau Record Personnel Établi !
              </div>
            )}
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Écart Moyen
              </span>
              <p className="text-xl sm:text-2xl font-black text-white">
                {averageDistance.toLocaleString("fr-FR")} km
              </p>
              <span className="text-[10px] text-slate-500">sur 5 manches</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Meilleur Tir
              </span>
              <p className="text-xl sm:text-2xl font-black text-emerald-400">
                {Math.max(...validGuesses.map((g) => g.score), 0).toLocaleString()} pts
              </p>
              <span className="text-[10px] text-slate-500">
                min {Math.min(...validGuesses.map((g) => g.distanceKm), 0).toLocaleString()} km
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Record Absolu
              </span>
              <p className="text-xl sm:text-2xl font-black text-amber-400">
                {highScore.toLocaleString()} pts
              </p>
              <span className="text-[10px] text-slate-500">meilleure session</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rounds Breakdown Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400" />
            Récapitulatif des 5 Localisations Satellites
          </h3>
          <span className="text-xs font-mono text-slate-400">{emojiGrid}</span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {gameState.rounds.map((round) => {
            const guess = round.guess;
            const score = guess?.score || 0;
            const dist = guess?.distanceKm || 0;

            return (
              <div
                key={round.roundNumber}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{round.location.flagEmoji}</span>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">
                      {round.location.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {round.location.country} ({round.location.continent})
                      {round.usedClue && (
                        <span className="text-[10px] text-amber-400 font-mono ml-1">
                          (Indice utilisé)
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 text-right">
                  <div>
                    <span className="text-xs text-slate-400 block">Distance</span>
                    <span className="text-xs font-mono font-bold text-slate-200">
                      {dist.toLocaleString("fr-FR")} km
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block">Score</span>
                    <span className="text-sm font-mono font-black text-emerald-400">
                      +{score.toLocaleString()} pts
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-950/40 transition transform active:scale-98 flex items-center justify-center gap-2.5"
        >
          <Share2 className="w-4 h-4 text-emerald-200" />
          <span>Partager ma Performance 📲</span>
        </button>

        <button
          type="button"
          onClick={onPlayAgain}
          className="py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-sm transition flex items-center justify-center gap-2 border border-slate-700"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Rejouer une Mission 🛰️</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/games")}
          className="py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-sm transition flex items-center justify-center gap-2 border border-slate-800"
        >
          <span>Modes Arcade</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Modal de Partage Visuel */}
      <VisualShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        data={{
          title: "Geo-Detective Satellite",
          subtitle: `Rang : ${rank.title}`,
          playerPseudo:
            user?.user_metadata?.username ||
            user?.user_metadata?.full_name ||
            user?.email?.split("@")[0] ||
            "Geo-Détective",
          playerAvatar: user?.user_metadata?.avatar_url,
          scoreDisplay: `${totalScore.toLocaleString()} pts`,
          accuracyPercent: percentScore,
          timeTakenSeconds: averageDistance,
          emojiGrid,
          url: typeof window !== "undefined" ? window.location.origin : undefined,
        }}
      />
    </div>
  );
};
