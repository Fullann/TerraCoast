import { feature as topojsonFeature } from "topojson-client";
import worldMapData from "world-atlas/countries-110m.json";
import { getAllAtlasCountries, type AtlasCountry } from "./atlasData";
import { getIso3ByNumericCode } from "./countryGameData";
import type { Language } from "../i18n/translations";

export interface GuessResult {
  guessedCountry: AtlasCountry;
  distanceKm: number;
  direction: string;
  arrow: string;
  proximityPercent: number;
  isCorrect: boolean;
}

export interface SilhouetteFeatureData {
  iso3: string;
  feature: any;
  bounds: {
    minLng: number;
    maxLng: number;
    minLat: number;
    maxLat: number;
  };
  center: [number, number];
  recommendedScale: number;
}

export interface SilhouetteHint {
  attempt: number;
  type: "continent" | "initial" | "capital" | "flag";
  label: string;
  value: string;
}

// Extraction et cache des features GeoJSON des pays
let cachedFeaturesByIso3: Map<string, any> | null = null;

export function getCountryFeaturesMap(): Map<string, any> {
  if (cachedFeaturesByIso3) {
    return cachedFeaturesByIso3;
  }

  const map = new Map<string, any>();
  const fc = topojsonFeature(worldMapData as any, (worldMapData as any).objects.countries) as any;
  
  if (fc && Array.isArray(fc.features)) {
    for (const f of fc.features) {
      const iso3 = getIso3ByNumericCode(f.id);
      if (iso3) {
        map.set(iso3.toUpperCase(), f);
      }
    }
  }

  cachedFeaturesByIso3 = map;
  return map;
}

/**
 * Calcule la boîte englobante (bounding box) d'une géométrie GeoJSON
 */
function extractCoords(geom: any, coords: [number, number][]) {
  if (!geom) return;
  if (geom.type === "Polygon") {
    for (const ring of geom.coordinates) {
      for (const pt of ring) {
        coords.push(pt);
      }
    }
  } else if (geom.type === "MultiPolygon") {
    for (const poly of geom.coordinates) {
      for (const ring of poly) {
        for (const pt of ring) {
          coords.push(pt);
        }
      }
    }
  }
}

export function getSilhouetteFeatureData(iso3: string): SilhouetteFeatureData | null {
  const map = getCountryFeaturesMap();
  const feature = map.get(iso3.toUpperCase());
  if (!feature || !feature.geometry) return null;

  const coords: [number, number][] = [];
  extractCoords(feature.geometry, coords);
  if (coords.length === 0) return null;

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;

  const dLng = Math.max(0.5, maxLng - minLng);
  const dLat = Math.max(0.5, maxLat - minLat);
  const maxSpan = Math.max(dLng, dLat);

  // Échelle dynamique inversement proportionnelle à la taille pour remplir le cadre (~400x400)
  const baseScale = Math.min(1800, Math.max(120, Math.round(1000 / maxSpan)));

  return {
    iso3: iso3.toUpperCase(),
    feature,
    bounds: { minLng, maxLng, minLat, maxLat },
    center: [centerLng, centerLat],
    recommendedScale: baseScale,
  };
}

/**
 * Distance géodésique de Haversine (en km)
 */
export function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Calcule l'orientation de la boussole (de la proposition vers la cible)
 */
export function calculateCompassBearing(
  latFrom: number,
  lngFrom: number,
  latTo: number,
  lngTo: number
): { direction: string; arrow: string; degrees: number } {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const dLng = toRad(lngTo - lngFrom);
  const fromLatRad = toRad(latFrom);
  const toLatRad = toRad(latTo);

  const y = Math.sin(dLng) * Math.cos(toLatRad);
  const x =
    Math.cos(fromLatRad) * Math.sin(toLatRad) -
    Math.sin(fromLatRad) * Math.cos(toLatRad) * Math.cos(dLng);

  let brng = (toDeg(Math.atan2(y, x)) + 360) % 360;

  // Découpage en 8 secteurs cardinaux
  const directions = [
    { name: "N", arrow: "⬆️" },
    { name: "NE", arrow: "↗️" },
    { name: "E", arrow: "➡️" },
    { name: "SE", arrow: "↘️" },
    { name: "S", arrow: "⬇️" },
    { name: "SW", arrow: "↙️" },
    { name: "W", arrow: "⬅️" },
    { name: "NW", arrow: "↖️" },
  ];

  const index = Math.round(brng / 45) % 8;
  return {
    direction: directions[index].name,
    arrow: directions[index].arrow,
    degrees: Math.round(brng),
  };
}

