import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  RotateCcw,
  Zap,
  CheckCircle2,
  XCircle,
  Trophy,
  ChevronRight,
  Crosshair,
  Satellite,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  getRandomCityGuesserSession,
  calculateAltitudeScore,
  type MetropolisLocation,
  type CityGuesserRoundResult,
} from "../../../lib/cityGuesserData";
import { getSatelliteTileUrl } from "../../../lib/geoDetectiveData";
import {
  calculateGameReward,
  applyPlayerRewards,
  type RewardApplicationResult,
} from "../../../lib/rewardManager";
import { saveCityGuesserRecord } from "../../../lib/gameRecordsManager";
import {
  playCorrectSound,
  playIncorrectSound,
  playVictoryFanfare,
  playClickSound,
  triggerHaptic,
} from "../../../lib/soundManager";
import { triggerConfetti } from "../../common/Confetti";

const TOTAL_ROUNDS = 5;
const DESCENT_DURATION_SEC = 25; // 25 secondes pour la descente complète

export function CityGuesserGamePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sessionCities, setSessionCities] = useState<MetropolisLocation[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [roundResults, setRoundResults] = useState<CityGuesserRoundResult[]>([]);

  // Animation de descente
  const [altitudeProgress, setAltitudeProgress] = useState(1.0); // 1.0 = 25 000 km, 0.0 = sol
  const [isBuzzed, setIsBuzzed] = useState(false);
  const [buzzedAltitudeProgress, setBuzzedAltitudeProgress] = useState(1.0);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

  // Écran & état
  const [isRevealed, setIsRevealed] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [rewardResult, setRewardResult] = useState<RewardApplicationResult | null>(null);
  const [useTileFallback, setUseTileFallback] = useState(false);

  const startNewGame = useCallback(() => {
    const cities = getRandomCityGuesserSession(TOTAL_ROUNDS);
    setSessionCities(cities);
    setCurrentRoundIndex(0);
    setRoundResults([]);
    setIsGameOver(false);
    setRewardResult(null);
    setupRound(cities[0]);
  }, []);

  const setupRound = (city: MetropolisLocation) => {
    setAltitudeProgress(1.0);
    setIsBuzzed(false);
    setIsRevealed(false);
    setUseTileFallback(false);

    // Mélanger les 4 options (la bonne métropole + 3 distracteurs)
    const options = [city.name, ...city.distractors].sort(() => 0.5 - Math.random());
    setShuffledOptions(options);
  };

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  const currentCity = sessionCities[currentRoundIndex] || null;

  // Boucle de descente orbitale continue
  useEffect(() => {
    if (!currentCity || isBuzzed || isRevealed || isGameOver) return;

    const intervalMs = 100;
    const step = intervalMs / (DESCENT_DURATION_SEC * 1000);

    const interval = setInterval(() => {
      setAltitudeProgress((prev) => {
        const next = Math.max(0, prev - step);
        if (next <= 0) {
          // Si arrivée au sol sans buzzer, forcer le buzzer au sol
          clearInterval(interval);
          handleBuzz();
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [currentCity, isBuzzed, isRevealed, isGameOver]);

  // Déclenchement du Buzzer
  const handleBuzz = () => {
    if (isBuzzed || isRevealed) return;
    playClickSound();
    triggerHaptic("medium");
    setIsBuzzed(true);
    setBuzzedAltitudeProgress(altitudeProgress);
  };

  // Sélection d'une ville après avoir buzzé
  const handleSelectCity = (cityName: string) => {
    if (!currentCity || isRevealed) return;

    const isCorrect = cityName.toLowerCase() === currentCity.name.toLowerCase();
    const altitudeKm = Math.round(5 + buzzedAltitudeProgress * 24995);
    const score = isCorrect ? calculateAltitudeScore(buzzedAltitudeProgress) : 0;

    const roundData: CityGuesserRoundResult = {
      roundNumber: currentRoundIndex + 1,
      city: currentCity,
      buzzedAtAltitudeKm: altitudeKm,
      timeRemainingSec: Math.round(buzzedAltitudeProgress * DESCENT_DURATION_SEC),
      score,
      isCorrect,
      selectedCity: cityName,
    };

    setRoundResults((prev) => [...prev, roundData]);
    setIsRevealed(true);

    if (isCorrect) {
      if (score >= 4000) {
        playCorrectSound();
        triggerConfetti();
      } else {
        playCorrectSound();
      }
    } else {
      playIncorrectSound();
    }
  };

  // Passer à la manche suivante ou terminer
  const handleNextRound = () => {
    if (currentRoundIndex + 1 < sessionCities.length) {
      const nextIndex = currentRoundIndex + 1;
      setCurrentRoundIndex(nextIndex);
      setupRound(sessionCities[nextIndex]);
    } else {
      // Clôture
      setIsGameOver(true);
      playVictoryFanfare();
      triggerConfetti();

      const totalScore = roundResults.reduce((sum, r) => sum + r.score, 0);
      const bestAltitude = Math.max(...roundResults.map((r) => (r.isCorrect ? r.buzzedAtAltitudeKm : 0)), 0);

      saveCityGuesserRecord(totalScore, bestAltitude);

      const reward = calculateGameReward("city-guesser", { score: totalScore });
      applyPlayerRewards(user?.id, reward, "city-guesser", 0, totalScore).then((res) => {
        setRewardResult(res);
      });
    }
  };

  if (!currentCity) return null;

  const currentCumulativeScore = roundResults.reduce((sum, r) => sum + r.score, 0);
  const currentAltitudeKm = Math.round(5 + altitudeProgress * 24995);
  const currentPotentialPoints = calculateAltitudeScore(altitudeProgress);

  // Choix de l'image selon la tranche d'altitude
  let currentImageUrl = currentCity.lowOrbitUrl;
  let zoomStageText = "Très basse altitude (Vue Urbaine HD)";
  let zoomLevel = 15;

  if (altitudeProgress > 0.66) {
    currentImageUrl = currentCity.highOrbitUrl;
    zoomStageText = "Orbite Haute (Vue Continentale)";
    zoomLevel = 6;
  } else if (altitudeProgress > 0.33) {
    currentImageUrl = currentCity.mediumOrbitUrl;
    zoomStageText = "Moyenne Altitude (Vue Régionale)";
    zoomLevel = 10;
  }

  // Fallback satellite Esri direct si l'image principale ne charge pas
  const finalDisplaySrc = useTileFallback
    ? getSatelliteTileUrl(currentCity.lat, currentCity.lng, zoomLevel)
    : currentImageUrl;

  const lastRound = roundResults[roundResults.length - 1];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-white pb-10">
      {/* Top Bar Navigation & Stats */}
      <header className="max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/games")}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm font-black border border-slate-800 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Quitter</span>
          </button>

          {/* Titre & Manche */}
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-black uppercase tracking-wider border border-cyan-400/30">
              <Satellite className="w-3 h-3 text-cyan-400" />
              <span>City Guesser • Zoom-In {currentRoundIndex + 1}/{TOTAL_ROUNDS}</span>
            </div>
            <h1 className="text-base sm:text-xl font-black text-white truncate max-w-xs sm:max-w-md mt-0.5">
              Identifiez la Métropole !
            </h1>
          </div>

          {/* Score Actuel */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-xs sm:text-sm font-black text-emerald-400 shadow-sm">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>{currentCumulativeScore.toLocaleString()} pts</span>
          </div>
        </div>
      </header>

      {/* Main Game Stage */}
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 my-auto pt-4 flex-1 flex flex-col items-center">
        {!isRevealed ? (
          <div className="w-full flex flex-col items-center gap-5">
            {/* Viewport Satellite avec HUD Altimétrique */}
            <div className="relative w-full max-w-3xl rounded-3xl overflow-hidden bg-black border-4 border-slate-800 shadow-2xl h-[340px] sm:h-[440px] group">
              <img
                src={finalDisplaySrc}
                alt="Vue satellite zoom-in"
                onError={() => setUseTileFallback(true)}
                className="w-full h-full object-cover transition-transform duration-700 ease-out"
                style={{
                  transform: `scale(${1 + (1 - altitudeProgress) * 0.35})`,
                }}
              />

              {/* Réticule de visée central orbital */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border border-cyan-400/40 border-dashed animate-spin-slow flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-cyan-400/60" />
                </div>
              </div>

              {/* HUD Supérieur : Altimètre & Points Dynamiques */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3 pointer-events-none">
                {/* Altitude */}
                <div className="bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-cyan-400/40 text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 block">
                    Altimètre
                  </span>
                  <span className="text-sm sm:text-base font-black text-white font-mono">
                    {currentAltitudeKm.toLocaleString()} km
                  </span>
                </div>

                {/* Potentiel de Points */}
                <div className="bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-amber-400/40 text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                    Gain Potentiel
                  </span>
                  <span className="text-sm sm:text-base font-black text-amber-400 font-mono">
                    +{currentPotentialPoints} pts
                  </span>
                </div>
              </div>

              {/* Jauge Verticale d'Altitude (Barre latérale droite) */}
              <div className="absolute right-4 top-20 bottom-16 w-3 bg-black/60 backdrop-blur-md rounded-full border border-white/20 p-0.5 overflow-hidden flex flex-col justify-end pointer-events-none">
                <div
                  className="w-full bg-gradient-to-t from-cyan-400 via-sky-400 to-indigo-500 rounded-full transition-all duration-200"
                  style={{ height: `${Math.round(altitudeProgress * 100)}%` }}
                />
              </div>

              {/* Badge d'étape de zoom inférieur */}
              <div className="absolute bottom-4 left-4 pointer-events-none">
                <span className="text-[11px] font-black text-slate-200 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-700">
                  🛰️ {zoomStageText}
                </span>
              </div>
            </div>

            {/* Zone d'Action : Buzzer ou Choix Multiples */}
            <div className="w-full max-w-xl">
              {!isBuzzed ? (
                <button
                  type="button"
                  onClick={handleBuzz}
                  className="w-full py-5 px-8 rounded-3xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-lg sm:text-xl uppercase tracking-wider shadow-2xl shadow-cyan-500/30 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer border-4 border-cyan-300 border-b-8 border-b-cyan-700 animate-pulse"
                >
                  <Zap className="w-6 h-6 fill-slate-950 text-slate-950" />
                  <span>BUZZER ! J'AI IDENTIFIÉ LA VILLE ⚡</span>
                </button>
              ) : (
                <div className="bg-slate-900/90 rounded-3xl p-5 border-2 border-cyan-400 shadow-xl text-center animate-fade-in">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black uppercase mb-3 border border-cyan-400/30">
                    <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Descente figée à {Math.round(5 + buzzedAltitudeProgress * 24995)} km !</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-white mb-3">
                    Quelle est cette métropole mondiale ?
                  </h3>

                  <div className="grid grid-cols-2 gap-2.5">
                    {shuffledOptions.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectCity(opt)}
                        className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-cyan-500/20 hover:border-cyan-400 text-white font-black text-sm border-2 border-slate-700 shadow-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Révélation de la manche */
          <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border-2 border-slate-800 shadow-2xl max-w-xl mx-auto w-full text-center animate-fade-in">
            {lastRound && (
              <div>
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center mx-auto mb-3 text-3xl shadow-lg">
                  {lastRound.city.flagEmoji}
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-800 text-cyan-300 text-xs font-black uppercase mb-1">
                  <span>{lastRound.city.continent} • {lastRound.city.country}</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white">
                  {lastRound.city.name}
                </h2>

                {/* Résultat Manche */}
                <div className="my-5 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {lastRound.isCorrect ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span className="text-emerald-400 font-black text-sm uppercase">
                          Bonne Réponse !
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-400" />
                        <span className="text-rose-400 font-black text-sm uppercase">
                          Mauvaise Réponse (Vous avez choisi : {lastRound.selectedCity})
                        </span>
                      </>
                    )}
                  </div>

                  <span className="text-3xl font-black text-amber-400 font-mono">
                    +{lastRound.score} pts
                  </span>
                  <p className="text-xs text-slate-400 mt-1">
                    Buzzé à {lastRound.buzzedAtAltitudeKm.toLocaleString()} km d'altitude
                  </p>
                </div>

                {/* Anecdote vue du ciel */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed mb-6 text-left">
                  <span className="font-black text-cyan-300 block mb-1">
                    Reconnaissable depuis l'orbite :
                  </span>
                  {lastRound.city.landmarkFact}
                </div>

                {/* Bouton Manche Suivante */}
                <button
                  type="button"
                  onClick={handleNextRound}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border-2 border-cyan-300 border-b-4 border-b-cyan-700"
                >
                  <span>
                    {currentRoundIndex + 1 < sessionCities.length
                      ? "Manche Suivante"
                      : "Voir les Résultats Finaux"}
                  </span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal Fin de Jeu Récapitulative */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-cyan-500 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-center relative overflow-hidden">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center mx-auto mb-4 text-4xl shadow-xl border-2 border-white/20 animate-bounce">
              🛰️
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Mission Orbitale Complétée !
            </h2>

            <p className="text-cyan-400 text-sm font-bold mt-1">
              Score Final : {currentCumulativeScore.toLocaleString()} / 25 000 pts
            </p>

            {/* Récompenses XP et Gems */}
            {rewardResult && (
              <div className="bg-cyan-950/40 border border-cyan-500/40 rounded-2xl p-4 my-5">
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
                onClick={startNewGame}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border-2 border-cyan-300 border-b-4 border-b-cyan-700"
              >
                <RotateCcw className="w-4 h-4 stroke-[3]" />
                <span>Nouvelle Session Orbitale</span>
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
