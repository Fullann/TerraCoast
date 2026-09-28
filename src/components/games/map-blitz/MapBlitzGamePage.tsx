import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import worldMapData from "world-atlas/countries-110m.json";
import {
  ArrowLeft,
  Timer,
  Trophy,
  RotateCcw,
  Share2,
} from "lucide-react";
import { getAllAtlasCountries, AtlasCountry } from "../../../lib/atlasData";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAuth } from "../../../contexts/AuthContext";
import { playSound } from "../../../lib/soundManager";
import { triggerConfetti } from "../../common/Confetti";
import { toast } from "../../common/ToastContainer";
import { addGems } from "../../../lib/gamificationManager";

// Normalisation du texte (minuscule, sans accents, sans tirets)
function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// Aliases fréquents pour reconnaissance instantanée
const ALIASES: Record<string, string[]> = {
  USA: ["usa", "etatsunis", "unitedstates", "amerique", "etatsunisdamerique"],
  GBR: ["uk", "royaumeuni", "unitedkingdom", "angleterre", "grandebretagne"],
  COD: ["rdc", "congordc", "congothe", "republiquedemocratiqueducongo", "zaire"],
  COG: ["congo", "congobrazzaville", "republiqueducongo"],
  ARE: ["emirats", "eau", "uae", "emiratsarabesunis"],
  CAF: ["centrafrique", "republiquecentrafricaine"],
  DOM: ["repdom", "republiquedominicaine"],
  BIH: ["bosnie", "bosnieherzegovine"],
  KOR: ["coree", "coreedusud", "southkorea"],
  PRK: ["coreedunord", "northkorea"],
  CIV: ["cotedivoire", "ivorycoast"],
  STP: ["saotome", "saotomeetprincipe"],
  FSM: ["micronesie"],
  MKD: ["macedoine", "macedoinedunord"],
  SWZ: ["eswatini", "swaziland"],
  CZE: ["tchequie", "republiquetcheque"],
  NLD: ["paysbas", "hollande", "netherlands"],
  RUS: ["russie", "russia", "federationderussie"],
};

const CONTINENT_CONFIGS: Record<string, { center: [number, number]; zoom: number; label: string }> = {
  all: { center: [0, 20], zoom: 1, label: "Monde Entier 🌍" },
  Europe: { center: [15, 52], zoom: 2.8, label: "Europe 🇪🇺" },
  Africa: { center: [20, 5], zoom: 1.8, label: "Afrique 🌍" },
  Asia: { center: [95, 32], zoom: 1.8, label: "Asie 🌏" },
  Americas: { center: [-75, 12], zoom: 1.5, label: "Amériques 🌎" },
  Oceania: { center: [140, -22], zoom: 2.2, label: "Océanie 🌊" },
};

