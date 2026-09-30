import {
  geoAzimuthalEqualArea,
  geoPath,
  geoCentroid,
  geoArea,
  geoDistance,
} from "d3-geo";
import { getCountryFeaturesMap } from "./silhouetteGame";
import type { AtlasCountry } from "./atlasData";

export interface TrueSizePathsResult {
  pathA: string;
  pathB: string;
  centroidA: [number, number];
  centroidB: [number, number];
  scale: number;
  centerCanvas: [number, number];
  ratio: number;
  largerCountry: "A" | "B";
  smallerCountry: "A" | "B";
  cloneCoordinates: { x: number; y: number }[];
}

/**
 * Génère un polygone circulaire régulier pour les micro-nations absentes du dataset 110m (Monaco, Vatican, etc.)
 */
function createSyntheticCircle(lng: number, lat: number, areaKm2: number): any {
  const safeArea = Math.max(1, areaKm2 || 10);
  const radiusKm = Math.sqrt(safeArea / Math.PI);
  const radiusDeg = Math.max(0.015, radiusKm / 111.32);
  const points: [number, number][] = [];
  const segments = 32;

  const latCos = Math.max(0.1, Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= segments; i++) {
    const angle = (i * 2 * Math.PI) / segments;
    const pLng = lng + (radiusDeg * Math.cos(angle)) / latCos;
    const pLat = lat + radiusDeg * Math.sin(angle);
    points.push([pLng, pLat]);
  }

  return {
    type: "Feature",
    properties: { synthetic: true },
    geometry: {
      type: "Polygon",
      coordinates: [points],
    },
  };
}

/**
 * Isole la masse continentale principale d'un pays pour éviter que des territoires
 * d'outre-mer situés à 7000 km (ex: Guyane française pour la France) ne faussent
 * le cadrage du pays métropolitain.
 */
export function getCleanCountryFeature(country: AtlasCountry): any {
  const map = getCountryFeaturesMap();
  const rawFeature = map.get(country.iso3.toUpperCase());

  if (!rawFeature || !rawFeature.geometry) {
    return createSyntheticCircle(country.lng || 0, country.lat || 0, country.areaKm2 || 50);
  }

  if (rawFeature.geometry.type === "Polygon") {
    return rawFeature;
  }

  if (rawFeature.geometry.type === "MultiPolygon") {
    const coords: [number, number][][][] = rawFeature.geometry.coordinates;
    if (coords.length === 0) {
      return createSyntheticCircle(country.lng || 0, country.lat || 0, country.areaKm2 || 50);
    }

    // Trouve le polygone ayant la plus grande superficie
    let maxArea = -1;
    let bestPoly = coords[0];

    for (const poly of coords) {
      const single = { type: "Feature", geometry: { type: "Polygon", coordinates: poly } };
      const area = geoArea(single as any);
      if (area > maxArea) {
        maxArea = area;
        bestPoly = poly;
      }
    }

    const mainCentroid = geoCentroid({
      type: "Feature",
      geometry: { type: "Polygon", coordinates: bestPoly },
    } as any);

    // Conserve uniquement les polygones à moins de ~2800 km du centroïde principal (ex: métropole + îles côtières)
    const filtered = coords.filter((poly) => {
      const polyCentroid = geoCentroid({
        type: "Feature",
        geometry: { type: "Polygon", coordinates: poly },
      } as any);
      const distRad = geoDistance(mainCentroid, polyCentroid);
      return distRad < 0.45;
    });

    return {
      ...rawFeature,
      geometry: {
        type: "MultiPolygon",
        coordinates: filtered.length > 0 ? filtered : coords,
      },
    };
  }

  return rawFeature;
}

/**
 * Calcule le centroïde principal pour l'alignement
 */
export function getCountryCentroid(feature: any): [number, number] {
  if (!feature || !feature.geometry) return [0, 0];

  if (feature.geometry.type === "Polygon") {
    return geoCentroid(feature);
  }

  if (feature.geometry.type === "MultiPolygon") {
    const coords = feature.geometry.coordinates;
    let maxArea = -1;
    let bestPoly = coords[0];

    for (const poly of coords) {
      const single = { type: "Feature", geometry: { type: "Polygon", coordinates: poly } };
      const area = geoArea(single as any);
      if (area > maxArea) {
        maxArea = area;
        bestPoly = poly;
      }
    }

    return geoCentroid({
      type: "Feature",
      geometry: { type: "Polygon", coordinates: bestPoly },
    } as any);
  }

  return geoCentroid(feature);
}

