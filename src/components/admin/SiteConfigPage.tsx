import { useState, useEffect } from 'react';
import {
  Palette,
  Megaphone,
  Zap,
  Star,
  Heart,
  Save,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Globe,
  CheckCircle2,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getSiteConfig,
  updateSiteConfig,
  resetSiteConfig,
  type SiteConfig,
  type AnnouncementVariant,
} from '../../lib/siteConfigManager';
import { getAllAtlasCountries } from '../../lib/atlasData';
import { toast } from '../common/ToastContainer';
import { playSound } from '../../lib/soundManager';
import { triggerConfetti } from '../common/Confetti';
import { GlobalAnnouncementBanner } from '../layout/GlobalAnnouncementBanner';

export function SiteConfigPage() {
  const { profile } = useAuth();
  const [config, setConfig] = useState<SiteConfig>(() => getSiteConfig());
  const [isDirty, setIsDirty] = useState(false);
  const atlasCountries = getAllAtlasCountries('fr');

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<SiteConfig>;
      if (customEvent.detail) {
        setConfig(customEvent.detail);
      }
    };
    window.addEventListener('terracost_site_config_updated', handleUpdate);
    return () => {
      window.removeEventListener('terracost_site_config_updated', handleUpdate);
    };
  }, []);

  const handleChange = <K extends keyof SiteConfig>(section: K, changes: Partial<SiteConfig[K]>) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        ...changes,
      },
    }));
    setIsDirty(true);
  };

  const handleSave = () => {
    updateSiteConfig(config);
    setIsDirty(false);
    playSound('fanfare');
    triggerConfetti();
    toast.success('Paramètres et personnalisation du site enregistrés en direct !');
  };

  const handleReset = () => {
    if (confirm('Voulez-vous rétablir la configuration par défaut du site ?')) {
      const def = resetSiteConfig();
      setConfig(def);
      setIsDirty(false);
      toast.info('Configuration réinitialisée aux valeurs par défaut.');
    }
  };

  const handleCountrySelect = (iso3: string) => {
    const found = atlasCountries.find((c) => c.iso3 === iso3);
    if (found) {
      handleChange('featuredCountry', {
        iso3: found.iso3,
        name: found.name,
        flagEmoji: found.flagEmoji,
        headline: `Semaine Spéciale ${found.name} : Découvrez ses merveilles et gagnez +50% d'XP !`,
      });
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="w-full px-4 py-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-800">Accès restreint</h2>
          <p className="text-gray-600 mt-1">Vous devez être administrateur pour modifier la personnalisation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-2 sm:px-4 py-4 space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-violet-100 text-violet-800">
              <Palette className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Personnalisation & Réglages du Site
            </h1>
          </div>
          <p className="text-slate-600 text-sm mt-1 max-w-2xl">
            Configurez la bannière d'annonce globale, les événements double XP, le pays à l'honneur de la semaine
            et l'ambiance visuelle en direct sur TerraCoast.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold shadow-sm transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Rétablir par défaut</span>
          </button>
          <button
            onClick={handleSave}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-bold shadow-sm transition-all active:scale-95 ${
              isDirty
                ? 'bg-emerald-600 hover:bg-emerald-700 ring-4 ring-emerald-500/20 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{isDirty ? 'Enregistrer les modifications *' : 'Enregistrer'}</span>
          </button>
        </div>
      </div>

      {/* ── Section 1 : Bannière d'Annonce Globale ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Megaphone className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                1. Bannière d'Annonce Globale sur tout le site
              </h2>
              <p className="text-xs text-slate-500">
                Message dynamique épinglé au sommet de la plateforme, visible par tous les joueurs.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <label className="flex items-center gap-2.5 cursor-pointer self-start sm:self-auto">
            <span className="text-xs font-bold text-slate-700">
              {config.announcement.enabled ? '🟢 Bannière Active' : '⚪ Désactivée'}
            </span>
            <input
              type="checkbox"
              checked={config.announcement.enabled}
              onChange={(e) => handleChange('announcement', { enabled: e.target.checked })}
              className="sr-only"
            />
            <div
              className={`w-11 h-6 rounded-full transition-colors relative ${
                config.announcement.enabled ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${
                  config.announcement.enabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
          </label>
        </div>

        {/* Live Preview Box */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Aperçu en direct (tel qu'affiché aux joueurs)</span>
          </p>
          <div className="rounded-xl overflow-hidden border-2 border-slate-200/80 shadow-sm">
            <GlobalAnnouncementBanner />
          </div>
        </div>

        {/* Form Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Variant Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Thème & Style Visuel
            </label>
            <select
              value={config.announcement.variant}
              onChange={(e) =>
                handleChange('announcement', { variant: e.target.value as AnnouncementVariant })
              }
              className="w-full text-xs sm:text-sm font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700"
            >
              <option value="celebration">🎉 Célébration (Violet / Or Dégradé)</option>
              <option value="success">🟢 Succès / Événement (Émeraude)</option>
              <option value="info">🔵 Information (Bleu Océan)</option>
              <option value="warning">🟡 Attention / Annonce (Ambre)</option>
              <option value="alert">🔴 Urgent / Alerte (Rose / Rouge)</option>
            </select>
          </div>

          {/* Badge text */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Texte du Badge Pilule
            </label>
            <input
              type="text"
              value={config.announcement.badgeText}
              onChange={(e) => handleChange('announcement', { badgeText: e.target.value })}
              placeholder="ex: NOUVEAU, ÉVÉNEMENT, INFO..."
              className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Dismissible Toggle */}
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="dismissible-check"
              checked={config.announcement.dismissible}
              onChange={(e) => handleChange('announcement', { dismissible: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <label htmlFor="dismissible-check" className="text-xs font-bold text-slate-700 cursor-pointer">
              Autoriser le joueur à masquer la bannière (X)
            </label>
          </div>

          {/* Announcement Message */}
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Message Principal de l'Annonce
            </label>
            <input
              type="text"
              value={config.announcement.message}
              onChange={(e) =>
                handleChange('announcement', {
                  message: e.target.value,
                  // change ID so dismissed users see the updated text
                  id: `announcement-${Date.now().toString(36)}`,
                })
              }
              placeholder="Texte de l'annonce visible par tous les utilisateurs..."
              className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Action Button Label */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Bouton d'Action (Optionnel)
            </label>
            <input
              type="text"
              value={config.announcement.actionText}
              onChange={(e) => handleChange('announcement', { actionText: e.target.value })}
              placeholder="ex: Découvrir, Participer..."
              className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2"
            />
          </div>

          {/* Action Button URL */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lien Cible du Bouton (Route interne ou URL)
            </label>
            <input
              type="text"
              value={config.announcement.actionUrl}
              onChange={(e) => handleChange('announcement', { actionUrl: e.target.value })}
              placeholder="ex: /atlas, /duels, /games, /quizzes..."
              className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2 font-mono"
            />
          </div>
        </div>
      </div>

      {/* ── Section 2 : Événements en Direct & Multiplicateurs ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Zap className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                2. Événements en Direct & Bonus d'Expérience (XP)
              </h2>
              <p className="text-xs text-slate-500">
                Boostez l'engagement des joueurs lors des week-ends et tournois avec des multiplicateurs.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer self-start sm:self-auto">
            <span className="text-xs font-bold text-slate-700">
              {config.gameplay.isEventActive ? '⚡ Événement Spécial En Cours' : 'Normal (x1)'}
            </span>
            <input
              type="checkbox"
              checked={config.gameplay.isEventActive}
              onChange={(e) => handleChange('gameplay', { isEventActive: e.target.checked })}
              className="sr-only"
            />
            <div
              className={`w-11 h-6 rounded-full transition-colors relative ${
                config.gameplay.isEventActive ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${
                  config.gameplay.isEventActive ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Multiplicateur Global d'XP
            </label>
            <select
              value={config.gameplay.globalXpMultiplier}
              onChange={(e) =>
                handleChange('gameplay', { globalXpMultiplier: Number(e.target.value) })
              }
              className="w-full text-xs sm:text-sm font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
            >
              <option value="1">1.0x (Standard)</option>
              <option value="1.5">1.5x (+50% XP)</option>
              <option value="2">2.0x (⚡ Double XP)</option>
              <option value="3">3.0x (🔥 Triple XP Week-end)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nom / Thème de l'Événement
            </label>
            <input
              type="text"
              value={config.gameplay.eventTitle}
              onChange={(e) => handleChange('gameplay', { eventTitle: e.target.value })}
              placeholder="ex: Week-end Double XP ⚡"
              className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Récompense Quotidienne (Streak Gems)
            </label>
            <input
              type="number"
              min="5"
              max="200"
              value={config.gameplay.dailyStreakGems}
              onChange={(e) =>
                handleChange('gameplay', { dailyStreakGems: Number(e.target.value) || 25 })
              }
              className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Gemmes Bonus par Victoire en Duel
            </label>
            <input
              type="number"
              min="5"
              max="100"
              value={config.gameplay.victoryGemsReward}
              onChange={(e) =>
                handleChange('gameplay', { victoryGemsReward: Number(e.target.value) || 15 })
              }
              className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* ── Section 3 : Pays de la Semaine (Spotlight) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-rose-100 text-rose-800">
              <Star className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                3. Pays à l'Honneur & Défi de la Semaine
              </h2>
              <p className="text-xs text-slate-500">
                Mettez en avant un pays spécifique avec un bonus d'XP et un badge vedette.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer self-start sm:self-auto">
            <span className="text-xs font-bold text-slate-700">
              {config.featuredCountry.isActive ? '⭐ Pays Vedette Actif' : '⚪ Désactivé'}
            </span>
            <input
              type="checkbox"
              checked={config.featuredCountry.isActive}
              onChange={(e) => handleChange('featuredCountry', { isActive: e.target.checked })}
              className="sr-only"
            />
            <div
              className={`w-11 h-6 rounded-full transition-colors relative ${
                config.featuredCountry.isActive ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${
                  config.featuredCountry.isActive ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Sélectionner le Pays Vedette
            </label>
            <select
              value={config.featuredCountry.iso3 || 'JPN'}
              onChange={(e) => handleCountrySelect(e.target.value)}
              className="w-full text-xs sm:text-sm font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
            >
              {atlasCountries.map((c) => (
                <option key={c.iso3} value={c.iso3}>
                  {c.flagEmoji} {c.name} ({c.iso3})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Phrase d'Accroche sur l'Accueil et dans l'Atlas
            </label>
            <input
              type="text"
              value={config.featuredCountry.headline}
              onChange={(e) => handleChange('featuredCountry', { headline: e.target.value })}
              placeholder="ex: Semaine Spéciale Japon : Découvrez l'archipel..."
              className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Bonus d'XP sur ce Pays
            </label>
            <select
              value={config.featuredCountry.xpMultiplier}
              onChange={(e) =>
                handleChange('featuredCountry', { xpMultiplier: Number(e.target.value) })
              }
              className="w-full text-xs sm:text-sm font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
            >
              <option value="1.25">+25% d'XP</option>
              <option value="1.5">+50% d'XP (Recommandé)</option>
              <option value="2.0">+100% d'XP (Double XP)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Gemmes Bonus à la Conquête
            </label>
            <input
              type="number"
              min="10"
              max="200"
              value={config.featuredCountry.gemBonus}
              onChange={(e) =>
                handleChange('featuredCountry', { gemBonus: Number(e.target.value) || 25 })
              }
              className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2"
            />
          </div>

          {/* Visual Preview Pill */}
          <div className="flex items-center p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 gap-3">
            <span className="text-3xl">{config.featuredCountry.flagEmoji}</span>
            <div>
              <p className="text-xs font-black text-amber-900">
                {config.featuredCountry.name} en Vedette
              </p>
              <p className="text-[11px] text-amber-700">
                +{Math.round((config.featuredCountry.xpMultiplier - 1) * 100)}% XP • +{config.featuredCountry.gemBonus} 💎
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 4 : Gameplay, Cœurs & Règles ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <span className="p-2 rounded-xl bg-rose-100 text-rose-800">
            <Heart className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              4. Économie de Jeu, Vies & Régénération
            </h2>
            <p className="text-xs text-slate-500">
              Ajustez la tolérance aux erreurs et le rythme de jeu pour vos utilisateurs.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Vies Maximales par Défaut
            </label>
            <select
              value={config.gameplay.maxLives}
              onChange={(e) =>
                handleChange('gameplay', { maxLives: Number(e.target.value) })
              }
              className="w-full text-xs sm:text-sm font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
            >
              <option value="3">3 Cœurs (Mode Difficile)</option>
              <option value="5">5 Cœurs (Standard Équilibré)</option>
              <option value="10">10 Cœurs (Tolérant)</option>
              <option value="-1">♾️ Vies Illimitées (Événement Pédagogique)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Temps de Régénération d'un Cœur
            </label>
            <select
              value={config.gameplay.heartRechargeMinutes}
              onChange={(e) =>
                handleChange('gameplay', { heartRechargeMinutes: Number(e.target.value) })
              }
              className="w-full text-xs sm:text-sm font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
            >
              <option value="15">15 minutes (Rapide)</option>
              <option value="30">30 minutes (Standard)</option>
              <option value="60">60 minutes (Compétitif)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Thème Visuel 3D par Défaut
            </label>
            <select
              value={config.theme.defaultGlobeTheme}
              onChange={(e) =>
                handleChange('theme', { defaultGlobeTheme: e.target.value as any })
              }
              className="w-full text-xs sm:text-sm font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
            >
              <option value="realistic">🌍 Réaliste & Relief</option>
              <option value="neon">⚡ Néon Cyberpunk</option>
              <option value="pastel">🎨 Pastel Doux</option>
              <option value="night">🌃 Nuit & Villes Éclairées</option>
              <option value="satellite">🛰️ Satellite HD</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
