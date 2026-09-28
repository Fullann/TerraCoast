import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Swords,
  Share2,
  Trophy,
  Flame,
} from "lucide-react";
import {
  getSentGhostRuns,
  getCompletedGhostRuns,
  type GhostRunChallenge,
  type GhostRunResult,
} from "../../lib/ghostRunManager";
import { GhostRunModal } from "./GhostRunModal";

interface GhostRunsTabProps {
  incomingChallenge: GhostRunChallenge | null;
  rawGhostParam?: string | null;
}

export function GhostRunsTab({ incomingChallenge, rawGhostParam }: GhostRunsTabProps) {
  const navigate = useNavigate();
  const [sentGhosts, setSentGhosts] = useState<GhostRunChallenge[]>(() => getSentGhostRuns());
  const [completedGhosts, setCompletedGhosts] = useState<GhostRunResult[]>(() =>
    getCompletedGhostRuns()
  );
  const [selectedChallengeToShare, setSelectedChallengeToShare] =
    useState<GhostRunChallenge | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setSentGhosts(getSentGhostRuns());
      setCompletedGhosts(getCompletedGhostRuns());
    };
    window.addEventListener("terracoast_ghost_completed", handleUpdate);
    return () => window.removeEventListener("terracoast_ghost_completed", handleUpdate);
  }, []);

  const handleAcceptIncoming = () => {
    if (!incomingChallenge) return;
    navigate(`/quizzes/play/${incomingChallenge.quizId}?ghost=${rawGhostParam}`);
  };

  return (
    <div className="space-y-6">
      {/* INCOMING CHALLENGE HERO CARD (IF OPENED VIA LINK) */}
      {incomingChallenge && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-pink-900 text-white shadow-xl border border-pink-500/40 relative overflow-hidden animate-scale-up">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/30 inline-flex items-center gap-1.5">
                <span>👻</span> Défi Asynchrone Reçu !
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                {incomingChallenge.challengerPseudo} vous défie !
              </h3>
              <p className="text-sm text-pink-100 max-w-xl">
                « J'ai fait <strong>{incomingChallenge.challengerScore} pts</strong> (
                {incomingChallenge.challengerAccuracy}%) sur le quiz{" "}
                <strong>{incomingChallenge.quizTitle}</strong>, bats mon score ! »
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <button
                onClick={handleAcceptIncoming}
                className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-sm shadow-xl transition-all hover:scale-102 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Swords className="w-4 h-4 text-slate-950" />
                <span>Relever le Défi Immédiatement ⚔️</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW GHOST RUN HERO */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center text-3xl shadow-md shrink-0">
            👻
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-900">
              Comment fonctionnent les Ghost Runs ?
            </h4>
            <p className="text-xs text-slate-600 max-w-lg mt-0.5">
              Jouez n'importe quel quiz en solo. À la fin, cliquez sur{" "}
              <strong>« Défier un ami »</strong> pour générer un lien WhatsApp ou Discord. Votre ami
              jouera la même série de questions à son rythme !
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/quizzes")}
          className="py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition-all active:scale-98 shrink-0 flex items-center gap-2 cursor-pointer"
        >
          <Flame className="w-4 h-4" />
          <span>Lancer un Quiz Solo</span>
        </button>
      </div>

      {/* SECTION 1: SENT GHOST RUNS */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📤</span>
            <h3 className="text-lg font-black text-slate-900">
              Mes Fantômes en Circulation ({sentGhosts.length})
            </h3>
          </div>
        </div>

        {sentGhosts.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Vous n'avez pas encore envoyé de défi fantôme. Terminez un quiz et défiez un ami !
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sentGhosts.map((g) => (
              <div
                key={g.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-indigo-50/40 transition-colors flex items-center justify-between gap-3"
              >
                <div>
                  <h5 className="text-sm font-black text-slate-900 line-clamp-1">
                    {g.quizTitle}
                  </h5>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-mono">
                    <span className="text-amber-600 font-bold">{g.challengerScore} pts</span>
                    <span>•</span>
                    <span>{g.challengerAccuracy}% précision</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedChallengeToShare(g)}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer shrink-0"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Partager</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: COMPLETED GHOST RUN MATCHES */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-black text-slate-900">
              Historique des Duels Ghost ({completedGhosts.length})
            </h3>
          </div>
        </div>

        {completedGhosts.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Aucun résultat de défi enregistré pour l'instant.
          </div>
        ) : (
          <div className="space-y-2.5">
            {completedGhosts.map((res) => (
              <div
                key={res.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      res.opponentWon
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {res.opponentWon ? "🏆" : "👻"}
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-slate-900">{res.quizTitle}</h5>
                    <p className="text-xs text-slate-500">
                      {res.opponentPseudo} ({res.opponentScore} pts) vs {res.challengerPseudo} (
                      {res.challengerScore} pts)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono self-end sm:self-auto">
                  <span
                    className={`px-2 py-0.5 rounded-md font-extrabold ${
                      res.opponentWon
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-purple-50 text-purple-700 border border-purple-200"
                    }`}
                  >
                    {res.opponentWon
                      ? `Victoire (+${res.scoreDifference} pts)`
                      : `Défaite (-${res.scoreDifference} pts)`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <GhostRunModal
        isOpen={Boolean(selectedChallengeToShare)}
        challenge={selectedChallengeToShare}
        onClose={() => setSelectedChallengeToShare(null)}
      />
    </div>
  );
}
