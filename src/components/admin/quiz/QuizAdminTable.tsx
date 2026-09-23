import React, { Fragment } from "react";
import {
  MapPin,
  Flag,
  User,
  Edit2,
  Copy,
  BarChart3,
  BookOpen,
  Eye,
  EyeOff,
  RotateCcw,
  Download,
  Trash2,
} from "lucide-react";
import type { QuizWithCreator } from "./QuestionPerformanceModal";
import type {
  CategoryItem,
  DifficultyItem,
} from "../../../lib/queries/quizMetadataQueries";

interface QuizAdminTableProps {
  loading: boolean;
  quizzes: QuizWithCreator[];
  categories?: CategoryItem[];
  difficulties?: DifficultyItem[];
  onNavigateEdit: (quizId: string) => void;
  onNavigateProfile: (userId: string) => void;
  onDuplicate: (quiz: QuizWithCreator) => void;
  onPerformance: (quiz: QuizWithCreator) => void;
  onToggleVisibility: (quizId: string, isPublic: boolean, isGlobal: boolean) => void;
  onResetStats: (quizId: string, quizTitle: string) => void;
  onExport: (quiz: QuizWithCreator) => void;
  onDelete: (quiz: QuizWithCreator) => void;
  onOpenInlineLocation: (quiz: QuizWithCreator) => void;
  inlineLocationQuizId: string | null;
  inlineLocationLat: string;
  inlineLocationLng: string;
  onInlineLocationLatChange: (val: string) => void;
  onInlineLocationLngChange: (val: string) => void;
  onSaveInlineLocation: () => void;
  onCancelInlineLocation: () => void;
  savingInlineLocation: boolean;
}

export const QuizAdminTable: React.FC<QuizAdminTableProps> = ({
  loading,
  quizzes,
  categories,
  difficulties,
  onNavigateEdit,
  onNavigateProfile,
  onDuplicate,
  onPerformance,
  onToggleVisibility,
  onResetStats,
  onExport,
  onDelete,
  onOpenInlineLocation,
  inlineLocationQuizId,
  inlineLocationLat,
  inlineLocationLng,
  onInlineLocationLatChange,
  onInlineLocationLngChange,
  onSaveInlineLocation,
  onCancelInlineLocation,
  savingInlineLocation,
}) => {
  const getCategoryLabel = (name: string) => {
    const found = categories?.find((c) => c.name === name);
    return found?.label || name;
  };

  const getDifficultyInfo = (name: string) => {
    const found = difficulties?.find((d) => d.name === name);
    const label =
      found?.label ||
      (name === "easy"
        ? "Facile"
        : name === "medium"
        ? "Moyen"
        : name === "hard"
        ? "Difficile"
        : name);
    const color =
      found?.color ||
      (name === "easy"
        ? "green"
        : name === "medium"
        ? "yellow"
        : "red");
    return { label, color };
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Chargement...</div>;
  }

  if (quizzes.length === 0) {
    return <div className="p-8 text-center text-gray-500">Aucun quiz trouvé</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
              Titre
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
              Créateur
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
              Catégorie
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
              Difficulté
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
              Parties
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
              Score moy.
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
              Statut
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {quizzes.map((quiz) => (
            <Fragment key={`quiz-row-wrap-${quiz.id}`}>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-semibold text-gray-800">{quiz.title}</p>
                  {quiz.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {quiz.description.substring(0, 50)}
                      {quiz.description.length > 50 ? "..." : ""}
                    </p>
                  )}
                  {(quiz.location_lat === null || quiz.location_lng === null) && (
                    <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>Sans localisation</span>
                    </span>
                  )}
                  {quiz.is_reported && (
                    <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 mt-1">
                      <Flag className="w-3 h-3" />
                      <span>{quiz.report_count} signalement(s)</span>
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {quiz.creator ? (
                    <button
                      type="button"
                      onClick={() => onNavigateProfile(quiz.creator!.id)}
                      className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {quiz.creator.pseudo}
                      </span>
                    </button>
                  ) : (
                    <span className="text-sm text-gray-400">Inconnu</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600 capitalize">
                    {getCategoryLabel(quiz.category)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {(() => {
                    const { label, color } = getDifficultyInfo(quiz.difficulty);
                    const colorClass =
                      color === "green"
                        ? "bg-green-100 text-green-700"
                        : color === "yellow"
                        ? "bg-yellow-100 text-yellow-700"
                        : color === "red"
                        ? "bg-red-100 text-red-700"
                        : color === "purple"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-700";
                    return (
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}
                      >
                        {label}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-gray-800">
                    {quiz.total_plays}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-gray-800">
                    {quiz.average_score ? quiz.average_score.toFixed(1) : "N/A"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      quiz.is_global
                        ? "bg-blue-100 text-blue-700"
                        : quiz.is_public
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {quiz.is_global
                      ? "Global"
                      : quiz.is_public
                      ? "Public"
                      : "Privé"}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => onNavigateEdit(quiz.id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicate(quiz)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Dupliquer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onPerformance(quiz)}
                      className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Analyser les réponses"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onToggleVisibility(quiz.id, quiz.is_public, quiz.is_global)
                      }
                      className={`p-2 rounded-lg transition-colors ${
                        quiz.is_global
                          ? "text-blue-600 hover:bg-blue-50"
                          : quiz.is_public
                          ? "text-green-600 hover:bg-green-50"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                      title={
                        quiz.is_global
                          ? "Global → Privé"
                          : quiz.is_public
                          ? "Public → Global"
                          : "Privé → Public"
                      }
                    >
                      {quiz.is_global ? (
                        <BookOpen className="w-4 h-4" />
                      ) : quiz.is_public ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>

                    {(quiz.location_lat === null || quiz.location_lng === null) && (
                      <button
                        type="button"
                        onClick={() => onOpenInlineLocation(quiz)}
                        className="p-2 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Corriger localisation"
                      >
                        <MapPin className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onResetStats(quiz.id, quiz.title)}
                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Réinitialiser les statistiques"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onExport(quiz)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Exporter JSON"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(quiz)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
              {inlineLocationQuizId === quiz.id && (
                <tr key={`${quiz.id}-inline-location`} className="bg-amber-50/60">
                  <td colSpan={8} className="px-6 py-3">
                    <div className="flex flex-col md:flex-row md:items-end gap-3">
                      <div>
                        <label className="block text-xs text-gray-700 mb-1">
                          Latitude
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          min={-90}
                          max={90}
                          value={inlineLocationLat}
                          onChange={(e) => onInlineLocationLatChange(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Ex: 46.2044"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-700 mb-1">
                          Longitude
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          min={-180}
                          max={180}
                          value={inlineLocationLng}
                          onChange={(e) => onInlineLocationLngChange(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Ex: 6.1432"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={onSaveInlineLocation}
                          disabled={savingInlineLocation}
                          className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                        >
                          Enregistrer
                        </button>
                        <button
                          type="button"
                          onClick={onCancelInlineLocation}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};
