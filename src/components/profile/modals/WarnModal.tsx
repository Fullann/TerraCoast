import React from "react";
import { X } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";

interface WarnModalProps {
  isOpen: boolean;
  onClose: () => void;
  warnReason: string;
  onWarnReasonChange: (reason: string) => void;
  onSendWarning: () => void;
  sending: boolean;
}

export const WarnModal: React.FC<WarnModalProps> = ({
  isOpen,
  onClose,
  warnReason,
  onWarnReasonChange,
  onSendWarning,
  sending,
}) => {
  const { t } = useLanguage();

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("profile.warnUser")}
        className="bg-white rounded-xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">
            {t("profile.warnUser")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            title={t("common.close")}
            className="p-1 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" aria-hidden="true" />
          </button>
        </div>
        <textarea
          value={warnReason}
          onChange={(e) => onWarnReasonChange(e.target.value)}
          className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 outline-none mb-4"
          rows={4}
          placeholder={t("profile.warnReason")}
        />
        <button
          type="button"
          onClick={onSendWarning}
          disabled={sending || !warnReason.trim()}
          className="w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors font-semibold"
        >
          {t("profile.sendWarning")}
        </button>
      </div>
    </div>
  );
};
