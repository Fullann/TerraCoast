import React, { useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Headphones,
  Mic,
} from "lucide-react";
import { useRadioGlobe } from "../../contexts/RadioGlobeContext";
import {
  CURATED_RADIO_STATIONS,
  SOUNDSCAPES,
  type SoundscapeId,
} from "../../lib/radioGlobeData";

export const RadioGlobeFloatingPlayer: React.FC = () => {
  const {
    isPlaying,
    isMuted,
    volume,
    mode,
    currentStation,
    currentSoundscape,
    currentCountry,
    anecdotesEnabled,
    play,
    togglePlay,
    setMode,
    setVolume,
    toggleMute,
    setStation,
    setSoundscape,
    toggleAnecdotesEnabled,
  } = useRadioGlobe();

  const [isExpanded, setIsExpanded] = useState(false);

  // Égaliseur animé néon
  const renderEqualizer = (active: boolean) => (
    <div className="flex items-end gap-0.5 h-3.5 px-1">
      <span
        className={`w-0.5 bg-emerald-400 rounded-full transition-all duration-300 ${
          active ? "h-3 animate-pulse" : "h-1 opacity-40"
        }`}
      />
      <span
        className={`w-0.5 bg-cyan-400 rounded-full transition-all duration-300 ${
          active ? "h-3.5 animate-bounce" : "h-1.5 opacity-40"
        }`}
        style={{ animationDelay: "150ms" }}
      />
      <span
        className={`w-0.5 bg-emerald-300 rounded-full transition-all duration-300 ${
          active ? "h-2 animate-pulse" : "h-1 opacity-40"
        }`}
        style={{ animationDelay: "300ms" }}
      />
    </div>
  );

  return (
    <>
      {/* 1. Pilule Flottante Compacte (Toujours visible au premier plan) */}
      <div className="fixed bottom-4 right-4 z-40">
        {!isExpanded && (
          <div
            onClick={() => setIsExpanded(true)}
            className="group flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 shadow-2xl backdrop-blur-md cursor-pointer transition-all duration-300 hover:scale-105"
            title="Ouvrir Radio Globe & Ambiances"
          >
            {/* Country Flag & Equalizer */}
            <div className="flex items-center gap-1.5">
              <span className="text-lg filter drop-shadow">
                {currentCountry?.flag || "🌍"}
              </span>
              {renderEqualizer(isPlaying)}
            </div>

            {/* Station Title */}
            <div className="hidden sm:flex flex-col text-left max-w-[130px]">
              <span className="text-xs font-black text-white truncate leading-tight">
                {mode === "radio" ? currentStation.name : currentSoundscape.name}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                {mode === "radio" ? "Radio FM" : "Ambiance"}
              </span>
            </div>

            {/* Play/Pause Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="p-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-md"
              title={isPlaying ? "Mettre en pause" : "Écouter"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>

            {/* Expand Icon */}
            <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition" />
          </div>
        )}
      </div>

      {/* 2. Modal / Panneau de Contrôle Étendu */}
      {isExpanded && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-4 sm:right-4 z-50 flex items-end sm:items-auto justify-center p-3 sm:p-0">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs sm:hidden"
            onClick={() => setIsExpanded(false)}
          />

          <div className="relative w-full max-w-md bg-slate-950 border border-slate-800/90 rounded-3xl p-5 shadow-2xl backdrop-blur-xl text-slate-100 animate-slide-up flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    Radio Globe & Ambiances
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Live
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Immersion culturelle & sonore</p>
                </div>
              </div>

              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Currently Playing Card */}
            <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl filter drop-shadow-md">
                    {currentCountry?.flag || "🌍"}
                  </span>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      {currentCountry?.name || "Monde"}
                    </span>
                    <h4 className="text-sm font-black text-white leading-tight">
                      {mode === "radio" ? currentStation.name : currentSoundscape.name}
                    </h4>
                  </div>
                </div>

                <div className="px-2 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-[10px] font-mono text-slate-300">
                  {mode === "radio" ? currentStation.genre : currentSoundscape.region}
                </div>
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mt-1">
                {mode === "radio" ? currentStation.description : currentSoundscape.description}
              </p>
            </div>

            {/* Mode Switcher: Radio FM vs Soundscape */}
            <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => setMode("radio")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  mode === "radio"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Radio FM Direct</span>
              </button>

              <button
                onClick={() => setMode("soundscape")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  mode === "soundscape"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ambiance Naturelle</span>
              </button>
            </div>

            {/* Playback Controls & Volume Slider */}
            <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-2xl border border-slate-800/80">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="w-11 h-11 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:opacity-90 text-slate-950 flex items-center justify-center font-bold shadow-lg transition transform active:scale-95"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>

              {/* Volume Slider */}
              <div className="flex-1 flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white transition"
                  title={isMuted ? "Rétablir le son" : "Couper le son"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-slate-300" />
                  )}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>
            </div>

            {/* Quick Station / Soundscape Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                <span>{mode === "radio" ? "Stations du Monde" : "Ambiances Naturelles"}</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  {mode === "radio" ? `${CURATED_RADIO_STATIONS.length} stations` : "8 paysages"}
                </span>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {mode === "radio"
                  ? CURATED_RADIO_STATIONS.map((station) => {
                      const isCurrent = currentStation.id === station.id;
                      return (
                        <div
                          key={station.id}
                          onClick={() => {
                            setMode("radio");
                            setStation(station);
                            if (!isPlaying) {
                              play();
                            }
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition border ${
                            isCurrent
                              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                              : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/80 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base">{station.flag}</span>
                            <div className="flex flex-col">
                              <span className="font-bold">{station.countryName}</span>
                              <span className="text-[10px] text-slate-400 truncate max-w-[180px]">
                                {station.name}
                              </span>
                            </div>
                          </div>
                          {isCurrent && renderEqualizer(isPlaying)}
                        </div>
                      );
                    })
                  : Object.values(SOUNDSCAPES).map((soundscape) => {
                      const isCurrent = currentSoundscape.id === soundscape.id;
                      return (
                        <div
                          key={soundscape.id}
                          onClick={() => {
                            setMode("soundscape");
                            setSoundscape(soundscape.id as SoundscapeId);
                            if (!isPlaying) {
                              play();
                            }
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition border ${
                            isCurrent
                              ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300"
                              : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/80 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base">{soundscape.icon}</span>
                            <div className="flex flex-col">
                              <span className="font-bold">{soundscape.name}</span>
                              <span className="text-[10px] text-slate-400 truncate max-w-[180px]">
                                {soundscape.region}
                              </span>
                            </div>
                          </div>
                          {isCurrent && renderEqualizer(isPlaying)}
                        </div>
                      );
                    })}
              </div>
            </div>

            {/* Anecdotes Toggle */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-cyan-400" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white leading-tight">
                    Anecdotes Vocales en Quiz
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Capsules de 10s sur bonne réponse
                  </span>
                </div>
              </div>

              <button
                onClick={toggleAnecdotesEnabled}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  anecdotesEnabled ? "bg-cyan-500" : "bg-slate-800"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    anecdotesEnabled ? "translate-x-4" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
