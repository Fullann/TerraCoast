import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import {
  startNewGeoDetectiveGame,
  evaluateGuess,
  saveGeoDetectiveHighScore,
  getGeoDetectiveHighScore,
} from "../../../lib/geoDetectiveGame";
import { SatelliteViewer } from "./SatelliteViewer";
import { MiniPinMap } from "./MiniPinMap";
import { RoundResultModal } from "./RoundResultModal";
import { GeoDetectiveSummary } from "./GeoDetectiveSummary";
import { triggerConfetti } from "../../common/Confetti";

export function GeoDetectiveGamePage() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState(() => startNewGeoDetectiveGame("all", 5));
  const [isResultPhase, setIsResultPhase] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  const currentRound = gameState.rounds[gameState.currentRoundIndex];
  const isGameOver = gameState.isGameOver;
  const highScore = getGeoDetectiveHighScore();

  // Reset or play again
  const handleRestart = useCallback(() => {
    setGameState(startNewGeoDetectiveGame("all", 5));
    setIsResultPhase(false);
    setShowResultModal(false);
  }, []);

  // Débloquer l'indice
  const handleUseClue = useCallback(() => {
    if (isResultPhase || currentRound.usedClue) return;

    setGameState((prev) => {
      const updatedRounds = [...prev.rounds];
      updatedRounds[prev.currentRoundIndex] = {
        ...updatedRounds[prev.currentRoundIndex],
        usedClue: true,
      };
      return {
        ...prev,
        rounds: updatedRounds,
      };
    });
  }, [isResultPhase, currentRound]);

  // Validation du repère par le joueur
  const handleConfirmGuess = useCallback(
    (lat: number, lng: number) => {
      if (isResultPhase || isGameOver) return;

      const guess = evaluateGuess(
        currentRound.location,
        lat,
        lng,
        currentRound.usedClue
      );

      // Si tir excellent (>= 4500 pts), déclencher confettis
      if (guess.score >= 4500) {
        triggerConfetti();
      }

      setGameState((prev) => {
        const updatedRounds = [...prev.rounds];
        updatedRounds[prev.currentRoundIndex] = {
          ...updatedRounds[prev.currentRoundIndex],
          guess,
        };
        const newTotal = prev.totalScore + guess.score;
        return {
          ...prev,
          rounds: updatedRounds,
          totalScore: newTotal,
        };
      });

      setIsResultPhase(true);
      setShowResultModal(true);
    },
    [currentRound, isResultPhase, isGameOver]
  );

  // Passer à la manche suivante ou terminer
  const handleNextRound = useCallback(() => {
    setShowResultModal(false);

    if (gameState.currentRoundIndex >= gameState.rounds.length - 1) {
      // Fin de la partie
      saveGeoDetectiveHighScore(gameState.totalScore);
      setGameState((prev) => ({
        ...prev,
        isGameOver: true,
      }));
      setIsResultPhase(false);
    } else {
      // Manche suivante
      setGameState((prev) => ({
        ...prev,
        currentRoundIndex: prev.currentRoundIndex + 1,
      }));
      setIsResultPhase(false);
    }
  }, [gameState]);

  if (isGameOver) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col justify-center py-8">
        <GeoDetectiveSummary gameState={gameState} onPlayAgain={handleRestart} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col">
      {/* Top HUD Bar */}
      <header className="bg-slate-950/90 border-b border-slate-800/80 px-4 py-3 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Back & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/games")}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Retour aux jeux"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xl">🛰️</span>
              <div>
                <h1 className="text-sm sm:text-base font-black text-white leading-tight">
                  Geo-Detective <span className="hidden sm:inline text-emerald-400">• Satellite Mini</span>
                </h1>
                <p className="text-[10px] text-slate-400">
                  GeoGuessr Satellite Gratuit & Accessible
                </p>
              </div>
            </div>
          </div>

          {/* Round Indicator & Score Gauge */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Round Pills */}
            <div className="flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
              <span className="text-slate-400 font-bold uppercase hidden sm:inline">Manche</span>
              <span className="font-black text-emerald-400">
                {currentRound.roundNumber} / {gameState.rounds.length}
              </span>
            </div>

            {/* Score */}
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span className="font-black text-white">
                {gameState.totalScore.toLocaleString()}
              </span>
              <span className="text-slate-500 hidden sm:inline">/ 25k</span>
            </div>

            {/* High Score */}
            {highScore > 0 && (
              <div className="hidden md:flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-400">
                <span>Record :</span>
                <span className="font-bold text-amber-400">{highScore.toLocaleString()}</span>
              </div>
            )}

            {/* Restart */}
            <button
              onClick={handleRestart}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Recommencer la mission"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Game Arena */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col lg:flex-row gap-4 relative">
        {/* Left / Main Stage : Satellite Viewer */}
        <div className="flex-1 flex flex-col min-h-0">
          <SatelliteViewer
            location={currentRound.location}
            usedClue={currentRound.usedClue}
            onUseClue={handleUseClue}
            isResultPhase={isResultPhase}
          />
        </div>

        {/* Right / Floating Mini Map */}
        <div className="w-full lg:w-[380px] xl:w-[420px] flex flex-col shrink-0">
          <MiniPinMap
            onConfirmGuess={handleConfirmGuess}
            targetCoords={
              isResultPhase
                ? { lat: currentRound.location.lat, lng: currentRound.location.lng }
                : null
            }
            guessCoords={
              currentRound.guess
                ? {
                    lat: currentRound.guess.guessedLat,
                    lng: currentRound.guess.guessedLng,
                  }
                : null
            }
            isResultPhase={isResultPhase}
          />

          {/* Quick instructions / tips */}
          <div className="mt-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 space-y-1">
            <p className="flex items-center gap-1.5 font-bold text-slate-300">
              <span>🎯 Règle du jeu :</span>
            </p>
            <p>
              1. Zoomez et analysez les reliefs, canaux et monuments depuis l'orbite.
            </p>
            <p>
              2. Pointez sur la mini-carte pour placer votre repère (`📍`).
            </p>
            <p>
              3. Plus votre tir est proche, plus vous vous approchez des <strong>5 000 pts</strong> par manche !
            </p>
          </div>
        </div>
      </main>

      {/* Modal de Résultat de Manche */}
      {currentRound.guess && (
        <RoundResultModal
          isOpen={showResultModal}
          roundNumber={currentRound.roundNumber}
          totalRounds={gameState.rounds.length}
          location={currentRound.location}
          guess={currentRound.guess}
          onNextRound={handleNextRound}
          onCloseInspect={() => setShowResultModal(false)}
        />
      )}
    </div>
  );
}
