import { useEffect, useMemo, useState } from "react";
import {
  getIso3ByNumericCode,
  type CountryGameEntry,
} from "../../lib/countryGameData";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import worldMapData from "world-atlas/countries-110m.json";

interface PuzzleMapQuestionProps {
  countries: CountryGameEntry[];
  showTargetList: boolean;
  revealResult: boolean;
  initialView?: {
    centerLat?: number;
    centerLng?: number;
    zoom?: number;
  } | null;
  assignments: Record<string, string>;
  pickedIso3s: string[];
  onAssignmentsChange: (next: Record<string, string>) => void;
  onPickedIso3sChange: (next: string[]) => void;
}

export function PuzzleMapQuestion({
  countries,
  showTargetList,
  revealResult,
  initialView,
  assignments,
  pickedIso3s,
  onAssignmentsChange,
  onPickedIso3sChange,
}: PuzzleMapQuestionProps) {
  const { t } = useLanguage();
  const [activeCountryIso3, setActiveCountryIso3] = useState<string>("");
  const getInitialCenter = (): [number, number] => [
    Number(initialView?.centerLng ?? 0),
    Number(initialView?.centerLat ?? 20),
  ];
  const getInitialZoom = (): number =>
    Math.max(1, Math.min(8, Number(initialView?.zoom ?? 1)));
  const [mapCenter, setMapCenter] = useState<[number, number]>(getInitialCenter);
  const [mapZoom, setMapZoom] = useState(getInitialZoom);
  const geoUrl = worldMapData as any;

  useEffect(() => {
    setMapCenter(getInitialCenter());
    setMapZoom(getInitialZoom());
  }, [initialView?.centerLat, initialView?.centerLng, initialView?.zoom]);

  const countryByIso = useMemo(
    () =>
      Object.fromEntries(countries.map((country) => [country.iso3, country])) as Record<
        string,
        CountryGameEntry
      >,
    [countries]
  );

  const usedIsoSet = useMemo(
    () => new Set(Object.values(assignments).filter(Boolean)),
    [assignments]
  );

  const unassignedCountries = countries.filter((c) => !usedIsoSet.has(c.iso3));

  const targetIsoSet = useMemo(
    () => new Set(countries.map((country) => country.iso3)),
    [countries]
  );

  const assignCountryToSlot = (draggedIso3: string, slotIso3: string) => {
    if (!draggedIso3) return;
    const nextAssignments = { ...assignments };
    Object.keys(nextAssignments).forEach((key) => {
      if (nextAssignments[key] === draggedIso3) nextAssignments[key] = "";
    });
    nextAssignments[slotIso3] = draggedIso3;
    onAssignmentsChange(nextAssignments);
    setActiveCountryIso3("");
  };

  const togglePickedCountry = (iso3: string) => {
    if (!iso3) return;
    if (pickedIso3s.includes(iso3)) {
      onPickedIso3sChange(pickedIso3s.filter((entry) => entry !== iso3));
      return;
    }
    onPickedIso3sChange([...pickedIso3s, iso3]);
  };

  const handleDropOnSlot = (
    event: React.DragEvent<HTMLElement | SVGPathElement>,
    slotIso3: string
  ) => {
    event.preventDefault();
    const draggedIso3 = event.dataTransfer.getData("text/plain");
    if (!draggedIso3) return;
    assignCountryToSlot(draggedIso3, slotIso3);
  };

  const getGeoIso3 = (geo: any): string => {
    const properties = geo?.properties || {};
    const numericCandidates = [properties.id, geo?.id];
    for (const numeric of numericCandidates) {
      const fromNumeric = getIso3ByNumericCode(numeric);
      if (fromNumeric) return fromNumeric;
    }

    const candidates = [
      properties.ISO_A3,
      properties.iso_a3,
      properties.ADM0_A3,
      properties.adm0_a3,
      properties.gu_a3,
      properties.su_a3,
      properties.id,
      geo?.id,
    ];
    const isoCandidate = candidates.find(
      (value) => typeof value === "string" && value.length === 3
    );
    if (isoCandidate) return String(isoCandidate).toUpperCase();

    const geoName = String(
      properties.NAME || properties.name || properties.ADMIN || ""
    ).trim();
    if (!geoName) return "";
    const match = countries.find(
      (country) => country.name.toLowerCase() === geoName.toLowerCase()
    );
    return match?.iso3 || "";
  };

  const zoomIn = () => setMapZoom((prev) => Math.min(8, prev + 0.5));
  const zoomOut = () => setMapZoom((prev) => Math.max(1, prev - 0.5));
  const resetView = () => {
    setMapCenter(getInitialCenter());
    setMapZoom(getInitialZoom());
  };

  return (
    <div className="space-y-4">
      <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
        <p className="text-sm text-sky-800">
          {t("playQuiz.puzzle.instructions")}
        </p>
        <p className="text-xs text-sky-700 mt-2">
          {showTargetList
            ? t("playQuiz.puzzle.instructions.withList")
            : t("playQuiz.puzzle.instructions.withoutList")}{" "}
          {t("playQuiz.puzzle.zoomHint")}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
          <p className="text-sm text-gray-700 font-medium">
            {t("playQuiz.puzzle.worldMap")}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={zoomOut}
              className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
            >
              -
            </button>
            <button
              type="button"
              onClick={zoomIn}
              className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
            >
              +
            </button>
            <button
              type="button"
              onClick={resetView}
              className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 text-xs"
            >
              {t("playQuiz.puzzle.resetView")}
            </button>
          </div>
        </div>
        <ComposableMap projection="geoMercator" style={{ width: "100%", height: 420 }}>
          <ZoomableGroup center={mapCenter} zoom={mapZoom}>
            <Geographies geography={geoUrl}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo: any) => {
                  const geoIso3 = getGeoIso3(geo);
                  const isTarget = targetIsoSet.has(geoIso3);
                  const isPicked = pickedIso3s.includes(geoIso3);
                  const assignedIso3 = assignments[geoIso3] || "";
                  const assignedCountry = assignedIso3
                    ? countryByIso[assignedIso3]
                    : null;
                  const isCorrect = assignedIso3 === geoIso3 && !!assignedIso3;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => {
                        if (showTargetList) {
                          if (!isTarget) return;
                          if (!activeCountryIso3) return;
                          assignCountryToSlot(activeCountryIso3, geoIso3);
                          return;
                        }
                        if (!geoIso3) return;
                        togglePickedCountry(geoIso3);
                      }}
                      onDrop={(event: any) => {
                        if (!showTargetList || !isTarget) return;
                        handleDropOnSlot(event as any, geoIso3);
                      }}
                      onDragOver={(event: any) => {
                        if (showTargetList && isTarget) event.preventDefault();
                      }}
                      style={{
                        default: {
                          fill: showTargetList
                            ? isTarget
                              ? assignedCountry
                                ? revealResult
                                  ? isCorrect
                                    ? "#10B981"
                                    : "#F59E0B"
                                  : "#93C5FD"
                                : "#C7D2FE"
                              : "#E5E7EB"
                            : isPicked
                            ? revealResult
                              ? isTarget
                                ? "#10B981"
                                : "#EF4444"
                              : "#93C5FD"
                            : "#E5E7EB",
                          stroke: "#9CA3AF",
                          strokeWidth: 0.5,
                          outline: "none",
                          cursor: showTargetList
                            ? isTarget
                              ? "pointer"
                              : "default"
                            : geoIso3
                            ? "pointer"
                            : "default",
                        },
                        hover: {
                          fill: showTargetList
                            ? isTarget
                              ? "#93C5FD"
                              : "#D1D5DB"
                            : geoIso3
                            ? "#93C5FD"
                            : "#D1D5DB",
                          stroke: "#6B7280",
                          strokeWidth: 0.6,
                          outline: "none",
                          cursor: showTargetList
                            ? isTarget
                              ? "pointer"
                              : "default"
                            : geoIso3
                            ? "pointer"
                            : "default",
                        },
                        pressed: {
                          fill: showTargetList
                            ? isTarget
                              ? "#60A5FA"
                              : "#D1D5DB"
                            : geoIso3
                            ? "#60A5FA"
                            : "#D1D5DB",
                          stroke: "#6B7280",
                          strokeWidth: 0.6,
                          outline: "none",
                          cursor: showTargetList
                            ? isTarget
                              ? "pointer"
                              : "default"
                            : geoIso3
                            ? "pointer"
                            : "default",
                        },
                      }}
                    >
                      <title>
                        {countryByIso[geoIso3]?.name ||
                          geo?.properties?.NAME ||
                          geo?.properties?.name ||
                          geo?.properties?.ADMIN ||
                          ""}
                      </title>
                    </Geography>
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {showTargetList ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {countries.map((slotCountry) => {
              const assignedIso3 = assignments[slotCountry.iso3] || "";
              const assignedCountry = assignedIso3 ? countryByIso[assignedIso3] : null;
              return (
                <div
                  key={slotCountry.iso3}
                  className="rounded-lg border border-gray-200 bg-white p-3"
                >
                  <p className="text-xs text-gray-500 mb-1">{slotCountry.name}</p>
                  <p className="text-xs text-gray-400 mb-2">
                    {t("playQuiz.puzzle.slot")}: {slotCountry.lat.toFixed(1)},{" "}
                    {slotCountry.lng.toFixed(1)}
                  </p>
                  {assignedCountry ? (
                    <button
                      type="button"
                      onClick={() =>
                        onAssignmentsChange({
                          ...assignments,
                          [slotCountry.iso3]: "",
                        })
                      }
                      className="w-full text-left px-3 py-2 rounded border border-emerald-300 bg-emerald-50 text-emerald-800"
                    >
                      {assignedCountry.name}
                      <span className="text-xs text-emerald-700 ml-2">
                        ({t("playQuiz.puzzle.remove")})
                      </span>
                    </button>
                  ) : (
                    <div className="px-3 py-2 rounded border border-gray-200 bg-gray-50 text-gray-400">
                      {t("playQuiz.puzzle.dropHere")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              {t("playQuiz.puzzle.pool")}
            </p>
            <div className="flex flex-wrap gap-2">
              {unassignedCountries.map((country) => (
                <button
                  key={country.iso3}
                  type="button"
                  draggable
                  onDragStart={(event) =>
                    event.dataTransfer.setData("text/plain", country.iso3)
                  }
                  onClick={() => setActiveCountryIso3(country.iso3)}
                  className={`px-3 py-2 rounded border text-sm ${
                    activeCountryIso3 === country.iso3
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white hover:bg-gray-50"
                  }`}
                >
                  {country.name}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700">
          {t("playQuiz.puzzle.selectedCountries")}: {pickedIso3s.length}/
          {countries.length}. {t("playQuiz.puzzle.selectionHint")}
        </div>
      )}
    </div>
  );
}
