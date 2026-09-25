import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Star,
  Lock,
  Check,
  Sparkles,
  BookOpen,
  ArrowRight,
  X,
} from "lucide-react";
import {
  getQuestPath,
  claimChest,
  PathUnit,
  PathNode,
  PathChest,
} from "../../lib/gamificationManager";
import { triggerConfetti } from "../common/Confetti";


interface DuolingoQuestPathProps {
  userId?: string;
  onNodeStart?: (node: PathNode) => void;
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

  const refreshUnits = () => {
    setUnits(getQuestPath(userId));
  };

  const handleNodeClick = (node: PathNode, unit: PathUnit) => {
    if (node.status === "locked") return;
    setSelectedNode({ node, unit });
  };

  const handleStartLevel = (node: PathNode) => {
    setSelectedNode(null);
    if (onNodeStart) {
      onNodeStart(node);
      return;
    }

    // Navigation contextuelle selon la catégorie
    if (node.category === "flags") {
      navigate("/games");
    } else if (node.category === "boss") {
      navigate("/quizzes");
    } else {
      // Lance la recherche de quiz ou la liste
      navigate(`/quizzes?search=${encodeURIComponent(node.category)}`);
    }
  };

  const handleOpenChest = (chest: PathChest, unit: PathUnit) => {
    if (!chest.unlocked || chest.claimed) return;

    // Déclenche l'animation de confetti Duolingo
    try {
      triggerConfetti();
    } catch {
      // Confetti fallback
    }

    claimChest(userId, chest.id, chest.gemReward);
    refreshUnits();
    setChestModal({ chest, unit });
  };

