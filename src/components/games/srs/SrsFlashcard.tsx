import { useState } from "react";
import { RotateCw, Check, X, Sparkles } from "lucide-react";
import type { SrsCard, SrsRating } from "../../../lib/srsManager";
import { getAtlasCountryByIso3 } from "../../../lib/atlasData";
import { useLanguage } from "../../../contexts/LanguageContext";

interface SrsFlashcardProps {
  card: SrsCard;
  onRate: (rating: SrsRating) => void;
}

export function SrsFlashcard({ card, onRate }: SrsFlashcardProps) {
  const { language } = useLanguage();
  const [isFlipped, setIsFlipped] = useState(false);

  const country = getAtlasCountryByIso3(card.iso3, language);

  const handleFlip = () => {
    setIsFlipped((f) => !f);
  };

  const handleRate = (rating: SrsRating) => {
    setIsFlipped(false);
    onRate(rating);
  };

  if (!country) {
    return (
      <div className="bg-slate-900 rounded-3xl p-8 text-center text-slate-400">
        Chargement des données du pays...
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto perspective-1000">
      {/* 3D Card Container */}
      <div
        onClick={handleFlip}
        className={`relative min-h-[360px] sm:min-h-[400px] w-full rounded-3xl p-6 sm:p-8 cursor-pointer transition-all duration-300 transform-style-preserve-3d shadow-xs border-2 ${
          isFlipped
            ? "bg-white border-indigo-300 shadow-md"
            : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm"
        }`}
      >
        {!isFlipped ? (
          /* Recto (Question) */
          <div className="flex flex-col items-center justify-between h-full space-y-6 text-center">
            <div className="w-full flex items-center justify-between text-xs font-black text-slate-500 uppercase tracking-wider">
              <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
                Boîte {card.box} / 5
              </span>
              <span>{country.continent}</span>
            </div>

            <div className="space-y-4 my-auto">
              <span className="text-7xl sm:text-8xl block filter drop-shadow-md">
                {country.flagEmoji}
              </span>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                  {country.name}
                </h3>
                <p className="text-sm text-indigo-600 font-extrabold mt-2">
                  Quelle est la capitale de ce pays ?
                </p>
              </div>
            </div>

            <div className="w-full pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500 font-bold">
              <RotateCw className="w-4 h-4 text-indigo-600" />
              <span>Clique pour révéler la réponse</span>
            </div>
          </div>
        ) : (
          /* Verso (Révélation & Détails) */
          <div className="flex flex-col items-center justify-between h-full space-y-6 text-center animate-fadeIn">
            <div className="w-full flex items-center justify-between text-xs font-black text-indigo-700 uppercase tracking-wider">
              <span className="bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                Capitale
              </span>
              <span className="text-slate-400">{country.iso3}</span>
            </div>

            <div className="space-y-3 my-auto">
              <span className="text-5xl block">{country.flagEmoji}</span>
              <p className="text-xs uppercase font-black tracking-widest text-slate-400">
                Capitale de {country.name}
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-indigo-600">
                {country.capital}
              </h2>

              <div className="pt-2 text-xs text-slate-600 font-medium space-y-1">
                <p>Continent : <strong className="text-slate-800">{country.continent}</strong></p>
                <p>Population : <strong className="text-slate-800">{country.population.toLocaleString()}</strong> hab.</p>
                {country.currencies.length > 0 && (
                  <p>Monnaie : <strong className="text-slate-800">{country.currencies[0].name} ({country.currencies[0].symbol})</strong></p>
                )}
              </div>
            </div>

            <div className="w-full pt-4 border-t border-slate-100 text-xs text-indigo-600 font-black">
              Auto-évalue ta mémorisation ci-dessous 👇
            </div>
          </div>
        )}
      </div>

      {/* Evaluation Action Buttons (displayed when flipped) */}
      {isFlipped && (
        <div className="grid grid-cols-3 gap-3 mt-5 animate-scaleUp">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRate("again");
            }}
            className="py-3 px-2 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-2xl border-2 border-rose-600 border-b-4 border-b-rose-700 active:border-b-0 active:translate-y-1 shadow-xs flex flex-col items-center justify-center gap-1 transition-all"
          >
            <X className="w-4 h-4" />
            <span className="text-xs sm:text-sm">À revoir</span>
            <span className="text-[10px] text-rose-100 font-semibold">Demain (B1)</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRate("good");
            }}
            className="py-3 px-2 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl border-2 border-amber-600 border-b-4 border-b-amber-700 active:border-b-0 active:translate-y-1 shadow-xs flex flex-col items-center justify-center gap-1 transition-all"
          >
            <Check className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Bien</span>
            <span className="text-[10px] text-amber-100 font-semibold">
              Dans {card.box === 1 ? "3j" : card.box === 2 ? "7j" : "14j"}
            </span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRate("easy");
            }}
            className="py-3 px-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl border-2 border-emerald-600 border-b-4 border-b-emerald-700 active:border-b-0 active:translate-y-1 shadow-xs flex flex-col items-center justify-center gap-1 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Facile !</span>
            <span className="text-[10px] text-emerald-100 font-semibold">+2 Boîtes</span>
          </button>
        </div>
      )}
    </div>
  );
}
