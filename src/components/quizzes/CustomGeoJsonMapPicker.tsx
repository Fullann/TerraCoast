import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  analyzeCustomGeoJsonText,
  presetFromRowPreset,
  type CustomGeoJsonMapRow,
} from "../../lib/customGeojsonMaps";

type MapData = {
  mode?: string;
  mapLevel?: string;
  customGeojsonMapId?: string;
  customGeojsonPublicUrl?: string;
  customGeojsonIdProperty?: string;
  selectedCountries?: string[];
  initialView?: {
    centerLat?: number;
    centerLng?: number;
    zoom?: number;
  };
};

interface CustomGeoJsonMapPickerProps {
  mapData: MapData | null | undefined;
  storageMode: "puzzle_map" | "map_click";
  onPatch: (patch: Partial<MapData>) => void;
}

export function CustomGeoJsonMapPicker({
  mapData,
  storageMode,
  onPatch,
}: CustomGeoJsonMapPickerProps) {
  const [approvedMaps, setApprovedMaps] = useState<CustomGeoJsonMapRow[]>([]);
  const [features, setFeatures] = useState<{ id: string; label: string }[]>([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("geojson_custom_maps")
        .select("*")
        .eq("status", "approved")
        .order("name");
      if (!cancelled && data) setApprovedMaps(data as CustomGeoJsonMapRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const mapId = mapData?.customGeojsonMapId || "";
  const selectedMap = approvedMaps.find((m) => m.id === mapId);

  useEffect(() => {
    let cancelled = false;
    setLoadError("");
    setFeatures([]);
    const url =
      selectedMap?.public_url || mapData?.customGeojsonPublicUrl || "";
    const idProp =
      (selectedMap
        ? presetFromRowPreset(selectedMap.preset).idProperty
        : mapData?.customGeojsonIdProperty) || "tc_id";

    if (!url) return;

    (async () => {
      try {
        const res = await fetch(url);
        const text = await res.text();
        if (cancelled) return;
        const analyzed = analyzeCustomGeoJsonText(text, String(idProp));
        if (analyzed.error) {
          setLoadError(analyzed.error);
          return;
        }
        const labels = selectedMap
          ? presetFromRowPreset(selectedMap.preset).featureLabels
          : undefined;
        setFeatures(
          analyzed.featureSummaries.map((f) => ({
            id: f.id,
            label: (labels && labels[f.id]) || f.label,
          }))
        );
      } catch {
        if (!cancelled) setLoadError("Impossible de charger le GeoJSON.");
      }
    })();
  }, [
    mapId,
    selectedMap?.public_url,
    selectedMap?.preset,
    mapData?.customGeojsonPublicUrl,
    mapData?.customGeojsonIdProperty,
  ]);

  if (mapData?.mapLevel !== "custom_geojson") return null;

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Carte GeoJSON (catalogue)
        </label>
        <select
          value={mapId}
          onChange={(e) => {
            const nextId = e.target.value;
            const row = approvedMaps.find((m) => m.id === nextId);
            const preset = row?.preset as Record<string, unknown> | undefined;
            const centerLat = Number(preset?.centerLat ?? 20);
            const centerLng = Number(preset?.centerLng ?? 0);
            const zoom = Math.max(1, Math.min(8, Number(preset?.zoom ?? 2)));
            onPatch({
              customGeojsonMapId: nextId,
              customGeojsonPublicUrl: row?.public_url || "",
              customGeojsonIdProperty:
                typeof preset?.idProperty === "string" && preset.idProperty.trim()
                  ? preset.idProperty.trim()
                  : "tc_id",
              selectedCountries: [],
              initialView: { centerLat, centerLng, zoom },
              mode: storageMode,
              mapLevel: "custom_geojson",
            });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
        >
          <option value="">— Choisir une carte approuvée —</option>
          {approvedMaps.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.slug})
            </option>
          ))}
        </select>
        {approvedMaps.length === 0 && (
          <p className="text-xs text-amber-700 mt-1">
            Aucune carte GeoJSON approuvée pour le moment. Un administrateur doit en
            publier une depuis l’administration.
          </p>
        )}
      </div>

      {loadError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-2 py-1">
          {loadError}
        </p>
      )}

      {mapId && features.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zones cibles (propriété d’identifiant définie sur la carte)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-white">
            {features.map((f) => {
              const selected = mapData?.selectedCountries?.includes(f.id) || false;
              return (
                <label
                  key={f.id}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => {
                      const prev = mapData?.selectedCountries || [];
                      const next = e.target.checked
                        ? [...new Set([...prev, f.id])]
                        : prev.filter((x) => x !== f.id);
                      onPatch({
                        selectedCountries: next,
                        mode: storageMode,
                        mapLevel: "custom_geojson",
                      });
                    }}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="truncate" title={`${f.id} — ${f.label}`}>
                    {f.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
