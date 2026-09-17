import React, { useState } from "react";
import { Copy, Check, QrCode } from "lucide-react";

interface PartyQRCodeProps {
  roomCode: string;
  className?: string;
}

export const PartyQRCode: React.FC<PartyQRCodeProps> = ({ roomCode, className = "" }) => {
  const [copied, setCopied] = useState(false);
  const [showLarge, setShowLarge] = useState(false);

  const joinUrl = typeof window !== "undefined"
    ? `${window.location.origin}/party?code=${encodeURIComponent(roomCode)}`
    : `https://terracoast.app/party?code=${encodeURIComponent(roomCode)}`;

  // API QR Code gratuite et fiable sans dépendance npm
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    joinUrl
  )}&bgcolor=ffffff&color=0f172a&margin=2`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <div className={`flex flex-col items-center p-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-100 ${className}`}>
      <button
        type="button"
        onClick={() => setShowLarge(!showLarge)}
        className="group relative cursor-pointer focus:outline-none transition-transform hover:scale-105"
        title="Cliquer pour agrandir"
      >
        <div className="p-2 bg-white rounded-xl shadow-inner border border-gray-200">
          <img
            src={qrImageUrl}
            alt={`QR Code pour rejoindre ${roomCode}`}
            className="w-36 h-36 md:w-44 md:h-44 object-contain rounded-lg"
            loading="lazy"
          />
        </div>
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white text-xs font-semibold">
          <QrCode className="w-5 h-5 mr-1" />
          Agrandir
        </div>
      </button>

      <p className="text-xs text-gray-500 mt-2 text-center font-medium">
        Scannez avec un smartphone 📱
      </p>

      <div className="mt-3 flex items-center gap-2 w-full max-w-xs">
        <button
          type="button"
          onClick={handleCopyLink}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-sm"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              Lien copié !
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-emerald-600" />
              Copier le lien d'invitation
            </>
          )}
        </button>
      </div>

      {showLarge && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowLarge(false)}
        >
          <div
            className="bg-white p-6 rounded-3xl max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              Rejoindre le salon
            </h3>
            <div className="text-3xl font-black text-emerald-600 tracking-wider mb-4 font-mono">
              {roomCode}
            </div>
            <div className="p-3 bg-white border border-gray-200 rounded-2xl inline-block shadow-inner mb-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
                  joinUrl
                )}&bgcolor=ffffff&color=0f172a&margin=2`}
                alt={`Grand QR code ${roomCode}`}
                className="w-64 h-64 mx-auto rounded-xl"
              />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Ouvrez l'appareil photo de votre smartphone pour rejoindre directement !
            </p>
            <button
              type="button"
              onClick={() => setShowLarge(false)}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
