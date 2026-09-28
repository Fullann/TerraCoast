import {
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Plus,
  Clock,
  Star,
  CheckCircle2,
  ImageIcon,
} from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import type { QuestionItem } from "./types";
import { QuestionEditor } from "./QuestionEditor";

interface QuestionListProps {
  questions: QuestionItem[];
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  editingIndex?: number | null;
  editingQuestion?: QuestionItem | null;
  onEditingQuestionChange?: (updated: QuestionItem) => void;
  onSaveQuestion?: () => void;
  onCancelEdit?: () => void;
  onAddNew?: () => void;
  mode?: "inline" | "standalone";
}

const QUESTION_TYPE_CONFIG: Record<
  string,
  { label: string; emoji: string; color: string; bg: string; border: string }
> = {
  mcq: {
    label: "QCM 4 Choix",
    emoji: "🎯",
    color: "text-amber-800",
    bg: "bg-amber-100/90",
    border: "border-amber-300",
  },
  true_false: {
    label: "Vrai ou Faux",
    emoji: "⚖️",
    color: "text-purple-800",
    bg: "bg-purple-100/90",
    border: "border-purple-300",
  },
  text_free: {
    label: "Saisie Libre",
    emoji: "✍️",
    color: "text-emerald-800",
    bg: "bg-emerald-100/90",
    border: "border-emerald-300",
  },
  puzzle_map: {
    label: "Carte Puzzle",
    emoji: "🧩",
    color: "text-sky-800",
    bg: "bg-sky-100/90",
    border: "border-sky-300",
  },
  map_click: {
    label: "Clic Carte",
    emoji: "📍",
    color: "text-rose-800",
    bg: "bg-rose-100/90",
    border: "border-rose-300",
  },
  top10_order: {
    label: "Top 10 Ordre",
    emoji: "🏆",
    color: "text-indigo-800",
    bg: "bg-indigo-100/90",
    border: "border-indigo-300",
  },
  country_multi: {
    label: "Multi-Pays",
    emoji: "🌍",
    color: "text-teal-800",
    bg: "bg-teal-100/90",
    border: "border-teal-300",
  },
  single_answer: {
    label: "Réponse Unique",
    emoji: "⚡",
    color: "text-slate-800",
    bg: "bg-slate-100",
    border: "border-slate-300",
  },
};

