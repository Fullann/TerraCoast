import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  ZoomableGroup,
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
  ZoomIn,
  ZoomOut,
  Compass,
} from "lucide-react";
import { calculateHaversineDistance } from "../../../lib/geoDetectiveGame";

interface MiniPinMapProps {
  onConfirmGuess: (lat: number, lng: number) => void;
  targetCoords?: { lat: number; lng: number } | null;
  guessCoords?: { lat: number; lng: number } | null;
  isResultPhase: boolean;
  disabled?: boolean;
}

const MAP_WIDTH = 800;
const MAP_HEIGHT = 440;

interface RegionPreset {
  id: string;
  name: string;
  emoji: string;
  coordinates: [number, number];
  zoom: number;
}

const REGION_PRESETS: RegionPreset[] = [
  { id: "world", name: "Monde", emoji: "🌍", coordinates: [0, 20], zoom: 1 },
  { id: "europe", name: "Europe", emoji: "🇪🇺", coordinates: [15, 50], zoom: 3.2 },
  { id: "africa", name: "Afrique", emoji: "🌍", coordinates: [20, 5], zoom: 2.2 },
  { id: "asia", name: "Asie", emoji: "🌏", coordinates: [90, 32], zoom: 2.2 },
  { id: "americas", name: "Amériques", emoji: "🌎", coordinates: [-75, 15], zoom: 1.8 },
  { id: "oceania", name: "Océanie", emoji: "🏝️", coordinates: [140, -24], zoom: 2.6 },
];

