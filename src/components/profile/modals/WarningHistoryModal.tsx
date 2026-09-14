import React from "react";
import { X } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";

interface WarningItem {
  id: string;
  reason: string;
  status: string;
  created_at: string;
}

interface WarningHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  warnings: WarningItem[];
}

export const WarningHistoryModal: React.FC<WarningHistoryModalProps> = ({
  isOpen,
  onClose,
  warnings,
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
        aria-label={t("profile.warningHistory")}
        className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">
            {t("profile.warningHistory")}
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
        <div className="space-y-3">
          {warnings.map((warning) => (
            <div
              key={warning.id}
              className="border-2 border-gray-200 rounded-lg p-4"
            >
              <p className="font-semibold text-gray-800 mb-2">
                {warning.reason}
              </p>
              <p className="text-sm text-gray-600">
                {t("profile.status")}: {warning.status}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(warning.created_at).toLocaleString()}
              </p>
            </div>
          ))}
          {warnings.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              {t("profile.noWarnings")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
