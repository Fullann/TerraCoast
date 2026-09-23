import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Users, CheckCircle2, Zap } from "lucide-react";
import { playClickSound, playTickSound } from "../../lib/soundManager";
import type { PartyPlayer, PartyQuestion, PartyRoom, PartyEmote } from "./types";

interface PartyLiveGameProps {
  room: PartyRoom;
  question: PartyQuestion;
  questionIndex: number;
  totalQuestions: number;
  timeLimitSeconds: number;
  questionStartTime: number;
  currentPlayer: PartyPlayer;
  players: PartyPlayer[];
  answeredGuestIds: Set<string>;
  emotes: PartyEmote[];
  onAnswer: (selectedOption: string, timeMs: number) => void;
  onSendEmote: (emoji: string) => void;
  onTimeUp: () => void;
}

const KAHOOT_THEMES = [
  {
    bg: "bg-gradient-to-br from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600",
    border: "border-red-400/40",
    shadow: "shadow-red-600/30",
    shape: "▲",
    kbd: "1",
  },
  {
    bg: "bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600",
    border: "border-blue-400/40",
    shadow: "shadow-blue-600/30",
    shape: "◆",
    kbd: "2",
  },
  {
    bg: "bg-gradient-to-br from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500",
    border: "border-yellow-300/40",
    shadow: "shadow-yellow-500/30",
    shape: "●",
    kbd: "3",
  },
  {
    bg: "bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600",
    border: "border-emerald-400/40",
    shadow: "shadow-emerald-600/30",
    shape: "■",
    kbd: "4",
  },
];

