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
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  AtlasCountry,
  getLocalizedContinent,
  getAtlasCountryByIso3,
} from "../../lib/atlasData";

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
  const { t, language } = useLanguage();

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
                {formatNumber(country.population)}
              </p>
              <span className="text-[10px] text-gray-500">habitants</span>
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
        <div className="p-4 bg-gray-50 border-t border-gray-200 shrink-0">
          <button
            onClick={handleTestKnowledge}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all hover:scale-101 active:scale-99"
          >
            <BookOpen className="w-4 h-4" />
            <span>
              {t("atlas.playQuizOnCountry") || `Tester mes connaissances sur ${country.name}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
