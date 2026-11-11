import React, { useState, useEffect } from "react";
import { ServerOff, RefreshCw, ShieldCheck, Clock, Radio } from "lucide-react";

interface DatabaseDownPageProps {
  onRetry?: () => Promise<boolean> | void;
  errorMessage?: string | null;
}

export const DatabaseDownPage: React.FC<DatabaseDownPageProps> = ({
  onRetry,
  errorMessage,
}) => {
  const [retrying, setRetrying] = useState(false);
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleRetry();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onRetry]);

  const handleRetry = async () => {
    if (retrying) return;
    setRetrying(true);
    try {
      if (onRetry) {
        await onRetry();
      } else {
        window.location.reload();
      }
    } finally {
      setRetrying(false);
      setCountdown(15);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Halo lumineux en arrière-plan */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <main className="max-w-xl w-full text-center relative z-10 flex flex-col items-center">
        {/* Logo TerraCoast */}
        <div className="flex items-center gap-2.5 mb-6">
          <img
            src="/logo.png"
            alt="TerraCoast"
            className="w-10 h-10 object-contain drop-shadow"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
          <span className="text-2xl font-black tracking-tight text-white">
            Terra<span className="text-emerald-400">Coast</span>
          </span>
        </div>

        {/* Carte principale */}
        <div className="w-full bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Badge statut */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-black tracking-wide uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>Serveur temporairement inaccessible</span>
          </div>

          {/* Icône animée */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-tr from-slate-800 to-slate-700/60 border border-slate-700 flex items-center justify-center text-emerald-400 shadow-xl relative">
            <ServerOff className="w-10 h-10 sm:w-12 sm:h-12 text-rose-400 stroke-[1.75]" />
            <div className="absolute -bottom-2 -right-2 p-1.5 bg-slate-900 rounded-xl border border-slate-700">
              <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
          </div>

          {/* Titre & Message */}
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
            Le site est momentanément indisponible
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 font-medium">
            Nous ne parvenons pas à joindre notre base de données. Le site est actuellement hors ligne, mais pas d'inquiétude : nos équipes mettent tout en œuvre pour rétablir l'accès au plus vite !
          </p>

          {/* Détails rassurants */}
          <div className="space-y-3 mb-6 text-left">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-semibold mb-0.5">
                  Vos données sont en sécurité
                </strong>
                Vos séries de jours (streaks), vos cartes, vos statistiques et vos scores sont précieusement préservés.
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/40 border border-slate-700/40 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Reconnexion automatique :</span>
              </span>
              <span className="font-mono text-cyan-300 font-bold">
                dans {countdown}s
              </span>
            </div>
          </div>

          {/* Action manuelle */}
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="w-full py-3.5 px-6 rounded-2xl font-black text-sm bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`}
            />
            <span>
              {retrying ? "Vérification en cours..." : "Vérifier la connexion maintenant"}
            </span>
          </button>

          {errorMessage && (
            <p className="mt-4 text-[11px] text-slate-500 font-mono truncate">
              Détail technique : {errorMessage}
            </p>
          )}
        </div>

        {/* Footer info */}
        <p className="mt-6 text-xs text-slate-500">
          TerraCoast • L'aventure géographique interactive
        </p>
      </main>
    </div>
  );
};
