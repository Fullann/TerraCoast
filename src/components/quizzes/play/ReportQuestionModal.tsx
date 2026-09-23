import React, { useState } from "react";
import { Flag, X, Send } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useNotifications } from "../../../contexts/NotificationContext";

interface ReportQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: string;
  quizTitle: string;
  questionId?: string;
  questionIndex: number;
  totalQuestions: number;
  questionText: string;
  questionType: string;
}

export const ReportQuestionModal: React.FC<ReportQuestionModalProps> = ({
  isOpen,
  onClose,
  quizId,
  quizTitle,
  questionIndex,
  totalQuestions,
  questionText,
  questionType,
}) => {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const { showAppNotification } = useNotifications();

  const [reason, setReason] = useState<string>("factual");
  const [details, setDetails] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const reasonOptions = [
    { id: "factual", label: t("playQuiz.report.reasons.factual") || "Erreur factuelle / Réponse fausse" },
    { id: "typo", label: t("playQuiz.report.reasons.typo") || "Faute d'orthographe ou de traduction" },
    { id: "broken_media", label: t("playQuiz.report.reasons.brokenMedia") || "Image manquante ou carte incorrecte" },
    { id: "inappropriate", label: t("playQuiz.report.reasons.inappropriate") || "Contenu inapproprié ou offensant" },
    { id: "other", label: t("playQuiz.report.reasons.other") || "Autre problème" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) {
      showAppNotification({
        type: "error",
        message: t("playQuiz.report.loginRequired") || "Tu dois être connecté pour signaler une question.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const selectedReasonObj = reasonOptions.find((r) => r.id === reason);
      const reasonLabel = selectedReasonObj ? selectedReasonObj.label : reason;

      const descriptionSummary = `[Question #${questionIndex + 1} (${questionType}) : "${questionText.slice(0, 100)}"] ${details.trim()}`;

      const { error: reportError } = await supabase.from("reports").insert({
        reporter_id: profile.id,
        quiz_id: quizId,
        reason: reasonLabel,
        description: descriptionSummary,
        status: "pending",
      });

      if (reportError) throw reportError;

      // Flag the quiz as reported
      await supabase
        .from("quizzes")
        .update({ is_reported: true })
        .eq("id", quizId);

      showAppNotification({
        type: "success",
        message: t("playQuiz.report.success") || "Signalement envoyé aux administrateurs. Merci pour ton aide !",
      });
      setDetails("");
      setReason("factual");
      onClose();
    } catch (err: any) {
      showAppNotification({
        type: "error",
        message: "Erreur lors du signalement: " + (err.message || String(err)),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">
                {t("playQuiz.report.title") || "Signaler un problème"}
              </h3>
              <p className="text-xs text-gray-500 truncate max-w-xs">{quizTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-white/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Question preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-xs text-gray-600">
            <span className="font-semibold text-gray-700 block mb-1">
              {`${t("playQuiz.report.questionNumber") || "Question"} ${questionIndex + 1} / ${totalQuestions}`}
            </span>
            <p className="italic text-gray-800 line-clamp-2">
              "{questionText || "Question sans intitulé"}"
            </p>
          </div>

          {/* Reason radio selection */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              {t("playQuiz.report.reasonLabel") || "Quel est le problème ?"}
            </label>
            <div className="space-y-2">
              {reasonOptions.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-sm cursor-pointer transition-all ${
                    reason === opt.id
                      ? "border-amber-500 bg-amber-50/50 text-amber-950 shadow-xs font-medium"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={opt.id}
                    checked={reason === opt.id}
                    onChange={(e) => setReason(e.target.value)}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Details input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              {t("playQuiz.report.detailsLabel") || "Précisions (optionnel)"}
            </label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={
                t("playQuiz.report.detailsPlaceholder") ||
                "Explique brièvement le problème pour aider les modérateurs..."
              }
              className="w-full text-sm border border-gray-300 rounded-xl p-3 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium text-sm transition-colors"
            >
              {t("playQuiz.report.cancel") || "Annuler"}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>
                {submitting
                  ? t("playQuiz.report.sending") || "Envoi..."
                  : t("playQuiz.report.submit") || "Envoyer"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
