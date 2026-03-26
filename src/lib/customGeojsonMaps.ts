import type { CountryGameEntry } from "./countryGameData";

export type CustomGeoJsonPreset = {
  centerLat: number;
  centerLng: number;
  zoom: number;
  idProperty?: string;
  projectionScale?: number;
  /** Noms affichés par id de zone (id en majuscules, comme dans le GeoJSON) */
  featureLabels?: Record<string, string>;
};

export type CustomGeoJsonMapRow =
  import("./database.types").Database["public"]["Tables"]["geojson_custom_maps"]["Row"];

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

/** Accepte FeatureCollection, Feature unique ou GeometryCollection (première couche utile). */
export function normalizeGeoJsonToFeatureCollection(raw: unknown): {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
} | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.type === "FeatureCollection" && Array.isArray(o.features)) {
    return { type: "FeatureCollection", features: o.features as GeoJSONFeature[] };
  }
  if (o.type === "Feature" && o.geometry) {
    return {
      type: "FeatureCollection",
      features: [o as unknown as GeoJSONFeature],
    };
  }
  return null;
}

type GeoJSONFeature = {
  type?: string;
  id?: string | number;
  properties?: Record<string, unknown> | null;
  geometry?: { type?: string; coordinates?: unknown };
};

type BBoxAcc = { minLng: number; maxLng: number; minLat: number; maxLat: number };

function mergeBboxAcc(a: BBoxAcc | null, b: BBoxAcc | null): BBoxAcc | null {
  if (!a) return b;
  if (!b) return a;
  return {
    minLng: Math.min(a.minLng, b.minLng),
    maxLng: Math.max(a.maxLng, b.maxLng),
    minLat: Math.min(a.minLat, b.minLat),
    maxLat: Math.max(a.maxLat, b.maxLat),
  };
}