/**
 * Calcule l'échelle commune optimale pour que les deux pays tiennent
 * dans le canvas SVG tout en préservant leur échelle relative réelle (True Size).
 */
export function computeFitScale(
  featA: any,
  featB: any,
  width: number = 600,
  height: number = 380
): number {
  let minScale = Infinity;

  for (const feat of [featA, featB]) {
    const centroid = getCountryCentroid(feat);
    const testProj = geoAzimuthalEqualArea()
      .rotate([-centroid[0], -centroid[1]])
      .translate([width / 2, height / 2])
      .scale(100);

    const bounds = geoPath(testProj).bounds(feat);
    const dx = Math.max(10, bounds[1][0] - bounds[0][0]);
    const dy = Math.max(10, bounds[1][1] - bounds[0][1]);

    const scale = 100 * Math.min((width * 0.72) / dx, (height * 0.72) / dy);
    if (scale < minScale) {
      minScale = scale;
    }
  }

  return Number.isFinite(minScale) && minScale > 0 ? minScale : 200;
}

/**
 * Génère les tracés SVG (path string) pour les deux pays à échelle True Size identique
 */
export function generateTrueSizeSvgs(
  countryA: AtlasCountry,
  countryB: AtlasCountry,
  options: {
    width?: number;
    height?: number;
    zoomMultiplier?: number;
    mode?: "overlay" | "sidebyside";
  } = {}
): TrueSizePathsResult {
  const width = options.width || 600;
  const height = options.height || 380;
  const zoom = options.zoomMultiplier || 1;
  const mode = options.mode || "overlay";

  const featA = getCleanCountryFeature(countryA);
  const featB = getCleanCountryFeature(countryB);

  const centroidA = getCountryCentroid(featA);
  const centroidB = getCountryCentroid(featB);

  const baseScale = computeFitScale(featA, featB, width, height);
  const finalScale = baseScale * zoom;

  let centerA: [number, number];
  let centerB: [number, number];

  if (mode === "sidebyside") {
    centerA = [width * 0.28, height / 2];
    centerB = [width * 0.72, height / 2];
  } else {
    // Mode Superposition : les deux centroïdes sont exactement au centre du canvas !
    centerA = [width / 2, height / 2];
    centerB = [width / 2, height / 2];
  }

  const projA = geoAzimuthalEqualArea()
    .rotate([-centroidA[0], -centroidA[1]])
    .translate(centerA)
    .scale(finalScale);

  const projB = geoAzimuthalEqualArea()
    .rotate([-centroidB[0], -centroidB[1]])
    .translate(centerB)
    .scale(finalScale);

  const pathA = geoPath(projA)(featA) || "";
  const pathB = geoPath(projB)(featB) || "";

  const areaA = Math.max(1, countryA.areaKm2 || 1);
  const areaB = Math.max(1, countryB.areaKm2 || 1);

  const largerCountry = areaA >= areaB ? "A" : "B";
  const smallerCountry = areaA >= areaB ? "B" : "A";
  const ratio = Math.max(areaA, areaB) / Math.min(areaA, areaB);

  // Positions fictives de clones pour le mode ludique "Combien de fois il rentre"
  const cloneCoordinates: { x: number; y: number }[] = [];
  const maxClones = Math.min(25, Math.floor(ratio));

  if (maxClones > 1) {
    const cols = Math.ceil(Math.sqrt(maxClones));
    const rows = Math.ceil(maxClones / cols);
    const spacingX = Math.min(60, width / (cols + 1));
    const spacingY = Math.min(60, height / (rows + 1));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (cloneCoordinates.length < maxClones) {
          const offsetX = (c - (cols - 1) / 2) * spacingX;
          const offsetY = (r - (rows - 1) / 2) * spacingY;
          cloneCoordinates.push({ x: offsetX, y: offsetY });
        }
      }
    }
  }

  return {
    pathA,
    pathB,
    centroidA,
    centroidB,
    scale: finalScale,
    centerCanvas: [width / 2, height / 2],
    ratio,
    largerCountry,
    smallerCountry,
    cloneCoordinates,
  };
}
