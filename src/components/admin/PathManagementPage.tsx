import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Compass,
  Search,
  CheckCircle2,
  RotateCcw,
  Play,
  Settings,
  Sparkles,
  ExternalLink,
  Check,
  X,
  Crown,
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  Layers,
  Palette,
  Gift,
  HelpCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useNotifications } from "../../contexts/NotificationContext";
import {
  getQuestPath,
  DEFAULT_BASE_UNITS,
  PathUnit,
  PathNode,
} from "../../lib/gamificationManager";
import {
  getAllPathAssignments,
  setPathAssignment,
  removePathAssignment,
  resetAllPathAssignments,
  getCustomUnits,
  saveCustomUnit,
  deleteCustomUnit,
  addStageToUnit,
  removeStageFromUnit,
  resetCustomUnits,
  PathNodeAssignment,
} from "../../lib/pathConfigManager";
import { PATH_QUIZZES } from "../../lib/pathQuizzesData";
import { ConfirmModal } from "../common/ConfirmModal";
import type { Database } from "../../lib/database.types";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];

const PRESET_EMOJIS = [
  "🌍", "🌋", "🌊", "🧭", "🏛️", "🏜️", "🏔️", "🚀",
  "⛩️", "🏝️", "🛰️", "🦁", "🗺️", "💎", "⚡", "🍀",
  "🪐", "🗼", "🗿", "🌴", "🏰", "🚢", "❄️", "☀️",
];

const THEME_COLORS: Array<{
  id: PathUnit["themeColor"];
  label: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}> = [
  { id: "green", label: "Vert Émeraude", bgClass: "bg-emerald-500", borderClass: "border-emerald-500", textClass: "text-emerald-700" },
  { id: "blue", label: "Bleu Océan", bgClass: "bg-sky-500", borderClass: "border-sky-500", textClass: "text-sky-700" },
  { id: "amber", label: "Ambre Solaire", bgClass: "bg-amber-500", borderClass: "border-amber-500", textClass: "text-amber-700" },
  { id: "purple", label: "Pourpre Royal", bgClass: "bg-purple-500", borderClass: "border-purple-500", textClass: "text-purple-700" },
  { id: "rose", label: "Rose Rubis", bgClass: "bg-rose-500", borderClass: "border-rose-500", textClass: "text-rose-700" },
  { id: "teal", label: "Sarcelle Tropicale", bgClass: "bg-teal-500", borderClass: "border-teal-500", textClass: "text-teal-700" },
  { id: "sky", label: "Ciel Azur", bgClass: "bg-blue-600", borderClass: "border-blue-600", textClass: "text-blue-700" },
];