/**
 * Score de proximité en pourcentage (100% = trouvé, 0% = antipodes ~20015 km)
 */
export function calculateProximityPercent(distanceKm: number): number {
  if (distanceKm <= 0) return 100;
  const maxDistance = 20015;
  const score = 100 - (distanceKm / maxDistance) * 100;
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Évalue une proposition par rapport au pays cible
 */
export function evaluateGuess(
  guessedCountry: AtlasCountry,
  targetCountry: AtlasCountry
): GuessResult {
  const isCorrect = guessedCountry.iso3 === targetCountry.iso3;
  if (isCorrect) {
    return {
      guessedCountry,
      distanceKm: 0,
      direction: "EXACT",
      arrow: "🎯",
      proximityPercent: 100,
      isCorrect: true,
    };
  }

  const distanceKm = calculateHaversineDistance(
    guessedCountry.lat,
    guessedCountry.lng,
    targetCountry.lat,
    targetCountry.lng
  );

  const { direction, arrow } = calculateCompassBearing(
    guessedCountry.lat,
    guessedCountry.lng,
    targetCountry.lat,
    targetCountry.lng
  );

  const proximityPercent = calculateProximityPercent(distanceKm);

  return {
    guessedCountry,
    distanceKm,
    direction,
    arrow,
    proximityPercent,
    isCorrect: false,
  };
}

/**
 * Liste des pays valides pour le jeu de la silhouette (qui possèdent une géométrie 110m)
 */
export function getEligibleSilhouetteCountries(lang: Language = "fr"): AtlasCountry[] {
  const map = getCountryFeaturesMap();
  const all = getAllAtlasCountries(lang);

  return all.filter((c) => {
    if (!map.has(c.iso3)) return false;
    // Ignorer les entités microscopiques sans surface significative
    return c.areaKm2 > 1000 || c.population > 500000;
  });
}

/**
 * Sélectionne le pays mystère du jour (déterministe selon la date)
 */
export function getDailySilhouetteCountry(
  dateStr = new Date().toISOString().slice(0, 10),
  lang: Language = "fr"
): AtlasCountry {
  const eligible = getEligibleSilhouetteCountries(lang);
  if (eligible.length === 0) {
    return getAllAtlasCountries(lang)[0];
  }

  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }

  const index = hash % eligible.length;
  return eligible[index];
}

/**
 * Sélectionne un pays mystère aléatoire (mode entraînement)
 */
export function getRandomSilhouetteCountry(
  lang: Language = "fr",
  excludeIso3?: string
): AtlasCountry {
  const eligible = getEligibleSilhouetteCountries(lang).filter(
    (c) => c.iso3 !== excludeIso3
  );
  if (eligible.length === 0) {
    return getAllAtlasCountries(lang)[0];
  }
  const index = Math.floor(Math.random() * eligible.length);
  return eligible[index];
}

/**
 * Génère un indice selon le nombre d'essais échoués
 */
export function getHintsForAttempt(
  targetCountry: AtlasCountry,
  attemptCount: number
): SilhouetteHint[] {
  const hints: SilhouetteHint[] = [];

  if (attemptCount >= 1) {
    hints.push({
      attempt: 1,
      type: "continent",
      label: "Continent",
      value: targetCountry.continent,
    });
  }
  if (attemptCount >= 2) {
    hints.push({
      attempt: 2,
      type: "initial",
      label: "Première lettre",
      value: targetCountry.name.charAt(0).toUpperCase() + "...",
    });
  }
  if (attemptCount >= 3) {
    hints.push({
      attempt: 3,
      type: "capital",
      label: "Capitale",
      value: targetCountry.capital,
    });
  }
  if (attemptCount >= 4) {
    hints.push({
      attempt: 4,
      type: "flag",
      label: "Drapeau",
      value: targetCountry.flagEmoji,
    });
  }

  return hints;
}