function formatCoordinate(lat: number, lng: number): string {
  const latStr = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"}`;
  const lngStr = `${Math.abs(lng).toFixed(2)}°${lng >= 0 ? "E" : "O"}`;
  return `${latStr}, ${lngStr}`;
}

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
  const [position, setPosition] = useState<{
    coordinates: [number, number];
    zoom: number;
  }>({
    coordinates: [0, 20],
    zoom: 1,
  });

  const innerGroupRef = useRef<SVGGElement | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  // Synchronisation si nouvelle manche
  useEffect(() => {
    if (!isResultPhase && !guessCoords) {
      setCurrentPin(null);
    } else if (guessCoords) {
      setCurrentPin([guessCoords.lng, guessCoords.lat]);
    }
  }, [isResultPhase, guessCoords]);

  // Si phase résultat, centrer sur la cible ou le midpoint
  useEffect(() => {
    if (isResultPhase && targetCoords) {
      if (guessCoords) {
        // Centrer entre la cible et le tir
        const midLng = (targetCoords.lng + guessCoords.lng) / 2;
        const midLat = (targetCoords.lat + guessCoords.lat) / 2;
        setPosition({
          coordinates: [midLng, midLat],
          zoom: Math.max(1.8, Math.min(position.zoom, 4)),
        });
      } else {
        setPosition({
          coordinates: [targetCoords.lng, targetCoords.lat],
          zoom: 2.5,
        });
      }
    }
  }, [isResultPhase, targetCoords, guessCoords]);

  // Projection D3 Equal Earth synchronisée
  const projection = useMemo(() => {
    return geoEqualEarth()
      .scale(145)
      .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);
  }, []);

  // Détection du début de pointeur (pour différencier un clic d'un drag/pan)
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
  };

  // Traitement du clic avec inversion mathématique précise
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (disabled || isResultPhase || !pointerStartRef.current || !innerGroupRef.current) {
        pointerStartRef.current = null;
        return;
      }

      const dx = Math.abs(e.clientX - pointerStartRef.current.x);
      const dy = Math.abs(e.clientY - pointerStartRef.current.y);
      pointerStartRef.current = null;

      // Si déplacement supérieur à 6px, c'est un drag/pan de carte, pas un placement de pin !
      if (dx > 6 || dy > 6) {
        return;
      }

      const svg = innerGroupRef.current.ownerSVGElement;
      if (!svg) return;

      const ctm = innerGroupRef.current.getScreenCTM();
      if (!ctm) return;

      // Conversion exacte des coordonnées écran en coordonnées locales du groupe SVG
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const local = pt.matrixTransform(ctm.inverse());

      // Inversion de la projection EqualEarth vers coordonnées géographiques [lng, lat]
      const inverted = projection.invert?.([local.x, local.y]);
      if (inverted && !isNaN(inverted[0]) && !isNaN(inverted[1])) {
        const [lng, lat] = inverted;
        // Limiter aux bornes géographiques
        const clampedLat = Math.max(-85, Math.min(85, lat));
        const clampedLng = Math.max(-180, Math.min(180, lng));
        setCurrentPin([clampedLng, clampedLat]);
      }
    },
    [disabled, isResultPhase, projection]
  );

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

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPosition((pos) => ({
      ...pos,
      zoom: Math.min(pos.zoom * 1.5, 10),
    }));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPosition((pos) => ({
      ...pos,
      zoom: Math.max(pos.zoom / 1.5, 1),
    }));
  };

  const handleRegionSelect = (preset: RegionPreset) => {
    setPosition({
      coordinates: preset.coordinates,
      zoom: preset.zoom,
    });
  };

  // Coordonnées pour affichage de résultat
  const resultGuess = guessCoords ? [guessCoords.lng, guessCoords.lat] as [number, number] : currentPin;
  const resultTarget = targetCoords ? [targetCoords.lng, targetCoords.lat] as [number, number] : null;

  // Calcul de la distance si les deux coordonnées sont disponibles
  const resultDistance = useMemo(() => {
    if (resultGuess && resultTarget) {
      return calculateHaversineDistance(
        resultGuess[1],
        resultGuess[0],
        resultTarget[1],
        resultTarget[0]
      );
    }
    return null;
  }, [resultGuess, resultTarget]);

  // Facteur d'échelle pour que les icônes de pin restent nettes quel que soit le zoom
  const markerScale = Math.max(0.4, 1 / Math.sqrt(position.zoom || 1));

  return (
    <>
      {/* Conteneur de la carte (Miniature ou Agrandie) */}
      <div
        className={`transition-all duration-300 ${
          isExpanded
            ? "fixed inset-3 sm:inset-8 z-50 bg-white/95 backdrop-blur-2xl rounded-3xl border-2 border-slate-300 shadow-2xl flex flex-col p-4 animate-fade-in"
            : "w-full rounded-3xl bg-white border-2 border-slate-200 shadow-xs overflow-hidden flex flex-col"
        }`}
      >
        {/* En-tête de la mini-carte */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b-2 border-slate-200 bg-white select-none">
          <div className="flex items-center gap-2 min-w-0">
            <Crosshair className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 truncate">
              {isResultPhase
                ? "Résultat du Repérage"
                : currentPin
                ? "Repère placé 🎯"
                : "Pointez sur la carte"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isResultPhase && currentPin && (
              <button
                type="button"
                onClick={handleResetPin}
                className="px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition flex items-center gap-1"
                title="Effacer le repère"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Effacer</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
              title={isExpanded ? "Réduire la carte" : "Agrandir en plein écran pour viser au pixel"}
            >
              {isExpanded ? (
                <Minimize2 className="w-4 h-4 text-teal-600" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Barre de sauts rapides par Continent */}
        <div className="px-3 py-1.5 bg-slate-50 border-b-2 border-slate-200 flex items-center gap-1 overflow-x-auto no-scrollbar select-none">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Compass className="w-3 h-3 text-teal-600" />
            Zoom :
          </span>
          {REGION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleRegionSelect(preset)}
              className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-[11px] font-black text-slate-700 whitespace-nowrap transition flex items-center gap-1 shadow-2xs"
            >
              <span>{preset.emoji}</span>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>

        {/* Zone SVG Interactive avec ComposableMap directe */}
        <div
          className={`relative w-full overflow-hidden flex-1 flex items-center justify-center bg-[#070b14] ${
            isExpanded ? "h-full min-h-[350px]" : "h-[220px] sm:h-[260px]"
          } ${!isResultPhase ? "cursor-crosshair" : "cursor-default"}`}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <ComposableMap
            projection={projection as any}
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            className="w-full h-full select-none"
          >
            <ZoomableGroup
              ref={innerGroupRef}
              center={position.coordinates}
              zoom={position.zoom}
              onMoveEnd={(pos: any) => setPosition(pos)}
              minZoom={1}
              maxZoom={10}
            >
              {/* Océan background interactif dans le groupe zoomé */}
              <rect
                x={-MAP_WIDTH * 2}
                y={-MAP_HEIGHT * 2}
                width={MAP_WIDTH * 5}
                height={MAP_HEIGHT * 5}
                fill="#0b1120"
              />

              {/* Continents et pays */}
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
                          fill: isResultPhase ? "#1e293b" : "#334155",
                          stroke: isResultPhase ? "#334155" : "#64748b",
                          strokeWidth: 0.7,
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
                  strokeWidth={2 / Math.sqrt(position.zoom)}
                  strokeDasharray="5 3"
                  className="animate-pulse"
                />
              )}

              {/* Repère Joueur */}
              {(currentPin || (isResultPhase && resultGuess)) && (
                <Marker coordinates={isResultPhase && resultGuess ? resultGuess : currentPin!}>
                  <g transform={`scale(${markerScale}) translate(-14, -28)`}>
                    {/* Anneau pulsant */}
                    <circle
                      cx="14"
                      cy="14"
                      r="12"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      className="animate-ping opacity-75 origin-center"
                    />
                    {/* SVG Pin rouge joueur */}
                    <path
                      d="M14 2C9.58 2 6 5.58 6 10c0 6 8 16 8 16s8-10 8-16c0-4.42-3.58-8-8-8z"
                      fill="#ef4444"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <circle cx="14" cy="10" r="3.5" fill="#ffffff" />
                    {/* Badge texte */}
                    <g transform="translate(14, 34)">
                      <rect
                        x="-30"
                        y="0"
                        width="60"
                        height="16"
                        rx="4"
                        fill="#ef4444"
                        stroke="#ffffff"
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="12"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        Mon Tir
                      </text>
                    </g>
                  </g>
                </Marker>
              )}

              {/* Repère Cible Réelle (affiché seulement en phase de résultat) */}
              {isResultPhase && resultTarget && (
                <Marker coordinates={resultTarget}>
                  <g transform={`scale(${markerScale}) translate(-14, -28)`}>
                    {/* Anneau pulsant émeraude */}
                    <circle
                      cx="14"
                      cy="14"
                      r="14"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      className="animate-ping opacity-80"
                    />
                    {/* SVG Pin émeraude cible */}
                    <path
                      d="M14 2C9.58 2 6 5.58 6 10c0 6 8 16 8 16s8-10 8-16c0-4.42-3.58-8-8-8z"
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <circle cx="14" cy="10" r="3.5" fill="#ffffff" />
                    {/* Badge texte cible */}
                    <g transform="translate(14, 34)">
                      <rect
                        x="-35"
                        y="0"
                        width="70"
                        height="16"
                        rx="4"
                        fill="#10b981"
                        stroke="#ffffff"
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="12"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="sans-serif"
                      >
                        🎯 Vraie Cible
                      </text>
                    </g>
                  </g>
                </Marker>
              )}
            </ZoomableGroup>
          </ComposableMap>

          {/* Boutons de zoom flottants sur la carte */}
          <div className="absolute right-3 top-3 flex flex-col gap-1.5 z-10">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-2 rounded-xl bg-white/95 hover:bg-white border-2 border-slate-200 text-slate-800 shadow-sm transition active:scale-95"
              title="Zoom avant (+)"
            >
              <ZoomIn className="w-4 h-4 text-teal-600" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-2 rounded-xl bg-white/95 hover:bg-white border-2 border-slate-200 text-slate-700 shadow-sm transition active:scale-95"
              title="Zoom arrière (-)"
            >
              <ZoomOut className="w-4 h-4 text-slate-600" />
            </button>
            <button
              type="button"
              onClick={() => handleRegionSelect(REGION_PRESETS[0])}
              className="p-2 rounded-xl bg-white/95 hover:bg-white border-2 border-slate-200 text-slate-700 shadow-sm transition active:scale-95"
              title="Vue globale monde"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Graticule et repères d'échelle */}
          <div className="pointer-events-none absolute bottom-1 right-2 text-[10px] font-mono text-slate-400 select-none">
            Zoom {position.zoom.toFixed(1)}x • Equal Earth
          </div>
        </div>

        {/* Barre inférieure : Coordonnées et Validation */}
        <div className="p-3 bg-white border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="text-xs text-slate-700 flex items-center gap-2 w-full sm:w-auto">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
            {isResultPhase && resultDistance !== null ? (
              <span className="font-mono font-black text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                Écart : {Math.round(resultDistance).toLocaleString()} km
              </span>
            ) : currentPin ? (
              <span className="font-mono text-teal-800 font-black bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200 truncate">
                {formatCoordinate(currentPin[1], currentPin[0])}
              </span>
            ) : (
              <span className="text-slate-400 font-medium italic">
                Cliquez pour placer le repère
              </span>
            )}
          </div>

          {!isResultPhase && (
            <button
              type="button"
              disabled={!currentPin || disabled}
              onClick={handleConfirm}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm rounded-2xl border-2 border-emerald-600 border-b-4 border-b-emerald-700 active:border-b-0 active:translate-y-1 shadow-md transition flex items-center justify-center gap-2 shrink-0"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Valider mon repère 🎯</span>
            </button>
          )}
        </div>
      </div>

      {/* Backdrop sombre si la carte est agrandie */}
      {isExpanded && (
        <div
          onClick={() => setIsExpanded(false)}
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md transition-opacity"
        />
      )}
    </>
  );
};
