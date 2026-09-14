import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import worldMapData from "world-atlas/countries-110m.json";
import { getCountriesByIso3 } from "../../lib/countryGameData";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../../contexts/LanguageContext";
import type { Database } from "../../lib/database.types";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
type QuizType = Database["public"]["Tables"]["quiz_types"]["Row"];

export interface QuizWithType extends Quiz {
  quiz_types?: QuizType | null;
}

export interface MapQuizPoint {
  quiz: QuizWithType;
  lat: number;
  lng: number;
  isApprox: boolean;
}

export interface HiddenMapQuizInfo {
  id: string;
  title: string;
}

const TAG_BASED_REGION_CENTERS: Array<{
  keys: string[];
  lat: number;
  lng: number;
}> = [
  { keys: ["europe", "europa"], lat: 54, lng: 15 },
  { keys: ["afrique", "africa"], lat: 5, lng: 20 },
  { keys: ["asie", "asia"], lat: 30, lng: 95 },
  {
    keys: [
      "ameriques",
      "amériques",
      "americas",
      "north america",
      "south america",
      "amerique",
      "amérique",
      "america",
    ],
    lat: 12,
    lng: -75,
  },
  { keys: ["oceanie", "océanie", "oceania"], lat: -22, lng: 140 },
  { keys: ["suisse", "switzerland", "schweiz", "svizzera"], lat: 46.8, lng: 8.2 },
  { keys: ["valais", "wallis"], lat: 46.2, lng: 7.5 },
  { keys: ["france"], lat: 46.6, lng: 2.3 },
  { keys: ["belgique", "belgium"], lat: 50.8, lng: 4.5 },
  { keys: ["canada"], lat: 56, lng: -106 },
  { keys: ["usa", "etats-unis", "états-unis", "united states"], lat: 39.8, lng: -98.5 },
];

export interface QuizzesMapViewProps {
  quizzes: QuizWithType[];
  activeTab: "public" | "favorites" | "created";
  getDifficultyLabel: (difficulty: string) => string;
  getGamesText: (count: number) => string;
}

