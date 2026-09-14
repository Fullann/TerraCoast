import {
  ArrowUp,
  ArrowDown,
  CreditCard as Edit,
  Trash2,
  Plus,
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

  const getQuestionTypeLabel = (type: string) => {
    if (type === "puzzle_map") return t("editQuiz.questionType.puzzle_map");
    if (type === "top10_order") return t("editQuiz.questionType.top10_order");
    if (type === "country_multi") return t("createQuiz.countryMulti.typeLabel");
    return t(`editQuiz.questionType.${type}` as any);
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
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          {t("createQuiz.questionsAdded")} ({questions.length})
        </h2>
        {onAddNew && (
          <button
            type="button"
            onClick={onAddNew}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            {t("editQuiz.addQuestion")}
          </button>
        )}
      </div>

      {questions.length === 0 ? (
        <p className="text-gray-500 text-center py-6">
          {t("editQuiz.atLeastOneQuestion")}
        </p>
      ) : (
        <div className="space-y-4">
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
                  className="border-2 border-emerald-500 rounded-lg p-6 bg-emerald-50/20"
                >
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-emerald-200">
                    <span className="font-semibold text-emerald-800">
                      {t("createQuiz.editingQuestion").replace(
                        "{number}",
                        String(index + 1)
                      )}
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

            return (
              <div
                key={q.id || index}
                className={`p-4 border-2 rounded-lg transition-all ${
                  isHighlighted
                    ? "border-blue-400 bg-blue-50/30"
                    : "border-gray-200 hover:border-emerald-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 mb-1">
                      {index + 1}. {q.question_text || "(Sans titre)"}
                    </p>
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      {q.image_url && (
                        <span className="text-blue-600">
                          📷 {t("editQuiz.imageIncluded")}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {getQuestionTypeLabel(q.question_type)}
                      </span>
                      <span>
                        {q.points} {t("home.pts")}
                      </span>
                    </div>
                    <p className="text-sm text-emerald-700 mt-2">
                      {getAnswerSummary(q)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      type="button"
                      onClick={() => onMoveUp(index)}
                      disabled={index === 0}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title={t("a11y.moveUp")}
                      aria-label={t("a11y.moveUp")}
                    >
                      <ArrowUp className="w-5 h-5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveDown(index)}
                      disabled={index === questions.length - 1}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title={t("a11y.moveDown")}
                      aria-label={t("a11y.moveDown")}
                    >
                      <ArrowDown className="w-5 h-5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(index)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title={t("quiz.edit")}
                      aria-label={t("quiz.edit")}
                    >
                      <Edit className="w-5 h-5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title={t("quiz.delete")}
                      aria-label={t("quiz.delete")}
                    >
                      <Trash2 className="w-5 h-5" aria-hidden="true" />
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
