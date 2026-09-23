import React, { useState, useRef, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from "react-simple-maps";
import { geoEqualEarth } from "d3-geo";
import worldMapData from "world-atlas/countries-110m.json";
import {
  Maximize2,
  Minimize2,
  MapPin,
  CheckCircle,
  Crosshair,
  RotateCcw,
} from "lucide-react";

interface MiniPinMapProps {
  onConfirmGuess: (lat: number, lng: number) => void;
  targetCoords?: { lat: number; lng: number } | null;
  guessCoords?: { lat: number; lng: number } | null;
  isResultPhase: boolean;
  disabled?: boolean;
}

const MAP_WIDTH = 800;
const MAP_HEIGHT = 440;

export const MiniPinMap: React.FC<MiniPinMapProps> = ({
  onConfirmGuess,
  targetCoords,
  guessCoords,
  isResultPhase,
  disabled = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPin, setCurrentPin] = useState<[number, number] | null>(
    guessCoords ? [guessCoords.lng, guessCoords.lat] : null
  );
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Projection D3 Equal Earth synchronisée
  const projection = useMemo(() => {
    return geoEqualEarth()
      .scale(135)
      .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2 + 10]);
  }, []);

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (disabled || isResultPhase || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = MAP_WIDTH / rect.width;
    const scaleY = MAP_HEIGHT / rect.height;
    const svgX = (e.clientX - rect.left) * scaleX;
    const svgY = (e.clientY - rect.top) * scaleY;

    const inverted = projection.invert?.([svgX, svgY]);
    if (inverted && !isNaN(inverted[0]) && !isNaN(inverted[1])) {
      const [lng, lat] = inverted;
      // Clamp values
      const clampedLat = Math.max(-85, Math.min(85, lat));
      const clampedLng = Math.max(-180, Math.min(180, lng));
      setCurrentPin([clampedLng, clampedLat]);
    }
  };

  const handleConfirm = () => {
    if (!currentPin) return;
    const [lng, lat] = currentPin;
    onConfirmGuess(lat, lng);
  };

  const handleResetPin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isResultPhase) {
      setCurrentPin(null);
    }
  };

  // Coordonnées pour affichage de résultat
  const resultGuess = guessCoords ? [guessCoords.lng, guessCoords.lat] as [number, number] : currentPin;
  const resultTarget = targetCoords ? [targetCoords.lng, targetCoords.lat] as [number, number] : null;

  return (
    <>
      {/* Conteneur de la carte (Miniature ou Agrandie) */}
      <div
        className={`transition-all duration-300 ${
          isExpanded
            ? "fixed inset-4 sm:inset-10 z-50 bg-slate-950/95 backdrop-blur-xl rounded-3xl border-2 border-emerald-500/50 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col p-4 animate-fade-in"
            : "w-full rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-xl overflow-hidden flex flex-col"
        }`}
      >
        {/* En-tête de la mini-carte */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-950/50 select-none">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-200">
              {isResultPhase
                ? "Résultat de la Localisation"
                : currentPin
                ? "Repère placé (cliquez pour corriger)"
                : "Cliquez sur la carte pour placer votre repère"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {!isResultPhase && currentPin && (
              <button
                type="button"
                onClick={handleResetPin}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white text-xs transition"
                title="Effacer le repère"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title={isExpanded ? "Réduire la carte" : "Agrandir pour plus de précision"}
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Zone SVG Interactive */}
        <div
          className={`relative w-full overflow-hidden flex-1 flex items-center justify-center bg-[#070b14] ${
            isExpanded ? "h-full" : "h-[190px] sm:h-[220px]"
          } ${!isResultPhase ? "cursor-crosshair" : "cursor-default"}`}
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            onClick={handleMapClick}
            className="w-full h-full select-none"
          >
            {/* Océan background */}
            <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="#0b1120" />

            <ComposableMap
              projection={projection as any}
              width={MAP_WIDTH}
              height={MAP_HEIGHT}
              className="w-full h-full pointer-events-none"
            >
              <Geographies geography={worldMapData as any}>
                {({ geographies }: { geographies: any[] }) =>
                  geographies.map((geo: any) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      style={{
                        default: {
                          fill: "#1e293b",
                          stroke: "#334155",
                          strokeWidth: 0.5,
                          outline: "none",
                        },
                        hover: {
                          fill: "#334155",
                          stroke: "#475569",
                          strokeWidth: 0.5,
                          outline: "none",
                        },
                        pressed: {
                          fill: "#0f172a",
                          outline: "none",
                        },
                      }}
                    />
                  ))
                }
              </Geographies>

              {/* Ligne géodésique animée de résultat */}
              {isResultPhase && resultGuess && resultTarget && (
                <Line
                  from={resultGuess}
                  to={resultTarget}
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />
              )}

              {/* Repère Joueur */}
              {(currentPin || (isResultPhase && resultGuess)) && (
                <Marker coordinates={isResultPhase && resultGuess ? resultGuess : currentPin!}>
                  <g transform="translate(-12, -24)">
                    {/* Pulsing ring */}
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                      className="animate-ping opacity-75 origin-center"
                    />
                    {/* SVG Pin */}
                    <path
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                      fill="#ef4444"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    <circle cx="12" cy="9" r="2.5" fill="#ffffff" />
                  </g>
                </Marker>
              )}

              {/* Repère Cible Réelle (affiché seulement en phase de résultat) */}
              {isResultPhase && resultTarget && (
                <Marker coordinates={resultTarget}>
                  <g transform="translate(-12, -24)">
                    {/* Pulsing ring green */}
                    <circle
                      cx="12"
                      cy="12"
                      r="12"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      className="animate-ping opacity-80"
                    />
                    <path
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    <circle cx="12" cy="9" r="3" fill="#ffffff" />
                  </g>
                </Marker>
              )}
            </ComposableMap>
          </svg>

          {/* Graticule et repères d'échelle */}
          <div className="pointer-events-none absolute bottom-1 right-2 text-[10px] font-mono text-slate-500">
            Equal Earth Projection
          </div>
        </div>

        {/* Bouton de confirmation */}
        {!isResultPhase && (
          <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
              {currentPin ? (
                <span className="font-mono text-slate-200">
                  {currentPin[1].toFixed(1)}°, {currentPin[0].toFixed(1)}°
                </span>
              ) : (
                <span>Aucun repère placé</span>
              )}
            </div>

            <button
              type="button"
              disabled={!currentPin || disabled}
              onClick={handleConfirm}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition transform active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Valider mon repère 🎯</span>
            </button>
          </div>
        )}
      </div>

      {/* Backdrop sombre si agrandie */}
      {isExpanded && (
        <div
          onClick={() => setIsExpanded(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        ></div>
      )}
    </>
  );
};