  return (
    <div className="w-full max-w-xl mx-auto px-3 sm:px-4 py-4 select-none">
      {units.map((unit, unitIdx) => {
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
            headerBg: "bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-700",
            border: "border-sky-500",
            btnActive: "bg-[#1cb0f6] border-[#1899d6] text-white",
            shadow: "shadow-sky-600/30",
            pathLine: "stroke-sky-400",
          },
          amber: {
            headerBg: "bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-600",
            border: "border-amber-400",
            btnActive: "bg-[#ffc800] border-[#e5a500] text-amber-950",
            shadow: "shadow-amber-500/30",
            pathLine: "stroke-amber-400",
          },
          purple: {
            headerBg: "bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-700",
            border: "border-purple-500",
            btnActive: "bg-[#ce82ff] border-[#a855f7] text-white",
            shadow: "shadow-purple-600/30",
            pathLine: "stroke-purple-400",
          },
          rose: {
            headerBg: "bg-gradient-to-r from-rose-600 to-pink-600",
            border: "border-rose-500",
            btnActive: "bg-[#ff4b4b] border-[#ea2b2b] text-white",
            shadow: "shadow-rose-600/30",
            pathLine: "stroke-rose-400",
          },
        }[unit.themeColor] || {
          headerBg: "bg-gradient-to-r from-emerald-600 to-teal-600",
          border: "border-emerald-500",
          btnActive: "bg-[#58cc02] border-[#46a302] text-white",
          shadow: "shadow-emerald-600/30",
          pathLine: "stroke-emerald-400",
        };

        return (
          <section key={unit.id} className="mb-14 relative">
            {/* 🏷️ En-tête d'Unité Duolingo (Bannière Tactile 3D) */}
            <div
              className={`rounded-3xl p-5 sm:p-6 text-white ${themeStyles.headerBg} shadow-xl border-b-4 border-black/20 mb-8 relative overflow-hidden`}
            >
              {/* Texture décorative en arrière-plan */}
              <div className="absolute -right-6 -bottom-6 text-7xl sm:text-8xl opacity-15 pointer-events-none select-none">
                {unit.badgeIcon}
              </div>

              <div className="flex items-start justify-between gap-4 relative z-10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider bg-white/25 backdrop-blur-sm px-3 py-1 rounded-full text-white">
                      Unité {unit.unitNumber}
                    </span>
                    <span className="text-xs font-black text-white/90">
                      {completedCount} / {totalNodes} étapes
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black mt-2 leading-tight drop-shadow-sm flex items-center gap-2">
                    <span>{unit.title}</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-md">
                    {unit.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setGuidebookUnit(unit)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs font-black transition-all active:scale-95 border border-white/30 shadow-sm"
                  title="Ouvrir le carnet de l'unité"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">GUIDE</span>
                </button>
              </div>

              {/* Jauge de progression de l'Unité */}
              <div className="mt-4 bg-black/20 rounded-full h-3 p-0.5 relative overflow-hidden backdrop-blur-sm">
                <div
                  className="bg-white rounded-full h-full transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.max(5, percentCompleted)}%` }}
                />
              </div>
            </div>

            {/* 🌀 Le Chemin Sinueux d'Étapes (Winding Nodes) */}
            <div className="relative flex flex-col items-center py-2">
              {unit.nodes.map((node, nodeIdx) => {
                const globalIndex = unitIdx * 4 + nodeIdx;
                const horizontalOffset = HORIZONTAL_OFFSETS[globalIndex % HORIZONTAL_OFFSETS.length];
                const isCompleted = node.status === "completed";
                const isActive = node.status === "active";
                const isLocked = node.status === "locked";

                return (
                  <div
                    key={node.id}
                    className="relative my-3.5 flex flex-col items-center transition-transform duration-200"
                    style={{ transform: `translateX(${horizontalOffset}px)` }}
                  >
                    {/* Couronne rebondissante pour le niveau actuel actif */}
                    {isActive && (
                      <div className="absolute -top-10 flex flex-col items-center z-20 animate-duo-bounce pointer-events-none">
                        <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-black text-[11px] px-3 py-1 rounded-full shadow-lg border-2 border-white flex items-center gap-1">
                          <span>COMMENCER</span>
                          <span className="text-xs">⚡</span>
                        </div>
                        <div className="w-2.5 h-2.5 bg-amber-400 rotate-45 -mt-1 shadow-sm" />
                      </div>
                    )}

                    {/* Étoiles ⭐⭐⭐ pour les niveaux complétés */}
                    {isCompleted && (
                      <div className="flex items-center gap-0.5 mb-1.5 z-10 scale-90">
                        {Array.from({ length: 3 }).map((_, starIdx) => (
                          <Star
                            key={starIdx}
                            className={`w-4 h-4 drop-shadow-sm ${
                              starIdx < node.stars
                                ? "text-amber-400 fill-amber-400"
                                : "text-slate-300 fill-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Pastille circulaire 3D tactile */}
                    <button
                      type="button"
                      onClick={() => handleNodeClick(node, unit)}
                      disabled={isLocked}
                      className={`relative group w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-150 select-none ${
                        isCompleted
                          ? "bg-[#ffc800] border-b-[6px] border-[#e5a500] hover:bg-[#ffd21f] active:translate-y-1 active:border-b-2 shadow-md"
                          : isActive
                          ? `${themeStyles.btnActive} border-b-[6px] active:translate-y-1 active:border-b-2 shadow-xl animate-duo-pulse-glow`
                          : "bg-[#e5e5e5] border-b-[6px] border-[#afafaf] text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      {/* Icône intérieure */}
                      {isCompleted ? (
                        <Check className="w-8 h-8 sm:w-10 sm:h-10 text-amber-950 stroke-[3]" />
                      ) : isActive ? (
                        <div className="flex items-center justify-center text-2xl sm:text-3xl drop-shadow">
                          {node.isBoss ? "👑" : unit.badgeIcon}
                        </div>
                      ) : (
                        <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-slate-400" />
                      )}

                      {/* Effet reflet 3D supérieur */}
                      <span className="absolute top-1.5 left-3 right-3 h-2 rounded-full bg-white/25 pointer-events-none" />
                    </button>

                    {/* Titre discret sous la pastille */}
                    <span
                      className={`text-xs mt-2 font-black max-w-[130px] text-center tracking-tight truncate ${
                        isActive
                          ? "text-slate-900"
                          : isCompleted
                          ? "text-slate-700"
                          : "text-slate-400"
                      }`}
                    >
                      {node.title}
                    </span>

                    {/* 💬 Popover Tactile Duolingo (Speech Bubble) au clic sur un niveau */}
                    {selectedNode?.node.id === node.id && (
                      <div
                        className="absolute bottom-full mb-3 z-30 w-72 bg-white rounded-3xl p-4 shadow-2xl border-2 border-slate-200 text-left animate-fadeIn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-[11px] font-black uppercase text-emerald-600 tracking-wider">
                            Étape • {node.category}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedNode(null)}
                            className="text-slate-400 hover:text-slate-600 p-0.5"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <h4 className="text-base font-black text-slate-900 leading-snug">
                          {node.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5 mb-3">
                          {node.subtitle}
                        </p>

                        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl mb-3 border border-slate-200/80 text-xs font-bold">
                          <span className="flex items-center gap-1 text-emerald-700 font-extrabold">
                            <Sparkles className="w-4 h-4 text-emerald-500" />
                            +{node.xpReward} XP
                          </span>
                          <span className="flex items-center gap-1 text-sky-700 font-extrabold">
                            💎 +{node.gemReward} Gems
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStartLevel(node)}
                          className="w-full py-3 px-4 btn-duo btn-duo-green text-sm flex items-center justify-center gap-2"
                        >
                          <span>
                            {isCompleted ? "REJOUER L'ÉTAPE" : "COMMENCER"}
                          </span>
                          <ArrowRight className="w-4 h-4 stroke-[3]" />
                        </button>

                        {/* Flèche inférieure de bulle */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-3.5 h-3.5 bg-white border-r-2 border-b-2 border-slate-200 rotate-45" />
                      </div>
                    )}
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

      {/* 📖 Carnet de Connaissances de l'Unité */}
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

      {/* 🎉 Célébration d'Ouverture de Coffre */}
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
