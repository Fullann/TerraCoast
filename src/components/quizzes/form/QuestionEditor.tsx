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

  const getQuestionTypeLabel = (type: string) => {
    if (type === "puzzle_map") return t("editQuiz.questionType.puzzle_map");
    if (type === "top10_order") return t("editQuiz.questionType.top10_order");
    if (type === "country_multi") return t("createQuiz.countryMulti.typeLabel");
    return t(`editQuiz.questionType.${type}` as any);
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
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("editQuiz.question")} *
        </label>
        <input
          type="text"
          value={question.question_text}
          onChange={(e) =>
            onChange({ ...question, question_text: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
          placeholder={t("createQuiz.questionPlaceholder")}
        />
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("editQuiz.questionType.label")} *
          </label>
          <select
            value={question.question_type}
            onChange={(e) =>
              handleTypeChange(e.target.value as QuestionType)
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
          >
            <option value="mcq">{getQuestionTypeLabel("mcq")}</option>
            <option value="single_answer">
              {getQuestionTypeLabel("single_answer")}
            </option>
            <option value="true_false">{t("createQuiz.trueFalse.type")}</option>
            <option value="puzzle_map">
              {t("editQuiz.questionType.puzzle_map")}
            </option>
            <option value="map_click">
              {t("editQuiz.questionType.map_click")}
            </option>
            <option value="top10_order">
              {t("editQuiz.questionType.top10_order")}
            </option>
            <option value="country_multi">
              {t("createQuiz.countryMulti.typeLabel")}
            </option>
            <option value="text_free">{getQuestionTypeLabel("text_free")}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("editQuiz.points")}
          </label>
          <input
            type="number"
            value={question.points}
            onChange={(e) => {
              let value = parseInt(e.target.value) || 10;
              if (value > 500) value = 500;
              if (value < 10) value = 10;
              onChange({ ...question, points: value });
            }}
            min="10"
            max="500"
            step="10"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {question.question_type === "true_false" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            {t("createQuiz.trueFalse.description")}
          </p>
        </div>
      )}

      {question.question_type === "mcq" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("createQuiz.optionsMinTwo")}
          </label>
          <div className="space-y-3">
            {(Array.isArray(question.options)
              ? question.options
              : ["", "", "", ""]
            ).map((option, index) => (
              <div key={index} className="space-y-1">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder={`${t("editQuiz.option")} ${index + 1}`}
                />
                {option.trim() && (
                  <ImageDropzone
                    label={t("editQuiz.imageForOption").replace(
                      "{option}",
                      option
                    )}
                    currentImageUrl={question.option_images?.[option] || ""}
                    onImageUploaded={(url) =>
                      updateOptionImage(option, url)
                    }
                    bucketName="quiz-images"
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {t("createQuiz.optionImageDesc")}
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
              className={`p-4 rounded-lg border-2 transition-all font-medium ${
                question.correct_answer === trueFalseLabels.true
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 hover:border-green-300"
              }`}
            >
              ✓ {trueFalseLabels.true}
            </button>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...question,
                  correct_answer: trueFalseLabels.false,
                })
              }
              className={`p-4 rounded-lg border-2 transition-all font-medium ${
                question.correct_answer === trueFalseLabels.false
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-gray-200 hover:border-red-300"
              }`}
            >
              ✗ {trueFalseLabels.false}
            </button>
          </div>
        ) : question.question_type === "mcq" ? (
          <div className="space-y-2">
            <div className="space-y-2">
              {(Array.isArray(question.options)
                ? question.options
                : []
              )
                .filter((opt) => opt.trim())
                .map((option, index) => {
                  const isSelected = (
                    question.correct_answers || []
                  ).includes(option);

                  return (
                    <label
                      key={index}
                      className={`flex items-center space-x-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-gray-300"
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
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <span
                        className={`font-medium ${
                          isSelected
                            ? "text-emerald-700"
                            : "text-gray-700"
                        }`}
                      >
                        {option}
                        {isSelected && " ✓"}
                      </span>
                    </label>
                  );
                })}
            </div>
            <p className="text-xs text-gray-500">
              {t("createQuiz.multipleCorrect")}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              placeholder={t("createQuiz.answerPlaceholder")}
            />

            {(question.question_type === "text_free" ||
              question.question_type === "single_answer") && (
              <>
                <p className="text-xs text-gray-600 font-medium">
                  {t("createQuiz.variants")}
                </p>
                {(question.correct_answers || []).map((variant, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={variant}
                      onChange={(e) => updateVariant(index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                      placeholder={t(
                        "createQuiz.variantPlaceholder"
                      ).replace("{number}", String(index + 1))}
                    />
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      title={t("quiz.delete")}
                      aria-label={`${t("quiz.delete")} (${variant || index + 1})`}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addVariant}
                  className="px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t("createQuiz.addVariant")}
                </button>
                <p className="text-xs text-gray-500">
                  {t("createQuiz.variantsDesc")}
                </p>
              </>
            )}
          </div>
        )}

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("createQuiz.complementIfWrong")}
          </label>
          <textarea
            value={question.complement_if_wrong || ""}
            onChange={(e) =>
              onChange({
                ...question,
                complement_if_wrong: e.target.value,
              })
            }
            placeholder={t("createQuiz.complementIfWrongPlaceholder")}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            rows={3}
          />
        </div>
      </div>

      {showSaveCancelButtons && (
        <div className="flex space-x-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center justify-center"
            >
              <X className="w-5 h-5 mr-2" />
              {cancelButtonLabel || t("common.cancel")}
            </button>
          )}
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center justify-center"
            >
              {isEditing ? (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  {saveButtonLabel || t("createQuiz.updateQuestion")}
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
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
