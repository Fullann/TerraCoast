import { useState } from "react";
import {
  Save,
  Plus,
  Trash2,
  X,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { ImageDropzone } from "../ImageDropzone";
import { CountryMultiSelect } from "../CountryMultiSelect";
import { CustomGeoJsonMapPicker } from "../CustomGeoJsonMapPicker";
import {
  getSubdivisions,
  type SubdivisionScope,
} from "../../../lib/subdivisionGameData";
import {
  type QuestionItem,
  type QuestionType,
  type QuestionMapData,
  MAP_VIEW_PRESETS,
} from "./types";

interface QuestionEditorProps {
  question: QuestionItem;
  onChange: (updated: QuestionItem) => void;
  onSave?: () => void;
  onCancel?: () => void;
  isEditing?: boolean;
  saveButtonLabel?: string;
  cancelButtonLabel?: string;
  showSaveCancelButtons?: boolean;
}

export function QuestionEditor({
  question,
  onChange,
  onSave,
  onCancel,
  isEditing = false,
  saveButtonLabel,
  cancelButtonLabel,
  showSaveCancelButtons = true,
}: QuestionEditorProps) {
  const { t } = useLanguage();
  const [top10DragIndex, setTop10DragIndex] = useState<number | null>(null);

  const trueFalseLabels = {
    true: t("createQuiz.trueFalse.true"),
    false: t("createQuiz.trueFalse.false"),
  };

  const mapEditorStorageMode: "puzzle_map" | "map_click" =
    question.question_type === "map_click" ? "map_click" : "puzzle_map";
  const isMapClickEditor = question.question_type === "map_click";

  const currentSubdivisionScope: SubdivisionScope =
    (question.map_data?.subdivisionScope as SubdivisionScope) || "ch_cantons";
  const subdivisionEntries = getSubdivisions(currentSubdivisionScope);

  const updateOption = (index: number, value: string) => {
    const nextOptions = Array.isArray(question.options)
      ? [...question.options]
      : ["", "", "", ""];
    nextOptions[index] = value;
    onChange({ ...question, options: nextOptions });
  };

  const updateOptionImage = (optionText: string, imageUrl: string) => {
    const nextOptionImages = { ...(question.option_images || {}) };
    if (imageUrl.trim()) {
      nextOptionImages[optionText] = imageUrl;
    } else {
      delete nextOptionImages[optionText];
    }
    onChange({ ...question, option_images: nextOptionImages });
  };

  const reorderTop10 = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const current = Array.isArray(question.options) ? [...question.options] : [];
    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);
    onChange({ ...question, options: current });
  };

  const addVariant = () => {
    const currentVariants = Array.isArray(question.correct_answers)
      ? question.correct_answers
      : [];
    onChange({
      ...question,
      correct_answers: [...currentVariants, ""],
    });
  };

  const updateVariant = (index: number, value: string) => {
    const currentVariants = [...(question.correct_answers || [])];
    currentVariants[index] = value;
    onChange({ ...question, correct_answers: currentVariants });
  };

  const removeVariant = (index: number) => {
    const currentVariants = (question.correct_answers || []).filter(
      (_, i) => i !== index
    );
    onChange({ ...question, correct_answers: currentVariants });
  };

  const handleTypeChange = (newType: QuestionType) => {
    if (newType === "true_false") {
      onChange({
        ...question,
        question_type: newType,
        options: [trueFalseLabels.true, trueFalseLabels.false],
        correct_answer: trueFalseLabels.true,
        correct_answers: [],
        map_data: null,
      });
    } else if (newType === "puzzle_map") {
      onChange({
        ...question,
        question_type: newType,
        options: [],
        correct_answer: "__AUTO__",
        correct_answers: [],
        map_data: {
          mode: "puzzle_map",
          continent: "world",
          mapLevel: "countries",
          selectedCountries: [],
          showTargetList: false,
          initialView: {
            centerLat: 20,
            centerLng: 0,
            zoom: 1,
          },
        },
      });
    } else if (newType === "map_click") {
      onChange({
        ...question,
        question_type: newType,
        options: [],
        correct_answer: "__AUTO__",
        correct_answers: [],
        map_data: {
          mode: "map_click",
          continent: "world",
          mapLevel: "countries",
          selectedCountries: [],
          showTargetList: false,
          initialView: {
            centerLat: 20,
            centerLng: 0,
            zoom: 1,
          },
        },
      });
    } else if (newType === "top10_order") {
      onChange({
        ...question,
        question_type: newType,
        options: Array.isArray(question.options) && question.options.length >= 2
          ? question.options
          : ["", ""],
        correct_answer: "__ORDER__",
        correct_answers: [],
        map_data: {
          mode: "top10_order",
          selectedCountries: [],
        },
      });
    } else if (newType === "country_multi") {
      onChange({
        ...question,
        question_type: newType,
        options: [],
        correct_answer: "__AUTO__",
        correct_answers: [],
        map_data: {
          mode: "country_multi",
          selectedCountries: [],
          requiredFields: ["name", "capital", "map_click"],
          countryMultiPrompt: "",
          nameTolerance: "lenient",
          capitalTolerance: "strict",
        },
      });
    } else if (newType === "mcq") {
      onChange({
        ...question,
        question_type: newType,
        options:
          Array.isArray(question.options) && question.options.length >= 2
            ? question.options
            : ["", "", "", ""],
        map_data: null,
      });
    } else {
      onChange({
        ...question,
        question_type: newType,
        map_data: null,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Énoncé de la question */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span>❓</span>
            <span>{t("editQuiz.question")} *</span>
          </span>
          <span className="text-[11px] font-bold text-slate-400">
            Énoncé clair & captivant
          </span>
        </label>
        <input
          type="text"
          value={question.question_text}
          onChange={(e) =>
            onChange({ ...question, question_text: e.target.value })
          }
          className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl font-black text-sm sm:text-base text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all placeholder:font-normal placeholder:text-slate-400"
          placeholder={t("createQuiz.questionPlaceholder")}
        />
      </div>

      {/* Image optionnelle */}
      <div>
        <div className="flex space-x-2">
          <ImageDropzone
            label={
              question.question_type === "country_multi"
                ? t("createQuiz.countryMulti.imageOptionalLabel")
                : t("editQuiz.questionImageOptional")
            }
            currentImageUrl={question.image_url || ""}
            onImageUploaded={(url) =>
              onChange({ ...question, image_url: url })
            }
            bucketName="quiz-images"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {question.question_type === "country_multi"
            ? t("createQuiz.countryMulti.imageOrTextHint")
            : t("createQuiz.questionImageDesc")}
        </p>
      </div>

      {/* 🧩 Sélecteur Visuel du Type de Question */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span>🧩</span>
            <span>{t("editQuiz.questionType.label")} *</span>
          </span>
          <span className="text-emerald-700 font-black text-xs bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Format Interactif
          </span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {[
            {
              type: "mcq" as QuestionType,
              title: "QCM 4 Choix",
              emoji: "🎯",
              badge: "Classique",
              desc: "4 options avec texte ou photos",
            },
            {
              type: "true_false" as QuestionType,
              title: "Vrai ou Faux",
              emoji: "⚖️",
              badge: "Duel Rapide",
              desc: "Deux boutons binaire vert / rouge",
            },
            {
              type: "text_free" as QuestionType,
              title: "Saisie Libre",
              emoji: "✍️",
              badge: "Clavier",
              desc: "Le joueur tape la réponse",
            },
            {
              type: "puzzle_map" as QuestionType,
              title: "Carte Puzzle",
              emoji: "🧩",
              badge: "Interactif",
              desc: "Placer les territoires sur le globe",
            },
            {
              type: "map_click" as QuestionType,
              title: "Clic sur Carte",
              emoji: "📍",
              badge: "Pointer",
              desc: "Cliquer sur le bon territoire",
            },
            {
              type: "top10_order" as QuestionType,
              title: "Top 10 à Classer",
              emoji: "🏆",
              badge: "Ordre",
              desc: "Ranger du 1er au dernier",
            },
            {
              type: "country_multi" as QuestionType,
              title: "Multi-Pays",
              emoji: "🌍",
              badge: "Défi Complet",
              desc: "Questions combinées nom, capitale & carte",
            },
          ].map((item) => {
            const isSelected = question.question_type === item.type;
            return (
              <button
                type="button"
                key={item.type}
                onClick={() => handleTypeChange(item.type)}
                className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-1 active:scale-95 ${
                  isSelected
                    ? "bg-emerald-50 border-emerald-500 border-b-4 text-emerald-950 shadow-sm ring-2 ring-emerald-400/20"
                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-2xl">{item.emoji}</span>
                  <span
                    className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                      isSelected
                        ? "bg-emerald-200 text-emerald-900"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>
                <div>
                  <p className="font-black text-xs leading-tight mt-1">{item.title}</p>
                  <p className="text-[10px] text-slate-400 font-medium line-clamp-1 mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ⭐ Sélecteur de Points Ludique */}
      <div>
        <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span>⭐</span>
            <span>{t("editQuiz.points")}</span>
          </span>
          <span className="text-amber-800 font-black text-xs bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            +{question.points} XP en jeu
          </span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
          {[
            { pts: 50, label: "⭐ 50 pts", sub: "Facile" },
            { pts: 100, label: "⭐ 100 pts", sub: "Standard" },
            { pts: 200, label: "⭐ 200 pts", sub: "Défi" },
            { pts: 500, label: "🔥 500 pts", sub: "Boss Final" },
          ].map((preset) => (
            <button
              type="button"
              key={preset.pts}
              onClick={() => onChange({ ...question, points: preset.pts })}
              className={`py-2 px-2.5 rounded-xl border-2 transition-all active:scale-95 text-center ${
                question.points === preset.pts
                  ? "bg-amber-50 border-amber-500 text-amber-900 border-b-4 font-black shadow-sm"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold"
              }`}
            >
              <p className="text-xs">{preset.label}</p>
              <p className="text-[10px] text-slate-400">{preset.sub}</p>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="10"
            max="500"
            step="10"
            value={question.points}
            onChange={(e) =>
              onChange({ ...question, points: parseInt(e.target.value) || 100 })
            }
            className="flex-1 accent-amber-500 cursor-pointer"
          />
          <span className="text-xs font-black text-slate-600 w-16 text-right">
            {question.points} pts
          </span>
        </div>
      </div>

      {question.question_type === "true_false" && (
        <div className="bg-emerald-50/70 border-2 border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">⚖️</span>
          <div>
            <p className="text-xs font-black text-emerald-950">Mode Vrai ou Faux</p>
            <p className="text-xs text-emerald-800">
              {t("createQuiz.trueFalse.description")}
            </p>
          </div>
        </div>
      )}

      {/* 🎯 Options QCM Colorées (Style Kahoot / Arcade) */}
      {question.question_type === "mcq" && (
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>🎯</span>
              <span>{t("createQuiz.optionsMinTwo")}</span>
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              Remplissez au moins 2 options
            </span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                symbol: "▲",
                label: "Option A",
                badgeBg: "bg-rose-500 text-white",
                inputBorder: "border-rose-300 focus:border-rose-500 focus:ring-rose-100",
                bg: "bg-rose-50/40",
              },
              {
                symbol: "◆",
                label: "Option B",
                badgeBg: "bg-sky-500 text-white",
                inputBorder: "border-sky-300 focus:border-sky-500 focus:ring-sky-100",
                bg: "bg-sky-50/40",
              },
              {
                symbol: "●",
                label: "Option C",
                badgeBg: "bg-amber-500 text-white",
                inputBorder: "border-amber-300 focus:border-amber-500 focus:ring-amber-100",
                bg: "bg-amber-50/40",
              },
              {
                symbol: "■",
                label: "Option D",
                badgeBg: "bg-emerald-500 text-white",
                inputBorder: "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-100",
                bg: "bg-emerald-50/40",
              },
            ].map((theme, index) => {
              const currentVal = Array.isArray(question.options)
                ? question.options[index] || ""
                : "";
              return (
                <div
                  key={index}
                  className={`p-3.5 rounded-2xl border-2 ${theme.bg} border-slate-200 space-y-2 transition-all`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-lg ${theme.badgeBg} flex items-center justify-center text-xs font-black shadow-sm shrink-0`}
                    >
                      {theme.symbol}
                    </span>
                    <span className="text-xs font-black text-slate-700">
                      {theme.label}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={currentVal}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className={`w-full px-3.5 py-2.5 bg-white border-2 rounded-xl text-xs font-bold text-slate-800 ${theme.inputBorder} focus:ring-4 outline-none transition-all placeholder:text-slate-300`}
                    placeholder={`Saisir la réponse ${index + 1}...`}
                  />
                  {currentVal.trim() && (
                    <ImageDropzone
                      label={t("editQuiz.imageForOption").replace(
                        "{option}",
                        currentVal
                      )}
                      currentImageUrl={question.option_images?.[currentVal] || ""}
                      onImageUploaded={(url) =>
                        updateOptionImage(currentVal, url)
                      }
                      bucketName="quiz-images"
                    />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-2">
            💡 Astuce : Vous pouvez associer des photos aux réponses pour créer un quiz visuel captivant.
          </p>
        </div>
      )}

      {(question.question_type === "puzzle_map" ||
        question.question_type === "map_click") && (
        <div className="space-y-4 p-4 rounded-lg bg-sky-50 border border-sky-200">
          {question.question_type === "puzzle_map" && (
            <p className="text-sm text-sky-900 bg-white/80 border border-sky-200 rounded-lg px-3 py-2">
              {t("createQuiz.puzzle.editorBehaviorHint")}
            </p>
          )}
          {question.question_type === "map_click" && (
            <p className="text-sm text-sky-900 bg-white/80 border border-sky-200 rounded-lg px-3 py-2">
              {t("createQuiz.mapClick.editorBehaviorHint")}
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Niveau de carte
            </label>
            <select
              value={question.map_data?.mapLevel || "countries"}
              onChange={(e) => {
                const nextLevel = e.target.value as
                  | "countries"
                  | "subdivisions"
                  | "custom_geojson";
                onChange({
                  ...question,
                  map_data: {
                    ...(question.map_data || {}),
                    mode: mapEditorStorageMode,
                    mapLevel: nextLevel,
                    subdivisionScope:
                      nextLevel === "subdivisions" ? "ch_cantons" : undefined,
                    customGeojsonMapId:
                      nextLevel === "custom_geojson" ? "" : undefined,
                    customGeojsonPublicUrl:
                      nextLevel === "custom_geojson" ? "" : undefined,
                    customGeojsonIdProperty:
                      nextLevel === "custom_geojson" ? "tc_id" : undefined,
                    selectedCountries:
                      nextLevel === "subdivisions" ||
                      nextLevel === "custom_geojson"
                        ? []
                        : question.map_data?.selectedCountries || [],
                    initialView:
                      nextLevel === "subdivisions"
                        ? { centerLat: 46.8, centerLng: 8.2, zoom: 1.1 }
                        : nextLevel === "custom_geojson"
                        ? { centerLat: 20, centerLng: 0, zoom: 2 }
                        : question.map_data?.initialView || {
                            centerLat: 20,
                            centerLng: 0,
                            zoom: 1,
                          },
                  },
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            >
              <option value="countries">Pays</option>
              <option value="subdivisions">Sous-divisions</option>
              <option value="custom_geojson">GeoJSON (catalogue admin)</option>
            </select>
          </div>

          {(question.map_data?.mapLevel || "countries") === "subdivisions" ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scope
                </label>
                <select
                  value={
                    question.map_data?.subdivisionScope || "ch_cantons"
                  }
                  onChange={(e) =>
                    onChange({
                      ...question,
                      map_data: {
                        ...(question.map_data || {}),
                        mode: mapEditorStorageMode,
                        mapLevel: "subdivisions",
                        subdivisionScope: e.target.value as SubdivisionScope,
                        selectedCountries: [],
                        initialView:
                          e.target.value === "fr_departements"
                            ? { centerLat: 46.6, centerLng: 2.3, zoom: 1.1 }
                            : e.target.value === "us_states"
                            ? { centerLat: 39.8, centerLng: -98.5, zoom: 1 }
                            : { centerLat: 46.8, centerLng: 8.2, zoom: 1.1 },
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  <option value="ch_cantons">Cantons suisses</option>
                  <option value="fr_departements">Départements français</option>
                  <option value="us_states">États américains</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sous-divisions cibles
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-white">
                  {subdivisionEntries.map((entry) => {
                    const checked =
                      question.map_data?.selectedCountries?.includes(
                        entry.iso3
                      ) || false;
                    return (
                      <label
                        key={entry.iso3}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            const previous =
                              question.map_data?.selectedCountries || [];
                            const next = e.target.checked
                              ? [...new Set([...previous, entry.iso3])]
                              : previous.filter((id) => id !== entry.iso3);
                            onChange({
                              ...question,
                              map_data: {
                                ...(question.map_data || {}),
                                mode: mapEditorStorageMode,
                                mapLevel: "subdivisions",
                                subdivisionScope: currentSubdivisionScope,
                                selectedCountries: next,
                              },
                            });
                          }}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        {entry.name}
                      </label>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (question.map_data?.mapLevel || "countries") ===
            "custom_geojson" ? (
            <CustomGeoJsonMapPicker
              mapData={question.map_data || undefined}
              storageMode={mapEditorStorageMode}
              onPatch={(patch) =>
                onChange({
                  ...question,
                  map_data: {
                    ...(question.map_data || {}),
                    ...patch,
                    mode: mapEditorStorageMode,
                  } as QuestionMapData,
                })
              }
            />
          ) : (
            <CountryMultiSelect
              label={
                isMapClickEditor
                  ? t("createQuiz.mapClick.targetZonesLabel")
                  : t("createQuiz.puzzle.targetCountriesLabel")
              }
              selectedIso3={question.map_data?.selectedCountries || []}
              hint={
                isMapClickEditor
                  ? t("createQuiz.mapClick.countryHint")
                  : undefined
              }
              onChange={(next) =>
                onChange({
                  ...question,
                  map_data: {
                    ...(question.map_data || {}),
                    mode: mapEditorStorageMode,
                    mapLevel: "countries",
                    selectedCountries: next,
                  },
                })
              }
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-3">
              <label className="block text-xs text-gray-700 mb-1">
                Preset continent
              </label>
              <select
                onChange={(e) => {
                  const preset = MAP_VIEW_PRESETS[e.target.value];
                  if (!preset) return;
                  onChange({
                    ...question,
                    map_data: {
                      ...(question.map_data || {}),
                      mode: mapEditorStorageMode,
                      initialView: {
                        centerLat: preset.centerLat,
                        centerLng: preset.centerLng,
                        zoom: preset.zoom,
                      },
                    },
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                defaultValue=""
              >
                <option value="" disabled>
                  Choisir un preset
                </option>
                <option value="world">Monde</option>
                <option value="europe">Europe</option>
                <option value="africa">Afrique</option>
                <option value="asia">Asie</option>
                <option value="americas">Amériques</option>
                <option value="oceania">Océanie</option>
                <option value="switzerland">Suisse</option>
                <option value="france">France</option>
                <option value="usa">USA</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">
                Centre latitude
              </label>
              <input
                type="number"
                min={-90}
                max={90}
                step={0.1}
                value={question.map_data?.initialView?.centerLat ?? 20}
                onChange={(e) =>
                  onChange({
                    ...question,
                    map_data: {
                      ...(question.map_data || {}),
                      mode: mapEditorStorageMode,
                      initialView: {
                        ...(question.map_data?.initialView || {}),
                        centerLat: Math.max(
                          -90,
                          Math.min(90, Number(e.target.value || 20))
                        ),
                      },
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">
                Centre longitude
              </label>
              <input
                type="number"
                min={-180}
                max={180}
                step={0.1}
                value={question.map_data?.initialView?.centerLng ?? 0}
                onChange={(e) =>
                  onChange({
                    ...question,
                    map_data: {
                      ...(question.map_data || {}),
                      mode: mapEditorStorageMode,
                      initialView: {
                        ...(question.map_data?.initialView || {}),
                        centerLng: Math.max(
                          -180,
                          Math.min(180, Number(e.target.value || 0))
                        ),
                      },
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-700 mb-1">
                Zoom initial
              </label>
              <input
                type="number"
                min={1}
                max={8}
                step={0.1}
                value={question.map_data?.initialView?.zoom ?? 1}
                onChange={(e) =>
                  onChange({
                    ...question,
                    map_data: {
                      ...(question.map_data || {}),
                      mode: mapEditorStorageMode,
                      initialView: {
                        ...(question.map_data?.initialView || {}),
                        zoom: Math.max(
                          1,
                          Math.min(8, Number(e.target.value || 1))
                        ),
                      },
                    },
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {question.question_type === "top10_order" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-orange-50 border border-orange-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("createQuiz.top10.itemsLabel")}
            </label>
            <div className="space-y-2">
              {(Array.isArray(question.options) ? question.options : []).map(
                (item, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={() => setTop10DragIndex(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (top10DragIndex === null) return;
                      reorderTop10(top10DragIndex, index);
                      setTop10DragIndex(null);
                    }}
                    onDragEnd={() => setTop10DragIndex(null)}
                    className="flex items-center gap-2"
                  >
                    <span className="text-xs text-gray-500 w-8">
                      #{index + 1}
                    </span>
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        type="button"
                        title={t("playQuiz.top10.moveUp")}
                        aria-label={t("playQuiz.top10.moveUp")}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (index === 0) return;
                          reorderTop10(index, index - 1);
                        }}
                        disabled={index === 0}
                        className="p-0.5 rounded border border-orange-200 text-orange-700 hover:bg-orange-100 disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        title={t("playQuiz.top10.moveDown")}
                        aria-label={t("playQuiz.top10.moveDown")}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            index >=
                            (question.options?.length || 0) - 1
                          )
                            return;
                          reorderTop10(index, index + 1);
                        }}
                        disabled={
                          index >= (question.options?.length || 0) - 1
                        }
                        className="p-0.5 rounded border border-orange-200 text-orange-700 hover:bg-orange-100 disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const next = Array.isArray(question.options)
                          ? [...question.options]
                          : [];
                        next[index] = e.target.value;
                        onChange({ ...question, options: next });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      placeholder={`${t("createQuiz.top10.itemPlaceholder")} ${
                        index + 1
                      }`}
                    />
                    <button
                      type="button"
                      title={t("quiz.delete")}
                      aria-label={`${t("quiz.delete")} ${item || index + 1}`}
                      onClick={() => {
                        const next = (question.options || []).filter(
                          (_, i) => i !== index
                        );
                        onChange({
                          ...question,
                          options: next.length > 0 ? next : [""],
                        });
                      }}
                      className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                    <span className="text-xs text-gray-400">
                      {t("playQuiz.top10.drag")}
                    </span>
                  </div>
                )
              )}
              <button
                type="button"
                onClick={() => {
                  onChange({
                    ...question,
                    options: [
                      ...(Array.isArray(question.options)
                        ? question.options
                        : []),
                      "",
                    ],
                  });
                }}
                className="text-sm px-3 py-1 border border-orange-300 text-orange-700 rounded hover:bg-orange-100"
              >
                {t("createQuiz.top10.addItem")}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {t("createQuiz.top10.reorderHint")}
            </p>
          </div>
          <div>
            <p className="text-xs text-orange-700 bg-white border border-orange-200 rounded-lg p-3">
              {t("createQuiz.top10.customHint")}
            </p>
          </div>
        </div>
      )}

      {question.question_type === "country_multi" && (
        <div className="space-y-3 p-4 rounded-lg bg-indigo-50 border border-indigo-200">
          <CountryMultiSelect
            label={t("createQuiz.countryMulti.targetCountriesLabel")}
            selectedIso3={question.map_data?.selectedCountries || []}
            hint={t("createQuiz.countryMulti.targetCountriesHint")}
            onChange={(next) =>
              onChange({
                ...question,
                map_data: {
                  ...(question.map_data || {}),
                  mode: "country_multi",
                  selectedCountries: next,
                  requiredFields: ["name", "capital", "map_click"],
                  countryMultiPrompt:
                    question.map_data?.countryMultiPrompt || "",
                  nameTolerance:
                    question.map_data?.nameTolerance || "lenient",
                  capitalTolerance:
                    question.map_data?.capitalTolerance || "strict",
                },
              })
            }
          />
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              {t("createQuiz.countryMulti.fieldsLabel")}
            </p>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-800">
                {t("createQuiz.countryMulti.fieldName")}
              </span>
              <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-800">
                {t("createQuiz.countryMulti.fieldCapital")}
              </span>
              <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-800">
                {t("createQuiz.countryMulti.fieldMapClick")}
              </span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              {t("createQuiz.countryMulti.customPromptLabel")}
            </label>
            <input
              type="text"
              value={question.map_data?.countryMultiPrompt || ""}
              onChange={(e) =>
                onChange({
                  ...question,
                  map_data: {
                    ...(question.map_data || {}),
                    mode: "country_multi",
                    selectedCountries:
                      question.map_data?.selectedCountries || [],
                    requiredFields: ["name", "capital", "map_click"],
                    countryMultiPrompt: e.target.value,
                    nameTolerance:
                      question.map_data?.nameTolerance || "lenient",
                    capitalTolerance:
                      question.map_data?.capitalTolerance || "strict",
                  },
                })
              }
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder={t(
                "createQuiz.countryMulti.customPromptPlaceholder"
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm text-gray-700">
              {t("createQuiz.countryMulti.nameToleranceLabel")}
              <select
                value={question.map_data?.nameTolerance || "lenient"}
                onChange={(e) =>
                  onChange({
                    ...question,
                    map_data: {
                      ...(question.map_data || {}),
                      mode: "country_multi",
                      selectedCountries:
                        question.map_data?.selectedCountries || [],
                      requiredFields: ["name", "capital", "map_click"],
                      nameTolerance: e.target.value as "strict" | "lenient",
                      capitalTolerance:
                        question.map_data?.capitalTolerance || "strict",
                    },
                  })
                }
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="strict">
                  {t("createQuiz.countryMulti.toleranceStrict")}
                </option>
                <option value="lenient">
                  {t("createQuiz.countryMulti.toleranceLenient")}
                </option>
              </select>
            </label>
            <label className="text-sm text-gray-700">
              {t("createQuiz.countryMulti.capitalToleranceLabel")}
              <select
                value={question.map_data?.capitalTolerance || "strict"}
                onChange={(e) =>
                  onChange({
                    ...question,
                    map_data: {
                      ...(question.map_data || {}),
                      mode: "country_multi",
                      selectedCountries:
                        question.map_data?.selectedCountries || [],
                      requiredFields: ["name", "capital", "map_click"],
                      nameTolerance:
                        question.map_data?.nameTolerance || "lenient",
                      capitalTolerance: e.target.value as
                        | "strict"
                        | "lenient",
                    },
                  })
                }
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="strict">
                  {t("createQuiz.countryMulti.toleranceStrict")}
                </option>
                <option value="lenient">
                  {t("createQuiz.countryMulti.toleranceLenient")}
                </option>
              </select>
            </label>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("editQuiz.correctAnswer")} *
        </label>
        {question.question_type === "puzzle_map" ||
        question.question_type === "map_click" ||
        question.question_type === "top10_order" ? (
          <div className="p-3 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg">
            {question.question_type === "top10_order"
              ? t("createQuiz.top10.expectedOrderInfo")
              : question.question_type === "map_click"
              ? t("createQuiz.mapClick.autoAnswerInfo")
              : t("createQuiz.puzzle.autoAnswerInfo")}
          </div>
        ) : question.question_type === "country_multi" ? (
          <div className="p-3 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg">
            {t("createQuiz.countryMulti.autoAnswerInfo")}
          </div>
        ) : question.question_type === "true_false" ? (
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...question,
                  correct_answer: trueFalseLabels.true,
                })
              }
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1.5 active:scale-95 ${
                question.correct_answer === trueFalseLabels.true
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900 border-b-4 shadow-md font-black"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="text-3xl">✓</span>
              <span className="text-base font-black">{trueFalseLabels.true}</span>
              <span className="text-[11px] text-emerald-600 font-bold">Réponse Vraie</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...question,
                  correct_answer: trueFalseLabels.false,
                })
              }
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1.5 active:scale-95 ${
                question.correct_answer === trueFalseLabels.false
                  ? "border-rose-500 bg-rose-50 text-rose-900 border-b-4 shadow-md font-black"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="text-3xl">✗</span>
              <span className="text-base font-black">{trueFalseLabels.false}</span>
              <span className="text-[11px] text-rose-600 font-bold">Réponse Fausse</span>
            </button>
          </div>
        ) : question.question_type === "mcq" ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Array.isArray(question.options)
                ? question.options
                : []
              )
                .filter((opt) => opt.trim())
                .map((option, index) => {
                  const isSelected = (
                    question.correct_answers || []
                  ).includes(option);
                  const shapes = [
                    { symbol: "▲", bg: "bg-red-500", text: "text-red-500" },
                    { symbol: "◆", bg: "bg-sky-500", text: "text-sky-500" },
                    { symbol: "●", bg: "bg-amber-500", text: "text-amber-500" },
                    { symbol: "■", bg: "bg-emerald-500", text: "text-emerald-500" },
                  ];
                  const shape = shapes[index % shapes.length];

                  return (
                    <label
                      key={index}
                      className={`flex items-center gap-3 p-3.5 border-2 rounded-2xl cursor-pointer transition-all active:scale-[0.99] select-none ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50/90 text-emerald-950 border-b-4 shadow-sm"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const answers = question.correct_answers || [];
                          if (e.target.checked) {
                            onChange({
                              ...question,
                              correct_answers: [...answers, option],
                              correct_answer: option,
                            });
                          } else {
                            const newAnswers = answers.filter(
                              (a) => a !== option
                            );
                            onChange({
                              ...question,
                              correct_answers: newAnswers,
                              correct_answer: newAnswers[0] || "",
                            });
                          }
                        }}
                        className="w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                      />
                      <span className={`w-6 h-6 rounded-lg ${shape.bg} text-white text-xs font-black flex items-center justify-center shadow-xs shrink-0`}>
                        {shape.symbol}
                      </span>
                      <span className="font-bold text-sm flex-1 break-words">
                        {option}
                      </span>
                      {isSelected && (
                        <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-800 shrink-0">
                          ✓ Bonne
                        </span>
                      )}
                    </label>
                  );
                })}
            </div>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <span>💡</span> {t("createQuiz.multipleCorrect")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={question.correct_answer}
              onChange={(e) =>
                onChange({
                  ...question,
                  correct_answer: e.target.value,
                })
              }
              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-2xl focus:border-emerald-500 focus:bg-emerald-50/20 text-slate-800 font-bold outline-none transition-all shadow-xs"
              placeholder={t("createQuiz.answerPlaceholder")}
            />

            {(question.question_type === "text_free" ||
              question.question_type === "single_answer") && (
              <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span>🔤</span> {t("createQuiz.variants")}
                  </p>
                  <span className="text-[11px] text-slate-400">
                    Synonymes acceptés
                  </span>
                </div>
                {(question.correct_answers || []).map((variant, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-xs font-black text-slate-400 w-5 text-center">
                      #{index + 1}
                    </span>
                    <input
                      type="text"
                      value={variant}
                      onChange={(e) => updateVariant(index, e.target.value)}
                      className="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-medium text-sm"
                      placeholder={t(
                        "createQuiz.variantPlaceholder"
                      ).replace("{number}", String(index + 1))}
                    />
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      title={t("quiz.delete")}
                      aria-label={`${t("quiz.delete")} (${variant || index + 1})`}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addVariant}
                  className="px-3.5 py-2 text-xs font-black text-emerald-700 hover:bg-emerald-100/60 bg-emerald-50 rounded-xl transition-colors flex items-center gap-1.5 border border-emerald-200"
                >
                  <Plus className="w-4 h-4" />
                  {t("createQuiz.addVariant")}
                </button>
                <p className="text-[11px] text-slate-500">
                  {t("createQuiz.variantsDesc")}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-5 p-4 bg-gradient-to-br from-amber-50 to-orange-50/60 rounded-2xl border-2 border-amber-200/80 shadow-xs">
          <label className="block text-sm font-black text-amber-950 mb-1 flex items-center gap-2">
            <span className="text-lg">💡</span>
            <span>{t("createQuiz.complementIfWrong")}</span>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full ml-auto">Optionnel</span>
          </label>
          <p className="text-xs text-amber-800/80 mb-2.5 font-medium">
            Une explication ou anecdote amusante affichée aux joueurs pour les aider à progresser !
          </p>
          <textarea
            value={question.complement_if_wrong || ""}
            onChange={(e) =>
              onChange({
                ...question,
                complement_if_wrong: e.target.value,
              })
            }
            placeholder={t("createQuiz.complementIfWrongPlaceholder")}
            className="w-full px-3.5 py-2.5 bg-white border border-amber-300/80 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-slate-800 text-sm font-medium"
            rows={3}
          />
        </div>
      </div>

      {showSaveCancelButtons && (
        <div className="flex flex-col sm:flex-row gap-3 pt-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="sm:w-1/3 py-3.5 px-5 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200 transition-all font-black text-sm border-b-4 border-slate-300 active:border-b-0 active:translate-y-1 flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              {cancelButtonLabel || t("common.cancel")}
            </button>
          )}
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              className="flex-1 py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all font-black text-base border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              {isEditing ? (
                <>
                  <Save className="w-5 h-5" />
                  {saveButtonLabel || t("createQuiz.updateQuestion")}
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  {saveButtonLabel || t("createQuiz.addThisQuestion")}
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
