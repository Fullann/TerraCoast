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
import { feature as topojsonFeature } from "topojson-client";
import worldMapData from "world-atlas/countries-110m.json";
import swissMapData from "swiss-maps/2026/ch-combined.json";
import {
  FR_DEPARTEMENTS_GEOJSON_URL,
  getSubdivisionIso3ByTopoId,
  type SubdivisionScope,
} from "../../lib/subdivisionGameData";
import usStatesData from "us-atlas/states-10m.json";

interface PuzzleMapQuestionProps {
  countries: CountryGameEntry[];
  showTargetList: boolean;
  revealResult: boolean;
  geographySource?: "world" | SubdivisionScope;
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

const defaultMapViewBySource: Record<
  "world" | SubdivisionScope,
  { center: [number, number]; zoom: number; projectionScale?: number }
> = {
  world: { center: [0, 20], zoom: 1 },
  ch_cantons: { center: [8.2, 46.8], zoom: 2.2, projectionScale: 6500 },
  fr_departements: { center: [2.4, 46.5], zoom: 1.9, projectionScale: 3800 },
  us_states: { center: [-96, 38], zoom: 1.5, projectionScale: 1200 },
};

const viewBoundsBySource: Record<
  SubdivisionScope,
  { minLng: number; maxLng: number; minLat: number; maxLat: number; minZoom: number }
> = {
  ch_cantons: { minLng: 4, maxLng: 12, minLat: 44, maxLat: 49, minZoom: 1.2 },
  fr_departements: { minLng: -6, maxLng: 10, minLat: 41, maxLat: 52, minZoom: 1.1 },
  us_states: { minLng: -170, maxLng: -60, minLat: 15, maxLat: 75, minZoom: 1.1 },
};

export function PuzzleMapQuestion({
  countries,
  showTargetList,
  revealResult,
  geographySource = "world",
  initialView,
  assignments,
  pickedIso3s,
  onAssignmentsChange,
  onPickedIso3sChange,
}: PuzzleMapQuestionProps) {
  const { t } = useLanguage();
  const [activeCountryIso3, setActiveCountryIso3] = useState<string>("");
  const rawCenterLng = Number(initialView?.centerLng ?? 0);
  const rawCenterLat = Number(initialView?.centerLat ?? 20);
  const rawZoom = Number(initialView?.zoom ?? 1);
  const hasLegacyWorldView =
    geographySource !== "world" &&
    rawCenterLng === 0 &&
    rawCenterLat === 20 &&
    rawZoom === 1;
  const hasInvalidSubdivisionView =
    geographySource !== "world" &&
    (() => {
      const bounds = viewBoundsBySource[geographySource];
      if (!bounds) return false;
      return (
        rawCenterLng < bounds.minLng ||
        rawCenterLng > bounds.maxLng ||
        rawCenterLat < bounds.minLat ||
        rawCenterLat > bounds.maxLat ||
        rawZoom < bounds.minZoom
      );
    })();
  const initialCenter = useMemo<[number, number]>(() => {
    const fallback = defaultMapViewBySource[geographySource].center;
    return [
      hasLegacyWorldView || hasInvalidSubdivisionView
        ? fallback[0]
        : Number(initialView?.centerLng ?? fallback[0]),
      hasLegacyWorldView || hasInvalidSubdivisionView
        ? fallback[1]
        : Number(initialView?.centerLat ?? fallback[1]),
    ];
  }, [
    geographySource,
    hasInvalidSubdivisionView,
    hasLegacyWorldView,
    initialView?.centerLat,
    initialView?.centerLng,
  ]);
  const initialZoom = useMemo<number>(() => {
    const fallbackZoom = defaultMapViewBySource[geographySource].zoom;
    const computedZoom = hasLegacyWorldView || hasInvalidSubdivisionView
      ? fallbackZoom
      : Number(initialView?.zoom ?? fallbackZoom);
    return Math.max(1, Math.min(8, computedZoom));
  }, [geographySource, hasInvalidSubdivisionView, hasLegacyWorldView, initialView?.zoom]);
  const [mapCenter, setMapCenter] = useState<[number, number]>(initialCenter);
  const [mapZoom, setMapZoom] = useState(initialZoom);
  const [frSubdivisionGeo, setFrSubdivisionGeo] = useState<any | null>(null);
  const isSubdivision = geographySource !== "world";
  const isSubdivisionTargetMode = isSubdivision && showTargetList;
  const swissSubdivisionGeo = useMemo(() => {
    const cantonsObject = (swissMapData as any)?.objects?.cantons;
    if (!cantonsObject) return null;
    return topojsonFeature(swissMapData as any, cantonsObject) as any;
  }, []);
  const usSubdivisionGeo = useMemo(() => {
    const statesObject = (usStatesData as any)?.objects?.states;
    if (!statesObject) return null;
    return topojsonFeature(usStatesData as any, statesObject) as any;
  }, []);
  const emptyFeatureCollection = useMemo(
    () => ({ type: "FeatureCollection", features: [] as any[] }),
    []
  );
  const geoUrl =
    geographySource === "ch_cantons"
      ? (swissSubdivisionGeo || emptyFeatureCollection)
      : geographySource === "us_states"
      ? (usSubdivisionGeo || emptyFeatureCollection)
      : geographySource === "fr_departements"
      ? (frSubdivisionGeo || emptyFeatureCollection)
      : (worldMapData as any);

  useEffect(() => {
    setMapCenter(initialCenter);
    setMapZoom(initialZoom);
  }, [initialCenter, initialZoom]);

  useEffect(() => {
    let cancelled = false;

    const loadSubdivisionGeography = async () => {
      if (geographySource !== "fr_departements") {
        setFrSubdivisionGeo(null);
        return;
      }
      try {
        const response = await fetch(FR_DEPARTEMENTS_GEOJSON_URL);
        const featureCollection = await response.json();
        if (!cancelled) setFrSubdivisionGeo(featureCollection as any);
      } catch {
        if (!cancelled) setFrSubdivisionGeo(emptyFeatureCollection);
      }
    };

    loadSubdivisionGeography();
    return () => {
      cancelled = true;
    };
  }, [geographySource, emptyFeatureCollection]);

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
    const nextAssignments = { ...assignments };
    if (!draggedIso3) {
      nextAssignments[slotIso3] = "";
      onAssignmentsChange(nextAssignments);
      setActiveCountryIso3("");
      return;
    }
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
    const normalize = (value: string) =>
      value
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "");

