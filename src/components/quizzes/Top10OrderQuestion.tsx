import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
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
  const useTwoColumns = order.length >= 10;
  const allowDragAndDrop = true;

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const clone = [...order];
    const [moved] = clone.splice(fromIndex, 1);
    clone.splice(toIndex, 0, moved);
    onOrderChange(clone);
  };

  const moveItemToDropZone = (fromIndex: number, zoneIndex: number) => {
    // zoneIndex is insertion position in [0..order.length]
    const boundedZone = Math.max(0, Math.min(order.length, zoneIndex));
    moveItem(fromIndex, boundedZone);
  };

  const handleDragEnterDropZone = (zoneIndex: number) => {
    if (!allowDragAndDrop) return;
    setDropIndex(zoneIndex);
  };

  return (
    <div className="space-y-2">
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

      <div className={useTwoColumns ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "space-y-0"}>
        {(useTwoColumns ? [order.slice(0, 5), order.slice(5, 10)] : [order]).map(
          (columnItems, columnIndex) => (
            <div key={`col-${columnIndex}`} className="space-y-2">
              {useTwoColumns && (
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 px-1">
                  {columnIndex === 0 ? "1–5" : "6–10"}
                </p>
              )}
              {columnItems.map((item, idxInCol) => {
                const index = useTwoColumns ? columnIndex * 5 + idxInCol : idxInCol;
                return (
                  <div key={`${item}-${index}`}>
                    <div
                      onDragEnter={() => handleDragEnterDropZone(index)}
                      onDragOver={(event) => {
                        if (!allowDragAndDrop) return;
                        event.preventDefault();
                        handleDragEnterDropZone(index);
                      }}
                      onDrop={(event) => {
                        if (!allowDragAndDrop) return;
                        event.preventDefault();
                        const fromIndex = Number(event.dataTransfer.getData("text/plain"));
                        if (Number.isNaN(fromIndex)) return;
                        moveItemToDropZone(fromIndex, index);
                        setDragIndex(null);
                        setDropIndex(null);
                      }}
                      className={`mb-2 h-3 rounded-full transition-colors ${
                        dragIndex !== null && dropIndex === index
                          ? "bg-orange-400"
                          : "bg-orange-200/0"
                      }`}
                    />
          <div
            draggable={allowDragAndDrop}
            onDragStart={(event) => {
              if (!allowDragAndDrop) return;
              setDragIndex(index);
              event.dataTransfer.setData("text/plain", String(index));
              try {
                event.dataTransfer.effectAllowed = "move";
              } catch {
                /* ignore */
              }
            }}
            onDragEnd={() => {
              if (!allowDragAndDrop) return;
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
            className={`flex items-center gap-2 rounded-lg border bg-white p-3 transition-all select-none ${
              dragIndex === index
                ? "border-orange-300 opacity-80"
                : tapSelectedIndex === index
                ? "border-orange-400 ring-2 ring-orange-200"
                : "border-gray-200"
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-700">
              {index + 1}
            </div>
            <div className="flex flex-col gap-0.5 shrink-0">
              <button
                type="button"
                title={t("playQuiz.top10.moveUp")}
                onClick={(e) => {
                  e.stopPropagation();
                  if (index === 0) return;
                  moveItem(index, index - 1);
                }}
                disabled={index === 0}
                className="p-0.5 rounded border border-orange-200 text-orange-700 hover:bg-orange-50 disabled:opacity-30"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title={t("playQuiz.top10.moveDown")}
                onClick={(e) => {
                  e.stopPropagation();
                  if (index >= order.length - 1) return;
                  moveItem(index, index + 1);
                }}
                disabled={index >= order.length - 1}
                className="p-0.5 rounded border border-orange-200 text-orange-700 hover:bg-orange-50 disabled:opacity-30"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 text-gray-800 text-sm font-medium">{item}</div>
            <span className="hidden sm:inline text-[11px] text-gray-500">{t("playQuiz.top10.drag")}</span>
          </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
      <div
        onDragOver={(event) => {
          if (!allowDragAndDrop) return;
          event.preventDefault();
          setDropIndex(order.length);
        }}
        onDrop={(event) => {
          if (!allowDragAndDrop) return;
          event.preventDefault();
          const fromIndex = Number(event.dataTransfer.getData("text/plain"));
          if (Number.isNaN(fromIndex)) return;
          moveItemToDropZone(fromIndex, order.length);
          setDragIndex(null);
          setDropIndex(null);
        }}
        className={`h-2 rounded-full transition-colors ${
          allowDragAndDrop && dragIndex !== null && dropIndex === order.length
            ? "bg-orange-400"
            : "bg-transparent"
        }`}
      />
    </div>
  );
}
