import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Star,
  Lock,
  Check,
  Sparkles,
  BookOpen,
  ArrowRight,
  X,
  Search,
  Filter,
  Play,
  Compass,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import {
  getQuestPath,
  claimChest,
  PathUnit,
  PathNode,
  PathChest,
} from "../../lib/gamificationManager";
import { PATH_QUIZZES } from "../../lib/pathQuizzesData";
import { PATH_CONFIG_EVENT } from "../../lib/pathConfigManager";
import { supabase } from "../../lib/supabase";
import { triggerConfetti } from "../common/Confetti";
import type { Database } from "../../lib/database.types";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];

interface DuolingoQuestPathProps {
  userId?: string;
  onNodeStart?: (node: PathNode, chosenQuizId?: string) => void;
}

// Oscillations sinueuses horizontales (en pixels) pour créer le chemin Duolingo
const HORIZONTAL_OFFSETS = [0, -50, -80, -40, 0, 40, 80, 50];

export function DuolingoQuestPath({ userId, onNodeStart }: DuolingoQuestPathProps) {
  const navigate = useNavigate();
  const [units, setUnits] = useState<PathUnit[]>(() => getQuestPath(userId));
  const [selectedNode, setSelectedNode] = useState<{
    node: PathNode;
    unit: PathUnit;
  } | null>(null);
  const [guidebookUnit, setGuidebookUnit] = useState<PathUnit | null>(null);
  const [chestModal, setChestModal] = useState<{
    chest: PathChest;
    unit: PathUnit;
  } | null>(null);

  // Mode de vue : soit le chemin sinueux aventure, soit la bibliothèque pour choisir son quiz
  const [viewTab, setViewTab] = useState<"path" | "catalog">("path");

  // Liste de tous les quiz disponibles pour le parcours
  const [allQuizzes, setAllQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [quizSearch, setQuizSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");

  // Dans la modale de niveau : afficher le sélecteur de quiz personnalisé
  const [showCustomQuizPicker, setShowCustomQuizPicker] = useState(false);

  // Recharger les unités lors de mises à jour de gamification
  const refreshUnits = () => {
    setUnits(getQuestPath(userId));
  };

  useEffect(() => {
    const handleGamificationUpdated = () => {
      refreshUnits();
    };
    window.addEventListener("terracost_gamification_updated", handleGamificationUpdated);
    window.addEventListener(PATH_CONFIG_EVENT, handleGamificationUpdated);
    return () => {
      window.removeEventListener("terracost_gamification_updated", handleGamificationUpdated);
      window.removeEventListener(PATH_CONFIG_EVENT, handleGamificationUpdated);
    };
  }, [userId]);

  // Charger tous les quiz (depuis Supabase + les quiz officiels du parcours)
  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoadingQuizzes(true);
      try {
        const { data: dbQuizzes } = await supabase
          .from("quizzes")
          .select("*")
          .order("total_plays", { ascending: false });

        // Extraire les quiz officiels du catalogue de parcours
        const officialPathQuizzes = Object.values(PATH_QUIZZES).map((bundle) => bundle.quiz);

        // Fusionner sans doublons d'ID
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

  const handleNodeClick = (node: PathNode, unit: PathUnit) => {
    if (node.status === "locked") return;
    setShowCustomQuizPicker(false);
    setSelectedNode({ node, unit });
  };

  const handleStartLevel = (node: PathNode, chosenQuizId?: string) => {
    setSelectedNode(null);
    if (onNodeStart) {
      onNodeStart(node, chosenQuizId);
      return;
    }

    const targetQuizId = chosenQuizId || node.assignedQuizId || node.id;
    navigate(`/quizzes/play/${targetQuizId}?pathNodeId=${node.id}`);
  };

  const handleOpenChest = (chest: PathChest, unit: PathUnit) => {
    if (!chest.unlocked || chest.claimed) return;

    try {
      triggerConfetti();
    } catch {
      // Confetti fallback
    }

    claimChest(userId, chest.id, chest.gemReward);
    refreshUnits();
    setChestModal({ chest, unit });
  };

  // Filtrer les quiz selon la recherche et filtres
  const filteredQuizzes = useMemo(() => {
    return allQuizzes.filter((q) => {
      const matchesSearch =
        quizSearch.trim() === "" ||
        q.title.toLowerCase().includes(quizSearch.toLowerCase()) ||
        (q.description && q.description.toLowerCase().includes(quizSearch.toLowerCase())) ||
        (q.tags && q.tags.some((t) => t.toLowerCase().includes(quizSearch.toLowerCase())));

      const matchesCat = selectedCategory === "all" || q.category === selectedCategory;
      const matchesDiff = selectedDifficulty === "all" || q.difficulty === selectedDifficulty;

      return matchesSearch && matchesCat && matchesDiff;
    });
  }, [allQuizzes, quizSearch, selectedCategory, selectedDifficulty]);

  // Niveau actif actuel (le prochain à jouer)
  const currentActiveNode = useMemo(() => {
    for (const unit of units) {
      const active = unit.nodes.find((n) => n.status === "active");
      if (active) return { node: active, unit };
    }
    return null;
  }, [units]);

  return (
    <div className="w-full max-w-xl mx-auto px-3 sm:px-4 py-4 select-none">
      {/* 🧭 BARRE DE COMMUTATION D'ONGLETS : Parcours Aventure vs Choisir son Quiz */}
      <div className="bg-slate-100/90 backdrop-blur-sm p-1.5 rounded-2xl flex items-center gap-1.5 mb-6 shadow-sm border border-slate-200">
        <button
          type="button"
          onClick={() => setViewTab("path")}
          className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            viewTab === "path"
              ? "bg-white text-emerald-700 shadow-md scale-[1.02]"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <span>🗺️ Parcours Aventure</span>
          {currentActiveNode && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setViewTab("catalog")}
          className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            viewTab === "catalog"
              ? "bg-white text-indigo-700 shadow-md scale-[1.02]"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <span>📚 Choisir son Quiz</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-extrabold">
            {allQuizzes.length}
          </span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* VUE 1 : PARCOURS D'AVENTURE SINUEUX DUOLINGO */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {viewTab === "path" && (
        <div className="space-y-12">
          {units.map((unit) => {
            const completedCount = unit.nodes.filter((n) => n.status === "completed").length;
            const totalNodes = unit.nodes.length;
            const percentCompleted = Math.round((completedCount / totalNodes) * 100);

            const themeStyles = {
              green: {
                headerBg: "bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700",
                border: "border-green-500",
                btnActive: "bg-[#58cc02] border-[#46a302] text-white",
                shadow: "shadow-green-600/30",
                pathLine: "stroke-emerald-400",
              },
              blue: {
                headerBg: "bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700",
                border: "border-sky-500",
                btnActive: "bg-[#1cb0f6] border-[#1899d6] text-white",
                shadow: "shadow-sky-600/30",
                pathLine: "stroke-sky-400",
              },
              amber: {
                headerBg: "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600",
                border: "border-amber-400",
                btnActive: "bg-[#ff9600] border-[#cc7900] text-white",
                shadow: "shadow-amber-500/30",
                pathLine: "stroke-amber-400",
              },
              purple: {
                headerBg: "bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-700",
                border: "border-purple-400",
                btnActive: "bg-[#ce82ff] border-[#a559d9] text-white",
                shadow: "shadow-purple-500/30",
                pathLine: "stroke-purple-400",
              },
              rose: {
                headerBg: "bg-gradient-to-r from-rose-500 via-pink-600 to-red-600",
                border: "border-rose-400",
                btnActive: "bg-[#ff4b4b] border-[#d93838] text-white",
                shadow: "shadow-rose-500/30",
                pathLine: "stroke-rose-400",
              },
              teal: {
                headerBg: "bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-700",
                border: "border-teal-400",
                btnActive: "bg-[#00cd9c] border-[#009b76] text-white",
                shadow: "shadow-teal-500/30",
                pathLine: "stroke-teal-400",
              },
              sky: {
                headerBg: "bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-700",
                border: "border-blue-400",
                btnActive: "bg-[#1cb0f6] border-[#1899d6] text-white",
                shadow: "shadow-blue-500/30",
                pathLine: "stroke-blue-400",
              },
            }[unit.themeColor] || {
              headerBg: "bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700",
              border: "border-green-500",
              btnActive: "bg-[#58cc02] border-[#46a302] text-white",
              shadow: "shadow-green-600/30",
              pathLine: "stroke-emerald-400",
            };

            return (
              <section key={unit.id} className="relative">
                {/* 📌 En-tête officiel de l'Unité Duolingo */}
                <div
                  className={`rounded-3xl p-5 text-white shadow-xl ${themeStyles.headerBg} relative overflow-hidden`}
                >
                  <div className="flex items-center justify-between gap-3 relative z-10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs uppercase font-black tracking-widest bg-black/20 px-2.5 py-0.5 rounded-full">
                          UNITÉ {unit.unitNumber}
                        </span>
                        <span className="text-xs font-bold text-white/80">
                          {percentCompleted}% complété
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black truncate">{unit.title}</h3>
                      <p className="text-xs sm:text-sm text-white/90 font-medium line-clamp-1 mt-0.5">
                        {unit.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setGuidebookUnit(unit)}
                        className="px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-2xl text-xs font-black flex items-center gap-1.5 transition active:scale-95 border border-white/30"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span className="hidden sm:inline">GUIDE</span>
                      </button>
                      <div className="text-3xl sm:text-4xl filter drop-shadow">
                        {unit.badgeIcon}
                      </div>
                    </div>
                  </div>

                  {/* Barre de progression continue */}
                  <div className="w-full bg-black/20 h-2 rounded-full mt-3 overflow-hidden">
                    <div
                      className="bg-white h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentCompleted}%` }}
                    />
                  </div>
                </div>

                {/* 🌀 Nœuds du Chemin d'Apprentissage */}
                <div className="py-8 flex flex-col items-center relative">
                  {unit.nodes.map((node, nodeIdx) => {
                    const offsetPx = HORIZONTAL_OFFSETS[nodeIdx % HORIZONTAL_OFFSETS.length];
                    const isLocked = node.status === "locked";
                    const isActive = node.status === "active";
                    const isCompleted = node.status === "completed";

                    return (
                      <div
                        key={node.id}
                        className="my-3 relative flex flex-col items-center"
                        style={{
                          transform: `translateX(${offsetPx}px)`,
                          transition: "transform 0.3s ease",
                        }}
                      >
                        {/* Bulle / Indicateur "COMMENCER" au-dessus du nœud actif */}
                        {isActive && (
                          <div className="absolute -top-11 z-20 animate-duo-bounce pointer-events-none">
                            <div className="bg-white text-slate-800 text-xs font-black px-3 py-1.5 rounded-2xl shadow-xl border-2 border-slate-200 uppercase tracking-wider flex items-center gap-1">
                              <span>COMMENCER</span>
                              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                            </div>
                            <div className="w-2.5 h-2.5 bg-white border-r-2 border-b-2 border-slate-200 rotate-45 mx-auto -mt-1" />
                          </div>
                        )}

                        {/* Gros Cercle / Nœud Tactile Duolingo */}
                        <button
                          type="button"
                          onClick={() => handleNodeClick(node, unit)}
                          disabled={isLocked}
                          aria-label={`${node.title} - ${node.subtitle}`}
                          className={`relative w-20 h-20 sm:w-22 sm:h-22 rounded-full flex flex-col items-center justify-center transition-all duration-200 ${
                            isLocked
                              ? "bg-slate-200 text-slate-400 border-b-4 border-slate-300 cursor-not-allowed opacity-80"
                              : isCompleted
                              ? "bg-[#ffc800] border-b-4 border-[#e5a000] text-amber-950 shadow-lg hover:brightness-105 active:translate-y-1 active:border-b-0 cursor-pointer"
                              : `${themeStyles.btnActive} shadow-xl hover:brightness-110 active:translate-y-1 active:border-b-0 cursor-pointer animate-pulse-gentle`
                          }`}
                        >
                          {/* Étoiles du niveau au-dessus */}
                          {isCompleted && (
                            <div className="absolute -top-3 flex items-center gap-0.5 bg-white/95 px-2 py-0.5 rounded-full shadow border border-amber-300">
                              {[1, 2, 3].map((starIdx) => (
                                <Star
                                  key={starIdx}
                                  className={`w-3 h-3 ${
                                    starIdx <= node.stars
                                      ? "text-amber-500 fill-amber-400"
                                      : "text-slate-300"
                                  }`}
                                />
                              ))}
                            </div>
                          )}

                          {/* Icône du nœud */}
                          <div className="text-2xl sm:text-3xl">
                            {isLocked ? (
                              <Lock className="w-7 h-7 stroke-[2.5]" />
                            ) : isCompleted ? (
                              <Check className="w-8 h-8 stroke-[3.5] text-amber-950" />
                            ) : node.isBoss ? (
                              <span className="text-3xl">👑</span>
                            ) : (
                              <Star className="w-8 h-8 fill-current stroke-[2.5]" />
                            )}
                          </div>
                        </button>

                        {/* Titre discret sous le nœud */}
                        <span
                          className={`text-xs font-black mt-2 text-center max-w-[130px] truncate ${
                            isActive
                              ? "text-slate-900 font-extrabold"
                              : isCompleted
                              ? "text-slate-700"
                              : "text-slate-400"
                          }`}
                        >
                          {node.title}
                        </span>
                      </div>
                    );
                  })}

                  {/* 🎁 Étape Coffre au Trésor de l'Unité */}
                  <div className="my-5 flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => handleOpenChest(unit.chest, unit)}
                      disabled={!unit.chest.unlocked || unit.chest.claimed}
                      className={`relative p-4 rounded-3xl transition-all duration-200 flex flex-col items-center justify-center ${
                        unit.chest.claimed
                          ? "bg-slate-100 border-2 border-slate-200 text-slate-400 cursor-default"
                          : unit.chest.unlocked
                          ? "bg-gradient-to-tr from-amber-400 to-yellow-300 border-b-4 border-amber-600 shadow-xl cursor-pointer hover:scale-105 active:scale-95 animate-duo-wiggle"
                          : "bg-slate-100 border-2 border-dashed border-slate-300 text-slate-300 cursor-not-allowed opacity-60"
                      }`}
                    >
                      <div className="text-4xl sm:text-5xl">
                        {unit.chest.claimed ? "📭" : "🎁"}
                      </div>

                      <span className="text-xs font-black mt-1.5 uppercase tracking-wide">
                        {unit.chest.claimed
                          ? "Coffre ouvert"
                          : unit.chest.unlocked
                          ? "OUVRIR (+40 💎)"
                          : "Coffre verrouillé"}
                      </span>

                      {unit.chest.unlocked && !unit.chest.claimed && (
                        <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md animate-bounce">
                          PRÊT !
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* VUE 2 : CATALOGUE & CHOIX DE QUIZ POUR LE PARCOURS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {viewTab === "catalog" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Bannière explicative */}
          <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 rounded-3xl p-5 text-white shadow-xl">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📚🎯</span>
              <div>
                <h3 className="text-lg font-black">Bibliothèque des Quiz du Parcours</h3>
                <p className="text-xs text-indigo-100 mt-0.5">
                  Choisis n'importe quel quiz ci-dessous pour valider ton étape active du parcours et remporter des étoiles ⭐ !
                </p>
              </div>
            </div>
            {currentActiveNode && (
              <div className="mt-3 bg-black/25 px-3 py-2 rounded-2xl flex items-center justify-between text-xs">
                <span className="font-medium text-indigo-200">
                  Étape active actuelle : <strong>{currentActiveNode.node.title}</strong>
                </span>
                <span className="font-black bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full text-[10px]">
                  +{currentActiveNode.node.xpReward} XP • +{currentActiveNode.node.gemReward} 💎
                </span>
              </div>
            )}
          </div>

          {/* Recherche & Filtres */}
          <div className="bg-white rounded-2xl p-3 shadow-md border border-slate-200 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={quizSearch}
                onChange={(e) => setQuizSearch(e.target.value)}
                placeholder="Rechercher par titre, mot-clé ou continent..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              {quizSearch && (
                <button
                  onClick={() => setQuizSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0">
                <Filter className="w-3 h-3" /> Thème :
              </span>
              {["all", "regions", "capitals", "flags", "mixed"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg font-bold capitalize transition shrink-0 ${
                    selectedCategory === cat
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat === "all" ? "Tous" : cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0">
                Niveau :
              </span>
              {["all", "easy", "medium", "hard"].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-2.5 py-1 rounded-lg font-bold capitalize transition shrink-0 ${
                    selectedDifficulty === diff
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {diff === "all" ? "Tous" : diff === "easy" ? "Facile" : diff === "medium" ? "Moyen" : "Difficile"}
                </button>
              ))}
            </div>
          </div>

          {/* Liste des Quiz disponibles */}
          {loadingQuizzes ? (
            <div className="p-8 text-center bg-white rounded-3xl shadow-sm border border-slate-100">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-bold">Chargement des quiz disponibles...</p>
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl shadow-sm border border-slate-100">
              <p className="text-3xl mb-2">🔍</p>
              <h4 className="font-extrabold text-slate-800 text-sm">Aucun quiz trouvé</h4>
              <p className="text-xs text-slate-500 mt-1">Essaie un autre terme de recherche.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredQuizzes.map((quiz) => {
                const targetNode = currentActiveNode?.node;
                const isPathOfficial = quiz.id.startsWith("u");

                return (
                  <div
                    key={quiz.id}
                    className="p-4 bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {isPathOfficial ? (
                          <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                            ⭐ Officiel Parcours
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {quiz.category}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            quiz.difficulty === "easy"
                              ? "bg-green-100 text-green-700"
                              : quiz.difficulty === "medium"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {quiz.difficulty}
                        </span>
                        {quiz.total_plays > 0 && (
                          <span className="text-[10px] text-slate-400 font-bold">
                            {quiz.total_plays} parties
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm sm:text-base font-black text-slate-900 truncate">
                        {quiz.title}
                      </h4>
                      {quiz.description && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {quiz.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (targetNode) {
                            handleStartLevel(targetNode, quiz.id);
                          } else {
                            navigate(`/quizzes/play/${quiz.id}`);
                          }
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 btn-duo btn-duo-green text-xs font-black flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>
                          {targetNode ? `Valider l'Étape (${targetNode.title.slice(0, 14)}...)` : "Jouer ce Quiz"}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 🌟 MODALE DE NIVEAU DU PARCOURS : CHOIX DU QUIZ OU DÉFI OFFICIEL  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {selectedNode && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
          onClick={() => setSelectedNode(null)}
        >
          <div
            className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border-4 border-slate-100 relative max-h-[90vh] overflow-y-auto animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton de fermeture */}
            <button
              onClick={() => setSelectedNode(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* En-tête du niveau */}
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl shadow-lg shrink-0">
                {selectedNode.node.isBoss ? "👑" : selectedNode.unit.badgeIcon}
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <span className="text-[11px] font-black uppercase text-emerald-600 tracking-wider">
                  Unité {selectedNode.unit.unitNumber} • {selectedNode.node.category}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                  {selectedNode.node.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  {selectedNode.node.subtitle}
                </p>
              </div>
            </div>

            {/* Étoiles & Récompenses */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 mb-5 text-center">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Étoiles</span>
                <div className="flex items-center justify-center gap-0.5 mt-0.5">
                  {[1, 2, 3].map((s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${
                        s <= selectedNode.node.stars
                          ? "text-amber-500 fill-amber-400"
                          : "text-slate-300"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Points d'XP</span>
                <p className="text-sm font-black text-emerald-600 mt-0.5 flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  +{selectedNode.node.xpReward} XP
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">TerraGems</span>
                <p className="text-sm font-black text-sky-600 mt-0.5">
                  💎 +{selectedNode.node.gemReward}
                </p>
              </div>
            </div>

            {/* 🎯 OPTION 1 : DÉFI DU NIVEAU */}
            <div className={`p-4 rounded-2xl border-2 mb-4 shadow-sm ${
              selectedNode.node.hasCustomQuiz
                ? "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-indigo-300"
                : "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300/80"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1 ${
                  selectedNode.node.hasCustomQuiz ? "text-indigo-800" : "text-emerald-800"
                }`}>
                  {selectedNode.node.hasCustomQuiz ? "⚙️ QUIZ ATTRIBUÉ PAR L'ADMIN" : "⭐ DÉFI OFFICIEL RECOMMANDÉ"}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  selectedNode.node.hasCustomQuiz
                    ? "bg-indigo-200/80 text-indigo-900"
                    : "bg-emerald-200/70 text-emerald-900"
                }`}>
                  {selectedNode.node.hasCustomQuiz ? "Quiz personnalisé" : "5 Questions • 30s"}
                </span>
              </div>
              <h4 className="text-base font-extrabold text-slate-900 mb-1">
                {selectedNode.node.assignedQuizTitle || selectedNode.node.title}
              </h4>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                {selectedNode.node.hasCustomQuiz
                  ? "Ce questionnaire a été configuré spécifiquement par l'administration pour cette étape du parcours."
                  : "Ce quiz a été spécialement conçu pour tester tes compétences sur cette étape géographique."}
              </p>

              <button
                type="button"
                onClick={() => handleStartLevel(selectedNode.node)}
                className={`w-full py-3.5 px-4 btn-duo text-sm font-black flex items-center justify-center gap-2 shadow-md hover:brightness-105 active:scale-98 ${
                  selectedNode.node.hasCustomQuiz ? "btn-duo-purple" : "btn-duo-green"
                }`}
              >
                <span>
                  {selectedNode.node.status === "completed"
                    ? "REJOUER LE QUIZ DU NIVEAU"
                    : "LANCER LE QUIZ DU NIVEAU"}
                </span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>

            {/* 🔍 OPTION 2 : CHOISIR UN QUIZ DE LA BIBLIOTHÈQUE POUR CE NIVEAU */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowCustomQuizPicker(!showCustomQuizPicker)}
                className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition font-extrabold text-xs sm:text-sm text-slate-800"
              >
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-indigo-600" />
                  <span>Ou choisir un quiz parmi tous ceux qu'on a</span>
                </div>
                {showCustomQuizPicker ? (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {showCustomQuizPicker && (
                <div className="p-3 bg-white space-y-3 border-t border-slate-200 max-h-72 overflow-y-auto animate-fadeIn">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={quizSearch}
                      onChange={(e) => setQuizSearch(e.target.value)}
                      placeholder="Chercher un quiz dans la bibliothèque..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-2">
                    {filteredQuizzes.slice(0, 8).map((quiz) => (
                      <div
                        key={quiz.id}
                        className="p-2.5 bg-slate-50 hover:bg-indigo-50/60 rounded-xl border border-slate-200 flex items-center justify-between gap-2 transition"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-extrabold text-slate-900 truncate">
                            {quiz.title}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                            <span className="capitalize">{quiz.category}</span>
                            <span>•</span>
                            <span className="capitalize">{quiz.difficulty}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStartLevel(selectedNode.node, quiz.id)}
                          className="shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm active:scale-95 flex items-center gap-1"
                        >
                          <span>Choisir</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📖 CARNET DE CONNAISSANCES DE L'UNITÉ */}
      {guidebookUnit && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setGuidebookUnit(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-4 border-slate-100 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setGuidebookUnit(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{guidebookUnit.badgeIcon}</span>
              <div>
                <span className="text-xs font-black uppercase text-emerald-600">
                  Guide d'étude • Unité {guidebookUnit.unitNumber}
                </span>
                <h3 className="text-xl font-black text-slate-900 leading-tight">
                  {guidebookUnit.title}
                </h3>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              {guidebookUnit.description}
            </p>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {guidebookUnit.nodes.map((node, i) => (
                <div
                  key={node.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between"
                >
                  <div>
                    <p className="font-extrabold text-sm text-slate-800">
                      {i + 1}. {node.title}
                    </p>
                    <p className="text-xs text-slate-500">{node.subtitle}</p>
                  </div>
                  <span className="text-xs font-black px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800">
                    +{node.xpReward} XP
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setGuidebookUnit(null)}
              className="w-full mt-5 py-3 btn-duo btn-duo-green text-sm"
            >
              J'AI COMPRIS !
            </button>
          </div>
        </div>
      )}

      {/* 🎉 CÉLÉBRATION D'OUVERTURE DE COFFRE */}
      {chestModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setChestModal(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border-4 border-amber-200 text-center relative animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-6xl my-2 animate-duo-bounce">🎁</div>

            <h3 className="text-2xl font-black text-slate-900 mb-1">
              Trésor Débloqué !
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              Félicitations, vous avez mérité les récompenses de ce coffre d'exploration.
            </p>

            <div className="flex items-center justify-center gap-4 my-4">
              <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-3 min-w-[100px]">
                <div className="text-2xl">💎</div>
                <div className="text-base font-black text-sky-700">
                  +{chestModal.chest.gemReward}
                </div>
                <div className="text-[10px] text-slate-500 font-bold">GEMS</div>
              </div>

              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-3 min-w-[100px]">
                <div className="text-2xl">⚡</div>
                <div className="text-base font-black text-emerald-700">
                  +{chestModal.chest.xpReward}
                </div>
                <div className="text-[10px] text-slate-500 font-bold">XP</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setChestModal(null)}
              className="w-full py-3 btn-duo btn-duo-amber text-sm font-black mt-2"
            >
              GÉNIAL !
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
