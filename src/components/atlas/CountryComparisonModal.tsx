import { useState, useMemo, useEffect, useRef } from "react";
import {
  X,
  ArrowRightLeft,
  Search,
  Volume2,
  Music,
  Maximize2,
  Users,
  Coins,
  Languages,
  Mountain,
  Trophy,
  Layers,
  BarChart3,
  HelpCircle,
  Square,
  Swords,
  ChevronDown,
  RotateCw,
  Move,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Copy,
  Eye,
} from "lucide-react";
import {
  AtlasCountry,
  getAllAtlasCountries,
} from "../../lib/atlasData";
import {
  compareCountries,
  CountryComparisonResult,
} from "../../lib/countryComparator";
import {
  speakCountryAndCapital,
  playNationalAnthem,
  stopNationalAnthem,
} from "../../lib/countryAudio";
import { playClickSound } from "../../lib/soundManager";
import { generateTrueSizeSvgs } from "../../lib/trueSizeOverlay";

interface CountryComparisonModalProps {
  initialCountryA?: AtlasCountry | null;
  initialCountryB?: AtlasCountry | null;
  isOpen: boolean;
  onClose: () => void;
  language: string;
}

function DualGauge({
  valA,
  valB,
  labelA,
  labelB,
}: {
  valA: number;
  valB: number;
  labelA: string;
  labelB: string;
}) {
  const sum = (valA || 0) + (valB || 0);
  const pctA = sum > 0 ? Math.max(4, Math.min(96, Math.round((valA / sum) * 100))) : 50;
  const pctB = 100 - pctA;

  return (
    <div className="w-full mt-3 space-y-1">
      <div className="h-3 rounded-full bg-slate-100 p-0.5 overflow-hidden flex border border-slate-200 shadow-inner">
        <div
          style={{ width: `${pctA}%` }}
          className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
          title={`${labelA}: ${pctA}%`}
        />
        <div
          style={{ width: `${pctB}%` }}
          className="h-full bg-sky-500 rounded-r-full transition-all duration-500"
          title={`${labelB}: ${pctB}%`}
        />
      </div>
      <div className="flex justify-between items-center text-[10px] font-black font-mono">
        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
          {pctA}%
        </span>
        <span className="text-slate-400 font-normal text-[9px] uppercase tracking-wider">
          Répartition relative
        </span>
        <span className="text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
          {pctB}%
        </span>
      </div>
    </div>
  );
}

