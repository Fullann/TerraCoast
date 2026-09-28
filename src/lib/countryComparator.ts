import { type AtlasCountry } from "./atlasData";

export interface ComparativeMetric<T = number> {
  name: string;
  unit?: string;
  valueA: T;
  valueB: T;
  formattedA: string;
  formattedB: string;
  winner: "A" | "B" | "tie";
  ratioDescription?: string;
}

export interface TrueSizeComparison {
  areaRatio: number; // areaB / areaA
  linearScaleRatio: number; // sqrt(areaB / areaA)
  mercatorExaggerationA: number; // sec^2(latA)
  mercatorExaggerationB: number; // sec^2(latB)
  mercatorDistortionRatio: number; // relative apparent exaggeration on Mercator
  insightText: string;
}

export interface CountryComparisonResult {
  countryA: AtlasCountry;
  countryB: AtlasCountry;
  population: ComparativeMetric<number>;
  area: ComparativeMetric<number>;
  density: ComparativeMetric<number>;
  highestPeak: ComparativeMetric<string>;
  currencies: {
    shared: boolean;
    listA: string[];
    listB: string[];
  };
  languages: {
    shared: string[];
    listA: string[];
    listB: string[];
  };
  bordersCount: ComparativeMetric<number>;
  trueSize: TrueSizeComparison;
}

// Points culminants notables (Pays -> [Nom du sommet, altitude en m])
const KNOWN_HIGHEST_PEAKS: Record<string, [string, number]> = {
  CHE: ["Pointe Dufour (Mont Rose)", 4634],
  FRA: ["Mont Blanc", 4809],
  ITA: ["Mont Blanc / Monte Bianco", 4809],
  DEU: ["Zugspitze", 2962],
  ESP: ["Pic de Teide (Tenerife)", 3715],
  PRT: ["Montanha do Pico (Açores)", 2351],
  GBR: ["Ben Nevis", 1345],
  USA: ["Denali (Mont McKinley)", 6190],
  CAN: ["Mont Logan", 5959],
  MEX: ["Pic d'Orizaba", 5636],
  BRA: ["Pico da Neblina", 2995],
  ARG: ["Aconcagua", 6961],
  CHL: ["Nevado Ojos del Salado", 6893],
  PER: ["Huascarán", 6768],
  JPN: ["Mont Fuji", 3776],
  CHN: ["Mont Everest (Chomolungma)", 8848],
  NPL: ["Mont Everest (Sagarmatha)", 8848],
  IND: ["Kangchenjunga", 8586],
  PAK: ["K2", 8611],
  RUS: ["Mont Elbrouz", 5642],
  MAR: ["Djebel Toubkal", 4167],
  EGY: ["Mont Sainte-Catherine", 2629],
  TZA: ["Kilimandjaro", 5895],
  KEN: ["Mont Kenya", 5199],
  ZAF: ["Mafadi", 3450],
  AUS: ["Mont Kosciuszko", 2228],
  NZL: ["Aoraki / Mont Cook", 3724],
  GRC: ["Mont Olympe", 2917],
  AUT: ["Großglockner", 3798],
  NOR: ["Galdhøpiggen", 2469],
  SWE: ["Kebnekaise", 2097],
};

