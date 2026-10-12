import { useState, useEffect } from 'react';
import {
  Palette,
  Megaphone,
  Zap,
  Star,
  Trophy,
  Wrench,
  Save,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Globe,
  MapPin,
  Volume2,
  VolumeX,
  Landmark,
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
import { getAudioAnecdoteForCountry } from '../../lib/audioAnecdotesData';
import { audioAnecdoteSpeaker } from '../../lib/audioAnecdoteSpeaker';
import { toast } from '../common/ToastContainer';
import { playSound } from '../../lib/soundManager';
import { triggerConfetti } from '../common/Confetti';
import { GlobalAnnouncementBanner } from '../layout/GlobalAnnouncementBanner';

export function SiteConfigPage() {
  const { profile } = useAuth();
  const [config, setConfig] = useState<SiteConfig>(() => getSiteConfig());
  const [isDirty, setIsDirty] = useState(false);
  const [isTestingAudio, setIsTestingAudio] = useState(false);
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

  useEffect(() => {
    const unsub = audioAnecdoteSpeaker.subscribe((speaking) => {
      setIsTestingAudio(speaking);
    });
    return () => {
      unsub();
      audioAnecdoteSpeaker.stop();
    };
  }, []);

  const handleCountrySelect = (iso3: string) => {
    const found = atlasCountries.find((c) => c.iso3 === iso3);
    if (found) {
      const audioAnecdote = getAudioAnecdoteForCountry(found.iso3, found.name, found.flagEmoji);
      handleChange('featuredCountry', {
        iso3: found.iso3,
        name: found.name,
        flagEmoji: found.flagEmoji,
        headline: `Semaine Spéciale ${found.name} : Découvrez ses merveilles et gagnez +50% d'XP !`,
        capital: found.capital || '',
        continent: found.continent || '',
        customBadgeText: 'PAYS DE LA SEMAINE',
        customAnecdote: audioAnecdote.text || '',
        highlightMonument: '',
      });
    }
  };

  const handleToggleTestAudio = () => {
    if (isTestingAudio) {
      audioAnecdoteSpeaker.stop();
    } else {
      const anecdoteToSpeak = {
        iso3: config.featuredCountry.iso3 || 'WLD',
        countryName: config.featuredCountry.name || 'Pays Vedette',
        flag: config.featuredCountry.flagEmoji || '🌍',
        text: config.featuredCountry.customAnecdote || config.featuredCountry.headline || "Pays en vedette sur TerraCoast.",
        durationSeconds: 10,
      };
      audioAnecdoteSpeaker.speak(anecdoteToSpeak, 'fr-FR');
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
                Personnalisez le pays vedette affiché sur la page d'accueil avec son badge, ses anecdotes, sa voix et ses bonus.
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

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Sélection Pays (4 cols) */}
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Sélectionner le Territoire (250 Pays)
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
            <p className="text-[10px] text-slate-400 mt-1">
              La sélection préremplit automatiquement la capitale, le continent et l'anecdote vocale.
            </p>
          </div>

          {/* Badge Titre Personnalisé (4 cols) */}
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Badge d'En-tête (ex: PAYS DE LA SEMAINE)
            </label>
            <input
              type="text"
              value={config.featuredCountry.customBadgeText || 'PAYS DE LA SEMAINE'}
              onChange={(e) => handleChange('featuredCountry', { customBadgeText: e.target.value })}
              placeholder="ex: PAYS DE LA SEMAINE, DÉFI SPÉCIAL..."
              className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2 font-black uppercase text-amber-900"
            />
          </div>

          {/* Nom affiché (4 cols) */}
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nom Officiel Affiché
            </label>
            <input
              type="text"
              value={config.featuredCountry.name}
              onChange={(e) => handleChange('featuredCountry', { name: e.target.value })}
              placeholder="Nom du pays..."
              className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold"
            />
          </div>

          {/* Phrase d'accroche (8 cols) */}
          <div className="md:col-span-8">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Phrase d'Accroche Principale (Slogan)
            </label>
            <input
              type="text"
              value={config.featuredCountry.headline}
              onChange={(e) => handleChange('featuredCountry', { headline: e.target.value })}
              placeholder="ex: Semaine Spéciale Japon : Découvrez l'archipel nippon..."
              className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2"
            />
          </div>

          {/* Monument ou site emblématique (4 cols) */}
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Monument / Symbole Remarquable
            </label>
            <div className="relative">
              <input
                type="text"
                value={config.featuredCountry.highlightMonument || ''}
                onChange={(e) => handleChange('featuredCountry', { highlightMonument: e.target.value })}
                placeholder="ex: Mont Fuji & Sanctuaires"
                className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-2"
              />
              <Landmark className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>
          </div>

          {/* Capitale (3 cols) */}
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Capitale
            </label>
            <input
              type="text"
              value={config.featuredCountry.capital || ''}
              onChange={(e) => handleChange('featuredCountry', { capital: e.target.value })}
              placeholder="Capitale..."
              className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium"
            />
          </div>

          {/* Continent (3 cols) */}
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Continent
            </label>
            <input
              type="text"
              value={config.featuredCountry.continent || ''}
              onChange={(e) => handleChange('featuredCountry', { continent: e.target.value })}
              placeholder="Continent..."
              className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium"
            />
          </div>

          {/* Multiplicateur XP (3 cols) */}
          <div className="md:col-span-3">
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
              <option value="3.0">+200% d'XP (Triple XP)</option>
            </select>
          </div>

          {/* Gemmes Bonus (3 cols) */}
          <div className="md:col-span-3">
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
              className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold"
            />
          </div>

          {/* Capsule Culturelle / Anecdote Vocale (12 cols) */}
          <div className="md:col-span-12 bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-black text-amber-950 flex items-center gap-1.5">
                <span>💡</span>
                <span>Capsule Culturelle & Anecdote Vocale (10 Secondes)</span>
              </label>

              <button
                type="button"
                onClick={handleToggleTestAudio}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                  isTestingAudio
                    ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                    : 'bg-white hover:bg-amber-100 text-amber-900 border-amber-300'
                }`}
                title="Tester la synthèse vocale sur cette anecdote"
              >
                {isTestingAudio ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>Arrêter l'Écoute</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Tester la Voix (Lecture 10s)</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={3}
              value={config.featuredCountry.customAnecdote || ''}
              onChange={(e) => handleChange('featuredCountry', { customAnecdote: e.target.value })}
              placeholder="Écrivez une anecdote fascinante sur le pays. Elle sera affichée sur la page d'accueil et récitée par la voix naturelle..."
              className="w-full text-xs sm:text-sm bg-white border border-amber-300 rounded-xl p-3 focus:ring-2 focus:ring-amber-500 text-slate-800 italic"
            />
            <p className="text-[11px] text-amber-800/80 mt-1">
              Cette anecdote est directement lue sur la page d'accueil par le lecteur audio interactif avec atténuation automatique du son.
            </p>
          </div>

          {/* Aperçu en direct Haute Fidélité (12 cols) */}
          <div className="md:col-span-12 bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-inner">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Rendu en Direct sur la Page d'Accueil</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {config.featuredCountry.isActive ? '🟢 En Ligne' : '⚪ Masqué'}
              </span>
            </div>

            <div className="max-w-xl mx-auto bg-slate-800/90 rounded-2xl p-4 border border-amber-400/40 shadow-xl">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider">
                  {config.featuredCountry.customBadgeText || 'PAYS DE LA SEMAINE'}
                </span>
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    +{Math.round((config.featuredCountry.xpMultiplier - 1) * 100)}% XP ⚡
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-300 border border-sky-400/40">
                    +{config.featuredCountry.gemBonus} 💎
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl">
                  {config.featuredCountry.flagEmoji}
                </div>
                <div>
                  <h4 className="text-base font-black text-white">{config.featuredCountry.name}</h4>
                  <p className="text-xs text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span>Capitale : {config.featuredCountry.capital || 'À découvrir'}</span>
                    <span className="text-slate-500">•</span>
                    <span>{config.featuredCountry.continent || 'Monde'}</span>
                  </p>
                  {config.featuredCountry.highlightMonument && (
                    <p className="text-[11px] text-amber-300 font-medium">
                      🏛️ {config.featuredCountry.highlightMonument}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-slate-900/80 rounded-xl p-2.5 border border-amber-500/30 text-xs italic text-slate-300">
                "{config.featuredCountry.customAnecdote || config.featuredCountry.headline}"
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 4 : Économie de Jeu, Récompenses & Gamification ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
            <Trophy className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              4. Économie de Jeu, Récompenses & Règles
            </h2>
            <p className="text-xs text-slate-500">
              Ajustez les gains de gemmes, les seuils d'apprentissage et le rythme des parties pour vos joueurs.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              💎 Gain de Gemmes par Quiz Gagné
            </label>
            <select
              value={config.gameplay.victoryGemsReward}
              onChange={(e) =>
                handleChange('gameplay', { victoryGemsReward: Number(e.target.value) })
              }
              className="w-full text-xs sm:text-sm font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
            >
              <option value="10">10 💎 (Économie Resserée)</option>
              <option value="15">15 💎 (Standard Équilibré)</option>
              <option value="25">25 💎 (Généreux)</option>
              <option value="50">50 💎 (Festival / Événement)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              🔥 Bonus Série Quotidienne (Streak)
            </label>
            <select
              value={config.gameplay.dailyStreakGems}
              onChange={(e) =>
                handleChange('gameplay', { dailyStreakGems: Number(e.target.value) })
              }
              className="w-full text-xs sm:text-sm font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
            >
              <option value="15">15 💎 par jour consécutif</option>
              <option value="25">25 💎 par jour consécutif</option>
              <option value="50">50 💎 par jour consécutif</option>
              <option value="100">100 💎 par jour consécutif</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              🗺️ Seuil de Conquête Pokédex
            </label>
            <select
              value={config.gameplay.conquestAccuracyThreshold ?? 80}
              onChange={(e) =>
                handleChange('gameplay', { conquestAccuracyThreshold: Number(e.target.value) })
              }
              className="w-full text-xs sm:text-sm font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
            >
              <option value="70">≥ 70% de précision (Très Accessible)</option>
              <option value="75">≥ 75% de précision (Accessible)</option>
              <option value="80">≥ 80% de précision (Standard Maîtrise)</option>
              <option value="85">≥ 85% de précision (Exigeant)</option>
              <option value="90">≥ 90% de précision (Expert)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ⏱️ Chronomètre par Question
            </label>
            <select
              value={config.gameplay.quizTimerSeconds ?? 20}
              onChange={(e) =>
                handleChange('gameplay', { quizTimerSeconds: Number(e.target.value) })
              }
              className="w-full text-xs sm:text-sm font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
            >
              <option value="15">⚡ 15 secondes (Rythme Rapide)</option>
              <option value="20">⏳ 20 secondes (Standard)</option>
              <option value="30">🧘 30 secondes (Détendu)</option>
              <option value="0">♾️ Pas de limite (Mode Zen)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Section 5 : Ambiance Visuelle & Thèmes 3D ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <span className="p-2 rounded-xl bg-cyan-100 text-cyan-800">
            <Globe className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-black text-slate-900">
              5. Ambiance Visuelle & Thèmes Cartographiques
            </h2>
            <p className="text-xs text-slate-500">
              Définissez le style visuel par défaut du globe 3D et le continent mis en avant pour les nouveaux arrivants.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Thème Visuel du Globe 3D par Défaut
            </label>
            <select
              value={config.theme.defaultGlobeTheme}
              onChange={(e) =>
                handleChange('theme', { defaultGlobeTheme: e.target.value as any })
              }
              className="w-full text-xs sm:text-sm font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
            >
              <option value="satellite">🛰️ Satellite HD (Photographie spatiale)</option>
              <option value="realistic">🌍 Réaliste & Relief</option>
              <option value="neon">⚡ Néon Cyberpunk</option>
              <option value="pastel">🎨 Pastel Doux</option>
              <option value="night">🌃 Nuit & Villes Éclairées</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Continent Mis en Avant sur la Page d'Accueil
            </label>
            <select
              value={config.theme.featuredContinent}
              onChange={(e) =>
                handleChange('theme', { featuredContinent: e.target.value })
              }
              className="w-full text-xs sm:text-sm font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
            >
              <option value="all">🌐 Monde Entier (Tous les Continents)</option>
              <option value="Europe">🇪🇺 Europe</option>
              <option value="Asia">🌏 Asie</option>
              <option value="Africa">🌍 Afrique</option>
              <option value="Americas">🌎 Amériques</option>
              <option value="Oceania">🏝️ Océanie</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Section 6 : Mode Maintenance & Disponibilité ── */}
      <div className={`rounded-2xl border p-5 sm:p-6 shadow-sm space-y-4 transition-all ${
        config.theme.maintenanceMode
          ? 'bg-amber-50/70 border-amber-300'
          : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className={`p-2 rounded-xl ${
              config.theme.maintenanceMode ? 'bg-amber-200 text-amber-900' : 'bg-slate-100 text-slate-700'
            }`}>
              <Wrench className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">
                  6. Mode Maintenance & Verrouillage Temporaire
                </h2>
                {config.theme.maintenanceMode && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider animate-pulse">
                    Actif
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Affiche une page de maintenance aux visiteurs ordinaires tout en laissant l'accès aux administrateurs.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={config.theme.maintenanceMode}
              onChange={(e) =>
                handleChange('theme', { maintenanceMode: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            <span className="ml-3 text-xs font-bold text-slate-700">
              {config.theme.maintenanceMode ? 'Maintenance Activée' : 'Site Ouvert au Public'}
            </span>
          </label>
        </div>

        {config.theme.maintenanceMode && (
          <div className="pt-2 animate-in fade-in">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Message d'information affiché aux utilisateurs
            </label>
            <textarea
              rows={2}
              value={config.theme.maintenanceMessage}
              onChange={(e) =>
                handleChange('theme', { maintenanceMessage: e.target.value })
              }
              className="w-full text-xs sm:text-sm bg-white border border-amber-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              placeholder="Ex: TerraCoast fait peau neuve ! Nos cartographes reviennent dans quelques minutes..."
            />
          </div>
        )}
      </div>
    </div>
  );
}

