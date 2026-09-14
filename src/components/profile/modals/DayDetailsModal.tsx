import React from "react";
import { Calendar, X } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";

interface DayDetailsModalProps {
  selectedDataPoint: any | null;
  onClose: () => void;
  isOwnProfile: boolean;
  profilePseudo?: string | null;
}

export const DayDetailsModal: React.FC<DayDetailsModalProps> = ({
  selectedDataPoint,
  onClose,
  isOwnProfile,
  profilePseudo,
}) => {
  const { t } = useLanguage();

  React.useEffect(() => {
    if (!selectedDataPoint) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDataPoint, onClose]);

  if (!selectedDataPoint) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("profile.dayDetails")}
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" aria-hidden="true" />
            {t("profile.dayDetails")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            title={t("common.close")}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">
              {t("profile.date")}
            </p>
            <p className="text-xl font-bold text-gray-800">
              {selectedDataPoint.name}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-semibold mb-1">
              {isOwnProfile
                ? t("profile.myScore")
                : `${profilePseudo || ""} - ${t("profile.score")}`}
            </p>
            <p className="text-3xl font-bold text-blue-700">
              {selectedDataPoint[
                isOwnProfile ? t("profile.myProgress") : (profilePseudo || "")
              ] || 0}{" "}
              pts
            </p>
          </div>

          {!isOwnProfile &&
            selectedDataPoint[t("profile.myProgress")] !== undefined && (
              <>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-semibold mb-1">
                    {t("profile.myScore")}
                  </p>
                  <p className="text-3xl font-bold text-green-700">
                    {selectedDataPoint[t("profile.myProgress")]} pts
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                  <p className="text-sm text-purple-600 font-semibold mb-1">
                    {t("profile.difference")}
                  </p>
                  <p
                    className={`text-3xl font-bold ${
                      selectedDataPoint[t("profile.myProgress")] >
                      (selectedDataPoint[profilePseudo || ""] || 0)
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {selectedDataPoint[t("profile.myProgress")] >
                    (selectedDataPoint[profilePseudo || ""] || 0)
                      ? "+"
                      : ""}
                    {selectedDataPoint[t("profile.myProgress")] -
                      (selectedDataPoint[profilePseudo || ""] || 0)}{" "}
                    pts
                  </p>
                </div>
              </>
            )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          {t("profile.close")}
        </button>
      </div>
    </div>
  );
};