    if (geographySource !== "world") {
      const byTopoId = getSubdivisionIso3ByTopoId(
        geographySource,
        geo?.id ?? properties.id
      );
      if (byTopoId) return byTopoId;

      const codeCandidates = [
        properties.kan_code,
        properties.kanton_code,
        properties.abbr,
        properties.code,
        properties.code_insee,
        properties.INSEE_DEP,
        properties.STUSPS,
        properties.iso,
        properties.iso_code,
      ]
        .map((value) => String(value || "").trim())
        .filter(Boolean);

      for (const raw of codeCandidates) {
        if (geographySource === "ch_cantons") {
          if (/^CH-[A-Z]{2}$/i.test(raw)) return raw.toUpperCase();
          if (/^[A-Z]{2}$/i.test(raw)) return `CH-${raw.toUpperCase()}`;
        }
        if (geographySource === "fr_departements") {
          if (/^\d{2}$/i.test(raw) || /^2A$/i.test(raw) || /^2B$/i.test(raw)) {
            return `FR-${raw.toUpperCase()}`;
          }
          if (/^FR-/i.test(raw)) return raw.toUpperCase();
        }
        if (geographySource === "us_states") {
          if (/^US-[A-Z]{2}$/i.test(raw)) return raw.toUpperCase();
          if (/^[A-Z]{2}$/i.test(raw)) return `US-${raw.toUpperCase()}`;
        }
      }

      const nameCandidates = [
        properties.kanton,
        properties.kan_name,
        properties.kanton_name,
        properties.name,
        properties.NAME,
        properties.nom,
        properties.label,
      ]
        .map((value) => String(value || "").trim())
        .filter(Boolean);

      for (const nameCandidate of nameCandidates) {
        const normalizedName = normalize(nameCandidate);
        const candidate = countries.find(
          (country) => normalize(country.name) === normalizedName
        );
        if (candidate) return candidate.iso3;
      }
    }

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
    setMapCenter(initialCenter);
    setMapZoom(initialZoom);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
          <p className="text-sm text-gray-700 font-medium">
            {geographySource === "ch_cantons"
              ? t("playQuiz.puzzle.mapTitleSwissCantons")
              : geographySource === "fr_departements"
              ? t("playQuiz.puzzle.mapTitleFrenchDepartments")
              : geographySource === "us_states"
              ? t("playQuiz.puzzle.mapTitleUsStates")
              : t("playQuiz.puzzle.worldMap")}
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
        <ComposableMap
          projection="geoMercator"
          projectionConfig={
            defaultMapViewBySource[geographySource].projectionScale
              ? { scale: defaultMapViewBySource[geographySource].projectionScale }
              : undefined
          }
          style={{ width: "100%", height: 420 }}
        >
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
                          if (isSubdivisionTargetMode) {
                            if (!geoIso3) return;
                            const alreadyAssigned = assignments[geoIso3] === geoIso3;
                            if (isTarget) {
                              assignCountryToSlot(alreadyAssigned ? "" : geoIso3, geoIso3);
                            } else {
                              togglePickedCountry(geoIso3);
                            }
                            return;
                          }
                          if (!isTarget) return;
                          if (activeCountryIso3) {
                            assignCountryToSlot(activeCountryIso3, geoIso3);
                            return;
                          }
                          // Permet un clic direct sur la bonne region meme sans selection dans la liste
                          assignCountryToSlot(geoIso3, geoIso3);
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
                                : isSubdivisionTargetMode
                                ? "#E5E7EB"
                                : "#C7D2FE"
                              : isSubdivisionTargetMode && isPicked
                              ? revealResult
                                ? "#EF4444"
                                : "#93C5FD"
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
                            ? isSubdivisionTargetMode
                              ? geoIso3
                                ? "pointer"
                                : "default"
                              : isTarget
                              ? "pointer"
                              : "default"
                            : geoIso3
                            ? "pointer"
                            : "default",
                        },
                        hover: {
                          fill: showTargetList
                            ? isTarget
                              ? isSubdivisionTargetMode
                                ? "#D1D5DB"
                                : "#93C5FD"
                              : isSubdivisionTargetMode && geoIso3
                              ? "#D1D5DB"
                              : "#D1D5DB"
                            : geoIso3
                            ? "#93C5FD"
                            : "#D1D5DB",
                          stroke: "#6B7280",
                          strokeWidth: 0.6,
                          outline: "none",
                          cursor: showTargetList
                            ? isSubdivisionTargetMode
                              ? geoIso3
                                ? "pointer"
                                : "default"
                              : isTarget
                              ? "pointer"
                              : "default"
                            : geoIso3
                            ? "pointer"
                            : "default",
                        },
                        pressed: {
                          fill: showTargetList
                            ? isTarget
                              ? isSubdivisionTargetMode
                                ? "#9CA3AF"
                                : "#60A5FA"
                              : isSubdivisionTargetMode && isPicked
                              ? "#60A5FA"
                              : "#D1D5DB"
                            : geoIso3
                            ? "#60A5FA"
                            : "#D1D5DB",
                          stroke: "#6B7280",
                          strokeWidth: 0.6,
                          outline: "none",
                          cursor: showTargetList
                            ? isSubdivisionTargetMode
                              ? geoIso3
                                ? "pointer"
                                : "default"
                              : isTarget
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
          {isSubdivisionTargetMode ? (
            <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700">
              {t("playQuiz.puzzle.selectedCountries")}:{" "}
              {new Set([
                ...Object.values(assignments).filter(Boolean),
                ...pickedIso3s,
              ]).size}
              /{countries.length}. {t("playQuiz.puzzle.selectionHint")}
            </div>
          ) : (
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
                      {typeof slotCountry.lat === "number" &&
                      typeof slotCountry.lng === "number" &&
                      (Math.abs(slotCountry.lat) > 0.001 ||
                        Math.abs(slotCountry.lng) > 0.001) ? (
                        <p className="text-xs text-gray-400 mb-2">
                          {t("playQuiz.puzzle.slot")}: {slotCountry.lat.toFixed(1)},{" "}
                          {slotCountry.lng.toFixed(1)}
                        </p>
                      ) : null}
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
          )}
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
