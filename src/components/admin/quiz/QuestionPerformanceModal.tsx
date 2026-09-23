import React from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";
import type { Database } from "../../../lib/database.types";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface QuizWithCreator extends Quiz {
  creator?: Profile;
}

export interface QuestionPerformance {
  questionId: string;
  questionText: string;
  orderIndex: number;
  attempts: number;
  correct: number;
  successRate: number;
  averageTimeSeconds: number;
}

export interface QuizPerformanceSummary {
  quiz: QuizWithCreator;
  totalSessions: number;
  totalAnswers: number;
  overallSuccessRate: number;
  averageScore: number;
  averageAccuracy: number;
  questionPerformances: QuestionPerformance[];
}

interface QuestionPerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: QuizPerformanceSummary | null;
  loading: boolean;
}

export const QuestionPerformanceModal: React.FC<QuestionPerformanceModalProps> = ({
  isOpen,
  onClose,
  summary,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Performance des réponses"
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">
            Performance des réponses - {summary?.quiz.title || "Quiz"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            title="Fermer"
            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 overflow-auto">
          {loading || !summary ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3" />
              <p className="text-gray-500">Chargement des statistiques...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
                <div className="rounded-lg border p-3 bg-blue-50">
                  <p className="text-xs text-blue-700">Parties terminées</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {summary.totalSessions}
                  </p>
                </div>
                <div className="rounded-lg border p-3 bg-emerald-50">
                  <p className="text-xs text-emerald-700">Réponses total</p>
                  <p className="text-2xl font-bold text-emerald-800">
                    {summary.totalAnswers}
                  </p>
                </div>
                <div className="rounded-lg border p-3 bg-purple-50">
                  <p className="text-xs text-purple-700">Réussite globale</p>
                  <p className="text-2xl font-bold text-purple-800">
                    {summary.overallSuccessRate.toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-lg border p-3 bg-amber-50">
                  <p className="text-xs text-amber-700">Score moyen</p>
                  <p className="text-2xl font-bold text-amber-800">
                    {summary.averageScore.toFixed(1)}
                  </p>
                </div>
                <div className="rounded-lg border p-3 bg-rose-50">
                  <p className="text-xs text-rose-700">Précision moyenne</p>
                  <p className="text-2xl font-bold text-rose-800">
                    {summary.averageAccuracy.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                        Q#
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                        Question
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                        Tentatives
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                        Correctes
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                        Taux réussite
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                        Temps moyen
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">
                        État
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {summary.questionPerformances.map((q) => {
                      const isGood = q.successRate >= 70;
                      const isBad = q.successRate < 40;
                      return (
                        <tr key={q.questionId} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-700">
                            {q.orderIndex + 1}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-800">
                            {q.questionText}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700">
                            {q.attempts}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700">
                            {q.correct}
                          </td>
                          <td className="px-3 py-2 text-sm font-semibold text-gray-800">
                            {q.successRate.toFixed(1)}%
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700">
                            {q.averageTimeSeconds.toFixed(1)}s
                          </td>
                          <td className="px-3 py-2 text-sm">
                            {isGood ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full text-xs font-medium">
                                <CheckCircle2 className="w-3 h-3" />
                                Fonctionne bien
                              </span>
                            ) : isBad ? (
                              <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-2 py-1 rounded-full text-xs font-medium">
                                <XCircle className="w-3 h-3" />A améliorer
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-100 px-2 py-1 rounded-full text-xs font-medium">
                                Moyen
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
