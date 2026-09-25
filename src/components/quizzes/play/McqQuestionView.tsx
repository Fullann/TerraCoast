import React from "react";
import { Lightbulb, CheckCircle2, XCircle } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";

interface McqQuestionViewProps {
  options: string[];
  optionImages?: Record<string, string> | null;
  selectedOption: string;
  isAnswered: boolean;
  correctAnswer?: string;
  correctAnswers?: string[] | null;
  onSelectOption: (option: string, event: React.MouseEvent) => void;
  showHint?: boolean;
}

export const McqQuestionView: React.FC<McqQuestionViewProps> = ({
  options,
  optionImages,
  selectedOption,
  isAnswered,
  correctAnswer,
  correctAnswers,
  onSelectOption,
  showHint,
}) => {
  const { t } = useLanguage();

  return (
    <div className="w-full space-y-4">
      {showHint && (
        <div className="flex items-center gap-2.5 rounded-2xl border-2 border-amber-300 border-b-4 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-xs animate-slide-in-right">
          <Lightbulb className="w-5 h-5 shrink-0 text-amber-600" />
          <span className="font-bold">{t("playQuiz.mcqDoubleClickHint")}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        {options.map((option: string, index: number) => {
          const letter = String.fromCharCode(65 + index); // A, B, C, D
          const imageUrl = optionImages?.[option];
          const isSelected = selectedOption === option;
          const isCorrect =
            correctAnswers && correctAnswers.length > 0
              ? correctAnswers.includes(option)
              : option === correctAnswer;

          // Determine tactile state styles
          let cardStyle =
            "bg-white text-slate-800 border-slate-200 border-b-slate-300 hover:border-slate-300 hover:bg-slate-50/70 hover:translate-y-[-1px] shadow-sm";
          let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200 border-b-slate-300";

          if (isAnswered) {
            if (isCorrect) {
              cardStyle =
                "bg-emerald-50 text-emerald-950 border-emerald-500 border-b-emerald-700 shadow-md ring-2 ring-emerald-300/40 animate-duo-bounce";
              badgeStyle = "bg-[#58cc02] text-white border-[#46a302] border-b-[#3c8c02]";
            } else if (isSelected && !isCorrect) {
              cardStyle =
                "bg-rose-50 text-rose-950 border-rose-500 border-b-rose-700 shadow-md ring-2 ring-rose-300/40 animate-duo-wiggle";
              badgeStyle = "bg-rose-500 text-white border-rose-600 border-b-rose-700";
            } else {
              cardStyle = "opacity-50 bg-slate-50 text-slate-400 border-slate-200 border-b-slate-200 cursor-not-allowed";
              badgeStyle = "bg-slate-100 text-slate-400 border-slate-200 border-b-slate-200";
            }
          } else if (isSelected) {
            cardStyle =
              "bg-sky-50 text-sky-950 border-sky-400 border-b-sky-600 shadow-[0_4px_16px_rgba(28,176,246,0.18)] ring-2 ring-sky-300/60 translate-y-[1px] border-b-2";
            badgeStyle = "bg-[#1cb0f6] text-white border-[#1899d6] border-b-[#1483b8]";
          }

          return (
            <button
              key={index}
              type="button"
              onClick={(e) => onSelectOption(option, e)}
              disabled={isAnswered}
              className={`group w-full text-left p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 border-b-4 transition-all duration-150 relative flex flex-col justify-between gap-3 select-none active:translate-y-1 active:border-b-2 cursor-pointer ${cardStyle}`}
            >
              {imageUrl && (
                <div className="w-full flex justify-center py-2 bg-slate-50/70 rounded-xl border border-slate-100 mb-1">
                  <img
                    src={imageUrl}
                    alt={option}
                    className="max-h-24 sm:max-h-36 object-contain rounded-lg transition-transform group-hover:scale-105 duration-200"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}

              <div className="flex items-center gap-3.5 sm:gap-4 w-full">
                {/* 3D Tactile Letter Badge (A, B, C, D) */}
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base flex items-center justify-center shrink-0 border-2 border-b-4 transition-all ${badgeStyle}`}
                >
                  {isAnswered && isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : isAnswered && isSelected && !isCorrect ? (
                    <XCircle className="w-5 h-5 text-white" />
                  ) : (
                    <span>{letter}</span>
                  )}
                </div>

                {/* Option Text */}
                <span className="font-extrabold text-sm sm:text-base md:text-lg flex-1 leading-snug tracking-tight">
                  {option}
                </span>

                {/* Keyboard Shortcut Key indicator */}
                <kbd className="hidden sm:inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-black text-slate-400 bg-slate-100/90 border border-slate-300 rounded-lg shadow-2xs shrink-0 select-none group-hover:border-slate-400">
                  {index + 1}
                </kbd>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
