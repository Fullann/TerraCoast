import React from "react";
import { Check, X, CheckCircle2, XCircle } from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";

interface TrueFalseQuestionViewProps {
  selectedOption: string;
  isAnswered: boolean;
  correctAnswer?: string;
  onSelectOption: (option: string, event: React.MouseEvent) => void;
}

export const TrueFalseQuestionView: React.FC<TrueFalseQuestionViewProps> = ({
  selectedOption,
  isAnswered,
  correctAnswer,
  onSelectOption,
}) => {
  const { t } = useLanguage();

  const trueLabel = t("createQuiz.trueFalse.true");
  const falseLabel = t("createQuiz.trueFalse.false");

  const isTrueCorrect = correctAnswer === trueLabel || correctAnswer === "Vrai";
  const isFalseCorrect = correctAnswer === falseLabel || correctAnswer === "Faux";

  const getCardStyle = (
    isThisCorrect: boolean,
    isThisSelected: boolean
  ) => {
    if (isAnswered) {
      if (isThisCorrect) {
        return "bg-emerald-50 text-emerald-950 border-emerald-500 border-b-emerald-700 shadow-md ring-2 ring-emerald-300/40 animate-duo-bounce";
      }
      if (isThisSelected && !isThisCorrect) {
        return "bg-rose-50 text-rose-950 border-rose-500 border-b-rose-700 shadow-md ring-2 ring-rose-300/40 animate-duo-wiggle";
      }
      return "opacity-50 bg-slate-50 text-slate-400 border-slate-200 border-b-slate-200 cursor-not-allowed";
    }

    if (isThisSelected) {
      return "bg-sky-50 text-sky-950 border-sky-400 border-b-sky-600 shadow-[0_4px_16px_rgba(28,176,246,0.18)] ring-2 ring-sky-300/60 translate-y-[1px] border-b-2";
    }

    return "bg-white text-slate-800 border-slate-200 border-b-slate-300 hover:border-slate-300 hover:bg-slate-50/70 hover:translate-y-[-1px] shadow-sm";
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* VRAI BUTTON */}
      <button
        type="button"
        onClick={(e) => onSelectOption(isTrueCorrect ? trueLabel : "Vrai", e)}
        disabled={isAnswered}
        className={`w-full min-h-[64px] p-5 sm:p-6 rounded-3xl border-2 border-b-4 transition-all duration-150 relative flex items-center justify-between gap-4 select-none active:translate-y-1 active:border-b-0 cursor-pointer ${getCardStyle(
          isTrueCorrect,
          selectedOption === trueLabel
        )}`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black border-2 border-b-4 ${
              isAnswered && isTrueCorrect
                ? "bg-[#58cc02] text-white border-[#46a302] border-b-[#3c8c02]"
                : selectedOption === trueLabel
                ? "bg-[#1cb0f6] text-white border-[#1899d6] border-b-[#1483b8]"
                : "bg-emerald-100 text-emerald-700 border-emerald-200 border-b-emerald-300"
            }`}
          >
            {isAnswered && isTrueCorrect ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <Check className="w-6 h-6 stroke-[3]" />
            )}
          </div>
          <span className="text-xl sm:text-2xl font-black tracking-tight">{trueLabel}</span>
        </div>

        <kbd className="hidden sm:inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-xs font-black text-slate-400 bg-slate-100 border border-slate-300 rounded-xl shadow-2xs select-none">
          1
        </kbd>
      </button>

      {/* FAUX BUTTON */}
      <button
        type="button"
        onClick={(e) => onSelectOption(isFalseCorrect ? falseLabel : "Faux", e)}
        disabled={isAnswered}
        className={`w-full min-h-[64px] p-5 sm:p-6 rounded-3xl border-2 border-b-4 transition-all duration-150 relative flex items-center justify-between gap-4 select-none active:translate-y-1 active:border-b-0 cursor-pointer ${getCardStyle(
          isFalseCorrect,
          selectedOption === falseLabel
        )}`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black border-2 border-b-4 ${
              isAnswered && isFalseCorrect
                ? "bg-[#58cc02] text-white border-[#46a302] border-b-[#3c8c02]"
                : isAnswered && selectedOption === falseLabel && !isFalseCorrect
                ? "bg-rose-500 text-white border-rose-600 border-b-rose-700"
                : selectedOption === falseLabel
                ? "bg-[#1cb0f6] text-white border-[#1899d6] border-b-[#1483b8]"
                : "bg-rose-100 text-rose-700 border-rose-200 border-b-rose-300"
            }`}
          >
            {isAnswered && isFalseCorrect ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : isAnswered && selectedOption === falseLabel && !isFalseCorrect ? (
              <XCircle className="w-6 h-6" />
            ) : (
              <X className="w-6 h-6 stroke-[3]" />
            )}
          </div>
          <span className="text-xl sm:text-2xl font-black tracking-tight">{falseLabel}</span>
        </div>

        <kbd className="hidden sm:inline-flex items-center justify-center min-w-[28px] h-7 px-2 text-xs font-black text-slate-400 bg-slate-100 border border-slate-300 rounded-xl shadow-2xs select-none">
          2
        </kbd>
      </button>
    </div>
  );
};