export function CountryComparisonModal({
  initialCountryA,
  initialCountryB,
  isOpen,
  onClose,
  language,
}: CountryComparisonModalProps) {
  const allCountries = useMemo(
    () => getAllAtlasCountries((language as any) || "fr"),
    [language]
  );

  const [countryA, setCountryA] = useState<AtlasCountry>(() => {
    return initialCountryA || allCountries.find((c) => c.iso3 === "CHE") || allCountries[0];
  });

  const [countryB, setCountryB] = useState<AtlasCountry>(() => {
    return (
      initialCountryB ||
      allCountries.find((c) => c.iso3 === "FRA") ||
      allCountries[1] ||
      allCountries[0]
    );
  });

  const [activeTab, setActiveTab] = useState<"truesize" | "metrics">("truesize");
  const [visualMode, setVisualMode] = useState<"overlay" | "sidebyside">("overlay");
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");
  const [isPickingA, setIsPickingA] = useState(false);
  const [isPickingB, setIsPickingB] = useState(false);

  // Contrôles interactifs True Size
  const [zoomMultiplier, setZoomMultiplier] = useState(1);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [overlayOpacity, setOverlayOpacity] = useState(0.75);
  const [topCountryChoice, setTopCountryChoice] = useState<"auto" | "A" | "B">("auto");
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showCloneGrid, setShowCloneGrid] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const [isPlayingAnthemA, setIsPlayingAnthemA] = useState(false);
  const [isPlayingAnthemB, setIsPlayingAnthemB] = useState(false);

  // Synchroniser si initialCountry change
  useEffect(() => {
    if (initialCountryA) setCountryA(initialCountryA);
  }, [initialCountryA]);

  useEffect(() => {
    if (initialCountryB) setCountryB(initialCountryB);
  }, [initialCountryB]);

  // Réinitialiser le positionnement et l'angle quand les pays changent
  useEffect(() => {
    setDragOffset({ x: 0, y: 0 });
    setRotationAngle(0);
    setShowCloneGrid(false);
  }, [countryA.iso3, countryB.iso3]);

  // Arrêter l'audio si la modale se ferme
  useEffect(() => {
    if (!isOpen) {
      stopNationalAnthem();
      setIsPlayingAnthemA(false);
      setIsPlayingAnthemB(false);
    }
  }, [isOpen]);

  const comparison: CountryComparisonResult = useMemo(() => {
    return compareCountries(countryA, countryB);
  }, [countryA, countryB]);

  // Calcul True Size SVG avec projection azimutale équivalente (Equal-Area)
  const trueSizeData = useMemo(() => {
    return generateTrueSizeSvgs(countryA, countryB, {
      width: 640,
      height: 420,
      zoomMultiplier,
      mode: visualMode,
    });
  }, [countryA, countryB, zoomMultiplier, visualMode]);

  if (!isOpen) return null;

  const handleSwap = () => {
    playClickSound();
    const temp = countryA;
    setCountryA(countryB);
    setCountryB(temp);
    setDragOffset({ x: 0, y: 0 });
    stopNationalAnthem();
    setIsPlayingAnthemA(false);
    setIsPlayingAnthemB(false);
  };

  const filteredListA = allCountries.filter(
    (c) =>
      c.name.toLowerCase().includes(searchA.toLowerCase()) ||
      c.capital.toLowerCase().includes(searchA.toLowerCase()) ||
      c.iso3.toLowerCase().includes(searchA.toLowerCase())
  );

  const filteredListB = allCountries.filter(
    (c) =>
      c.name.toLowerCase().includes(searchB.toLowerCase()) ||
      c.capital.toLowerCase().includes(searchB.toLowerCase()) ||
      c.iso3.toLowerCase().includes(searchB.toLowerCase())
  );

  const handlePlayAnthem = (isA: boolean) => {
    playClickSound();
    stopNationalAnthem();
    if (isA) {
      if (isPlayingAnthemA) {
        setIsPlayingAnthemA(false);
        return;
      }
      setIsPlayingAnthemB(false);
      setIsPlayingAnthemA(true);
      playNationalAnthem(countryA.iso3, () => setIsPlayingAnthemA(false));
    } else {
      if (isPlayingAnthemB) {
        setIsPlayingAnthemB(false);
        return;
      }
      setIsPlayingAnthemA(false);
      setIsPlayingAnthemB(true);
      playNationalAnthem(countryB.iso3, () => setIsPlayingAnthemB(false));
    }
  };

  // Détermine quel pays est au-dessus (par défaut le plus petit pour pouvoir le déplacer sur le plus grand)
  const isTopA =
    topCountryChoice === "A"
      ? true
      : topCountryChoice === "B"
      ? false
      : trueSizeData.smallerCountry === "A";

  const topCountryObj = isTopA ? countryA : countryB;
  const baseCountryObj = isTopA ? countryB : countryA;
  const topPath = isTopA ? trueSizeData.pathA : trueSizeData.pathB;
  const basePath = isTopA ? trueSizeData.pathB : trueSizeData.pathA;

  const largerCountryObj = trueSizeData.largerCountry === "A" ? countryA : countryB;
  const smallerCountryObj = trueSizeData.smallerCountry === "A" ? countryA : countryB;

  // Gestion du glisser-déposer de la silhouette (Desktop & Touch)
  const handleDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: clientX - dragOffset.x,
      y: clientY - dragOffset.y,
    };
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setDragOffset({
      x: clientX - dragStartRef.current.x,
      y: clientY - dragStartRef.current.y,
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[94vh] bg-white text-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden border-2 border-slate-200 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 p-4 sm:p-5 border-b-2 border-slate-200 shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-2xl bg-white/80 hover:bg-white text-slate-500 hover:text-slate-800 border border-slate-200 shadow-xs transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5 text-emerald-600" /> Duel Géographique • Atlas
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <span>Confrontation & True Size Interactif</span>
            <span className="text-xl">⚖️</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
            Superposez les pays l'un sur l'autre à leur échelle physique exacte pour mesurer leur gigantisme sans la distorsion Mercator.
          </p>

          {/* Versus Selection Cards */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] items-center gap-3">
            {/* Country A Capsule */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setIsPickingA(!isPickingA);
                  setIsPickingB(false);
                }}
                className="w-full p-3 rounded-2xl bg-white hover:bg-emerald-50/50 border-2 border-emerald-300 hover:border-emerald-400 text-left flex items-center justify-between transition group shadow-sm active:translate-y-0.5 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl drop-shadow-sm">{countryA.flagEmoji}</span>
                  <div>
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">
                      Pays A • {countryA.iso3}
                    </span>
                    <h3 className="text-base font-black text-slate-900 leading-tight flex items-center gap-1">
                      {countryA.name}
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </h3>
                  </div>
                </div>
                <Search className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
              </button>

              {/* Audio controls for Country A */}
              <div className="flex items-center gap-2 mt-1.5 px-1">
                <button
                  onClick={() => {
                    playClickSound();
                    speakCountryAndCapital(countryA.name, countryA.capital, countryA.iso3);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black flex items-center gap-1 transition shadow-xs cursor-pointer active:scale-95"
                  title="Prononciation locale"
                >
                  <Volume2 className="w-3 h-3 text-emerald-600" />
                  <span>Prononcer</span>
                </button>
                <button
                  onClick={() => handlePlayAnthem(true)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 transition cursor-pointer border shadow-xs active:scale-95 ${
                    isPlayingAnthemA
                      ? "bg-emerald-500 text-white border-emerald-600 animate-pulse"
                      : "bg-white hover:bg-emerald-50 text-slate-700 border-slate-200"
                  }`}
                  title="Hymne National"
                >
                  <Music className="w-3 h-3" />
                  <span>{isPlayingAnthemA ? "Arrêter Hymne" : "Hymne 🎶"}</span>
                </button>
              </div>

              {/* Country A Dropdown */}
              {isPickingA && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-2xl shadow-2xl z-30 p-2.5 max-h-64 overflow-y-auto">
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Chercher un pays..."
                      value={searchA}
                      onChange={(e) => setSearchA(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-emerald-500 font-bold"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1">
                    {filteredListA.slice(0, 35).map((c) => (
                      <button
                        key={c.iso3}
                        onClick={() => {
                          playClickSound();
                          setCountryA(c);
                          setIsPickingA(false);
                          setSearchA("");
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between hover:bg-emerald-50 text-slate-800 transition"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{c.flagEmoji}</span>
                          <span className="font-bold text-slate-800">{c.name}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold">{c.iso3}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Swap Button (3D Physical Button) */}
            <div className="flex justify-center">
              <button
                onClick={handleSwap}
                className="w-10 h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1 transition cursor-pointer"
                title="Inverser les deux pays"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Country B Capsule */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setIsPickingB(!isPickingB);
                  setIsPickingA(false);
                }}
                className="w-full p-3 rounded-2xl bg-white hover:bg-sky-50/50 border-2 border-sky-300 hover:border-sky-400 text-left flex items-center justify-between transition group shadow-sm active:translate-y-0.5 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl drop-shadow-sm">{countryB.flagEmoji}</span>
                  <div>
                    <span className="text-[10px] font-black text-sky-700 uppercase tracking-wider block">
                      Pays B • {countryB.iso3}
                    </span>
                    <h3 className="text-base font-black text-slate-900 leading-tight flex items-center gap-1">
                      {countryB.name}
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </h3>
                  </div>
                </div>
                <Search className="w-4 h-4 text-sky-600 group-hover:scale-110 transition" />
              </button>

              {/* Audio controls for Country B */}
              <div className="flex items-center gap-2 mt-1.5 px-1">
                <button
                  onClick={() => {
                    playClickSound();
                    speakCountryAndCapital(countryB.name, countryB.capital, countryB.iso3);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-white hover:bg-sky-50 text-sky-800 border border-sky-200 text-[10px] font-black flex items-center gap-1 transition shadow-xs cursor-pointer active:scale-95"
                  title="Prononciation locale"
                >
                  <Volume2 className="w-3 h-3 text-sky-600" />
                  <span>Prononcer</span>
                </button>
                <button
                  onClick={() => handlePlayAnthem(false)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 transition cursor-pointer border shadow-xs active:scale-95 ${
                    isPlayingAnthemB
                      ? "bg-sky-500 text-white border-sky-600 animate-pulse"
                      : "bg-white hover:bg-sky-50 text-slate-700 border-slate-200"
                  }`}
                  title="Hymne National"
                >
                  <Music className="w-3 h-3" />
                  <span>{isPlayingAnthemB ? "Arrêter Hymne" : "Hymne 🎶"}</span>
                </button>
              </div>

              {/* Country B Dropdown */}
              {isPickingB && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-200 rounded-2xl shadow-2xl z-30 p-2.5 max-h-64 overflow-y-auto">
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Chercher un pays..."
                      value={searchB}
                      onChange={(e) => setSearchB(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-sky-500 font-bold"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1">
                    {filteredListB.slice(0, 35).map((c) => (
                      <button
                        key={c.iso3}
                        onClick={() => {
                          playClickSound();
                          setCountryB(c);
                          setIsPickingB(false);
                          setSearchB("");
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left text-xs flex items-center justify-between hover:bg-sky-50 text-slate-800 transition"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{c.flagEmoji}</span>
                          <span className="font-bold text-slate-800">{c.name}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold">{c.iso3}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="bg-slate-50 px-5 py-2.5 border-b-2 border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playClickSound();
                setActiveTab("truesize");
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                activeTab === "truesize"
                  ? "bg-indigo-600 text-white shadow-md border-b-2 border-indigo-800"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Superposition True Size 📐</span>
            </button>

            <button
              onClick={() => {
                playClickSound();
                setActiveTab("metrics");
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                activeTab === "metrics"
                  ? "bg-indigo-600 text-white shadow-md border-b-2 border-indigo-800"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Duel de Statistiques 📊</span>
            </button>
          </div>

          {activeTab === "truesize" && (
            <div className="flex items-center gap-1 text-xs bg-slate-200/70 p-1 rounded-xl">
              <button
                onClick={() => {
                  playClickSound();
                  setVisualMode("overlay");
                }}
                className={`px-3 py-1 rounded-lg font-black text-[11px] transition ${
                  visualMode === "overlay" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Superposition 🎯
              </button>
              <button
                onClick={() => {
                  playClickSound();
                  setVisualMode("sidebyside");
                }}
                className={`px-3 py-1 rounded-lg font-black text-[11px] transition ${
                  visualMode === "sidebyside" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Côte à Côte
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Duel Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
          {activeTab === "truesize" ? (
            /* True Size Tab : Terrain de Jeu TheTrueSize */
            <div className="space-y-4 animate-fade-in">
              {/* Insight Text & Direct Multiplier Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border-2 border-emerald-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="text-3xl drop-shadow-sm">📐</span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 leading-snug">
                      {largerCountryObj.name} {largerCountryObj.flagEmoji} est{" "}
                      <span className="text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-lg font-mono text-base font-black">
                        {trueSizeData.ratio.toFixed(1)}x
                      </span>{" "}
                      plus vaste que {smallerCountryObj.name} {smallerCountryObj.flagEmoji}
                    </h4>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      {smallerCountryObj.name} occupe seulement{" "}
                      <strong className="text-slate-900">
                        {((1 / trueSizeData.ratio) * 100).toFixed(1)}%
                      </strong>{" "}
                      de sa surface. Glissez la silhouette pour la tester sur différentes régions !
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-3 py-1 rounded-xl bg-white text-emerald-800 border-2 border-emerald-300 font-black text-xs shadow-xs font-mono">
                    1 : {trueSizeData.ratio.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Graphic True Size Playground with SVG Equal-Area Silhouette Canvas */}
              <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden flex flex-col">
                {/* Interactive Toolbar for Overlay Mode */}
                <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                  {/* Left: Re-center & Switch Layers */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {visualMode === "overlay" && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            playClickSound();
                            setDragOffset({ x: 0, y: 0 });
                          }}
                          className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-black border border-slate-300 text-[11px] shadow-2xs flex items-center gap-1 active:scale-95 transition cursor-pointer"
                          title="Remettre la silhouette mobile au centre"
                        >
                          <RefreshCw className="w-3 h-3 text-emerald-600" />
                          <span>Recentrer</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            playClickSound();
                            setTopCountryChoice(isTopA ? "B" : "A");
                          }}
                          className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-black border border-slate-300 text-[11px] shadow-2xs flex items-center gap-1 active:scale-95 transition cursor-pointer"
                          title="Inverser quel pays est placé au-dessus"
                        >
                          <ArrowRightLeft className="w-3 h-3 text-sky-600" />
                          <span>Mettre {isTopA ? countryB.name : countryA.name} dessus</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            playClickSound();
                            setRotationAngle((a) => (a + 45) % 360);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-black border border-slate-300 text-[11px] shadow-2xs flex items-center gap-1 active:scale-95 transition cursor-pointer"
                          title="Faire pivoter la silhouette de 45°"
                        >
                          <RotateCw className="w-3 h-3 text-indigo-600" />
                          <span>Pivoter ({rotationAngle}°)</span>
                        </button>

                        {trueSizeData.ratio >= 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              playClickSound();
                              setShowCloneGrid(!showCloneGrid);
                            }}
                            className={`px-2.5 py-1 rounded-xl font-black border text-[11px] shadow-2xs flex items-center gap-1 active:scale-95 transition cursor-pointer ${
                              showCloneGrid
                                ? "bg-emerald-600 text-white border-emerald-700"
                                : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
                            }`}
                            title="Visualiser combien de fois le petit pays remplit le grand"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Remplissage ({Math.min(25, Math.floor(trueSizeData.ratio))}x)</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Right: Zoom & Opacity */}
                  <div className="flex items-center gap-2">
                    {visualMode === "overlay" && (
                      <div className="hidden md:flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-xl border border-slate-300 shadow-2xs">
                        <Eye className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px] font-bold text-slate-500">Transparence</span>
                        <input
                          type="range"
                          min="0.3"
                          max="0.95"
                          step="0.05"
                          value={overlayOpacity}
                          onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                          className="w-16 h-1.5 accent-emerald-600 cursor-pointer"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-300 shadow-2xs">
                      <button
                        onClick={() => {
                          playClickSound();
                          setZoomMultiplier((z) => Math.max(0.6, z - 0.2));
                        }}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition"
                        title="Zoom arrière"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono font-bold text-slate-600 px-1">
                        {Math.round(zoomMultiplier * 100)}%
                      </span>
                      <button
                        onClick={() => {
                          playClickSound();
                          setZoomMultiplier((z) => Math.min(2.5, z + 0.2));
                        }}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition"
                        title="Zoom avant"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* SVG Visualizer Area */}
                <div
                  className="relative min-h-[380px] sm:min-h-[420px] bg-gradient-to-b from-slate-50 via-white to-slate-50 flex items-center justify-center p-2 overflow-hidden"
                  style={{
                    backgroundImage: `radial-gradient(circle at 50% 50%, #E2E8F0 1.5px, transparent 1.5px)`,
                    backgroundSize: "24px 24px",
                  }}
                >
                  {/* Floating drag indicator hint on overlay mode */}
                  {visualMode === "overlay" && (
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border-2 border-slate-200 text-xs font-black shadow-xs pointer-events-none">
                      <Move className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                      <span>
                        Silhouette mobile :{" "}
                        <strong className="text-emerald-700">
                          {topCountryObj.flagEmoji} {topCountryObj.name}
                        </strong>{" "}
                        (Glissez pour déplacer)
                      </span>
                    </div>
                  )}

                  {/* SVG Canvas for High-Precision True Size Equal-Area Outlines */}
                  <svg
                    viewBox="0 0 640 420"
                    className="w-full h-auto max-h-[460px] select-none touch-none"
                    onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
                    onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
                    onMouseUp={handleDragEnd}
                    onMouseLeave={handleDragEnd}
                    onTouchStart={(e) => {
                      if (e.touches.length > 0) handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
                    }}
                    onTouchMove={(e) => {
                      if (e.touches.length > 0) handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
                    }}
                    onTouchEnd={handleDragEnd}
                  >
                    <defs>
                      <filter id="trueSizeShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity="0.16" />
                      </filter>
                      <filter id="dragTopShadow" x="-30%" y="-30%" width="160%" height="160%">
                        <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#047857" floodOpacity="0.3" />
                      </filter>
                    </defs>

                    {visualMode === "overlay" ? (
                      /* MODE SUPERPOSITION (L'un sur l'autre) */
                      <>
                        {/* 1. Base Country (En-dessous, fixe) */}
                        <g filter="url(#trueSizeShadow)" className="transition-all duration-300">
                          <path
                            d={basePath}
                            fill={isTopA ? "#38bdf8" : "#34d399"}
                            fillOpacity={0.3}
                            stroke={isTopA ? "#0284c7" : "#059669"}
                            strokeWidth={2.5}
                            strokeLinejoin="round"
                          />
                        </g>

                        {/* 2. Clones optionnels pour voir le volume de remplissage */}
                        {showCloneGrid &&
                          trueSizeData.cloneCoordinates.map((c, idx) => (
                            <g
                              key={idx}
                              transform={`translate(${c.x}, ${c.y})`}
                              opacity={0.35}
                              className="pointer-events-none"
                            >
                              <path
                                d={isTopA ? trueSizeData.pathA : trueSizeData.pathB}
                                fill={isTopA ? "#10b981" : "#0284c7"}
                                stroke="#ffffff"
                                strokeWidth={1}
                              />
                            </g>
                          ))}

                        {/* 3. Top Country (Au-dessus, glissable & orientable) */}
                        <g
                          transform={`translate(${dragOffset.x}, ${dragOffset.y}) rotate(${rotationAngle}, 320, 210)`}
                          filter="url(#dragTopShadow)"
                          className={`transition-transform duration-75 ${
                            isDragging ? "cursor-grabbing scale-102" : "cursor-grab"
                          }`}
                        >
                          <path
                            d={topPath}
                            fill={isTopA ? "#10b981" : "#0284c7"}
                            fillOpacity={overlayOpacity}
                            stroke={isTopA ? "#047857" : "#0369a1"}
                            strokeWidth={3}
                            strokeLinejoin="round"
                            strokeDasharray={isDragging ? "5,3" : undefined}
                          />

                          {/* Petit repère central sur le pays mobile */}
                          <circle cx={320} cy={210} r={4} fill="#ffffff" stroke="#047857" strokeWidth={2} />
                        </g>

                        {/* Labels en filigrane */}
                        <text
                          x={20}
                          y={400}
                          fill="#64748b"
                          fontSize="11"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          Fond : {baseCountryObj.flagEmoji} {baseCountryObj.name} ({baseCountryObj.areaKm2?.toLocaleString("fr-FR")} km²)
                        </text>

                        <text
                          x={20}
                          y={380}
                          fill={isTopA ? "#047857" : "#0369a1"}
                          fontSize="11"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          Superposé : {topCountryObj.flagEmoji} {topCountryObj.name} ({topCountryObj.areaKm2?.toLocaleString("fr-FR")} km²)
                        </text>
                      </>
                    ) : (
                      /* MODE CÔTE À CÔTE (Comparaison parallèle) */
                      <>
                        {/* Country A on Left */}
                        <g filter="url(#trueSizeShadow)">
                          <path
                            d={trueSizeData.pathA}
                            fill="#34d399"
                            fillOpacity={0.4}
                            stroke="#059669"
                            strokeWidth={2.5}
                            strokeLinejoin="round"
                          />
                        </g>

                        {/* Country B on Right */}
                        <g filter="url(#trueSizeShadow)">
                          <path
                            d={trueSizeData.pathB}
                            fill="#38bdf8"
                            fillOpacity={0.4}
                            stroke="#0284c7"
                            strokeWidth={2.5}
                            strokeLinejoin="round"
                          />
                        </g>

                        {/* Labels côte à côte */}
                        <text
                          x={180}
                          y={390}
                          textAnchor="middle"
                          fill="#065f46"
                          fontSize="12"
                          fontWeight="bold"
                        >
                          {countryA.flagEmoji} {countryA.name} ({countryA.areaKm2?.toLocaleString("fr-FR")} km²)
                        </text>

                        <text
                          x={460}
                          y={390}
                          textAnchor="middle"
                          fill="#075985"
                          fontSize="12"
                          fontWeight="bold"
                        >
                          {countryB.flagEmoji} {countryB.name} ({countryB.areaKm2?.toLocaleString("fr-FR")} km²)
                        </text>
                      </>
                    )}
                  </svg>
                </div>

                {/* Bottom interactive legend */}
                <div className="bg-slate-50 p-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-mono gap-2">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block border border-emerald-600" />
                      <strong className="text-slate-700">{countryA.name}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-sky-500 inline-block border border-sky-600" />
                      <strong className="text-slate-700">{countryB.name}</strong>
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Projection azimutale équivalente de Lambert (Equal-Area) • 1 km² = même nombre exact de pixels.
                  </span>
                </div>
              </div>

              {/* Mercator Explanation Callout */}
              <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 space-y-1.5 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-black text-amber-700 uppercase tracking-wider">
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  <span>Pourquoi les cartes du monde trompent notre regard ?</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sur les mappemondes usuelles (projection de Mercator), l'étirement augmente exponentiellement avec la latitude :
                  le Groenland semble aussi grand que l'Afrique alors que <strong>l'Afrique est en réalité 14 fois plus grande</strong>.
                  Ici, l'échelle azimutale équivalente restitue rigoureusement la surface terrestre en kilomètres carrés réels.
                </p>
              </div>
            </div>
          ) : (
            /* Confrontation Table (Metrics Tab) */
            <div className="space-y-4 animate-fade-in">
              {/* Metric 1: Population */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-sm hover:border-slate-300 transition">
                <div className="flex items-center justify-between text-xs font-black text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-600" />
                    Population Totale
                  </span>
                  {comparison.population.ratioDescription && (
                    <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-amber-200">
                      {comparison.population.ratioDescription}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div
                    className={`p-3.5 rounded-xl border-2 transition ${
                      comparison.population.winner === "A"
                        ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-500 block mb-0.5">{countryA.name}</span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-base sm:text-lg font-black font-mono">
                        {comparison.population.formattedA}
                      </span>
                      {comparison.population.winner === "A" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                          <Trophy className="w-3 h-3 text-amber-500 fill-amber-500" /> Vainqueur
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border-2 transition ${
                      comparison.population.winner === "B"
                        ? "bg-sky-50/80 border-sky-300 text-sky-950 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-500 block mb-0.5">{countryB.name}</span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-base sm:text-lg font-black font-mono">
                        {comparison.population.formattedB}
                      </span>
                      {comparison.population.winner === "B" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded-full">
                          <Trophy className="w-3 h-3 text-amber-500 fill-amber-500" /> Vainqueur
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <DualGauge
                  valA={comparison.population.valueA}
                  valB={comparison.population.valueB}
                  labelA={countryA.name}
                  labelB={countryB.name}
                />
              </div>

              {/* Metric 2: Area */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-sm hover:border-slate-300 transition">
                <div className="flex items-center justify-between text-xs font-black text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Maximize2 className="w-4 h-4 text-teal-600" />
                    Superficie Réelle (km²)
                  </span>
                  {comparison.area.ratioDescription && (
                    <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-amber-200">
                      {comparison.area.ratioDescription}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div
                    className={`p-3.5 rounded-xl border-2 transition ${
                      comparison.area.winner === "A"
                        ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-500 block mb-0.5">{countryA.name}</span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-base sm:text-lg font-black font-mono">
                        {comparison.area.formattedA}
                      </span>
                      {comparison.area.winner === "A" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                          <Trophy className="w-3 h-3 text-amber-500 fill-amber-500" /> Plus vaste
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border-2 transition ${
                      comparison.area.winner === "B"
                        ? "bg-sky-50/80 border-sky-300 text-sky-950 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-500 block mb-0.5">{countryB.name}</span>
                    <div className="flex items-baseline justify-between">
                      <span className="text-base sm:text-lg font-black font-mono">
                        {comparison.area.formattedB}
                      </span>
                      {comparison.area.winner === "B" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-sky-700 bg-sky-100/80 px-2 py-0.5 rounded-full">
                          <Trophy className="w-3 h-3 text-amber-500 fill-amber-500" /> Plus vaste
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <DualGauge
                  valA={comparison.area.valueA}
                  valB={comparison.area.valueB}
                  labelA={countryA.name}
                  labelB={countryB.name}
                />
              </div>

              {/* Metric 3: Density */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-sm hover:border-slate-300 transition">
                <div className="flex items-center justify-between text-xs font-black text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Square className="w-4 h-4 text-sky-600" />
                    Densité de Population (hab/km²)
                  </span>
                  {comparison.density.ratioDescription && (
                    <span className="bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-indigo-200">
                      {comparison.density.ratioDescription}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div
                    className={`p-3.5 rounded-xl border-2 transition ${
                      comparison.density.winner === "A"
                        ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-500 block mb-0.5">{countryA.name}</span>
                    <span className="text-base sm:text-lg font-black font-mono">
                      {comparison.density.formattedA}
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border-2 transition ${
                      comparison.density.winner === "B"
                        ? "bg-sky-50/80 border-sky-300 text-sky-950 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-500 block mb-0.5">{countryB.name}</span>
                    <span className="text-base sm:text-lg font-black font-mono">
                      {comparison.density.formattedB}
                    </span>
                  </div>
                </div>

                <DualGauge
                  valA={comparison.density.valueA}
                  valB={comparison.density.valueB}
                  labelA={countryA.name}
                  labelB={countryB.name}
                />
              </div>

              {/* Metric 4: Peak */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-slate-200 shadow-sm hover:border-slate-300 transition">
                <div className="flex items-center justify-between text-xs font-black text-slate-700 mb-3">
                  <span className="flex items-center gap-1.5">
                    <Mountain className="w-4 h-4 text-amber-600" />
                    Point Culminant Noté
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50 border-2 border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 block mb-0.5">{countryA.name}</span>
                    <span className="font-black text-slate-900 text-sm">{comparison.highestPeak.formattedA}</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border-2 border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 block mb-0.5">{countryB.name}</span>
                    <span className="font-black text-slate-900 text-sm">{comparison.highestPeak.formattedB}</span>
                  </div>
                </div>
              </div>

              {/* Metric 5: Currencies & Languages */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Monnaies */}
                <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-sm space-y-2">
                  <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-emerald-600" /> Monnaies
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-emerald-700 block">{countryA.name} :</span>
                      <p className="font-black text-slate-800">
                        {comparison.currencies.listA.join(", ") || "Non renseignée"}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-sky-700 block">{countryB.name} :</span>
                      <p className="font-black text-slate-800">
                        {comparison.currencies.listB.join(", ") || "Non renseignée"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Langues */}
                <div className="p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-sm space-y-2">
                  <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                    <Languages className="w-4 h-4 text-indigo-600" /> Langues officielles
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-emerald-700 block">{countryA.name} :</span>
                      <p className="font-black text-slate-800">
                        {comparison.languages.listA.join(", ") || "Non renseignée"}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-sky-700 block">{countryB.name} :</span>
                      <p className="font-black text-slate-800">
                        {comparison.languages.listB.join(", ") || "Non renseignée"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t-2 border-slate-200 flex justify-end">
          <button
            onClick={() => {
              playClickSound();
              onClose();
            }}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 transition shadow-sm cursor-pointer"
          >
            Fermer le Duel
          </button>
        </div>
      </div>
    </div>
  );
}
