import React, { useState } from "react";
import { ArrowLeft, Clock, Trophy, Flag, Volume2, VolumeX } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { isSoundEnabled, toggleSound } from "../../../lib/soundManager";
import type { QuizChallenge } from "./types";

interface QuizHeaderProps {
  onQuit: () => void;
  onReport?: () => void;
  trainingMode: boolean;
  totalScore: number;
  timeLeft: number;
  challenge: QuizChallenge | null;
  quizTitle?: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  progress: number;
}

export const QuizHeader: React.FC<QuizHeaderProps> = ({
  onQuit,
  onReport,
  trainingMode,
  totalScore,
  timeLeft,
  challenge,
  quizTitle,
  currentQuestionIndex,
  totalQuestions,
  progress,
}) => {
  const { t } = useLanguage();
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());

  const handleToggleSound = () => {
    const newState = toggleSound();
    setSoundOn(newState);
  };

  return (
    <div className="bg-white shadow-sm px-4 py-3">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onQuit}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">{t("playQuiz.quit")}</span>
            </button>
            {onReport && (
              <button
                type="button"
                onClick={onReport}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-amber-700 bg-gray-100 hover:bg-amber-50 transition-colors"
                title={t("playQuiz.report.buttonTitle") || "Signaler un problème"}
              >
                <Flag className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden md:inline">{t("playQuiz.report.button") || "Signaler"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleToggleSound}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 transition-colors"
              title={soundOn ? (t("sound.mute") || "Couper le son") : (t("sound.unmute") || "Activer le son")}
            >
              {soundOn ? (
                <Volume2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            {!trainingMode && (
              <>
                <div className="flex items-center space-x-2 px-3 py-2 bg-blue-100 rounded-lg">
                  <Trophy className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  <span className="font-bold text-blue-600 text-sm md:text-base">
                    {totalScore}
                  </span>
                </div>
                <div
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                    timeLeft <= 5 ? "bg-red-100" : "bg-gray-100"
                  }`}
                >
                  <Clock
                    className={`w-4 h-4 md:w-5 md:h-5 ${
                      timeLeft <= 5 ? "text-red-600" : "text-gray-600"
                    }`}
                  />
                  <span
                    className={`font-bold text-sm md:text-base ${
                      timeLeft <= 5 ? "text-red-600" : "text-gray-600"
                    }`}
                  >
                    {timeLeft}s
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {!trainingMode && challenge && (
          <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-emerald-900">
                  {t("challenge.title")}
                </p>
                <p className="text-sm text-emerald-800">
                  {t("challenge.subtitle")
                    .replace("{title}", quizTitle || "")
                    .replace("{score}", String(challenge.target_score))}
                  {challenge.from_profile?.pseudo
                    ? ` • ${challenge.from_profile.pseudo}`
                    : ""}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white text-emerald-700 border border-emerald-200">
                {challenge.status}
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-between text-xs md:text-sm text-gray-600 mb-2">
          <span>
            {t("playQuiz.question")} {currentQuestionIndex + 1} / {totalQuestions}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
