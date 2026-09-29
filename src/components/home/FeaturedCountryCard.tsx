import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, MapPin, Compass, Volume2, VolumeX, ArrowRight, ShieldCheck } from "lucide-react";
import { getSiteConfig, type FeaturedCountryConfig } from "../../lib/siteConfigManager";
import { getAtlasCountryByIso3 } from "../../lib/atlasData";
import { getAudioAnecdoteForCountry } from "../../lib/audioAnecdotesData";
import { audioAnecdoteSpeaker } from "../../lib/audioAnecdoteSpeaker";
import { isCountryConquered } from "../../lib/conquestManager";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";

export function FeaturedCountryCard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { t, language } = useLanguage();
  const [config, setConfig] = useState<FeaturedCountryConfig>(() => getSiteConfig().featuredCountry);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const handleConfigChange = () => {
      setConfig(getSiteConfig().featuredCountry);
    };

    window.addEventListener("terracost_site_config_updated", handleConfigChange);
    return () => {
      window.removeEventListener("terracost_site_config_updated", handleConfigChange);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = audioAnecdoteSpeaker.subscribe((speaking) => {
      setIsSpeaking(speaking);
    });
    return () => {
      unsubscribe();
      audioAnecdoteSpeaker.stop();
    };
  }, []);

  if (!config || !config.isActive || !config.iso3) {
    return null;
  }

  const atlasCountry = getAtlasCountryByIso3(config.iso3, language as any);
  const audioAnecdote = getAudioAnecdoteForCountry(
    config.iso3,
    config.name || atlasCountry?.name || "Pays Vedette",
    config.flagEmoji || atlasCountry?.flagEmoji || "🌍"
  );
  const isConquered = isCountryConquered(config.iso3, profile?.id);
  const xpBonusPercent = Math.round((config.xpMultiplier - 1) * 100);

  const handleToggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking) {
      audioAnecdoteSpeaker.stop();
    } else {
      audioAnecdoteSpeaker.speak(audioAnecdote, language === "fr" ? "fr-FR" : "en-US");
    }
  };

  const handleConquestClick = () => {
    navigate(`/conquest?search=${encodeURIComponent(config.name)}`);
  };

  const handleAtlasClick = () => {
    navigate(`/atlas?search=${encodeURIComponent(config.name)}`);
  };

  return (
    <div className="card-duo p-5 bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-teal-500/10 border-2 border-amber-300/80 shadow-md relative overflow-hidden group select-none">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

      {/* Header Badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[11px] font-black uppercase tracking-wider shadow-xs">
          <Sparkles className="w-3.5 h-3.5 fill-white" />
          <span>{t("featured.countryOfTheWeek") || "Pays de la Semaine"}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {xpBonusPercent > 0 && (
            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              +{xpBonusPercent}% XP ⚡
            </span>
          )}
          {config.gemBonus > 0 && (
            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 border border-sky-300">
              +{config.gemBonus} 💎
            </span>
          )}
        </div>
      </div>

      {/* Flag & Country Details */}
      <div className="flex items-center gap-3.5 mb-3.5">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-md border-2 border-amber-200 flex items-center justify-center text-4xl group-hover:scale-105 transition-transform shrink-0">
          {config.flagEmoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-slate-900 truncate">
              {config.name}
            </h3>
            {isConquered && (
              <span
                className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black border border-emerald-300 flex items-center gap-1 shrink-0"
                title="Déjà conquis dans votre Pokédex !"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {t("featured.alreadyConquered") || "Conquis"}
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-slate-600 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>{t("featured.capital") || "Capitale :"} {atlasCountry?.capital || (t("featured.toDiscover") || "À découvrir")}</span>
            <span className="text-slate-400">•</span>
            <span>{atlasCountry?.continent || "Monde"}</span>
          </p>
        </div>
      </div>

      {/* Anecdote / Cultural Capsule */}
      <div className="bg-white/90 rounded-2xl p-3.5 border border-amber-200/70 text-xs mb-4 shadow-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-black text-amber-900 flex items-center gap-1.5">
            <span>💡</span>
            <span>{t("featured.culturalCapsule") || "Capsule Culturelle"}</span>
          </span>
          <button
            type="button"
            onClick={handleToggleAudio}
            className={`p-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
              isSpeaking
                ? "bg-amber-500 text-white border-amber-600 animate-pulse"
                : "bg-slate-100 hover:bg-amber-100 text-slate-700 border-slate-200"
            }`}
            title="Écouter l'anecdote de 10 secondes"
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-600" />}
            <span className="text-[10px] font-black">{isSpeaking ? (t("featured.pause") || "Pause") : (t("featured.listen") || "Écouter")}</span>
          </button>
        </div>
        <p className="text-slate-700 font-medium leading-relaxed italic line-clamp-3">
          "{audioAnecdote.text || config.headline}"
        </p>
      </div>

      {/* Dual Tactile CTA Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleConquestClick}
          className="w-full py-2.5 px-3 btn-duo btn-duo-green text-xs font-black flex items-center justify-center gap-1.5"
        >
          <span>{t("featured.conquer") || "Conquérir 🗺️"}</span>
        </button>

        <button
          type="button"
          onClick={handleAtlasClick}
          className="w-full py-2.5 px-3 btn-duo btn-duo-white text-xs font-black flex items-center justify-center gap-1.5"
        >
          <Compass className="w-3.5 h-3.5 text-teal-600" />
          <span>{t("featured.explore") || "Explorer 🌐"}</span>
        </button>
      </div>
    </div>
  );
}