export function MapBlitzGamePage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { profile } = useAuth();

  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [discoveredIsoSet, setDiscoveredIsoSet] = useState<Set<string>>(new Set());
  const [inputText, setInputText] = useState("");
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [lastDiscovered, setLastDiscovered] = useState<AtlasCountry | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const allCountries = useMemo(() => getAllAtlasCountries(language as any), [language]);

  // Index de recherche
  const countryLookup = useMemo(() => {
    const map = new Map<string, AtlasCountry>();
    for (const c of allCountries) {
      if (c.numericCode) map.set(String(Number(c.numericCode)), c);
      map.set(c.iso3.toUpperCase(), c);
      map.set(c.name.toLowerCase(), c);
    }
    return map;
  }, [allCountries]);

  // Pays ciblés selon la région choisie
  const targetCountries = useMemo(() => {
    if (selectedRegion === "all") return allCountries;
    return allCountries.filter((c) => c.continent === selectedRegion);
  }, [allCountries, selectedRegion]);

  // Démarrer ou réinitialiser le jeu
  const handleStartGame = (region: string = selectedRegion) => {
    setSelectedRegion(region);
    setDiscoveredIsoSet(new Set());
    setInputText("");
    setTimeLeft(600);
    setIsRunning(true);
    setIsGameOver(false);
    setLastDiscovered(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Compte à rebours 10 min
  useEffect(() => {
    if (!isRunning || isGameOver) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsRunning(false);
          setIsGameOver(true);
          playSound("wrong");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, isGameOver]);

  // Vérification instantanée à la saisie de texte
  const handleInputChange = (val: string) => {
    setInputText(val);
    if (!isRunning || isGameOver) return;

    const cleaned = normalizeText(val);
    if (cleaned.length < 2) return;

    // Trouver un pays cible non encore découvert
    for (const c of targetCountries) {
      if (discoveredIsoSet.has(c.iso3)) continue;

      const normName = normalizeText(c.name);
      const normOfficial = normalizeText(c.officialName);
      const normIso = normalizeText(c.iso3);
      const aliases = ALIASES[c.iso3] || [];

      const isMatch =
        cleaned === normName ||
        cleaned === normOfficial ||
        cleaned === normIso ||
        aliases.includes(cleaned);

      if (isMatch) {
        // Découverte réussie !
        const newSet = new Set(discoveredIsoSet);
        newSet.add(c.iso3);
        setDiscoveredIsoSet(newSet);
        setInputText("");
        setLastDiscovered(c);
        playSound("correct");

        // Victoire totale ?
        if (newSet.size >= targetCountries.length) {
          setIsGameOver(true);
          setIsRunning(false);
          playSound("fanfare");
          triggerConfetti();
          addGems(profile?.id, 50);
          toast.success("INCROYABLE ! Vous avez nommé TOUS les pays ! (+50 💎)");
        }
        break;
      }
    }
  };

  const handleGiveUp = () => {
    setIsGameOver(true);
    setIsRunning(false);
    playSound("wrong");
    toast.info("Partie terminée ! Les pays manqués sont affichés en rouge.");
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

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = Math.round((discoveredIsoSet.size / targetCountries.length) * 100);

  const regionConfig = CONTINENT_CONFIGS[selectedRegion] || CONTINENT_CONFIGS.all;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-4 px-3 sm:px-6 pb-28 flex flex-col">
      <div className="max-w-7xl mx-auto w-full space-y-4 flex-1 flex flex-col">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border-2 border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/games")}
              className="p-2.5 rounded-2xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 transition-all shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
                <span>Blind Map Blitz</span>
                <span className="text-amber-500">⚡</span>
              </h1>
              <p className="text-xs text-slate-500 font-bold">
                Nommez tous les pays de la carte en 10 minutes ! Illuminez la mappemonde.
              </p>
            </div>
          </div>

          {/* Chrono & Compteur */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Timer */}
            <div
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-sm font-black border transition-all ${
                timeLeft <= 60
                  ? "bg-rose-50 border-rose-300 text-rose-700 animate-pulse"
                  : "bg-slate-100 border-slate-200 text-slate-800"
              }`}
            >
              <Timer className="w-4 h-4 text-amber-500" />
              <span>
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
            </div>

            {/* Score */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl text-sm font-black bg-emerald-50 border border-emerald-200 text-emerald-800">
              <Trophy className="w-4 h-4 text-emerald-600" />
              <span>
                {discoveredIsoSet.size} / {targetCountries.length} ({progressPercent}%)
              </span>
            </div>

            {/* Actions */}
            {isRunning && (
              <button
                type="button"
                onClick={handleGiveUp}
                className="px-3.5 py-2 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-black transition-all"
              >
                Abandonner
              </button>
            )}

            <button
              type="button"
              onClick={() => handleStartGame()}
              className="p-2.5 rounded-2xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 transition-all"
              title="Recommencer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Region Filter Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none bg-white p-2 rounded-2xl border-2 border-slate-200/80 shadow-xs">
          {Object.entries(CONTINENT_CONFIGS).map(([key, conf]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleStartGame(key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                selectedRegion === key
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {conf.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="bg-white rounded-3xl p-4 border-2 border-slate-200/90 flex flex-col sm:flex-row items-center gap-3 shadow-xs">
          <div className="relative flex-1 w-full">
            <input
              ref={inputRef}
              type="text"
              disabled={isGameOver}
              value={inputText}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={
                isGameOver
                  ? "Partie terminée ! Cliquez sur Recommencer pour rejouer."
                  : "Tapez le nom d'un pays (ex: France, Japon, Brésil...)"
              }
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-3.5 text-slate-800 placeholder-slate-400 font-bold text-sm focus:border-emerald-500 focus:bg-white focus:outline-none transition-all disabled:opacity-50"
              autoFocus
            />
          </div>

          {/* Flash Feedback du dernier pays trouvé */}
          {lastDiscovered && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-black animate-bounce shrink-0">
              <span className="text-xl">{lastDiscovered.flagEmoji}</span>
              <span>{lastDiscovered.name} validé !</span>
            </div>
          )}
        </div>

        {/* Carte Vectorielle Interactive 2D */}
        <div className="relative flex-1 min-h-[420px] bg-[#E0F2FE]/40 rounded-3xl border-2 border-slate-200/90 overflow-hidden flex flex-col items-center justify-center p-2 shadow-xs">
          <ComposableMap
            projection="geoEqualEarth"
            width={980}
            height={500}
            className="w-full h-full max-h-[550px]"
          >
            <ZoomableGroup center={regionConfig.center} zoom={regionConfig.zoom}>
              <Geographies geography={worldMapData as any}>
                {({ geographies }: { geographies: any[] }) =>
                  geographies.map((geo: any) => {
                    const country = findCountryForGeography(geo);
                    const isDiscovered = country && discoveredIsoSet.has(country.iso3);
                    const isMissed = isGameOver && country && !isDiscovered;

                    let fillColor = "#CBD5E1"; // Slate 300 par défaut (terre douce)
                    let strokeColor = "#94A3B8";

                    if (isDiscovered) {
                      fillColor = "#10B981"; // Vert émeraude éclatant
                      strokeColor = "#059669";
                    } else if (isMissed) {
                      fillColor = "#F43F5E"; // Rose vif raté
                      strokeColor = "#BE123C";
                    }

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        style={{
                          default: {
                            fill: fillColor,
                            stroke: strokeColor,
                            strokeWidth: 0.6,
                            outline: "none",
                            transition: "all 250ms ease",
                          },
                          hover: {
                            fill: isDiscovered ? "#059669" : isMissed ? "#E11D48" : "#94A3B8",
                            stroke: "#64748B",
                            strokeWidth: 1.2,
                            outline: "none",
                            cursor: "pointer",
                          },
                          pressed: { outline: "none" },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>

          {/* Légende en bas à droite */}
          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3 text-xs font-black">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Trouvé ({discoveredIsoSet.size})
            </span>
            {isGameOver && (
              <span className="flex items-center gap-1.5 text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                Manqué ({targetCountries.length - discoveredIsoSet.size})
              </span>
            )}
          </div>
        </div>

        {/* Modal de Fin de Partie */}
        {isGameOver && (
          <div className="bg-white border-3 border-emerald-500 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="text-4xl">
              {progressPercent >= 80 ? "🏆" : progressPercent >= 50 ? "🥈" : "📚"}
            </div>
            <h3 className="text-2xl font-black text-slate-800">
              {progressPercent === 100
                ? "SCORE PARFAIT ! Mappemonde Complétée !"
                : `Partie Terminée : ${discoveredIsoSet.size} / ${targetCountries.length} Pays Trouvés`}
            </h3>
            <p className="text-sm text-slate-500 font-medium">
              Précision de complétion : <strong>{progressPercent}%</strong> • Temps restant :{" "}
              <strong>
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </strong>
            </p>

            <div className="flex justify-center gap-3 flex-wrap pt-2">
              <button
                type="button"
                onClick={() => handleStartGame()}
                className="py-3 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-2xl border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                <span>Rejouer ({regionConfig.label})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const share = `⚡ TerraCoast Blind Map Blitz (${regionConfig.label})\nScore : ${discoveredIsoSet.size}/${targetCountries.length} pays (${progressPercent}%)\nJoue gratuitement sur https://terracoast.ch/games/map-blitz`;
                  navigator.clipboard.writeText(share);
                  toast.success("Score copié !");
                }}
                className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-2xl border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 flex items-center gap-2 transition-all"
              >
                <Share2 className="w-4 h-4 stroke-[2.5]" />
                <span>Partager mon Score 📲</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
