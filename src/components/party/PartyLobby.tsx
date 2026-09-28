import React from "react";
import { Users, Play, Copy, Check, ArrowLeft, Clock, Sparkles, Tv, X, Skull } from "lucide-react";
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
  const [projectionMode, setProjectionMode] = React.useState(false);

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
  const isPresenterMode = Boolean(
    currentPlayer.isSpectator || room.hostIsPlayer === false
  );
  const activePlayers = players.filter((p) => !p.isSpectator);
  const joinUrl = typeof window !== "undefined"
    ? `${window.location.origin}/party?code=${encodeURIComponent(room.code)}`
    : `https://terracoast.app/party?code=${encodeURIComponent(room.code)}`;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#46178f] via-[#5c24b8] to-[#2b0863] text-white p-4 md:p-8 flex flex-col justify-between overflow-x-hidden">
      {/* Top Bar */}
      <div className="relative z-10 max-w-6xl w-full mx-auto flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onLeave}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 transition font-bold text-xs sm:text-sm border-2 border-white/20 border-b-4 border-b-black/30 active:translate-y-0.5 active:border-b-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Quitter le salon
        </button>

        <div className="flex items-center gap-2">
          {room.gameMode === "battle_royale" && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500 text-white text-xs md:text-sm font-black shadow-md border-2 border-rose-400 animate-pulse">
              <Skull className="w-4 h-4 text-white" />
              <span>Mort Subite ({room.eliminatedPerRound || 1} éliminé/tour)</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setProjectionMode(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-400 hover:bg-amber-300 border-2 border-amber-300 border-b-4 border-b-amber-600 text-slate-950 text-xs md:text-sm font-black transition shadow-lg active:translate-y-0.5 active:border-b-2"
            title="Affichage optimisé pour vidéoprojecteur / grand écran"
          >
            <Tv className="w-4 h-4" />
            <span className="hidden sm:inline">Grand Écran</span>
          </button>

          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-400 text-slate-950 text-xs sm:text-sm font-black shadow-md border-2 border-emerald-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-700 animate-ping" />
            Salon en direct
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="relative z-10 max-w-6xl w-full mx-auto my-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Room Code & QR Info */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 border-4 border-slate-100 border-b-8 border-b-slate-300 shadow-2xl text-center text-slate-800">
            <span className="text-xs uppercase tracking-widest font-black text-slate-500">
              Code du Salon
            </span>

            <div className="my-3 flex items-center justify-center gap-3">
              <span className="text-4xl md:text-5xl font-black font-mono tracking-widest text-purple-900 drop-shadow-sm">
                {room.code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-3 rounded-2xl bg-purple-100 hover:bg-purple-200 text-purple-900 transition border-2 border-purple-200 active:scale-95 shadow-sm"
                title="Copier le code"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-emerald-600 stroke-[3]" />
                ) : (
                  <Copy className="w-5 h-5 text-purple-800" />
                )}
              </button>
            </div>

            <p className="text-xs text-slate-500 font-semibold mb-4">
              Scannez le QR code ou saisissez le code pour rejoindre avec un smartphone !
            </p>

            <div className="flex justify-center p-3 bg-slate-50 rounded-2xl border-2 border-slate-200 shadow-inner">
              <PartyQRCode roomCode={room.code} />
            </div>
          </div>

          {/* Quiz summary card */}
          <div className="bg-white/95 text-slate-800 rounded-3xl p-5 border-4 border-slate-100 border-b-6 border-b-slate-300 shadow-xl text-left">
            <span className="text-xs font-black uppercase text-purple-700 tracking-wider">
              Quiz sélectionné
            </span>
            <p className="text-lg font-black text-slate-900 line-clamp-1 mt-0.5">
              {room.quizTitle}
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-600 font-bold">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                {room.totalQuestions} questions
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 border border-purple-200">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                {room.timeLimitSeconds}s / question
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Connected Players */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 border-4 border-slate-100 border-b-8 border-b-slate-300 shadow-2xl flex flex-col min-h-[480px] text-slate-800">
          {/* Presenter Notice */}
          {isPresenterMode && (
            <div className="mb-4 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs font-bold flex items-center gap-3 shadow-xs">
              <Tv className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                <strong>Mode Écran de Projection activé :</strong> Cet écran sert d'affichage central pour diffuser les questions et le podium. Vos invités répondent sur leur smartphone !
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pb-4 border-b-2 border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-purple-100 text-purple-700 border-2 border-purple-200">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900">
                  {isPresenterMode
                    ? `Joueurs sur smartphone (${activePlayers.length})`
                    : `Joueurs connectés (${players.length})`}
                </h2>
                <p className="text-xs text-slate-500 font-semibold">
                  Partagez l'écran ou le code PIN pour que vos amis vous rejoignent !
                </p>
              </div>
            </div>

            {isHost && (
              <button
                type="button"
                onClick={onStartGame}
                disabled={isPresenterMode ? activePlayers.length === 0 : players.length === 0}
                className="hidden sm:flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-base shadow-lg shadow-emerald-500/30 transition-all border-b-4 border-b-emerald-700 active:translate-y-0.5 active:border-b-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>
                  {isPresenterMode
                    ? `Lancer (${activePlayers.length} joueur${activePlayers.length > 1 ? "s" : ""})`
                    : `Lancer la partie (${players.length})`}
                </span>
              </button>
            )}
          </div>

          {/* Players Grid */}
          <div className="flex-1 my-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 auto-rows-max overflow-y-auto max-h-[360px] p-1">
            {players.map((p) => {
              const isMe = p.guestId === currentPlayer.guestId;
              return (
                <div
                  key={p.guestId}
                  className={`relative p-4 rounded-2xl flex flex-col items-center justify-center text-center transition-all border-2 border-b-4 ${
                    isMe
                      ? "bg-amber-50 border-amber-400 border-b-amber-500 shadow-md ring-2 ring-purple-600"
                      : "bg-slate-50 border-slate-200 border-b-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {p.isSpectator ? (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black shadow-xs flex items-center gap-1">
                      <Tv className="w-3 h-3" />
                      <span>Écran Hôte</span>
                    </span>
                  ) : p.isHost ? (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black shadow-xs">
                      Hôte 👑
                    </span>
                  ) : null}

                  <div className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-center text-3xl shadow-sm mb-2">
                    {p.avatarUrl && p.avatarUrl.length <= 4 ? (
                      p.avatarUrl
                    ) : (
                      "🌍"
                    )}
                  </div>

                  <span className="text-sm font-black text-slate-900 truncate max-w-full">
                    {p.pseudo}
                  </span>

                  {isMe && (
                    <span className="text-[11px] text-purple-700 font-black mt-0.5">
                      (C'est vous)
                    </span>
                  )}
                </div>
              );
            })}

            {players.length === 0 && (
              <div className="col-span-full text-center py-16 text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-40 animate-pulse text-purple-600" />
                <p className="text-base font-black text-slate-700">En attente des premiers joueurs...</p>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Entrez le code <span className="font-mono text-purple-700 font-black text-sm">{room.code}</span> pour rejoindre !
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
                disabled={isPresenterMode ? activePlayers.length === 0 : players.length === 0}
                className="w-full sm:w-auto flex sm:hidden items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-base shadow-lg shadow-emerald-500/30 disabled:opacity-50"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>
                  {isPresenterMode
                    ? `Lancer (${activePlayers.length} joueur${activePlayers.length > 1 ? "s" : ""})`
                    : `Lancer la partie (${players.length})`}
                </span>
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

      {/* Projection Mode Fullscreen Overlay */}
      {projectionMode && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-6 md:p-10 animate-in fade-in duration-300 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🌍</span>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500">
                  TerraCoast Party • Grand Écran
                </h1>
                <p className="text-xs md:text-sm text-indigo-300">
                  Quiz : <strong className="text-white">{room.quizTitle}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {room.gameMode === "battle_royale" && (
                <span className="px-3.5 py-1.5 rounded-full bg-rose-500/30 border border-rose-400 text-rose-300 text-sm font-bold flex items-center gap-2">
                  <Skull className="w-4 h-4" />
                  Battle Royale (Mort Subite)
                </span>
              )}
              <button
                type="button"
                onClick={() => setProjectionMode(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition border border-white/15"
              >
                <X className="w-5 h-5" />
                <span>Quitter le plein écran</span>
              </button>
            </div>
          </div>

          {/* Main 2-Column Projection Body */}
          <div className="my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-7xl w-full mx-auto">
            {/* Left: Giant QR Code & Direct instructions */}
            <div className="lg:col-span-5 flex flex-col items-center text-center bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl">
              <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-indigo-300 mb-4">
                Scannez pour rejoindre instantanément 📱
              </span>

              <div className="p-4 bg-white rounded-3xl shadow-2xl border-4 border-emerald-400/40 inline-block mb-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(
                    joinUrl
                  )}&bgcolor=ffffff&color=0f172a&margin=2`}
                  alt={`QR code pour ${room.code}`}
                  className="w-56 h-56 sm:w-64 sm:h-64 md:w-80 md:h-80 object-contain rounded-2xl"
                />
              </div>

              <p className="text-sm md:text-base font-semibold text-emerald-300">
                Aucun compte nécessaire • Rejoignez depuis n'importe quel smartphone !
              </p>
              <p className="text-xs text-indigo-300/80 mt-1 font-mono">
                Ou naviguez sur <span className="text-white underline">{joinUrl}</span>
              </p>
            </div>

            {/* Right: Giant PIN & Live Players */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <div className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-2xl text-center">
                <span className="text-xs md:text-sm uppercase tracking-widest font-extrabold text-indigo-300">
                  Code PIN du Salon
                </span>
                <div className="text-5xl sm:text-6xl md:text-7xl font-mono font-black text-amber-300 tracking-wider my-3 drop-shadow-lg">
                  {room.code}
                </div>
                <p className="text-sm text-indigo-200">
                  {room.totalQuestions} questions • {room.timeLimitSeconds}s par question
                </p>
              </div>

              {/* Connected Players in Projector */}
              <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
                  <span className="text-base md:text-lg font-bold flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-300" />
                    Joueurs dans la salle ({players.length})
                  </span>
                  {isHost && (
                    <button
                      type="button"
                      onClick={onStartGame}
                      disabled={players.length === 0}
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-base shadow-xl shadow-emerald-500/30 transition transform hover:scale-105 active:scale-95 disabled:opacity-40"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      Lancer la partie !
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-1">
                  {players.map((p) => (
                    <div
                      key={p.guestId}
                      className="p-3 rounded-2xl bg-white/10 border border-white/10 flex items-center gap-2.5 animate-in fade-in"
                    >
                      <span className="text-2xl">{p.avatarUrl || "🌍"}</span>
                      <span className="font-bold text-sm truncate">{p.pseudo}</span>
                    </div>
                  ))}
                  {players.length === 0 && (
                    <div className="col-span-full text-center py-8 text-indigo-300 text-sm">
                      En attente des premiers joueurs... Scannez le QR Code à gauche !
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer in Projector */}
          <div className="border-t border-white/10 pt-4 flex items-center justify-between text-xs text-indigo-300/60">
            <span>TerraCoast Party • Mode Projection Grand Écran</span>
            {isHost && (
              <span>Prêt ? Appuyez sur « Lancer la partie » dès que tout le monde est connecté !</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
