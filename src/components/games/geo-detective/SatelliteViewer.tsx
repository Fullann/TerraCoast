import React, { useState, useRef, useEffect } from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Lightbulb,
  Crosshair,
  Satellite,
  Compass,
} from "lucide-react";
import type { SatelliteLocation } from "../../../lib/geoDetectiveData";

interface SatelliteViewerProps {
  location: SatelliteLocation;
  usedClue: boolean;
  onUseClue: () => void;
  isResultPhase: boolean;
}

export const SatelliteViewer: React.FC<SatelliteViewerProps> = ({
  location,
  usedClue,
  onUseClue,
  isResultPhase,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reset zoom & pan when location changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setImageLoaded(false);
    setImageError(false);
  }, [location.id]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.4, 3.5));
  const handleZoomOut = () => {
    setZoom((z) => {
      const next = Math.max(z - 0.4, 1);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(z + 0.2, 3.5));
    } else {
      setZoom((z) => {
        const next = Math.max(z - 0.2, 1);
        if (next === 1) setPan({ x: 0, y: 0 });
        return next;
      });
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const categoryLabels: Record<string, string> = {
    monument: "🏛️ Monument & Architecture",
    natural_wonder: "🌊 Merveille Naturelle",
    urban_island: "🏙️ Mégalopole & Archipel",
    canal_port: "🚢 Canal & Voie Maritime",
    volcano_crater: "🌋 Caldeira & Cratère",
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className={`relative w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col select-none transition-all ${
        isFullscreen ? "h-screen w-screen rounded-none" : "h-[450px] sm:h-[520px] lg:h-[600px]"
      }`}
    >
      {/* HUD Top Bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Category & Status Badge */}
        <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/60 shadow-lg pointer-events-auto">
          <Satellite className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-xs font-black text-slate-200 uppercase tracking-wider">
            {categoryLabels[location.category] || "Vue Satellite HD"}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]"></span>
        </div>

        {/* Clue Button / Display */}
        <div className="pointer-events-auto">
          {!usedClue ? (
            <button
              onClick={onUseClue}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition transform active:scale-95 shadow-md"
              title="Obtenir un indice sur la région (-250 pts)"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Indice (-250 pts)</span>
            </button>
          ) : (
            <div className="bg-amber-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-amber-500/50 shadow-lg text-xs font-medium text-amber-200 max-w-sm sm:max-w-md animate-fade-in flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="line-clamp-2">{location.clues[0]}</span>
            </div>
          )}
        </div>
      </div>

      {/* Satellite Image Area */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative w-full h-full flex items-center justify-center overflow-hidden ${
          zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"
        }`}
      >
        {/* Loading Scanner Animation */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 z-10 bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="relative w-20 h-20 rounded-full border-2 border-emerald-500/40 flex items-center justify-center animate-spin">
              <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_12px_#10b981]"></div>
            </div>
            <p className="text-xs font-mono text-emerald-400 tracking-widest uppercase animate-pulse">
              Acquisition Satellite Orbite Basse...
            </p>
          </div>
        )}

        {/* High-Resolution Satellite View */}
        <img
          src={location.satelliteImageUrl}
          alt={isResultPhase ? location.name : "Vue satellite mystère"}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageLoaded(true);
            setImageError(true);
          }}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isDragging ? "none" : "transform 150ms ease-out",
          }}
          className={`max-w-none w-full h-full object-cover select-none pointer-events-none ${
            imageError ? "hidden" : "block"
          }`}
          draggable={false}
        />

        {/* Procedural Fallback if image fails to load */}
        {imageError && (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-emerald-950 to-cyan-950 flex flex-col items-center justify-center p-6 text-center text-slate-300">
            <Satellite className="w-16 h-16 text-emerald-400 mb-3 animate-pulse" />
            <h4 className="text-lg font-bold text-white mb-1">
              Capteurs Satellites en Ligne
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              {location.clues[0]}
            </p>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-mono">
              Continent : {location.continent}
            </span>
          </div>
        )}

        {/* Tactical Crosshair Overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
          <div className="w-24 h-24 rounded-full border border-dashed border-emerald-400/60 flex items-center justify-center">
            <Crosshair className="w-8 h-8 text-emerald-400/80" />
          </div>
        </div>

        {/* Vignette & Scanlines effect */}
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_80px_rgba(0,0,0,0.85)]"></div>
      </div>

      {/* HUD Bottom Overlay with Controls */}
      <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        {/* Coordinates simulation / status */}
        <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 text-[11px] font-mono text-emerald-400 flex items-center gap-2 pointer-events-auto">
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zoom: {zoom.toFixed(1)}x</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">
            {zoom > 1 ? "Glissez pour vous déplacer" : "Molette pour zoomer"}
          </span>
        </div>

        {/* Zoom & Screen Controls */}
        <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/60 shadow-xl pointer-events-auto">
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
            title="Zoomer (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
            title="Dézoomer (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
            title="Réinitialiser"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-slate-700 mx-1"></div>
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
            title="Plein écran"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
