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
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-8">
        <GeoDetectiveSummary gameState={gameState} onPlayAgain={handleRestart} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col pb-28 safe-area-bottom">
      {/* Top HUD Bar */}
      <header className="bg-white/95 border-b-2 border-slate-200 px-4 py-3 sticky top-0 z-30 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Back & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/games")}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
              title="Retour aux jeux"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xl">🛰️</span>
              <div>
                <h1 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                  Geo-Detective <span className="hidden sm:inline text-teal-600">• Satellite Mini</span>
                </h1>
                <p className="text-[10px] text-slate-500 font-bold">
                  GeoGuessr Satellite Gratuit & Accessible
                </p>
              </div>
            </div>
          </div>

          {/* Round Indicator & Score Gauge */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Round Pills */}
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono">
              <span className="text-slate-500 font-black uppercase hidden sm:inline">Manche</span>
              <span className="font-black text-teal-700">
                {currentRound.roundNumber} / {gameState.rounds.length}
              </span>
            </div>

            {/* Score */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border-2 border-slate-200 text-xs font-mono shadow-xs">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-black text-slate-900">
                {gameState.totalScore.toLocaleString()}
              </span>
              <span className="text-slate-400 hidden sm:inline">/ 25k</span>
            </div>

            {/* High Score */}
            {highScore > 0 && (
              <div className="hidden md:flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 text-xs font-mono text-amber-800">
                <span className="font-bold">Record :</span>
                <span className="font-black text-amber-700">{highScore.toLocaleString()}</span>
              </div>
            )}

            {/* Restart */}
            <button
              onClick={handleRestart}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
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
          <div className="mt-3 p-3.5 rounded-2xl bg-white border-2 border-slate-200 shadow-xs text-xs text-slate-600 space-y-1 font-medium">
            <p className="flex items-center gap-1.5 font-black text-slate-900">
              <span>🎯 Règle du jeu :</span>
            </p>
            <p>
              1. Zoomez et analysez les reliefs, canaux et monuments depuis l'orbite.
            </p>
            <p>
              2. Pointez sur la mini-carte pour placer votre repère (<code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600 font-bold">📍</code>).
            </p>
            <p>
              3. Plus votre tir est proche, plus vous vous approchez des <strong className="text-emerald-600">5 000 pts</strong> par manche !
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
