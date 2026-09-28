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
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border-2 border-slate-200 p-6 text-slate-800 flex flex-col gap-4 shadow-2xl animate-scale-in">
        {/* Header Badge */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-black uppercase tracking-widest text-teal-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Manche {roundNumber} sur {totalRounds}
          </span>

          <span
            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border-2 ${
              isExcellent
                ? "bg-amber-100 text-amber-800 border-amber-300"
                : isGood
                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                : "bg-slate-100 text-slate-700 border-slate-200"
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
        <div className="p-4 rounded-2xl bg-teal-50 border-2 border-teal-200 flex items-center gap-4">
          <span className="text-4xl filter drop-shadow-sm">{location.flagEmoji}</span>
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 truncate">
              {location.name}
            </h3>
            <p className="text-xs text-teal-700 font-bold flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" />
              {location.country} • {location.continent}
            </p>
          </div>
        </div>

        {/* Score & Distance Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-center">
            <span className="text-xs font-black text-slate-500 block mb-1 uppercase tracking-wider">
              SCORE DE LA MANCHE
            </span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600">
              +{guess.score.toLocaleString()}
            </p>
            <span className="text-[10px] text-teal-700 font-bold">/ 5 000 pts</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 text-center">
            <span className="text-xs font-black text-slate-500 block mb-1 uppercase tracking-wider">
              ÉCART DE DISTANCE
            </span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">
              {guess.distanceKm.toLocaleString("fr-FR")} km
            </p>
            <span className="text-[10px] text-slate-500 flex items-center justify-center gap-1 font-bold">
              <Compass className="w-3 h-3 text-cyan-600" />
              {guess.compassArrow} {guess.compassDirection}
            </span>
          </div>
        </div>

        {/* Satellite Fun Fact Callout */}
        <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-start gap-2.5 text-xs text-slate-700">
          <Award className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-black text-amber-800 block mb-0.5">
              Anecdote vue d'en haut :
            </span>
            <p className="leading-relaxed font-medium">{location.funFact}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={onCloseInspect}
            className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs sm:text-sm transition-all border-2 border-slate-200 border-b-4 border-b-slate-300 active:border-b-0 active:translate-y-0.5 flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>Inspecter la carte</span>
          </button>

          <button
            type="button"
            onClick={onNextRound}
            className="flex-1 py-3 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm border-2 border-emerald-600 border-b-4 border-b-emerald-700 active:border-b-0 active:translate-y-1 shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isLastRound ? (
              <>
                <Trophy className="w-4 h-4 text-yellow-200" />
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
  );
};
