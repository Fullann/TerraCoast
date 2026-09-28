import React, { useEffect } from "react";
import { CheckCircle2, XCircle, Trophy, Flame, Users, Sparkles, Skull, Ghost, Tv } from "lucide-react";
import { playCorrectSound, playIncorrectSound } from "../../lib/soundManager";
import type { PartyPlayer, PartyQuestion, PartyRoom } from "./types";

interface PartyRoundRevealProps {
  room: PartyRoom;
  question: PartyQuestion;
  questionIndex: number;
  totalQuestions: number;
  correctAnswer: string;
  answersDistribution: Record<string, number>;
  playerResults: Record<
    string,
    {
      isCorrect: boolean;
      pointsEarned: number;
      totalScore: number;
      streak: number;
    }
  >;
  leaderboard: PartyPlayer[];
  currentPlayer: PartyPlayer;
  eliminatedPlayerIds?: string[];
  onNextQuestion: () => void;
}

export const PartyRoundReveal: React.FC<PartyRoundRevealProps> = ({
  room,
  question,
  questionIndex,
  totalQuestions,
  correctAnswer,
  answersDistribution,
  playerResults,
  leaderboard,
  currentPlayer,
  eliminatedPlayerIds = [],
  onNextQuestion,
}) => {
  const isHost = currentPlayer.isHost;
  const isPresenterMode = Boolean(
    currentPlayer.isSpectator || room.hostIsPlayer === false
  );
  const myResult = playerResults[currentPlayer.guestId];
  const isLastQuestion = questionIndex + 1 >= totalQuestions;
  const competingLeaderboard = leaderboard.filter((p) => !p.isSpectator);

  useEffect(() => {
    if (isPresenterMode) return;
    if (myResult?.isCorrect) {
      playCorrectSound();
    } else if (myResult) {
      playIncorrectSound();
    }
  }, [myResult?.isCorrect, isPresenterMode]);

  // Options to show in the breakdown
  const options = question.options && question.options.length > 0
    ? question.options
    : [correctAnswer];

  const totalAnswered = Object.values(answersDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white flex flex-col justify-between p-4 md:p-8">
      {/* Header */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
        <span className="px-4 py-1.5 rounded-full bg-white/10 text-xs md:text-sm font-semibold border border-white/10">
          Résultats • Question {questionIndex + 1} / {totalQuestions}
        </span>

        {isHost && (
          <button
            type="button"
            onClick={onNextQuestion}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm md:text-base shadow-lg shadow-emerald-500/30 transition transform hover:scale-105 active:scale-95"
          >
            {isLastQuestion ? "Voir le podium 🏆" : "Question suivante ➔"}
          </button>
        )}
      </div>

      {/* Main Grid: Left is Reveal & Distribution, Right is Leaderboard */}
      <div className="max-w-5xl w-full mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-6 py-4">
        {/* Left Column: Result & Breakdown (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Battle Royale Elimination Notice */}
          {room.gameMode === "battle_royale" && eliminatedPlayerIds.length > 0 && (
            <div className="p-4 rounded-3xl bg-gradient-to-r from-red-950/90 to-rose-950/90 border-2 border-rose-500/50 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
                  <Skull className="w-6 h-6 text-rose-400 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-rose-300 uppercase tracking-widest">
                    Mort Subite • Éliminé(s) ce tour
                  </h4>
                  <p className="text-sm font-bold text-white">
                    {eliminatedPlayerIds
                      .map((id) => leaderboard.find((p) => p.guestId === id)?.pseudo || "Joueur")
                      .join(", ")}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-400/30 shrink-0">
                {leaderboard.filter((p) => !p.isEliminated).length} survivants
              </span>
            </div>
          )}

          {/* Ghost Mode banner if current player is eliminated */}
          {currentPlayer.isEliminated && (
            <div className="p-3.5 rounded-2xl bg-purple-950/60 border border-purple-400/30 text-purple-200 text-xs flex items-center gap-3 shadow-lg">
              <Ghost className="w-5 h-5 text-purple-400 shrink-0 animate-pulse" />
              <span>
                Vous avez été éliminé(e) de la course au podium, mais vous continuez en <strong>Mode Spectateur Fantôme 👻</strong> !
              </span>
            </div>
          )}

          {/* Personal Feedback Banner OR Presenter Screen Banner */}
          {isPresenterMode ? (
            <div className="p-5 rounded-3xl bg-indigo-950/80 border-2 border-indigo-400/40 text-indigo-100 flex items-center gap-4 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                <Tv className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <span className="text-base font-extrabold text-white block">
                  📺 Vue Écran de Projection
                </span>
                <span className="text-xs text-indigo-200 font-semibold">
                  Projetez les bonnes réponses et le classement en direct pour vos joueurs !
                </span>
              </div>
            </div>
          ) : myResult ? (
            <div
              className={`p-6 rounded-3xl border shadow-xl flex items-center gap-4 animate-in fade-in zoom-in-95 ${
                myResult.isCorrect
                  ? "bg-gradient-to-r from-emerald-900/60 to-teal-900/60 border-emerald-400/40 text-emerald-200"
                  : "bg-gradient-to-r from-rose-900/60 to-red-900/60 border-rose-400/40 text-rose-200"
              }`}
            >
              {myResult.isCorrect ? (
                <CheckCircle2 className="w-12 h-12 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-12 h-12 text-rose-400 shrink-0" />
              )}

              <div>
                <div className="text-xl font-extrabold text-white">
                  {myResult.isCorrect ? "Bonne réponse ! 🎉" : "Mauvaise réponse... 😢"}
                </div>
                <div className="text-sm font-semibold mt-0.5 flex items-center gap-2">
                  <span>+{myResult.pointsEarned} points</span>
                  {myResult.streak >= 2 && (
                    <span className="flex items-center gap-1 text-amber-300 font-bold">
                      <Flame className="w-4 h-4 fill-current" />
                      Série de {myResult.streak} !
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {/* Correct Answer Highlight */}
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl">
            <span className="text-xs uppercase tracking-wider font-extrabold text-indigo-300">
              Bonne Réponse
            </span>
            <div className="text-xl md:text-2xl font-black text-emerald-400 mt-1 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <span>{correctAnswer}</span>
            </div>

            {/* Answers distribution bars */}
            <div className="space-y-3 mt-4">
              <span className="text-xs font-semibold text-indigo-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Répartition des réponses des joueurs ({totalAnswered})
              </span>
              {options.map((opt, i) => {
                const count = answersDistribution[opt] || 0;
                const pct = totalAnswered > 0 ? Math.round((count / totalAnswered) * 100) : 0;
                const isCorrect = opt.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-white">
                      <span className="truncate max-w-[80%] flex items-center gap-1.5">
                        {isCorrect && <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
                        {opt}
                      </span>
                      <span className="font-mono text-indigo-200">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-700 rounded-full ${
                          isCorrect
                            ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                            : "bg-gradient-to-r from-indigo-500 to-purple-500 opacity-60"
                        }`}
                        style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Leaderboard (5 cols) */}
        <div className="lg:col-span-5 bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-base">Classement provisoire</h3>
            </div>
            <span className="text-xs text-indigo-300">
              {competingLeaderboard.length} joueurs
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[340px] pr-1">
            {competingLeaderboard.map((player, idx) => {
              const isMe = player.guestId === currentPlayer.guestId;
              const medal =
                idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`;

              return (
                <div
                  key={player.guestId}
                  className={`flex items-center justify-between p-3 rounded-2xl transition border ${
                    player.isEliminated
                      ? "bg-rose-950/20 border-rose-900/30 opacity-60"
                      : isMe
                      ? "bg-indigo-500/30 border-amber-400/80 shadow-md"
                      : "bg-white/5 border-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="w-7 text-center font-bold text-sm shrink-0">
                      {player.isEliminated ? "💀" : medal}
                    </span>
                    <span className="text-lg shrink-0">
                      {player.avatarUrl && player.avatarUrl.length <= 4
                        ? player.avatarUrl
                        : "🌍"}
                    </span>
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className={`font-bold text-sm truncate ${
                          player.isEliminated ? "line-through text-gray-400" : "text-white"
                        }`}
                      >
                        {player.pseudo}
                      </span>
                      {isMe && <span className="text-xs text-indigo-300 ml-1 shrink-0">(Vous)</span>}
                      {player.isEliminated && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold uppercase shrink-0">
                          Éliminé
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {player.streak >= 2 && !player.isEliminated && (
                      <span className="flex items-center text-xs text-amber-300 font-bold" title={`Série de ${player.streak}`}>
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        {player.streak}
                      </span>
                    )}
                    <span
                      className={`font-mono font-black text-sm ${
                        player.isEliminated ? "text-gray-500" : "text-amber-300"
                      }`}
                    >
                      {player.score}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer message */}
      <div className="max-w-5xl w-full mx-auto text-center text-xs text-indigo-300/70 pt-4">
        {isHost ? (
          <span className="font-semibold text-emerald-300">
            Cliquez sur « {isLastQuestion ? "Voir le podium" : "Question suivante"} » pour continuer.
          </span>
        ) : (
          <span>En attente de l'hôte pour la question suivante...</span>
        )}
      </div>
    </div>
  );
};
