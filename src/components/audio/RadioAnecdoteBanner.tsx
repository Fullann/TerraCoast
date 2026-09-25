import React, { useEffect, useState } from "react";
import { Mic, X, Volume2 } from "lucide-react";
import { useRadioGlobe } from "../../contexts/RadioGlobeContext";

export const RadioAnecdoteBanner: React.FC = () => {
  const { isSpeakingAnecdote, currentAnecdote, skipAnecdote } = useRadioGlobe();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isSpeakingAnecdote || !currentAnecdote) {
      setProgress(0);
      return;
    }

    const durationMs = (currentAnecdote.durationSeconds || 10) * 1000;
    const intervalTime = 50;
    const step = (intervalTime / durationMs) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isSpeakingAnecdote, currentAnecdote]);

  if (!isSpeakingAnecdote || !currentAnecdote) return null;

  return (
    <aside
      role="status"
      aria-label="Capsule sonore culturelle"
      className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-slide-up"
    >
      <div className="relative overflow-hidden rounded-2xl bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 shadow-2xl p-4 text-white">
        {/* Animated Background Glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 animate-pulse">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base">{currentAnecdote.flag}</span>
                <span className="text-xs font-black text-white">
                  {currentAnecdote.countryName}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  10s Audio
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={skipAnecdote}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            title="Passer l'anecdote"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Text */}
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
          {currentAnecdote.text}
        </p>

        {/* Progress Bar & Audio Ducking Indicator */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-75 rounded-full"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono">
            <Volume2 className="w-3 h-3 animate-pulse" />
            <span>Ducking</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
