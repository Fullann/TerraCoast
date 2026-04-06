import countries from "world-countries";
import type { Language } from "../i18n/translations";

export type CountryMetric = "population" | "area_km2";

export interface CountryGameEntry {
  iso3: string;
  numericCode: number | null;
  name: string;
  capital: string;
  flagEmoji: string;
  continent: string;
  lat: number;
  lng: number;
  population: number;
  area_km2: number;
}

type WorldCountry = {
  cca3?: string;
  ccn3?: string;
  name?: { common?: string; official?: string };
  capital?: string[];
  altSpellings?: string[];
  translations?: Record<string, { common?: string; official?: string }>;
  flag?: string;
  continents?: string[];
  latlng?: number[];
  population?: number;
  area?: number;
};

const languageToWorldTranslationsKey: Record<Language, string> = {
  fr: "fra",
  en: "eng",
  es: "spa",
  de: "deu",
  it: "ita",
  pt: "por",
};

const rawCountries = countries as unknown as WorldCountry[];
const rawByIso3 = new Map<string, WorldCountry>(
  rawCountries
    .map((c) => [String(c.cca3 || "").toUpperCase(), c] as const)
    .filter(([iso]) => Boolean(iso))
);

const normalizedCountries: CountryGameEntry[] = (countries as any[])
  .map((country) => ({
    iso3: String(country.cca3 || "").toUpperCase(),
    numericCode: Number.isFinite(Number(country.ccn3))
      ? Number(country.ccn3)
      : null,
    name: String(country.name?.common || "").trim(),
    capital: Array.isArray(country.capital)
      ? String(country.capital[0] || "").trim()
      : "",
    flagEmoji: String(country.flag || "").trim(),
    continent: String(
      Array.isArray(country.continents) && country.continents.length > 0
        ? country.continents[0]
        : "Other"
    ),
    lat: Array.isArray(country.latlng) ? Number(country.latlng[0] || 0) : 0,
    lng: Array.isArray(country.latlng) ? Number(country.latlng[1] || 0) : 0,
    population: Number(country.population || 0),
    area_km2: Number(country.area || 0),
  }))
  .filter((country) => country.iso3 && country.name);

const frenchCapitalAliasesByIso3: Record<string, string[]> = {
  CHE: ["Berne"],
  AUT: ["Vienne"],
  POL: ["Varsovie"],
  RUS: ["Moscou"],
  GBR: ["Londres"],
  USA: ["Washington", "Washington DC", "Washington D.C."],
  NLD: ["Amsterdam"],
  SWE: ["Stockholm"],
  NOR: ["Oslo"],
  DNK: ["Copenhague"],
  FIN: ["Helsinki"],
  PRT: ["Lisbonne"],
  HUN: ["Budapest"],
  GRC: ["Athènes"],
  ROU: ["Bucarest"],
  CZE: ["Prague"],
  UKR: ["Kyiv", "Kiev"],
};

function pushIfString(list: string[], value: unknown) {
  if (typeof value !== "string") return;
  const v = value.trim();
  if (!v) return;
  list.push(v);
}

export function getCountryNameVariantsByIso3(
  iso3: string,
  language: Language
): string[] {
  const key = String(iso3 || "").toUpperCase();
  const raw = rawByIso3.get(key);
  const out: string[] = [];
  if (raw) {
    pushIfString(out, raw.name?.common);
    pushIfString(out, raw.name?.official);
    const trKey = languageToWorldTranslationsKey[language] || "eng";
    pushIfString(out, raw.translations?.[trKey]?.common);
    pushIfString(out, raw.translations?.[trKey]?.official);
    (raw.altSpellings || []).forEach((s) => pushIfString(out, s));
  }
  // Fallback: on retombe sur la liste normalisée (anglais).
  const normalized = normalizedCountries.find((c) => c.iso3 === key);
  if (normalized) pushIfString(out, normalized.name);

  // dédoublonnage
  return [...new Set(out)];
}

export function getCountryCapitalVariantsByIso3(
  iso3: string,
  language: Language
): string[] {
  const key = String(iso3 || "").toUpperCase();
  const raw = rawByIso3.get(key);
  const out: string[] = [];
  if (raw?.capital?.length) {
    raw.capital.forEach((c) => pushIfString(out, c));
  }
  const normalized = normalizedCountries.find((c) => c.iso3 === key);
  if (normalized) pushIfString(out, normalized.capital);

  if (language === "fr") {
    (frenchCapitalAliasesByIso3[key] || []).forEach((c) => pushIfString(out, c));
  }

  return [...new Set(out)];
}

const continentAliases: Record<string, string> = {
  world: "world",
  all: "world",
  africa: "Africa",
  europe: "Europe",
  asia: "Asia",
  oceania: "Oceania",
  "north america": "North America",
  "south america": "South America",
  americas: "Americas",
};

function normalizeContinent(continent?: string): string {
  if (!continent) return "world";
  const key = continent.trim().toLowerCase();
  return continentAliases[key] || continent.trim();
}

export function getCountries(continent?: string): CountryGameEntry[] {
  const normalized = normalizeContinent(continent);
  if (normalized === "world") return normalizedCountries;

  if (normalized === "Americas") {
    return normalizedCountries.filter(
      (country) =>
        country.continent === "North America" ||
        country.continent === "South America"
    );
  }

  return normalizedCountries.filter((country) => country.continent === normalized);
}

export function getAllCountries(): CountryGameEntry[] {
  return normalizedCountries;
}

export function getCountriesByIso3(iso3List: string[]): CountryGameEntry[] {
  if (!Array.isArray(iso3List) || iso3List.length === 0) return [];
  const isoSet = new Set(iso3List.map((iso) => String(iso || "").toUpperCase()));
  return normalizedCountries.filter((country) => isoSet.has(country.iso3));
}

export function getIso3ByNumericCode(code: number | string | null | undefined): string {
  const normalized = Number(code);
  if (!Number.isFinite(normalized)) return "";
  const match = normalizedCountries.find(
    (country) => country.numericCode === normalized
  );
  return match?.iso3 || "";
}

function seededRandom(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function hashStringToSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) + 1;
}

export function shuffleSeeded<T>(items: T[], seedKey: string): T[] {
  const random = seededRandom(hashStringToSeed(seedKey));
  const clone = [...items];

  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }

  return clone;
}

export function pickCountries(
  count: number,
  seedKey: string,
  continent?: string
): CountryGameEntry[] {
  const pool = getCountries(continent);
  if (pool.length === 0) return [];
  return shuffleSeeded(pool, seedKey).slice(0, Math.max(1, Math.min(count, pool.length)));
}

export function getTop10CountriesByMetric(
  metric: CountryMetric,
  continent?: string
): CountryGameEntry[] {
  const pool = getCountries(continent);
  const sorted = [...pool].sort((a, b) => (b[metric] || 0) - (a[metric] || 0));
  return sorted.slice(0, 10);
}
