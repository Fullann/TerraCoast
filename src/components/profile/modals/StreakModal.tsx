import React from "react";
import { Flame, Trophy, Target, X } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
  longestStreak: number;
  isOwnProfile: boolean;
  frameStyle?: string | null;
  avatarUploading?: boolean;
  frameSaving?: boolean;
  onUploadAvatar?: (file: File) => void;
  onSaveFrameStyle?: (style: string) => void;
}

export const StreakModal: React.FC<StreakModalProps> = ({
  isOpen,
  onClose,
  currentStreak,
  longestStreak,
  isOwnProfile,
  frameStyle = "none",
  avatarUploading = false,
  frameSaving = false,
  onUploadAvatar,
  onSaveFrameStyle,
}) => {
  const { t } = useLanguage();

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getDayText = (count: number) => {
    return count > 1 ? t("common.days") : t("common.day");
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("profile.streakDetails")}
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" aria-hidden="true" />
            {t("profile.streakDetails")}
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
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4">
            <p className="text-sm text-orange-600 font-semibold mb-1">
              {t("profile.currentStreak")}
            </p>
            <p className="text-4xl font-bold text-orange-600 flex items-center gap-2">
              <Flame className="w-8 h-8" />
              {currentStreak} {getDayText(currentStreak)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4">
            <p className="text-sm text-yellow-600 font-semibold mb-1">
              {t("profile.longestStreak")}
            </p>
            <p className="text-4xl font-bold text-yellow-600 flex items-center gap-2">
              <Trophy className="w-8 h-8" />
              {longestStreak} {getDayText(longestStreak)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-semibold mb-2">
              {t("profile.keepGoing")}
            </p>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-gray-700">
                {t("profile.playTodayToKeepStreak")}
              </p>
            </div>
          </div>

          {isOwnProfile && (
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="inline-flex items-center justify-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors text-sm font-semibold cursor-pointer disabled:opacity-50">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={avatarUploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && onUploadAvatar) onUploadAvatar(f);
                    e.currentTarget.value = "";
                  }}
                />
                {avatarUploading ? t("common.loading") : t("profile.changeAvatar")}
              </label>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{t("profile.frame")}</span>
                <select
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                  value={frameStyle || "none"}
                  disabled={frameSaving}
                  onChange={(e) => onSaveFrameStyle?.(e.target.value)}
                >
                  <option value="none">{t("profile.frameNone")}</option>
                  <option value="emerald">{t("profile.frameEmerald")}</option>
                  <option value="gold">{t("profile.frameGold")}</option>
                  <option value="rainbow">{t("profile.frameRainbow")}</option>
                  <option value="ice">{t("profile.frameIce")}</option>
                  <option value="shadow">{t("profile.frameShadow")}</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-colors font-semibold"
        >
          {t("profile.close")}
        </button>
      </div>
    </div>
  );
};
