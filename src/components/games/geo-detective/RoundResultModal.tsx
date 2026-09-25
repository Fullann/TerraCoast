import React from "react";
import {
  Sparkles,
  MapPin,
  ArrowRight,
  Compass,
  Trophy,
  Award,
  Eye,
} from "lucide-react";
import type { SatelliteLocation, GeoDetectiveGuess } from "../../../lib/geoDetectiveData";

interface RoundResultModalProps {
  roundNumber: number;
  totalRounds: number;
  location: SatelliteLocation;
  guess: GeoDetectiveGuess;
  isOpen: boolean;
  onNextRound: () => void;
  onCloseInspect: () => void;
}

export const RoundResultModal: React.FC<RoundResultModalProps> = ({
  roundNumber,
  totalRounds,
  location,
  guess,
  isOpen,
  onNextRound,
  onCloseInspect,
}) => {
  if (!isOpen) return null;

  const isLastRound = roundNumber >= totalRounds;
  const isExcellent = guess.score >= 4500;
  const isGood = guess.score >= 3500;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl p-1 bg-gradient-to-b from-emerald-500 via-teal-600 to-slate-800 shadow-2xl animate-scale-in">
        <div className="rounded-[22px] bg-slate-950 p-6 text-white flex flex-col gap-4 shadow-2xl">
          {/* Header Badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Manche {roundNumber} sur {totalRounds}
            </span>

            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                isExcellent
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : isGood
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-slate-800 text-slate-300 border border-slate-700"
              }`}
            >
              {isExcellent
                ? "🎯 Tir Chirurgical !"
                : isGood
                ? "👏 Très Bien Vu !"
                : "📍 Détection Enregistrée"}
            </span>
          </div>

          {/* Location Reveal Hero */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/60 border border-slate-800 flex items-center gap-4">
            <span className="text-4xl filter drop-shadow">{location.flagEmoji}</span>
            <div className="min-w-0">
              <h3 className="text-lg sm:text-xl font-black text-white truncate">
                {location.name}
              </h3>
              <p className="text-xs text-emerald-300 font-semibold flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />
                {location.country} • {location.continent}
              </p>
            </div>
          </div>

          {/* Score & Distance Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 text-center">
              <span className="text-xs font-bold text-slate-400 block mb-1">
                SCORE DE LA MANCHE
              </span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-400">
                +{guess.score.toLocaleString()}
              </p>
              <span className="text-[10px] text-emerald-300/80 font-mono">/ 5 000 pts</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
              <span className="text-xs font-bold text-slate-400 block mb-1">
                ÉCART DE DISTANCE
              </span>
              <p className="text-2xl sm:text-3xl font-black text-white">
                {guess.distanceKm.toLocaleString("fr-FR")} km
              </p>
              <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                <Compass className="w-3 h-3 text-cyan-400" />
                {guess.compassArrow} {guess.compassDirection}
              </span>
            </div>
          </div>

          {/* Satellite Fun Fact Callout */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
            <Award className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-200 block mb-0.5">
                Anecdote vue d'en haut :
              </span>
              <p className="leading-relaxed">{location.funFact}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              type="button"
              onClick={onCloseInspect}
              className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 border border-slate-800"
            >
              <Eye className="w-4 h-4 text-slate-400" />
              <span>Inspecter la carte</span>
            </button>

            <button
              type="button"
              onClick={onNextRound}
              className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-900/40 transition transform active:scale-98 flex items-center justify-center gap-2"
            >
              {isLastRound ? (
                <>
                  <Trophy className="w-4 h-4 text-yellow-300" />
                  <span>Voir le Bilan Final (25 000 pts) 🏆</span>
                </>
              ) : (
                <>
                  <span>Manche Suivante ({roundNumber + 1}/{totalRounds})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