export const PartyLiveGame: React.FC<PartyLiveGameProps> = ({
  room,
  question,
  questionIndex,
  totalQuestions,
  timeLimitSeconds,
  questionStartTime,
  currentPlayer,
  players,
  answeredGuestIds,
  emotes,
  onAnswer,
  onSendEmote,
  onTimeUp,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(timeLimitSeconds * 1000);
  const [answerSubmittedAt, setAnswerSubmittedAt] = useState<number | null>(null);
  const lastSecondTickedRef = useRef<number>(-1);

  const hasAnswered = selectedOption !== null;
  const answeredCount = answeredGuestIds.size;
  const totalPlayersCount = Math.max(players.length, 1);

  // Synchronized countdown timer
  useEffect(() => {
    const totalMs = timeLimitSeconds * 1000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - questionStartTime;
      const remaining = Math.max(0, totalMs - elapsed);
      setTimeLeftMs(remaining);

      const currentSec = Math.ceil(remaining / 1000);
      if (currentSec <= 5 && currentSec > 0 && currentSec !== lastSecondTickedRef.current) {
        lastSecondTickedRef.current = currentSec;
        playTickSound(currentSec <= 2);
      }

      if (remaining <= 0) {
        clearInterval(interval);
        onTimeUp();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [questionStartTime, timeLimitSeconds, onTimeUp]);

  // Options parsing
  const rawOptions = useMemo(() => {
    if (question.options && Array.isArray(question.options) && question.options.length > 0) {
      return question.options;
    }
    if (question.question_type === "true_false") {
      return ["Vrai", "Faux"];
    }
    return [question.correct_answer || "Option 1", "Option 2", "Option 3", "Option 4"];
  }, [question]);

  const handleSelectOption = useCallback(
    (option: string) => {
      if (hasAnswered || timeLeftMs <= 0) return;
      playClickSound();
      const now = Date.now();
      const timeMs = Math.max(100, now - questionStartTime);
      setSelectedOption(option);
      setAnswerSubmittedAt(timeMs);
      onAnswer(option, timeMs);
    },
    [hasAnswered, onAnswer, questionStartTime, timeLeftMs]
  );

  // Keyboard shortcuts (1, 2, 3, 4 or A, B, C, D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (hasAnswered || timeLeftMs <= 0) return;
      const key = e.key.toUpperCase();
      let index = -1;
      if (["1", "2", "3", "4"].includes(key)) {
        index = parseInt(key, 10) - 1;
      } else if (["A", "B", "C", "D"].includes(key)) {
        index = key.charCodeAt(0) - 65;
      }

      if (index >= 0 && index < rawOptions.length) {
        e.preventDefault();
        handleSelectOption(rawOptions[index]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSelectOption, hasAnswered, rawOptions, timeLeftMs]);

  const secondsLeft = Math.ceil(timeLeftMs / 1000);
  const progressRatio = Math.max(0, Math.min(1, timeLeftMs / (timeLimitSeconds * 1000)));

  // Color of timer
  const timerColor =
    progressRatio > 0.4
      ? "text-emerald-400 stroke-emerald-400"
      : progressRatio > 0.15
      ? "text-amber-400 stroke-amber-400"
      : "text-red-500 stroke-red-500 animate-pulse";

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white flex flex-col justify-between p-4 md:p-8 overflow-hidden select-none">
      {/* Floating Emotes layer */}
      <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
        {emotes.map((em) => (
          <div
            key={em.id}
            className="absolute bottom-16 text-3xl animate-bounce"
            style={{
              left: `${(em.createdAt % 80) + 10}%`,
              transition: "transform 2s ease-out, opacity 2s ease-out",
            }}
          >
            {em.emoji}
          </div>
        ))}
      </div>

      {/* Top Bar: Progress, Timer, Answer counter */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between gap-4">
        {/* Question Counter */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-xs md:text-sm font-bold border border-white/10">
            Question {questionIndex + 1} / {totalQuestions}
          </span>
          <span className="text-xs text-indigo-300 font-mono hidden sm:inline">
            {room.code}
          </span>
        </div>

        {/* Circular Synchronized Timer */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <svg className="w-14 h-14 md:w-16 md:h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="5"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                className={`transition-all duration-100 ease-linear ${timerColor}`}
                strokeWidth="5"
                strokeDasharray="163"
                strokeDashoffset={163 * (1 - progressRatio)}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <span
              className={`absolute font-black text-lg md:text-xl font-mono ${
                secondsLeft <= 3 ? "text-red-400 scale-110" : "text-white"
              }`}
            >
              {secondsLeft}
            </span>
          </div>
        </div>

        {/* Answers Counter */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-xs md:text-sm font-semibold border border-white/10">
          <Users className="w-4 h-4 text-cyan-400" />
          <span>
            {answeredCount} / {totalPlayersCount}
          </span>
        </div>
      </div>

      {/* Center: Question Text & Image */}
      <div className="max-w-4xl w-full mx-auto my-auto py-4 flex flex-col items-center text-center">
        {/* Optional Question Image */}
        {question.image_url && (
          <div className="mb-4 max-h-48 md:max-h-64 w-full flex justify-center">
            <img
              src={question.image_url}
              alt="Question illustration"
              className="max-h-48 md:max-h-64 rounded-2xl object-contain shadow-2xl border border-white/10"
            />
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl w-full">
          <h1 className="text-xl md:text-3xl font-black text-white tracking-wide leading-snug">
            {question.question_text}
          </h1>
        </div>

        {/* Confirmation banner when answered */}
        {hasAnswered && (
          <div className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-sm font-bold shadow-lg animate-in fade-in zoom-in-95">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Réponse envoyée en {((answerSubmittedAt || 0) / 1000).toFixed(1)}s ! En attente des autres joueurs...
          </div>
        )}
      </div>

      {/* Bottom: 4 Kahoot-Style Answer Cards */}
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 my-2">
        {rawOptions.map((opt, idx) => {
          const theme = KAHOOT_THEMES[idx % KAHOOT_THEMES.length];
          const isSelected = selectedOption === opt;
          const isOther = hasAnswered && !isSelected;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectOption(opt)}
              disabled={hasAnswered || timeLeftMs <= 0}
              className={`relative group flex items-center justify-between p-4 md:p-6 rounded-2xl text-left font-bold text-white transition-all transform active:scale-95 shadow-xl border ${
                theme.bg
              } ${theme.border} ${theme.shadow} ${
                isSelected
                  ? "ring-4 ring-white scale-[1.02] shadow-2xl"
                  : isOther
                  ? "opacity-35 grayscale"
                  : "hover:scale-[1.01]"
              } disabled:cursor-not-allowed`}
            >
              <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                <span className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-black/20 flex items-center justify-center text-xl md:text-2xl shrink-0 font-mono shadow-inner">
                  {theme.shape}
                </span>
                <span className="text-base md:text-xl line-clamp-2 leading-tight">
                  {opt}
                </span>
              </div>

              {/* Keyboard badge */}
              <span className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg bg-white/20 text-white/90 text-xs font-mono shrink-0 ml-2">
                {theme.kbd}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer Emotes bar for players */}
      <div className="max-w-5xl w-full mx-auto mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs text-indigo-300">
        <div className="flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Réagir :</span>
          {["🔥", "👏", "🚀", "😱", "🤯"].map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onSendEmote(emoji)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/20 transition active:scale-90 text-base"
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span>{currentPlayer.pseudo}</span>
          <span className="font-mono text-amber-300 font-bold">
            {currentPlayer.score} pts
          </span>
        </div>
      </div>
    </div>
  );
};
