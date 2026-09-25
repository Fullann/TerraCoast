import { getAllAtlasCountries, type AtlasCountry } from "./atlasData";
import type { Language } from "../i18n/translations";

export type HigherLowerMetric = "population" | "area_km2";

export interface HigherLowerRound {
  currentCountry: AtlasCountry;
  nextCountry: AtlasCountry;
  activeMetric: HigherLowerMetric;
}

const STORAGE_KEY_PREFIX = "terracoast_higher_lower_record_";

export function getHigherLowerRecord(metric: string): number {
  if (typeof window === "undefined") return 0;
  const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${metric}`);
  return stored ? Number(stored) || 0 : 0;
}

export function saveHigherLowerRecord(metric: string, score: number): boolean {
  if (typeof window === "undefined") return false;
  const current = getHigherLowerRecord(metric);
  if (score > current) {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${metric}`, String(score));
    return true; // Nouveau record !
  }
  return false;
}

/**
 * Filtre les pays pour garder ceux qui ont des données complètes et fiables
 */
export function getEligibleCountriesForHigherLower(lang: Language = "fr"): AtlasCountry[] {
  return getAllAtlasCountries(lang).filter(
    (c) => c.population > 100000 && c.areaKm2 > 100 && c.capital && c.capital !== "—"
  );
}

/**
 * Récupère la valeur numérique selon la métrique choisie
 */
export function getMetricValue(country: AtlasCountry, metric: HigherLowerMetric): number {
  if (metric === "population") {
    return country.population;
  }
  return country.areaKm2;
}

/**
 * Formate lisiblement une valeur selon la métrique et la langue
 */
export function formatMetricValue(
  value: number,
  metric: HigherLowerMetric,
  lang: Language = "fr"
): string {
  const locale = lang === "en" ? "en-US" : lang === "de" ? "de-DE" : "fr-FR";

  if (metric === "population") {
    return `${new Intl.NumberFormat(locale).format(value)} hab.`;
  }
  return `${new Intl.NumberFormat(locale).format(value)} km²`;
}

/**
 * Titre de la métrique pour la question
 */
export function getMetricQuestionTitle(
  metric: HigherLowerMetric,
  countryBName: string
): string {
  if (metric === "population") {
    return `${countryBName} a-t-il une population plus élevée ou moins élevée ?`;
  }
  return `${countryBName} a-t-il une superficie plus grande ou plus petite ?`;
}

/**
 * Sélectionne un nouveau pays challenger pour le tour suivant, différent du pays actuel
 */
export function pickNextChallenger(
  currentCountry: AtlasCountry,
  lang: Language = "fr",
  recentIso3s: string[] = []
): AtlasCountry {
  const all = getEligibleCountriesForHigherLower(lang);
  const excluded = new Set([currentCountry.iso3, ...recentIso3s]);
  const candidates = all.filter((c) => !excluded.has(c.iso3));

  const pool = candidates.length > 0 ? candidates : all.filter((c) => c.iso3 !== currentCountry.iso3);
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return picked || all[0];
}

/**
 * Initialise une nouvelle partie de Higher or Lower
 */
export function initHigherLowerGame(
  metric: HigherLowerMetric | "random" = "random",
  lang: Language = "fr"
): HigherLowerRound {
  const activeMetric: HigherLowerMetric =
    metric === "random"
      ? Math.random() > 0.5
        ? "population"
        : "area_km2"
      : metric;

  const all = getEligibleCountriesForHigherLower(lang);
  const first = all[Math.floor(Math.random() * all.length)];
  const second = pickNextChallenger(first, lang, [first.iso3]);

  return {
    currentCountry: first,
    nextCountry: second,
    activeMetric,
  };
}

/**
 * Vérifie le choix du joueur : "higher" (plus élevé) ou "lower" (moins élevé)
 */
export function evaluateHigherLowerChoice(
  currentCountry: AtlasCountry,
  nextCountry: AtlasCountry,
  metric: HigherLowerMetric,
  choice: "higher" | "lower"
): { isCorrect: boolean; valA: number; valB: number } {
  const valA = getMetricValue(currentCountry, metric);
  const valB = getMetricValue(nextCountry, metric);

  // Égalité = toujours accordé
  if (valA === valB) {
    return { isCorrect: true, valA, valB };
  }

  const isCorrect = choice === "higher" ? valB >= valA : valB <= valA;
  return { isCorrect, valA, valB };
}
