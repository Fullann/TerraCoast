import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { languageNames, Language } from "../../../i18n/translations";
import { ImageDropzone } from "../ImageDropzone";
import {
  useCategoriesQuery,
  useDifficultiesQuery,
  useQuizTypesQuery,
} from "../../../lib/queries/quizMetadataQueries";
import type { QuizFormData, QuizCategory, Difficulty } from "./types";

interface QuizGeneralSettingsProps {
  formData: QuizFormData;
  onChange: <K extends keyof QuizFormData>(
    field: K,
    value: QuizFormData[K]
  ) => void;
  isEditMode?: boolean;
  onMakePrivate?: () => void;
}

export function QuizGeneralSettings({
  formData,
  onChange,
  isEditMode = false,
  onMakePrivate,
}: QuizGeneralSettingsProps) {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [currentTag, setCurrentTag] = useState("");

  const { data: categories = [] } = useCategoriesQuery();
  const { data: difficulties = [] } = useDifficultiesQuery();
  const { data: quizTypes = [] } = useQuizTypesQuery();

  // If initial category/difficulty are empty and query resolves, set defaults if not set
  useEffect(() => {
    if (!formData.category && categories.length > 0) {
      onChange("category", categories[0].name as QuizCategory);
    }
  }, [categories, formData.category, onChange]);

  useEffect(() => {
    if (!formData.difficulty && difficulties.length > 0) {
      onChange("difficulty", (difficulties[0].name || "medium") as Difficulty);
    }
  }, [difficulties, formData.difficulty, onChange]);

  const addTag = () => {
    const trimmedTag = currentTag.trim().toLowerCase();
    if (
      trimmedTag &&
      !formData.tags.includes(trimmedTag) &&
      formData.tags.length < 10
    ) {
      onChange("tags", [...formData.tags, trimmedTag]);
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(
      "tags",
      formData.tags.filter((tag) => tag !== tagToRemove)
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          {t("editQuiz.quizInfo")}
        </h2>
        {isEditMode && formData.isPublic && onMakePrivate && (
          <button
            type="button"
            onClick={onMakePrivate}
            className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors"
          >
            Rendre privé
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("editQuiz.quizTitle")} *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => onChange("title", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            placeholder={t("editQuiz.titlePlaceholder")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("editQuiz.description")}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => onChange("description", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            rows={3}
            placeholder={t("editQuiz.descriptionPlaceholder")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("createQuiz.searchTags")}
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={currentTag}
              placeholder={t("createQuiz.addTagPlaceholder")}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              maxLength={20}
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium flex items-center gap-2"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-emerald-700 hover:text-emerald-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">
            {t("createQuiz.maxTags")} • {formData.tags.length}/10
          </p>
        </div>

        <div>
          <ImageDropzone
            label={t("editQuiz.coverImage")}
            currentImageUrl={formData.coverImageUrl}
            onImageUploaded={(url) => onChange("coverImageUrl", url)}
            bucketName="quiz-images"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("editQuiz.language")} *
            </label>
            <select
              value={formData.quizLanguage}
              onChange={(e) =>
                onChange("quizLanguage", e.target.value as Language)
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            >
              {Object.entries(languageNames).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("editQuiz.category")} *
            </label>
            <select
              value={formData.category}
              onChange={(e) => onChange("category", e.target.value as QuizCategory)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            >
              {categories.map((cat) => (
                <option key={cat.id || cat.name} value={cat.name}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("editQuiz.difficulty")} *
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) =>
                onChange("difficulty", e.target.value as Difficulty)
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            >
              {difficulties.map((diff) => (
                <option key={diff.id || diff.name} value={diff.name}>
                  {diff.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("createQuiz.quizType")}
            </label>
            <select
              value={formData.selectedQuizType}
              onChange={(e) => onChange("selectedQuizType", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            >
              <option value="">{t("createQuiz.noType")}</option>
              {quizTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("editQuiz.timePerQuestion")}
            </label>
            <input
              type="number"
              value={formData.timeLimitSeconds}
              onChange={(e) =>
                onChange("timeLimitSeconds", parseInt(e.target.value) || 30)
              }
              min="5"
              max="120"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="randomizeQuestions"
              checked={formData.randomizeQuestions}
              onChange={(e) => onChange("randomizeQuestions", e.target.checked)}
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <label
              htmlFor="randomizeQuestions"
              className="text-sm text-gray-700"
            >
              {t("createQuiz.randomizeQuestions")}
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="randomizeAnswers"
              checked={formData.randomizeAnswers}
              onChange={(e) => onChange("randomizeAnswers", e.target.checked)}
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <label htmlFor="randomizeAnswers" className="text-sm text-gray-700">
              {t("createQuiz.randomizeAnswers")}
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) => onChange("isPublic", e.target.checked)}
              className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-700">
              {profile?.role === "admin"
                ? t("createQuiz.publicQuizAdmin")
                : t("createQuiz.submitValidation").replace(
                    "{count}",
                    String(profile?.published_quiz_count || 0)
                  )}
            </label>
          </div>

          {profile?.role === "admin" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("createQuiz.quizLocationLatAdmin")}
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min={-90}
                  max={90}
                  value={formData.locationLat}
                  onChange={(e) => onChange("locationLat", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Ex: 46.2044"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("createQuiz.quizLocationLngAdmin")}
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min={-180}
                  max={180}
                  value={formData.locationLng}
                  onChange={(e) => onChange("locationLng", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Ex: 6.1432"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
