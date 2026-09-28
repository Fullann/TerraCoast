import { useState } from "react";
import {
  X,
  Copy,
  Check,
  MessageCircle,
  Swords,
  Share2,
} from "lucide-react";
import {
  generateGhostRunShare,
  type GhostRunChallenge,
} from "../../lib/ghostRunManager";
import { toast } from "../common/ToastContainer";

interface GhostRunModalProps {
  challenge: GhostRunChallenge | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GhostRunModal({ challenge, isOpen, onClose }: GhostRunModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !challenge) return null;

  const shareInfo = generateGhostRunShare(challenge);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareInfo.url);
      setCopied(true);
      toast.success("Lien du défi copié dans le presse-papier !");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Impossible de copier automatiquement.");
    }
  };

  const handleWhatsApp = () => {
    window.open(shareInfo.whatsappUrl, "_blank");
  };

  const handleTwitter = () => {
    window.open(shareInfo.twitterUrl, "_blank");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white p-6 pb-7 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <span className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md text-2xl border border-white/25">
              👻
            </span>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-pink-200 block">
                Défi Asynchrone
              </span>
              <h3 className="text-2xl font-black leading-tight text-white">
                Partager mon Ghost Run
              </h3>
            </div>
          </div>
          <p className="text-xs text-white/90">
            Défiez vos amis sur WhatsApp ou Discord ! Ils joueront la même série de questions à leur
            rythme pour tenter de battre votre score fantôme.
          </p>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-5">
          {/* Visual Challenge Preview Badge */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white p-5 rounded-2xl border border-indigo-900/50 shadow-md">
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
              <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                <Swords className="w-4 h-4 text-pink-400" />
                {challenge.quizTitle}
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-extrabold bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {challenge.challengerAccuracy}% précision
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                  Score à battre
                </span>
                <span className="text-3xl font-black text-amber-400 font-mono tracking-tight">
                  {challenge.challengerScore}{" "}
                  <span className="text-sm font-sans font-bold text-amber-300">pts</span>
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">
                  Fantôme de
                </span>
                <span className="text-base font-black text-white flex items-center gap-1.5 justify-end">
                  <span>{challenge.challengerPseudo}</span>
                  <span>👻</span>
                </span>
              </div>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <button
              onClick={handleWhatsApp}
              className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-98 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleTwitter}
              className="py-3 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-98 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>X / Twitter</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-98 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copier le Lien</span>
                </>
              )}
            </button>
          </div>

          {/* Link box with one-click copy */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
            <input
              type="text"
              readOnly
              value={shareInfo.url}
              className="bg-transparent text-xs text-slate-600 flex-1 font-mono truncate outline-none select-all"
            />
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition shrink-0"
            >
              {copied ? "✓ Copié" : "Copier"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
