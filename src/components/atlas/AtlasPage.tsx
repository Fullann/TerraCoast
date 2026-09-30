import { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
} from "react-simple-maps";
import worldMapData from "world-atlas/countries-50m.json";
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
  Sparkles,
  Scale,
  X,
  ChevronRight,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  getAllAtlasCountries,
  getAtlasCountryByIso3,
  getLocalizedContinent,
  type AtlasCountry,
} from "../../lib/atlasData";
import { isCountryConquered } from "../../lib/conquestManager";
import { CountryDetailDrawer } from "./CountryDetailDrawer";
import { CountryComparisonModal } from "./CountryComparisonModal";
import {
  GLOBE_LAYER_OPTIONS,
  type GlobeLayerType,
} from "../../lib/globeThemes";

const GlobeComponent = lazy(() => import("react-globe.gl"));

type ViewMode = "map" | "globe" | "list";

function normalizeText(str: string): string {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Micro-états et petites nations insulaires visibles par repères interactifs cliquables
const MICROSTATES: Array<{ iso3: string; name: string }> = [
  { iso3: "MCO", name: "Monaco" },
  { iso3: "VAT", name: "Vatican" },
  { iso3: "SMR", name: "Saint-Marin" },
  { iso3: "LIE", name: "Liechtenstein" },
  { iso3: "AND", name: "Andorre" },
  { iso3: "MLT", name: "Malte" },
  { iso3: "SGP", name: "Singapour" },
  { iso3: "BHR", name: "Bahreïn" },
  { iso3: "BRN", name: "Brunéi" },
  { iso3: "STP", name: "Sao Tomé-et-Principe" },
  { iso3: "SYC", name: "Seychelles" },
  { iso3: "MDV", name: "Maldives" },
  { iso3: "MUS", name: "Maurice" },
  { iso3: "CPV", name: "Cap-Vert" },
  { iso3: "BRB", name: "Barbade" },
];

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
  const { user } = useAuth();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [fogOfWarActive, setFogOfWarActive] = useState(false);
  const [selectedContinent, setSelectedContinent] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<AtlasCountry | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<AtlasCountry | null>(null);
  const [showComparatorModal, setShowComparatorModal] = useState(false);

  // Carte 2D Zoom state
  const [zoomPosition, setZoomPosition] = useState<{ coordinates: [number, number]; zoom: number }>({
    coordinates: [0, 20],
    zoom: 1,
  });

  const [selectedGlobeLayer, setSelectedGlobeLayer] = useState<GlobeLayerType>("satellite");

  // Texture et ambiance selon le calque sélectionné (Politique, Satellite HD, Relief, Nocturne)
  const layerOption = GLOBE_LAYER_OPTIONS.find((l) => l.id === selectedGlobeLayer) || GLOBE_LAYER_OPTIONS[1];
  const themeConfig = layerOption.themeConfig;

  const allCountries = useMemo(() => {
    return getAllAtlasCountries(language);
  }, [language]);

  // Index rapide par numericCode, iso3, iso2 et nom pour react-simple-maps
  const countryLookup = useMemo(() => {
    const map = new Map<string, AtlasCountry>();
    for (const c of allCountries) {
      if (c.numericCode) {
        // Enlever les zéros initiaux éventuels pour matcher TopoJSON (ex: "076" -> "76")
        map.set(String(Number(c.numericCode)), c);
        map.set(c.numericCode, c);
      }
      map.set(c.iso3.toUpperCase(), c);
      if (c.iso2) map.set(c.iso2.toUpperCase(), c);
      map.set(c.name.toLowerCase(), c);
      map.set(normalizeText(c.name), c);
      if (c.officialName) {
        map.set(c.officialName.toLowerCase(), c);
        map.set(normalizeText(c.officialName), c);
      }
    }
    return map;
  }, [allCountries]);

  const normQuery = useMemo(() => normalizeText(searchQuery), [searchQuery]);
  const isSearching = normQuery.length > 0;

  // Filtrage selon continent et recherche (insensible aux accents et à la casse)
  const filteredCountries = useMemo(() => {
    if (!isSearching) {
      if (selectedContinent === "all") return allCountries;
      return allCountries.filter((c) => c.continent === selectedContinent);
    }

    return allCountries.filter((country) => {
      // Si la recherche fait au moins 2 lettres, recherche globale mondiale (ne bloque pas si l'utilisateur a cliqué un continent)
      if (normQuery.length < 2 && selectedContinent !== "all") {
        if (country.continent !== selectedContinent) return false;
      }

      const nName = normalizeText(country.name);
      const nOfficial = normalizeText(country.officialName);
      const nCapital = normalizeText(country.capital);
      const nIso3 = normalizeText(country.iso3);
      const nIso2 = normalizeText(country.iso2);

      return (
        nName.includes(normQuery) ||
        nCapital.includes(normQuery) ||
        nIso3 === normQuery ||
        nIso2 === normQuery ||
        nOfficial.includes(normQuery)
      );
    });
  }, [allCountries, selectedContinent, isSearching, normQuery]);

  // Suggestions d'autocomplétion
  const searchSuggestions = useMemo(() => {
    if (!isSearching) return [];
    return [...filteredCountries]
      .sort((a, b) => {
        const aStarts = normalizeText(a.name).startsWith(normQuery);
        const bStarts = normalizeText(b.name).startsWith(normQuery);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.name.localeCompare(b.name, language);
      })
      .slice(0, 8);
  }, [filteredCountries, isSearching, normQuery, language]);

  // Set des codes ISO3 correspondant à la recherche pour feedback visuel direct sur la carte 2D
  const matchingIsoSet = useMemo(() => {
    if (!isSearching) return null;
    return new Set(filteredCountries.map((c) => c.iso3));
  }, [filteredCountries, isSearching]);

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCountry = (country: AtlasCountry) => {
    setSelectedCountry(country);
    setIsSearchFocused(false);

    // Zoom adapté selon la taille du pays
    let zoomLevel = 2.4;
    if (country.areaKm2 < 1000) zoomLevel = 6;
    else if (country.areaKm2 < 20000) zoomLevel = 5;
    else if (country.areaKm2 < 150000) zoomLevel = 4;
    else if (country.areaKm2 < 1500000) zoomLevel = 3;

    setZoomPosition({
      coordinates: [country.lng, country.lat],
      zoom: zoomLevel,
    });

    // Rotation fluide du globe 3D si actif
    if (globeRef.current?.pointOfView) {
      globeRef.current.pointOfView(
        { lat: country.lat, lng: country.lng, altitude: 1.8 },
        1000
      );
    }

    // Réinitialiser le filtre de continent si le pays est sur un autre continent
    if (selectedContinent !== "all" && country.continent !== selectedContinent) {
      setSelectedContinent("all");
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (searchSuggestions.length > 0) {
        handleSelectCountry(searchSuggestions[0]);
      }
    } else if (e.key === "Escape") {
      setIsSearchFocused(false);
    }
  };

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
      const byRawId = countryLookup.get(String(id));
      if (byRawId) return byRawId;
      const byId = countryLookup.get(String(id).toUpperCase());
      if (byId) return byId;
    }
    const propName = geo?.properties?.name;
    if (propName) {
      const byName = countryLookup.get(String(propName).toLowerCase());
      if (byName) return byName;
      const byNorm = countryLookup.get(normalizeText(propName));
      if (byNorm) return byNorm;
    }
    return null;
  };

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

            <button
              onClick={() => navigate("/conquest")}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all bg-amber-400/20 text-amber-200 hover:bg-amber-400/30 border border-amber-300/30"
              title="Ouvrir la Carte de Conquête & Pokédex Géographique"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Conquête 🗺️</span>
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

          {/* Actions & Search */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowComparatorModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-sm transition-all flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
              title="Comparer deux Pays & True Size"
            >
              <Scale className="w-3.5 h-3.5 text-pink-300" />
              <span className="hidden sm:inline">Comparer deux Pays ⚖️</span>
              <span className="sm:hidden">Comparer ⚖️</span>
            </button>

            {/* Search Box with Autocomplete Dropdown */}
            <div ref={searchBoxRef} className="relative flex-1 md:w-72 lg:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder={t("atlas.searchPlaceholder") || "Rechercher pays, capitale, code..."}
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm bg-gray-100 border border-transparent focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setIsSearchFocused(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-200 transition-colors"
                  title="Effacer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Autocomplete Dropdown */}
              {isSearchFocused && isSearching && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="p-2 border-b border-gray-100 flex items-center justify-between text-[11px] font-bold text-gray-500 bg-gray-50/70">
                    <span>{filteredCountries.length} résultat{filteredCountries.length > 1 ? "s" : ""}</span>
                    <span className="text-[10px] text-gray-400 font-normal">↵ Entrée pour choisir</span>
                  </div>

                  {searchSuggestions.length > 0 ? (
                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                      {searchSuggestions.map((country) => (
                        <button
                          key={country.iso3}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectCountry(country);
                          }}
                          className="w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-emerald-50 transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">
                              {country.flagEmoji}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-emerald-700 truncate">
                                {country.name}
                              </p>
                              <p className="text-[11px] text-gray-500 flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                                {country.capital} • {getLocalizedContinent(country.continent, language)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className="text-[10px] font-mono font-bold bg-gray-100 group-hover:bg-emerald-100 text-gray-600 group-hover:text-emerald-800 px-1.5 py-0.5 rounded">
                              {country.iso3}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-gray-500">
                      Aucun pays trouvé pour « <span className="font-semibold">{searchQuery}</span> »
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {/* VIEW 1: MAP 2D */}
        {viewMode === "map" && (
          <div
            className={`relative flex-1 rounded-2xl overflow-hidden border transition-colors shadow-inner min-h-[550px] flex flex-col ${
              fogOfWarActive
                ? "bg-[#0b1120] border-emerald-900/60"
                : "bg-sky-50 border-gray-200"
            }`}
          >
            {/* Map Controls & Fog of War Toggle */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-white/90 backdrop-blur-sm rounded-xl p-1.5 shadow-md border border-gray-200">
              <button
                onClick={() => setFogOfWarActive(!fogOfWarActive)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border mb-1 ${
                  fogOfWarActive
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200"
                }`}
                title="Activer/Désactiver le Brouillard de Guerre"
              >
                <span>🌫️ {fogOfWarActive ? "Brouillard ON" : "Brouillard"}</span>
              </button>

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

            {/* Active Search Floating Feedback on Map */}
            {isSearching && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-amber-500 text-white px-3.5 py-1.5 rounded-full shadow-lg border border-amber-400 flex items-center gap-2 text-xs font-bold animate-in fade-in">
                <span>🔍 {filteredCountries.length} résultat{filteredCountries.length > 1 ? "s" : ""}</span>
                {filteredCountries.length > 0 && filteredCountries.length <= 4 && (
                  <div className="flex items-center gap-1">
                    {filteredCountries.map((c) => (
                      <button
                        key={c.iso3}
                        onClick={() => handleSelectCountry(c)}
                        className="px-2 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-[11px] font-extrabold transition-colors cursor-pointer"
                        title={`Zoomer sur ${c.name}`}
                      >
                        {c.flagEmoji} {c.name}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setSearchQuery("")}
                  className="ml-1 text-white/90 hover:text-white underline text-[11px] cursor-pointer"
                >
                  Effacer
                </button>
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
                      const isConquered = country
                        ? isCountryConquered(country.iso3, user?.id)
                        : false;
                      const isMatch = matchingIsoSet
                        ? country
                          ? matchingIsoSet.has(country.iso3)
                          : false
                        : null;

                      let defaultFill = "#CBD5E1";
                      let defaultStroke = "#94A3B8";
                      let defaultOpacity = 1;

                      if (fogOfWarActive) {
                        if (isSelected) defaultFill = "#F59E0B";
                        else if (isMatch === true) defaultFill = "#F59E0B";
                        else if (isMatch === false) {
                          defaultFill = "#0F172A";
                          defaultOpacity = 0.35;
                        } else if (isHovered) defaultFill = isConquered ? "#34D399" : "#475569";
                        else defaultFill = isConquered ? "#10B981" : "#1E293B";

                        defaultStroke = isMatch === true
                          ? "#D97706"
                          : isConquered
                          ? "#6EE7B7"
                          : "#334155";
                      } else {
                        if (isSelected) defaultFill = "#059669";
                        else if (isMatch === true) defaultFill = "#F59E0B";
                        else if (isMatch === false) {
                          defaultFill = "#F1F5F9";
                          defaultOpacity = 0.35;
                        } else if (isHovered) defaultFill = "#34D399";
                        else if (country) defaultFill = "#E2E8F0";
                        else defaultFill = "#CBD5E1";

                        defaultStroke = isSelected
                          ? "#047857"
                          : isMatch === true
                          ? "#D97706"
                          : isMatch === false
                          ? "#E2E8F0"
                          : "#94A3B8";
                      }

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onClick={() => {
                            if (country) handleSelectCountry(country);
                          }}
                          onMouseEnter={() => {
                            if (country) setHoveredCountry(country);
                          }}
                          onMouseLeave={() => {
                            setHoveredCountry(null);
                          }}
                          style={{
                            default: {
                              fill: defaultFill,
                              stroke: defaultStroke,
                              strokeWidth: isSelected || isMatch === true ? 1.2 : fogOfWarActive && isConquered ? 0.6 : 0.4,
                              opacity: defaultOpacity,
                              outline: "none",
                              transition: "all 150ms ease",
                              cursor: country ? "pointer" : "default",
                            },
                            hover: {
                              fill: isMatch === true
                                ? "#D97706"
                                : fogOfWarActive
                                ? isConquered
                                  ? "#34D399"
                                  : "#64748B"
                                : "#10B981",
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

                {/* Repères pour micro-états et petites îles */}
                {MICROSTATES.map((micro) => {
                  const country = countryLookup.get(micro.iso3);
                  if (!country || !country.lng || !country.lat) return null;
                  const isSelected = selectedCountry?.iso3 === country.iso3;
                  const isMatch = matchingIsoSet ? matchingIsoSet.has(country.iso3) : null;
                  if (matchingIsoSet && isMatch === false) return null;

                  const markerRadius = Math.max(3, 4.5 / Math.sqrt(zoomPosition.zoom));

                  return (
                    <Marker
                      key={`micro-${country.iso3}`}
                      coordinates={[country.lng, country.lat]}
                      onClick={() => handleSelectCountry(country)}
                      onMouseEnter={() => setHoveredCountry(country)}
                      onMouseLeave={() => setHoveredCountry(null)}
                      className="cursor-pointer"
                    >
                      <circle
                        r={markerRadius + 1.2}
                        fill={isSelected ? "#059669" : isMatch === true ? "#F59E0B" : "#10B981"}
                        stroke="#FFFFFF"
                        strokeWidth={1.2}
                      />
                    </Marker>
                  );
                })}
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
            {/* Indication tactile en haut à gauche */}
            <div className="hidden sm:block absolute top-4 left-4 z-20 bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700 text-xs text-slate-300">
              🌍 {t("atlas.globeHint") || "Faites glisser pour tourner le globe. Cliquez sur un repère pour explorer."}
            </div>

            {/* 🛰️ Sélecteur de Calques Flottant en haut à droite */}
            <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700 shadow-xl overflow-x-auto max-w-[95%] sm:max-w-none">
              {GLOBE_LAYER_OPTIONS.map((layer) => {
                const isSelected = selectedGlobeLayer === layer.id;
                return (
                  <button
                    key={layer.id}
                    type="button"
                    onClick={() => setSelectedGlobeLayer(layer.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      isSelected
                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-105"
                        : "text-slate-300 hover:text-white hover:bg-slate-800"
                    }`}
                    title={layer.description}
                  >
                    <span>{layer.icon}</span>
                    <span className="hidden sm:inline">{layer.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            <Suspense
              fallback={
                <div className="text-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4" />
                  <p className="text-slate-400 font-medium text-sm">Chargement du globe 3D...</p>
                </div>
              }
            >
              <div
                className="w-full h-full flex items-center justify-center"
                style={themeConfig.canvasFilter ? { filter: themeConfig.canvasFilter } : undefined}
              >
                <GlobeComponent
                  ref={globeRef}
                  globeImageUrl={themeConfig.globeImageUrl}
                  bumpImageUrl={themeConfig.bumpImageUrl}
                  atmosphereColor={themeConfig.atmosphereColor}
                  atmosphereAltitude={themeConfig.atmosphereAltitude || 0.15}
                  backgroundColor="rgba(0,0,0,0)"
                  pointsData={filteredCountries}
                pointLat={(d: any) => d.lat}
                pointLng={(d: any) => d.lng}
                pointAltitude={0.06}
                pointRadius={(d: any) => (matchingIsoSet && matchingIsoSet.has(d.iso3) ? 1.2 : 0.7)}
                pointColor={(d: any) => (matchingIsoSet && matchingIsoSet.has(d.iso3) ? "#F59E0B" : "#10B981")}
                pointLabel={(d: any) =>
                  `<div style="background: rgba(15,23,42,0.9); color: #fff; padding: 6px 10px; border-radius: 8px; font-family: sans-serif; font-size: 12px; border: 1px solid #10B981;">
                    <strong>${d.flagEmoji} ${d.name}</strong><br/>
                    <span style="color: #94A3B8;">📍 ${d.capital}</span>
                  </div>`
                }
                onPointClick={(d: any) => handleSelectCountry(d as AtlasCountry)}
              />
            </div>
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
                  onClick={() => handleSelectCountry(c)}
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
                      {c.population > 0
                        ? new Intl.NumberFormat(language, { notation: "compact" }).format(c.population)
                        : "Inhabité"}
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

      {/* Country Comparison Modal (Versus & True Size) */}
      <CountryComparisonModal
        isOpen={showComparatorModal}
        initialCountryA={selectedCountry}
        onClose={() => setShowComparatorModal(false)}
        language={language}
      />
    </div>
  );
}
