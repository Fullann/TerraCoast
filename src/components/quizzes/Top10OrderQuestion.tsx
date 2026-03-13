import { useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";

interface Top10OrderQuestionProps {
  order: string[];
  onOrderChange: (next: string[]) => void;
}

export function Top10OrderQuestion({
  order,
  onOrderChange,
}: Top10OrderQuestionProps) {
  const { t } = useLanguage();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [tapSelectedIndex, setTapSelectedIndex] = useState<number | null>(null);

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const clone = [...order];
    const [moved] = clone.splice(fromIndex, 1);
    clone.splice(toIndex, 0, moved);
    onOrderChange(clone);
  };

  return (
    <div className="space-y-3">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
        <p className="text-sm text-orange-800">
          {t("playQuiz.top10.instructions")}
        </p>
        <p className="text-xs text-orange-700 mt-2">
          {t("playQuiz.top10.dropPreview")}
        </p>
        <p className="text-xs text-orange-700 mt-1">
          {t("playQuiz.top10.mobileHint")}
        </p>
      </div>

      {order.map((item, index) => (
        <div key={`${item}-${index}`}>
          {dragIndex !== null && dropIndex === index && (
            <div className="h-1.5 rounded-full bg-orange-400 mb-2" />
          )}
          <div
            draggable
            onDragStart={(event) => {
              setDragIndex(index);
              event.dataTransfer.setData("text/plain", String(index));
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDropIndex(index);
            }}
            onDragEnd={() => {
              setDragIndex(null);
              setDropIndex(null);
            }}
            onDrop={(event) => {
              const fromIndex = Number(event.dataTransfer.getData("text/plain"));
              if (Number.isNaN(fromIndex)) return;
              moveItem(fromIndex, index);
              setDragIndex(null);
              setDropIndex(null);
            }}
            onClick={() => {
              if (dragIndex !== null) return;
              if (tapSelectedIndex === null) {
                setTapSelectedIndex(index);
                return;
              }
              if (tapSelectedIndex === index) {
                setTapSelectedIndex(null);
                return;
              }
              moveItem(tapSelectedIndex, index);
              setTapSelectedIndex(null);
            }}
            className={`flex items-center gap-3 rounded-lg border bg-white p-3 transition-all ${
              dragIndex === index
                ? "border-orange-300 opacity-80"
                : tapSelectedIndex === index
                ? "border-orange-400 ring-2 ring-orange-200"
                : "border-gray-200"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
              {index + 1}
            </div>
            <div className="flex-1 text-gray-800 font-medium">{item}</div>
            <span className="text-xs text-gray-500">{t("playQuiz.top10.drag")}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
