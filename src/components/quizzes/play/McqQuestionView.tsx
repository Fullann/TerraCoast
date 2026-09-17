import React from "react";
import { Lightbulb } from "lucide-react";
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
    <>
      {showHint && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <Lightbulb className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
          <span>{t("playQuiz.mcqDoubleClickHint")}</span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {options.map((option: string, index: number) => {
          const imageUrl = optionImages?.[option];
          const isCorrect =
            correctAnswers && correctAnswers.length > 0
              ? correctAnswers.includes(option)
              : option === correctAnswer;

          return (
            <button
              key={index}
              onClick={(e) => onSelectOption(option, e)}
              disabled={isAnswered}
              className={`p-2 md:p-4 rounded-lg border-2 transition-all text-left ${
                isAnswered && isCorrect
                  ? "border-green-500 bg-green-50"
                  : isAnswered && option === selectedOption && !isCorrect
                  ? "border-red-500 bg-red-50"
                  : selectedOption === option
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-gray-200 hover:border-emerald-300"
              } ${isAnswered ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              {imageUrl && (
                <div className="mb-3 flex justify-center">
                  <img
                    src={imageUrl}
                    alt={option}
                    className="max-w-full h-20 md:h-40 rounded object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-center sm:text-left block text-sm md:text-base flex-1">
                  {option}
                </span>
                <kbd className="hidden sm:inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 text-[11px] font-bold text-gray-400 bg-gray-100 border border-gray-300 rounded shadow-xs shrink-0 select-none">
                  {index + 1}
                </kbd>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
};
