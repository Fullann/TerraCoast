import { useState, useEffect, useMemo, useRef, type ChangeEvent } from "react";
import {
  Sparkles,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Download,
  Upload,
  RotateCcw,
  Check,
  X,
  Layers,
  BookOpen,
  Award,
} from "lucide-react";
import {
  type TerraCard,
  type CardRarity,
  type CardCategory,
  type CardContinent,
  RARITY_CONFIG,
  CATEGORY_CONFIG,
} from "../../lib/cardsData";
import {
  getCardsCatalog,
  adminSaveCard,
  adminUpdateCardRarity,
  adminDeleteCard,
  adminResetCardsCatalog,
  adminExportCardsCatalog,
  adminImportCardsCatalog,
  syncCardsCatalogFromSupabase,
} from "../../lib/cardsManager";
import { CollectibleCard } from "../cards/CollectibleCard";
import { playSound } from "../../lib/soundManager";
import { toast } from "../common/ToastContainer";

export function CardsManagementPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRarity, setSelectedRarity] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedContinent, setSelectedContinent] = useState<string>("all");
  const [selectedOrigin, setSelectedOrigin] = useState<"all" | "builtin" | "custom">("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Modales
  const [previewCard, setPreviewCard] = useState<TerraCard | null>(null);
  const [editingCard, setEditingCard] = useState<TerraCard | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Catalogue actif
  const catalog = useMemo(() => getCardsCatalog(), [refreshTrigger]);

  const forceRefresh = () => setRefreshTrigger((prev) => prev + 1);

  useEffect(() => {
    syncCardsCatalogFromSupabase().then((res) => {
      if (res.success) {
        forceRefresh();
      }
    });
  }, []);

  // Statistiques calculées du catalogue
  const stats = useMemo(() => {
    const total = catalog.length;
    const byRarity: Record<CardRarity, number> = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
      mythic: 0,
    };
    const byCategory: Record<CardCategory, number> = {
      country: 0,
      region: 0,
      language: 0,
      figure: 0,
      wonder: 0,
    };
    const byContinent: Record<string, number> = {};
    let customCount = 0;

    catalog.forEach((card) => {
      byRarity[card.rarity] = (byRarity[card.rarity] || 0) + 1;
      byCategory[card.category] = (byCategory[card.category] || 0) + 1;
      byContinent[card.continent] = (byContinent[card.continent] || 0) + 1;
      if (card.number > 60 || card.id.startsWith("custom_")) {
        customCount += 1;
      }
    });

    return {
      total,
      customCount,
      byRarity,
      byCategory,
      byContinent,
    };
  }, [catalog]);

  // Filtrage du catalogue
  const filteredCatalog = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return catalog.filter((card) => {
      if (selectedRarity !== "all" && card.rarity !== selectedRarity) return false;
      if (selectedCategory !== "all" && card.category !== selectedCategory) return false;
      if (selectedContinent !== "all" && card.continent !== selectedContinent) return false;

      const isCustom = card.number > 60 || card.id.startsWith("custom_");
      if (selectedOrigin === "builtin" && isCustom) return false;
      if (selectedOrigin === "custom" && !isCustom) return false;

      if (q) {
        const matchesName = card.name.toLowerCase().includes(q);
        const matchesTagline = card.tagline.toLowerCase().includes(q);
        const matchesId = card.id.toLowerCase().includes(q);
        const matchesNumber = String(card.number).includes(q);
        const matchesContinent = card.continent.toLowerCase().includes(q);
        const matchesFunFact = card.funFact.toLowerCase().includes(q);
        if (
          !matchesName &&
          !matchesTagline &&
          !matchesId &&
          !matchesNumber &&
          !matchesContinent &&
          !matchesFunFact
        ) {
          return false;
        }
      }
      return true;
    });
  }, [catalog, searchQuery, selectedRarity, selectedCategory, selectedContinent, selectedOrigin]);

  // Changement rapide de rareté en 1 clic
  const handleQuickRarityChange = (card: TerraCard, newRarity: CardRarity) => {
    playSound("click");
    const res = adminUpdateCardRarity(card.id, newRarity);
    if (res.success) {
      toast.success(res.message);
      forceRefresh();
    } else {
      toast.error(res.message);
    }
  };

  // Suppression / Masquage
  const handleDeleteCard = (card: TerraCard) => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer / masquer la carte « ${card.name} » (#${card.number}) ?`
      )
    ) {
      return;
    }
    playSound("click");
    const res = adminDeleteCard(card.id);
    if (res.success) {
      toast.success(res.message);
      forceRefresh();
    } else {
      toast.error(res.message);
    }
  };

  // Réinitialisation d'origine
  const handleResetCatalog = () => {
    if (
      !confirm(
        "⚠️ Attention : Cette action va réinitialiser le catalogue entier aux 60 cartes officielles d'origine. Les cartes personnalisées et surcharges seront effacées. Continuer ?"
      )
    ) {
      return;
    }
    playSound("click");
    const res = adminResetCardsCatalog();
    toast.success(res.message);
    forceRefresh();
  };

  // Export JSON
  const handleExportJson = () => {
    playSound("click");
    const jsonStr = adminExportCardsCatalog();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `terracoast_cards_catalog_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Catalogue exporté au format JSON !");
  };

  // Import JSON par fichier
  const handleFileImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = adminImportCardsCatalog(content);
        if (res.success) {
          toast.success(res.message);
          forceRefresh();
        } else {
          toast.error(res.message);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Import JSON textuel
  const handleTextImportSubmit = () => {
    if (!importJsonText.trim()) return;
    const res = adminImportCardsCatalog(importJsonText);
    if (res.success) {
      toast.success(res.message);
      setIsImportModalOpen(false);
      setImportJsonText("");
      forceRefresh();
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── EN-TÊTE & BOUTONS D'ACTION ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Gestion des TerraCards & Raretés
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Supervisez l'intégralité du Pokédex cartographique, modifiez les raretés en 1 clic,
            créez de nouvelles cartes d'exploration et analysez les probabilités d'ouverture des boosters.
          </p>
        </div>

        {/* Boutons d'actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playSound("click");
              setIsCreating(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Carte</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            title="Exporter tout le catalogue au format JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter JSON</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playSound("click");
              setIsImportModalOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            title="Importer un fichier JSON de cartes"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importer</span>
          </button>

          <button
            type="button"
            onClick={handleResetCatalog}
            className="p-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all cursor-pointer"
            title="Réinitialiser aux 60 cartes officielles"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Input de fichier caché pour l'import direct */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        accept=".json"
        className="hidden"
      />

      {/* ── DASHBOARD KPI & RÉPARTITION ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cartes */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Catalogue Actif</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-500 font-bold">Cartes au total</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
            <span>60 Officielles</span>
            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-black text-[10px]">
              +{stats.customCount} Personnalisées
            </span>
          </div>
        </div>

        {/* Raretés */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Pyramide des Raretés</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 grid grid-cols-5 gap-1 text-center">
            <div className="bg-slate-100 rounded-lg py-1">
              <span className="text-[10px] block font-bold text-slate-500">Com.</span>
              <span className="text-xs font-black text-slate-800">{stats.byRarity.common}</span>
            </div>
            <div className="bg-sky-50 rounded-lg py-1 border border-sky-200">
              <span className="text-[10px] block font-bold text-sky-700">Rare</span>
              <span className="text-xs font-black text-sky-900">{stats.byRarity.rare}</span>
            </div>
            <div className="bg-purple-50 rounded-lg py-1 border border-purple-200">
              <span className="text-[10px] block font-bold text-purple-700">Épiq.</span>
              <span className="text-xs font-black text-purple-900">{stats.byRarity.epic}</span>
            </div>
            <div className="bg-amber-50 rounded-lg py-1 border border-amber-200">
              <span className="text-[10px] block font-bold text-amber-700">Lég.</span>
              <span className="text-xs font-black text-amber-900">{stats.byRarity.legendary}</span>
            </div>
            <div className="bg-pink-50 rounded-lg py-1 border border-pink-200">
              <span className="text-[10px] block font-bold text-pink-700">Myth.</span>
              <span className="text-xs font-black text-pink-900">{stats.byRarity.mythic}</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-500 font-bold text-center">
            Probabilité Mythique dans booster standard : 0.6%
          </div>
        </div>

        {/* Catégories Thématiques */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Thématiques TerraDex</span>
            <BookOpen className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-bold text-slate-700">
            <span title="Pays">🇫🇷 {stats.byCategory.country}</span>
            <span title="Régions & Cantons">🏔️ {stats.byCategory.region}</span>
            <span title="Langues">🗣️ {stats.byCategory.language}</span>
            <span title="Explorateurs">🧭 {stats.byCategory.figure}</span>
            <span title="Merveilles">🌋 {stats.byCategory.wonder}</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>5 Piliers Géographiques</span>
            <span className="font-bold text-emerald-600">Complet</span>
          </div>
        </div>

        {/* Économie Poussière d'Étoile 🪐 */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Économie de Forge 🪐</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-1 text-xs text-slate-600 space-y-0.5">
            <div className="flex justify-between">
              <span>Coût Commune :</span>
              <span className="font-mono font-bold text-slate-900">60 🪐</span>
            </div>
            <div className="flex justify-between">
              <span>Coût Mythique :</span>
              <span className="font-mono font-bold text-purple-700">2500 🪐</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-purple-600 font-black">
            ✦ Les doublons se recyclent automatiquement
          </div>
        </div>
      </div>

      {/* ── BARRE DE FILTRES ET RECHERCHE ── */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Recherche texte */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, pays, #001..."
              className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Bascule Vue Tableau vs Galerie */}
          <div className="flex items-center gap-1.5 self-end sm:self-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                viewMode === "table"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Mode Tableau
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                viewMode === "grid"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Mode Galerie 3D
            </button>
          </div>
        </div>

        {/* Filtres de sélection */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs font-medium">
          {/* Rareté */}
          <select
            value={selectedRarity}
            onChange={(e) => setSelectedRarity(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold focus:outline-none"
          >
            <option value="all">Toutes les Raretés</option>
            <option value="common">⚪ Communes</option>
            <option value="rare">🔵 Rares</option>
            <option value="epic">🟣 Épiques</option>
            <option value="legendary">🟡 Légendaires</option>
            <option value="mythic">🌈 Mythiques</option>
          </select>

          {/* Catégorie */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold focus:outline-none"
          >
            <option value="all">Toutes les Catégories</option>
            <option value="country">🇫🇷 Pays & Nations</option>
            <option value="region">🏔️ Régions & Cantons</option>
            <option value="language">🗣️ Langues Parlées</option>
            <option value="figure">🧭 Explorateurs & Figures</option>
            <option value="wonder">🌋 Merveilles Naturelles</option>
          </select>

          {/* Continent */}
          <select
            value={selectedContinent}
            onChange={(e) => setSelectedContinent(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold focus:outline-none"
          >
            <option value="all">Tous les Continents</option>
            <option value="Europe">Europe</option>
            <option value="Asie">Asie</option>
            <option value="Afrique">Afrique</option>
            <option value="Amériques">Amériques</option>
            <option value="Océanie">Océanie</option>
            <option value="Monde">Monde / Global</option>
          </select>

          {/* Source / Origine */}
          <select
            value={selectedOrigin}
            onChange={(e) => setSelectedOrigin(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold focus:outline-none"
          >
            <option value="all">Toutes les Sources</option>
            <option value="builtin">Cartes Officielles Base (60)</option>
            <option value="custom">Cartes Personnalisées Admin</option>
          </select>

          <span className="ml-auto text-xs text-slate-500 font-bold">
            {filteredCatalog.length} carte(s) affichée(s)
          </span>
        </div>
      </div>

      {/* ── VUE EN TABLEAU DÉTAILLÉ ── */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4"># & Visuel</th>
                  <th className="py-3 px-4">Nom & Tagline</th>
                  <th className="py-3 px-4">Catégorie</th>
                  <th className="py-3 px-4">Continent</th>
                  <th className="py-3 px-4">Rareté (Définir en 1 Clic)</th>
                  <th className="py-3 px-4 text-center">Origine</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCatalog.map((card) => {
                  const rarityMeta = RARITY_CONFIG[card.rarity];
                  const categoryMeta = CATEGORY_CONFIG[card.category];
                  const isCustom = card.number > 60 || card.id.startsWith("custom_");

                  return (
                    <tr
                      key={card.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Numéro & Visuel */}
                      <td className="py-3 px-4 font-mono font-black text-slate-700">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.colorScheme.from} ${card.colorScheme.to} flex items-center justify-center text-lg shadow-xs shrink-0`}
                          >
                            {card.flag || card.icon}
                          </div>
                          <span>#{String(card.number).padStart(3, "0")}</span>
                        </div>
                      </td>

                      {/* Nom & Slogan */}
                      <td className="py-3 px-4">
                        <div className="font-black text-slate-900 text-sm group-hover:text-amber-700 transition-colors">
                          {card.name}
                        </div>
                        <div className="text-[11px] text-slate-400 italic line-clamp-1">
                          « {card.tagline} »
                        </div>
                      </td>

                      {/* Catégorie */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                          <span>{categoryMeta.icon}</span>
                          <span>{categoryMeta.label}</span>
                        </span>
                      </td>

                      {/* Continent */}
                      <td className="py-3 px-4 font-bold text-slate-600">
                        {card.continent}
                      </td>

                      {/* Rareté (Dropdown interactif en 1 clic !) */}
                      <td className="py-3 px-4">
                        <div className="relative inline-block">
                          <select
                            value={card.rarity}
                            onChange={(e) =>
                              handleQuickRarityChange(card, e.target.value as CardRarity)
                            }
                            className={`px-3 py-1 rounded-xl text-xs font-black border transition-all cursor-pointer shadow-xs ${rarityMeta.bgBadge} focus:outline-none focus:ring-2 focus:ring-amber-400`}
                          >
                            <option value="common">⚪ Commune</option>
                            <option value="rare">🔵 Rare</option>
                            <option value="epic">🟣 Épique</option>
                            <option value="legendary">🟡 Légendaire</option>
                            <option value="mythic">🌈 Mythique</option>
                          </select>
                        </div>
                      </td>

                      {/* Origine */}
                      <td className="py-3 px-4 text-center">
                        {isCustom ? (
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-black text-[10px] uppercase">
                            Admin
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                            Base
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Prévisualiser */}
                          <button
                            type="button"
                            onClick={() => {
                              playSound("click");
                              setPreviewCard(card);
                            }}
                            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                            title="Aperçu 3D interactif de la carte"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Éditer */}
                          <button
                            type="button"
                            onClick={() => {
                              playSound("click");
                              setEditingCard(card);
                            }}
                            className="p-1.5 rounded-xl hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                            title="Modifier cette carte"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Supprimer / Masquer */}
                          <button
                            type="button"
                            onClick={() => handleDeleteCard(card)}
                            className="p-1.5 rounded-xl hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            title={isCustom ? "Supprimer définitivement" : "Masquer du catalogue"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── VUE EN GALERIE DE CARTES 3D ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 justify-items-center">
          {filteredCatalog.map((card) => {
            const isCustom = card.number > 60 || card.id.startsWith("custom_");
            return (
              <div
                key={card.id}
                className="flex flex-col items-center p-3 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group w-full max-w-[240px]"
              >
                {/* Badge d'origine */}
                {isCustom && (
                  <span className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-full bg-purple-600 text-white font-black text-[9px] uppercase tracking-wider shadow-sm">
                    Personnalisée
                  </span>
                )}

                <CollectibleCard
                  card={card}
                  isUnlocked={true}
                  size="sm"
                  interactive={true}
                  showFlipButton={true}
                  onClick={() => setPreviewCard(card)}
                />

                {/* Sélecteur rapide de rareté sous la carte */}
                <div className="w-full mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                  <select
                    value={card.rarity}
                    onChange={(e) =>
                      handleQuickRarityChange(card, e.target.value as CardRarity)
                    }
                    className="text-[10px] font-black py-1 px-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 cursor-pointer"
                  >
                    <option value="common">Commune</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Épique</option>
                    <option value="legendary">Légendaire</option>
                    <option value="mythic">Mythique</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingCard(card)}
                      className="p-1 rounded-lg hover:bg-amber-100 text-amber-700"
                      title="Éditer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCard(card)}
                      className="p-1 rounded-lg hover:bg-rose-100 text-rose-600"
                      title="Supprimer / Masquer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODALE D'APERÇU 3D ── */}
      {previewCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setPreviewCard(null)}
        >
          <div
            className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 sm:p-8 max-w-md w-full flex flex-col items-center text-white relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewCard(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-black mb-4 flex items-center gap-1.5 text-amber-300">
              <Sparkles className="w-4 h-4 fill-current" />
              <span>Aperçu de la Carte Collector</span>
            </h3>

            <div className="filter drop-shadow-2xl my-2">
              <CollectibleCard
                card={previewCard}
                isUnlocked={true}
                size="md"
                interactive={true}
                showFlipButton={true}
              />
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-4">
              Touchez l'icône de retournement pour inspecter le Recto ou le Verso Dossier d'Explorateur.
            </p>
          </div>
        </div>
      )}

      {/* ── MODALE DE CRÉATION / ÉDITION COMPLÈTE DE CARTE ── */}
      {(isCreating || editingCard) && (
        <CardEditorModal
          initialCard={editingCard || undefined}
          defaultNumber={catalog.length + 1}
          onClose={() => {
            setIsCreating(false);
            setEditingCard(null);
          }}
          onSaved={() => {
            setIsCreating(false);
            setEditingCard(null);
            forceRefresh();
          }}
        />
      )}

      {/* ── MODALE D'IMPORT TEXTUEL JSON ── */}
      {isImportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setIsImportModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-xl w-full border border-slate-200 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              <span>Importer un Catalogue de Cartes JSON</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Collez ci-dessous le code JSON d'un tableau de cartes ou sélectionnez directement un fichier.
            </p>

            <textarea
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder='[ { "id": "card_example", "name": "...", "rarity": "rare", ... } ]'
              rows={8}
              className="w-full p-3 font-mono text-xs rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />

            <div className="flex items-center justify-between mt-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
              >
                Parcourir un fichier .json depuis l'ordinateur
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleTextImportSubmit}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-sm cursor-pointer"
                >
                  Valider l'import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── COMPOSANT DE FORMULAIRE & PREVIEW EN DIRECT ──
interface CardEditorModalProps {
  initialCard?: TerraCard;
  defaultNumber: number;
  onClose: () => void;
  onSaved: () => void;
}

function CardEditorModal({
  initialCard,
  defaultNumber,
  onClose,
  onSaved,
}: CardEditorModalProps) {
  const isEditing = Boolean(initialCard);

  const [formData, setFormData] = useState<TerraCard>(() => {
    if (initialCard) return JSON.parse(JSON.stringify(initialCard));

    return {
      id: `custom_card_${Date.now()}`,
      number: defaultNumber,
      name: "Nouvelle Carte",
      category: "country",
      rarity: "rare",
      continent: "Europe",
      flag: "🌍",
      icon: "🧭",
      tagline: "Un trésor géographique d'exception",
      description: "Description détaillée de la nation, région ou figure d'exploration.",
      stats: {
        Capitale: "Ville Capitale",
        Population: "10 millions",
        Superficie: "100 000 km²",
      },
      funFact: "Saviez-vous que ce lieu possède une particularité géographique unique au monde ?",
      quote: "Semper Explorator",
      colorScheme: {
        from: "from-blue-600",
        via: "via-indigo-600",
        to: "to-purple-700",
        accent: "#3B82F6",
      },
      trivia: {
        question: "Quelle est la caractéristique principale de ce lieu ?",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctIndex: 0,
        explanation: "Explication pédagogique de la bonne réponse.",
      },
    };
  });

  const handleStatChange = (key: string, val: string) => {
    setFormData((prev) => ({
      ...prev,
      stats: { ...prev.stats, [key]: val },
    }));
  };

  const handleTriviaOptionChange = (idx: number, val: string) => {
    setFormData((prev) => {
      const newOpts = [...prev.trivia.options];
      newOpts[idx] = val;
      return {
        ...prev,
        trivia: { ...prev.trivia, options: newOpts },
      };
    });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("Le nom de la carte est obligatoire.");
      return;
    }
    playSound("success");
    const res = adminSaveCard(formData);
    if (res.success) {
      toast.success(res.message);
      onSaved();
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-5xl p-6 sm:p-8 flex flex-col my-auto border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header modale */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 fill-current" />
              <span>{isEditing ? `Modifier « ${formData.name} »` : "Créer une Nouvelle Carte"}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Remplissez les caractéristiques. La carte s'actualise en temps réel sur la prévisualisation.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps : Formulaire à gauche, Prévisualisation à droite */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-6">
          {/* ── FORMULAIRE GAUCHE (7 cols) ── */}
          <div className="lg:col-span-7 space-y-5 text-xs">
            {/* Section 1 : Identité */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
                1. Identité Principale
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Numéro Pokédex</label>
                  <input
                    type="number"
                    value={formData.number}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, number: parseInt(e.target.value) || 1 }))
                    }
                    className="w-full p-2 rounded-xl bg-white border border-slate-200 font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-600 block mb-1">ID Technique</label>
                  <input
                    type="text"
                    disabled={isEditing}
                    value={formData.id}
                    onChange={(e) => setFormData((p) => ({ ...p, id: e.target.value }))}
                    className="w-full p-2 rounded-xl bg-white border border-slate-200 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-600 block mb-1">Nom de la Carte</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Ex: Islande"
                    className="w-full p-2 rounded-xl bg-white border border-slate-200 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Rareté */}
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Rareté</label>
                  <select
                    value={formData.rarity}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, rarity: e.target.value as CardRarity }))
                    }
                    className="w-full p-2 rounded-xl bg-white border border-slate-200 font-bold"
                  >
                    <option value="common">⚪ Commune</option>
                    <option value="rare">🔵 Rare</option>
                    <option value="epic">🟣 Épique</option>
                    <option value="legendary">🟡 Légendaire</option>
                    <option value="mythic">🌈 Mythique</option>
                  </select>
                </div>

                {/* Catégorie */}
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Catégorie</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, category: e.target.value as CardCategory }))
                    }
                    className="w-full p-2 rounded-xl bg-white border border-slate-200 font-bold"
                  >
                    <option value="country">🇫🇷 Pays</option>
                    <option value="region">🏔️ Région</option>
                    <option value="language">🗣️ Langue</option>
                    <option value="figure">🧭 Explorateur</option>
                    <option value="wonder">🌋 Merveille</option>
                  </select>
                </div>

                {/* Continent */}
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Continent</label>
                  <select
                    value={formData.continent}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, continent: e.target.value as CardContinent }))
                    }
                    className="w-full p-2 rounded-xl bg-white border border-slate-200 font-bold"
                  >
                    <option value="Europe">Europe</option>
                    <option value="Asie">Asie</option>
                    <option value="Afrique">Afrique</option>
                    <option value="Amériques">Amériques</option>
                    <option value="Océanie">Océanie</option>
                    <option value="Monde">Monde</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Drapeau Emoji (ou vide)</label>
                  <input
                    type="text"
                    value={formData.flag || ""}
                    onChange={(e) => setFormData((p) => ({ ...p, flag: e.target.value }))}
                    placeholder="🇮🇸"
                    className="w-full p-2 rounded-xl bg-white border border-slate-200 text-center text-base"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-600 block mb-1">Icône Emoji</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData((p) => ({ ...p, icon: e.target.value }))}
                    placeholder="🌋"
                    className="w-full p-2 rounded-xl bg-white border border-slate-200 text-center text-base"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Slogan / Tagline</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData((p) => ({ ...p, tagline: e.target.value }))}
                  placeholder="La Terre des Glaces et Volcans"
                  className="w-full p-2 rounded-xl bg-white border border-slate-200 font-medium"
                />
              </div>
            </div>

            {/* Section 2 : Savoir & Anecdotes */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
                2. Données & Anecdotes
              </span>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className="w-full p-2 rounded-xl bg-white border border-slate-200 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">💡 Le Saviez-vous ? (Fun fact)</label>
                <textarea
                  value={formData.funFact}
                  onChange={(e) => setFormData((p) => ({ ...p, funFact: e.target.value }))}
                  rows={2}
                  className="w-full p-2 rounded-xl bg-white border border-slate-200 font-medium text-emerald-900"
                />
              </div>

              {/* Statistiques clés */}
              <div>
                <label className="font-bold text-slate-600 block mb-1">Statistiques Clés (Verso)</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(formData.stats).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-[10px] text-slate-500 font-bold block">{k}</span>
                      <input
                        type="text"
                        value={String(v)}
                        onChange={(e) => handleStatChange(k, e.target.value)}
                        className="w-full p-1.5 rounded-lg bg-white border border-slate-200 font-bold"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 3 : Mini-Quiz Flash */}
            <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-200 space-y-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-900 block flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-purple-600" />
                <span>3. Mini-Quiz Flash (+5 💎)</span>
              </span>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Question du Quiz</label>
                <input
                  type="text"
                  value={formData.trivia.question}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      trivia: { ...p.trivia, question: e.target.value },
                    }))
                  }
                  className="w-full p-2 rounded-xl bg-white border border-purple-200 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {formData.trivia.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="correctIdx"
                      checked={formData.trivia.correctIndex === idx}
                      onChange={() =>
                        setFormData((p) => ({
                          ...p,
                          trivia: { ...p.trivia, correctIndex: idx },
                        }))
                      }
                      title="Cocher pour définir comme bonne réponse"
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleTriviaOptionChange(idx, e.target.value)}
                      placeholder={`Option ${idx + 1}`}
                      className={`w-full p-1.5 rounded-lg border text-xs ${
                        formData.trivia.correctIndex === idx
                          ? "bg-emerald-50 border-emerald-400 font-bold text-emerald-900"
                          : "bg-white border-purple-200"
                      }`}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">Explication Pédagogique</label>
                <input
                  type="text"
                  value={formData.trivia.explanation}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      trivia: { ...p.trivia, explanation: e.target.value },
                    }))
                  }
                  className="w-full p-2 rounded-xl bg-white border border-purple-200 font-medium"
                />
              </div>
            </div>
          </div>

          {/* ── APERÇU EN DIRECT DROITE (5 cols) ── */}
          <div className="lg:col-span-5 flex flex-col items-center justify-start bg-slate-900 p-6 rounded-3xl border border-slate-800 text-white sticky top-0 shadow-inner">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 mb-4 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>Aperçu Réel en Temps Réel</span>
            </span>

            <div className="filter drop-shadow-2xl my-auto">
              <CollectibleCard
                card={formData}
                isUnlocked={true}
                size="md"
                interactive={true}
                showFlipButton={true}
              />
            </div>

            <p className="text-[10px] text-slate-400 text-center mt-4 italic">
              « Cliquez sur le bouton de rotation pour tester le verso de votre carte »
            </p>
          </div>
        </div>

        {/* Pied de modale */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Enregistrer la Carte</span>
          </button>
        </div>
      </div>
    </div>
  );
}
