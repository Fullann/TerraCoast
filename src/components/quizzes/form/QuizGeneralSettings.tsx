import { useState, useEffect } from "react";
import { Plus, EyeOff } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { languageNames, Language } from "../../../i18n/translations";
import { ImageDropzone } from "../ImageDropzone";
import {
  useCategoriesQuery,
  useDifficultiesQuery,
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

const CATEGORY_EMOJIS: Record<string, string> = {
  flags: "🚩",
  capitals: "🏛️",
  maps: "🗺️",
  borders: "🌐",
  regions: "🏞️",
  mixed: "🎲",
};

const LANGUAGE_FLAGS: Record<string, string> = {
  fr: "🇫🇷",
  en: "🇬🇧",
  de: "🇩🇪",
  es: "🇪🇸",
  it: "🇮🇹",
  pt: "🇵🇹",
};

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
    <div className="bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-6 sm:p-8 mb-8 space-y-7 transition-all">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center text-2xl shadow-md shadow-emerald-500/20">
            🎨
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {t("editQuiz.quizInfo")}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-500">
              Personnalisez l'ambiance visuelle, la difficulté et les règles du quiz
            </p>
          </div>
        </div>

        {isEditMode && formData.isPublic && onMakePrivate && (
          <button
            type="button"
            onClick={onMakePrivate}
            className="self-start sm:self-auto px-4 py-2 text-xs font-black text-amber-800 bg-amber-50 border-2 border-amber-300 rounded-2xl hover:bg-amber-100 transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            <EyeOff className="w-4 h-4" />
            <span>Rendre privé</span>
          </button>
        )}
      </div>

      {/* Titre & Description */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>🏷️</span>
              <span>{t("editQuiz.quizTitle")} *</span>
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              {formData.title.length}/80
            </span>
          </label>
          <input
            type="text"
            value={formData.title}
            maxLength={80}
            onChange={(e) => onChange("title", e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-base text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:font-normal placeholder:text-slate-400"
            placeholder={t("editQuiz.titlePlaceholder")}
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
            <span>📝</span>
            <span>{t("editQuiz.description")}</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => onChange("description", e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl font-medium text-sm text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:text-slate-400 resize-none"
            rows={2}
            placeholder={t("editQuiz.descriptionPlaceholder")}
          />
        </div>
      </div>

      {/* 🚩 Thématique / Catégorie avec Badges Visuels */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
          <span>🌍</span>
          <span>{t("editQuiz.category")} *</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {categories.map((cat) => {
            const isSelected = formData.category === cat.name;
            const emoji = CATEGORY_EMOJIS[cat.name] || "🧭";
            return (
              <button
                type="button"
                key={cat.id || cat.name}
                onClick={() => onChange("category", cat.name as QuizCategory)}
                className={`p-3 rounded-2xl border-2 font-black text-xs transition-all flex flex-col items-center justify-center gap-1.5 text-center active:scale-95 ${
                  isSelected
                    ? "bg-emerald-50 border-emerald-500 text-emerald-900 border-b-4 shadow-sm"
                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span className="text-2xl">{emoji}</span>
                <span className="leading-tight">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ⭐ Difficulté Visuelle */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
          <span>⭐</span>
          <span>{t("editQuiz.difficulty")} *</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: "easy",
              label: "Facile",
              stars: "⭐",
              sub: "Accessible à tous",
              color: "emerald",
              border: "border-emerald-300",
              selectedBg: "bg-emerald-50 text-emerald-900 border-emerald-500 border-b-4",
            },
            {
              id: "medium",
              label: "Moyen",
              stars: "⭐⭐",
              sub: "Le défi équilibré",
              color: "amber",
              border: "border-amber-300",
              selectedBg: "bg-amber-50 text-amber-900 border-amber-500 border-b-4",
            },
            {
              id: "hard",
              label: "Difficile",
              stars: "⭐⭐⭐",
              sub: "Pour les experts géographes",
              color: "rose",
              border: "border-rose-300",
              selectedBg: "bg-rose-50 text-rose-900 border-rose-500 border-b-4",
            },
          ].map((diff) => {
            const isSelected = formData.difficulty === diff.id;
            return (
              <button
                type="button"
                key={diff.id}
                onClick={() => onChange("difficulty", diff.id as Difficulty)}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all active:scale-95 ${
                  isSelected
                    ? diff.selectedBg + " shadow-sm"
                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-sm">{diff.label}</span>
                  <span className="text-xs">{diff.stars}</span>
                </div>
                <p className="text-[11px] font-bold text-slate-500">{diff.sub}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ⏱️ Temps par question & Langue */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Temps chrono */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>⏱️</span>
              <span>{t("editQuiz.timePerQuestion")}</span>
            </span>
            <span className="text-emerald-700 font-black text-xs bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {formData.timeLimitSeconds} secondes
            </span>
          </label>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {[
              { sec: 10, label: "⚡ 10s" },
              { sec: 20, label: "⏱️ 20s" },
              { sec: 30, label: "🎯 30s" },
              { sec: 60, label: "🧘 60s" },
            ].map((preset) => (
              <button
                type="button"
                key={preset.sec}
                onClick={() => onChange("timeLimitSeconds", preset.sec)}
                className={`py-2 px-2 rounded-xl text-xs font-black border-2 transition-all active:scale-95 ${
                  formData.timeLimitSeconds === preset.sec
                    ? "bg-emerald-600 text-white border-emerald-600 border-b-4 shadow-sm"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <input
            type="range"
            min="5"
            max="120"
            step="5"
            value={formData.timeLimitSeconds}
            onChange={(e) =>
              onChange("timeLimitSeconds", parseInt(e.target.value) || 30)
            }
            className="w-full accent-emerald-600 cursor-pointer"
          />
        </div>

        {/* Langue du Quiz */}
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
            <span>🌐</span>
            <span>{t("editQuiz.language")} *</span>
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {Object.entries(languageNames).map(([code, name]) => {
              const isSelected = formData.quizLanguage === code;
              const flag = LANGUAGE_FLAGS[code] || "🌐";
              return (
                <button
                  type="button"
                  key={code}
                  onClick={() => onChange("quizLanguage", code as Language)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-black border-2 transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                    isSelected
                      ? "bg-sky-50 text-sky-900 border-sky-500 border-b-4 shadow-sm"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                  title={name}
                >
                  <span className="text-xl">{flag}</span>
                  <span className="uppercase text-[10px] font-extrabold">{code}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🖼️ Image de couverture */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
          <span>🖼️</span>
          <span>{t("editQuiz.coverImage")} (Recommandé)</span>
        </label>
        <ImageDropzone
          label={t("editQuiz.coverImage")}
          currentImageUrl={formData.coverImageUrl}
          onImageUploaded={(url) => onChange("coverImageUrl", url)}
          bucketName="quiz-images"
        />
      </div>

      {/* 🏷️ Tags de recherche ludiques */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span>🔖</span>
            <span>{t("createQuiz.searchTags")}</span>
          </span>
          <span className="text-[11px] font-bold text-slate-400">
            {formData.tags.length}/10 tags
          </span>
        </label>
        <div className="flex gap-2 mb-2.5">
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
            className="flex-1 px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
            maxLength={20}
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition-all active:scale-95 shadow-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter</span>
          </button>
        </div>

        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-full text-xs font-black flex items-center gap-1.5 shadow-sm animate-fadeIn"
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="w-4 h-4 rounded-full bg-emerald-200/80 hover:bg-rose-500 hover:text-white flex items-center justify-center text-[10px] transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 🎮 Options de jeu tactiles (Interrupteurs visuels) */}
      <div className="pt-2 border-t border-slate-100">
        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
          Règles & Visibilité de Partie
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Randomize Questions */}
          <button
            type="button"
            onClick={() => onChange("randomizeQuestions", !formData.randomizeQuestions)}
            className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3 active:scale-95 ${
              formData.randomizeQuestions
                ? "bg-teal-50 border-teal-500 text-teal-950 border-b-4 shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className="text-xl">🔀</span>
            <div>
              <p className="font-black text-xs">Questions Aléatoires</p>
              <p className="text-[11px] text-slate-500 font-medium">Ordre mélangé à chaque jeu</p>
            </div>
          </button>

          {/* Randomize Answers */}
          <button
            type="button"
            onClick={() => onChange("randomizeAnswers", !formData.randomizeAnswers)}
            className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3 active:scale-95 ${
              formData.randomizeAnswers
                ? "bg-purple-50 border-purple-500 text-purple-950 border-b-4 shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className="text-xl">🎲</span>
            <div>
              <p className="font-black text-xs">Réponses Mélangées</p>
              <p className="text-[11px] text-slate-500 font-medium">Empêche le par cœur</p>
            </div>
          </button>

          {/* Public / Soumission */}
          <button
            type="button"
            onClick={() => onChange("isPublic", !formData.isPublic)}
            className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3 active:scale-95 ${
              formData.isPublic
                ? "bg-emerald-50 border-emerald-500 text-emerald-950 border-b-4 shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className="text-xl">{formData.isPublic ? "🌍" : "🔒"}</span>
            <div>
              <p className="font-black text-xs">
                {profile?.role === "admin" ? "Quiz Public Immédiat" : "Publier pour la communauté"}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                {formData.isPublic ? "Accessible à tous" : "Quiz privé / Brouillon"}
              </p>
            </div>
          </button>
        </div>

        {/* Coordonnées admin si activé */}
        {profile?.role === "admin" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
            <div>
              <label className="block text-xs font-black text-amber-900 mb-1">
                📍 Latitude sur la Carte du Monde (Admin)
              </label>
              <input
                type="number"
                step="0.0001"
                min={-90}
                max={90}
                value={formData.locationLat}
                onChange={(e) => onChange("locationLat", e.target.value)}
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold outline-none"
                placeholder="Ex: 46.2044"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-amber-900 mb-1">
                📍 Longitude sur la Carte du Monde (Admin)
              </label>
              <input
                type="number"
                step="0.0001"
                min={-180}
                max={180}
                value={formData.locationLng}
                onChange={(e) => onChange("locationLng", e.target.value)}
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold outline-none"
                placeholder="Ex: 6.1432"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
