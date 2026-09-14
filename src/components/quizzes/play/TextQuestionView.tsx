import React from "react";
import { useLanguage } from "../../../contexts/LanguageContext";

interface TextQuestionViewProps {
  userAnswer: string;
  isAnswered: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export const TextQuestionView: React.FC<TextQuestionViewProps> = ({
  userAnswer,
  isAnswered,
  onChange,
  onSubmit,
  inputRef,
}) => {
  const { t } = useLanguage();

  return (
    <input
      ref={inputRef}
      type="text"
      value={userAnswer}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && !isAnswered && onSubmit()}
      autoFocus
      disabled={isAnswered}
      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none disabled:bg-gray-100"
      placeholder={t("playQuiz.enterAnswer")}
    />
  );
};