/** Parcourt récursivement des coordonnées GeoJSON [lng,lat] ou des tableaux imbriqués. */
function bboxWalkCoords(coords: unknown): BBoxAcc | null {
  if (!Array.isArray(coords) || coords.length === 0) return null;
  const first = coords[0];
  if (typeof first === "number" && coords.length >= 2) {
    const lng = Number(coords[0]);
    const lat = Number(coords[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
    return { minLng: lng, maxLng: lng, minLat: lat, maxLat: lat };
  }
  let acc: BBoxAcc | null = null;
  for (const c of coords) {
    acc = mergeBboxAcc(acc, bboxWalkCoords(c));
  }
  return acc;
}

function bboxOfGeometry(geom: GeoJSONFeature["geometry"]): [number, number, number, number] | null {
  if (!geom || typeof geom !== "object") return null;
  const g = geom as { type?: string; coordinates?: unknown };
  const c = g.coordinates;
  const box = bboxWalkCoords(c);
  if (!box) return null;
  return [box.minLng, box.minLat, box.maxLng, box.maxLat];
}

function centroidWalkCoords(coords: unknown): { lng: number; lat: number } | null {
  if (!Array.isArray(coords) || coords.length === 0) return null;
  const first = coords[0];
  if (typeof first === "number" && coords.length >= 2) {
    const lng = Number(coords[0]);
    const lat = Number(coords[1]);
    return Number.isFinite(lng) && Number.isFinite(lat) ? { lng, lat } : null;
  }
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (const c of coords) {
    const p = centroidWalkCoords(c);
    if (p) {
      sx += p.lng;
      sy += p.lat;
      n += 1;
    }
  }
  if (!n) return null;
  return { lng: sx / n, lat: sy / n };
}

function centroidOfRing(ring: number[][]): { lng: number; lat: number } | null {
  if (!ring.length) return null;
  let sx = 0;
  let sy = 0;
  let n = 0;
  for (const pt of ring) {
    if (!Array.isArray(pt) || pt.length < 2) continue;
    const lng = Number(pt[0]);
    const lat = Number(pt[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    sx += lng;
    sy += lat;
    n += 1;
  }
  if (!n) return null;
  return { lng: sx / n, lat: sy / n };
}

function centroidOfGeometry(geom: GeoJSONFeature["geometry"]): { lng: number; lat: number } | null {
  if (!geom || typeof geom !== "object") return null;
  const g = geom as { type?: string; coordinates?: unknown };
  const t = g.type;
  const c = g.coordinates;
  if (t === "Point" && Array.isArray(c) && c.length >= 2) {
    const lng = Number(c[0]);
    const lat = Number(c[1]);
    return Number.isFinite(lng) && Number.isFinite(lat) ? { lng, lat } : null;
  }
  if (t === "Polygon" && Array.isArray(c) && c[0]) {
    return centroidOfRing(c[0] as number[][]);
  }
  return centroidWalkCoords(c);
}

export function mergeBboxes(
  boxes: [number, number, number, number][]
): [number, number, number, number] | null {
  if (!boxes.length) return null;
  let minLng = boxes[0][0];
  let minLat = boxes[0][1];
  let maxLng = boxes[0][2];
  let maxLat = boxes[0][3];
  for (let i = 1; i < boxes.length; i++) {
    const b = boxes[i];
    minLng = Math.min(minLng, b[0]);
    minLat = Math.min(minLat, b[1]);
    maxLng = Math.max(maxLng, b[2]);
    maxLat = Math.max(maxLat, b[3]);
  }
  return [minLng, minLat, maxLng, maxLat];
}

function zoomHeuristicFromBbox(bbox: [number, number, number, number]): number {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const lngSpan = Math.max(Math.abs(maxLng - minLng), 1e-6);
  const latSpan = Math.max(Math.abs(maxLat - minLat), 1e-6);
  const span = Math.max(lngSpan, latSpan);
  const z = Math.log2(360 / span) * 0.92;
  return Math.max(1, Math.min(8, Number.isFinite(z) ? z : 2));
}

/** Id de zone depuis une géographie react-simple-maps (clic sur la carte). */
export function getZoneIdFromRsmGeography(
  geo: { properties?: Record<string, unknown> | null; id?: string | number },
  idProperty: string
): string {
  return getFeatureZoneId(
    {
      type: "Feature",
      properties: geo?.properties ?? {},
      id: geo?.id,
    },
    idProperty
  );
}

export function getFeatureZoneId(
  feature: GeoJSONFeature,
  idProperty: string
): string {
  const props = feature.properties || {};
  const key = idProperty.trim() || "tc_id";
  const fromProp = props[key];
  if (fromProp != null && String(fromProp).trim()) {
    return String(fromProp).trim().toUpperCase();
  }
  if (feature.id != null && String(feature.id).trim()) {
    return String(feature.id).trim().toUpperCase();
  }
  return "";
}

export function analyzeCustomGeoJsonText(
  text: string,
  idProperty = "tc_id"
): {
  featureCollection: { type: "FeatureCollection"; features: GeoJSONFeature[] };
  bbox: [number, number, number, number] | null;
  featureCount: number;
  preset: CustomGeoJsonPreset;
  featureSummaries: { id: string; label: string }[];
  error?: string;
  warnings: string[];
} {
  const warnings: string[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      featureCollection: { type: "FeatureCollection", features: [] },
      bbox: null,
      featureCount: 0,
      preset: { centerLat: 20, centerLng: 0, zoom: 2, idProperty },
      featureSummaries: [],
      error: "JSON invalide",
      warnings,
    };
  }
  const fc = normalizeGeoJsonToFeatureCollection(parsed);
  if (!fc || !fc.features.length) {
    return {
      featureCollection: { type: "FeatureCollection", features: [] },
      bbox: null,
      featureCount: 0,
      preset: { centerLat: 20, centerLng: 0, zoom: 2, idProperty },
      featureSummaries: [],
      error: "GeoJSON : attendu une FeatureCollection (ou une Feature) avec géométries.",
      warnings,
    };
  }

  const bboxes: [number, number, number, number][] = [];
  for (const f of fc.features) {
    if (f.geometry) {
      const b = bboxOfGeometry(f.geometry);
      if (b) bboxes.push(b);
    }
  }
  const bbox = mergeBboxes(bboxes);
  let centerLng = 0;
  let centerLat = 20;
  let zoom = 2;
  if (bbox) {
    centerLng = (bbox[0] + bbox[2]) / 2;
    centerLat = (bbox[1] + bbox[3]) / 2;
    zoom = zoomHeuristicFromBbox(bbox);
  }

  const seen = new Set<string>();
  const featureSummaries: { id: string; label: string }[] = [];
  for (let i = 0; i < fc.features.length; i++) {
    const f = fc.features[i];
    let id = getFeatureZoneId(f, idProperty);
    if (!id) {
      id = `__AUTO_${i + 1}`;
      warnings.push(
        `Entité #${i + 1} : pas de "${idProperty}" (ni id) — identifiant généré ${id}.`
      );
    }
    if (seen.has(id)) {
      warnings.push(`Identifiant dupliqué : ${id} (la dernière occurrence l’emporte pour l’éditeur).`);
    }
    seen.add(id);
    const props = f.properties || {};
    const label =
      String(
        props.name ??
          props.NAME ??
          props.label ??
          props.nom ??
          id
      ).trim() || id;
    featureSummaries.push({ id, label });
  }

  return {
    featureCollection: fc,
    bbox,
    featureCount: fc.features.length,
    preset: {
      centerLat,
      centerLng,
      zoom,
      idProperty,
    },
    featureSummaries,
    warnings,
  };
}

export function countryEntriesFromGeoJson(
  fc: { features: GeoJSONFeature[] },
  selectedIds: string[],
  idProperty: string,
  featureLabels?: Record<string, string>
): CountryGameEntry[] {
  const want = new Set(selectedIds.map((s) => String(s).trim().toUpperCase()).filter(Boolean));
  const list: CountryGameEntry[] = [];
  for (let i = 0; i < fc.features.length; i++) {
    const f = fc.features[i];
    const id = getFeatureZoneId(f, idProperty);
    if (!id || !want.has(id)) continue;
    const props = f.properties || {};
    const fromPreset = featureLabels?.[id];
    const fallbackName =
      String(
        props.name ?? props.NAME ?? props.label ?? props.nom ?? id
      ).trim() || id;
    const name =
      typeof fromPreset === "string" && fromPreset.trim()
        ? fromPreset.trim()
        : fallbackName;
    const c = f.geometry ? centroidOfGeometry(f.geometry) : null;
    list.push({
      iso3: id,
      numericCode: null,
      name,
      continent: "Custom",
      lat: c?.lat ?? 0,
      lng: c?.lng ?? 0,
      population: 0,
      area_km2: 0,
    });
  }
  return list;
}

function parseFeatureLabels(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string" && v.trim()) {
      out[String(k).trim().toUpperCase()] = v.trim();
    }
  }
  return Object.keys(out).length ? out : undefined;
}

export function presetFromRowPreset(raw: unknown): CustomGeoJsonPreset {
  const o = asRecord(raw);
  const idProperty =
    typeof o?.idProperty === "string" && o.idProperty.trim()
      ? o.idProperty.trim()
      : "tc_id";
  return {
    centerLat: Number(o?.centerLat ?? 20),
    centerLng: Number(o?.centerLng ?? 0),
    zoom: Math.max(1, Math.min(8, Number(o?.zoom ?? 2))),
    idProperty,
    projectionScale:
      typeof o?.projectionScale === "number" && Number.isFinite(o.projectionScale)
        ? o.projectionScale
        : undefined,
    featureLabels: parseFeatureLabels(o?.featureLabels),
  };
}

export async function fetchGeoJsonFeatureCollection(
  url: string
): Promise<{ type: "FeatureCollection"; features: GeoJSONFeature[] } | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  return normalizeGeoJsonToFeatureCollection(json);
}

export function slugifyGeoMapName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
