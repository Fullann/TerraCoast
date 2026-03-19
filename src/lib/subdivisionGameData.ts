export interface SubdivisionGameEntry {
  topoId: number | string;
  iso3: string;
  name: string;
  lat?: number;
  lng?: number;
}

export type SubdivisionScope = "ch_cantons" | "fr_departements" | "us_states";

export const CH_CANTONS_TOPOJSON_URL =
  "https://unpkg.com/swiss-maps@4/2026/ch-combined.json";
export const FR_DEPARTEMENTS_GEOJSON_URL =
  "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-version-simplifiee.geojson";

const SWISS_CANTONS: SubdivisionGameEntry[] = [
  { topoId: 1, iso3: "CH-ZH", name: "Zürich", lat: 47.38, lng: 8.54 },
  { topoId: 2, iso3: "CH-BE", name: "Bern", lat: 46.95, lng: 7.45 },
  { topoId: 3, iso3: "CH-LU", name: "Luzern", lat: 47.05, lng: 8.31 },
  { topoId: 4, iso3: "CH-UR", name: "Uri", lat: 46.88, lng: 8.63 },
  { topoId: 5, iso3: "CH-SZ", name: "Schwyz", lat: 47.02, lng: 8.65 },
  { topoId: 6, iso3: "CH-OW", name: "Obwalden", lat: 46.88, lng: 8.25 },
  { topoId: 7, iso3: "CH-NW", name: "Nidwalden", lat: 46.93, lng: 8.40 },
  { topoId: 8, iso3: "CH-GL", name: "Glarus", lat: 47.04, lng: 9.07 },
  { topoId: 9, iso3: "CH-ZG", name: "Zug", lat: 47.17, lng: 8.52 },
  { topoId: 10, iso3: "CH-FR", name: "Fribourg", lat: 46.8, lng: 7.15 },
  { topoId: 11, iso3: "CH-SO", name: "Solothurn", lat: 47.21, lng: 7.54 },
  { topoId: 12, iso3: "CH-BS", name: "Basel-Stadt", lat: 47.56, lng: 7.59 },
  { topoId: 13, iso3: "CH-BL", name: "Basel-Landschaft", lat: 47.47, lng: 7.74 },
  { topoId: 14, iso3: "CH-SH", name: "Schaffhausen", lat: 47.7, lng: 8.63 },
  { topoId: 15, iso3: "CH-AR", name: "Appenzell Ausserrhoden", lat: 47.39, lng: 9.28 },
  { topoId: 16, iso3: "CH-AI", name: "Appenzell Innerrhoden", lat: 47.33, lng: 9.41 },
  { topoId: 17, iso3: "CH-SG", name: "St. Gallen", lat: 47.42, lng: 9.37 },
  { topoId: 18, iso3: "CH-GR", name: "Graubünden", lat: 46.66, lng: 9.58 },
  { topoId: 19, iso3: "CH-AG", name: "Aargau", lat: 47.39, lng: 8.05 },
  { topoId: 20, iso3: "CH-TG", name: "Thurgau", lat: 47.56, lng: 9.11 },
  { topoId: 21, iso3: "CH-TI", name: "Ticino", lat: 46.32, lng: 8.8 },
  { topoId: 22, iso3: "CH-VD", name: "Vaud", lat: 46.56, lng: 6.54 },
  { topoId: 23, iso3: "CH-VS", name: "Valais", lat: 46.23, lng: 7.36 },
  { topoId: 24, iso3: "CH-NE", name: "Neuchâtel", lat: 46.99, lng: 6.93 },
  { topoId: 25, iso3: "CH-GE", name: "Genève", lat: 46.2, lng: 6.15 },
  { topoId: 26, iso3: "CH-JU", name: "Jura", lat: 47.36, lng: 7.35 },
];

