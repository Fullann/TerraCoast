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
        className={`relative min-h-[360px] sm:min-h-[400px] w-full rounded-3xl p-6 sm:p-8 cursor-pointer transition-transform duration-500 transform-style-preserve-3d shadow-2xl border ${
          isFlipped
            ? "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-indigo-500/50"
            : "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-slate-800 hover:border-slate-700"
        }`}
      >
        {!isFlipped ? (
          /* Recto (Question) */
          <div className="flex flex-col items-center justify-between h-full space-y-6 text-center">
            <div className="w-full flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                Boîte {card.box} / 5
              </span>
              <span>{country.continent}</span>
            </div>

            <div className="space-y-4 my-auto">
              <span className="text-7xl sm:text-8xl block filter drop-shadow-lg">
                {country.flagEmoji}
              </span>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {country.name}
                </h3>
                <p className="text-sm text-indigo-400 font-semibold mt-2">
                  Quelle est la capitale de ce pays ?
                </p>
              </div>
            </div>

            <div className="w-full pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
              <RotateCw className="w-4 h-4 text-indigo-400" />
              <span>Clique pour révéler la réponse</span>
            </div>
          </div>
        ) : (
          /* Verso (Révélation & Détails) */
          <div className="flex flex-col items-center justify-between h-full space-y-6 text-center animate-fadeIn">
            <div className="w-full flex items-center justify-between text-xs font-bold text-indigo-300 uppercase tracking-wider">
              <span className="bg-indigo-900/50 px-3 py-1 rounded-full border border-indigo-700">
                Capitale
              </span>
              <span>{country.iso3}</span>
            </div>

            <div className="space-y-3 my-auto">
              <span className="text-5xl block">{country.flagEmoji}</span>
              <p className="text-xs uppercase font-bold tracking-widest text-slate-400">
                Capitale de {country.name}
              </p>
              <h2 className="text-3xl sm:text-4xl font-black text-indigo-300">
                {country.capital}
              </h2>

              <div className="pt-2 text-xs text-slate-400 space-y-1">
                <p>Continent : {country.continent}</p>
                <p>Population : {country.population.toLocaleString()} hab.</p>
                {country.currencies.length > 0 && (
                  <p>Monnaie : {country.currencies[0].name} ({country.currencies[0].symbol})</p>
                )}
              </div>
            </div>

            <div className="w-full pt-4 border-t border-indigo-900/40 text-xs text-indigo-300/80">
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
            className="py-3 px-2 bg-red-600/90 hover:bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-950 flex flex-col items-center justify-center gap-1 transition-all"
          >
            <X className="w-4 h-4" />
            <span className="text-xs sm:text-sm">À revoir</span>
            <span className="text-[10px] text-red-200 font-normal">Demain (B1)</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRate("good");
            }}
            className="py-3 px-2 bg-amber-600/90 hover:bg-amber-500 text-white font-bold rounded-2xl shadow-lg shadow-amber-950 flex flex-col items-center justify-center gap-1 transition-all"
          >
            <Check className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Bien</span>
            <span className="text-[10px] text-amber-200 font-normal">
              Dans {card.box === 1 ? "3j" : card.box === 2 ? "7j" : "14j"}
            </span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRate("easy");
            }}
            className="py-3 px-2 bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-950 flex flex-col items-center justify-center gap-1 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Facile !</span>
            <span className="text-[10px] text-emerald-200 font-normal">+2 Boîtes</span>
          </button>
        </div>
      )}
    </div>
  );
}
