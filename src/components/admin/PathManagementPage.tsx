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
  BookOpen,
  Filter,
  Check,
  X,
  Layers,
  Crown,
  MapPin,
  ChevronRight,
  Info,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useNotifications } from "../../contexts/NotificationContext";
import {
  getQuestPath,
  PathUnit,
  PathNode,
} from "../../lib/gamificationManager";
import {
  getAllPathAssignments,
  setPathAssignment,
  removePathAssignment,
  resetAllPathAssignments,
  PathNodeAssignment,
} from "../../lib/pathConfigManager";
import { PATH_QUIZZES } from "../../lib/pathQuizzesData";
import { ConfirmModal } from "../common/ConfirmModal";
import type { Database } from "../../lib/database.types";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];

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

  // Modale de confirmation réinitialisation générale
  const [showResetAllModal, setShowResetAllModal] = useState(false);
  const [nodeToReset, setNodeToReset] = useState<PathNode | null>(null);

  // Recharger l'état du parcours
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
    const customCount = Object.keys(assignments).length;
    const defaultCount = Math.max(0, totalNodes - customCount);
    return { totalNodes, customCount, defaultCount };
  }, [units, assignments]);

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

  // Tout rétablir par défaut
  const handleConfirmResetAll = () => {
    resetAllPathAssignments();
    showAppNotification({
      type: "success",
      message: "Toutes les étapes du parcours ont été rétablies aux quiz officiels par défaut.",
    });
    setShowResetAllModal(false);
    reloadData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* 🧭 En-tête de la page */}
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
                Définissez précisément quel questionnaire est joué sur chaque étape et boss du parcours aventure
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => navigate("/terra")}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold flex items-center gap-2 transition shadow-sm active:scale-95"
          >
            <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
            <span>Tester le parcours</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {stats.customCount > 0 && (
            <button
              type="button"
              onClick={() => setShowResetAllModal(true)}
              className="px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-bold flex items-center gap-2 transition shadow-sm active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Tout réinitialiser par défaut</span>
            </button>
          )}
        </div>
      </div>

      {/* 📊 Cartes d'indicateurs rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total des Étapes
            </span>
            <p className="text-3xl font-black text-slate-900 mt-1">{stats.totalNodes}</p>
            <p className="text-xs text-slate-500 mt-0.5">Sur 4 unités d'apprentissage</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center text-xl">
            🗺️
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/50 to-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">
              Quiz Personnalisés
            </span>
            <p className="text-3xl font-black text-purple-700 mt-1">{stats.customCount}</p>
            <p className="text-xs text-purple-600/80 mt-0.5">Attribués manuellement</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl">
            ⚙️
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Quiz Officiels par Défaut
            </span>
            <p className="text-3xl font-black text-emerald-700 mt-1">{stats.defaultCount}</p>
            <p className="text-xs text-emerald-600/80 mt-0.5">Épisodes natifs TerraCoast</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl">
            ⭐
          </div>
        </div>
      </div>

      {/* 🔍 Barre de filtres par unité */}
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
            Toutes les unités ({stats.totalNodes})
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
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={nodeSearch}
            onChange={(e) => setNodeSearch(e.target.value)}
            placeholder="Rechercher une étape..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* 🗺️ Liste des Unités et des Nœuds */}
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

            if (filteredNodes.length === 0) return null;

            return (
              <div
                key={unit.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm"
              >
                {/* En-tête de l'unité */}
                <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{unit.badgeIcon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
                          Unité {unit.unitNumber}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-xs text-slate-500 font-bold">
                          {unit.nodes.length} Étapes
                        </span>
                      </div>
                      <h2 className="text-lg font-black text-slate-900">{unit.title}</h2>
                      <p className="text-xs text-slate-600 mt-0.5">{unit.description}</p>
                    </div>
                  </div>
                </div>

                {/* Grille des étapes de cette unité */}
                <div className="divide-y divide-slate-100">
                  {filteredNodes.map((node) => {
                    const custom = assignments[node.id];
                    const activeQuizId = custom ? custom.quizId : node.id;
                    const isBoss = node.isBoss === true;

                    return (
                      <div
                        key={node.id}
                        className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:bg-slate-50/70 ${
                          custom ? "bg-purple-50/20" : ""
                        }`}
                      >
                        {/* Infos étape */}
                        <div className="flex items-start gap-4 flex-1">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 shadow-sm ${
                              isBoss
                                ? "bg-gradient-to-tr from-amber-400 to-rose-500 text-white"
                                : custom
                                ? "bg-gradient-to-tr from-purple-500 to-indigo-600 text-white"
                                : "bg-gradient-to-tr from-emerald-500 to-teal-600 text-white"
                            }`}
                          >
                            {isBoss ? "👑" : node.category === "flags" ? "🚩" : "🌍"}
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

                              {custom ? (
                                <span className="text-[10px] font-black uppercase bg-purple-100 text-purple-900 border border-purple-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Settings className="w-3 h-3 text-purple-600" />
                                  Quiz personnalisé
                                </span>
                              ) : (
                                <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Quiz par défaut
                                </span>
                              )}
                            </div>

                            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                              <span>{node.title}</span>
                              {custom && (
                                <span className="text-xs text-purple-600 font-semibold">
                                  (Remplacé par l'admin)
                                </span>
                              )}
                            </h3>

                            <p className="text-xs text-slate-500 mt-0.5">
                              {custom
                                ? `Quiz ID attribué : "${custom.quizId}" • Assigné le ${new Date(
                                    custom.assignedAt
                                  ).toLocaleDateString()}`
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
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>

      {/* 🎯 MODALE DE SÉLECTION D'UN QUIZ POUR UN NŒUD */}
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

      {/* Confirmation réinitialisation générale */}
      <ConfirmModal
        open={showResetAllModal}
        title="Réinitialiser tout le parcours"
        message="Êtes-vous sûr de vouloir rétablir TOUTES les étapes du parcours à leurs quiz officiels d'origine ? Toutes les attributions personnalisées seront supprimées."
        confirmLabel="Tout réinitialiser"
        cancelLabel="Annuler"
        confirmButtonClass="bg-rose-600 hover:bg-rose-700 text-white"
        onConfirm={handleConfirmResetAll}
        onCancel={() => setShowResetAllModal(false)}
      />
    </div>
  );
}