const FR_DEPARTEMENTS: SubdivisionGameEntry[] = [
  { topoId: "01", iso3: "FR-01", name: "Ain" },
  { topoId: "02", iso3: "FR-02", name: "Aisne" },
  { topoId: "03", iso3: "FR-03", name: "Allier" },
  { topoId: "04", iso3: "FR-04", name: "Alpes-de-Haute-Provence" },
  { topoId: "05", iso3: "FR-05", name: "Hautes-Alpes" },
  { topoId: "06", iso3: "FR-06", name: "Alpes-Maritimes" },
  { topoId: "07", iso3: "FR-07", name: "Ardeche" },
  { topoId: "08", iso3: "FR-08", name: "Ardennes" },
  { topoId: "09", iso3: "FR-09", name: "Ariege" },
  { topoId: "10", iso3: "FR-10", name: "Aube" },
  { topoId: "11", iso3: "FR-11", name: "Aude" },
  { topoId: "12", iso3: "FR-12", name: "Aveyron" },
  { topoId: "13", iso3: "FR-13", name: "Bouches-du-Rhone" },
  { topoId: "14", iso3: "FR-14", name: "Calvados" },
  { topoId: "15", iso3: "FR-15", name: "Cantal" },
  { topoId: "16", iso3: "FR-16", name: "Charente" },
  { topoId: "17", iso3: "FR-17", name: "Charente-Maritime" },
  { topoId: "18", iso3: "FR-18", name: "Cher" },
  { topoId: "19", iso3: "FR-19", name: "Correze" },
  { topoId: "21", iso3: "FR-21", name: "Cote-d'Or" },
  { topoId: "22", iso3: "FR-22", name: "Cotes-d'Armor" },
  { topoId: "23", iso3: "FR-23", name: "Creuse" },
  { topoId: "24", iso3: "FR-24", name: "Dordogne" },
  { topoId: "25", iso3: "FR-25", name: "Doubs" },
  { topoId: "26", iso3: "FR-26", name: "Drome" },
  { topoId: "27", iso3: "FR-27", name: "Eure" },
  { topoId: "28", iso3: "FR-28", name: "Eure-et-Loir" },
  { topoId: "29", iso3: "FR-29", name: "Finistere" },
  { topoId: "2A", iso3: "FR-2A", name: "Corse-du-Sud" },
  { topoId: "2B", iso3: "FR-2B", name: "Haute-Corse" },
  { topoId: "30", iso3: "FR-30", name: "Gard" },
  { topoId: "31", iso3: "FR-31", name: "Haute-Garonne" },
  { topoId: "32", iso3: "FR-32", name: "Gers" },
  { topoId: "33", iso3: "FR-33", name: "Gironde" },
  { topoId: "34", iso3: "FR-34", name: "Herault" },
  { topoId: "35", iso3: "FR-35", name: "Ille-et-Vilaine" },
  { topoId: "36", iso3: "FR-36", name: "Indre" },
  { topoId: "37", iso3: "FR-37", name: "Indre-et-Loire" },
  { topoId: "38", iso3: "FR-38", name: "Isere" },
  { topoId: "39", iso3: "FR-39", name: "Jura" },
  { topoId: "40", iso3: "FR-40", name: "Landes" },
  { topoId: "41", iso3: "FR-41", name: "Loir-et-Cher" },
  { topoId: "42", iso3: "FR-42", name: "Loire" },
  { topoId: "43", iso3: "FR-43", name: "Haute-Loire" },
  { topoId: "44", iso3: "FR-44", name: "Loire-Atlantique" },
  { topoId: "45", iso3: "FR-45", name: "Loiret" },
  { topoId: "46", iso3: "FR-46", name: "Lot" },
  { topoId: "47", iso3: "FR-47", name: "Lot-et-Garonne" },
  { topoId: "48", iso3: "FR-48", name: "Lozere" },
  { topoId: "49", iso3: "FR-49", name: "Maine-et-Loire" },
  { topoId: "50", iso3: "FR-50", name: "Manche" },
  { topoId: "51", iso3: "FR-51", name: "Marne" },
  { topoId: "52", iso3: "FR-52", name: "Haute-Marne" },
  { topoId: "53", iso3: "FR-53", name: "Mayenne" },
  { topoId: "54", iso3: "FR-54", name: "Meurthe-et-Moselle" },
  { topoId: "55", iso3: "FR-55", name: "Meuse" },
  { topoId: "56", iso3: "FR-56", name: "Morbihan" },
  { topoId: "57", iso3: "FR-57", name: "Moselle" },
  { topoId: "58", iso3: "FR-58", name: "Nievre" },
  { topoId: "59", iso3: "FR-59", name: "Nord" },
  { topoId: "60", iso3: "FR-60", name: "Oise" },
  { topoId: "61", iso3: "FR-61", name: "Orne" },
  { topoId: "62", iso3: "FR-62", name: "Pas-de-Calais" },
  { topoId: "63", iso3: "FR-63", name: "Puy-de-Dome" },
  { topoId: "64", iso3: "FR-64", name: "Pyrenees-Atlantiques" },
  { topoId: "65", iso3: "FR-65", name: "Hautes-Pyrenees" },
  { topoId: "66", iso3: "FR-66", name: "Pyrenees-Orientales" },
  { topoId: "67", iso3: "FR-67", name: "Bas-Rhin" },
  { topoId: "68", iso3: "FR-68", name: "Haut-Rhin" },
  { topoId: "69", iso3: "FR-69", name: "Rhone" },
  { topoId: "70", iso3: "FR-70", name: "Haute-Saone" },
  { topoId: "71", iso3: "FR-71", name: "Saone-et-Loire" },
  { topoId: "72", iso3: "FR-72", name: "Sarthe" },
  { topoId: "73", iso3: "FR-73", name: "Savoie" },
  { topoId: "74", iso3: "FR-74", name: "Haute-Savoie" },
  { topoId: "75", iso3: "FR-75", name: "Paris" },
  { topoId: "76", iso3: "FR-76", name: "Seine-Maritime" },
  { topoId: "77", iso3: "FR-77", name: "Seine-et-Marne" },
  { topoId: "78", iso3: "FR-78", name: "Yvelines" },
  { topoId: "79", iso3: "FR-79", name: "Deux-Sevres" },
  { topoId: "80", iso3: "FR-80", name: "Somme" },
  { topoId: "81", iso3: "FR-81", name: "Tarn" },
  { topoId: "82", iso3: "FR-82", name: "Tarn-et-Garonne" },
  { topoId: "83", iso3: "FR-83", name: "Var" },
  { topoId: "84", iso3: "FR-84", name: "Vaucluse" },
  { topoId: "85", iso3: "FR-85", name: "Vendee" },
  { topoId: "86", iso3: "FR-86", name: "Vienne" },
  { topoId: "87", iso3: "FR-87", name: "Haute-Vienne" },
  { topoId: "88", iso3: "FR-88", name: "Vosges" },
  { topoId: "89", iso3: "FR-89", name: "Yonne" },
  { topoId: "90", iso3: "FR-90", name: "Territoire de Belfort" },
  { topoId: "91", iso3: "FR-91", name: "Essonne" },
  { topoId: "92", iso3: "FR-92", name: "Hauts-de-Seine" },
  { topoId: "93", iso3: "FR-93", name: "Seine-Saint-Denis" },
  { topoId: "94", iso3: "FR-94", name: "Val-de-Marne" },
  { topoId: "95", iso3: "FR-95", name: "Val-d'Oise" },
];

