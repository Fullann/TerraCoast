import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  RotateCcw,
  Maximize2,
  Minimize2,
  Lightbulb,
  CheckCircle2,
  Trophy,
  History,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  getRandomTimeGuessrSession,
  calculateHaversineDistanceKm,
  calculateSpatialScore,
  calculateTemporalScore,
  type HistoricalArchiveItem,
  type TimeGuessrRoundResult,
} from "../../../lib/timeGuessrData";
import {
  calculateGameReward,
  applyPlayerRewards,
  type RewardApplicationResult,
} from "../../../lib/rewardManager";
import { saveTimeGuessrRecord } from "../../../lib/gameRecordsManager";
import {
  playCorrectSound,
  playIncorrectSound,
  playVictoryFanfare,
  playClickSound,
  triggerHaptic,
} from "../../../lib/soundManager";
import { triggerConfetti } from "../../common/Confetti";
import { toast } from "../../common/ToastContainer";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  ZoomableGroup,
} from "react-simple-maps";
import worldMapData from "world-atlas/countries-110m.json";

export function TimeGuessrGamePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sessionItems, setSessionItems] = useState<HistoricalArchiveItem[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [roundResults, setRoundResults] = useState<TimeGuessrRoundResult[]>([]);

  // Inputs du joueur
  const [selectedYear, setSelectedYear] = useState<number>(1950);
  const [guessedPin, setGuessedPin] = useState<{ lat: number; lng: number } | null>(null);
  const [usedClue, setUsedClue] = useState(false);
  const [isFullscreenPhoto, setIsFullscreenPhoto] = useState(false);

  // État de la manche courante
  const [isRevealed, setIsRevealed] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [rewardResult, setRewardResult] = useState<RewardApplicationResult | null>(null);

  // Initialisation de la session de 5 photos
  const startNewGame = () => {
    const items = getRandomTimeGuessrSession(5);
    setSessionItems(items);
    setCurrentRoundIndex(0);
    setRoundResults([]);
    setSelectedYear(1950);
    setGuessedPin(null);
    setUsedClue(false);
    setIsRevealed(false);
    setIsGameOver(false);
    setRewardResult(null);
  };

  useEffect(() => {
    startNewGame();
  }, []);

  const currentItem = sessionItems[currentRoundIndex] || null;

  // Clic sur la carte mondiale
  const handleMapClick = (e: any) => {
    if (isRevealed) return;
    // Si la cible ou l'événement fournit des coordonnées géographiques
    const coords = e.coordinates;
    if (coords && Array.isArray(coords)) {
      playClickSound();
      triggerHaptic("light");
      setGuessedPin({ lng: coords[0], lat: coords[1] });
    }
  };

  // Ajustements fins de l'année
  const adjustYear = (delta: number) => {
    if (isRevealed) return;
    playClickSound();
    setSelectedYear((prev) => Math.min(2024, Math.max(1850, prev + delta)));
  };

  // Validation de la manche
  const handleValidateGuess = () => {
    if (!currentItem || !guessedPin) {
      toast.info("Veuillez d'abord placer votre repère sur la carte !");
      return;
    }

    playClickSound();
    triggerHaptic("medium");

    const distanceKm = calculateHaversineDistanceKm(
      guessedPin.lat,
      guessedPin.lng,
      currentItem.lat,
      currentItem.lng
    );

    const yearDelta = Math.abs(selectedYear - currentItem.year);
    const geoScore = calculateSpatialScore(distanceKm);
    const timeScore = calculateTemporalScore(yearDelta);
    const totalRoundScore = geoScore + timeScore;

    const roundData: TimeGuessrRoundResult = {
      roundNumber: currentRoundIndex + 1,
      item: currentItem,
      guessedYear: selectedYear,
      yearDelta,
      timeScore,
      guessedLat: guessedPin.lat,
      guessedLng: guessedPin.lng,
      distanceKm,
      geoScore,
      totalRoundScore,
    };

    setRoundResults((prev) => [...prev, roundData]);
    setIsRevealed(true);

    if (totalRoundScore >= 4000) {
      playCorrectSound();
      triggerConfetti();
    } else if (totalRoundScore >= 2000) {
      playCorrectSound();
    } else {
      playIncorrectSound();
    }
  };

  // Passer à la manche suivante ou clôturer
  const handleNextRound = () => {
    if (currentRoundIndex + 1 < sessionItems.length) {
      setCurrentRoundIndex((prev) => prev + 1);
      setSelectedYear(1950);
      setGuessedPin(null);
      setUsedClue(false);
      setIsRevealed(false);
    } else {
      // Clôture du jeu
      setIsGameOver(true);
      playVictoryFanfare();
      triggerConfetti();

      const totalScore = roundResults.reduce((sum, r) => sum + r.totalRoundScore, 0);
      const accuracy = Math.round((totalScore / 25000) * 100);

      saveTimeGuessrRecord(totalScore, accuracy);

      const reward = calculateGameReward("time-guessr", { score: totalScore });
      applyPlayerRewards(user?.id, reward, "time-guessr", 0, totalScore).then((res) => {
        setRewardResult(res);
      });
    }
  };

  if (!currentItem) return null;

  const currentCumulativeScore = roundResults.reduce(
    (sum, r) => sum + r.totalRoundScore,
    0
  );

  const lastRound = roundResults[roundResults.length - 1];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-white pb-10">
      {/* Top Bar Navigation & Stats */}
      <header className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/games")}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm font-black border border-slate-800 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Quitter</span>
          </button>

          {/* Titre & Manche */}
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-black uppercase tracking-wider border border-amber-400/30">
              <History className="w-3 h-3 text-amber-400" />
              <span>TimeGuessr Géo-Historique • Manche {currentRoundIndex + 1}/5</span>
            </div>
            <h1 className="text-base sm:text-xl font-black text-white truncate max-w-xs sm:max-w-md mt-0.5">
              Où & Quand ?
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
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 my-auto pt-4 flex-1 flex flex-col">
        {!isRevealed ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-stretch">
            {/* Colonne Gauche : Photo d'Archive */}
            <div className="lg:col-span-6 flex flex-col justify-between bg-slate-900/90 rounded-3xl p-4 sm:p-5 border-2 border-slate-800 shadow-xl backdrop-blur-md relative overflow-hidden">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Document d'Archive Mystère</span>
                </span>

                <div className="flex items-center gap-2">
                  {!usedClue && (
                    <button
                      type="button"
                      onClick={() => {
                        setUsedClue(true);
                        playClickSound();
                        toast.info(`Indice : ${currentItem.clues[0]}`);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      <span>Indice</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsFullscreenPhoto(!isFullscreenPhoto)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                    title="Agrandir la photo"
                  >
                    {isFullscreenPhoto ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Cadre Photo Vintage */}
              <div className="relative rounded-2xl overflow-hidden bg-black flex-1 min-h-[260px] sm:min-h-[340px] flex items-center justify-center border-4 border-slate-800 shadow-inner group">
                <img
                  src={currentItem.imageUrl}
                  alt="Archive historique"
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                <div className="absolute bottom-3 left-3 right-3 text-left">
                  <span className="text-[11px] font-bold text-amber-300 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-amber-400/30">
                    Époque : {currentItem.era}
                  </span>
                </div>
              </div>

              {usedClue && (
                <div className="mt-3 p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{currentItem.clues[0]}</span>
                </div>
              )}
            </div>

            {/* Colonne Droite : Les Deux Manettes de Décision (Temps & Espace) */}
            <div className="lg:col-span-6 flex flex-col justify-between gap-4">
              {/* 1. Frise Chronologique Tactile (QUAND ?) */}
              <div className="bg-slate-900/90 rounded-3xl p-5 border-2 border-slate-800 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Quand ? (Année Estimée)</span>
                  </span>

                  {/* Année Affichée en grand */}
                  <div className="px-4 py-1.5 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono font-black text-xl sm:text-2xl shadow-inner">
                    {selectedYear}
                  </div>
                </div>

                {/* Slider d'Années */}
                <div className="py-2">
                  <input
                    type="range"
                    min="1850"
                    max="2024"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 border border-slate-700"
                  />
                  <div className="flex justify-between text-[10px] font-mono font-bold text-slate-500 mt-1">
                    <span>1850</span>
                    <span>1900</span>
                    <span>1945</span>
                    <span>1989</span>
                    <span>2024</span>
                  </div>
                </div>

                {/* Boutons d'Ajustement Fin */}
                <div className="flex items-center justify-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => adjustYear(-10)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold font-mono border border-slate-700 cursor-pointer active:scale-95"
                  >
                    -10
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustYear(-1)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold font-mono border border-slate-700 cursor-pointer active:scale-95"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustYear(+1)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold font-mono border border-slate-700 cursor-pointer active:scale-95"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustYear(+10)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold font-mono border border-slate-700 cursor-pointer active:scale-95"
                  >
                    +10
                  </button>
                </div>
              </div>

              {/* 2. Carte Mondiale de Localisation (OÙ ?) */}
              <div className="bg-slate-900/90 rounded-3xl p-4 sm:p-5 border-2 border-slate-800 shadow-xl flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>Où ? (Cliquez pour placer votre repère)</span>
                  </span>

                  {guessedPin && (
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-400/30">
                      Repère posé ✓
                    </span>
                  )}
                </div>

                {/* Carte interactive SimpleMaps */}
                <div className="rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 h-[220px] sm:h-[260px] relative">
                  <ComposableMap
                    projectionConfig={{ scale: 140 }}
                    className="w-full h-full cursor-crosshair"
                    onClick={handleMapClick}
                  >
                    <ZoomableGroup zoom={1} minZoom={1} maxZoom={5}>
                      <Geographies geography={worldMapData}>
                        {({ geographies }: { geographies: Array<Record<string, any>> }) =>
                          geographies.map((geo: Record<string, any>) => (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill="#1e293b"
                              stroke="#334155"
                              strokeWidth={0.5}
                              className="outline-hidden hover:fill-slate-700 transition-colors"
                            />
                          ))
                        }
                      </Geographies>

                      {guessedPin && (
                        <Marker coordinates={[guessedPin.lng, guessedPin.lat]}>
                          <circle r={7} fill="#10b981" stroke="#ffffff" strokeWidth={2} />
                          <circle r={12} fill="#10b981" fillOpacity={0.3} className="animate-ping" />
                        </Marker>
                      )}
                    </ZoomableGroup>
                  </ComposableMap>
                </div>

                {/* Bouton de Validation */}
                <button
                  type="button"
                  onClick={handleValidateGuess}
                  disabled={!guessedPin}
                  className={`w-full mt-4 py-3.5 px-6 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border-2 ${
                    guessedPin
                      ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border-amber-300 border-b-4 border-b-amber-700 active:scale-98 hover:brightness-105"
                      : "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-60"
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5 text-slate-950" />
                  <span>Valider l'Estimation ({selectedYear})</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Écran de Révélation de la Manche */
          <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border-2 border-slate-800 shadow-2xl max-w-4xl mx-auto w-full animate-fade-in">
            {lastRound && (
              <div>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-400/30 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Révélation de la Manche {currentRoundIndex + 1}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white">
                    {lastRound.item.title}
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    {lastRound.item.city}, {lastRound.item.country} {lastRound.item.flagEmoji} • Année {lastRound.item.year}
                  </p>
                </div>

                {/* Carte de Décomposition du Score */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  {/* Score Temps */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                    <span className="text-xs uppercase font-black tracking-wider text-slate-400 block mb-1">
                      Estimation Temporelle
                    </span>
                    <span className="text-2xl font-black text-amber-400 font-mono">
                      +{lastRound.timeScore} pts
                    </span>
                    <p className="text-xs text-slate-400 mt-1">
                      Estimé : {lastRound.guessedYear} (Écart : {lastRound.yearDelta} an{lastRound.yearDelta > 1 ? "s" : ""})
                    </p>
                  </div>

                  {/* Score Espace */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                    <span className="text-xs uppercase font-black tracking-wider text-slate-400 block mb-1">
                      Estimation Spatiale
                    </span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      +{lastRound.geoScore} pts
                    </span>
                    <p className="text-xs text-slate-400 mt-1">
                      Distance : {lastRound.distanceKm.toLocaleString()} km
                    </p>
                  </div>

                  {/* Total Manche */}
                  <div className="bg-gradient-to-br from-amber-500/20 to-emerald-500/20 p-4 rounded-2xl border-2 border-amber-400/40 text-center">
                    <span className="text-xs uppercase font-black tracking-wider text-amber-300 block mb-1">
                      Total Manche
                    </span>
                    <span className="text-3xl font-black text-white font-mono">
                      +{lastRound.totalRoundScore} pts
                    </span>
                    <p className="text-xs text-emerald-300 mt-1 font-bold">
                      sur 5 000 max
                    </p>
                  </div>
                </div>

                {/* Carte Visuelle avec Ligne Géodésique */}
                <div className="rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 h-[220px] sm:h-[260px] relative mb-6">
                  <ComposableMap projectionConfig={{ scale: 130 }} className="w-full h-full">
                    <ZoomableGroup zoom={1}>
                      <Geographies geography={worldMapData}>
                        {({ geographies }: { geographies: Array<Record<string, any>> }) =>
                          geographies.map((geo: Record<string, any>) => (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill="#1e293b"
                              stroke="#334155"
                              strokeWidth={0.5}
                            />
                          ))
                        }
                      </Geographies>

                      {/* Ligne entre le guess et la vérité */}
                      <Line
                        from={[lastRound.guessedLng, lastRound.guessedLat]}
                        to={[lastRound.item.lng, lastRound.item.lat]}
                        stroke="#f59e0b"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                      />

                      {/* Repère Joueur */}
                      <Marker coordinates={[lastRound.guessedLng, lastRound.guessedLat]}>
                        <circle r={6} fill="#ef4444" stroke="#ffffff" strokeWidth={1.5} />
                      </Marker>

                      {/* Véritable Emplacement */}
                      <Marker coordinates={[lastRound.item.lng, lastRound.item.lat]}>
                        <circle r={7} fill="#10b981" stroke="#ffffff" strokeWidth={2} />
                      </Marker>
                    </ZoomableGroup>
                  </ComposableMap>
                </div>

                {/* Contexte Historique */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                  <span className="font-black text-amber-300 block mb-1">
                    Le contexte historique :
                  </span>
                  {lastRound.item.historicalContext}
                </div>

                {/* Bouton Manche Suivante */}
                <button
                  type="button"
                  onClick={handleNextRound}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border-2 border-emerald-400/50 border-b-4 border-b-emerald-700"
                >
                  <span>
                    {currentRoundIndex + 1 < sessionItems.length
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
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-center relative overflow-hidden">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 text-4xl shadow-xl border-2 border-white/20 animate-bounce">
              ⏳
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Partie Terminée !
            </h2>

            <p className="text-amber-400 text-sm font-bold mt-1">
              Score Final : {currentCumulativeScore.toLocaleString()} / 25 000 pts
            </p>

            {/* Récompenses XP et Gems */}
            {rewardResult && (
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 my-5">
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
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border-2 border-amber-300 border-b-4 border-b-amber-700"
              >
                <RotateCcw className="w-4 h-4 stroke-[3]" />
                <span>Rejouer une Session</span>
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
