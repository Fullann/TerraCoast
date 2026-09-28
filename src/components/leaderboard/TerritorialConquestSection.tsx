import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Swords,
  Clock,
  Trophy,
  ChevronRight,
  Flame,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  getConquestSeasonState,
  getTimeUntilSeasonReset,
  getTerritorialChampionBadges,
  type ConquestZoneKey,
  type ConquestZoneState,
  type Federation,
} from "../../lib/federations";

interface TerritorialConquestSectionProps {
  userFederation: Federation;
  onOpenFederationModal?: () => void;
}

export function TerritorialConquestSection({
  userFederation,
  onOpenFederationModal,
}: TerritorialConquestSectionProps) {
  const navigate = useNavigate();
  const [conquestState, setConquestState] = useState(() => getConquestSeasonState());
  const [countdown, setCountdown] = useState(() => getTimeUntilSeasonReset());
  const [expandedZoneKey, setExpandedZoneKey] = useState<ConquestZoneKey | null>(null);

  // Mettre à jour le compte à rebours chaque seconde
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getTimeUntilSeasonReset());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Écouter les mises à jour d'influence (ex: après un quiz)
  useEffect(() => {
    const handleUpdate = () => {
      setConquestState(getConquestSeasonState());
    };
    window.addEventListener("terracoast_conquest_updated", handleUpdate);
    return () => window.removeEventListener("terracoast_conquest_updated", handleUpdate);
  }, []);

  const zoneKeys: ConquestZoneKey[] = [
    "europe",
    "americas",
    "asia",
    "africa",
    "oceania",
    "poles",
  ];

  const myBadges = getTerritorialChampionBadges(userFederation.id);

  const handleConquerZone = (zone: ConquestZoneState) => {
    const query = zone.id === "poles" ? "Polaire" : zone.config.name;
    navigate(`/quizzes?search=${encodeURIComponent(query)}`);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-indigo-900/40 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title and Countdown */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5" />
              Saison Hebdomadaire • {conquestState.seasonId}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              En direct 🟢
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>La Conquête des Nations</span>
            <span className="text-xl sm:text-2xl">⚔️</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            6 zones de conflit mondial. Chaque quiz réussi apporte des points d'influence pour votre
            fédération. Le dimanche soir à minuit, les territoires sont attribués aux vainqueurs !
          </p>
        </div>

        {/* Live Timer Pill */}
        <div className="flex flex-col sm:items-end shrink-0">
          <div className="bg-slate-800/80 border border-white/15 px-4 py-2.5 rounded-2xl backdrop-blur-md shadow-lg flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-400 animate-pulse shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                Fin du Conflit Dimanche 23h59
              </span>
              <span className="text-sm sm:text-base font-black font-mono text-amber-300">
                {countdown.formatted}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* User Federation Territorial Status Banner */}
      <div className="relative z-10 my-6 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-3xl shadow-inner shrink-0">
            {userFederation.flagEmoji}
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Votre Fédération au Front
            </span>
            <h4 className="text-base font-black text-white">
              {userFederation.name} ({userFederation.shortCode})
            </h4>
            {myBadges.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span className="text-xs text-amber-300 font-bold flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" /> Territoires contrôlés :
                </span>
                {myBadges.map((badge, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-200 text-[11px] font-extrabold border border-amber-500/30"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-0.5">
                Aucun territoire contrôlé pour le moment. Jouez pour faire grimper votre influence !
              </p>
            )}
          </div>
        </div>

        {onOpenFederationModal && (
          <button
            onClick={onOpenFederationModal}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition border border-white/15 shrink-0"
          >
            Changer de Blason 🏛️
          </button>
        )}
      </div>

      {/* 6 Territorial Conflict Zones Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zoneKeys.map((key) => {
          const zone = conquestState.zones[key];
          const isExpanded = expandedZoneKey === key;
          const isMyFedLeading = zone.controllingFederation?.id === userFederation.id;

          return (
            <div
              key={key}
              className={`rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                isMyFedLeading
                  ? "bg-slate-900/90 border-emerald-400/60 shadow-lg shadow-emerald-900/20 ring-1 ring-emerald-400/40"
                  : "bg-slate-900/60 border-white/10 hover:border-white/25 shadow-md"
              }`}
            >
              {/* Zone Header */}
              <div className={`p-4 bg-gradient-to-r ${zone.config.bgGradient} relative`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl drop-shadow-md">{zone.config.emoji}</span>
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-wider text-white/80 block">
                        {zone.config.subtitle}
                      </span>
                      <h3 className="text-lg font-black text-white leading-tight">
                        {zone.config.name}
                      </h3>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-black text-amber-300 border border-white/20 shrink-0">
                    +{zone.config.bonusXpPercent}% XP
                  </span>
                </div>
              </div>

              {/* Dominance Gauge & Leading Federation */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                      Leader Actuel
                    </span>
                    <span className="font-extrabold text-white">
                      {zone.totalInfluence.toLocaleString()} pts d'influence
                    </span>
                  </div>

                  {zone.controllingFederation ? (
                    <div className="flex items-center justify-between bg-slate-950/60 border border-white/10 rounded-xl p-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{zone.controllingFederation.flagEmoji}</span>
                        <div>
                          <p className="text-xs font-black text-white">
                            {zone.controllingFederation.name}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {isMyFedLeading ? "Votre fédération domine !" : "En tête du territoire"}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-black ${
                          isMyFedLeading ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {zone.dominancePercent}%
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-xl text-center">
                      Aucune domination pour l'instant
                    </div>
                  )}

                  {/* Multi-segment Dominance Bar */}
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex mt-2.5">
                    {zone.rankings.slice(0, 3).map((rank, idx) => {
                      const colors = [
                        "bg-emerald-500",
                        "bg-sky-500",
                        "bg-amber-500",
                      ];
                      return (
                        <div
                          key={rank.federation.id}
                          style={{ width: `${rank.percentage}%` }}
                          className={`${colors[idx % colors.length]} transition-all duration-500`}
                          title={`${rank.federation.name} (${rank.percentage}%)`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Expanded rankings breakdown */}
                {isExpanded && (
                  <div className="pt-2 border-t border-white/10 space-y-1.5 animate-fade-in text-xs">
                    <p className="text-[10px] uppercase font-bold text-slate-400">
                      Classement de la zone :
                    </p>
                    {zone.rankings.map((r, idx) => (
                      <div
                        key={r.federation.id}
                        className={`flex items-center justify-between py-1 px-2 rounded-lg ${
                          r.federation.id === userFederation.id
                            ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-200"
                            : "text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-400 text-[10px]">#{idx + 1}</span>
                          <span>{r.federation.flagEmoji}</span>
                          <span className="font-bold">{r.federation.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono">{r.points.toLocaleString()} pts</span>
                          <span className="text-[10px] font-black text-slate-400">
                            ({r.percentage}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Card Actions */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => setExpandedZoneKey(isExpanded ? null : key)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs flex items-center justify-center"
                    title={isExpanded ? "Masquer détails" : "Voir tous les scores"}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => handleConquerZone(zone)}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-md transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Flame className="w-3.5 h-3.5 text-slate-950" />
                    <span>Conquérir cette Zone</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