export function PathManagementPage() {
  const navigate = useNavigate();
  const { showAppNotification } = useNotifications();

  // État des unités du parcours
  const [units, setUnits] = useState<PathUnit[]>(() => getQuestPath());
  const [assignments, setAssignments] = useState<Record<string, PathNodeAssignment>>(() =>
    getAllPathAssignments()
  );

  // État du catalogue de quiz
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  // Filtre / recherche pour les nœuds
  const [selectedUnitId, setSelectedUnitId] = useState<string>("all");
  const [nodeSearch, setNodeSearch] = useState("");

  // Modale de sélection de quiz pour un nœud donné
  const [assigningNode, setAssigningNode] = useState<{
    node: PathNode;
    unit: PathUnit;
  } | null>(null);
  const [modalSearch, setModalSearch] = useState("");
  const [modalCategory, setModalCategory] = useState("all");
  const [modalDifficulty, setModalDifficulty] = useState("all");

  // Modale de Création / Édition d'Unité
  const [unitModal, setUnitModal] = useState<{
    isOpen: boolean;
    isEditing: boolean;
    unitId?: string;
    unitNumber: number;
    title: string;
    description: string;
    themeColor: PathUnit["themeColor"];
    badgeIcon: string;
    chestTitle: string;
    chestGems: number;
    chestXp: number;
  }>({
    isOpen: false,
    isEditing: false,
    unitNumber: 5,
    title: "",
    description: "",
    themeColor: "green",
    badgeIcon: "🌍",
    chestTitle: "",
    chestGems: 50,
    chestXp: 30,
  });

  // Modale d'Ajout d'Étape
  const [stageModal, setStageModal] = useState<{
    isOpen: boolean;
    unit: PathUnit | null;
    title: string;
    subtitle: string;
    category: string;
    isBoss: boolean;
    xpReward: number;
    gemReward: number;
    chosenQuizId: string;
  }>({
    isOpen: false,
    unit: null,
    title: "",
    subtitle: "",
    category: "world",
    isBoss: false,
    xpReward: 30,
    gemReward: 15,
    chosenQuizId: "",
  });

  // Confirmations modales
  const [showResetAllModal, setShowResetAllModal] = useState(false);
  const [nodeToReset, setNodeToReset] = useState<PathNode | null>(null);
  const [unitToDelete, setUnitToDelete] = useState<PathUnit | null>(null);
  const [stageToDelete, setStageToDelete] = useState<{
    unitId: string;
    node: PathNode;
  } | null>(null);

  // Recharger l'état complet du parcours
  const reloadData = () => {
    setUnits(getQuestPath());
    setAssignments(getAllPathAssignments());
  };

  // Charger tous les quiz (depuis Supabase + les quiz officiels intégrés)
  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoadingQuizzes(true);
      try {
        const { data: dbQuizzes } = await supabase
          .from("quizzes")
          .select("*")
          .order("total_plays", { ascending: false });

        const officialPathQuizzes = Object.values(PATH_QUIZZES).map((bundle) => bundle.quiz);
        const map = new Map<string, Quiz>();

        officialPathQuizzes.forEach((q) => map.set(q.id, q));
        if (dbQuizzes && dbQuizzes.length > 0) {
          dbQuizzes.forEach((q) => map.set(q.id, q as Quiz));
        }

        setAllQuizzes(Array.from(map.values()));
      } catch (err) {
        console.warn("Could not fetch quizzes, using built-in path quizzes:", err);
        setAllQuizzes(Object.values(PATH_QUIZZES).map((bundle) => bundle.quiz));
      } finally {
        setLoadingQuizzes(false);
      }
    };

    fetchQuizzes();
  }, []);

  // Catégories uniques pour les filtres du modal
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    allQuizzes.forEach((q) => {
      if (q.category) set.add(q.category);
    });
    return Array.from(set).sort();
  }, [allQuizzes]);

  // Quiz filtrés dans la modale d'attribution
  const filteredModalQuizzes = useMemo(() => {
    return allQuizzes.filter((q) => {
      const matchesSearch =
        modalSearch.trim() === "" ||
        q.title.toLowerCase().includes(modalSearch.toLowerCase()) ||
        (q.description && q.description.toLowerCase().includes(modalSearch.toLowerCase())) ||
        (q.tags && q.tags.some((t) => t.toLowerCase().includes(modalSearch.toLowerCase())));

      const matchesCat = modalCategory === "all" || q.category === modalCategory;
      const matchesDiff = modalDifficulty === "all" || q.difficulty === modalDifficulty;

      return matchesSearch && matchesCat && matchesDiff;
    });
  }, [allQuizzes, modalSearch, modalCategory, modalDifficulty]);

  // Statistiques du parcours
  const stats = useMemo(() => {
    let totalNodes = 0;
    units.forEach((u) => {
      totalNodes += u.nodes.length;
    });
    const customUnitsCount = getCustomUnits().length;
    const customAssignmentsCount = Object.keys(assignments).length;
    return {
      totalUnits: units.length,
      totalNodes,
      customUnitsCount,
      customAssignmentsCount,
    };
  }, [units, assignments]);

  // Numéro de la prochaine unité suggérée
  const nextUnitNumber = useMemo(() => {
    if (units.length === 0) return 1;
    return Math.max(...units.map((u) => u.unitNumber)) + 1;
  }, [units]);

  // Ouvrir la modale pour créer une nouvelle unité
  const handleOpenCreateUnit = () => {
    setUnitModal({
      isOpen: true,
      isEditing: false,
      unitNumber: nextUnitNumber,
      title: "",
      description: "",
      themeColor: "green",
      badgeIcon: "🌋",
      chestTitle: `Coffre de l'Unité ${nextUnitNumber}`,
      chestGems: 50,
      chestXp: 30,
    });
  };

  // Ouvrir la modale pour modifier une unité existante
  const handleOpenEditUnit = (unit: PathUnit) => {
    setUnitModal({
      isOpen: true,
      isEditing: true,
      unitId: unit.id,
      unitNumber: unit.unitNumber,
      title: unit.title,
      description: unit.description,
      themeColor: unit.themeColor,
      badgeIcon: unit.badgeIcon,
      chestTitle: unit.chest.title,
      chestGems: unit.chest.gemReward,
      chestXp: unit.chest.xpReward,
    });
  };

  // Sauvegarder l'unité (création ou modification)
  const handleSaveUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitModal.title.trim()) {
      showAppNotification({
        type: "error",
        message: "Veuillez renseigner un titre pour l'unité.",
      });
      return;
    }

    if (unitModal.isEditing && unitModal.unitId) {
      // Édition d'unité existante
      const existing = units.find((u) => u.id === unitModal.unitId);
      if (!existing) return;

      const updatedUnit: PathUnit = {
        ...existing,
        unitNumber: unitModal.unitNumber,
        title: unitModal.title.trim(),
        description: unitModal.description.trim(),
        themeColor: unitModal.themeColor,
        badgeIcon: unitModal.badgeIcon.trim() || "🌍",
        chest: {
          ...existing.chest,
          title: unitModal.chestTitle.trim() || `Coffre de l'Unité ${unitModal.unitNumber}`,
          gemReward: Number(unitModal.chestGems) || 50,
          xpReward: Number(unitModal.chestXp) || 30,
        },
        isCustom: true,
      };

      saveCustomUnit(updatedUnit);
      showAppNotification({
        type: "success",
        message: `L'Unité ${updatedUnit.unitNumber} "${updatedUnit.title}" a été mise à jour !`,
      });
    } else {
      // Création d'une nouvelle unité
      const newUnitId = `unit-${Date.now().toString(36)}`;
      const firstNodeId = `u${unitModal.unitNumber}-n1`;

      const newUnit: PathUnit = {
        id: newUnitId,
        unitNumber: unitModal.unitNumber,
        title: unitModal.title.trim(),
        description: unitModal.description.trim() || "Nouvelle unité d'apprentissage géographique",
        themeColor: unitModal.themeColor,
        badgeIcon: unitModal.badgeIcon.trim() || "🌍",
        chest: {
          id: `chest-${newUnitId}`,
          title: unitModal.chestTitle.trim() || `Coffre de l'Unité ${unitModal.unitNumber}`,
          gemReward: Number(unitModal.chestGems) || 50,
          xpReward: Number(unitModal.chestXp) || 30,
          claimed: false,
          unlocked: false,
        },
        nodes: [
          {
            id: firstNodeId,
            title: `Étape 1 : Introduction`,
            subtitle: "Première étape de l'unité",
            category: "world",
            xpReward: 25,
            gemReward: 10,
            stars: 0,
            status: "locked",
            isCustom: true,
          },
        ],
        isCustom: true,
      };

      saveCustomUnit(newUnit);
      showAppNotification({
        type: "success",
        message: `L'Unité ${newUnit.unitNumber} "${newUnit.title}" a été créée avec succès !`,
      });
    }

    setUnitModal((prev) => ({ ...prev, isOpen: false }));
    reloadData();
  };

  // Supprimer une unité
  const handleConfirmDeleteUnit = () => {
    if (!unitToDelete) return;
    deleteCustomUnit(unitToDelete.id);
    showAppNotification({
      type: "success",
      message: `L'unité "${unitToDelete.title}" a été supprimée.`,
    });
    setUnitToDelete(null);
    reloadData();
  };

  // Ouvrir la modale d'ajout d'étape
  const handleOpenAddStage = (unit: PathUnit) => {
    const nextStageIdx = unit.nodes.length + 1;
    setStageModal({
      isOpen: true,
      unit,
      title: `Étape ${nextStageIdx} : `,
      subtitle: "",
      category: "world",
      isBoss: false,
      xpReward: 30,
      gemReward: 15,
      chosenQuizId: "",
    });
  };

  // Sauvegarder l'étape ajoutée
  const handleSaveStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageModal.unit) return;
    if (!stageModal.title.trim()) {
      showAppNotification({
        type: "error",
        message: "Veuillez renseigner un titre pour l'étape.",
      });
      return;
    }

    const unit = stageModal.unit;
    const stageId = stageModal.isBoss
      ? `u${unit.unitNumber}-boss-${Date.now().toString(36)}`
      : `u${unit.unitNumber}-n${unit.nodes.length + 1}-${Date.now().toString(36)}`;

    const newNode: PathNode = {
      id: stageId,
      title: stageModal.title.trim(),
      subtitle: stageModal.subtitle.trim() || (stageModal.isBoss ? "Défi Boss" : "Défi étape"),
      category: stageModal.category.trim() || "world",
      xpReward: Number(stageModal.xpReward) || 30,
      gemReward: Number(stageModal.gemReward) || 15,
      stars: 0,
      status: "locked",
      isBoss: stageModal.isBoss,
      isCustom: true,
    };

    addStageToUnit(unit.id, newNode, DEFAULT_BASE_UNITS);

    // Si un quiz a été présélectionné lors de la création
    if (stageModal.chosenQuizId) {
      const selectedQuizObj = allQuizzes.find((q) => q.id === stageModal.chosenQuizId);
      if (selectedQuizObj) {
        setPathAssignment(newNode.id, {
          quizId: selectedQuizObj.id,
          quizTitle: selectedQuizObj.title,
          quizDescription: selectedQuizObj.description || undefined,
          category: selectedQuizObj.category || undefined,
          difficulty: selectedQuizObj.difficulty || undefined,
        });
      }
    }

    showAppNotification({
      type: "success",
      message: `Étape "${newNode.title}" ajoutée avec succès à l'Unité ${unit.unitNumber} !`,
    });

    setStageModal((prev) => ({ ...prev, isOpen: false }));
    reloadData();
  };

  // Supprimer une étape
  const handleConfirmDeleteStage = () => {
    if (!stageToDelete) return;
    removeStageFromUnit(stageToDelete.unitId, stageToDelete.node.id, DEFAULT_BASE_UNITS);
    showAppNotification({
      type: "success",
      message: `L'étape "${stageToDelete.node.title}" a été supprimée.`,
    });
    setStageToDelete(null);
    reloadData();
  };

  // Attribuer un quiz à un nœud
  const handleAssignQuiz = (node: PathNode, quiz: Quiz) => {
    setPathAssignment(node.id, {
      quizId: quiz.id,
      quizTitle: quiz.title,
      quizDescription: quiz.description || undefined,
      category: quiz.category || undefined,
      difficulty: quiz.difficulty || undefined,
    });

    showAppNotification({
      type: "success",
      message: `Quiz "${quiz.title}" attribué avec succès à l'étape "${node.title}" !`,
    });

    setAssigningNode(null);
    reloadData();
  };

  // Rétablir un nœud par défaut
  const handleConfirmResetNode = () => {
    if (!nodeToReset) return;
    removePathAssignment(nodeToReset.id);
    showAppNotification({
      type: "success",
      message: `L'étape "${nodeToReset.title}" a été réinitialisée au quiz officiel par défaut.`,
    });
    setNodeToReset(null);
    reloadData();
  };

  // Tout rétablir par défaut (quiz + unités custom)
  const handleConfirmResetAll = () => {
    resetAllPathAssignments();
    resetCustomUnits();
    showAppNotification({
      type: "success",
      message: "Toutes les étapes et unités ont été rétablies à la configuration d'origine.",
    });
    setShowResetAllModal(false);
    reloadData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 🧭 En-tête de la page avec boutons d'action majeurs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md">
              <Compass className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Gestion du Parcours</span>
                <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Admin
                </span>
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Créez de nouvelles unités, ajoutez des étapes et choisissez les questionnaires de chaque niveau
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Bouton Créer une Unité */}
          <button
            type="button"
            onClick={handleOpenCreateUnit}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black flex items-center gap-2 transition shadow-md hover:shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nouvelle Unité</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/terra")}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold flex items-center gap-2 transition shadow-sm active:scale-95"
          >
            <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
            <span>Tester le parcours</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {(stats.customAssignmentsCount > 0 || stats.customUnitsCount > 0) && (
            <button
              type="button"
              onClick={() => setShowResetAllModal(true)}
              className="px-4 py-2.5 rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-bold flex items-center gap-2 transition shadow-sm active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Tout réinitialiser</span>
            </button>
          )}
        </div>
      </div>

      {/* 📊 Cartes d'indicateurs rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Unités au total
            </span>
            <p className="text-3xl font-black text-slate-900 mt-1">{stats.totalUnits}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {stats.customUnitsCount > 0 ? `${stats.customUnitsCount} personnalisée(s)` : "4 unités d'origine"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center text-xl">
            📚
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Étapes au total
            </span>
            <p className="text-3xl font-black text-slate-900 mt-1">{stats.totalNodes}</p>
            <p className="text-xs text-slate-500 mt-0.5">Niveaux & Boss du parcours</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl">
            🗺️
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/50 to-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">
              Quiz Personnalisés
            </span>
            <p className="text-3xl font-black text-purple-700 mt-1">
              {stats.customAssignmentsCount}
            </p>
            <p className="text-xs text-purple-600/80 mt-0.5">Attribués manuellement</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl">
            ⚙️
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50/50 to-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
              Catalogue Disponible
            </span>
            <p className="text-3xl font-black text-sky-700 mt-1">{allQuizzes.length}</p>
            <p className="text-xs text-sky-600/80 mt-0.5">Quiz sélectionnables</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center text-xl">
            💡
          </div>
        </div>
      </div>

      {/* 🔍 Barre de filtres par unité & Recherche */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setSelectedUnitId("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition whitespace-nowrap ${
              selectedUnitId === "all"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Toutes les unités ({stats.totalUnits})
          </button>
          {units.map((unit) => (
            <button
              key={unit.id}
              type="button"
              onClick={() => setSelectedUnitId(unit.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-1.5 ${
                selectedUnitId === unit.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>{unit.badgeIcon}</span>
              <span>Unité {unit.unitNumber}</span>
              {unit.isCustom && (
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              )}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={nodeSearch}
            onChange={(e) => setNodeSearch(e.target.value)}
            placeholder="Rechercher une étape, un quiz..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* 🗺️ Liste des Unités et de leurs Étapes */}
      <div className="space-y-8">
        {units
          .filter((unit) => selectedUnitId === "all" || unit.id === selectedUnitId)
          .map((unit) => {
            const filteredNodes = unit.nodes.filter(
              (n) =>
                nodeSearch.trim() === "" ||
                n.title.toLowerCase().includes(nodeSearch.toLowerCase()) ||
                (n.subtitle && n.subtitle.toLowerCase().includes(nodeSearch.toLowerCase())) ||
                (n.assignedQuizTitle &&
                  n.assignedQuizTitle.toLowerCase().includes(nodeSearch.toLowerCase())) ||
                n.id.toLowerCase().includes(nodeSearch.toLowerCase())
            );

            return (
              <div
                key={unit.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition"
              >
                {/* En-tête de l'unité avec actions d'unité */}
                <div className="p-5 border-b border-slate-200 bg-slate-50/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <span className="text-3xl sm:text-4xl p-2 bg-white rounded-2xl shadow-sm border border-slate-200">
                      {unit.badgeIcon}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          Unité {unit.unitNumber}
                        </span>
                        <span className="text-xs text-slate-500 font-bold">
                          {unit.nodes.length} Étapes
                        </span>
                        <span className="text-xs text-amber-700 font-bold flex items-center gap-1 bg-amber-100/70 px-2 py-0.5 rounded-md">
                          <Gift className="w-3 h-3" />
                          Coffre : 💎 +{unit.chest.gemReward} • ⚡ +{unit.chest.xpReward} XP
                        </span>
                        {unit.isCustom && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
                            Unité Personnalisée
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                        {unit.title}
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5">{unit.description}</p>
                    </div>
                  </div>

                  {/* Actions de l'unité : Ajouter une étape, Modifier l'unité, Supprimer l'unité */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleOpenAddStage(unit)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 transition shadow-sm active:scale-95"
                      title="Ajouter une nouvelle étape à cette unité"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Ajouter une étape</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditUnit(unit)}
                      className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition shadow-sm active:scale-95"
                      title="Modifier cette unité (titre, thème, coffre, icône)"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {unit.isCustom && (
                      <button
                        type="button"
                        onClick={() => setUnitToDelete(unit)}
                        className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition shadow-sm active:scale-95"
                        title="Supprimer cette unité personnalisée"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Grille des étapes de cette unité */}
                <div className="divide-y divide-slate-100">
                  {filteredNodes.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      Aucune étape ne correspond à votre filtre dans cette unité.
                    </div>
                  ) : (
                    filteredNodes.map((node, nodeIdx) => {
                      const custom = assignments[node.id];
                      const activeQuizId = custom ? custom.quizId : node.id;
                      const isBoss = node.isBoss === true;

                      return (
                        <div
                          key={node.id}
                          className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:bg-slate-50/70 ${
                            custom ? "bg-purple-50/20" : ""
                          }`}
                        >
                          {/* Infos étape */}
                          <div className="flex items-start gap-3.5 flex-1">
                            <div
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shrink-0 shadow-sm ${
                                isBoss
                                  ? "bg-gradient-to-tr from-amber-400 to-rose-500 text-white"
                                  : custom
                                  ? "bg-gradient-to-tr from-purple-500 to-indigo-600 text-white"
                                  : "bg-gradient-to-tr from-emerald-500 to-teal-600 text-white"
                              }`}
                            >
                              {isBoss ? "👑" : nodeIdx + 1}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                                  {node.id}
                                </span>

                                {isBoss && (
                                  <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Crown className="w-3 h-3 text-amber-600" />
                                    Boss Final
                                  </span>
                                )}

                                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase">
                                  {node.category}
                                </span>

                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                  +{node.xpReward} XP • 💎 +{node.gemReward}
                                </span>

                                {custom ? (
                                  <span className="text-[10px] font-black uppercase bg-purple-100 text-purple-900 border border-purple-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Settings className="w-3 h-3 text-purple-600" />
                                    Quiz personnalisé
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Quiz officiel
                                  </span>
                                )}
                              </div>

                              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                                <span>{node.title}</span>
                                {custom && (
                                  <span className="text-xs text-purple-600 font-semibold truncate">
                                    → {custom.quizTitle}
                                  </span>
                                )}
                              </h3>

                              <p className="text-xs text-slate-500 mt-0.5">
                                {custom
                                  ? `Quiz assigné : "${custom.quizId}" (configuré le ${new Date(
                                      custom.assignedAt
                                    ).toLocaleDateString()})`
                                  : node.subtitle || "Quiz officiel du parcours d'apprentissage"}
                              </p>
                            </div>
                          </div>

                          {/* Actions pour cette étape */}
                          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/quizzes/play/${activeQuizId}?pathNodeId=${node.id}`)
                              }
                              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95"
                              title="Tester ce quiz en conditions réelles"
                            >
                              <Play className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Tester</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setAssigningNode({ node, unit })}
                              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1.5 transition shadow-sm active:scale-95"
                            >
                              <Settings className="w-3.5 h-3.5" />
                              <span>{custom ? "Modifier le quiz" : "Choisir un quiz"}</span>
                            </button>

                            {custom && (
                              <button
                                type="button"
                                onClick={() => setNodeToReset(node)}
                                className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition shadow-sm active:scale-95"
                                title="Rétablir le quiz officiel par défaut"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}

                            {/* Possibilité de supprimer une étape ajoutée dynamiquement */}
                            {(node.isCustom || unit.isCustom) && unit.nodes.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setStageToDelete({ unitId: unit.id, node })}
                                className="p-2 rounded-xl border border-slate-200 hover:border-rose-200 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition shadow-sm active:scale-95"
                                title="Supprimer cette étape de l'unité"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 🌟 MODALE DE CRÉATION / MODIFICATION D'UNE UNITÉ                    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {unitModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                  {unitModal.isEditing ? "Configuration" : "Nouvelle Aventure"}
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  {unitModal.isEditing
                    ? `Modifier l'Unité ${unitModal.unitNumber}`
                    : `Créer l'Unité ${unitModal.unitNumber}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setUnitModal((prev) => ({ ...prev, isOpen: false }))}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUnit} className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    N° Unité
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={unitModal.unitNumber}
                    onChange={(e) =>
                      setUnitModal((prev) => ({
                        ...prev,
                        unitNumber: Number(e.target.value) || 1,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Icône / Badge Emoji
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      value={unitModal.badgeIcon}
                      onChange={(e) =>
                        setUnitModal((prev) => ({ ...prev, badgeIcon: e.target.value }))
                      }
                      className="w-14 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl font-black focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="flex items-center gap-1 overflow-x-auto py-1">
                      {PRESET_EMOJIS.slice(0, 7).map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setUnitModal((prev) => ({ ...prev, badgeIcon: emoji }))}
                          className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-lg transition"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Titre de l'Unité *
                </label>
                <input
                  type="text"
                  value={unitModal.title}
                  onChange={(e) =>
                    setUnitModal((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Ex : Fleuves & Grands Deltas de la Planète"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description / Thème d'apprentissage
                </label>
                <textarea
                  rows={2}
                  value={unitModal.description}
                  onChange={(e) =>
                    setUnitModal((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Ex : Apprends à situer les plus grands cours d'eau du monde et leur impact écologique..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-slate-500" />
                  <span>Couleur du thème visuel</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {THEME_COLORS.map((color) => {
                    const selected = unitModal.themeColor === color.id;
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() =>
                          setUnitModal((prev) => ({ ...prev, themeColor: color.id }))
                        }
                        className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-bold transition ${
                          selected
                            ? `${color.borderClass} bg-slate-50 ring-2 ring-emerald-500/20`
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${color.bgClass}`} />
                        <span className="truncate">{color.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Paramètres du coffre au trésor de l'unité */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                    Récompenses du Coffre au Trésor
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Nom du Coffre
                  </label>
                  <input
                    type="text"
                    value={unitModal.chestTitle}
                    onChange={(e) =>
                      setUnitModal((prev) => ({ ...prev, chestTitle: e.target.value }))
                    }
                    placeholder={`Coffre de l'Unité ${unitModal.unitNumber}`}
                    className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      TerraGems 💎
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={unitModal.chestGems}
                      onChange={(e) =>
                        setUnitModal((prev) => ({
                          ...prev,
                          chestGems: Number(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      XP ⚡
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={unitModal.chestXp}
                      onChange={(e) =>
                        setUnitModal((prev) => ({
                          ...prev,
                          chestXp: Number(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setUnitModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-md active:scale-95"
                >
                  {unitModal.isEditing ? "Enregistrer les modifications" : "Créer l'Unité"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 🌟 MODALE D'AJOUT D'ÉTAPE DANS UNE UNITÉ                            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {stageModal.isOpen && stageModal.unit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                  Unité {stageModal.unit.unitNumber} • {stageModal.unit.title}
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  Ajouter une Nouvelle Étape
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStageModal((prev) => ({ ...prev, isOpen: false }))}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStage} className="p-5 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Titre de l'étape *
                </label>
                <input
                  type="text"
                  value={stageModal.title}
                  onChange={(e) =>
                    setStageModal((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Ex : Les Grands Fleuves d'Asie"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sous-titre / Objectif
                </label>
                <input
                  type="text"
                  value={stageModal.subtitle}
                  onChange={(e) =>
                    setStageModal((prev) => ({ ...prev, subtitle: e.target.value }))
                  }
                  placeholder="Ex : Mékong, Yangtsé, Gange"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catégorie
                  </label>
                  <input
                    type="text"
                    value={stageModal.category}
                    onChange={(e) =>
                      setStageModal((prev) => ({ ...prev, category: e.target.value }))
                    }
                    placeholder="world, fleuves, capitales..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    <input
                      type="checkbox"
                      checked={stageModal.isBoss}
                      onChange={(e) =>
                        setStageModal((prev) => ({
                          ...prev,
                          isBoss: e.target.checked,
                          xpReward: e.target.checked ? 60 : 30,
                          gemReward: e.target.checked ? 30 : 15,
                        }))
                      }
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                      <span>👑 Boss de fin</span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Récompense XP ⚡
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    value={stageModal.xpReward}
                    onChange={(e) =>
                      setStageModal((prev) => ({
                        ...prev,
                        xpReward: Number(e.target.value) || 20,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Récompense Gems 💎
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={stageModal.gemReward}
                    onChange={(e) =>
                      setStageModal((prev) => ({
                        ...prev,
                        gemReward: Number(e.target.value) || 10,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              {/* Attribution optionnelle immédiate d'un quiz */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Attribuer un questionnaire dès maintenant (optionnel)
                </label>
                <select
                  value={stageModal.chosenQuizId}
                  onChange={(e) =>
                    setStageModal((prev) => ({ ...prev, chosenQuizId: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Assigner plus tard via le sélecteur --</option>
                  {allQuizzes.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title} ({q.category} • {q.difficulty})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setStageModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-600 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-md active:scale-95"
                >
                  Ajouter l'étape
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 🎯 MODALE DE SÉLECTION D'UN QUIZ POUR UN NŒUD                       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {assigningNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Entête du modal */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-indigo-700">
                  Étape {assigningNode.node.id} • Unité {assigningNode.unit.unitNumber}
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Sélectionner le Quiz pour "{assigningNode.node.title}"
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAssigningNode(null)}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Barre de recherche et filtres */}
            <div className="p-4 border-b border-slate-200 bg-white space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder="Chercher parmi tous les quiz (titre, tags, thèmes)..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                <select
                  value={modalCategory}
                  onChange={(e) => setModalCategory(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Toutes les catégories</option>
                  {availableCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  value={modalDifficulty}
                  onChange={(e) => setModalDifficulty(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Toutes difficultés</option>
                  <option value="facile">Facile</option>
                  <option value="moyen">Moyen</option>
                  <option value="difficile">Difficile</option>
                  <option value="expert">Expert</option>
                </select>

                <span className="text-[11px] text-slate-400 ml-auto font-bold">
                  {filteredModalQuizzes.length} quiz disponibles
                </span>
              </div>
            </div>

            {/* Liste des quiz sélectionnables */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {loadingQuizzes ? (
                <div className="py-12 text-center text-slate-500 font-bold text-xs">
                  Chargement des quiz...
                </div>
              ) : filteredModalQuizzes.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <p className="font-bold text-sm">Aucun quiz trouvé</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Essayez d'élargir votre recherche ou de réinitialiser les filtres.
                  </p>
                </div>
              ) : (
                filteredModalQuizzes.map((quiz) => {
                  const isCurrent =
                    assignments[assigningNode.node.id]?.quizId === quiz.id;

                  return (
                    <div
                      key={quiz.id}
                      className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                        isCurrent
                          ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20"
                          : "bg-slate-50/80 hover:bg-slate-100/80 border-slate-200"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                            {quiz.category || "Général"}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {quiz.difficulty || "moyen"}
                          </span>
                          {quiz.verified && (
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                              <Check className="w-3 h-3 stroke-[3]" /> Officiel
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                          {quiz.title}
                        </p>
                        {quiz.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {quiz.description}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAssignQuiz(assigningNode.node, quiz)}
                        className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-black transition shadow-sm active:scale-95 flex items-center gap-1.5 ${
                          isCurrent
                            ? "bg-indigo-700 text-white"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                        }`}
                      >
                        {isCurrent ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Sélectionné</span>
                          </>
                        ) : (
                          <>
                            <span>Choisir ce quiz</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pied du modal */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                La modification sera instantanément active sur le parcours de tous les joueurs.
              </span>
              <button
                type="button"
                onClick={() => setAssigningNode(null)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation réinitialisation d'un nœud spécifique */}
      <ConfirmModal
        open={Boolean(nodeToReset)}
        title="Rétablir le quiz officiel par défaut"
        message={`Voulez-vous rétablir l'étape "${nodeToReset?.title}" avec son quiz officiel par défaut ?`}
        confirmLabel="Rétablir par défaut"
        cancelLabel="Annuler"
        confirmButtonClass="bg-rose-600 hover:bg-rose-700 text-white"
        onConfirm={handleConfirmResetNode}
        onCancel={() => setNodeToReset(null)}
      />

      {/* Confirmation suppression d'une unité personnalisée */}
      <ConfirmModal
        open={Boolean(unitToDelete)}
        title="Supprimer l'unité"
        message={`Êtes-vous sûr de vouloir supprimer l'Unité ${unitToDelete?.unitNumber} "${unitToDelete?.title}" ? Toutes ses étapes et son coffre seront retirés du parcours.`}
        confirmLabel="Supprimer l'unité"
        cancelLabel="Annuler"
        confirmButtonClass="bg-rose-600 hover:bg-rose-700 text-white"
        onConfirm={handleConfirmDeleteUnit}
        onCancel={() => setUnitToDelete(null)}
      />

      {/* Confirmation suppression d'une étape */}
      <ConfirmModal
        open={Boolean(stageToDelete)}
        title="Supprimer l'étape"
        message={`Êtes-vous sûr de vouloir supprimer l'étape "${stageToDelete?.node.title}" de cette unité ?`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        confirmButtonClass="bg-rose-600 hover:bg-rose-700 text-white"
        onConfirm={handleConfirmDeleteStage}
        onCancel={() => setStageToDelete(null)}
      />

      {/* Confirmation réinitialisation générale */}
      <ConfirmModal
        open={showResetAllModal}
        title="Tout réinitialiser par défaut"
        message="Êtes-vous sûr de vouloir rétablir le parcours à son état d'origine ? Toutes les unités personnalisées créées et les questionnaires attribués seront réinitialisés."
        confirmLabel="Tout réinitialiser"
        cancelLabel="Annuler"
        confirmButtonClass="bg-rose-600 hover:bg-rose-700 text-white"
        onConfirm={handleConfirmResetAll}
        onCancel={() => setShowResetAllModal(false)}
      />
    </div>
  );
}
