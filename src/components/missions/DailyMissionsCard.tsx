import { useState, useEffect } from "react";
import {
  Target,
  Sparkles,
  Gift,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  getDailyMissions,
  claimMissionReward,
  claimDailyBonusChest,
  DAILY_MISSIONS_UPDATED_EVENT,
  type DailyMissionsState,
} from "../../lib/dailyMissionsManager";
import { getTimeUntilNextChallenge } from "../../lib/dailyChallenge";
import { triggerConfetti } from "../common/Confetti";
import { playVictoryFanfare, playClickSound } from "../../lib/soundManager";
import { toast } from "../common/ToastContainer";

interface DailyMissionsCardProps {
  className?: string;
  compact?: boolean;
}

export function DailyMissionsCard({ className = "", compact: _compact = false }: DailyMissionsCardProps) {
  const { user } = useAuth();
  const [missionsState, setMissionsState] = useState<DailyMissionsState>(() =>
    getDailyMissions(user?.id)
  );
  const [timeRemaining, setTimeRemaining] = useState(
    getTimeUntilNextChallenge().formatted
  );
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const refresh = () => {
    setMissionsState(getDailyMissions(user?.id));
  };

  useEffect(() => {
    refresh();
    const handleUpdate = () => refresh();
    window.addEventListener(DAILY_MISSIONS_UPDATED_EVENT, handleUpdate);
    window.addEventListener("terracost_gamification_updated", handleUpdate);

    const timer = setInterval(() => {
      setTimeRemaining(getTimeUntilNextChallenge().formatted);
    }, 1000);

    return () => {
      window.removeEventListener(DAILY_MISSIONS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("terracost_gamification_updated", handleUpdate);
      clearInterval(timer);
    };
  }, [user?.id]);

  const claimedCount = missionsState.missions.filter((m) => m.claimed).length;
  const allMissionsClaimed = claimedCount === 3;
  const progressPercent = Math.round((claimedCount / 3) * 100);

  const handleClaim = (missionId: string) => {
    playClickSound();
    setClaimingId(missionId);

    const res = claimMissionReward(user?.id, missionId);
    if (res.success) {
      playVictoryFanfare();
      triggerConfetti();
      toast.success(
        `🎉 Mission accomplie ! +${res.gems} 💎 et +${res.xp} XP ajoutés à votre profil !`
      );
      refresh();
    } else {
      toast.error(res.error || "Impossible de réclamer la récompense.");
    }
    setClaimingId(null);
  };

  const handleClaimBonus = () => {
    playClickSound();
    const res = claimDailyBonusChest(user?.id);
    if (res.success) {
      playVictoryFanfare();
      triggerConfetti();
      toast.success(
        `👑 Coffre Suprême du Jour débloqué ! +${res.gems} 💎 et +${res.xp} XP offerts !`
      );
      refresh();
    } else {
      toast.error(res.error || "Toutes les missions doivent être validées.");
    }
  };

  return (
    <div
      className={`rounded-3xl bg-white border-2 border-slate-200 border-b-4 border-b-slate-300 p-5 sm:p-6 shadow-sm overflow-hidden relative ${className}`}
    >
      {/* Halo de fond décoratif */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <Target className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-1.5">
              <span>Missions du Jour</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                {claimedCount}/3
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Renouvellement dans {timeRemaining}</span>
            </p>
          </div>
        </div>

        {/* Bonus Chest Badge */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all ${
            missionsState.bonusClaimed
              ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold text-xs"
              : allMissionsClaimed
              ? "bg-amber-100 border-amber-300 text-amber-900 font-black text-xs animate-bounce shadow-md cursor-pointer hover:bg-amber-200"
              : "bg-slate-50 border-slate-200 text-slate-600 text-xs font-semibold"
          }`}
          onClick={allMissionsClaimed && !missionsState.bonusClaimed ? handleClaimBonus : undefined}
          title={
            allMissionsClaimed && !missionsState.bonusClaimed
              ? "Cliquez pour réclamer le Grand Coffre !"
              : "Validez les 3 missions pour débloquer ce coffre"
          }
        >
          <Gift className={`w-4 h-4 ${allMissionsClaimed ? "text-amber-600" : "text-slate-400"}`} />
          <span>
            {missionsState.bonusClaimed
              ? "Coffre obtenu ✓"
              : allMissionsClaimed
              ? "Ouvrir le Coffre (+50 💎)"
              : "Coffre 3/3 (+50 💎)"}
          </span>
        </div>
      </div>

      {/* Barre de progression globale */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5">
          <span>Progression quotidienne</span>
          <span className="font-mono text-emerald-600 font-black">{progressPercent}%</span>
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Liste des 3 missions */}
      <div className="space-y-3">
        {missionsState.missions.map((m) => {
          const isComplete = m.completed;
          const isClaimed = m.claimed;
          const progressW = Math.min(100, Math.round((m.currentCount / m.targetCount) * 100));

          return (
            <div
              key={m.id}
              className={`rounded-2xl border-2 p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isClaimed
                  ? "bg-slate-50/70 border-slate-200 opacity-80"
                  : isComplete
                  ? "bg-gradient-to-r from-amber-50/80 via-emerald-50/50 to-white border-amber-300 ring-2 ring-amber-300/40 shadow-sm"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl select-none filter drop-shadow-sm p-1.5 rounded-xl bg-slate-100/80 border border-slate-200/60 shrink-0">
                  {m.icon}
                </span>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-sm text-slate-800 tracking-tight">
                      {m.title}
                    </h4>
                    {isClaimed && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Validé
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {m.description}
                  </p>

                  {/* Micro barre de progression de la mission */}
                  {!isClaimed && (
                    <div className="flex items-center gap-2 pt-1 max-w-[200px]">
                      <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${progressW}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-600">
                        {m.currentCount}/{m.targetCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Récompense & Action */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-50 text-sky-700 text-xs font-black border border-sky-200">
                    +{m.rewardGems} 💎
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 text-xs font-black border border-amber-200">
                    +{m.rewardXp} XP
                  </span>
                </div>

                {isClaimed ? (
                  <span className="text-xs font-bold text-slate-400 px-3 py-1.5 rounded-xl bg-slate-100">
                    Réclamé
                  </span>
                ) : isComplete ? (
                  <button
                    type="button"
                    onClick={() => handleClaim(m.id)}
                    disabled={claimingId === m.id}
                    className="cursor-pointer px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wide bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 border-2 border-amber-400 border-b-4 border-b-amber-700 shadow-md active:translate-y-1 active:border-b-2 transition-all flex items-center gap-1.5 animate-pulse"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Réclamer</span>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-slate-400 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                    En cours
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bannière Grand Coffre 3/3 quand débloqué */}
      {allMissionsClaimed && !missionsState.bonusClaimed && (
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-amber-500/20 border border-amber-300">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-bounce">🎁</span>
            <div>
              <p className="font-black text-sm uppercase tracking-wide text-slate-900">
                Toutes les missions accomplies !
              </p>
              <p className="text-xs font-bold text-amber-950">
                Débloquez votre bonus suprême : +50 TerraGems 💎 & +100 XP
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClaimBonus}
            className="cursor-pointer px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider bg-slate-950 hover:bg-slate-900 text-white shadow-md active:translate-y-1 transition-all"
          >
            Ouvrir le Grand Coffre 🎁
          </button>
        </div>
      )}
    </div>
  );
}
