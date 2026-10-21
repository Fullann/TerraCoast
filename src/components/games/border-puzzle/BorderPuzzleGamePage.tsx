import { useState, useEffect, useRef, useCallback, type PointerEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Lightbulb,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Puzzle,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  BORDER_PUZZLE_CLUSTERS,
  prepareBorderPuzzle,
  getRandomPuzzleCluster,
  type PreparedBorderPuzzle,
  type PuzzlePieceCountry,
} from "../../../lib/borderPuzzleData";
import {
  calculateGameReward,
  applyPlayerRewards,
  type RewardApplicationResult,
} from "../../../lib/rewardManager";
import { saveBorderPuzzleRecord } from "../../../lib/gameRecordsManager";
import {
  playCorrectSound,
  playIncorrectSound,
  playVictoryFanfare,
  playClickSound,
  triggerHaptic,
} from "../../../lib/soundManager";
import { triggerConfetti } from "../../common/Confetti";
import { toast } from "../../common/ToastContainer";

export function BorderPuzzleGamePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentClusterId, setCurrentClusterId] = useState<string>(() => {
    return BORDER_PUZZLE_CLUSTERS[0].id;
  });

  const [puzzle, setPuzzle] = useState<PreparedBorderPuzzle | null>(null);
  const [placedIso3s, setPlacedIso3s] = useState<Set<string>>(new Set());
  const [selectedPieceIso3, setSelectedPieceIso3] = useState<string | null>(null);

  // Chronomètre & stats
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintActiveIso3, setHintActiveIso3] = useState<string | null>(null);

  // Fin de partie & récompenses
  const [isCompleted, setIsCompleted] = useState(false);
  const [rewardResult, setRewardResult] = useState<RewardApplicationResult | null>(null);

  // Drag & drop tactile
  const [draggingIso3, setDraggingIso3] = useState<string | null>(null);
  const boardSvgRef = useRef<SVGSVGElement | null>(null);

  // Initialisation du cluster
  useEffect(() => {
    const prepared = prepareBorderPuzzle(currentClusterId, 640, 440);
    setPuzzle(prepared);
    setPlacedIso3s(new Set());
    setSelectedPieceIso3(null);
    setTimerSeconds(0);
    setIsTimerRunning(true);
    setIsCompleted(false);
    setRewardResult(null);
    setHintActiveIso3(null);
  }, [currentClusterId]);

  // Timer
  useEffect(() => {
    if (!isTimerRunning || isCompleted) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, isCompleted]);

  // Vérification de victoire
  const handlePieceSnapped = useCallback(
    async (iso3: string) => {
      if (!puzzle) return;
      playCorrectSound();
      triggerHaptic("success");

      setPlacedIso3s((prev) => {
        const next = new Set(prev);
        next.add(iso3.toUpperCase());

        // Si toutes les pièces sont posées
        if (next.size === puzzle.pieces.length && !isCompleted) {
          setIsCompleted(true);
          setIsTimerRunning(false);
          triggerConfetti();
          playVictoryFanfare();

          const timeSec = timerSeconds;
          saveBorderPuzzleRecord(timeSec);

          // Calcul efficacité (sans indice = 100%, chaque indice -15%)
          const efficiency = Math.max(50, 100 - hintsUsed * 15);
          const reward = calculateGameReward("border-puzzle", { score: efficiency });

          applyPlayerRewards(user?.id, reward, "border-puzzle", 0, efficiency).then(
            (res) => {
              setRewardResult(res);
            }
          );
        }

        return next;
      });

      setSelectedPieceIso3(null);
      setHintActiveIso3(null);
    },
    [puzzle, isCompleted, timerSeconds, hintsUsed, user?.id]
  );

  // Clic direct pour placer la pièce sélectionnée
  const handleSlotClick = (piece: PuzzlePieceCountry) => {
    if (placedIso3s.has(piece.iso3)) return;

    if (selectedPieceIso3 === piece.iso3) {
      handlePieceSnapped(piece.iso3);
    } else {
      // Si l'utilisateur clique sur le slot, sélectionner cette pièce
      setSelectedPieceIso3(piece.iso3);
      playClickSound();
    }
  };

  // Clic sur une pièce dans le rack
  const handlePieceSelect = (piece: PuzzlePieceCountry) => {
    if (placedIso3s.has(piece.iso3)) return;
    playClickSound();
    if (selectedPieceIso3 === piece.iso3) {
      setSelectedPieceIso3(null);
    } else {
      setSelectedPieceIso3(piece.iso3);
    }
  };

  // Drag & drop tactile / souris
  const handlePointerDown = (e: PointerEvent, iso3: string) => {
    if (placedIso3s.has(iso3)) return;
    setDraggingIso3(iso3);
    setSelectedPieceIso3(iso3);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (!draggingIso3 || !puzzle) return;

    const piece = puzzle.pieces.find((p) => p.iso3 === draggingIso3);
    if (piece && boardSvgRef.current) {
      const rect = boardSvgRef.current.getBoundingClientRect();
      const isInsideBoard =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (isInsideBoard) {
        // Calcul des coordonnées relatives dans le viewBox
        const scaleX = puzzle.width / rect.width;
        const scaleY = puzzle.height / rect.height;
        const clickSvgX = (e.clientX - rect.left) * scaleX;
        const clickSvgY = (e.clientY - rect.top) * scaleY;

        const dist = Math.hypot(clickSvgX - piece.centroid[0], clickSvgY - piece.centroid[1]);
        // Si lâché dans un rayon raisonnable du pays cible (ou n'importe où sur son polygone)
        if (dist <= 90) {
          handlePieceSnapped(piece.iso3);
        } else {
          // Mauvais emplacement
          playIncorrectSound();
          toast.info(`Ce n'est pas l'emplacement de ${piece.name} !`);
        }
      }
    }

    setDraggingIso3(null);
  };

  const handleUseHint = () => {
    if (!puzzle) return;
    const remaining = puzzle.pieces.filter((p) => !placedIso3s.has(p.iso3));
    if (remaining.length === 0) return;

    const nextHintPiece = remaining[0];
    setHintActiveIso3(nextHintPiece.iso3);
    setSelectedPieceIso3(nextHintPiece.iso3);
    setHintsUsed((h) => h + 1);
    playClickSound();
    toast.success(`Indice : Placez ${nextHintPiece.name} (${nextHintPiece.capital}) !`);
  };

  const handleNextCluster = () => {
    const nextCluster = getRandomPuzzleCluster(currentClusterId);
    setCurrentClusterId(nextCluster.id);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (!puzzle) return null;

  const totalPieces = puzzle.pieces.length;
  const placedCount = placedIso3s.size;
  const progressPercent = Math.round((placedCount / totalPieces) * 100);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white pb-12">
      {/* Top Bar Navigation & Stats */}
      <header className="max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/games")}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-black border border-slate-700 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Quitter</span>
          </button>

          {/* Titre & Continent */}
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-black uppercase tracking-wider border border-emerald-400/30">
              <Puzzle className="w-3 h-3 text-emerald-400" />
              <span>Tangram Frontalier • {puzzle.cluster.continent}</span>
            </div>
            <h1 className="text-base sm:text-xl font-black text-white truncate max-w-xs sm:max-w-md mt-0.5">
              {puzzle.cluster.name}
            </h1>
          </div>

          {/* Timer & Indice */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-800 border border-slate-700 font-mono text-xs sm:text-sm font-bold text-amber-300">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{formatTimer(timerSeconds)}</span>
            </div>

            <button
              type="button"
              onClick={handleUseHint}
              disabled={isCompleted}
              className="p-2 sm:px-3 sm:py-1.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
              title="Indice de placement"
            >
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Indice</span>
            </button>
          </div>
        </div>

        {/* Barre de Progression Duolingo */}
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2.5 flex-1 bg-slate-800 rounded-full overflow-hidden border border-slate-700/80">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-black text-emerald-400 font-mono shrink-0">
            {placedCount}/{totalPieces} pays
          </span>
        </div>
      </header>

      {/* Main Game Stage */}
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 my-auto pt-4 flex flex-col items-center">
        {/* Le Plateau de Puzzle SVG */}
        <div className="relative w-full max-w-2xl bg-slate-950/70 rounded-3xl p-3 sm:p-5 border-2 border-slate-800 shadow-2xl backdrop-blur-md overflow-hidden">
          {/* Grille d'arrière-plan cartographique */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />

          <svg
            ref={boardSvgRef}
            viewBox={puzzle.viewBox}
            className="w-full h-auto max-h-[380px] sm:max-h-[420px] select-none touch-none filter drop-shadow-md"
            onPointerUp={handlePointerUp}
          >
            {/* 1. Contour combiné d'arrière-plan de la grappe */}
            <path
              d={puzzle.combinedOutlineD}
              fill="#1e293b"
              stroke="#475569"
              strokeWidth="2.5"
              strokeDasharray="4 4"
              className="transition-all"
            />

            {/* 2. Emplacements de chaque pays */}
            {puzzle.pieces.map((piece) => {
              const isPlaced = placedIso3s.has(piece.iso3);
              const isSelected = selectedPieceIso3 === piece.iso3;
              const isHinted = hintActiveIso3 === piece.iso3;

              return (
                <g key={piece.iso3} className="cursor-pointer">
                  {/* Pièce posée vs emplacement vide */}
                  <path
                    d={piece.pathD}
                    fill={
                      isPlaced
                        ? piece.color
                        : isSelected
                        ? "#0284c7"
                        : isHinted
                        ? "#d97706"
                        : "#334155"
                    }
                    fillOpacity={isPlaced ? 0.95 : isSelected || isHinted ? 0.75 : 0.35}
                    stroke={
                      isPlaced
                        ? "#ffffff"
                        : isSelected
                        ? "#38bdf8"
                        : isHinted
                        ? "#fbbf24"
                        : "#64748b"
                    }
                    strokeWidth={isPlaced ? 2.5 : isSelected || isHinted ? 3 : 1.5}
                    strokeDasharray={isPlaced ? undefined : "3 3"}
                    className={`transition-all duration-300 ${
                      !isPlaced ? "hover:fill-opacity-50 hover:stroke-slate-300" : ""
                    } ${isHinted && !isPlaced ? "animate-pulse" : ""}`}
                    onClick={() => handleSlotClick(piece)}
                  />

                  {/* Label du pays une fois posé */}
                  {isPlaced ? (
                    <g
                      transform={`translate(${piece.centroid[0]}, ${piece.centroid[1]})`}
                      className="pointer-events-none"
                    >
                      <circle
                        r="14"
                        fill="#0f172a"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        className="shadow-sm"
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="14"
                        className="select-none"
                      >
                        {piece.flagEmoji}
                      </text>
                      <text
                        y="20"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="900"
                        className="filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] select-none uppercase tracking-wide"
                      >
                        {piece.name}
                      </text>
                    </g>
                  ) : isSelected || isHinted ? (
                    <g
                      transform={`translate(${piece.centroid[0]}, ${piece.centroid[1]})`}
                      className="pointer-events-none"
                    >
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="900"
                        className="filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] select-none"
                      >
                        {isSelected ? "✦ Cliquez pour poser ✦" : "✦ Emplacement ✦"}
                      </text>
                    </g>
                  ) : null}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Le Rack des Pièces Détachées */}
        <div className="w-full max-w-2xl mt-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Pièces Détachées à Assembler ({totalPieces - placedCount} restantes) :
            </span>
            <span className="text-[11px] text-slate-500 italic hidden sm:inline">
              Glissez la pièce ou touchez pour sélectionner
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {puzzle.pieces.map((piece) => {
              const isPlaced = placedIso3s.has(piece.iso3);
              const isSelected = selectedPieceIso3 === piece.iso3;
              const isHinted = hintActiveIso3 === piece.iso3;

              return (
                <div
                  key={piece.iso3}
                  onClick={() => handlePieceSelect(piece)}
                  onPointerDown={(e) => handlePointerDown(e, piece.iso3)}
                  className={`relative p-3 rounded-2xl border-2 transition-all flex flex-col justify-between cursor-pointer select-none ${
                    isPlaced
                      ? "bg-slate-900/40 border-slate-800 opacity-40 cursor-default"
                      : isSelected
                      ? "bg-sky-500/20 border-sky-400 ring-2 ring-sky-400/40 shadow-lg scale-102"
                      : isHinted
                      ? "bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40 animate-pulse"
                      : "bg-slate-800/90 border-slate-700 hover:border-slate-500 hover:bg-slate-800 active:scale-98 shadow-sm"
                  }`}
                >
                  {/* Badge Statut */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-2xl filter drop-shadow">{piece.flagEmoji}</span>
                    {isPlaced ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Posé</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase text-slate-400 font-mono">
                        {piece.iso3}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="block font-black text-xs sm:text-sm text-white truncate">
                      {piece.name}
                    </span>
                    <span className="block text-[11px] text-slate-400 truncate mt-0.5">
                      Cap. {piece.capital}
                    </span>
                  </div>

                  {!isPlaced && (
                    <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <span>{isSelected ? "Sélectionné ✓" : "Toucher pour poser"}</span>
                      <ChevronRight className="w-3 h-3 text-slate-500" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer Info & Anecdote */}
      <footer className="max-w-5xl w-full mx-auto px-4 sm:px-6 pt-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="truncate max-w-xl">{puzzle.cluster.funFact}</span>
        </div>
      </footer>

      {/* Modal Victoire & Récompenses */}
      {isCompleted && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-4 text-4xl shadow-xl border-2 border-white/20 animate-bounce">
              🧩
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Tangram Résolu !
            </h2>

            <p className="text-emerald-400 text-sm font-bold mt-1">
              {puzzle.cluster.name} est parfaitement assemblé !
            </p>

            {/* Statistiques */}
            <div className="grid grid-cols-2 gap-3 my-5">
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                  Temps
                </span>
                <span className="text-xl font-black text-white font-mono">
                  {formatTimer(timerSeconds)}
                </span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                  Indices Utilisés
                </span>
                <span className="text-xl font-black text-amber-300 font-mono">
                  {hintsUsed}
                </span>
              </div>
            </div>

            {/* Récompenses XP et Gems */}
            {rewardResult && (
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 mb-6">
                <div className="flex items-center justify-around">
                  <div>
                    <span className="text-2xl font-black text-emerald-400">
                      +{rewardResult.totalXp} XP
                    </span>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {rewardResult.streakMultiplier > 1
                        ? `Streak +${Math.round((rewardResult.streakMultiplier - 1) * 100)}%`
                        : "Progression"}
                    </span>
                  </div>
                  <div className="h-8 w-px bg-slate-700" />
                  <div>
                    <span className="text-2xl font-black text-amber-300">
                      +{rewardResult.gems} 💎
                    </span>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      TerraGems
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Boutons d'Action */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleNextCluster}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer border-2 border-emerald-400/50 border-b-4 border-b-emerald-700"
              >
                <span>Région Suivante</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/games")}
                className="w-full py-3 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer border border-slate-700"
              >
                Retour à l'Arcade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
