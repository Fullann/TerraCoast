import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, X, RotateCcw, Check, ChevronRight, ArrowLeft } from "lucide-react";
import {
  type BoosterPack,
  type CardContinent,
  RARITY_CONFIG,
} from "../../lib/cardsData";
import {
  openBoosterPack,
  type DrawnCard,
} from "../../lib/cardsManager";
import { getPlayerGamificationState } from "../../lib/gamificationManager";
import { CollectibleCard } from "./CollectibleCard";
import { triggerConfetti } from "../common/Confetti";
import {
  playRareCardFanfare,
  playCardFlipSound,
  playBoosterTearSound,
  playRipCompleteSound,
  playSound,
} from "../../lib/soundManager";
import {
  CONTINENT_TRANSLATIONS,
} from "../../lib/cardsTranslationService";
import { useLanguage } from "../../contexts/LanguageContext";
import { toast } from "../common/ToastContainer";

interface BoosterOpeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  pack: BoosterPack;
  userId?: string;
  onPackOpened?: () => void;
}

interface MysteryBoosterOption {
  id: number;
  name: string;
  subtitle: string;
  charm: string;
  serial: string;
  borderHover: string;
  glowHover: string;
}

const MYSTERY_BOOSTERS: MysteryBoosterOption[] = [
  {
    id: 0,
    name: "Booster Alpha",
    subtitle: "L'Audacieux",
    charm: "Étoile Polaire 🧭",
    serial: "#TC-084-A",
    borderHover: "hover:border-sky-400 hover:ring-2 hover:ring-sky-400/50",
    glowHover: "hover:shadow-[0_0_35px_rgba(56,189,248,0.5)]",
  },
  {
    id: 1,
    name: "Booster Stellaire",
    subtitle: "Le Prédestiné",
    charm: "Sceau Doré 👑",
    serial: "#TC-592-B",
    borderHover: "hover:border-amber-400 hover:ring-2 hover:ring-amber-400/60",
    glowHover: "hover:shadow-[0_0_40px_rgba(245,158,11,0.6)]",
  },
  {
    id: 2,
    name: "Booster Phénix",
    subtitle: "L'Instinctif",
    charm: "Flamme Cosmique 🔥",
    serial: "#TC-317-C",
    borderHover: "hover:border-pink-400 hover:ring-2 hover:ring-pink-400/50",
    glowHover: "hover:shadow-[0_0_35px_rgba(236,72,153,0.5)]",
  },
];

