import React from "react";
import { useLanguage } from "../../../contexts/LanguageContext";
import {
  getCountriesByIso3,
  getCountryNameVariantsByIso3,
  getCountryCapitalVariantsByIso3,
} from "../../../lib/countryGameData";
import type { Question, CountryMultiInputRow } from "./types";

interface CountryMultiQuestionViewProps {
  question: Question;
  inputs: Record<string, CountryMultiInputRow>;
  isAnswered: boolean;
  onInputChange: (
    iso3: string,
    field: "countryName" | "capital",
    value: string
  ) => void;
}

export const CountryMultiQuestionView: React.FC<CountryMultiQuestionViewProps> = ({
  question,
  inputs,
  isAnswered,
  onInputChange,
}) => {
  const { t, language } = useLanguage();

  const mapData = (question.map_data || {}) as {
    selectedCountries?: string[];
    requiredFields?: ("name" | "capital" | "map_click")[];
    countryMultiPrompt?: string;
  };

  const targets = getCountriesByIso3(mapData.selectedCountries || []);
  const requiredFields: ("name" | "capital" | "map_click")[] = [
    "name",
    "capital",
    "map_click",
  ];
  const isCompact = targets.length >= 8;

  return (
    <div className="space-y-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
      {(mapData.countryMultiPrompt || "").trim() && (
        <p className="text-sm text-indigo-900">{mapData.countryMultiPrompt}</p>
      )}
      <p className="text-sm text-indigo-900">
        {t("playQuiz.countryMulti.targetCountries")}:{" "}
        <span className="font-semibold">{targets.length}</span>
      </p>
      <div
        className={
          isCompact
            ? "max-h-80 overflow-auto rounded border border-indigo-200"
            : "grid grid-cols-1 md:grid-cols-2 gap-3"
        }
      >
        {targets.map((target, index) => {
          const rowInput = inputs[target.iso3] || {
            countryName: "",
            capital: "",
          };
          const nameOptions = getCountryNameVariantsByIso3(target.iso3, language);
          const capitalOptions = getCountryCapitalVariantsByIso3(target.iso3, language);
          const nameListId = `cm-name-${question.id}-${target.iso3}`;
          const capitalListId = `cm-capital-${question.id}-${target.iso3}`;

          return (
            <div
              key={target.iso3}
              className={`rounded-lg border border-indigo-200 bg-white p-3 ${
                isCompact
                  ? "border-x-0 border-t-0 last:border-b-0 rounded-none"
                  : ""
              }`}
            >
              <p className="text-sm font-semibold text-indigo-800 mb-2">
                {t("playQuiz.countryMulti.targetIndex").replace(
                  "{index}",
                  String(index + 1)
                )}
              </p>
              {requiredFields.includes("name") && (
                <div className="mb-2">
                  <input
                    type="text"
                    value={rowInput.countryName}
                    list={nameListId}
                    disabled={isAnswered}
                    onChange={(e) =>
                      onInputChange(target.iso3, "countryName", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none disabled:bg-gray-100"
                    placeholder={t("playQuiz.countryMulti.fieldName")}
                  />
                  <datalist id={nameListId}>
                    {nameOptions.slice(0, 20).map((opt) => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Astuce: commence a taper puis choisis dans la liste.
                  </p>
                </div>
              )}
              {requiredFields.includes("capital") && (
                <div>
                  <input
                    type="text"
                    value={rowInput.capital}
                    list={capitalListId}
                    disabled={isAnswered}
                    onChange={(e) =>
                      onInputChange(target.iso3, "capital", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none disabled:bg-gray-100"
                    placeholder={t("playQuiz.countryMulti.fieldCapital")}
                  />
                  <datalist id={capitalListId}>
                    {capitalOptions.slice(0, 20).map((opt) => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Tu peux selectionner la capitale (souvent en anglais) dans la liste.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
