import React from "react";
import { Keyboard, CornerDownLeft } from "lucide-react";
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
    <div className="w-full card-duo p-5 sm:p-6 bg-white shadow-sm space-y-3">
      <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-500">
        <span className="flex items-center gap-1.5">
          <Keyboard className="w-4 h-4 text-emerald-600" />
          <span>{t("playQuiz.enterAnswer") || "Votre réponse :"}</span>
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
          <span>Appuyez sur</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-600">Entrée ↵</kbd>
        </span>
      </div>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={userAnswer}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isAnswered && onSubmit()}
          autoFocus
          disabled={isAnswered}
          className="w-full px-5 py-4 text-base sm:text-xl font-black text-slate-900 bg-slate-50 border-2 border-slate-200 border-b-4 focus:border-emerald-500 focus:bg-white rounded-2xl outline-none transition-all shadow-inner focus:ring-4 focus:ring-emerald-100/60 disabled:opacity-60 disabled:bg-slate-100"
          placeholder={t("playQuiz.enterAnswer") || "Tapez votre réponse ici..."}
        />

        {!isAnswered && userAnswer.trim().length > 0 && (
          <button
            type="button"
            onClick={onSubmit}
            className="absolute right-3 top-1/2 -translate-y-1/2 btn-duo btn-duo-green px-3 py-1.5 text-xs font-black flex items-center gap-1"
          >
            <span>Valider</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
