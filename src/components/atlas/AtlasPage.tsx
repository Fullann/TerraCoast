import { useState, useMemo, useRef, lazy, Suspense } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import worldMapData from "world-atlas/countries-110m.json";
import {
  Compass,
  Search,
  Globe,
  Map as MapIcon,
  List,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Users,
  Maximize2,
  MapPin,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  getAllAtlasCountries,
  getAtlasCountryByIso3,
  getLocalizedContinent,
  type AtlasCountry,
} from "../../lib/atlasData";
import { CountryDetailDrawer } from "./CountryDetailDrawer";

const GlobeComponent = lazy(() => import("react-globe.gl"));

type ViewMode = "map" | "globe" | "list";

const CONTINENT_CENTERS: Record<string, { center: [number, number]; zoom: number }> = {
  all: { center: [0, 20], zoom: 1 },
  Europe: { center: [15, 52], zoom: 2.8 },
  Asia: { center: [95, 32], zoom: 1.8 },
  Africa: { center: [20, 5], zoom: 1.8 },
  Americas: { center: [-75, 12], zoom: 1.5 },
  Oceania: { center: [140, -22], zoom: 2.2 },
};

export function AtlasPage() {
  const { t, language } = useLanguage();

  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [selectedContinent, setSelectedContinent] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<AtlasCountry | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<AtlasCountry | null>(null);

  // Carte 2D Zoom state
  const [zoomPosition, setZoomPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [0, 20],
    zoom: 1,
  });

  const allCountries = useMemo(() => {
    return getAllAtlasCountries(language);
  }, [language]);

  // Index rapide par numericCode, iso3 et nom pour react-simple-maps
  const countryLookup = useMemo(() => {
    const map = new Map<string, AtlasCountry>();
    for (const c of allCountries) {
      if (c.numericCode) {
        // Enlever les zéros initiaux éventuels pour matcher TopoJSON (ex: "076" -> "76")
        map.set(String(Number(c.numericCode)), c);
      }
      map.set(c.iso3.toUpperCase(), c);
      map.set(c.name.toLowerCase(), c);
    }
    return map;
  }, [allCountries]);

  // Filtrage selon continent et recherche
  const filteredCountries = useMemo(() => {
    return allCountries.filter((country) => {
      const matchContinent =
        selectedContinent === "all" || country.continent === selectedContinent;

      if (!matchContinent) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      return (
        country.name.toLowerCase().includes(q) ||
        country.capital.toLowerCase().includes(q) ||
        country.iso3.toLowerCase().includes(q) ||
        country.officialName.toLowerCase().includes(q)
      );
    });
  }, [allCountries, selectedContinent, searchQuery]);

  const handleContinentChange = (cont: string) => {
    setSelectedContinent(cont);
    const target = CONTINENT_CENTERS[cont] || CONTINENT_CENTERS.all;
    setZoomPosition({ coordinates: target.center, zoom: target.zoom });
  };

  const handleZoomIn = () => {
    setZoomPosition((prev) => ({
      ...prev,
      zoom: Math.min(prev.zoom + 0.5, 6),
    }));
  };

  const handleZoomOut = () => {
    setZoomPosition((prev) => ({
      ...prev,
      zoom: Math.max(prev.zoom - 0.5, 1),
    }));
  };

  const handleResetZoom = () => {
    const target = CONTINENT_CENTERS[selectedContinent] || CONTINENT_CENTERS.all;
    setZoomPosition({ coordinates: target.center, zoom: target.zoom });
  };

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

  const globeRef = useRef<any>(null);

  const continents = [
    { key: "all", label: t("common.all") || "Tous" },
    { key: "Europe", label: getLocalizedContinent("Europe", language) },
    { key: "Asia", label: getLocalizedContinent("Asia", language) },
    { key: "Africa", label: getLocalizedContinent("Africa", language) },
    { key: "Americas", label: getLocalizedContinent("Americas", language) },
    { key: "Oceania", label: getLocalizedContinent("Oceania", language) },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 text-white py-6 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-black uppercase tracking-wider mb-2">
              <Compass className="w-3.5 h-3.5 text-emerald-200" />
              <span>{t("atlas.badge") || "Mode Exploration Libre"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              {t("atlas.title") || "Atlas Mondial Interactif 🗺️"}
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl">
              {t("atlas.subtitle") ||
                "Cliquez sur n'importe quel pays sur la carte ou le globe 3D pour réviser sa capitale, son drapeau, sa population et ses faits marquants."}
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-black/25 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 self-start md:self-auto">
            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                viewMode === "map"
                  ? "bg-white text-emerald-800 shadow-md scale-102"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <MapIcon className="w-4 h-4" />
              <span>{t("atlas.viewMap") || "Carte 2D"}</span>
            </button>

            <button
              onClick={() => setViewMode("globe")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                viewMode === "globe"
                  ? "bg-white text-emerald-800 shadow-md scale-102"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>{t("atlas.viewGlobe") || "Globe 3D"}</span>
            </button>

            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                viewMode === "list"
                  ? "bg-white text-emerald-800 shadow-md scale-102"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <List className="w-4 h-4" />
              <span>{t("atlas.viewList") || "Fiches"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Continent Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {continents.map((c) => (
              <button
                key={c.key}
                onClick={() => handleContinentChange(c.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                  selectedContinent === c.key
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("atlas.searchPlaceholder") || "Rechercher pays, capitale..."}
              className="w-full pl-9 pr-4 py-1.5 rounded-xl text-xs sm:text-sm bg-gray-100 border border-transparent focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {/* VIEW 1: MAP 2D */}
        {viewMode === "map" && (
          <div className="relative flex-1 bg-sky-50 rounded-2xl overflow-hidden border border-gray-200 shadow-inner min-h-[550px] flex flex-col">
            {/* Map Zoom Controls */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-white/90 backdrop-blur-sm rounded-xl p-1.5 shadow-md border border-gray-200">
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors"
                title="Zoomer (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors"
                title="Dézoomer (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors border-t border-gray-100"
                title="Réinitialiser la vue"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Hover Tooltip Card */}
            {hoveredCountry && (
              <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-emerald-200 pointer-events-none flex items-center gap-3 animate-fade-in">
                <span className="text-3xl">{hoveredCountry.flagEmoji}</span>
                <div>
                  <h4 className="text-sm font-black text-gray-900 leading-tight">
                    {hoveredCountry.name}
                  </h4>
                  <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {hoveredCountry.capital}
                  </p>
                </div>
              </div>
            )}

            {/* Interactive Composable Map */}
            <ComposableMap
              projection="geoEqualEarth"
              width={980}
              height={500}
              className="w-full h-full flex-1"
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
                      const isSelected = country && selectedCountry?.iso3 === country.iso3;
                      const isHovered = country && hoveredCountry?.iso3 === country.iso3;

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onClick={() => {
                            if (country) setSelectedCountry(country);
                          }}
                          onMouseEnter={() => {
                            if (country) setHoveredCountry(country);
                          }}
                          onMouseLeave={() => {
                            setHoveredCountry(null);
                          }}
                          style={{
                            default: {
                              fill: isSelected
                                ? "#059669"
                                : isHovered
                                ? "#34D399"
                                : country
                                ? "#E2E8F0"
                                : "#CBD5E1",
                              stroke: "#94A3B8",
                              strokeWidth: 0.4,
                              outline: "none",
                              transition: "all 150ms ease",
                              cursor: country ? "pointer" : "default",
                            },
                            hover: {
                              fill: "#10B981",
                              stroke: "#047857",
                              strokeWidth: 0.8,
                              outline: "none",
                              cursor: "pointer",
                            },
                            pressed: {
                              fill: "#047857",
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

            <div className="p-3 bg-white/80 backdrop-blur-xs border-t border-gray-200 text-xs text-gray-500 text-center">
              💡 {t("atlas.mapHint") || "Cliquez sur un pays pour ouvrir sa fiche complète et réviser."}
            </div>
          </div>
        )}

        {/* VIEW 2: GLOBE 3D */}
        {viewMode === "globe" && (
          <div className="relative flex-1 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl min-h-[550px] flex items-center justify-center">
            <div className="absolute top-4 left-4 z-20 bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700 text-xs text-slate-300">
              🌍 {t("atlas.globeHint") || "Faites glisser pour tourner le globe. Cliquez sur un repère pour explorer."}
            </div>

            <Suspense
              fallback={
                <div className="text-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium text-sm">Chargement du globe 3D...</p>
                </div>
              }
            >
              <GlobeComponent
                ref={globeRef}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundColor="rgba(0,0,0,0)"
                pointsData={filteredCountries}
                pointLat={(d: any) => d.lat}
                pointLng={(d: any) => d.lng}
                pointAltitude={0.06}
                pointRadius={0.7}
                pointColor={() => "#10B981"}
                pointLabel={(d: any) =>
                  `<div style="background: rgba(15,23,42,0.9); color: #fff; padding: 6px 10px; border-radius: 8px; font-family: sans-serif; font-size: 12px; border: 1px solid #10B981;">
                    <strong>${d.flagEmoji} ${d.name}</strong><br/>
                    <span style="color: #94A3B8;">📍 ${d.capital}</span>
                  </div>`
                }
                onPointClick={(d: any) => setSelectedCountry(d as AtlasCountry)}
              />
            </Suspense>
          </div>
        )}

        {/* VIEW 3: LIST / FICHES */}
        {viewMode === "list" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold px-1">
              <span>
                {filteredCountries.length} {filteredCountries.length > 1 ? "pays trouvés" : "pays trouvé"}
              </span>
              {searchQuery && (
                <span>Filtre actif : « {searchQuery} »</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredCountries.map((c) => (
                <div
                  key={c.iso3}
                  onClick={() => setSelectedCountry(c)}
                  className="p-4 rounded-2xl bg-white hover:bg-emerald-50/50 border border-gray-200 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-3xl group-hover:scale-110 transition-transform">
                      {c.flagEmoji}
                    </span>
                    <span className="text-[11px] font-mono font-bold bg-gray-100 group-hover:bg-emerald-100 text-gray-600 group-hover:text-emerald-800 px-2 py-0.5 rounded-md">
                      {c.iso3}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-gray-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                    {c.name}
                  </h3>

                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="line-clamp-1">{c.capital}</span>
                  </p>

                  <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {new Intl.NumberFormat(language, { notation: "compact" }).format(c.population)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Maximize2 className="w-3 h-3" />
                      {new Intl.NumberFormat(language, { notation: "compact" }).format(c.areaKm2)} km²
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {filteredCountries.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <span className="text-5xl block mb-3">🔍</span>
                <h3 className="text-lg font-bold text-gray-800">
                  {t("atlas.noResultsTitle") || "Aucun pays trouvé"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Essayez d'ajuster votre recherche ou sélectionnez un autre continent.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slide-over Drawer for Selected Country */}
      <CountryDetailDrawer
        country={selectedCountry}
        onClose={() => setSelectedCountry(null)}
        onSelectCountry={(iso3) => {
          const found = getAtlasCountryByIso3(iso3, language);
          if (found) setSelectedCountry(found);
        }}
      />
    </div>
  );
}
