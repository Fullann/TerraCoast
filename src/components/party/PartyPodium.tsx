import React, { useEffect } from "react";
import { Trophy, Crown, ArrowLeft, RefreshCw, Sparkles } from "lucide-react";
import { playVictoryFanfare } from "../../lib/soundManager";
import { triggerConfetti } from "../common/Confetti";
import type { PartyPlayer, PartyRoom } from "./types";

interface PartyPodiumProps {
  room: PartyRoom;
  podium: PartyPlayer[];
  currentPlayer: PartyPlayer;
  onReplay: () => void;
  onLeave: () => void;
}

export const PartyPodium: React.FC<PartyPodiumProps> = ({
  room,
  podium,
  currentPlayer,
  onReplay,
  onLeave,
}) => {
  useEffect(() => {
    playVictoryFanfare();
    triggerConfetti();
  }, []);

  const isHost = currentPlayer.isHost;

  const first = podium[0];
  const second = podium[1];
  const third = podium[2];
  const others = podium.slice(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white flex flex-col justify-between p-4 md:p-8 overflow-y-auto">
      {/* Top Bar */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={onLeave}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-sm font-medium border border-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          Quitter
        </button>

        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-sm font-bold">
          <Trophy className="w-4 h-4 text-amber-400" />
          Podium Final
        </div>
      </div>

      {/* Center: The Grand Podium */}
      <div className="max-w-4xl w-full mx-auto my-auto py-6 flex flex-col items-center">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Partie terminée sur « {room.quizTitle} »
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 tracking-tight">
            Félicitations aux champions ! 🏆
          </h1>
        </div>

        {/* 3D-Style Podium Blocks */}
        <div className="w-full max-w-2xl grid grid-cols-3 gap-2 md:gap-4 items-end justify-center pt-8 pb-4">
          {/* 2nd Place (Silver) */}
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            {second ? (
              <>
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center text-2xl md:text-3xl shadow-lg border-2 border-slate-300 mb-2">
                  {second.avatarUrl && second.avatarUrl.length <= 4 ? second.avatarUrl : "🥈"}
                </div>
                <span className="text-xs md:text-sm font-bold text-white truncate max-w-full text-center">
                  {second.pseudo}
                </span>
                <span className="text-xs font-mono font-black text-slate-300 mb-2">
                  {second.score} pts
                </span>
                <div className="w-full h-32 md:h-40 rounded-t-2xl bg-gradient-to-t from-slate-800 to-slate-600/80 border-t-4 border-slate-300 flex flex-col items-center justify-center shadow-xl">
                  <span className="text-3xl md:text-4xl font-black text-slate-300">2</span>
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">Argent</span>
                </div>
              </>
            ) : (
              <div className="w-full h-24 rounded-t-2xl bg-white/5 border-t-2 border-white/10" />
            )}
          </div>

          {/* 1st Place (Gold) */}
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-12 duration-1000">
            {first ? (
              <>
                <Crown className="w-8 h-8 md:w-10 md:h-10 text-amber-400 animate-bounce mb-1" />
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-3xl md:text-4xl shadow-2xl border-2 border-amber-300 mb-2 ring-4 ring-amber-400/30">
                  {first.avatarUrl && first.avatarUrl.length <= 4 ? first.avatarUrl : "👑"}
                </div>
                <span className="text-sm md:text-base font-extrabold text-white truncate max-w-full text-center">
                  {first.pseudo}
                </span>
                <span className="text-xs md:text-sm font-mono font-black text-amber-300 mb-2">
                  {first.score} pts
                </span>
                <div className="w-full h-44 md:h-56 rounded-t-2xl bg-gradient-to-t from-amber-900/90 via-yellow-700/80 to-amber-500/90 border-t-4 border-amber-300 flex flex-col items-center justify-center shadow-2xl shadow-amber-500/20">
                  <span className="text-4xl md:text-5xl font-black text-amber-100">1</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-200">Or 👑</span>
                </div>
              </>
            ) : null}
          </div>

          {/* 3rd Place (Bronze) */}
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-6 duration-500">
            {third ? (
              <>
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center text-2xl md:text-3xl shadow-lg border-2 border-amber-600 mb-2">
                  {third.avatarUrl && third.avatarUrl.length <= 4 ? third.avatarUrl : "🥉"}
                </div>
                <span className="text-xs md:text-sm font-bold text-white truncate max-w-full text-center">
                  {third.pseudo}
                </span>
                <span className="text-xs font-mono font-black text-amber-500 mb-2">
                  {third.score} pts
                </span>
                <div className="w-full h-24 md:h-32 rounded-t-2xl bg-gradient-to-t from-amber-950 to-amber-800/80 border-t-4 border-amber-600 flex flex-col items-center justify-center shadow-lg">
                  <span className="text-2xl md:text-3xl font-black text-amber-400">3</span>
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-amber-600">Bronze</span>
                </div>
              </>
            ) : (
              <div className="w-full h-16 rounded-t-2xl bg-white/5 border-t-2 border-white/10" />
            )}
          </div>
        </div>

        {/* Remaining Players List (Rank 4+) */}
        {others.length > 0 && (
          <div className="w-full max-w-md mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-3">
              Autres participants
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {others.map((player, idx) => (
                <div
                  key={player.guestId}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 text-xs text-indigo-300 font-bold">
                      {idx + 4}.
                    </span>
                    <span>{player.pseudo}</span>
                  </div>
                  <span className="font-mono font-bold text-amber-300">
                    {player.score} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="max-w-xl w-full mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 py-4">
        {isHost ? (
          <button
            type="button"
            onClick={onReplay}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-base shadow-xl shadow-emerald-500/30 transition transform hover:scale-105 active:scale-95"
          >
            <RefreshCw className="w-5 h-5" />
            Rejouer dans ce salon
          </button>
        ) : (
          <div className="text-xs text-indigo-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Merci d'avoir joué ! L'hôte peut relancer une partie.
          </div>
        )}

        <button
          type="button"
          onClick={onLeave}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
};
