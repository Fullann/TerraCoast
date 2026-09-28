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
    <div className="w-full max-w-4xl mx-auto px-4 py-8 animate-fade-in text-slate-800 space-y-6">
      {/* Hero Card */}
      <div className="rounded-3xl p-6 sm:p-8 bg-white border-2 border-slate-200 shadow-xs relative overflow-hidden text-center">
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border-2 border-emerald-200 text-xs font-mono font-black uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Mission Satellite Terminée</span>
          </div>

          <div className="text-5xl sm:text-6xl my-2 filter drop-shadow-sm">{rank.icon}</div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900">
            {rank.title}
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed font-medium">
            {rank.description}
          </p>

          {/* Big Score Counter */}
          <div className="py-4">
            <div className="inline-block p-5 rounded-3xl bg-slate-50 border-2 border-slate-200 shadow-xs">
              <span className="text-4xl sm:text-6xl font-black text-emerald-600 font-mono">
                {totalScore.toLocaleString()}
              </span>
              <span className="text-sm sm:text-base text-slate-500 font-black block mt-1">
                sur 25 000 points ({percentScore}%)
              </span>
            </div>
            {isNewRecord && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-50 border-2 border-amber-200 text-amber-800 text-xs font-black animate-bounce">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                Nouveau Record Personnel Établi !
              </div>
            )}
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                Écart Moyen
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-900">
                {averageDistance.toLocaleString("fr-FR")} km
              </p>
              <span className="text-[10px] text-slate-500 font-semibold">sur 5 manches</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                Meilleur Tir
              </span>
              <p className="text-xl sm:text-2xl font-black text-emerald-600">
                {Math.max(...validGuesses.map((g) => g.score), 0).toLocaleString()} pts
              </p>
              <span className="text-[10px] text-slate-500 font-semibold">
                min {Math.min(...validGuesses.map((g) => g.distanceKm), 0).toLocaleString()} km
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 col-span-2 sm:col-span-1">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                Record Absolu
              </span>
              <p className="text-xl sm:text-2xl font-black text-amber-600">
                {highScore.toLocaleString()} pts
              </p>
              <span className="text-[10px] text-slate-500 font-semibold">meilleure session</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rounds Breakdown Table */}
      <div className="rounded-3xl bg-white border-2 border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b-2 border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Compass className="w-4 h-4 text-teal-600" />
            Récapitulatif des 5 Localisations Satellites
          </h3>
          <span className="text-xs font-mono text-slate-500">{emojiGrid}</span>
        </div>

        <div className="divide-y divide-slate-100">
          {gameState.rounds.map((round) => {
            const guess = round.guess;
            const score = guess?.score || 0;
            const dist = guess?.distanceKm || 0;

            return (
              <div
                key={round.roundNumber}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{round.location.flagEmoji}</span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 leading-tight">
                      {round.location.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 font-medium">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {round.location.country} ({round.location.continent})
                      {round.usedClue && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-mono ml-1 font-bold">
                          Indice utilisé
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 text-right">
                  <div>
                    <span className="text-xs text-slate-400 block font-semibold">Distance</span>
                    <span className="text-xs font-mono font-black text-slate-700">
                      {dist.toLocaleString("fr-FR")} km
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block font-semibold">Score</span>
                    <span className="text-sm font-mono font-black text-emerald-600">
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
          className="flex-1 py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm border-2 border-emerald-600 border-b-4 border-b-emerald-700 active:border-b-0 active:translate-y-1 shadow-md transition-all flex items-center justify-center gap-2.5"
        >
          <Share2 className="w-4 h-4 text-emerald-100" />
          <span>Partager ma Performance 📲</span>
        </button>

        <button
          type="button"
          onClick={onPlayAgain}
          className="py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm border-2 border-indigo-600 border-b-4 border-b-indigo-800 active:border-b-0 active:translate-y-1 shadow-md transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Rejouer une Mission 🛰️</span>
        </button>

        <button
          type="button"
          onClick={() => navigate("/games")}
          className="py-3.5 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm border-2 border-slate-200 border-b-4 border-b-slate-300 active:border-b-0 active:translate-y-0.5 shadow-xs transition-all flex items-center justify-center gap-2"
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
