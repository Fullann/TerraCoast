import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  MapPin,
  Globe2,
  Users,
  Maximize2,
  Coins,
  Languages,
  BookOpen,
  Compass,
  Brain,
  Check,
  Headphones,
  Play,
  Pause,
  Volume2,
  Music,
  Scale,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { useRadioGlobe } from "../../contexts/RadioGlobeContext";
import { addCardToSrs } from "../../lib/srsManager";
import {
  AtlasCountry,
  getLocalizedContinent,
  getAtlasCountryByIso3,
} from "../../lib/atlasData";
import {
  speakCountryAndCapital,
  playNationalAnthem,
  stopNationalAnthem,
} from "../../lib/countryAudio";
import { CountryComparisonModal } from "./CountryComparisonModal";

interface CountryDetailDrawerProps {
  country: AtlasCountry | null;
  onClose: () => void;
  onSelectCountry: (iso3: string) => void;
}

export function CountryDetailDrawer({
  country,
  onClose,
  onSelectCountry,
}: CountryDetailDrawerProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [addedToSrs, setAddedToSrs] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [isPlayingAnthem, setIsPlayingAnthem] = useState(false);
  const { tuneToCountry, play, pause, setMode, isPlaying, currentCountry } = useRadioGlobe();

  useEffect(() => {
    return () => {
      stopNationalAnthem();
      setIsPlayingAnthem(false);
    };
  }, [country?.iso3]);

  if (!country) return null;


  const formatNumber = (n: number) => {
    return new Intl.NumberFormat(language).format(n);
  };

  const handleTestKnowledge = () => {
    onClose();
    navigate(`/quizzes?search=${encodeURIComponent(country.name)}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden border-l border-emerald-100 animate-slide-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white p-6 pb-8 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 text-white transition-colors"
            title={t("common.close")}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl shadow-inner border border-white/25 shrink-0">
              {country.flagEmoji}
            </div>

            <div className="pr-6">
              <span className="inline-block text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 border border-white/30 text-emerald-100 mb-1">
                {country.iso3} • {country.iso2}
              </span>
              <h2 className="text-2xl font-black leading-tight text-white drop-shadow-sm">
                {country.name}
              </h2>
              {country.officialName !== country.name && (
                <p className="text-xs text-emerald-100/90 line-clamp-1 mt-0.5 font-medium">
                  {country.officialName}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Quick Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 mb-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                {t("atlas.capital") || "Capitale"}
              </span>
              <p className="text-base font-black text-gray-900 line-clamp-1">
                {country.capital}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-100">
              <span className="text-xs text-teal-700 font-semibold flex items-center gap-1.5 mb-1">
                <Globe2 className="w-3.5 h-3.5 text-teal-600" />
                {t("atlas.region") || "Continent"}
              </span>
              <p className="text-base font-black text-gray-900 line-clamp-1">
                {getLocalizedContinent(country.continent, language)}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100">
              <span className="text-xs text-sky-700 font-semibold flex items-center gap-1.5 mb-1">
                <Users className="w-3.5 h-3.5 text-sky-600" />
                {t("atlas.population") || "Population"}
              </span>
              <p className="text-base font-black text-gray-900">
                {country.population > 0 ? formatNumber(country.population) : "Inhabité (0)"}
              </p>
              <span className="text-[10px] text-gray-500">
                {country.population > 0 ? "habitants" : "territoire polaire / scientifique"}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100">
              <span className="text-xs text-amber-700 font-semibold flex items-center gap-1.5 mb-1">
                <Maximize2 className="w-3.5 h-3.5 text-amber-600" />
                {t("atlas.area") || "Superficie"}
              </span>
              <p className="text-base font-black text-gray-900">
                {formatNumber(country.areaKm2)}
              </p>
              <span className="text-[10px] text-gray-500">km²</span>
            </div>
          </div>

          {/* Audio Immersion : Radio & Ambiances */}
          <div className="mt-4 bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950 text-white p-4 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    Immersion Sonore
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Live
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-400">Radio FM & Ambiances locales</p>
                </div>
              </div>

              <button
                onClick={() => {
                  const isCurrentCountryPlaying = isPlaying && currentCountry?.iso3 === country.iso3;
                  if (isCurrentCountryPlaying) {
                    pause();
                  } else {
                    setMode("radio");
                    tuneToCountry(country.iso3, country.name, country.flagEmoji);
                    play();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {isPlaying && currentCountry?.iso3 === country.iso3 ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Écouter {country.name}</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Voyagez en musique avec les ondes radio en direct et paysages sonores traditionnels de {country.name}.
            </p>

            {/* Prononciation & Hymne National */}
            <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => speakCountryAndCapital(country.name, country.capital, country.iso3)}
                className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer border border-white/10"
              >
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Prononciation 🗣️</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isPlayingAnthem) {
                    stopNationalAnthem();
                    setIsPlayingAnthem(false);
                  } else {
                    setIsPlayingAnthem(true);
                    playNationalAnthem(country.iso3, () => setIsPlayingAnthem(false));
                  }
                }}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer border ${
                  isPlayingAnthem
                    ? "bg-amber-400 text-slate-950 border-amber-300 animate-pulse font-black"
                    : "bg-white/10 hover:bg-white/20 text-white border-white/10"
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>{isPlayingAnthem ? "Stop Hymne" : "Hymne 🎶"}</span>
              </button>
            </div>
          </div>

          {/* Currencies & Languages */}
          <div className="space-y-4 pt-2">
            {/* Currencies */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-600 uppercase tracking-wider">
                <Coins className="w-4 h-4 text-emerald-600" />
                <span>{t("atlas.currency") || "Monnaie(s)"}</span>
              </div>
              {country.currencies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {country.currencies.map((c) => (
                    <span
                      key={c.code}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-800 shadow-2xs"
                    >
                      <span className="text-emerald-600">{c.symbol}</span>
                      <span>
                        {c.name} ({c.code})
                      </span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">Non renseignée</p>
              )}
            </div>

            {/* Languages */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-600 uppercase tracking-wider">
                <Languages className="w-4 h-4 text-teal-600" />
                <span>{t("atlas.languages") || "Langue(s) officielle(s)"}</span>
              </div>
              {country.languages.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {country.languages.map((langStr, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-700 shadow-2xs"
                    >
                      {langStr}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">Non renseignée</p>
              )}
            </div>

            {/* Subregion & Coordinates */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-600 uppercase tracking-wider">
                <Compass className="w-4 h-4 text-sky-600" />
                <span>{t("atlas.coordinates") || "Coordonnées & Sous-région"}</span>
              </div>
              <p className="text-xs text-gray-700 font-medium">
                {country.subregion} • {country.lat.toFixed(2)}° N, {country.lng.toFixed(2)}° E
              </p>
            </div>

            {/* Bordering Countries (Clickable chips) */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  {t("atlas.borders") || "Pays Frontaliers"} ({country.borders.length})
                </span>
                {country.borders.length === 0 && (
                  <span className="text-[11px] text-gray-400">Île / Sans frontière terrestre</span>
                )}
              </div>

              {country.borders.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {country.borders.map((borderIso) => {
                    const neighbor = getAtlasCountryByIso3(borderIso, language);
                    return (
                      <button
                        key={borderIso}
                        onClick={() => onSelectCountry(borderIso)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-xs font-bold text-gray-800 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                        title={`Explorer ${neighbor?.name || borderIso}`}
                      >
                        <span>{neighbor?.flagEmoji || "🏳️"}</span>
                        <span>{neighbor?.name || borderIso}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Drawer Footer CTA */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 shrink-0 space-y-2">
          {/* Bouton Comparer deux Pays (Versus) */}
          <button
            onClick={() => setShowComparisonModal(true)}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all hover:scale-101 active:scale-99 cursor-pointer"
          >
            <Scale className="w-4 h-4 text-pink-300" />
            <span>Comparer ce pays (Versus & True Size) ⚖️</span>
          </button>

          <button
            onClick={handleTestKnowledge}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all hover:scale-101 active:scale-99"
          >
            <BookOpen className="w-4 h-4" />
            <span>
              {t("atlas.playQuizOnCountry") || `Tester mes connaissances sur ${country.name}`}
            </span>
          </button>

          <button
            onClick={() => {
              addCardToSrs(country.iso3, "capital", user?.id || null);
              setAddedToSrs(true);
              setTimeout(() => setAddedToSrs(false), 2000);
            }}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border ${
              addedToSrs
                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            }`}
          >
            {addedToSrs ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Ajouté à mon Carnet de Révision !</span>
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 text-indigo-600" />
                <span>Ajouter à mon Carnet de Révision (SRS)</span>
              </>
            )}
          </button>
        </div>
      </div>

      <CountryComparisonModal
        isOpen={showComparisonModal}
        initialCountryA={country}
        onClose={() => setShowComparisonModal(false)}
        language={language}
      />
    </div>
  );
}
