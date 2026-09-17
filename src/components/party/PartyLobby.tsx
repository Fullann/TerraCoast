import React from "react";
import { Users, Play, Copy, Check, ArrowLeft, Clock, Sparkles } from "lucide-react";
import type { PartyPlayer, PartyRoom } from "./types";
import { PartyQRCode } from "./PartyQRCode";

interface PartyLobbyProps {
  room: PartyRoom;
  players: PartyPlayer[];
  currentPlayer: PartyPlayer;
  onStartGame: () => void;
  onLeave: () => void;
  onSendEmote: (emoji: string) => void;
}

const QUICK_EMOJIS = ["👋", "🔥", "🚀", "🤠", "🌍", "🎉", "⚡"];

export const PartyLobby: React.FC<PartyLobbyProps> = ({
  room,
  players,
  currentPlayer,
  onStartGame,
  onLeave,
  onSendEmote,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignorer
    }
  };

  const isHost = currentPlayer.isHost;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white p-4 md:p-8 flex flex-col justify-between">
      {/* Top Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={onLeave}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition backdrop-blur-sm text-sm font-medium border border-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          Quitter le salon
        </button>

        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-sm font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          Salon en direct
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-6xl w-full mx-auto my-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Room Code & QR Info */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-2xl text-center">
            <span className="text-xs uppercase tracking-widest font-extrabold text-indigo-300">
              Code du Salon
            </span>

            <div className="my-3 flex items-center justify-center gap-3">
              <span className="text-4xl md:text-5xl font-black font-mono tracking-widest text-amber-300 drop-shadow-md">
                {room.code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition border border-white/10"
                title="Copier le code"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Copy className="w-5 h-5 text-indigo-200" />
                )}
              </button>
            </div>

            <p className="text-xs text-indigo-200/80 mb-4">
              Partagez ce code ou faites scanner le QR code pour rejoindre avec un smartphone !
            </p>

            <div className="flex justify-center">
              <PartyQRCode roomCode={room.code} />
            </div>
          </div>

          {/* Quiz summary card */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 text-left">
            <h3 className="text-sm font-semibold text-indigo-200 mb-1">
              Quiz sélectionné
            </h3>
            <p className="text-lg font-bold text-white line-clamp-1">
              {room.quizTitle}
            </p>
            <div className="mt-3 flex items-center gap-4 text-xs text-indigo-200">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                {room.totalQuestions} questions
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                {room.timeLimitSeconds}s par question
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Connected Players */}
        <div className="lg:col-span-2 bg-white/10 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl flex flex-col min-h-[480px]">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500/30 border border-indigo-400/30 text-indigo-300">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  Joueurs connectés ({players.length})
                </h2>
                <p className="text-xs text-indigo-200">
                  Idéalement 4 à 10 joueurs pour une ambiance festive !
                </p>
              </div>
            </div>

            {isHost && (
              <button
                type="button"
                onClick={onStartGame}
                disabled={players.length === 0}
                className="hidden sm:flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-base shadow-lg shadow-emerald-500/30 transition transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                <Play className="w-5 h-5 fill-current" />
                Lancer la partie
              </button>
            )}
          </div>

          {/* Players Grid */}
          <div className="flex-1 my-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 auto-rows-max overflow-y-auto max-h-[360px] p-2">
            {players.map((p) => {
              const isMe = p.guestId === currentPlayer.guestId;
              return (
                <div
                  key={p.guestId}
                  className={`relative p-4 rounded-2xl flex flex-col items-center justify-center text-center transition-all transform animate-in fade-in zoom-in-95 ${
                    isMe
                      ? "bg-gradient-to-b from-indigo-500/40 to-purple-500/40 border-2 border-amber-400/80 shadow-lg shadow-indigo-500/20"
                      : "bg-white/10 border border-white/10 hover:bg-white/15"
                  }`}
                >
                  {p.isHost && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold">
                      Hôte 👑
                    </span>
                  )}

                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-2xl shadow-md mb-2">
                    {p.avatarUrl && p.avatarUrl.length <= 4 ? (
                      p.avatarUrl
                    ) : (
                      "🌍"
                    )}
                  </div>

                  <span className="text-sm font-bold text-white truncate max-w-full">
                    {p.pseudo}
                  </span>

                  {isMe && (
                    <span className="text-[11px] text-indigo-300 font-semibold mt-0.5">
                      (C'est vous)
                    </span>
                  )}
                </div>
              );
            })}

            {players.length === 0 && (
              <div className="col-span-full text-center py-16 text-indigo-300">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-40 animate-pulse" />
                <p className="text-base font-semibold">En attente des premiers joueurs...</p>
                <p className="text-xs opacity-70 mt-1">
                  Entrez le code <span className="font-mono text-amber-300 font-bold">{room.code}</span> pour rejoindre !
                </p>
              </div>
            )}
          </div>

          {/* Bottom Action inside card */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Live Emotes */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-indigo-300 mr-1">Réagir :</span>
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onSendEmote(emoji)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/20 transition active:scale-90 text-lg"
                  title="Envoyer une réaction"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Mobile / Full width launch button */}
            {isHost ? (
              <button
                type="button"
                onClick={onStartGame}
                disabled={players.length === 0}
                className="w-full sm:w-auto flex sm:hidden items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-base shadow-lg shadow-emerald-500/30 disabled:opacity-50"
              >
                <Play className="w-5 h-5 fill-current" />
                Lancer la partie ({players.length})
              </button>
            ) : (
              <div className="text-xs text-indigo-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                En attente du lancement par l'hôte...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="max-w-6xl w-full mx-auto text-center text-xs text-indigo-300/60">
        TerraCoast Live Party • Répondez le plus vite possible pour accumuler un maximum de points !
      </div>
    </div>
  );
};