export function BoosterOpeningModal({
  isOpen,
  onClose,
  pack,
  userId,
  onPackOpened,
}: BoosterOpeningModalProps) {
  const { language } = useLanguage();
  const [selectedContinent, setSelectedContinent] = useState<CardContinent>("Europe");
  const [stage, setStage] = useState<"pick" | "ready" | "revealing" | "summary">("pick");
  const [selectedBoosterIndex, setSelectedBoosterIndex] = useState<number>(1);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [totalDustEarned, setTotalDustEarned] = useState(0);
  const [celebratingCard, setCelebratingCard] = useState<DrawnCard | null>(null);

  const handleSelectBooster = (index: number) => {
    setSelectedBoosterIndex(index);
    playSound("click");
    setStage("ready");
  };

  // État de la déchirure tactile interactive
  const [tearProgress, setTearProgress] = useState(0); // 0 à 100%
  const [isDraggingTear, setIsDraggingTear] = useState(false);
  const [isTorn, setIsTorn] = useState(false);

  const stripTrackRef = useRef<HTMLDivElement>(null);
  const lastSoundProgressRef = useRef(0);

  const gamification = getPlayerGamificationState(userId);
  const canAfford = pack.category === "daily" || gamification.gems >= pack.priceGems;

  // Déclenche l'ouverture complète du booster avec effets et sons
  const triggerPackOpening = useCallback(() => {
    if (isTorn) return;
    setIsTorn(true);
    setTearProgress(100);
    playRipCompleteSound();
    triggerConfetti();

    const res = openBoosterPack(
      userId,
      pack.id,
      pack.requiresContinentChoice ? selectedContinent : undefined
    );

    if (!res.success) {
      toast.error(res.message);
      setIsTorn(false);
      setTearProgress(0);
      return;
    }

    setDrawnCards(res.cards);
    setTotalDustEarned(res.totalStardustEarned);
    setRevealedIndices(new Set());

    // Après l'animation de jaillissement des cartes, passage fluide à la révélation
    setTimeout(() => {
      setStage("revealing");
      onPackOpened?.();
    }, 1100);
  }, [isTorn, userId, pack.id, pack.requiresContinentChoice, selectedContinent, onPackOpened]);

  // Gestion du glissement tactile (souris & toucher)
  const updateTearPosition = useCallback((clientX: number) => {
    if (!stripTrackRef.current || isTorn) return;
    const rect = stripTrackRef.current.getBoundingClientRect();
    const progress = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    setTearProgress(progress);

    // Bruitage granulaire de déchirement de papier/foil à intervalles réguliers
    if (Math.abs(progress - lastSoundProgressRef.current) > 12) {
      lastSoundProgressRef.current = progress;
      playBoosterTearSound(progress / 100);
    }

    // Si déchiré à plus de 82%, le pack s'ouvre complètement
    if (progress >= 82) {
      setIsDraggingTear(false);
      triggerPackOpening();
    }
  }, [isTorn, triggerPackOpening]);

  const handleTearStart = (clientX: number) => {
    if (isTorn || !canAfford) return;
    setIsDraggingTear(true);
    updateTearPosition(clientX);
  };

  // Écouteurs globaux pour un glissement naturel hors du conteneur
  useEffect(() => {
    if (!isDraggingTear) return;

    const handleMouseMove = (e: MouseEvent) => {
      updateTearPosition(e.clientX);
    };

    const handleMouseUp = () => {
      setIsDraggingTear(false);
      if (tearProgress >= 65) {
        triggerPackOpening();
      } else {
        // Retour élastique
        setTearProgress(0);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        updateTearPosition(e.touches[0].clientX);
      }
    };

    const handleTouchEnd = () => {
      setIsDraggingTear(false);
      if (tearProgress >= 65) {
        triggerPackOpening();
      } else {
        setTearProgress(0);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDraggingTear, tearProgress, updateTearPosition, triggerPackOpening]);

  if (!isOpen) return null;

  const handleRevealCard = (idx: number) => {
    if (revealedIndices.has(idx)) return;
    const newRevealed = new Set(revealedIndices);
    newRevealed.add(idx);
    setRevealedIndices(newRevealed);

    const cardDrawn = drawnCards[idx];
    const isRarePlus = cardDrawn.card.rarity !== "common" || cardDrawn.isShiny;

    if (isRarePlus) {
      playRareCardFanfare(cardDrawn.card.rarity, cardDrawn.isShiny);
      triggerConfetti();
      setCelebratingCard(cardDrawn);
    } else {
      playCardFlipSound();
      if (newRevealed.size === drawnCards.length) {
        setTimeout(() => {
          setStage("summary");
        }, 1200);
      }
    }
  };

  const handleDismissCelebration = () => {
    setCelebratingCard(null);
    if (revealedIndices.size === drawnCards.length) {
      setTimeout(() => {
        setStage("summary");
      }, 700);
    }
  };

  const handleRevealAll = () => {
    const allSet = new Set<number>();
    drawnCards.forEach((_, i) => allSet.add(i));
    setRevealedIndices(allSet);

    const highestRarityCard = drawnCards.reduce<DrawnCard | null>((acc, curr) => {
      const rank = { common: 1, rare: 2, epic: 3, legendary: 4, mythic: 5 };
      if (!acc) return curr;
      return rank[curr.card.rarity] > rank[acc.card.rarity] ? curr : acc;
    }, null);

    if (highestRarityCard && (highestRarityCard.card.rarity !== "common" || highestRarityCard.isShiny)) {
      playRareCardFanfare(highestRarityCard.card.rarity, highestRarityCard.isShiny);
      triggerConfetti();
    } else {
      playSound("success");
    }

    setTimeout(() => {
      setStage("summary");
    }, 1100);
  };

  const handleResetForAnother = () => {
    setStage("pick");
    setIsTorn(false);
    setTearProgress(0);
    setDrawnCards([]);
    setRevealedIndices(new Set());
    setTotalDustEarned(0);
    setCelebratingCard(null);
  };

  // Aura d'éclat adaptée au tier du booster
  const packTierAura =
    pack.category === "mythic"
      ? "shadow-[0_0_60px_rgba(245,158,11,0.45)] ring-2 ring-amber-400/60"
      : pack.category === "continental"
      ? "shadow-[0_0_50px_rgba(168,85,247,0.45)] ring-2 ring-purple-400/60"
      : pack.category === "starter"
      ? "shadow-[0_0_50px_rgba(59,130,246,0.4)] ring-2 ring-sky-400/50"
      : "shadow-[0_0_50px_rgba(16,185,129,0.4)] ring-2 ring-emerald-400/50";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-slate-950 border-2 border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-5xl p-5 sm:p-8 flex flex-col items-center justify-between text-white relative min-h-[540px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton de Fermeture */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors z-30 border border-slate-700 cursor-pointer shadow-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── STAGE 0 : CHOIX DU BOOSTER PARMI PLUSIEURS PACKS ── */}
        {stage === "pick" && (
          <div className="flex flex-col items-center text-center my-auto space-y-5 w-full py-2 animate-fade-in">
            {/* En-tête de sélection */}
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-300 bg-amber-950/80 border border-amber-600/80 px-3.5 py-1 rounded-full shadow-inner inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-current" />
                <span>ÉTAPE 1 : CHOISISSEZ VOTRE BOOSTER</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-current" />
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-2 text-white drop-shadow-sm">
                3 Paquets Disponibles dans cette Édition
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg mx-auto">
                Chaque booster possède son propre alignement céleste. Faites confiance à votre intuition : <span className="text-amber-300 font-bold">sélectionnez celui que vous souhaitez déchirer !</span>
              </p>
            </div>

            {/* Sélecteur de continent si requis */}
            {pack.requiresContinentChoice && (
              <div className="w-full max-w-lg bg-slate-900/90 p-3.5 rounded-2xl border border-slate-700/80 shadow-md">
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Choisissez le continent ciblé pour vos 3 boosters :
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-xs">
                  {(["Europe", "Asie", "Afrique", "Amériques", "Océanie"] as CardContinent[]).map(
                    (cont) => (
                      <button
                        key={cont}
                        type="button"
                        onClick={() => setSelectedContinent(cont)}
                        className={`py-1.5 px-2 rounded-xl font-black transition-all cursor-pointer ${
                          selectedContinent === cont
                            ? "bg-purple-600 text-white shadow-md border border-purple-400"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                        }`}
                      >
                        {CONTINENT_TRANSLATIONS[language]?.[cont] || cont}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Rangée des 3 Boosters Scellés */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full py-2">
              {MYSTERY_BOOSTERS.map((booster, idx) => (
                <div
                  key={booster.id}
                  onClick={() => handleSelectBooster(idx)}
                  className={`group relative w-60 sm:w-64 h-[350px] sm:h-[390px] rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 cursor-pointer border-2 border-white/20 select-none ${booster.borderHover} ${booster.glowHover} hover:-translate-y-2 hover:scale-[1.03] active:scale-[0.98] ${
                    idx === 1 ? "sm:-translate-y-2 sm:ring-1 sm:ring-amber-400/40" : ""
                  }`}
                >
                  {/* Dentelé métallique haut */}
                  <div className="w-full h-3 bg-gradient-to-r from-slate-400 via-white to-slate-400 booster-crimp-pattern booster-sawtooth-top shrink-0 relative z-20 shadow-xs" />

                  {/* Chapeau du booster */}
                  <div className={`w-full py-2 px-3 bg-gradient-to-br ${pack.gradient} flex items-center justify-between text-[10px] font-black uppercase text-white/90 shrink-0 relative overflow-hidden z-10`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full pointer-events-none group-hover:animate-foil-shine" />
                    <span className="font-mono text-amber-200">{booster.serial}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 border border-white/30 text-white">
                      #{idx + 1}
                    </span>
                  </div>

                  {/* Corps principal foil */}
                  <div className={`w-full flex-1 bg-gradient-to-br ${pack.gradient} p-4 flex flex-col items-center justify-between text-center relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent w-full h-full pointer-events-none group-hover:animate-foil-shine" />

                    {/* Badge titre variant */}
                    <div className="relative z-10">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-black/40 border border-amber-400/40 px-2.5 py-0.5 rounded-full inline-block">
                        {booster.subtitle}
                      </span>
                      <h3 className="font-black text-white text-base sm:text-lg mt-1 drop-shadow">
                        {booster.name}
                      </h3>
                    </div>

                    {/* Icône centrale */}
                    <div className="my-auto relative z-10 flex flex-col items-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-md border border-white/40 shadow-xl flex items-center justify-center text-4xl sm:text-5xl group-hover:scale-110 transition-transform">
                        {pack.icon}
                      </div>
                      <span className="text-[10px] font-bold text-white/90 mt-2 px-2.5 py-0.5 rounded-full bg-slate-950/50 border border-white/20">
                        {booster.charm}
                      </span>
                    </div>

                    {/* Bouton de sélection */}
                    <div className="w-full relative z-10 pt-1">
                      <button
                        type="button"
                        className="w-full py-2 rounded-xl bg-white text-slate-950 hover:bg-amber-300 group-hover:bg-amber-400 font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer border border-white/80"
                      >
                        <span>Choisir ce Pack</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Dentelé métallique bas */}
                  <div className="w-full h-3 bg-gradient-to-r from-slate-400 via-white to-slate-400 booster-crimp-pattern booster-sawtooth-bottom shrink-0 relative z-20 shadow-xs" />
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400 italic">
              ✦ Cliquez sur le paquet de votre choix pour le poser sur le plan de déchirure ✦
            </p>
          </div>
        )}

        {/* ── STAGE 1 : DÉCOUVERTE DU PACK CHOISI & DÉCHIRURE TACTILE ── */}
        {stage === "ready" && (
          <div className="flex flex-col items-center text-center my-auto space-y-4 w-full max-w-lg animate-fade-in">
            {/* Barre de retour et d'info du booster choisi */}
            <div className="w-full flex items-center justify-between gap-2 px-1">
              <button
                type="button"
                onClick={() => setStage("pick")}
                className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Changer de paquet</span>
              </button>

              <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 bg-amber-950/80 border border-amber-600/80 px-3 py-1 rounded-full shadow-inner inline-flex items-center gap-1">
                <span>✦</span>
                <span>{MYSTERY_BOOSTERS[selectedBoosterIndex]?.name || "Booster"} ({MYSTERY_BOOSTERS[selectedBoosterIndex]?.charm || ""})</span>
                <span>✦</span>
              </span>
            </div>

            {/* En-tête exclusif de l'édition */}
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-300 bg-amber-950/80 border border-amber-600/80 px-3.5 py-1 rounded-full shadow-inner inline-flex items-center gap-1.5">
                <span>✦</span>
                <span>{pack.badge || "Édition Collector Officielle"}</span>
                <span>✦</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-2 text-white drop-shadow-sm">
                {pack.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto">
                {pack.description}
              </p>
            </div>

            {/* Sélecteur de continent si requis */}
            {pack.requiresContinentChoice && (
              <div className="w-full bg-slate-900/90 p-3.5 rounded-2xl border border-slate-700/80 shadow-md">
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Choisissez le continent ciblé :
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {(["Europe", "Asie", "Afrique", "Amériques", "Océanie"] as CardContinent[]).map(
                    (cont) => (
                      <button
                        key={cont}
                        type="button"
                        onClick={() => setSelectedContinent(cont)}
                        className={`py-1.5 px-2 rounded-xl font-black transition-all cursor-pointer ${
                          selectedContinent === cont
                            ? "bg-purple-600 text-white shadow-md border border-purple-400"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                        }`}
                      >
                        {CONTINENT_TRANSLATIONS[language]?.[cont] || cont}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* ── PAQUET DE CARTES FOIL HAUTE JOAILLERIE AVEC DÉCHIRURE TACTILE ── */}
            <div className="relative flex flex-col items-center my-2 select-none">
              <div
                className={`w-56 sm:w-64 h-[360px] sm:h-[400px] rounded-2xl relative overflow-hidden flex flex-col justify-between transition-all duration-300 ${packTierAura} ${
                  !isDraggingTear && !isTorn ? "animate-foil-float" : ""
                }`}
              >
                {/* 1. CRIMP SERRÉ DU HAUT (Dents de scie métalliques) */}
                <div className="w-full h-3.5 bg-gradient-to-r from-slate-400 via-white to-slate-400 booster-crimp-pattern booster-sawtooth-top shrink-0 relative z-30 shadow-xs" />

                {/* 2. CHAPEAU DÉTACHABLE DU BOOSTER (Foil Cap qui vole lors de la déchirure) */}
                <div
                  style={{
                    transform: isTorn
                      ? undefined
                      : `rotate(${-tearProgress * 0.12}deg) translateY(${-tearProgress * 0.08}px)`,
                    transformOrigin: "top left",
                  }}
                  className={`w-full h-16 sm:h-20 bg-gradient-to-br ${pack.gradient} px-4 py-2 flex flex-col justify-between relative overflow-hidden z-20 ${
                    isTorn ? "animate-tear-peel" : "transition-transform duration-75"
                  }`}
                >
                  {/* Balayage de reflet foil */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent w-full h-full pointer-events-none animate-foil-shine" />

                  <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-white/90">
                    <span>★ ★</span>
                    <span className="drop-shadow">TERRACOAST PRESTIGE</span>
                    <span>★ ★</span>
                  </div>

                  <div className="text-center font-mono font-black text-[10px] text-amber-200 tracking-wider">
                    {pack.cardsCount} CARTES COLLECTOR
                  </div>
                </div>

                {/* 3. BANDEAU DE DÉCHIRURE TACTILE INTERACTIVE (La fente de déchirure) */}
                <div
                  ref={stripTrackRef}
                  onMouseDown={(e) => handleTearStart(e.clientX)}
                  onTouchStart={(e) => {
                    if (e.touches.length > 0) handleTearStart(e.touches[0].clientX);
                  }}
                  className="w-full h-9 bg-slate-950/95 border-y-2 border-dashed border-amber-300/80 relative flex items-center justify-between px-3 cursor-grab active:cursor-grabbing z-30 overflow-hidden shadow-lg select-none touch-none"
                  title="Glissez de gauche à droite pour déchirer le pack"
                >
                  {/* Fente d'ouverture lumineuse progressive */}
                  <div
                    style={{ width: `${tearProgress}%` }}
                    className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-amber-400/40 via-amber-300/80 to-amber-100 pointer-events-none transition-all duration-75 flex items-center justify-end"
                  >
                    <div className="w-2 h-full bg-white shadow-[0_0_12px_#fff]" />
                  </div>

                  {/* Ciseaux à gauche */}
                  <span className="text-sm select-none z-10 animate-pulse">✂️</span>

                  {/* Curseur de traction doré tactile */}
                  <div
                    style={{ left: `${Math.min(88, Math.max(3, tearProgress))}%` }}
                    className="absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 border-2 border-white shadow-[0_0_14px_rgba(251,191,36,0.9)] flex items-center justify-center text-slate-950 font-black text-xs transition-all duration-75 z-20"
                  >
                    <ChevronRight className="w-4 h-4 fill-current stroke-[3]" />
                  </div>

                  {/* Indication textuelle sur le strip */}
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 drop-shadow ml-auto z-10">
                    {isDraggingTear
                      ? `${Math.round(tearProgress)}% Déchiré !`
                      : "Glissez pour déchirer ➔"}
                  </span>
                </div>

                {/* 4. JAILLISSEMENT DES CARTES QUAND LE PACK EST DÉCHIRÉ */}
                {isTorn && (
                  <div className="absolute inset-x-0 top-12 z-25 flex items-center justify-center pointer-events-none animate-cards-emerge">
                    {/* Éventail de 3 cartes émergeant du paquet */}
                    <div className="relative w-28 h-40">
                      {/* Carte gauche */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-900 to-purple-900 border-2 border-amber-400 shadow-2xl -rotate-12 -translate-x-6 -translate-y-4" />
                      {/* Carte droite */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-900 to-rose-900 border-2 border-amber-400 shadow-2xl rotate-12 translate-x-6 -translate-y-4" />
                      {/* Carte centrale héro */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-white shadow-2xl -translate-y-8 flex flex-col items-center justify-center text-amber-300 text-3xl font-black">
                        <span>✨</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. CORPS PRINCIPAL DU PACK FOIL MÉTALLIQUE */}
                <div
                  className={`w-full flex-1 bg-gradient-to-br ${pack.gradient} p-4 flex flex-col items-center justify-between text-center relative overflow-hidden z-10`}
                >
                  {/* Balayage de reflet lumineux continu */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full pointer-events-none animate-foil-shine" />

                  {/* Emblème central et icône 3D */}
                  <div className="my-auto flex flex-col items-center relative z-10">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/20 backdrop-blur-md border border-white/40 shadow-xl flex items-center justify-center text-5xl sm:text-6xl drop-shadow-2xl mb-2 transform hover:scale-105 transition-transform">
                      {pack.icon}
                    </div>

                    <h3 className="font-serif font-black text-white text-lg sm:text-xl tracking-wide drop-shadow-md">
                      TerraCards
                    </h3>

                    {/* Sceau d'authenticité / Wax Seal */}
                    <div className="mt-1 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-[9px] font-black uppercase tracking-widest text-amber-200">
                      <span>👑</span>
                      <span>100% Officiel</span>
                    </div>
                  </div>

                  {/* Pied du booster avec prix ou gratuité */}
                  <div className="w-full py-1.5 rounded-xl bg-slate-950/40 backdrop-blur-xs border border-white/20 text-[11px] font-black text-white relative z-10">
                    {pack.priceGems > 0 ? `${pack.priceGems} 💎` : "GRATUIT"}
                  </div>
                </div>

                {/* 6. CRIMP SERRÉ DU BAS (Dents de scie métalliques) */}
                <div className="w-full h-3.5 bg-gradient-to-r from-slate-400 via-white to-slate-400 booster-crimp-pattern booster-sawtooth-bottom shrink-0 relative z-30 shadow-xs" />
              </div>

              {/* Message d'aide interactif sous le pack */}
              <p className="text-[11px] text-amber-300/90 font-bold mt-3 animate-pulse flex items-center gap-1.5">
                <span>✂️</span>
                <span>Faites glisser votre doigt ou la souris sur la ligne pointillée pour déchirer !</span>
              </p>
            </div>

            {/* Bouton d'action principal (accessible d'un clic également) */}
            <button
              type="button"
              disabled={!canAfford || isTorn}
              onClick={triggerPackOpening}
              className={`w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                canAfford && !isTorn
                  ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white active:scale-95 border border-emerald-400/50"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              }`}
            >
              <Sparkles className="w-4 h-4 fill-current text-amber-300" />
              <span>
                {pack.priceGems === 0
                  ? "Déchirer le Booster Gratuit !"
                  : canAfford
                  ? `Déchirer le Booster (${pack.priceGems} 💎)`
                  : `Manque ${pack.priceGems - gamification.gems} 💎`}
              </span>
            </button>
          </div>
        )}

        {/* ── STAGE 2 : RÉVÉLATION CARTE PAR CARTE (DOS EXPLORATEUR PRESTIGE) ── */}
        {stage === "revealing" && (
          <div className="flex flex-col items-center w-full my-auto space-y-6">
            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-black text-white flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400 fill-current" />
                <span>Révélez vos Trésors Géographiques !</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Touchez chaque carte scellée pour découvrir son identité ({revealedIndices.size} / {drawnCards.length})
              </p>
            </div>

            {/* Rangée des cartes tirées */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 w-full">
              {drawnCards.map((drawn, idx) => {
                const isRevealed = revealedIndices.has(idx);
                const rarityMeta = RARITY_CONFIG[drawn.card.rarity];

                return (
                  <div key={idx} className="flex flex-col items-center">
                    {isRevealed ? (
                      <div className="animate-scale-up flex flex-col items-center">
                        <CollectibleCard
                          card={drawn.card}
                          isUnlocked={true}
                          entry={{ count: 1, firstAcquiredAt: Date.now(), shiny: drawn.isShiny }}
                          size="sm"
                          interactive={false}
                          showFlipButton={false}
                        />
                        <div className="mt-2 text-center">
                          {drawn.isNew ? (
                            <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-500 text-white font-black text-[10px] uppercase tracking-wider shadow-sm animate-bounce">
                              Nouveau ! ✨
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700 font-black text-[10px]">
                              +{drawn.stardustEarned} 🪐 Doublon
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* DOS DE CARTE EXPLORATEUR ROYALE SCELLÉE */
                      <div
                        onClick={() => handleRevealCard(idx)}
                        className={`w-44 h-64 rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-[3.5px] ${rarityMeta.borderClass} ${rarityMeta.glowClass} flex flex-col items-center justify-between p-3.5 cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-2xl relative overflow-hidden group select-none`}
                      >
                        {/* Lueur et filigrane dorés */}
                        <div className="absolute inset-0 bg-radial from-white/10 to-transparent pointer-events-none" />
                        <div className="absolute inset-2 rounded-2xl border border-amber-500/30 pointer-events-none" />

                        {/* Coins ornementaux */}
                        <div className="absolute top-2 left-2 text-amber-500/50 font-serif text-[9px] pointer-events-none">⌜</div>
                        <div className="absolute top-2 right-2 text-amber-500/50 font-serif text-[9px] pointer-events-none">⌝</div>
                        <div className="absolute bottom-2 left-2 text-amber-500/50 font-serif text-[9px] pointer-events-none">⌞</div>
                        <div className="absolute bottom-2 right-2 text-amber-500/50 font-serif text-[9px] pointer-events-none">⌟</div>

                        {/* En-tête dos de carte */}
                        <div className="flex items-center justify-between w-full px-1 text-[10px] font-mono font-black text-amber-400">
                          <span>✦ TC ✦</span>
                          <span className="text-[9px] uppercase tracking-wider text-slate-400">TerraDex</span>
                          <span>✦ TC ✦</span>
                        </div>

                        {/* Rose des vents centrale dorée */}
                        <div className="my-auto flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/10 border-2 border-amber-400/60 flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 group-hover:rotate-45 transition-all duration-300">
                            🧭
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-amber-300/90 mt-2 font-serif">
                            TerraCoast
                          </span>
                        </div>

                        {/* Bouton d'action tactile */}
                        <div className="w-full py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-400/40 text-center text-[10px] font-black text-amber-300 uppercase tracking-wider group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors shadow-sm flex items-center justify-center gap-1">
                          <Sparkles className="w-3 h-3 fill-current" />
                          <span>Toucher pour révéler</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bouton pour tout révéler d'un coup */}
            {revealedIndices.size < drawnCards.length && (
              <button
                type="button"
                onClick={handleRevealAll}
                className="text-xs font-bold text-slate-400 hover:text-white underline decoration-slate-600 transition-colors cursor-pointer"
              >
                Tout révéler d'un coup
              </button>
            )}
          </div>
        )}

        {/* ── STAGE 3 : RÉSUMÉ DU TIRAGE ── */}
        {stage === "summary" && (
          <div className="flex flex-col items-center w-full my-auto space-y-6">
            <div className="text-center">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3.5 py-1 rounded-full shadow-inner inline-flex items-center gap-1.5">
                <span>✨</span>
                <span>Tirage Terminé avec Succès !</span>
                <span>✨</span>
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white mt-2">
                Vos Nouvelles Cartes
              </h3>
              {totalDustEarned > 0 && (
                <p className="text-xs sm:text-sm text-purple-300 font-bold mt-1">
                  +{totalDustEarned} Poussières d'Étoile 🪐 collectées grâce aux doublons !
                </p>
              )}
            </div>

            {/* Grille des cartes obtenues */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-h-[50vh] overflow-y-auto p-2">
              {drawnCards.map((drawn, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <CollectibleCard
                    card={drawn.card}
                    isUnlocked={true}
                    entry={{ count: 1, firstAcquiredAt: Date.now(), shiny: drawn.isShiny }}
                    size="sm"
                    interactive={false}
                    showFlipButton={false}
                  />
                  <div className="mt-1.5 text-center">
                    {drawn.isNew ? (
                      <span className="text-[10px] font-black text-emerald-400">
                        Nouveau !
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-purple-400">
                        +{drawn.stardustEarned} 🪐
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/40"
              >
                <Check className="w-4 h-4" />
                <span>Ajouter à mon TerraDex</span>
              </button>

              {pack.category !== "daily" && canAfford && (
                <button
                  type="button"
                  onClick={handleResetForAnother}
                  className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>En ouvrir un autre ({pack.priceGems} 💎)</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── 🌟 CELEBRATION SPOTLIGHT OVERLAY POUR LES CARTES RARES ── */}
        {celebratingCard && (
          <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/92 backdrop-blur-xl p-4 overflow-hidden animate-fade-in select-none cursor-pointer"
            onClick={handleDismissCelebration}
          >
            {/* Flash cinématographique sur l'écran */}
            <div className="absolute inset-0 bg-white pointer-events-none animate-screen-flash z-30" />

            {/* Rayons de soleil radiaux tournoyants (Sunburst) */}
            <div
              style={{
                background:
                  celebratingCard.card.rarity === "mythic" || celebratingCard.isShiny
                    ? "radial-gradient(circle, rgba(236,72,153,0.35) 0%, transparent 65%), conic-gradient(from 0deg, #ec4899 0deg, #a855f7 45deg, #3b82f6 90deg, #10b981 135deg, #f59e0b 180deg, #ec4899 225deg, #a855f7 270deg, #3b82f6 315deg, #ec4899 360deg)"
                    : celebratingCard.card.rarity === "legendary"
                    ? "radial-gradient(circle, rgba(245,158,11,0.45) 0%, transparent 65%), conic-gradient(from 0deg, rgba(245,158,11,0.9) 0deg 20deg, transparent 20deg 40deg, rgba(251,191,36,0.9) 40deg 60deg, transparent 60deg 80deg, rgba(245,158,11,0.9) 80deg 100deg, transparent 100deg 120deg, rgba(251,191,36,0.9) 120deg 140deg, transparent 140deg 160deg, rgba(245,158,11,0.9) 160deg 180deg, transparent 180deg 200deg, rgba(251,191,36,0.9) 200deg 220deg, transparent 220deg 240deg, rgba(245,158,11,0.9) 240deg 260deg, transparent 260deg 280deg, rgba(251,191,36,0.9) 280deg 300deg, transparent 300deg 320deg, rgba(245,158,11,0.9) 320deg 340deg, transparent 340deg 360deg)"
                    : celebratingCard.card.rarity === "epic"
                    ? "radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 65%), conic-gradient(from 0deg, rgba(168,85,247,0.85) 0deg 20deg, transparent 20deg 40deg, rgba(192,132,252,0.85) 40deg 60deg, transparent 60deg 80deg, rgba(147,51,234,0.85) 80deg 100deg, transparent 100deg 120deg, rgba(192,132,252,0.85) 120deg 140deg, transparent 140deg 160deg, rgba(168,85,247,0.85) 160deg 180deg, transparent 180deg 200deg, rgba(192,132,252,0.85) 200deg 220deg, transparent 220deg 240deg, rgba(147,51,234,0.85) 240deg 260deg, transparent 260deg 280deg, rgba(168,85,247,0.85) 280deg 300deg, transparent 300deg 320deg, rgba(192,132,252,0.85) 320deg 340deg, transparent 340deg 360deg)"
                    : "radial-gradient(circle, rgba(14,165,233,0.4) 0%, transparent 65%), conic-gradient(from 0deg, rgba(14,165,233,0.8) 0deg 20deg, transparent 20deg 40deg, rgba(56,189,248,0.8) 40deg 60deg, transparent 60deg 80deg, rgba(2,132,199,0.8) 80deg 100deg, transparent 100deg 120deg, rgba(56,189,248,0.8) 120deg 140deg, transparent 140deg 160deg, rgba(14,165,233,0.8) 160deg 180deg, transparent 180deg 200deg, rgba(56,189,248,0.8) 200deg 220deg, transparent 220deg 240deg, rgba(2,132,199,0.8) 240deg 260deg, transparent 260deg 280deg, rgba(14,165,233,0.8) 280deg 300deg, transparent 300deg 320deg, rgba(56,189,248,0.8) 320deg 340deg, transparent 340deg 360deg)",
              }}
              className="w-[520px] h-[520px] sm:w-[740px] sm:h-[740px] rounded-full absolute pointer-events-none animate-sunburst-spin opacity-75 mix-blend-screen"
            />

            {/* Particules flottantes */}
            <div className="absolute top-1/4 left-1/4 text-3xl animate-sparkle-1 pointer-events-none">✨</div>
            <div className="absolute top-1/3 right-1/4 text-4xl animate-sparkle-2 pointer-events-none">⭐</div>
            <div className="absolute bottom-1/4 left-1/3 text-3xl animate-sparkle-3 pointer-events-none">💫</div>
            <div className="absolute bottom-1/3 right-1/3 text-4xl animate-sparkle-1 pointer-events-none">🌟</div>

            {/* Conteneur principal avec animation slam */}
            <div
              className="relative z-40 flex flex-col items-center text-center animate-rarity-slam max-w-sm sm:max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Bannière de célébration */}
              <div className="mb-4 flex flex-col items-center gap-1.5">
                {celebratingCard.card.rarity === "mythic" ? (
                  <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-amber-500 text-white font-black text-xs sm:text-sm uppercase tracking-widest shadow-2xl border border-white/60 animate-bounce flex items-center gap-1.5">
                    <span>🌈</span>
                    <span>TIRAGE MYTHIQUE ! (0.5%)</span>
                    <span>🌈</span>
                  </span>
                ) : celebratingCard.card.rarity === "legendary" ? (
                  <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs sm:text-sm uppercase tracking-widest shadow-2xl border border-amber-300 animate-bounce flex items-center gap-1.5">
                    <span>👑</span>
                    <span>TIRAGE LÉGENDAIRE !</span>
                    <span>👑</span>
                  </span>
                ) : celebratingCard.card.rarity === "epic" ? (
                  <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs sm:text-sm uppercase tracking-widest shadow-2xl border border-purple-300 animate-bounce flex items-center gap-1.5">
                    <span>🔮</span>
                    <span>CARTE ÉPIQUE !</span>
                    <span>🔮</span>
                  </span>
                ) : (
                  <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black text-xs sm:text-sm uppercase tracking-widest shadow-2xl border border-sky-300 animate-bounce flex items-center gap-1.5">
                    <span>⭐</span>
                    <span>CARTE RARE !</span>
                    <span>⭐</span>
                  </span>
                )}

                {celebratingCard.isShiny && (
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-300 via-pink-400 to-cyan-400 text-slate-950 font-black text-[11px] sm:text-xs uppercase tracking-wider shadow-lg animate-pulse flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    <span>VERSION HOLOGRAPHIQUE SHINY !</span>
                  </span>
                )}
              </div>

              {/* Carte héros */}
              <div className="filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex items-center justify-center shrink-0">
                <CollectibleCard
                  card={celebratingCard.card}
                  entry={{ count: 1, firstAcquiredAt: Date.now(), shiny: celebratingCard.isShiny }}
                  isUnlocked={true}
                  size="md"
                  interactive={true}
                  showFlipButton={false}
                />
              </div>

              {/* Statut d'acquisition */}
              <div className="mt-4">
                {celebratingCard.isNew ? (
                  <span className="px-4 py-1.5 rounded-full bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg animate-pulse">
                    Nouvelle Découverte TerraDex ! ✨
                  </span>
                ) : (
                  <span className="px-4 py-1.5 rounded-full bg-purple-900/90 text-purple-200 border border-purple-500 font-black text-xs uppercase tracking-wider shadow-lg">
                    +{celebratingCard.stardustEarned} Poussières d'Étoile 🪐
                  </span>
                )}
              </div>

              {/* Bouton Continuer */}
              <button
                type="button"
                onClick={handleDismissCelebration}
                className="mt-6 px-8 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer border-2 border-white/80"
              >
                <span>Continuer</span>
                <Sparkles className="w-4 h-4 text-amber-500 fill-current" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

