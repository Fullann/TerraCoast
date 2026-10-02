import { useState } from "react";
import {
  X,
  Award,
  CheckCircle2,
  Hammer,
  Star,
  Globe,
} from "lucide-react";
import {
  type TerraCard,
  RARITY_CONFIG,
  CATEGORY_CONFIG,
} from "../../lib/cardsData";
import {
  type PlayerCardEntry,
  answerCardTrivia,
  craftCardWithStardust,
  setFavoriteCards,
  getPlayerCardsState,
} from "../../lib/cardsManager";
import {
  useTranslatedCard,
  CATEGORY_TRANSLATIONS,
  RARITY_TRANSLATIONS,
} from "../../lib/cardsTranslationService";
import { type Language } from "../../i18n/translations";
import { useLanguage } from "../../contexts/LanguageContext";
import { CollectibleCard } from "./CollectibleCard";
import { triggerConfetti } from "../common/Confetti";
import { playSound } from "../../lib/soundManager";
import { toast } from "../common/ToastContainer";

interface CardDetailModalProps {
  card: TerraCard | null;
  entry?: PlayerCardEntry;
  isUnlocked: boolean;
  userId?: string;
  onClose: () => void;
  onStateChanged?: () => void;
}

export function CardDetailModal({
  card,
  entry,
  isUnlocked,
  userId,
  onClose,
  onStateChanged,
}: CardDetailModalProps) {
  const { language } = useLanguage();
  const [modalLang, setModalLang] = useState<Language>(language);
  const [selectedTriviaOption, setSelectedTriviaOption] = useState<number | null>(null);
  const [triviaFeedback, setTriviaFeedback] = useState<{
    correct: boolean;
    message: string;
    explanation?: string;
  } | null>(null);

  const rawTranslated = useTranslatedCard(card, modalLang);

  if (!card) return null;

  const translated: TerraCard = rawTranslated || card;

  const rarityMeta = RARITY_CONFIG[card.rarity];
  const categoryMeta = CATEGORY_CONFIG[card.category];
  const cardsState = getPlayerCardsState(userId);
  const isFavorite = cardsState.favoriteCardIds.includes(card.id);

  const handleAnswer = (index: number) => {
    setSelectedTriviaOption(index);
    const res = answerCardTrivia(userId, card.id, index);
    setTriviaFeedback({
      correct: res.correct,
      message: res.message,
      explanation: res.explanation,
    });

    if (res.correct) {
      playSound("success");
      if (res.rewardGems > 0) {
        triggerConfetti();
        toast.success(res.message);
      }
      onStateChanged?.();
    } else {
      playSound("error");
    }
  };

  const handleCraft = () => {
    const res = craftCardWithStardust(userId, card.id);
    if (res.success) {
      playSound("success");
      triggerConfetti();
      toast.success(res.message);
      onStateChanged?.();
    } else {
      playSound("error");
      toast.error(res.message);
    }
  };

  const handleToggleFavorite = () => {
    let nextFavorites = [...cardsState.favoriteCardIds];
    if (isFavorite) {
      nextFavorites = nextFavorites.filter((id) => id !== card.id);
      toast.success("Carte retirée de votre vitrine.");
    } else {
      if (nextFavorites.length >= 3) {
        toast.error("Vous ne pouvez épingler que 3 cartes favorites à la fois.");
        return;
      }
      nextFavorites.push(card.id);
      toast.success("Carte épinglée sur votre vitrine de profil ! ⭐");
    }
    setFavoriteCards(userId, nextFavorites);
    playSound("click");
    onStateChanged?.();
  };

  const formattedNumber = `#${String(card.number).padStart(3, "0")}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border-2 border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col md:flex-row relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fermeture */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── COLONNE GAUCHE : CARTE 3D ── */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-6 flex flex-col items-center justify-center relative shrink-0">
          <CollectibleCard
            card={translated}
            entry={entry}
            isUnlocked={isUnlocked}
            interactive={true}
            showFlipButton={true}
            size="md"
            langOverride={modalLang}
          />

          {isUnlocked && (
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleFavorite}
                className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  isFavorite
                    ? "bg-amber-400 text-amber-950 border border-amber-500 shadow-sm"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                }`}
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    isFavorite ? "fill-amber-950 text-amber-950" : "text-amber-400"
                  }`}
                />
                <span>{isFavorite ? "Épinglée en vitrine" : "Épingler en vitrine (Profil)"}</span>
              </button>
            </div>
          )}
        </div>

        {/* ── COLONNE DROITE : FICHE DÉTAILLÉE & QUIZ FLASH ── */}
        <div className="p-6 flex-1 flex flex-col justify-between overflow-y-auto max-h-[80vh]">
          <div className="space-y-4">
            {/* Sélecteur de Langue de la Carte (API Traduction) */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <span>Traduire la carte :</span>
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[10px] font-black">
                {[
                  { code: "fr", flag: "🇫🇷", label: "FR" },
                  { code: "en", flag: "🇬🇧", label: "EN" },
                  { code: "es", flag: "🇪🇸", label: "ES" },
                  { code: "de", flag: "🇩🇪", label: "DE" },
                  { code: "it", flag: "🇮🇹", label: "IT" },
                  { code: "pt", flag: "🇵🇹", label: "PT" },
                ].map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setModalLang(l.code as Language);
                      playSound("click");
                    }}
                    className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                      modalLang === l.code
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono font-black text-xs px-2.5 py-0.5 rounded-lg bg-slate-900 text-white">
                  {formattedNumber}
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${rarityMeta.bgBadge}`}>
                  {RARITY_TRANSLATIONS[modalLang]?.[card.rarity] || rarityMeta.label}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {categoryMeta.icon} {CATEGORY_TRANSLATIONS[modalLang]?.[card.category] || categoryMeta.label}
                </span>
              </div>

              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>{translated.name}</span>
                {card.flag && <span className="text-xl">{card.flag}</span>}
              </h2>
              <p className="text-xs font-bold text-slate-500 italic mt-0.5">
                « {translated.tagline} »
              </p>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              {translated.description}
            </p>

            {/* Statistiques géographiques */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
                Données & Géographie
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(translated.stats).map(([k, v]) => (
                  <div key={k} className="bg-white p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 block truncate">
                      {k.replace(/_/g, " ")}
                    </span>
                    <span className="font-black text-slate-900 text-xs truncate block">
                      {String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fun fact */}
            <div className="bg-amber-50 rounded-2xl p-3.5 border border-amber-200">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center gap-1 mb-1">
                <span>💡</span> Le Saviez-vous ?
              </span>
              <p className="text-xs text-amber-950 font-medium leading-relaxed">
                {translated.funFact}
              </p>
            </div>

            {/* Quiz Flash Bonus */}
            {isUnlocked && (
              <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-purple-600" />
                    Quiz Flash de la Carte (+5 💎)
                  </span>
                  {entry?.answeredTrivia && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Réussi
                    </span>
                  )}
                </div>

                <p className="text-xs font-bold text-purple-950 mb-2.5">
                  {translated.trivia.question}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {translated.trivia.options.map((opt, idx) => {
                    const isSelected = selectedTriviaOption === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAnswer(idx)}
                        className={`text-left text-xs p-2.5 rounded-xl font-bold transition-all border cursor-pointer ${
                          isSelected
                            ? triviaFeedback?.correct
                              ? "bg-emerald-600 text-white border-emerald-700"
                              : "bg-rose-600 text-white border-rose-700"
                            : "bg-white hover:bg-purple-100 text-purple-950 border-purple-200"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {triviaFeedback && (
                  <div
                    className={`mt-2.5 p-2 rounded-xl text-xs font-medium ${
                      triviaFeedback.correct
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                        : "bg-rose-100 text-rose-900 border border-rose-200"
                    }`}
                  >
                    <p className="font-bold">{triviaFeedback.message}</p>
                    {triviaFeedback.explanation && (
                      <p className="text-[11px] mt-0.5 opacity-90">
                        {triviaFeedback.explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action si carte verrouillée : FORGER */}
          {!isUnlocked && (
            <div className="mt-5 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-black text-slate-800 block">
                    Carte manquante dans votre collection
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Coût de forge : {rarityMeta.craftCost} 🪐 Poussières (Solde : {cardsState.stardust} 🪐)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCraft}
                  disabled={cardsState.stardust < rarityMeta.craftCost}
                  className={`py-2 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm ${
                    cardsState.stardust >= rarityMeta.craftCost
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white cursor-pointer active:scale-95"
                      : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  }`}
                >
                  <Hammer className="w-4 h-4" />
                  <span>Forger ({rarityMeta.craftCost} 🪐)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
