import { useRef, useEffect, useState } from "react";
import {
  X,
  Share2,
  Copy,
  Download,
  Check,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import {
  drawShareCardOnCanvas,
  downloadCanvasImage,
  copyCanvasImageToClipboard,
  shareViaWebShareApi,
  generateShareText,
  type ShareCardData,
} from "../../lib/visualShareCard";

interface VisualShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ShareCardData;
}

export function VisualShareModal({
  isOpen,
  onClose,
  data,
}: VisualShareModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isWebShareSupported, setIsWebShareSupported] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && Boolean(navigator.share)) {
      setIsWebShareSupported(true);
    }
  }, []);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      drawShareCardOnCanvas(canvasRef.current, data);
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    const ok = await copyCanvasImageToClipboard(canvasRef.current);
    if (ok) {
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2500);
    }
  };

  const handleCopyText = () => {
    const text = generateShareText(data);
    navigator.clipboard.writeText(text).then(() => {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    });
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const cleanName = data.title.toLowerCase().replace(/[^a-z0-9]/g, "-");
    downloadCanvasImage(canvasRef.current, `terracoast-${cleanName}.png`);
  };

  const handleWebShare = async () => {
    if (!canvasRef.current) return;
    await shareViaWebShareApi(canvasRef.current, data);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl space-y-5 animate-scaleUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-white">Partager mon résultat</h3>
              <p className="text-xs text-slate-400">Montre tes prouesses géographiques à tes amis !</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Preview */}
        <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="w-full h-auto max-h-[320px] object-contain rounded-xl"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* Mobile Web Share */}
          {isWebShareSupported && (
            <button
              onClick={handleWebShare}
              className="py-3 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950 flex flex-col items-center justify-center gap-1.5 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>Partager 📲</span>
            </button>
          )}

          {/* Copy Image */}
          <button
            onClick={handleCopyImage}
            className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-xl border border-slate-700 flex flex-col items-center justify-center gap-1.5 transition-all"
          >
            {copiedImage ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedImage ? "Image copiée ! ✅" : "Copier l'image"}</span>
          </button>

          {/* Download PNG */}
          <button
            onClick={handleDownload}
            className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-xl border border-slate-700 flex flex-col items-center justify-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Télécharger PNG</span>
          </button>

          {/* Copy Text for WhatsApp/X */}
          <button
            onClick={handleCopyText}
            className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-xl border border-slate-700 flex flex-col items-center justify-center gap-1.5 transition-all"
          >
            {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <MessageSquare className="w-4 h-4 text-sky-400" />}
            <span>{copiedText ? "Texte copié ! ✅" : "Texte + Emojis"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