export function QuizzesMapView({
  quizzes,
  activeTab,
  getDifficultyLabel,
  getGamesText,
}: QuizzesMapViewProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [selectedContinent, setSelectedContinent] = useState<
    "all" | "europe" | "africa" | "asia" | "americas" | "oceania"
  >("all");
  const [expandedGroupKey, setExpandedGroupKey] = useState<string | null>(null);
  const [mapTooltip, setMapTooltip] = useState<{
    quiz: QuizWithType;
    isApprox: boolean;
    x: number;
    y: number;
  } | null>(null);
  const [derivedMapCoords, setDerivedMapCoords] = useState<
    Record<string, { lat: number; lng: number }>
  >({});
  const [hiddenMapQuizzes, setHiddenMapQuizzes] = useState<HiddenMapQuizInfo[]>([]);
  const [showHiddenMapQuizzes, setShowHiddenMapQuizzes] = useState(false);

  const continentView: Record<
    "all" | "europe" | "africa" | "asia" | "americas" | "oceania",
    { center: [number, number]; zoom: number; label: string }
  > = {
    all: { center: [0, 20], zoom: 1, label: t("quizzes.map.continent.all") },
    europe: { center: [15, 54], zoom: 2.9, label: t("quizzes.map.continent.europe") },
    africa: { center: [20, 5], zoom: 2.5, label: t("quizzes.map.continent.africa") },
    asia: { center: [95, 30], zoom: 2.2, label: t("quizzes.map.continent.asia") },
    americas: {
      center: [-75, 15],
      zoom: 2.0,
      label: t("quizzes.map.continent.americas"),
    },
    oceania: { center: [140, -22], zoom: 2.8, label: t("quizzes.map.continent.oceania") },
  };

  const resolveApproxCoordsFromTags = (quiz: QuizWithType) => {
    const tags = Array.isArray(quiz.tags) ? quiz.tags : [];
    if (tags.length === 0) return null;
    const normalized = tags.map((tag) =>
      String(tag || "")
        .trim()
        .toLowerCase()
    );
    for (const region of TAG_BASED_REGION_CENTERS) {
      if (region.keys.some((k) => normalized.includes(k))) {
        return { lat: region.lat, lng: region.lng };
      }
    }
    return null;
  };

  useEffect(() => {
    let cancelled = false;
    const computeFallbackCoords = async () => {
      if (activeTab !== "public") return;
      const missingCoords = quizzes.filter(
        (quiz) =>
          !(
            typeof quiz.location_lat === "number" &&
            typeof quiz.location_lng === "number" &&
            quiz.location_lat >= -90 &&
            quiz.location_lat <= 90 &&
            quiz.location_lng >= -180 &&
            quiz.location_lng <= 180
          )
      );
      if (missingCoords.length === 0) {
        if (!cancelled) {
          setDerivedMapCoords({});
          setHiddenMapQuizzes([]);
        }
        return;
      }

      const quizIds = missingCoords.map((q) => q.id);
      const { data: quizQuestions } = await supabase
        .from("questions")
        .select("quiz_id, map_data")
        .in("quiz_id", quizIds)
        .in("question_type", ["puzzle_map", "map_click", "country_multi"]);

      const nextCoords: Record<string, { lat: number; lng: number }> = {};
      const nextHidden: HiddenMapQuizInfo[] = [];
      missingCoords.forEach((quiz) => {
        const relatedQuestions = (quizQuestions || []).filter(
          (q: any) => q.quiz_id === quiz.id
        );
        const selectedIso3s = relatedQuestions.flatMap((q: any) => {
          const mapData = q.map_data as { selectedCountries?: string[] } | null;
          return Array.isArray(mapData?.selectedCountries) ? mapData.selectedCountries : [];
        });
        const uniqueIso3s = [...new Set(selectedIso3s)].slice(0, 6);
        const countries = getCountriesByIso3(uniqueIso3s);
        if (countries.length > 0) {
          const avgLat = countries.reduce((sum, c) => sum + c.lat, 0) / countries.length;
          const avgLng = countries.reduce((sum, c) => sum + c.lng, 0) / countries.length;
          nextCoords[quiz.id] = { lat: avgLat, lng: avgLng };
          return;
        }
        const tagCoords = resolveApproxCoordsFromTags(quiz);
        if (tagCoords) {
          nextCoords[quiz.id] = tagCoords;
          return;
        }
        nextHidden.push({ id: quiz.id, title: quiz.title });
      });

      if (!cancelled) {
        setDerivedMapCoords(nextCoords);
        setHiddenMapQuizzes(nextHidden);
      }
    };

    computeFallbackCoords();
    return () => {
      cancelled = true;
    };
  }, [activeTab, quizzes]);

  const getContinentFromCoordinates = (
    lat: number,
    lng: number
  ): "europe" | "africa" | "asia" | "americas" | "oceania" => {
    if (lat < -10 && lng > 110) return "oceania";
    if (lng >= -170 && lng <= -30) return "americas";
    if (lat >= 35 && lng >= -25 && lng <= 60) return "europe";
    if (lat >= -35 && lat <= 35 && lng >= -20 && lng <= 55) return "africa";
    if (lng >= 55 && lng <= 180) return "asia";
    return "europe";
  };

  const mapQuizzes: MapQuizPoint[] = quizzes
    .map((quiz) => {
      if (
        typeof quiz.location_lat === "number" &&
        typeof quiz.location_lng === "number" &&
        quiz.location_lat >= -90 &&
        quiz.location_lat <= 90 &&
        quiz.location_lng >= -180 &&
        quiz.location_lng <= 180
      ) {
        return {
          quiz,
          lat: Number(quiz.location_lat),
          lng: Number(quiz.location_lng),
          isApprox: false,
        } satisfies MapQuizPoint;
      }
      const derived = derivedMapCoords[quiz.id];
      if (!derived) return null;
      return {
        quiz,
        lat: derived.lat,
        lng: derived.lng,
        isApprox: true,
      } satisfies MapQuizPoint;
    })
    .filter((item): item is MapQuizPoint => Boolean(item));

  const visibleMapQuizzes =
    selectedContinent === "all"
      ? mapQuizzes
      : mapQuizzes.filter(
          (point) =>
            getContinentFromCoordinates(
              Number(point.lat),
              Number(point.lng)
            ) === selectedContinent
        );

  const groupedMapQuizzes = (() => {
    const proximityLat = 1.2;
    const proximityLng = 1.4;
    const clusters: Array<{
      key: string;
      lat: number;
      lng: number;
      quizzes: MapQuizPoint[];
    }> = [];

    visibleMapQuizzes.forEach((point) => {
      const lat = Number(point.lat);
      const lng = Number(point.lng);
      let targetCluster: (typeof clusters)[number] | null = null;

      for (const cluster of clusters) {
        if (
          Math.abs(cluster.lat - lat) <= proximityLat &&
          Math.abs(cluster.lng - lng) <= proximityLng
        ) {
          targetCluster = cluster;
          break;
        }
      }

      if (!targetCluster) {
        clusters.push({
          key: `cluster-${clusters.length}-${point.quiz.id}`,
          lat,
          lng,
          quizzes: [point],
        });
      } else {
        targetCluster.quizzes.push(point);
      }
    });

    return clusters;
  })();

  const mapZoomFactor = continentView[selectedContinent].zoom;
  const markerRadius = Math.max(3.2, 5.2 / Math.sqrt(mapZoomFactor));
  const markerPulseRadius = Math.max(4.6, 7.8 / Math.sqrt(mapZoomFactor));

  const getMapPointColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "#10B981";
      case "medium":
        return "#F59E0B";
      case "hard":
        return "#EF4444";
      default:
        return "#10B981";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {t("quizzes.map.title")}
          </h2>
          <p className="text-sm text-gray-600">
            {t("quizzes.map.subtitle")}
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedContinent("all");
            setExpandedGroupKey(null);
          }}
          className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
        >
          {t("quizzes.map.resetView")}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(continentView) as Array<keyof typeof continentView>).map(
          (continentKey) => (
            <button
              key={continentKey}
              onClick={() => {
                setSelectedContinent(continentKey);
                setExpandedGroupKey(null);
              }}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                selectedContinent === continentKey
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {continentView[continentKey].label}
            </button>
          )
        )}
      </div>

      <div
        ref={mapContainerRef}
        className="relative w-full h-[420px] rounded-xl overflow-hidden border border-gray-200 bg-sky-50"
      >
        <ComposableMap
          projection="geoEqualEarth"
          width={980}
          height={420}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup
            center={continentView[selectedContinent].center}
            zoom={continentView[selectedContinent].zoom}
            minZoom={1}
            maxZoom={4}
          >
            <Geographies geography={worldMapData as any}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo: any) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#E5E7EB"
                    stroke="#9CA3AF"
                    strokeWidth={0.35}
                  />
                ))
              }
            </Geographies>

            {groupedMapQuizzes.map((group) => (
              <Marker
                key={`quiz-marker-group-${group.key}`}
                coordinates={[group.lng, group.lat]}
              >
                {group.quizzes.length > 1 && (
                  <g
                    onClick={() =>
                      setExpandedGroupKey((prev) =>
                        prev === group.key ? null : group.key
                      )
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <circle r={markerPulseRadius + 1.2} fill="#111827" opacity={0.16} />
                    <circle r={markerRadius + 1.6} fill="#111827" stroke="#ffffff" strokeWidth={1.2} />
                    <text
                      x={0}
                      y={2}
                      textAnchor="middle"
                      style={{ fill: "#ffffff", fontSize: "9px", fontWeight: 700 }}
                    >
                      {group.quizzes.length}
                    </text>
                  </g>
                )}

                {(group.quizzes.length === 1 || expandedGroupKey === group.key) &&
                  group.quizzes.map((point, index) => {
                    const quiz = point.quiz;
                    const stackSize = group.quizzes.length;
                    const angle = index * 0.9;
                    const ring = Math.floor(index / 8);
                    const pixelRadius = stackSize <= 1 ? 0 : 16 + ring * 12;
                    const dx = stackSize <= 1 ? 0 : Math.cos(angle) * pixelRadius;
                    const dy = stackSize <= 1 ? 0 : Math.sin(angle) * pixelRadius;
                    return (
                      <g
                        key={`quiz-point-${quiz.id}-${index}`}
                        transform={`translate(${dx}, ${dy})`}
                        onClick={() => navigate(`/quizzes/play/${quiz.id}`)}
                        onMouseEnter={(e: any) => {
                          const rect = mapContainerRef.current?.getBoundingClientRect();
                          if (!rect) return;
                          setMapTooltip({
                            quiz,
                            isApprox: point.isApprox,
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top,
                          });
                        }}
                        onMouseMove={(e: any) => {
                          const rect = mapContainerRef.current?.getBoundingClientRect();
                          if (!rect) return;
                          setMapTooltip((prev) =>
                            prev && prev.quiz.id === quiz.id
                              ? {
                                  ...prev,
                                  x: e.clientX - rect.left,
                                  y: e.clientY - rect.top,
                                }
                              : prev
                          );
                        }}
                        onMouseLeave={() => setMapTooltip(null)}
                        style={{ cursor: "pointer" }}
                      >
                        {stackSize > 1 && (
                          <line x1={-dx} y1={-dy} x2={0} y2={0} stroke="#6B7280" strokeWidth={0.5} />
                        )}
                        <circle
                          r={markerPulseRadius}
                          fill={getMapPointColor(quiz.difficulty)}
                          opacity={0.25}
                          className="quiz-map-marker-pulse"
                          style={{ animationDelay: `${(index % 8) * 0.1}s` }}
                        />
                        <circle
                          r={markerRadius}
                          fill={getMapPointColor(quiz.difficulty)}
                          stroke={point.isApprox ? "#1F2937" : "#ffffff"}
                          strokeWidth={1.2}
                          strokeDasharray={point.isApprox ? "2 1" : undefined}
                        />
                      </g>
                    );
                  })}
              </Marker>
            ))}
          </ZoomableGroup>
        </ComposableMap>
        {mapTooltip && (
          <div
            className="absolute z-20 pointer-events-none px-3 py-2 rounded-lg shadow-lg border bg-white/95 text-xs"
            style={{
              left: Math.min(mapTooltip.x + 14, 760),
              top: Math.max(mapTooltip.y - 12, 8),
            }}
          >
            <p className="font-semibold text-gray-900">{mapTooltip.quiz.title}</p>
            {mapTooltip.isApprox && (
              <p className="text-amber-700 font-medium">{t("quizzes.map.approxPosition")}</p>
            )}
            <p className="text-gray-700">
              Difficulté: {getDifficultyLabel(mapTooltip.quiz.difficulty)}
            </p>
            <p className="text-gray-700">
              Parties: {mapTooltip.quiz.total_plays}{" "}
              {getGamesText(mapTooltip.quiz.total_plays)}
            </p>
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-gray-500">
        {visibleMapQuizzes.length} quiz avec coordonnées visibles sur la carte.
      </p>
      {activeTab === "public" && hiddenMapQuizzes.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowHiddenMapQuizzes((prev) => !prev)}
            className="text-xs text-amber-700 hover:text-amber-800 underline underline-offset-2"
          >
            {t("quizzes.map.hiddenCount")
              .replace("{count}", String(hiddenMapQuizzes.length))}
          </button>
          {showHiddenMapQuizzes && (
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3 max-h-36 overflow-auto">
              <ul className="text-xs text-amber-900 space-y-1">
                {hiddenMapQuizzes.map((quiz) => (
                  <li key={`hidden-map-quiz-${quiz.id}`}>• {quiz.title}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
