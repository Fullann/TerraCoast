import React, { useState, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import worldMapData from "world-atlas/countries-110m.json";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Lock,
} from "lucide-react";
import {
  getAllAtlasCountries,
  type AtlasCountry,
} from "../../lib/atlasData";
import {
  isCountryConquered,
  getConquestCardByIso3,
  type ConquestCard,
} from "../../lib/conquestManager";
import { useLanguage } from "../../contexts/LanguageContext";

interface ConquestWorldMapProps {
  userId?: string | null;
  onSelectCard: (card: ConquestCard) => void;
  selectedIso3?: string | null;
}

const CONTINENT_CENTERS: Record<
  string,
  { center: [number, number]; zoom: number }
> = {
  all: { center: [0, 20], zoom: 1 },
  Europe: { center: [15, 52], zoom: 2.8 },
  Asia: { center: [95, 32], zoom: 1.8 },
  Africa: { center: [20, 5], zoom: 1.8 },
  Americas: { center: [-75, 12], zoom: 1.5 },
  Oceania: { center: [140, -22], zoom: 2.2 },
};

export const ConquestWorldMap: React.FC<ConquestWorldMapProps> = ({
  userId,
  onSelectCard,
  selectedIso3,
}) => {
  const { language } = useLanguage();
  const [hoveredCountry, setHoveredCountry] = useState<AtlasCountry | null>(null);
  const [activeContinent, setActiveContinent] = useState<string>("all");
  const [zoomPosition, setZoomPosition] = useState<{
    coordinates: [number, number];
    zoom: number;
  }>({
    coordinates: [0, 20],
    zoom: 1,
  });

  const allCountries = useMemo(() => {
    return getAllAtlasCountries(language);
  }, [language]);

  // Index rapide pour matcher TopoJSON (numericCode, iso3, name)
  const countryLookup = useMemo(() => {
    const map = new Map<string, AtlasCountry>();
    for (const c of allCountries) {
      if (c.numericCode) {
        map.set(String(Number(c.numericCode)), c);
      }
      map.set(c.iso3.toUpperCase(), c);
      map.set(c.name.toLowerCase(), c);
    }
    return map;
  }, [allCountries]);

  const findCountryForGeography = (geo: any): AtlasCountry | null => {
    const id = geo?.id;
    if (id !== undefined && id !== null) {
      const byNum = countryLookup.get(String(Number(id)));
      if (byNum) return byNum;
      const byId = countryLookup.get(String(id).toUpperCase());
      if (byId) return byId;
    }
    const propName = geo?.properties?.name;
    if (propName) {
      const byName = countryLookup.get(String(propName).toLowerCase());
      if (byName) return byName;
    }
    return null;
  };

  const handleContinentFilter = (contKey: string) => {
    setActiveContinent(contKey);
    const target = CONTINENT_CENTERS[contKey] || CONTINENT_CENTERS.all;
    setZoomPosition({
      coordinates: target.center,
      zoom: target.zoom,
    });
  };

  const handleResetZoom = () => {
    setActiveContinent("all");
    setZoomPosition({
      coordinates: CONTINENT_CENTERS.all.center,
      zoom: CONTINENT_CENTERS.all.zoom,
    });
  };

  const hoveredIsConquered = hoveredCountry
    ? isCountryConquered(hoveredCountry.iso3, userId)
    : false;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#090d16] via-[#0f172a] to-[#0b1120] border border-emerald-950 shadow-2xl flex flex-col min-h-[500px] lg:min-h-[560px]">
      {/* HUD Top Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Continent Pills */}
        <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-slate-700/60 shadow-lg pointer-events-auto">
          {[
            { key: "all", label: "Monde" },
            { key: "Europe", label: "Europe" },
            { key: "Asia", label: "Asie" },
            { key: "Africa", label: "Afrique" },
            { key: "Americas", label: "Amériques" },
            { key: "Oceania", label: "Océanie" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => handleContinentFilter(item.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                activeContinent === item.key
                  ? "bg-emerald-500 text-slate-950 shadow-sm font-extrabold"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/80"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-lg text-xs pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] inline-block"></span>
            <span className="text-emerald-300 font-bold">Conquis & Éclairé</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-800 border border-slate-600 inline-block"></span>
            <span className="text-slate-400">Brouillard de Guerre</span>
          </div>
        </div>
      </div>

      {/* Floating Tooltip HUD */}
      {hoveredCountry && (
        <div className="absolute bottom-4 left-4 z-20 pointer-events-none animate-fade-in">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border flex items-center gap-3 ${
              hoveredIsConquered
                ? "bg-slate-900/95 border-emerald-500/60 shadow-emerald-500/10"
                : "bg-slate-950/90 border-slate-800 text-slate-400"
            }`}
          >
            <span className="text-3xl filter drop-shadow">
              {hoveredIsConquered ? hoveredCountry.flagEmoji : "🌫️"}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-white">
                  {hoveredIsConquered ? hoveredCountry.name : hoveredCountry.name}
                </h4>
                {hoveredIsConquered ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/40">
                    <Sparkles className="w-2.5 h-2.5" /> Conquis
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold border border-slate-700">
                    <Lock className="w-2.5 h-2.5" /> Shroud
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {hoveredIsConquered ? (
                  <span className="text-emerald-400 font-medium">
                    Capitale: {hoveredCountry.capital} • Cliquez pour voir la carte Pokédex !
                  </span>
                ) : (
                  <span className="text-slate-400">
                    Territoire inexploré • Réussis un quiz à ≥ 80% pour dissiper la brume
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Zoom controls bottom-right */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/60 shadow-lg">
        <button
          onClick={() =>
            setZoomPosition((prev) => ({
              ...prev,
              zoom: Math.min(prev.zoom * 1.3, 6),
            }))
          }
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-200 transition-colors"
          title="Zoom +"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() =>
            setZoomPosition((prev) => ({
              ...prev,
              zoom: Math.max(prev.zoom / 1.3, 1),
            }))
          }
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-200 transition-colors"
          title="Zoom -"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-200 transition-colors border-t border-slate-800"
          title="Réinitialiser"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Composable Map */}
      <div className="w-full h-full flex-1 flex items-center justify-center p-2 pt-14">
        <ComposableMap
          projection="geoEqualEarth"
          width={980}
          height={500}
          className="w-full h-full"
        >
          <ZoomableGroup
            center={zoomPosition.coordinates}
            zoom={zoomPosition.zoom}
            onMoveEnd={(pos: any) => setZoomPosition(pos)}
            minZoom={1}
            maxZoom={6}
          >
            <Geographies geography={worldMapData as any}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo: any) => {
                  const country = findCountryForGeography(geo);
                  const isConquered = country
                    ? isCountryConquered(country.iso3, userId)
                    : false;
                  const isHovered =
                    country && hoveredCountry?.iso3 === country.iso3;
                  const isSelected =
                    country && selectedIso3 === country.iso3;

                  // Palette Brouillard de guerre vs Conquis
                  const fillColor = isSelected
                    ? "#f59e0b" // Ambre brillant si sélectionné
                    : isConquered
                    ? isHovered
                      ? "#34d399" // Emeraude clair
                      : "#10b981" // Emeraude vif conquête
                    : isHovered
                    ? "#334155" // Brouillard éclairé au survol
                    : "#1e293b"; // Brouillard sombre de guerre

                  const strokeColor = isSelected
                    ? "#fbbf24"
                    : isConquered
                    ? "#6ee7b7"
                    : "#334155";

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => {
                        if (country) {
                          const card = getConquestCardByIso3(
                            country.iso3,
                            userId,
                            language
                          );
                          if (card) onSelectCard(card);
                        }
                      }}
                      onMouseEnter={() => {
                        if (country) setHoveredCountry(country);
                      }}
                      onMouseLeave={() => {
                        setHoveredCountry(null);
                      }}
                      style={{
                        default: {
                          fill: fillColor,
                          stroke: strokeColor,
                          strokeWidth: isConquered ? 0.6 : 0.35,
                          outline: "none",
                          transition: "all 180ms ease",
                          cursor: "pointer",
                          filter: isConquered
                            ? "drop-shadow(0 0 4px rgba(16, 185, 129, 0.45))"
                            : undefined,
                        },
                        hover: {
                          fill: isConquered ? "#34d399" : "#475569",
                          stroke: isConquered ? "#a7f3d0" : "#64748b",
                          strokeWidth: 1,
                          outline: "none",
                          cursor: "pointer",
                          filter: isConquered
                            ? "drop-shadow(0 0 10px rgba(52, 211, 153, 0.8))"
                            : undefined,
                        },
                        pressed: {
                          fill: isConquered ? "#059669" : "#1e293b",
                          outline: "none",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Atmospheric Fog Overlay Vignette */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_0_80px_rgba(0,0,0,0.85)]"></div>
    </div>
  );
};