function formatNum(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

/**
 * Calcule l'exagération de surface due à la projection Mercator à une latitude donnée :
 * M(lat) = 1 / cos^2(lat)
 */
export function getMercatorAreaMultiplier(latitude: number): number {
  const clampedLat = Math.min(Math.abs(latitude), 85);
  const rad = (clampedLat * Math.PI) / 180;
  const cos = Math.cos(rad);
  return cos > 0.001 ? 1 / (cos * cos) : 100;
}

/**
 * Compare deux pays en profondeur (True Size + statistiques de confrontation)
 */
export function compareCountries(
  countryA: AtlasCountry,
  countryB: AtlasCountry
): CountryComparisonResult {
  const densityA = countryA.areaKm2 > 0 ? countryA.population / countryA.areaKm2 : 0;
  const densityB = countryB.areaKm2 > 0 ? countryB.population / countryB.areaKm2 : 0;

  // 1. Population
  const popRatio =
    countryA.population > 0 && countryB.population > 0
      ? countryA.population >= countryB.population
        ? (countryA.population / countryB.population).toFixed(1)
        : (countryB.population / countryA.population).toFixed(1)
      : "N/A";
  const population: ComparativeMetric<number> = {
    name: "Population",
    unit: "habitants",
    valueA: countryA.population,
    valueB: countryB.population,
    formattedA: `${formatNum(countryA.population)} hab.`,
    formattedB: `${formatNum(countryB.population)} hab.`,
    winner:
      countryA.population === countryB.population
        ? "tie"
        : countryA.population > countryB.population
        ? "A"
        : "B",
    ratioDescription: `${popRatio}× plus peuplé`,
  };

  // 2. Superficie
  const areaRatio =
    countryA.areaKm2 > 0 && countryB.areaKm2 > 0
      ? countryA.areaKm2 >= countryB.areaKm2
        ? (countryA.areaKm2 / countryB.areaKm2).toFixed(1)
        : (countryB.areaKm2 / countryA.areaKm2).toFixed(1)
      : "1.0";
  const area: ComparativeMetric<number> = {
    name: "Superficie",
    unit: "km²",
    valueA: countryA.areaKm2,
    valueB: countryB.areaKm2,
    formattedA: `${formatNum(countryA.areaKm2)} km²`,
    formattedB: `${formatNum(countryB.areaKm2)} km²`,
    winner:
      countryA.areaKm2 === countryB.areaKm2 ? "tie" : countryA.areaKm2 > countryB.areaKm2 ? "A" : "B",
    ratioDescription: `${areaRatio}× plus grand`,
  };

  // 3. Densité
  const densRatio =
    densityA > 0 && densityB > 0
      ? densityA >= densityB
        ? (densityA / densityB).toFixed(1)
        : (densityB / densityA).toFixed(1)
      : "N/A";
  const density: ComparativeMetric<number> = {
    name: "Densité de population",
    unit: "hab/km²",
    valueA: Math.round(densityA),
    valueB: Math.round(densityB),
    formattedA: `${Math.round(densityA)} hab/km²`,
    formattedB: `${Math.round(densityB)} hab/km²`,
    winner: densityA === densityB ? "tie" : densityA > densityB ? "A" : "B",
    ratioDescription: `${densRatio}× plus dense`,
  };

  // 4. Sommets
  const peakA = KNOWN_HIGHEST_PEAKS[countryA.iso3.toUpperCase()] || ["Altitude estimée", 2500];
  const peakB = KNOWN_HIGHEST_PEAKS[countryB.iso3.toUpperCase()] || ["Altitude estimée", 2500];
  const highestPeak: ComparativeMetric<string> = {
    name: "Point culminant",
    valueA: `${peakA[0]} (${peakA[1]}m)`,
    valueB: `${peakB[0]} (${peakB[1]}m)`,
    formattedA: `${peakA[0]} • ${peakA[1]} m`,
    formattedB: `${peakB[0]} • ${peakB[1]} m`,
    winner: peakA[1] === peakB[1] ? "tie" : peakA[1] > peakB[1] ? "A" : "B",
  };

  // 5. Monnaies
  const currsA = countryA.currencies.map((c) => `${c.name} (${c.symbol})`);
  const currsB = countryB.currencies.map((c) => `${c.name} (${c.symbol})`);
  const codesA = new Set(countryA.currencies.map((c) => c.code));
  const hasSharedCurrency = countryB.currencies.some((c) => codesA.has(c.code));

  // 6. Langues
  const langsA = countryA.languages || [];
  const langsB = countryB.languages || [];
  const sharedLangs = langsA.filter((l) => langsB.includes(l));

  // 7. Frontières
  const bordersCount: ComparativeMetric<number> = {
    name: "Pays frontaliers terrestres",
    valueA: countryA.borders.length,
    valueB: countryB.borders.length,
    formattedA: `${countryA.borders.length} voisin(s)`,
    formattedB: `${countryB.borders.length} voisin(s)`,
    winner:
      countryA.borders.length === countryB.borders.length
        ? "tie"
        : countryA.borders.length > countryB.borders.length
        ? "A"
        : "B",
  };

  // 8. True Size & Distorsion de Mercator
  const rawAreaRatio = countryA.areaKm2 > 0 ? countryB.areaKm2 / countryA.areaKm2 : 1;
  const linearScale = Math.sqrt(Math.max(0.001, rawAreaRatio));
  const mercatorA = getMercatorAreaMultiplier(countryA.lat);
  const mercatorB = getMercatorAreaMultiplier(countryB.lat);
  const mercatorDistortionRatio = mercatorA > 0 ? mercatorB / mercatorA : 1;

  let insightText = "";
  if (countryA.areaKm2 > countryB.areaKm2) {
    const times = (countryA.areaKm2 / countryB.areaKm2).toFixed(1);
    insightText = `${countryA.name} (${formatNum(countryA.areaKm2)} km²) est en réalité ${times} fois plus vaste que ${countryB.name} (${formatNum(countryB.areaKm2)} km²).`;
  } else if (countryB.areaKm2 > countryA.areaKm2) {
    const times = (countryB.areaKm2 / countryA.areaKm2).toFixed(1);
    insightText = `${countryB.name} (${formatNum(countryB.areaKm2)} km²) est en réalité ${times} fois plus vaste que ${countryA.name} (${formatNum(countryA.areaKm2)} km²).`;
  } else {
    insightText = `${countryA.name} et ${countryB.name} ont une superficie terrestre quasi équivalente.`;
  }

  // Ajouter l'anecdote Mercator si forte latitude
  if (Math.abs(countryA.lat) > 55 || Math.abs(countryB.lat) > 55) {
    insightText += ` Note : La projection de Mercator classique étire considérablement les régions polaires. Ici, les silhouettes sont corrigées pour refléter leur échelle physique réelle sur Terre.`;
  }

  return {
    countryA,
    countryB,
    population,
    area,
    density,
    highestPeak,
    currencies: {
      shared: hasSharedCurrency,
      listA: currsA,
      listB: currsB,
    },
    languages: {
      shared: sharedLangs,
      listA: langsA,
      listB: langsB,
    },
    bordersCount,
    trueSize: {
      areaRatio: rawAreaRatio,
      linearScaleRatio: linearScale,
      mercatorExaggerationA: mercatorA,
      mercatorExaggerationB: mercatorB,
      mercatorDistortionRatio,
      insightText,
    },
  };
}