const US_STATES: SubdivisionGameEntry[] = [
  { topoId: "01", iso3: "US-AL", name: "Alabama" },
  { topoId: "02", iso3: "US-AK", name: "Alaska" },
  { topoId: "04", iso3: "US-AZ", name: "Arizona" },
  { topoId: "05", iso3: "US-AR", name: "Arkansas" },
  { topoId: "06", iso3: "US-CA", name: "California" },
  { topoId: "08", iso3: "US-CO", name: "Colorado" },
  { topoId: "09", iso3: "US-CT", name: "Connecticut" },
  { topoId: "10", iso3: "US-DE", name: "Delaware" },
  { topoId: "11", iso3: "US-DC", name: "District of Columbia" },
  { topoId: "12", iso3: "US-FL", name: "Florida" },
  { topoId: "13", iso3: "US-GA", name: "Georgia" },
  { topoId: "15", iso3: "US-HI", name: "Hawaii" },
  { topoId: "16", iso3: "US-ID", name: "Idaho" },
  { topoId: "17", iso3: "US-IL", name: "Illinois" },
  { topoId: "18", iso3: "US-IN", name: "Indiana" },
  { topoId: "19", iso3: "US-IA", name: "Iowa" },
  { topoId: "20", iso3: "US-KS", name: "Kansas" },
  { topoId: "21", iso3: "US-KY", name: "Kentucky" },
  { topoId: "22", iso3: "US-LA", name: "Louisiana" },
  { topoId: "23", iso3: "US-ME", name: "Maine" },
  { topoId: "24", iso3: "US-MD", name: "Maryland" },
  { topoId: "25", iso3: "US-MA", name: "Massachusetts" },
  { topoId: "26", iso3: "US-MI", name: "Michigan" },
  { topoId: "27", iso3: "US-MN", name: "Minnesota" },
  { topoId: "28", iso3: "US-MS", name: "Mississippi" },
  { topoId: "29", iso3: "US-MO", name: "Missouri" },
  { topoId: "30", iso3: "US-MT", name: "Montana" },
  { topoId: "31", iso3: "US-NE", name: "Nebraska" },
  { topoId: "32", iso3: "US-NV", name: "Nevada" },
  { topoId: "33", iso3: "US-NH", name: "New Hampshire" },
  { topoId: "34", iso3: "US-NJ", name: "New Jersey" },
  { topoId: "35", iso3: "US-NM", name: "New Mexico" },
  { topoId: "36", iso3: "US-NY", name: "New York" },
  { topoId: "37", iso3: "US-NC", name: "North Carolina" },
  { topoId: "38", iso3: "US-ND", name: "North Dakota" },
  { topoId: "39", iso3: "US-OH", name: "Ohio" },
  { topoId: "40", iso3: "US-OK", name: "Oklahoma" },
  { topoId: "41", iso3: "US-OR", name: "Oregon" },
  { topoId: "42", iso3: "US-PA", name: "Pennsylvania" },
  { topoId: "44", iso3: "US-RI", name: "Rhode Island" },
  { topoId: "45", iso3: "US-SC", name: "South Carolina" },
  { topoId: "46", iso3: "US-SD", name: "South Dakota" },
  { topoId: "47", iso3: "US-TN", name: "Tennessee" },
  { topoId: "48", iso3: "US-TX", name: "Texas" },
  { topoId: "49", iso3: "US-UT", name: "Utah" },
  { topoId: "50", iso3: "US-VT", name: "Vermont" },
  { topoId: "51", iso3: "US-VA", name: "Virginia" },
  { topoId: "53", iso3: "US-WA", name: "Washington" },
  { topoId: "54", iso3: "US-WV", name: "West Virginia" },
  { topoId: "55", iso3: "US-WI", name: "Wisconsin" },
  { topoId: "56", iso3: "US-WY", name: "Wyoming" },
];

function getDataset(scope: SubdivisionScope): SubdivisionGameEntry[] {
  if (scope === "ch_cantons") return SWISS_CANTONS;
  if (scope === "fr_departements") return FR_DEPARTEMENTS;
  return US_STATES;
}

export function getSubdivisions(scope: SubdivisionScope): SubdivisionGameEntry[] {
  return [...getDataset(scope)];
}

export function getSubdivisionsByIds(
  scope: SubdivisionScope,
  ids: string[]
): SubdivisionGameEntry[] {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const idSet = new Set(ids);
  return getDataset(scope).filter((entry) => idSet.has(entry.iso3));
}

export function getSubdivisionIso3ByTopoId(
  scope: SubdivisionScope,
  topoId: number | string
): string {
  const raw = String(topoId || "").trim();
  if (!raw) return "";

  const normalizedTopoId =
    scope === "ch_cantons"
      ? String(Number(raw))
      : scope === "us_states"
      ? String(raw).padStart(2, "0")
      : raw.toUpperCase();

  const entry = getDataset(scope).find(
    (item) => String(item.topoId).toUpperCase() === normalizedTopoId.toUpperCase()
  );
  return entry?.iso3 || "";
}
