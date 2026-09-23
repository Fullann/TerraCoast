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
} from "lucide-react";
import type { ConquestCard, ConquestRarity } from "../../lib/conquestManager";

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
  const [copied, setCopied] = useState(false);

  if (!card) return null;

  const theme = RARITY_THEMES[card.rarity] || RARITY_THEMES.common;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
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
          className={`relative w-full h-full rounded-[22px] bg-slate-950 text-white overflow-hidden flex flex-col shadow-2xl ${theme.glowShadow}`}
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
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto px-5 pb-6 space-y-4">
            {/* Header Hero */}
            <div
              className={`p-4 rounded-2xl bg-gradient-to-br ${theme.headerBg} border border-white/10 flex items-center gap-4 relative overflow-hidden`}
            >
              {/* Shimmer effect */}
              <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent -rotate-45 pointer-events-none"></div>

              <div className="relative shrink-0 w-20 h-20 rounded-2xl bg-black/40 border border-white/20 flex items-center justify-center shadow-inner text-5xl">
                {card.isConquered ? card.flagEmoji : "🌫️"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black text-white truncate">
                    {card.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-300 italic truncate">
                  {card.officialName}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                    <MapPin className="w-3 h-3" /> {card.capital}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700">
                    <Compass className="w-3 h-3" /> {card.continent}
                  </span>
                </div>
              </div>
            </div>

            {/* Conquest Status Banner */}
            {card.isConquered ? (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
                  <span>Territoire Conquis & Élucidé</span>
                </div>
                {card.bestAccuracy && (
                  <span className="text-xs text-emerald-300 font-mono bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    Précision: {card.bestAccuracy}%
                  </span>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span>Encore plongé dans le Brouillard de Guerre</span>
                </div>
                {onPlayCountryQuiz && (
                  <button
                    onClick={() => onPlayCountryQuiz(card.iso3)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
                  >
                    Conquérir ⚔️
                  </button>
                )}
              </div>
            )}

            {/* Landmark Box */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-2 mb-2 text-slate-200">
                <span className="text-2xl">{card.landmark.icon}</span>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                    Monument & Patrimoine Majeur
                  </p>
                  <h4 className="text-sm font-bold text-white leading-snug">
                    {card.landmark.name}
                  </h4>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-8">
                {card.landmark.description}
              </p>
            </div>

            {/* Fun Fact / Trivia */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/20">
              <div className="flex items-center gap-2 mb-1.5 text-indigo-300 font-bold text-xs uppercase tracking-wider">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Le Saviez-Vous ? (Fait Insolite)</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {card.funFact}
              </p>
            </div>

            {/* Geographic Data Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>Population</span>
                </div>
                <p className="font-bold text-white text-sm">
                  {card.population.toLocaleString("fr-FR")} hab.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Superficie</span>
                </div>
                <p className="font-bold text-white text-sm">
                  {card.areaKm2.toLocaleString("fr-FR")} km²
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 col-span-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Coins className="w-3.5 h-3.5" />
                  <span>Monnaie</span>
                </div>
                <p className="font-bold text-white truncate max-w-[240px]">
                  {card.currencies.map((c) => `${c.name} (${c.symbol})`).join(", ") || "—"}
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={handleShare}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition transform active:scale-98"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>Copié dans le presse-papier !</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Partager ma Carte 📲</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm transition"
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
