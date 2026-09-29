import { ArrowLeft, Clock, Trophy, Flag, Volume2, VolumeX, Radio } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useRadioGlobe } from "../../../contexts/RadioGlobeContext";
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
  lives?: number;
  maxLives?: number;
  streakFreezes?: number;
  isDoubleXp?: boolean;
  onRefillHearts?: () => void;
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
  lives,
  maxLives = 5,
  streakFreezes = 0,
  isDoubleXp = false,
  onRefillHearts,
}) => {
  const { t } = useLanguage();
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const { isPlaying, togglePlay, currentStation, currentCountry } = useRadioGlobe();

  const handleToggleSound = () => {
    const newState = toggleSound();
    setSoundOn(newState);
  };

  return (
    <div className="bg-white/95 backdrop-blur-md border-b-2 border-slate-200/80 sticky top-0 z-30 px-4 py-3 shadow-xs">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-3 gap-2">
          {/* Action buttons (Quit, Report, Sound, Radio) */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <button
              type="button"
              onClick={onQuit}
              className="btn-duo btn-duo-white px-3 py-1.5 text-xs font-black text-slate-600 hover:text-slate-800 shadow-xs"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5 text-slate-500" />
              <span className="hidden sm:inline">{t("playQuiz.quit")}</span>
            </button>

            {onReport && (
              <button
                type="button"
                onClick={onReport}
                className="btn-duo btn-duo-white px-2.5 py-1.5 text-xs font-black text-amber-700 hover:text-amber-800 border-amber-200/80 hover:bg-amber-50 shadow-xs"
                title={t("playQuiz.report.buttonTitle") || "Signaler un problème"}
              >
                <Flag className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden md:inline">{t("playQuiz.report.button") || "Signaler"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleSound}
              className="btn-duo btn-duo-white p-1.5 text-slate-600 hover:text-slate-800 shadow-xs"
              title={soundOn ? t("sound.mute") : t("sound.unmute")}
            >
              {soundOn ? (
                <Volume2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Radio Globe Toggle */}
            <button
              type="button"
              onClick={togglePlay}
              className={`btn-duo px-2.5 py-1.5 text-xs font-black shadow-xs transition-all ${
                isPlaying
                  ? "btn-duo-teal bg-teal-500 text-white border-b-4 border-teal-700"
                  : "btn-duo-white text-slate-600"
              }`}
              title={
                isPlaying
                  ? `Radio active : ${currentStation.name} (${currentCountry?.name})`
                  : "Activer la Radio Globe & Ambiances"
              }
            >
              <Radio className={`w-3.5 h-3.5 ${isPlaying ? "text-white" : "text-emerald-600"}`} />
              <span className="hidden sm:inline">
                {isPlaying ? currentCountry?.flag || "📻" : "Radio"}
              </span>
              {isPlaying && (
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              )}
            </button>
          </div>

          {/* Right counters: Hearts, Boosters, Score & Timer */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
            {/* Boosters actifs */}
            {streakFreezes > 0 && (
              <span
                className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 text-xs font-black shadow-2xs"
                title={`${streakFreezes} Gel(s) de Flamme actif(s) pour protéger votre série 🧊`}
              >
                🧊 Gel
              </span>
            )}

            {isDoubleXp && (
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-400 text-amber-950 border border-amber-300 text-xs font-black shadow-xs animate-pulse"
                title="Booster Double XP actif ! ⚡"
              >
                ⚡ 2X
              </span>
            )}



            {!trainingMode ? (
              <>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-950 rounded-2xl border-2 border-amber-300 border-b-4 shadow-xs">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="font-black text-sm md:text-base">
                    {totalScore} <span className="text-xs font-bold text-amber-700">pts</span>
                  </span>
                </div>

                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border-2 border-b-4 transition-all shadow-xs ${
                    timeLeft <= 5
                      ? "bg-rose-50 text-rose-700 border-rose-400 border-b-rose-600 animate-duo-bounce"
                      : "bg-sky-50 text-sky-900 border-sky-300 border-b-sky-500"
                  }`}
                >
                  <Clock
                    className={`w-4 h-4 ${
                      timeLeft <= 5 ? "text-rose-600" : "text-sky-600"
                    }`}
                  />
                  <span className="font-black text-sm md:text-base">
                    {timeLeft}s
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border-2 border-emerald-300 border-b-4 bg-emerald-50 text-emerald-800 font-black text-xs sm:text-sm shadow-xs animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Mode Zen 🧘</span>
              </div>
            )}
          </div>
        </div>

        {!trainingMode && challenge && (
          <div className="mb-3 rounded-2xl border-2 border-emerald-300 border-b-4 bg-emerald-50/90 px-4 py-3 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-emerald-900">
                  {t("challenge.title")}
                </p>
                <p className="text-sm font-bold text-emerald-800">
                  {t("challenge.subtitle")
                    .replace("{title}", quizTitle || "")
                    .replace("{score}", String(challenge.target_score))}
                  {challenge.from_profile?.pseudo
                    ? ` • ${challenge.from_profile.pseudo}`
                    : ""}
                </p>
              </div>
              <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-white text-emerald-700 border border-emerald-200 shadow-xs">
                {challenge.status}
              </span>
            </div>
          </div>
        )}

        {/* Tactile Progress bar and Question Counter */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-black text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>
                {t("playQuiz.question")} {currentQuestionIndex + 1} / {totalQuestions}
              </span>
            </span>
            <span className="text-emerald-700 font-extrabold">{Math.round(progress)}%</span>
          </div>

          <div className="h-3.5 bg-slate-200/90 rounded-full p-0.5 border border-slate-300 shadow-inner relative overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-400 via-emerald-500 to-[#58cc02] shadow-[0_0_10px_rgba(88,204,2,0.4)] transition-all duration-300 relative"
              style={{ width: `${Math.max(5, progress)}%` }}
            >
              {/* Glossy shine reflex */}
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/35 rounded-t-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
