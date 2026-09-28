import React, { useState } from "react";
import {
  X,
  Sparkles,
  Lock,
  Share2,
  Check,
  MapPin,
  Users,
  Coins,
  Compass,
  Award,
  Download,
  Copy,
  Loader2,
} from "lucide-react";
import type { ConquestCard, ConquestRarity } from "../../lib/conquestManager";
import { useAuth } from "../../contexts/AuthContext";
import {
  drawConquestCollectorCard,
  downloadCanvasImage,
  copyCanvasImageToClipboard,
} from "../../lib/visualShareCard";
import { toast } from "../common/ToastContainer";

interface ConquestCardModalProps {
  card: ConquestCard | null;
  onClose: () => void;
  onPlayCountryQuiz?: (iso3: string) => void;
}

const RARITY_THEMES: Record<
  ConquestRarity,
  {
    badgeLabel: string;
    borderGradient: string;
    headerBg: string;
    textColor: string;
    glowShadow: string;
    icon: string;
  }
> = {
  legendary: {
    badgeLabel: "LÉGENDAIRE",
    borderGradient: "from-amber-400 via-yellow-300 to-amber-600",
    headerBg: "from-amber-950/80 via-yellow-900/50 to-slate-900",
    textColor: "text-amber-300",
    glowShadow: "shadow-[0_0_35px_rgba(245,158,11,0.45)]",
    icon: "⭐",
  },
  epic: {
    badgeLabel: "ÉPIQUE",
    borderGradient: "from-purple-400 via-pink-400 to-indigo-600",
    headerBg: "from-purple-950/80 via-indigo-900/50 to-slate-900",
    textColor: "text-purple-300",
    glowShadow: "shadow-[0_0_35px_rgba(168,85,247,0.45)]",
    icon: "💎",
  },
  rare: {
    badgeLabel: "RARE",
    borderGradient: "from-blue-400 via-cyan-400 to-teal-600",
    headerBg: "from-blue-950/80 via-cyan-900/50 to-slate-900",
    textColor: "text-cyan-300",
    glowShadow: "shadow-[0_0_35px_rgba(14,165,233,0.4)]",
    icon: "🔷",
  },
  common: {
    badgeLabel: "COMMUNE",
    borderGradient: "from-emerald-400 via-teal-400 to-slate-600",
    headerBg: "from-emerald-950/80 via-slate-900 to-slate-900",
    textColor: "text-emerald-300",
    glowShadow: "shadow-[0_0_25px_rgba(16,185,129,0.35)]",
    icon: "🧭",
  },
};

