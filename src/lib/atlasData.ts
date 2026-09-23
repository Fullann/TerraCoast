import countries from "world-countries";
import type { Language } from "../i18n/translations";
import { estimatedPopulationsByIso3 } from "./countryGameData";

export interface AtlasCountry {
  iso3: string;
  iso2: string;
  numericCode: string;
  name: string;
  officialName: string;
  capital: string;
  flagEmoji: string;
  continent: string;
  subregion: string;
  population: number;
  areaKm2: number;
  lat: number;
  lng: number;
  currencies: Array<{ code: string; name: string; symbol: string }>;
  languages: string[];
  borders: string[]; // ISO3 of neighboring countries
}

type WorldCountryRaw = {
  cca3?: string;
  cca2?: string;
  ccn3?: string;
  name?: { common?: string; official?: string };
  capital?: string[];
  flag?: string;
  region?: string;
  subregion?: string;
  continents?: string[];
  population?: number;
  area?: number;
  latlng?: number[];
  currencies?: Record<string, { name?: string; symbol?: string }>;
  languages?: Record<string, string>;
  borders?: string[];
  translations?: Record<string, { common?: string; official?: string }>;
};

const rawCountries = countries as unknown as WorldCountryRaw[];

const languageToTranslationKey: Record<Language, string> = {
  fr: "fra",
  en: "eng",
  es: "spa",
  de: "deu",
  it: "ita",
  pt: "por",
};

const continentTranslations: Record<string, Record<Language, string>> = {
  Africa: {
    fr: "Afrique",
    en: "Africa",
    es: "África",
    de: "Afrika",
    it: "Africa",
    pt: "África",
  },
  Americas: {
    fr: "Amériques",
    en: "Americas",
    es: "Américas",
    de: "Amerika",
    it: "Americhe",
    pt: "Américas",
  },
  Asia: {
    fr: "Asie",
    en: "Asia",
    es: "Asia",
    de: "Asien",
    it: "Asia",
    pt: "Ásia",
  },
  Europe: {
    fr: "Europe",
    en: "Europe",
    es: "Europa",
    de: "Europa",
    it: "Europa",
    pt: "Europa",
  },
  Oceania: {
    fr: "Océanie",
    en: "Oceania",
    es: "Oceanía",
    de: "Ozeanien",
    it: "Oceania",
    pt: "Oceania",
  },
  Antarctic: {
    fr: "Antarctique",
    en: "Antarctica",
    es: "Antártida",
    de: "Antarktis",
    it: "Antartide",
    pt: "Antártida",
  },
};

export function getLocalizedContinent(region: string, lang: Language): string {
  const entry = continentTranslations[region];
  if (entry && entry[lang]) return entry[lang];
  return region || "Monde";
}

/**
 * Convertit un pays brut de world-countries en modèle AtlasCountry enrichi
 */
function normalizeAtlasCountry(raw: WorldCountryRaw, lang: Language): AtlasCountry {
  const iso3 = String(raw.cca3 || "").toUpperCase();
  const trKey = languageToTranslationKey[lang] || "fra";
  const localized = raw.translations?.[trKey];

  const commonName = localized?.common || raw.name?.common || iso3;
  const officialName = localized?.official || raw.name?.official || commonName;

  const currenciesList: Array<{ code: string; name: string; symbol: string }> = [];
  if (raw.currencies) {
    for (const [code, val] of Object.entries(raw.currencies)) {
      currenciesList.push({
        code,
        name: val?.name || code,
        symbol: val?.symbol || code,
      });
    }
  }

  const languagesList: string[] = raw.languages
    ? Object.values(raw.languages).filter(Boolean)
    : [];

  const continent =
    (Array.isArray(raw.continents) && raw.continents[0]) ||
    raw.region ||
    "Europe";

  return {
    iso3,
    iso2: String(raw.cca2 || "").toUpperCase(),
    numericCode: String(raw.ccn3 || ""),
    name: commonName,
    officialName,
    capital: Array.isArray(raw.capital) && raw.capital.length > 0 ? raw.capital[0] : "—",
    flagEmoji: raw.flag || "🏳️",
    continent,
    subregion: raw.subregion || continent,
    population: estimatedPopulationsByIso3[iso3] || Number(raw.population || 0),
    areaKm2: Number(raw.area || 0),
    lat: Array.isArray(raw.latlng) ? Number(raw.latlng[0] || 0) : 0,
    lng: Array.isArray(raw.latlng) ? Number(raw.latlng[1] || 0) : 0,
    currencies: currenciesList,
    languages: languagesList,
    borders: Array.isArray(raw.borders) ? raw.borders.map((b) => b.toUpperCase()) : [],
  };
}

let atlasCache: { lang: Language; list: AtlasCountry[] } | null = null;

export function getAllAtlasCountries(lang: Language = "fr"): AtlasCountry[] {
  if (atlasCache && atlasCache.lang === lang) {
    return atlasCache.list;
  }

  const list = rawCountries
    .filter((c) => c.cca3 && c.name?.common)
    .map((c) => normalizeAtlasCountry(c, lang))
    .sort((a, b) => a.name.localeCompare(b.name, lang));

  atlasCache = { lang, list };
  return list;
}

export function getAtlasCountryByIso3(iso3: string, lang: Language = "fr"): AtlasCountry | null {
  const all = getAllAtlasCountries(lang);
  const target = String(iso3 || "").toUpperCase();
  return all.find((c) => c.iso3 === target || c.iso2 === target) || null;
}
