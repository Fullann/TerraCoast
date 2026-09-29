import { useState, useEffect, useMemo } from "react";
import {
  Compass,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Eye,
  Download,
  Upload,
  Layers,
  Sparkles,
  MapPin,
  Camera,
  Check,
  X,
  RefreshCw,
  Globe,
  SlidersHorizontal,
} from "lucide-react";
import {
  getAllLocationsForAdmin,
  addCustomGeoDetectiveLocation,
  updateGeoDetectiveLocation,
  deleteGeoDetectiveLocation,
  restoreGeoDetectiveLocation,
  resetAllGeoDetectiveLocations,
  exportGeoDetectiveLocationsJson,
  importGeoDetectiveLocationsJson,
  LOCATIONS_UPDATED_EVENT,
  type AdminLocationView,
} from "../../lib/geoDetectiveLocationsManager";
import type { SatelliteCategory, SatelliteLocation } from "../../lib/geoDetectiveData";
import { toast } from "../common/ToastContainer";
import { playSound } from "../../lib/soundManager";

const CATEGORIES: Array<{ id: SatelliteCategory; label: string; icon: string }> = [
  { id: "monument", label: "Monument & Histoire", icon: "🏛️" },
  { id: "natural_wonder", label: "Merveille Naturelle", icon: "🏔️" },
  { id: "urban_island", label: "Île & Métropole", icon: "🏙️" },
  { id: "canal_port", label: "Canal & Port", icon: "🚢" },
  { id: "volcano_crater", label: "Cratère & Volcan", icon: "🌋" },
];

const CONTINENTS = [
  "Europe",
  "Asia",
  "Africa",
  "Americas",
  "Oceania",
  "Antarctica",
];

interface FormState {
  id?: string;
  name: string;
  country: string;
  iso3: string;
  flagEmoji: string;
  continent: string;
  lat: number | "";
  lng: number | "";
  category: SatelliteCategory;
  satelliteImageUrl: string;
  secondaryImageUrl: string;
  clue1: string;
  clue2: string;
  funFact: string;
  difficulty: "easy" | "medium" | "hard";
}

const EMPTY_FORM: FormState = {
  name: "",
  country: "",
  iso3: "",
  flagEmoji: "🌐",
  continent: "Europe",
  lat: "",
  lng: "",
  category: "monument",
  satelliteImageUrl: "",
  secondaryImageUrl: "",
  clue1: "",
  clue2: "",
  funFact: "",
  difficulty: "medium",
};

