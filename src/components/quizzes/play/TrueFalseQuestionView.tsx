import React from "react";
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

  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        onClick={(e) =>
          onSelectOption(isTrueCorrect ? trueLabel : "Vrai", e)
        }
        disabled={isAnswered}
        className={`p-6 rounded-lg border-2 transition-all font-bold text-lg ${
          isAnswered && isTrueCorrect
            ? "border-green-500 bg-green-50 text-green-700"
            : isAnswered && selectedOption === trueLabel && !isTrueCorrect
            ? "border-red-500 bg-red-50 text-red-700"
            : selectedOption === trueLabel
            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
            : "border-gray-200 hover:border-emerald-300"
        } ${isAnswered ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className="flex items-center justify-between gap-2">
          <span>✓ {trueLabel}</span>
          <kbd className="hidden sm:inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 text-[11px] font-bold text-gray-400 bg-white/90 border border-gray-300 rounded shadow-xs shrink-0 select-none">
            1
          </kbd>
        </div>
      </button>
      <button
        onClick={(e) =>
          onSelectOption(isFalseCorrect ? falseLabel : "Faux", e)
        }
        disabled={isAnswered}
        className={`p-6 rounded-lg border-2 transition-all font-bold text-lg ${
          isAnswered && isFalseCorrect
            ? "border-green-500 bg-green-50 text-green-700"
            : isAnswered && selectedOption === falseLabel && !isFalseCorrect
            ? "border-red-500 bg-red-50 text-red-700"
            : selectedOption === falseLabel
            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
            : "border-gray-200 hover:border-emerald-300"
        } ${isAnswered ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className="flex items-center justify-between gap-2">
          <span>✗ {falseLabel}</span>
          <kbd className="hidden sm:inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 text-[11px] font-bold text-gray-400 bg-white/90 border border-gray-300 rounded shadow-xs shrink-0 select-none">
            2
          </kbd>
        </div>
      </button>
    </div>
  );
};
