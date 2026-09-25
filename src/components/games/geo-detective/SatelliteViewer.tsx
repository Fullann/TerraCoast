import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Layers,
  Camera,
  RefreshCw,
} from "lucide-react";
import {
  SatelliteLocation,
  getSatelliteTileUrl,
} from "../../../lib/geoDetectiveData";

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

  // Gestion des sources d'images et fallback automatique
  const [viewMode, setViewMode] = useState<"photo" | "satellite">("photo");
  const [currentSrc, setCurrentSrc] = useState<string>(location.satelliteImageUrl);
  const [fallbackLevel, setFallbackLevel] = useState<number>(0); // 0 = primary, 1 = secondary, 2 = tile
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Support tactile pinch-to-zoom
  const [touchStartDist, setTouchStartDist] = useState<number | null>(null);
  const [initialPinchZoom, setInitialPinchZoom] = useState<number>(1);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Réinitialisation lors du changement d'étape / lieu
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsLoading(true);
    setImageLoaded(false);
    setFallbackLevel(0);
    setViewMode("photo");
    setCurrentSrc(location.satelliteImageUrl);
  }, [location.id]);

  // Si l'utilisateur bascule en mode direct satellite
  useEffect(() => {
    if (viewMode === "satellite") {
      setIsLoading(true);
      setImageLoaded(false);
      setCurrentSrc(getSatelliteTileUrl(location.lat, location.lng, 14));
    } else {
      setIsLoading(true);
      setImageLoaded(false);
      setCurrentSrc(
        fallbackLevel === 1 && location.secondaryImageUrl
          ? location.secondaryImageUrl
          : location.satelliteImageUrl
      );
    }
  }, [viewMode, location, fallbackLevel]);

  // Gestion de l'échec de chargement d'image avec cascade de secours
  const handleImageError = () => {
    if (viewMode === "photo") {
      if (fallbackLevel === 0 && location.secondaryImageUrl) {
        setFallbackLevel(1);
        setCurrentSrc(location.secondaryImageUrl);
        return;
      }
      // Bascule automatique sur la dalle satellite spatiale Esri
      setFallbackLevel(2);
      setViewMode("satellite");
      setCurrentSrc(getSatelliteTileUrl(location.lat, location.lng, 14));
      return;
    }
    // Si même la dalle satellite à zoom 14 échoue, tenter à zoom 13 plus large
    if (viewMode === "satellite" && fallbackLevel < 4) {
      setFallbackLevel(4);
      setCurrentSrc(getSatelliteTileUrl(location.lat, location.lng, 13));
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageLoaded(true);
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.4, 4.0));
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

  // Double-clic pour zoomer / dézoomer rapidement
  const handleDoubleClick = () => {
    if (zoom > 1.2) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    } else {
      setZoom(2.2);
    }
  };

  // Souris Pan
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
      setZoom((z) => Math.min(z + 0.25, 4.0));
    } else {
      setZoom((z) => {
        const next = Math.max(z - 0.25, 1);
        if (next === 1) setPan({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Support Tactile (Mobile / Tablette)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      if (zoom > 1) {
        setIsDragging(true);
        setDragStart({
          x: e.touches[0].clientX - pan.x,
          y: e.touches[0].clientY - pan.y,
        });
      }
    } else if (e.touches.length === 2) {
      // Pinch to zoom
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchStartDist(dist);
      setInitialPinchZoom(zoom);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging && zoom > 1) {
      setPan({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    } else if (e.touches.length === 2 && touchStartDist !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDist;
      const nextZoom = Math.min(Math.max(initialPinchZoom * factor, 1), 4.0);
      setZoom(nextZoom);
      if (nextZoom === 1) setPan({ x: 0, y: 0 });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchStartDist(null);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
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
        {/* Catégorie & Badge de phase */}
        <div className="flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/60 shadow-lg pointer-events-auto">
          <Satellite className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-xs font-black text-slate-200 uppercase tracking-wider">
            {isResultPhase ? location.name : categoryLabels[location.category] || "Vue Satellite HD"}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]"></span>
        </div>

        {/* Commandes Droite : Basculeur de Mode & Indice */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Mode Switcher : Photo HD vs Satellite Direct */}
          <button
            type="button"
            onClick={() => setViewMode((m) => (m === "photo" ? "satellite" : "photo"))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-md border ${
              viewMode === "satellite"
                ? "bg-emerald-600 text-white border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                : "bg-slate-900/85 hover:bg-slate-800 text-slate-300 border-slate-700"
            }`}
            title="Basculer entre le cliché aérien HD et la dalle satellite directe depuis l'orbite"
          >
            {viewMode === "satellite" ? (
              <>
                <Satellite className="w-3.5 h-3.5" />
                <span>Mode Satellite Orbite</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cliché Aérien HD</span>
              </>
            )}
          </button>

          {/* Clue Button / Display */}
          {!usedClue ? (
            <button
              type="button"
              onClick={onUseClue}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition transform active:scale-95 shadow-md"
              title="Obtenir un indice sur la région (-250 pts)"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Indice (-250 pts)</span>
            </button>
          ) : (
            <div className="bg-amber-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-amber-500/50 shadow-lg text-xs font-medium text-amber-200 max-w-sm sm:max-w-md flex items-center gap-2">
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
        className={`relative w-full h-full flex items-center justify-center overflow-hidden bg-black ${
          zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"
        }`}
      >
        {/* Loading Scanner Animation */}
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="relative w-20 h-20 rounded-full border-2 border-emerald-500/30 flex items-center justify-center animate-spin">
              <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_12px_#10b981]"></div>
            </div>
            <p className="text-xs font-mono text-emerald-400 tracking-widest uppercase animate-pulse">
              Transmission Satellite Orbite Basse...
            </p>
          </div>
        )}

        {/* High-Resolution Satellite View */}
        <img
          src={currentSrc}
          alt={isResultPhase ? location.name : "Vue satellite mystère"}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isDragging || touchStartDist !== null ? "none" : "transform 150ms ease-out",
          }}
          className={`max-w-none w-full h-full object-cover select-none pointer-events-none transition-opacity duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          draggable={false}
        />

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
        <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 text-[11px] font-mono text-emerald-400 flex items-center gap-2 pointer-events-auto">
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zoom: {zoom.toFixed(1)}x</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300 hidden sm:inline">
            {zoom > 1 ? "Glissez pour explorer la zone" : "Double-clic ou molette pour zoomer"}
          </span>
          <span className="text-slate-300 sm:hidden">Pincez pour zoomer</span>
        </div>

        {/* Zoom & Screen Controls */}
        <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/60 shadow-xl pointer-events-auto">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
            title="Zoomer (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
            title="Dézoomer (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
            title="Recentrer le zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-slate-700 mx-1"></div>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
            title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
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
