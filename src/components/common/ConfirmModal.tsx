import { useEffect } from "react";

export interface ConfirmModalProps {
  open?: boolean;
  message: string;
  title?: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmModal({
  open = true,
  message,
  title,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  const finalConfirmLabel = confirmLabel || confirmText || "Confirm";
  const finalCancelLabel = cancelLabel || cancelText || "Cancel";

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "confirm-modal-title" : undefined}
        aria-describedby="confirm-modal-desc"
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-5"
      >
        {title && (
          <h3 id="confirm-modal-title" className="text-lg font-bold text-gray-900 mb-2">
            {title}
          </h3>
        )}
        <p id="confirm-modal-desc" className="text-gray-800 mb-5">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
          >
            {finalCancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
          >
            {finalConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
