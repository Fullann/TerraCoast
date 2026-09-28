import { useEffect, useState, useMemo } from 'react';
import {
  Globe2,
  TrendingUp,
  AlertTriangle,
  Award,
  Search,
  Download,
  RefreshCw,
  Star,
  ExternalLink,
  MapPin,
  Users,
  Compass,
  CheckCircle2,
  XCircle,
  HelpCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  fetchCountryIntelligence,
  exportCountryIntelligenceCsv,
  type GlobalCountryIntelligence,
  type CountryMetricData,
  type DifficultyTier,
} from '../../lib/countryTrackingManager';
import { updateSiteConfig, getSiteConfig } from '../../lib/siteConfigManager';
import { toast } from '../common/ToastContainer';
import { playSound } from '../../lib/soundManager';

export function CountryTrackingPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [intel, setIntel] = useState<GlobalCountryIntelligence | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContinent, setSelectedContinent] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rate_asc' | 'rate_desc' | 'attempts_desc' | 'name_asc'>('rate_desc');
  const [inspectingCountry, setInspectingCountry] = useState<CountryMetricData | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchCountryIntelligence('fr');
      setIntel(data);
    } catch (err) {
      console.error('Failed to load country intelligence:', err);
      toast.error('Erreur lors du calcul des statistiques géographiques.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleExportCsv = () => {
    if (!intel) return;
    exportCountryIntelligenceCsv(intel);
    toast.success('Rapport Géo-Intelligence exporté en CSV !');
  };

  const handleSetFeatured = (country: CountryMetricData) => {
    const current = getSiteConfig();
    updateSiteConfig({
      featuredCountry: {
        iso3: country.iso3,
        name: country.name,
        flagEmoji: country.flagEmoji,
        headline: `Semaine Spéciale ${country.name} : Découvrez ses merveilles et gagnez +50% d'XP !`,
        xpMultiplier: 1.5,
        gemBonus: 25,
        isActive: true,
      },
    });
    playSound('fanfare');
    toast.success(`${country.name} ${country.flagEmoji} est maintenant le Pays de la Semaine sur le site !`);
  };

  // Filtered & sorted country list
  const filteredCountries = useMemo(() => {
    if (!intel) return [];
    return intel.allCountries
      .filter((c) => {
        const matchesSearch =
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.iso3.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.capital.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesContinent =
          selectedContinent === 'all' || c.continent.toLowerCase() === selectedContinent.toLowerCase();
        const matchesDifficulty =
          selectedDifficulty === 'all' || c.difficultyTier === selectedDifficulty;
        return matchesSearch && matchesContinent && matchesDifficulty;
      })
      .sort((a, b) => {
        if (sortBy === 'rate_desc') return b.recognitionRate - a.recognitionRate;
        if (sortBy === 'rate_asc') return a.recognitionRate - b.recognitionRate;
        if (sortBy === 'attempts_desc') return b.totalAttempts - a.totalAttempts;
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name, 'fr');
        return 0;
      });
  }, [intel, searchQuery, selectedContinent, selectedDifficulty, sortBy]);

  if (profile?.role !== 'admin') {
    return (
      <div className="w-full px-4 py-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-800">Accès restreint</h2>
          <p className="text-gray-600 mt-1">Vous devez être administrateur pour accéder à ces statistiques.</p>
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
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <Globe2 className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Intelligence Géo & Suivi des Pays
            </h1>
          </div>
          <p className="text-slate-600 text-sm mt-1 max-w-2xl">
            Surveillez en direct les pays les plus facilement reconnus et identifiez les pièges géographiques mondiaux
            pour orienter vos quiz et défis.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => void loadData()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
          <button
            onClick={handleExportCsv}
            disabled={!intel}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {loading || !intel ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="font-semibold text-slate-700">Calcul de l’intelligence géographique mondiale...</p>
          <p className="text-xs text-slate-400 mt-1">Analyse des sessions, taux d’échec et données d’Atlas</p>
        </div>
      ) : (
        <>
          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Top 1 Recognized */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 rounded-2xl border-2 border-emerald-200 p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs font-black uppercase text-emerald-800 mb-2">
                <span>N°1 Pays le plus Reconnu</span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{intel.mostRecognizedCountries[0]?.flagEmoji}</span>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {intel.mostRecognizedCountries[0]?.name}
                  </h3>
                  <p className="text-xs text-emerald-700 font-bold">
                    {intel.mostRecognizedCountries[0]?.recognitionRate.toFixed(1)}% de réussite
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Temps moyen : {intel.mostRecognizedCountries[0]?.averageResponseTimeSeconds}s • {intel.mostRecognizedCountries[0]?.totalAttempts} parties
              </p>
            </div>

            {/* Top 1 Trap */}
            <div className="bg-gradient-to-br from-rose-500/10 to-amber-500/5 rounded-2xl border-2 border-rose-200 p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs font-black uppercase text-rose-800 mb-2">
                <span>Plus Grand Piège Géo</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{intel.mostFailedCountries[0]?.flagEmoji}</span>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">
                    {intel.mostFailedCountries[0]?.name}
                  </h3>
                  <p className="text-xs text-rose-700 font-bold">
                    {intel.mostFailedCountries[0]?.recognitionRate.toFixed(1)}% de réussite seulement
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Angle mort mondial • Temps de réflexion : {intel.mostFailedCountries[0]?.averageResponseTimeSeconds}s
              </p>
            </div>

            {/* Global Coverage */}
            <div className="bg-gradient-to-br from-sky-500/10 to-indigo-500/5 rounded-2xl border-2 border-sky-200 p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs font-black uppercase text-sky-800 mb-2">
                <span>Couverture du Globe</span>
                <Compass className="w-4 h-4 text-sky-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {intel.totalCountriesMonitored}
                </span>
                <span className="text-xs font-bold text-sky-700">pays suivis</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                100% des nations souveraines et territoires répertoriés
              </p>
              <div className="mt-2 h-1.5 bg-sky-200 rounded-full overflow-hidden">
                <div className="h-full bg-sky-600 w-full" />
              </div>
            </div>

            {/* Global Success Rate */}
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-2xl border-2 border-amber-200 p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs font-black uppercase text-amber-800 mb-2">
                <span>Maîtrise Mondiale Moyenne</span>
                <TrendingUp className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {intel.overallSuccessRate.toFixed(1)}%
                </span>
                <span className="text-xs font-bold text-amber-700">précision globale</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Calculé sur {intel.totalWorldwideAttempts.toLocaleString()} réponses
              </p>
              <div className="mt-2 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-600"
                  style={{ width: `${Math.min(100, Math.max(0, intel.overallSuccessRate))}%` }}
                />
              </div>
            </div>
          </div>

          {/* ── Podiums 5 vs 5 : Champions vs Pièges ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 5 Reconnus */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-black text-slate-900">
                      Top 5 Champions de la Reconnaissance
                    </h2>
                    <p className="text-xs text-slate-500">Les silhouettes et pays les plus maîtrisés</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-black bg-emerald-100 text-emerald-800 uppercase">
                  +85% Succès
                </span>
              </div>

              <div className="space-y-3">
                {intel.mostRecognizedCountries.slice(0, 5).map((country, idx) => (
                  <div
                    key={country.iso3}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100/70 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center font-black text-emerald-700 text-sm">
                        #{idx + 1}
                      </span>
                      <span className="text-2xl">{country.flagEmoji}</span>
                      <div>
                        <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{country.name}</span>
                          <span className="text-[10px] font-semibold text-slate-400">({country.iso3})</span>
                        </p>
                        <p className="text-xs text-slate-500">
                          {country.capital} • {country.continent}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-black text-emerald-700 text-sm">
                          {country.recognitionRate.toFixed(1)}%
                        </p>
                        <p className="text-[10px] text-slate-400">{country.averageResponseTimeSeconds}s moy.</p>
                      </div>
                      <button
                        onClick={() => handleSetFeatured(country)}
                        title="Mettre à la une sur le site"
                        className="p-1.5 rounded-lg hover:bg-amber-100 text-slate-400 hover:text-amber-600 transition-colors"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 5 Pièges */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-rose-100 text-rose-800">
                    <XCircle className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-black text-slate-900">
                      Top 5 Pièges Géographiques
                    </h2>
                    <p className="text-xs text-slate-500">Pays les plus confondus, échoués ou méconnus</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-black bg-rose-100 text-rose-800 uppercase">
                  Angle Mort
                </span>
              </div>

              <div className="space-y-3">
                {intel.mostFailedCountries.slice(0, 5).map((country, idx) => (
                  <div
                    key={country.iso3}
                    className="flex items-center justify-between p-3 rounded-xl border border-rose-100 bg-rose-50/40 hover:bg-rose-50/70 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center font-black text-rose-700 text-sm">
                        #{idx + 1}
                      </span>
                      <span className="text-2xl">{country.flagEmoji}</span>
                      <div>
                        <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{country.name}</span>
                          <span className="text-[10px] font-semibold text-slate-400">({country.iso3})</span>
                        </p>
                        <p className="text-xs text-slate-500">
                          {country.capital} • {country.continent}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-black text-rose-700 text-sm">
                          {country.recognitionRate.toFixed(1)}%
                        </p>
                        <p className="text-[10px] text-slate-400">{country.averageResponseTimeSeconds}s réflex.</p>
                      </div>
                      <button
                        onClick={() => handleSetFeatured(country)}
                        title="Créer un défi spécial sur ce pays"
                        className="p-1.5 rounded-lg hover:bg-amber-100 text-slate-400 hover:text-amber-600 transition-colors"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Continent Breakdown ── */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-base font-black text-slate-900 mb-1">
              Maîtrise Géographique par Continent
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Comparaison de l'aisance des joueurs selon les grandes régions du monde.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {intel.continentStats.map((c) => (
                <div
                  key={c.continent}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-black text-slate-700 mb-1">
                      <span>{c.continent}</span>
                      <span className="text-emerald-700 font-black">{c.averageAccuracy.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, c.averageAccuracy))}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {c.countriesCount} pays • {c.masteredCountriesCount} maîtrisés
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Country Explorer Table ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Table Filters Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Répertoire & Radar Mondial des Pays ({filteredCountries.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Recherchez, filtrez et mettez en avant n'importe quel pays sur TerraCoast.
                  </p>
                </div>

                {/* Sort selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Trier par :</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="text-xs font-bold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 shadow-sm"
                  >
                    <option value="rate_desc">Taux de succès (Décroissant)</option>
                    <option value="rate_asc">Taux de succès (Croissant - Pièges d'abord)</option>
                    <option value="attempts_desc">Nombre de parties jouées</option>
                    <option value="name_asc">Nom alphabétique</option>
                  </select>
                </div>
              </div>

              {/* Search & Filter pills */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par pays, code ISO (ex: JPN) ou capitale..."
                    className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Continent Filter */}
                <select
                  value={selectedContinent}
                  onChange={(e) => setSelectedContinent(e.target.value)}
                  className="text-xs sm:text-sm font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700"
                >
                  <option value="all">Tous les Continents</option>
                  <option value="Europe">Europe</option>
                  <option value="Africa">Afrique</option>
                  <option value="Asia">Asie</option>
                  <option value="Americas">Amériques</option>
                  <option value="Oceania">Océanie</option>
                </select>

                {/* Difficulty Filter */}
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="text-xs sm:text-sm font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-700"
                >
                  <option value="all">Toutes Difficultés</option>
                  <option value="very_easy">Très Facile (Incontournable)</option>
                  <option value="easy">Bien Maîtrisé</option>
                  <option value="medium">Équilibré</option>
                  <option value="hard">Délicat</option>
                  <option value="extreme_trap">Grand Piège</option>
                </select>
              </div>
            </div>

            {/* Countries Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Pays</th>
                    <th className="px-4 py-3">Continent</th>
                    <th className="px-4 py-3">Taux de Reconnaissance</th>
                    <th className="px-4 py-3">Niveau</th>
                    <th className="px-4 py-3">Temps Moyen</th>
                    <th className="px-4 py-3">Parties</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCountries.map((c) => {
                    const isTrap = c.difficultyTier === 'extreme_trap' || c.difficultyTier === 'hard';
                    return (
                      <tr key={c.iso3} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl">{c.flagEmoji}</span>
                            <div>
                              <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <span>{c.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">({c.iso3})</span>
                              </p>
                              <p className="text-xs text-slate-500">Capitale : {c.capital}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium">
                          {c.continent}
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-36">
                            <div className="flex items-center justify-between text-xs font-black mb-1">
                              <span className={isTrap ? 'text-rose-700' : 'text-emerald-700'}>
                                {c.recognitionRate.toFixed(1)}%
                              </span>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  c.recognitionRate >= 80
                                    ? 'bg-emerald-500'
                                    : c.recognitionRate >= 50
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(0, c.recognitionRate))}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              c.difficultyTier === 'very_easy'
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.difficultyTier === 'easy'
                                ? 'bg-teal-100 text-teal-800'
                                : c.difficultyTier === 'medium'
                                ? 'bg-amber-100 text-amber-800'
                                : c.difficultyTier === 'hard'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {c.difficultyTier === 'very_easy' && '⭐ Incontournable'}
                            {c.difficultyTier === 'easy' && '🟢 Maîtrisé'}
                            {c.difficultyTier === 'medium' && '🟡 Équilibré'}
                            {c.difficultyTier === 'hard' && '🟠 Délicat'}
                            {c.difficultyTier === 'extreme_trap' && '🔴 Piège Géo'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium">
                          {c.averageResponseTimeSeconds.toFixed(1)}s
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium">
                          {c.totalAttempts.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => setInspectingCountry(c)}
                              className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                              Fiche
                            </button>
                            <button
                              onClick={() => handleSetFeatured(c)}
                              title="Définir comme Pays de la Semaine"
                              className="px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors inline-flex items-center gap-1"
                            >
                              <Star className="w-3.5 h-3.5 fill-amber-500" />
                              <span className="hidden sm:inline">À la une</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCountries.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                        Aucun pays ne correspond à vos critères de recherche.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Country Detail Inspection Modal ── */}
      {inspectingCountry && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{inspectingCountry.flagEmoji}</span>
                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    {inspectingCountry.name} ({inspectingCountry.iso3})
                  </h3>
                  <p className="text-xs text-slate-500">
                    {inspectingCountry.subregion} • Capitale : {inspectingCountry.capital}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingCountry(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-500">Taux de Reconnaissance</p>
                <p className="text-lg font-black text-emerald-700">
                  {inspectingCountry.recognitionRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-500">Temps Moyen de Réponse</p>
                <p className="text-lg font-black text-slate-900">
                  {inspectingCountry.averageResponseTimeSeconds.toFixed(1)}s
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-500">Population Estimée</p>
                <p className="text-sm font-bold text-slate-800">
                  {inspectingCountry.population.toLocaleString()} hab.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-500">Superficie Terrestre</p>
                <p className="text-sm font-bold text-slate-800">
                  {inspectingCountry.areaKm2.toLocaleString()} km²
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 mb-5">
              <p className="font-bold flex items-center gap-1.5 mb-1">
                <Compass className="w-4 h-4 text-amber-700" />
                Conseil Pédagogique Admin :
              </p>
              <p>
                {inspectingCountry.recognitionRate < 50
                  ? `Ce pays fait partie des angles morts majeurs. Créez un quiz thématique ou mettez-le au défi de la semaine pour aider la communauté à s'approprier sa forme géographique.`
                  : `Ce pays est un classique très bien assimilé par les joueurs. Idéal pour des questions plus pointues sur ses fleuves, montagnes ou régions.`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setInspectingCountry(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  handleSetFeatured(inspectingCountry);
                  setInspectingCountry(null);
                }}
                className="px-4 py-2 text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow-sm inline-flex items-center gap-1.5"
              >
                <Star className="w-4 h-4 fill-slate-950" />
                <span>Mettre en Vedette sur le Site</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