export const ConquestCardModal: React.FC<ConquestCardModalProps> = ({
  card,
  onClose,
  onPlayCountryQuiz,
}) => {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);

  if (!card) return null;

  const theme = RARITY_THEMES[card.rarity] || RARITY_THEMES.common;

  const generateCardCanvas = () => {
    const canvas = document.createElement("canvas");
    drawConquestCollectorCard(canvas, card, profile?.pseudo || "Explorateur");
    return canvas;
  };

  const handleDownloadCard = () => {
    setIsGenerating(true);
    try {
      const canvas = generateCardCanvas();
      downloadCanvasImage(canvas, `carte-collector-${card.iso3.toLowerCase()}.png`);
      toast.success("Carte collector téléchargée en HD ! 🎴");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la création de la carte.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCardImage = async () => {
    setIsGenerating(true);
    try {
      const canvas = generateCardCanvas();
      const success = await copyCanvasImageToClipboard(canvas);
      if (success) {
        setImageCopied(true);
        toast.success("Image de la carte copiée dans le presse-papier ! 📋");
        setTimeout(() => setImageCopied(false), 2500);
      } else {
        downloadCanvasImage(canvas, `carte-collector-${card.iso3.toLowerCase()}.png`);
        toast.info("Téléchargement de l'image (copie non supportée sur ce navigateur).");
      }
    } catch (e) {
      console.error(e);
      toast.error("Impossible de copier l'image.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    const text = card.isConquered
      ? `🌍 TerraCoast Pokédex Géographique\nJ'ai débloqué la carte [${theme.badgeLabel}] de ${card.name} ${card.flagEmoji} !\nMonument : ${card.landmark.name}\nRejoins-moi pour conquérir le monde sur TerraCoast !`
      : `🌍 Découvre ${card.name} sur TerraCoast !`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Carte de Collection TerraCoast : ${card.name}`,
          text,
          url: window.location.origin,
        });
        return;
      } catch {
        // User cancelled or fallback
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // fallback
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div
        className="relative w-full max-w-lg rounded-3xl p-1 bg-gradient-to-b shadow-2xl transition-all max-h-[90vh] flex flex-col"
        style={{
          backgroundImage: `linear-gradient(135deg, ${
            card.rarity === "legendary"
              ? "#fbbf24, #f59e0b, #b45309"
              : card.rarity === "epic"
              ? "#c084fc, #a855f7, #6366f1"
              : card.rarity === "rare"
              ? "#38bdf8, #0ea5e9, #0284c7"
              : "#34d399, #10b981, #0f766e"
          })`,
        }}
      >
        {/* Card inner shell */}
        <div
          className={`relative w-full h-full rounded-[22px] bg-white text-slate-800 overflow-hidden flex flex-col shadow-2xl ${theme.glowShadow}`}
        >
          {/* Top Bar with Rarity and Close */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2 z-10">
            <div className="flex items-center gap-2">
              <span className="text-xl">{theme.icon}</span>
              <span
                className={`text-xs font-black uppercase tracking-widest ${theme.textColor}`}
              >
                {theme.badgeLabel} • #{card.iso3}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto px-5 pb-6 space-y-4">
            {/* Header Hero */}
            <div
              className={`p-4 rounded-2xl bg-gradient-to-br ${theme.headerBg} border border-white/20 flex items-center gap-4 relative overflow-hidden text-white shadow-xs`}
            >
              {/* Shimmer effect */}
              <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/10 to-transparent -rotate-45 pointer-events-none"></div>

              <div className="relative shrink-0 w-20 h-20 rounded-2xl bg-black/20 border border-white/30 flex items-center justify-center shadow-inner text-5xl">
                {card.isConquered ? card.flagEmoji : "🌫️"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black text-white truncate">
                    {card.name}
                  </h3>
                </div>
                <p className="text-xs text-white/80 italic truncate font-medium">
                  {card.officialName}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-black border border-white/30">
                    <MapPin className="w-3 h-3" /> {card.capital}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/20 text-white text-xs font-bold border border-white/20">
                    <Compass className="w-3 h-3" /> {card.continent}
                  </span>
                </div>
              </div>
            </div>

            {/* Conquest Status Banner */}
            {card.isConquered ? (
              <div className="p-3 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-black">
                  <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span>Territoire Conquis & Élucidé</span>
                </div>
                {card.bestAccuracy && (
                  <span className="text-xs text-emerald-800 font-mono font-black bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300">
                    Précision: {card.bestAccuracy}%
                  </span>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Encore plongé dans le Brouillard de Guerre</span>
                </div>
                {onPlayCountryQuiz && (
                  <button
                    onClick={() => onPlayCountryQuiz(card.iso3)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black border-2 border-emerald-600 border-b-4 border-b-emerald-700 active:border-b-0 active:translate-y-0.5 transition shadow-xs"
                  >
                    Conquérir ⚔️
                  </button>
                )}
              </div>
            )}

            {/* Landmark Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 mb-2 text-slate-800">
                <span className="text-2xl">{card.landmark.icon}</span>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 font-black">
                    Monument & Patrimoine Majeur
                  </p>
                  <h4 className="text-sm font-black text-slate-900 leading-snug">
                    {card.landmark.name}
                  </h4>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-8 font-medium">
                {card.landmark.description}
              </p>
            </div>

            {/* Fun Fact / Trivia */}
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 shadow-2xs">
              <div className="flex items-center gap-2 mb-1.5 text-amber-800 font-black text-xs uppercase tracking-wider">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Le Saviez-Vous ? (Fait Insolite)</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {card.funFact}
              </p>
            </div>

            {/* Geographic Data Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border-2 border-slate-200">
                <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>Population</span>
                </div>
                <p className="font-black text-slate-900 text-sm">
                  {card.population.toLocaleString("fr-FR")} hab.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border-2 border-slate-200">
                <div className="flex items-center gap-1.5 text-slate-500 font-bold mb-1">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Superficie</span>
                </div>
                <p className="font-black text-slate-900 text-sm">
                  {card.areaKm2.toLocaleString("fr-FR")} km²
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border-2 border-slate-200 col-span-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                  <Coins className="w-3.5 h-3.5" />
                  <span>Monnaie</span>
                </div>
                <p className="font-black text-slate-900 truncate max-w-[240px]">
                  {card.currencies.map((c) => `${c.name} (${c.symbol})`).join(", ") || "—"}
                </p>
              </div>
            </div>

            {/* Collector Card Export Section */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 shadow-md">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎴</span>
                  <div>
                    <h5 className="text-xs font-black tracking-wide text-white uppercase flex items-center gap-1.5">
                      Carte Collector Pokédex
                      {(card.rarity === "legendary" || card.rarity === "epic") && (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black animate-pulse">
                          HOLOGRAPHIQUE
                        </span>
                      )}
                    </h5>
                    <p className="text-[11px] text-slate-300">
                      Télécharge ou copie la carte collector HD (monuments, stats & rareté) pour la partager.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadCard}
                  disabled={isGenerating}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs border border-amber-300 active:translate-y-0.5 transition shadow flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isGenerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-slate-950" />
                  )}
                  <span>Télécharger HD</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyCardImage}
                  disabled={isGenerating}
                  className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs border border-white/20 active:translate-y-0.5 transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {imageCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Image Copiée !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-indigo-300" />
                      <span>Copier Image</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={handleShare}
                className="flex-1 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm border-2 border-emerald-600 border-b-4 border-b-emerald-700 active:border-b-0 active:translate-y-1 shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-100" />
                    <span>Lien texte copié !</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Partager texte 📲</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs sm:text-sm border-2 border-slate-200 border-b-4 border-b-slate-300 active:border-b-0 active:translate-y-0.5 transition shadow-2xs cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
