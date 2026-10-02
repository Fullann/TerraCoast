import { useState, useRef, type MouseEvent } from "react";
import {
  Sparkles,
  RotateCw,
  CheckCircle2,
  Lock,
  Award,
} from "lucide-react";
import {
  type TerraCard,
  RARITY_CONFIG,
  CATEGORY_CONFIG,
} from "../../lib/cardsData";
import { type PlayerCardEntry } from "../../lib/cardsManager";
import {
  useTranslatedCard,
  CATEGORY_TRANSLATIONS,
  RARITY_TRANSLATIONS,
  CONTINENT_TRANSLATIONS,
} from "../../lib/cardsTranslationService";
import type { Language } from "../../i18n/translations";

interface CollectibleCardProps {
  card: TerraCard;
  entry?: PlayerCardEntry;
  isUnlocked: boolean;
  interactive?: boolean;
  showFlipButton?: boolean;
  size?: "sm" | "md" | "lg";
  langOverride?: Language;
  onClick?: () => void;
  onAnswerTrivia?: (index: number) => void;
  triviaFeedback?: { correct: boolean; message: string } | null;
}

export function CollectibleCard({
  card,
  entry,
  isUnlocked,
  interactive = true,
  showFlipButton = true,
  size = "md",
  langOverride,
  onClick,
  onAnswerTrivia,
  triviaFeedback,
}: CollectibleCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const { language } = useLanguage();
  const effectiveLang = langOverride || language;
  const translated = useTranslatedCard(card, effectiveLang) || card;

  const rarityMeta = RARITY_CONFIG[card.rarity];
  const categoryMeta = CATEGORY_CONFIG[card.category];
  const isShiny = Boolean(entry?.shiny);
  const count = entry?.count || 0;

  const localizedRarity = RARITY_TRANSLATIONS[effectiveLang]?.[card.rarity] || rarityMeta.label;
  const localizedCategory = CATEGORY_TRANSLATIONS[effectiveLang]?.[card.category] || categoryMeta.label;
  const localizedContinent = CONTINENT_TRANSLATIONS[effectiveLang]?.[card.continent] || card.continent;

  // 3D Tilt handler au survol de la souris
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!interactive || !cardRef.current || !isUnlocked) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = -((y - centerY) / centerY) * 12; // Max 12 deg
    const rY = ((x - centerX) / centerX) * 12;

    setRotateX(rX);
    setRotateY(rY);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: isShiny ? 0.8 : 0.45,
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  // Dimensions selon taille
  const sizeClasses = {
    sm: "w-[152px] min-w-[144px] sm:w-44 sm:min-w-[176px] h-[240px] min-h-[235px] sm:h-64 sm:min-h-[256px] text-[10px]",
    md: "w-60 sm:w-64 min-w-[240px] sm:min-w-[256px] h-[370px] sm:h-[400px] min-h-[370px] sm:min-h-[400px] text-xs",
    lg: "w-72 sm:w-80 min-w-[288px] sm:min-w-[320px] h-[460px] sm:h-[500px] min-h-[460px] sm:min-h-[500px] text-sm",
  }[size];

  const formattedNumber = `#${String(card.number).padStart(3, "0")}`;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        perspective: "1000px",
      }}
      className={`relative select-none shrink-0 ${sizeClasses} transition-transform duration-200 cursor-pointer ${
        interactive ? "hover:scale-[1.03] active:scale-[0.98]" : ""
      }`}
    >
      <div
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY + (isFlipped ? 180 : 0)}deg)`,
          transition: isFlipped
            ? "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
            : "transform 0.15s ease-out",
        }}
        className="w-full h-full relative rounded-3xl shadow-xl transition-shadow duration-300"
      >
        {/* ── RECTO DE LA CARTE ── */}
        <div
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
          className={`absolute inset-0 rounded-3xl overflow-hidden flex flex-col justify-between p-3.5 sm:p-4 border-[3.5px] transition-all duration-300 ${
            rarityMeta.borderClass
          } ${rarityMeta.glowClass} ${
            isUnlocked
              ? card.rarity === "mythic"
                ? "bg-gradient-to-b from-pink-50/90 via-purple-50/70 to-slate-100 ring-2 ring-pink-400/80 shadow-[0_10px_35px_rgba(236,72,153,0.35)]"
                : card.rarity === "legendary"
                ? "bg-gradient-to-b from-amber-50/90 via-orange-50/60 to-slate-100 ring-2 ring-amber-400/80 shadow-[0_10px_30px_rgba(245,158,11,0.3)]"
                : card.rarity === "epic"
                ? "bg-gradient-to-b from-purple-50/80 via-slate-50 to-slate-100 ring-1 ring-purple-400/60 shadow-[0_8px_24px_rgba(168,85,247,0.25)]"
                : card.rarity === "rare"
                ? "bg-gradient-to-b from-sky-50/80 via-slate-50 to-slate-100 ring-1 ring-sky-400/60 shadow-[0_6px_20px_rgba(14,165,233,0.2)]"
                : "bg-gradient-to-b from-white via-slate-50 to-slate-100 shadow-lg"
              : "bg-slate-900 border-slate-700 opacity-90"
          }`}
        >
          {/* Filigrane discret topographique / boussole en arrière-plan */}
          {isUnlocked && (
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.06] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"
            />
          )}

          {/* Reflet Holographique Spectaculaire Multi-Couches (Foil / Shiny) */}
          {isUnlocked && (
            <>
              {/* Couche 1: Faisceau spectral diffracté qui bouge avec l'angle de vue */}
              <div
                style={{
                  background: isShiny || card.rarity === "mythic"
                    ? `linear-gradient(${115 + (glarePos.x - 50) * 1.2}deg, rgba(236,72,153,0.35) 0%, rgba(245,158,11,0.35) 25%, rgba(56,189,248,0.35) 50%, rgba(168,85,247,0.35) 75%, rgba(236,72,153,0.35) 100%)`
                    : card.rarity === "legendary"
                    ? `linear-gradient(${115 + (glarePos.x - 50) * 1.2}deg, rgba(245,158,11,0.25) 0%, rgba(255,255,255,0.4) 50%, rgba(245,158,11,0.25) 100%)`
                    : `linear-gradient(${115 + (glarePos.x - 50) * 1.2}deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)`,
                  opacity: glarePos.opacity,
                  mixBlendMode: isShiny || card.rarity === "mythic" ? "color-dodge" : "overlay",
                }}
                className="absolute inset-0 pointer-events-none transition-opacity duration-150 z-20"
              />

              {/* Couche 2: Point chaud spéculaire de lumière */}
              <div
                style={{
                  background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.2) 35%, transparent 70%)`,
                  opacity: glarePos.opacity * 0.9,
                  mixBlendMode: "overlay",
                }}
                className="absolute inset-0 pointer-events-none transition-opacity duration-150 z-20"
              />
            </>
          )}

          {isUnlocked ? (
            <>
              {/* EN-TÊTE : Numéro Pokédex Orné + Catégorie + Rareté */}
              <div className="flex items-center justify-between gap-1.5 z-10 shrink-0">
                <span className="font-mono font-black text-[11px] px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-slate-900 to-slate-800 text-amber-300 shadow-sm border border-slate-700/60 flex items-center gap-1">
                  <span>{formattedNumber}</span>
                </span>

                <div className="flex items-center gap-1">
                  {isShiny && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-400 via-pink-400 to-sky-400 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-sm animate-pulse border border-white/60">
                      <Sparkles className="w-2.5 h-2.5 fill-current" />
                      Holo Foil
                    </span>
                  )}

                  <span
                    className={`font-black text-[10px] px-2 py-0.5 rounded-md border ${rarityMeta.bgBadge} shadow-xs`}
                  >
                    {localizedRarity}
                  </span>
                </div>
              </div>

              {/* ILLUSTRATION CENTRALE / MÉDAILLON 3D */}
              <div className="my-auto flex flex-col items-center justify-center text-center py-2 z-10 shrink-0">
                <div
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br ${card.colorScheme.from} ${
                    card.colorScheme.via || ""
                  } ${
                    card.colorScheme.to
                  } p-1.5 shadow-xl border-2 border-white/80 flex items-center justify-center relative group-hover:scale-105 transition-all duration-300 shrink-0`}
                >
                  <div className="w-full h-full rounded-[20px] bg-white/25 backdrop-blur-xs flex items-center justify-center text-4xl sm:text-5xl drop-shadow-lg">
                    {card.flag || card.icon}
                  </div>

                  {card.flag && card.icon && (
                    <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-white shadow-md border-2 border-slate-100 flex items-center justify-center text-sm">
                      {card.icon}
                    </div>
                  )}
                </div>

                {/* Nom & Slogan Traduits */}
                <h3 className="font-black text-slate-900 text-sm sm:text-base mt-2.5 leading-snug line-clamp-1 drop-shadow-xs">
                  {translated.name}
                </h3>
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 line-clamp-1 italic mt-0.5">
                  « {translated.tagline} »
                </p>

                {/* Étoiles de rareté dorées */}
                <div className="flex items-center gap-0.5 mt-1.5 text-amber-400 drop-shadow-xs">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={i < rarityMeta.stars ? "text-amber-400 drop-shadow-xs scale-105" : "text-slate-200"}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              {/* PIED DE CARTE : Continent + Badge Catégorie + Doublons */}
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] font-bold text-slate-600 z-10 shrink-0">
                <span className="flex items-center gap-1.5">
                  <span className="text-xs">{categoryMeta.icon}</span>
                  <span className="truncate max-w-[100px] text-slate-700 font-black">{localizedContinent}</span>
                </span>

                <div className="flex items-center gap-1.5">
                  {count > 1 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-900 border border-purple-200 font-mono font-black text-[9px] shadow-xs">
                      x{count}
                    </span>
                  )}

                  {showFlipButton && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsFlipped(true);
                      }}
                      className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      title="Retourner la carte (Détails & Quiz)"
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* CARTE NON DÉCOUVERTE (VERROUILLÉE) */
            <div className="flex flex-col items-center justify-between h-full text-center text-slate-400 py-3">
              <div className="flex items-center justify-between w-full shrink-0">
                <span className="font-mono font-black text-[11px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
                  {formattedNumber}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                  {localizedContinent}
                </span>
              </div>

              <div className="my-auto flex flex-col items-center shrink-0">
                <div className="w-20 h-20 rounded-3xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-3xl shadow-inner mb-3">
                  <Lock className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-xs font-black text-slate-300">Mystère non révélé</p>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[150px]">
                  Ouvrez des boosters ou forgez cette carte avec de la Poussière 🪐
                </p>
              </div>

              <div className="w-full pt-2 border-t border-slate-800 flex items-center justify-center gap-1 text-[10px] text-slate-500 font-bold shrink-0">
                <span>{categoryMeta.icon}</span>
                <span>{localizedCategory}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── VERSO DE LA CARTE (DOSSIER GÉOGRAPHIQUE D'EXPLORATEUR) ── */}
        <div
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
          className={`absolute inset-0 rounded-3xl overflow-hidden border-[3.5px] flex flex-col justify-between p-3.5 sm:p-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white shadow-2xl ${rarityMeta.borderClass} ${rarityMeta.glowClass}`}
        >
          {/* Filigrane d'ornement d'arrière-plan */}
          <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(circle,#fbbf24_1px,transparent_1px)] [background-size:14px_14px]" />

          {/* Coins ornementaux dorés */}
          <div className="absolute top-2 left-2 text-amber-500/50 font-serif text-[10px] select-none pointer-events-none">⌜</div>
          <div className="absolute top-2 right-2 text-amber-500/50 font-serif text-[10px] select-none pointer-events-none">⌝</div>
          <div className="absolute bottom-2 left-2 text-amber-500/50 font-serif text-[10px] select-none pointer-events-none">⌞</div>
          <div className="absolute bottom-2 right-2 text-amber-500/50 font-serif text-[10px] select-none pointer-events-none">⌟</div>

          {/* En-tête Dossier */}
          <div className="flex items-center justify-between pb-2 border-b border-amber-500/20 relative z-10">
            <div className="flex items-center gap-1.5">
              <span className="text-amber-400 text-xs">🧭</span>
              <span className="font-mono font-black text-amber-300 text-xs tracking-wide">
                {formattedNumber} • {translated.name}
              </span>
            </div>

            {showFlipButton && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                }}
                className="p-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                title="Retourner la carte (Recto)"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Corps : Données Cartographiques, Anecdote et Quiz */}
          <div className="overflow-y-auto space-y-2 py-1 pr-0.5 flex-1 text-[11px] relative z-10 custom-scrollbar">
            {/* Données géographiques */}
            <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-700/80 shadow-inner space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
                  <span>📊</span>
                  <span>Données Cartographiques</span>
                </span>
                <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                  {localizedContinent}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-1">
                {Object.entries(translated.stats)
                  .slice(0, 3)
                  .map(([key, val]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between text-slate-300 bg-slate-800/60 px-2 py-0.5 rounded-lg border border-slate-700/40"
                    >
                      <span className="text-slate-400 text-[10px] font-medium">
                        {key.replace(/_/g, " ")}
                      </span>
                      <span className="font-bold text-amber-200 text-[10px] truncate max-w-[130px]">
                        {String(val)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Anecdote "Le Saviez-vous ?" */}
            <div className="bg-emerald-950/50 rounded-xl p-2.5 border border-emerald-700/50 shadow-xs relative overflow-hidden">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-xs">💡</span>
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                  Le Saviez-vous ?
                </span>
              </div>
              <p className="text-[10px] text-emerald-100/90 leading-relaxed font-medium">
                {translated.funFact}
              </p>
            </div>

            {/* Mini-Quiz Flash */}
            {onAnswerTrivia && (
              <div className="bg-purple-950/50 rounded-xl p-2.5 border border-purple-700/50 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black uppercase text-purple-300 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>Défi Géographe (+5 💎)</span>
                  </span>
                  {entry?.answeredTrivia && (
                    <span className="text-[9px] font-black text-emerald-400 flex items-center gap-0.5 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-600">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Réussi
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-bold text-slate-100 mb-2 leading-snug">
                  {translated.trivia.question}
                </p>
                <div className="grid grid-cols-1 gap-1">
                  {translated.trivia.options.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAnswerTrivia(idx);
                      }}
                      className="text-left text-[10px] px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-purple-900/70 border border-slate-700 hover:border-purple-400 text-slate-200 hover:text-white transition-all active:scale-[0.98] cursor-pointer"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {triviaFeedback && (
                  <p
                    className={`text-[9px] font-bold mt-1.5 px-2 py-1 rounded-lg ${
                      triviaFeedback.correct
                        ? "text-emerald-300 bg-emerald-950/80 border border-emerald-700"
                        : "text-rose-300 bg-rose-950/80 border border-rose-700"
                    }`}
                  >
                    {triviaFeedback.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Citation / Slogan au pied */}
          <div className="pt-2 border-t border-amber-500/20 text-[10px] text-center text-amber-200/80 italic truncate font-serif relative z-10">
            {translated.quote ? `« ${translated.quote} »` : translated.description}
          </div>
        </div>
      </div>
    </div>
  );
}