export function QuestionList({
  questions,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  editingIndex = null,
  editingQuestion = null,
  onEditingQuestionChange,
  onSaveQuestion,
  onCancelEdit,
  onAddNew,
  mode = "standalone",
}: QuestionListProps) {
  const { t } = useLanguage();

  const totalPoints = questions.reduce(
    (sum, q) => sum + (Number(q.points) || 100),
    0
  );
  const estimatedMinutes = Math.max(1, Math.round((questions.length * 20) / 60));

  const getQuestionTypeInfo = (type: string) => {
    return (
      QUESTION_TYPE_CONFIG[type] || {
        label: t(`editQuiz.questionType.${type}` as any) || type,
        emoji: "❓",
        color: "text-slate-700",
        bg: "bg-slate-100",
        border: "border-slate-300",
      }
    );
  };

  const getAnswerSummary = (q: QuestionItem) => {
    if (q.question_type === "puzzle_map") {
      return t("createQuiz.puzzle.autoAnswerInfo");
    }
    if (q.question_type === "map_click") {
      return t("createQuiz.mapClick.autoAnswerInfo");
    }
    if (q.question_type === "top10_order") {
      return t("createQuiz.top10.autoExpectedOrderInfo");
    }
    if (q.question_type === "country_multi") {
      return t("createQuiz.countryMulti.autoAnswerInfo");
    }
    return `${t("createQuiz.answer")}: ${q.correct_answer}`;
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-5 sm:p-7 mb-6 overflow-hidden">
      {/* Header bar with live health counters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-orange-500/20">
              🧩
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                {t("createQuiz.questionsAdded")}{" "}
                <span className="text-emerald-600">({questions.length})</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Organisez et prévisualisez la séquence de votre défi
              </p>
            </div>
          </div>
        </div>

        {/* Live meters pills */}
        <div className="flex items-center flex-wrap gap-2">
          {questions.length > 0 && (
            <>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-black shadow-2xs">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{totalPoints} XP</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 border border-sky-200 rounded-xl text-sky-800 text-xs font-black shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-sky-600" />
                <span>~{estimatedMinutes} min</span>
              </div>
            </>
          )}
          {onAddNew && (
            <button
              type="button"
              onClick={onAddNew}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-sm border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 ml-auto sm:ml-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{t("editQuiz.addQuestion")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {questions.length === 0 ? (
        <div className="py-12 px-4 text-center max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-4xl shadow-inner border-2 border-emerald-200/60 animate-bounce">
            🎯
          </div>
          <h3 className="text-lg font-black text-slate-800 mb-1">
            Aucune question pour le moment
          </h3>
          <p className="text-sm text-slate-500 font-medium mb-4">
            {t("editQuiz.atLeastOneQuestion")} Choisissez un type (QCM, Carte, Vrai/Faux...) et ajoutez votre premier défi !
          </p>
        </div>
      ) : (
        /* Questions List */
        <div className="space-y-3.5 mt-5">
          {questions.map((q, index) => {
            const isBeingEditedInline =
              mode === "inline" &&
              editingIndex === index &&
              editingQuestion &&
              onEditingQuestionChange;

            if (isBeingEditedInline) {
              return (
                <div
                  key={q.id || index}
                  className="border-3 border-emerald-500 rounded-3xl p-5 sm:p-6 bg-emerald-50/30 shadow-xl shadow-emerald-500/10 transition-all"
                >
                  <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-emerald-200">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                        #{index + 1}
                      </span>
                      <span className="font-black text-emerald-900 text-base">
                        {t("createQuiz.editingQuestion").replace(
                          "{number}",
                          String(index + 1)
                        )}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                      ✏️ En cours de modification
                    </span>
                  </div>
                  <QuestionEditor
                    question={editingQuestion}
                    onChange={onEditingQuestionChange}
                    onSave={onSaveQuestion}
                    onCancel={onCancelEdit}
                    isEditing={true}
                    saveButtonLabel={t("common.save")}
                    cancelButtonLabel={t("common.cancel")}
                  />
                </div>
              );
            }

            const isHighlighted = editingIndex === index;
            const typeInfo = getQuestionTypeInfo(q.question_type);

            return (
              <div
                key={q.id || index}
                className={`p-4 sm:p-5 rounded-2xl border-2 transition-all relative group ${
                  isHighlighted
                    ? "border-sky-400 bg-sky-50/40 shadow-md ring-2 ring-sky-300"
                    : "border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Number + Details */}
                  <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                    {/* Gamified Number badge */}
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-slate-300 text-slate-800 font-black text-sm flex items-center justify-center shrink-0 shadow-2xs group-hover:from-emerald-100 group-hover:to-teal-100 group-hover:border-emerald-300 group-hover:text-emerald-800 transition-colors">
                      {index + 1}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-800 text-base leading-snug mb-1.5 break-words">
                        {q.question_text || "(Sans titre)"}
                      </p>

                      {/* Meta chips */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {/* Type Chip */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border font-black text-[11px] ${typeInfo.bg} ${typeInfo.color} ${typeInfo.border}`}
                        >
                          <span>{typeInfo.emoji}</span>
                          <span>{typeInfo.label}</span>
                        </span>

                        {/* XP Badge */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-black text-[11px]">
                          ⭐ {q.points || 100} XP
                        </span>

                        {/* Image badge */}
                        {q.image_url && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 font-bold text-[11px] border border-sky-200">
                            <ImageIcon className="w-3 h-3" />
                            <span>Photo</span>
                          </span>
                        )}
                      </div>

                      {/* Expected Answer preview */}
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50/80 px-3 py-1.5 rounded-xl border border-emerald-200/80 w-fit max-w-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{getAnswerSummary(q)}</span>
                      </div>

                      {/* MCQ preview options chips */}
                      {q.question_type === "mcq" &&
                        Array.isArray(q.options) &&
                        q.options.filter(Boolean).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {q.options
                              .filter((opt) => opt.trim())
                              .map((opt, optIdx) => {
                                const isCorrect =
                                  (q.correct_answers || []).includes(opt) ||
                                  q.correct_answer === opt;
                                return (
                                  <span
                                    key={optIdx}
                                    className={`text-[11px] px-2 py-0.5 rounded-md font-bold border ${
                                      isCorrect
                                        ? "bg-emerald-100 text-emerald-900 border-emerald-300 font-black"
                                        : "bg-slate-50 text-slate-600 border-slate-200"
                                    }`}
                                  >
                                    {isCorrect && "✓ "}
                                    {opt}
                                  </span>
                                );
                              })}
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Right: Tactile Action Controls */}
                  <div className="flex items-center gap-1 shrink-0 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => onMoveUp(index)}
                      disabled={index === 0}
                      className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-600"
                      title={t("a11y.moveUp")}
                      aria-label={t("a11y.moveUp")}
                    >
                      <ArrowUp className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveDown(index)}
                      disabled={index === questions.length - 1}
                      className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-600"
                      title={t("a11y.moveDown")}
                      aria-label={t("a11y.moveDown")}
                    >
                      <ArrowDown className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(index)}
                      className="p-2 text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-xl transition-all"
                      title={t("quiz.edit")}
                      aria-label={t("quiz.edit")}
                    >
                      <Pencil className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(index)}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all"
                      title={t("quiz.delete")}
                      aria-label={t("quiz.delete")}
                    >
                      <Trash2 className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