export function GeoDetectiveManagementPage() {
  const [locations, setLocations] = useState<AdminLocationView[]>(() =>
    getAllLocationsForAdmin()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "custom" | "default" | "deleted">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modales
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isTestingImage, setIsTestingImage] = useState(false);
  const [imageTestStatus, setImageTestStatus] = useState<"none" | "ok" | "error">("none");

  // Modale suppression
  const [deleteConfirmLocation, setDeleteConfirmLocation] = useState<AdminLocationView | null>(null);

  // Modale Import / Export
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");

  const refreshLocations = () => {
    setLocations(getAllLocationsForAdmin());
  };

  useEffect(() => {
    const handleUpdate = () => refreshLocations();
    window.addEventListener(LOCATIONS_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(LOCATIONS_UPDATED_EVENT, handleUpdate);
  }, []);

  // Filtrage
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      // Filtre statut
      if (selectedFilter === "custom" && !loc.isCustom) return false;
      if (selectedFilter === "default" && loc.isCustom) return false;
      if (selectedFilter === "deleted" && !loc.isDeleted) return false;
      if (selectedFilter !== "deleted" && loc.isDeleted) return false;

      // Filtre catégorie
      if (selectedCategory !== "all" && loc.category !== selectedCategory) return false;

      // Filtre difficulté
      if (selectedDifficulty !== "all" && loc.difficulty !== selectedDifficulty) return false;

      // Recherche texte
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = loc.name.toLowerCase().includes(q);
        const matchCountry = loc.country.toLowerCase().includes(q);
        const matchIso = loc.iso3.toLowerCase().includes(q);
        const matchContinent = loc.continent.toLowerCase().includes(q);
        const matchFunFact = loc.funFact.toLowerCase().includes(q);
        if (!matchName && !matchCountry && !matchIso && !matchContinent && !matchFunFact) {
          return false;
        }
      }

      return true;
    });
  }, [locations, selectedFilter, selectedCategory, selectedDifficulty, searchQuery]);

  // Statistiques
  const stats = useMemo(() => {
    const active = locations.filter((l) => !l.isDeleted);
    const custom = active.filter((l) => l.isCustom);
    const deleted = locations.filter((l) => l.isDeleted);
    const edited = active.filter((l) => l.isEdited);
    return {
      totalActive: active.length,
      customCount: custom.length,
      defaultCount: active.length - custom.length,
      deletedCount: deleted.length,
      editedCount: edited.length,
    };
  }, [locations]);

  // Ouverture du formulaire de création
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setImageTestStatus("none");
    setIsEditModalOpen(true);
  };

  // Ouverture du formulaire d'édition
  const handleOpenEdit = (loc: AdminLocationView) => {
    setEditingId(loc.id);
    setFormData({
      id: loc.id,
      name: loc.name,
      country: loc.country,
      iso3: loc.iso3,
      flagEmoji: loc.flagEmoji || "🌐",
      continent: loc.continent,
      lat: loc.lat,
      lng: loc.lng,
      category: loc.category,
      satelliteImageUrl: loc.satelliteImageUrl,
      secondaryImageUrl: loc.secondaryImageUrl || "",
      clue1: loc.clues[0] || "",
      clue2: loc.clues[1] || "",
      funFact: loc.funFact,
      difficulty: loc.difficulty,
    });
    setFormErrors({});
    setImageTestStatus("none");
    setIsEditModalOpen(true);
  };

  // Test du lien d'image
  const testImageUrl = (url: string) => {
    if (!url.trim()) {
      setImageTestStatus("error");
      return;
    }
    setIsTestingImage(true);
    const img = new Image();
    img.onload = () => {
      setIsTestingImage(false);
      setImageTestStatus("ok");
      toast.success("Image chargée avec succès !");
    };
    img.onerror = () => {
      setIsTestingImage(false);
      setImageTestStatus("error");
      toast.error("Impossible de charger l'image depuis cette URL");
    };
    img.src = url.trim();
  };

  // Validation et enregistrement
  const handleSaveLocation = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = "Le nom du lieu est requis";
    if (!formData.country.trim()) errors.country = "Le pays est requis";
    if (!formData.iso3.trim() || formData.iso3.length !== 3)
      errors.iso3 = "Le code ISO3 doit faire exactement 3 lettres (ex: FRA)";
    if (formData.lat === "" || isNaN(Number(formData.lat)))
      errors.lat = "La latitude est requise (-90 à 90)";
    else if (Number(formData.lat) < -90 || Number(formData.lat) > 90)
      errors.lat = "La latitude doit être comprise entre -90 et 90";

    if (formData.lng === "" || isNaN(Number(formData.lng)))
      errors.lng = "La longitude est requise (-180 à 180)";
    else if (Number(formData.lng) < -180 || Number(formData.lng) > 180)
      errors.lng = "La longitude doit être comprise entre -180 et 180";

    if (!formData.satelliteImageUrl.trim())
      errors.satelliteImageUrl = "L'URL de la photo / vue satellite est requise";
    if (!formData.clue1.trim()) errors.clue1 = "Le premier indice est requis";
    if (!formData.clue2.trim()) errors.clue2 = "Le second indice est requis";
    if (!formData.funFact.trim()) errors.funFact = "L'anecdote est requise";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Veuillez corriger les champs en rouge");
      return;
    }

    try {
      const payload: Omit<SatelliteLocation, "id"> & { id?: string } = {
        name: formData.name.trim(),
        country: formData.country.trim(),
        iso3: formData.iso3.trim().toUpperCase(),
        flagEmoji: formData.flagEmoji.trim() || "📍",
        continent: formData.continent,
        lat: Number(formData.lat),
        lng: Number(formData.lng),
        category: formData.category,
        satelliteImageUrl: formData.satelliteImageUrl.trim(),
        secondaryImageUrl: formData.secondaryImageUrl.trim() || undefined,
        clues: [formData.clue1.trim(), formData.clue2.trim()],
        funFact: formData.funFact.trim(),
        difficulty: formData.difficulty,
      };

      if (editingId) {
        updateGeoDetectiveLocation(editingId, payload);
        toast.success(`Lieu "${payload.name}" mis à jour avec succès !`);
      } else {
        addCustomGeoDetectiveLocation(payload);
        toast.success(`Nouveau lieu "${payload.name}" ajouté avec succès !`);
      }

      playSound("success");
      setIsEditModalOpen(false);
      refreshLocations();
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'enregistrement");
    }
  };

  // Suppression d'un lieu
  const handleConfirmDelete = () => {
    if (!deleteConfirmLocation) return;
    deleteGeoDetectiveLocation(deleteConfirmLocation.id);
    toast.success(`Lieu "${deleteConfirmLocation.name}" supprimé`);
    setDeleteConfirmLocation(null);
    refreshLocations();
  };

  // Restauration d'un lieu
  const handleRestoreLocation = (loc: AdminLocationView) => {
    restoreGeoDetectiveLocation(loc.id);
    toast.success(`Lieu "${loc.name}" restauré avec succès`);
    refreshLocations();
  };

  // Réinitialisation globale
  const handleResetAll = () => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir réinitialiser les lieux par défaut ? Vos lieux personnalisés seront conservés."
      )
    ) {
      resetAllGeoDetectiveLocations(true);
      toast.success("Lieux par défaut réinitialisés !");
      refreshLocations();
    }
  };

  // Import JSON
  const handleImportJson = () => {
    const res = importGeoDetectiveLocationsJson(importJsonText);
    if (res.success) {
      toast.success(`${res.count} lieux importés avec succès !`);
      setIsImportExportModalOpen(false);
      setImportJsonText("");
      refreshLocations();
    } else {
      toast.error(res.error || "Erreur d'import");
    }
  };

  // Copie de l'export JSON
  const handleCopyExport = () => {
    const json = exportGeoDetectiveLocationsJson();
    navigator.clipboard.writeText(json);
    toast.success("Configuration JSON copiée dans le presse-papiers !");
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Action Bar */}
      <div className="card-duo p-6 bg-white border-b-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 border-2 border-teal-300 flex items-center justify-center text-2xl shadow-xs shrink-0">
              🛰️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  Mode GeoGuessr & Photos Spatiales
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-xs font-black uppercase">
                  Geo-Detective
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-0.5">
                Ajoutez, modifiez ou supprimez les photos satellites, lieux réels et indices du mode GeoGuessr.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsImportExportModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl border-2 border-slate-200 border-b-4 bg-white hover:bg-slate-50 text-slate-700 text-xs font-black transition flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Import / Export</span>
            </button>

            <button
              onClick={handleResetAll}
              className="px-3.5 py-2.5 rounded-xl border-2 border-slate-200 border-b-4 bg-white hover:bg-slate-50 text-slate-700 text-xs font-black transition flex items-center gap-1.5"
              title="Restaurer la liste d'origine"
            >
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Rétablir défauts</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="btn-duo btn-duo-green px-4 py-2.5 text-xs uppercase flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Lieu / Photo</span>
            </button>
          </div>
        </div>

        {/* 2. Key Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t-2 border-slate-100">
          <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200">
            <span className="text-[10px] uppercase font-black tracking-wider text-teal-800 block">
              Lieux Actifs en Jeu
            </span>
            <span className="text-2xl font-black text-teal-900 mt-0.5 block">
              {stats.totalActive}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] uppercase font-black tracking-wider text-emerald-800 block">
              Ajoutés par l'Admin
            </span>
            <span className="text-2xl font-black text-emerald-900 mt-0.5 block">
              {stats.customCount}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200">
            <span className="text-[10px] uppercase font-black tracking-wider text-sky-800 block">
              Lieux d'Origine (Par Défaut)
            </span>
            <span className="text-2xl font-black text-sky-900 mt-0.5 block">
              {stats.defaultCount}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
            <span className="text-[10px] uppercase font-black tracking-wider text-amber-800 block">
              Modifiés / Personnalisés
            </span>
            <span className="text-2xl font-black text-amber-900 mt-0.5 block">
              {stats.editedCount}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Search and Filters Controls */}
      <div className="card-duo p-4 bg-white border-b-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Barre de recherche */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom, pays, code ISO3, continent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-slate-200 focus:border-teal-500 focus:outline-none text-xs font-semibold text-slate-800 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtres dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border-2 border-slate-200 text-xs font-black text-slate-700 bg-white"
            >
              <option value="all">Toutes Catégories</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 rounded-xl border-2 border-slate-200 text-xs font-black text-slate-700 bg-white"
            >
              <option value="all">Toutes Difficultés</option>
              <option value="easy">🟢 Facile</option>
              <option value="medium">🟡 Moyen</option>
              <option value="hard">🔴 Difficile</option>
            </select>

            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border-2 border-slate-200 text-xs font-black text-slate-700 bg-white"
            >
              <option value="all">Tous les Statuts</option>
              <option value="custom">✨ Ajoutés par l'admin</option>
              <option value="default">🌐 Par défaut</option>
              <option value="deleted">🗑️ Supprimés</option>
            </select>
          </div>
        </div>

        {/* Compteur de résultats */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-bold pt-1">
          <span>
            {filteredLocations.length} lieu{filteredLocations.length > 1 ? "x" : ""} trouvé
            {filteredLocations.length > 1 ? "s" : ""}
          </span>
          {stats.deletedCount > 0 && selectedFilter !== "deleted" && (
            <button
              onClick={() => setSelectedFilter("deleted")}
              className="text-amber-600 hover:underline font-black flex items-center gap-1"
            >
              <span>{stats.deletedCount} lieu(x) masqué(s)</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. Locations List / Grid */}
      {filteredLocations.length === 0 ? (
        <div className="card-duo p-12 bg-white text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-3xl mx-auto">
            🔍
          </div>
          <h3 className="text-base font-black text-slate-800">
            Aucun lieu ne correspond à votre recherche
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
            Modifiez vos filtres ou ajoutez une nouvelle localisation photo pour enrichir le jeu GeoGuessr !
          </p>
          <button
            onClick={handleOpenCreate}
            className="btn-duo btn-duo-green px-5 py-2.5 text-xs uppercase inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter ce lieu</span>
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((loc) => {
            const catInfo = CATEGORIES.find((c) => c.id === loc.category);
            return (
              <div
                key={loc.id}
                className={`card-duo p-4 bg-white flex flex-col justify-between transition-all ${
                  loc.isDeleted
                    ? "opacity-60 border-dashed border-red-300 bg-red-50/20"
                    : loc.isCustom
                    ? "border-emerald-300 hover:border-emerald-400"
                    : "hover:border-slate-300"
                }`}
              >
                <div>
                  {/* Photo Preview Thumbnail */}
                  <div className="relative rounded-2xl overflow-hidden bg-slate-900 h-44 mb-3 group border border-slate-200">
                    <img
                      src={loc.satelliteImageUrl}
                      alt={loc.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Badges sur l'image */}
                    <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-black uppercase flex items-center gap-1 border border-white/20">
                        <span>{catInfo?.icon || "📍"}</span>
                        <span>{catInfo?.label || loc.category}</span>
                      </span>

                      {loc.isCustom && (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500 text-white text-[10px] font-black uppercase shadow-xs">
                          ✨ Custom
                        </span>
                      )}
                      {loc.isEdited && !loc.isCustom && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase shadow-xs">
                          ✏️ Modifié
                        </span>
                      )}
                    </div>

                    <div className="absolute top-2.5 right-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase shadow-xs ${
                          loc.difficulty === "easy"
                            ? "bg-emerald-500 text-white"
                            : loc.difficulty === "medium"
                            ? "bg-amber-500 text-white"
                            : "bg-rose-500 text-white"
                        }`}
                      >
                        {loc.difficulty}
                      </span>
                    </div>

                    {/* Informations en bas de l'image */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                        <span>{loc.flagEmoji}</span>
                        <span>{loc.country}</span>
                        <span>•</span>
                        <span className="text-[11px] opacity-90">{loc.continent}</span>
                      </div>
                      <h4 className="text-sm font-black text-white leading-tight truncate mt-0.5">
                        {loc.name}
                      </h4>
                    </div>
                  </div>

                  {/* Coordonnées & Indices */}
                  <div className="space-y-2 text-xs">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between font-mono text-[11px]">
                      <span className="text-slate-500 font-bold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        Coordonnées :
                      </span>
                      <span className="font-black text-slate-800">
                        {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-500 block">
                        Indices & Anecdote :
                      </span>
                      <p className="text-[11px] text-slate-700 italic truncate font-medium">
                        💡 1 : {loc.clues[0]}
                      </p>
                      <p className="text-[11px] text-slate-600 line-clamp-2">
                        {loc.funFact}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-4 pt-3 border-t-2 border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={loc.satelliteImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-slate-100 transition"
                    title="Voir l'image en grand"
                  >
                    <Eye className="w-4 h-4" />
                  </a>

                  <div className="flex items-center gap-1.5">
                    {loc.isDeleted ? (
                      <button
                        onClick={() => handleRestoreLocation(loc)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black transition flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restaurer</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleOpenEdit(loc)}
                          className="px-3 py-1.5 rounded-xl border-2 border-slate-200 border-b-4 bg-white hover:bg-slate-50 text-slate-700 text-xs font-black transition flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-teal-600" />
                          <span>Modifier</span>
                        </button>

                        <button
                          onClick={() => setDeleteConfirmLocation(loc)}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                          title="Supprimer ce lieu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Modale de Création / Modification */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-2xl max-w-2xl w-full p-5 sm:p-7 space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{editingId ? "✏️" : "✨"}</span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {editingId ? "Modifier le lieu GeoGuessr" : "Ajouter un nouveau lieu GeoGuessr"}
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Les modifications sont immédiatement répercutées en jeu pour tous les joueurs.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold text-slate-700">
              {/* Photo Preview et URL */}
              <div className="space-y-1.5">
                <label className="flex items-center justify-between">
                  <span>URL de l'image (Satellite ou Photo Aérienne HD) *</span>
                  {imageTestStatus === "ok" && (
                    <span className="text-emerald-600 flex items-center gap-1 font-black">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Image valide
                    </span>
                  )}
                  {imageTestStatus === "error" && (
                    <span className="text-rose-600 flex items-center gap-1 font-black">
                      <AlertCircle className="w-3.5 h-3.5" /> Erreur de chargement
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... ou URL directe"
                    value={formData.satelliteImageUrl}
                    onChange={(e) => {
                      setFormData({ ...formData, satelliteImageUrl: e.target.value });
                      setImageTestStatus("none");
                    }}
                    className={`flex-1 px-3 py-2 rounded-xl border-2 font-normal text-xs ${
                      formErrors.satelliteImageUrl ? "border-rose-400 bg-rose-50" : "border-slate-200"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => testImageUrl(formData.satelliteImageUrl)}
                    disabled={isTestingImage}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs shrink-0"
                  >
                    {isTestingImage ? "Test..." : "Tester l'image"}
                  </button>
                </div>
                {formErrors.satelliteImageUrl && (
                  <p className="text-rose-600 text-[11px] font-semibold">{formErrors.satelliteImageUrl}</p>
                )}

                {/* Preview de l'image */}
                {formData.satelliteImageUrl.trim() && (
                  <div className="relative rounded-2xl overflow-hidden h-36 bg-slate-900 border border-slate-200 mt-2">
                    <img
                      src={formData.satelliteImageUrl}
                      alt="Prévisualisation"
                      className="w-full h-full object-cover"
                      onError={() => setImageTestStatus("error")}
                      onLoad={() => setImageTestStatus("ok")}
                    />
                    <div className="absolute bottom-1 right-2 text-[10px] text-white/80 bg-black/60 px-2 py-0.5 rounded-full font-mono">
                      Aperçu direct
                    </div>
                  </div>
                )}
              </div>

              {/* Nom & Pays */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label>Nom du lieu *</label>
                  <input
                    type="text"
                    placeholder="Ex: Grandes Pyramides de Gizeh"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border-2 text-xs font-normal ${
                      formErrors.name ? "border-rose-400 bg-rose-50" : "border-slate-200"
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-rose-600 text-[11px] font-semibold">{formErrors.name}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label>Pays & Emoji Drapeau *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="🇪🇬"
                      value={formData.flagEmoji}
                      onChange={(e) => setFormData({ ...formData, flagEmoji: e.target.value })}
                      className="w-14 px-2 py-2 rounded-xl border-2 border-slate-200 text-center text-base"
                    />
                    <input
                      type="text"
                      placeholder="Ex: Égypte"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className={`flex-1 px-3 py-2 rounded-xl border-2 text-xs font-normal ${
                        formErrors.country ? "border-rose-400 bg-rose-50" : "border-slate-200"
                      }`}
                    />
                  </div>
                  {formErrors.country && (
                    <p className="text-rose-600 text-[11px] font-semibold">{formErrors.country}</p>
                  )}
                </div>
              </div>

              {/* ISO3, Continent, Catégorie, Difficulté */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="space-y-1">
                  <label>Code ISO3 *</label>
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="EGY"
                    value={formData.iso3}
                    onChange={(e) => setFormData({ ...formData, iso3: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 text-xs uppercase font-mono"
                  />
                  {formErrors.iso3 && (
                    <p className="text-rose-600 text-[10px] font-semibold">{formErrors.iso3}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label>Continent</label>
                  <select
                    value={formData.continent}
                    onChange={(e) => setFormData({ ...formData, continent: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl border-2 border-slate-200 text-xs font-bold"
                  >
                    {CONTINENTS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label>Catégorie</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-2.5 py-2 rounded-xl border-2 border-slate-200 text-xs font-bold"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label>Difficulté</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                    className="w-full px-2.5 py-2 rounded-xl border-2 border-slate-200 text-xs font-bold"
                  >
                    <option value="easy">🟢 Facile</option>
                    <option value="medium">🟡 Moyen</option>
                    <option value="hard">🔴 Difficile</option>
                  </select>
                </div>
              </div>

              {/* Coordonnées GPS */}
              <div className="grid sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 border-2 border-slate-200">
                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    Latitude (-90.0 à +90.0) *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Ex: 29.9792"
                    value={formData.lat}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lat: e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    className={`w-full px-3 py-2 rounded-xl border-2 font-mono text-xs ${
                      formErrors.lat ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-white"
                    }`}
                  />
                  {formErrors.lat && (
                    <p className="text-rose-600 text-[10px] font-semibold">{formErrors.lat}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-sky-500" />
                    Longitude (-180.0 à +180.0) *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Ex: 31.1342"
                    value={formData.lng}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lng: e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    className={`w-full px-3 py-2 rounded-xl border-2 font-mono text-xs ${
                      formErrors.lng ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-white"
                    }`}
                  />
                  {formErrors.lng && (
                    <p className="text-rose-600 text-[10px] font-semibold">{formErrors.lng}</p>
                  )}
                </div>
              </div>

              {/* Indices */}
              <div className="space-y-2">
                <label>Indices progressifs pour les joueurs *</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Indice 1 : Ex: Situé à la limite exacte entre une métropole et un désert."
                    value={formData.clue1}
                    onChange={(e) => setFormData({ ...formData, clue1: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 font-normal text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Indice 2 : Ex: Le plus long fleuve d'Afrique coule à quelques kilomètres à l'est."
                    value={formData.clue2}
                    onChange={(e) => setFormData({ ...formData, clue2: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 font-normal text-xs"
                  />
                </div>
              </div>

              {/* Anecdote vue du ciel */}
              <div className="space-y-1">
                <label>Anecdote spatiale / Le saviez-vous ? *</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Depuis l'orbite terrestre, la pyramide présente en réalité 8 faces concaves !"
                  value={formData.funFact}
                  onChange={(e) => setFormData({ ...formData, funFact: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 font-normal text-xs"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t-2 border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 text-xs font-black hover:bg-slate-50 transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveLocation}
                className="btn-duo btn-duo-green px-5 py-2.5 text-xs uppercase flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{editingId ? "Mettre à jour" : "Créer le lieu"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modale de Confirmation de Suppression */}
      {deleteConfirmLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 border-2 border-rose-300 flex items-center justify-center text-rose-600 text-2xl mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">
                Supprimer "{deleteConfirmLocation.name}" ?
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                {deleteConfirmLocation.isCustom
                  ? "Ce lieu a été créé manuellement et sera définitivement supprimé."
                  : "Ce lieu d'origine sera masqué du mode de jeu GeoGuessr (vous pourrez le restaurer à tout moment)."}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmLocation(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 text-xs font-black hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md"
              >
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modale Import / Export JSON */}
      {isImportExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Download className="w-5 h-5 text-teal-600" />
                <span>Sauvegarde & Import de Lieux JSON</span>
              </h3>
              <button
                onClick={() => setIsImportExportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-semibold text-slate-600">
              <div className="flex items-center justify-between">
                <span>Exporter la configuration actuelle :</span>
                <button
                  onClick={handleCopyExport}
                  className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-black hover:bg-teal-100"
                >
                  📋 Copier le JSON
                </button>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Collez un JSON pour importer des lieux :
                </label>
                <textarea
                  rows={6}
                  placeholder='{"version": 1, "customLocations": [...]}'
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  className="w-full p-3 rounded-2xl border-2 border-slate-200 font-mono text-[11px] text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t-2 border-slate-100">
              <button
                onClick={() => setIsImportExportModalOpen(false)}
                className="px-4 py-2 rounded-xl border-2 border-slate-200 text-slate-700 text-xs font-black"
              >
                Fermer
              </button>
              <button
                onClick={handleImportJson}
                disabled={!importJsonText.trim()}
                className="btn-duo btn-duo-green px-5 py-2 text-xs uppercase disabled:opacity-50"
              >
                Importer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
