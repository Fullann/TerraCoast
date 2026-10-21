/**
 * 🧩 Border Puzzle (Tangram Frontalier)
 * Données et moteur de projection vectorielle TopoJSON
 * pour assembler des grappes de pays frontaliers.
 */

import { feature as topojsonFeature } from "topojson-client";
import { geoMercator, geoPath } from "d3-geo";
import worldMapData from "world-atlas/countries-110m.json";
import { getIso3ByNumericCode } from "./countryGameData";
import { getAllAtlasCountries } from "./atlasData";

export interface PuzzlePieceCountry {
  iso3: string;
  name: string;
  flagEmoji: string;
  capital: string;
  color: string;
  gradient: string;
  pathD: string;
  centroid: [number, number];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export interface BorderPuzzleClusterDef {
  id: string;
  name: string;
  subtitle: string;
  continent: string;
  difficulty: "easy" | "medium" | "hard";
  countryIso3s: string[];
  funFact: string;
  hint: string;
}

export interface PreparedBorderPuzzle {
  cluster: BorderPuzzleClusterDef;
  pieces: PuzzlePieceCountry[];
  viewBox: string;
  width: number;
  height: number;
  combinedOutlineD: string;
}

export const PUZZLE_COLORS = [
  { color: "#10B981", gradient: "from-emerald-500 to-teal-600", text: "text-emerald-700", border: "border-emerald-400" },
  { color: "#0EA5E9", gradient: "from-sky-500 to-blue-600", text: "text-sky-700", border: "border-sky-400" },
  { color: "#F59E0B", gradient: "from-amber-500 to-orange-600", text: "text-amber-700", border: "border-amber-400" },
  { color: "#8B5CF6", gradient: "from-purple-500 to-indigo-600", text: "text-purple-700", border: "border-purple-400" },
  { color: "#EC4899", gradient: "from-pink-500 to-rose-600", text: "text-pink-700", border: "border-pink-400" },
];

export const BORDER_PUZZLE_CLUSTERS: BorderPuzzleClusterDef[] = [
  {
    id: "iberian-peninsula",
    name: "Péninsule Ibérique & Pyrénéenne",
    subtitle: "France • Espagne • Portugal",
    continent: "Europe",
    difficulty: "easy",
    countryIso3s: ["FRA", "ESP", "PRT"],
    funFact: "La frontière entre l'Espagne et le Portugal (La Raya) est l'une des plus anciennes et stables frontières d'Europe, tracée en 1297 !",
    hint: "Le Portugal borde l'Atlantique à l'ouest, l'Espagne occupe le centre du plateau, et la France s'arrête aux crêtes des Pyrénées.",
  },
  {
    id: "alpine-heart",
    name: "Le Cœur Alpin",
    subtitle: "Suisse • Autriche • Allemagne • Italie",
    continent: "Europe",
    difficulty: "medium",
    countryIso3s: ["CHE", "AUT", "DEU", "ITA"],
    funFact: "La Suisse et l'Autriche sont deux pays entièrement enclavés qui partagent l'arc alpin avec leurs voisins géants allemand et italien.",
    hint: "L'Allemagne est au nord, l'Italie forme la botte au sud, la Suisse est à l'ouest et l'Autriche s'étire vers l'est.",
  },
  {
    id: "scandinavia",
    name: "Scandinavie & Baltique",
    subtitle: "Norvège • Suède • Finlande • Danemark",
    continent: "Europe",
    difficulty: "medium",
    countryIso3s: ["NOR", "SWE", "FIN", "DNK"],
    funFact: "Le Danemark est relié à la Suède par le pont d'Øresund, combinant route et voie ferrée sur 8 km !",
    hint: "La Norvège épouse la côte atlantique découpée par les fjords, la Suède s'étend au centre et la Finlande touche la frontière orientale.",
  },
  {
    id: "southern-cone",
    name: "Cône Sud Américain",
    subtitle: "Argentine • Chili • Uruguay",
    continent: "Amériques",
    difficulty: "easy",
    countryIso3s: ["ARG", "CHL", "URY"],
    funFact: "Le Chili est le pays le plus long et étroit du monde : 4 300 km de long pour seulement 175 km de largeur moyenne !",
    hint: "Le Chili est la longue bande côtière le long du Pacifique, l'Argentine s'étend de la pampa à la Patagonie, et l'Uruguay borde le Río de la Plata.",
  },
  {
    id: "central-america",
    name: "Pont d'Amérique Centrale",
    subtitle: "Guatemala • Honduras • Salvador • Nicaragua",
    continent: "Amériques",
    difficulty: "hard",
    countryIso3s: ["GTM", "HND", "SLV", "NIC"],
    funFact: "Le Salvador est le seul pays d'Amérique centrale à n'avoir aucune côte sur la mer des Caraïbes (façade 100% Pacifique).",
    hint: "Le Guatemala borde le Mexique au nord-ouest, le Nicaragua s'étend au sud-est, et le Salvador forme une enclave sur le Pacifique.",
  },
  {
    id: "guinea-coast",
    name: "Golfe de Guinée",
    subtitle: "Côte d'Ivoire • Ghana • Togo • Bénin",
    continent: "Afrique",
    difficulty: "medium",
    countryIso3s: ["CIV", "GHA", "TGO", "BEN"],
    funFact: "Le Togo et le Bénin forment deux couloirs verticaux très étroits partant de la côte atlantique vers l'intérieur sahélien.",
    hint: "D'ouest en est, ces 4 pays se succèdent le long de la côte : Côte d'Ivoire, Ghana, Togo, puis Bénin.",
  },
  {
    id: "east-africa",
    name: "Les Grands Lacs d'Afrique",
    subtitle: "Kenya • Ouganda • Tanzanie • Rwanda",
    continent: "Afrique",
    difficulty: "hard",
    countryIso3s: ["KEN", "UGA", "TZA", "RWA"],
    funFact: "Le Lac Victoria, deuxième plus grand lac d'eau douce au monde, est partagé entre l'Ouganda, la Tanzanie et le Kenya.",
    hint: "La Tanzanie est au sud avec le Kilimandjaro, le Kenya borde l'océan Indien à l'est, l'Ouganda est au nord-ouest du lac et le Rwanda est le plus compact.",
  },
  {
    id: "indochina",
    name: "Péninsule Indochinoise",
    subtitle: "Thaïlande • Vietnam • Laos • Cambodge",
    continent: "Asie",
    difficulty: "medium",
    countryIso3s: ["THA", "VNM", "LAO", "KHM"],
    funFact: "Le Laos est le seul pays enclavé d'Asie du Sud-Est, entièrement entouré de terres sans aucun littoral marin.",
    hint: "Le Vietnam forme un 'S' côtier à l'est, le Laos s'étire le long du Mékong sans mer, la Thaïlande au centre et le Cambodge au sud.",
  },
  {
    id: "balkans",
    name: "Balkans Adriatiques",
    subtitle: "Croatie • Bosnie-Herzégovine • Serbie • Monténégro",
    continent: "Europe",
    difficulty: "hard",
    countryIso3s: ["HRV", "BIH", "SRB", "MNE"],
    funFact: "La côte croate forme un croissant qui entoure presque entièrement la Bosnie, ne lui laissant qu'un étroit débouché de 20 km à Neum.",
    hint: "La Croatie longe l'Adriatique, la Bosnie est nichée au creux du croissant croate, et la Serbie s'étend vers la plaine pannonienne.",
  },
  {
    id: "caucasus",
    name: "Isthme du Caucase",
    subtitle: "Géorgie • Arménie • Azerbaïdjan",
    continent: "Asie",
    difficulty: "medium",
    countryIso3s: ["GEO", "ARM", "AZE"],
    funFact: "Le Caucase est un pont montagneux spectaculaire entre la mer Noire à l'ouest et la mer Caspienne à l'est.",
    hint: "La Géorgie borde la mer Noire au nord-ouest, l'Azerbaïdjan s'ouvre sur la mer Caspienne à l'est, et l'Arménie est enclavée au sud.",
  },
  {
    id: "middle-east-levant",
    name: "Le Levant & Proche-Orient",
    subtitle: "Turquie • Syrie • Jordanie • Liban",
    continent: "Moyen-Orient",
    difficulty: "medium",
    countryIso3s: ["TUR", "SYR", "JOR", "LBN"],
    funFact: "La mer Morte, bordée par la Jordanie, est le point le plus bas de la surface terrestre à -430 mètres sous le niveau de la mer !",
    hint: "La Turquie forme la grande péninsule anatolienne au nord, la Syrie s'étend au sud de la Turquie, le Liban sur la côte méditerranéenne et la Jordanie au sud.",
  },
  {
    id: "north-america",
    name: "Amérique du Nord",
    subtitle: "Canada • États-Unis • Mexique",
    continent: "Amériques",
    difficulty: "easy",
    countryIso3s: ["CAN", "USA", "MEX"],
    funFact: "La frontière entre le Canada et les États-Unis est la plus longue frontière terrestre internationale non gardée au monde (8 891 km).",
    hint: "Le Canada s'étend au grand nord boréal, les États-Unis occupent le centre du continent, et le Mexique s'élargit vers les tropiques au sud.",
  },
  {
    id: "benelux-neighbors",
    name: "Cœur de l'Europe Occidentale",
    subtitle: "Belgique • Pays-Bas • Allemagne • France",
    continent: "Europe",
    difficulty: "easy",
    countryIso3s: ["BEL", "NLD", "DEU", "FRA"],
    funFact: "Près d'un tiers des Pays-Bas se situe sous le niveau de la mer, protégé par un réseau spectaculaire de digues et polders.",
    hint: "Les Pays-Bas sont au nord le long de la mer du Nord, la Belgique s'intercale entre la France et les Pays-Bas, et l'Allemagne s'étend à l'est.",
  },
  {
    id: "andean-neighbors",
    name: "Cordillère des Andes",
    subtitle: "Pérou • Équateur • Colombie • Bolivie",
    continent: "Amériques",
    difficulty: "hard",
    countryIso3s: ["PER", "ECU", "COL", "BOL"],
    funFact: "L'Équateur porte le nom de la ligne équatoriale qui le traverse, et son sommet le Chimborazo est le point le plus proche du soleil !",
    hint: "La Colombie est au nord touchant les deux océans, l'Équateur est compact sur la côte ouest, le Pérou s'étend au sud et la Bolivie est sur l'Altiplano.",
  },
];

// Cache des features GeoJSON du monde
let cachedFeaturesMap: Map<string, any> | null = null;

function getWorldFeaturesMap(): Map<string, any> {
  if (cachedFeaturesMap) return cachedFeaturesMap;

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

  cachedFeaturesMap = map;
  return map;
}

/**
 * Prépare les pièces d'un Tangram Frontalier projetées dans un même repère SVG
 */
export function prepareBorderPuzzle(
  clusterId: string,
  width = 600,
  height = 420
): PreparedBorderPuzzle | null {
  const cluster = BORDER_PUZZLE_CLUSTERS.find((c) => c.id === clusterId);
  if (!cluster) return null;

  const featuresMap = getWorldFeaturesMap();
  const atlasCountries = getAllAtlasCountries();

  // Récupérer les features de chaque pays de la grappe
  const clusterFeatures: any[] = [];
  const validIso3s: string[] = [];

  for (const iso3 of cluster.countryIso3s) {
    const f = featuresMap.get(iso3.toUpperCase());
    if (f) {
      clusterFeatures.push(f);
      validIso3s.push(iso3.toUpperCase());
    }
  }

  if (clusterFeatures.length === 0) return null;

  // Créer une FeatureCollection composite pour calibrer le cadrage parfait
  const combinedFeatureCollection = {
    type: "FeatureCollection",
    features: clusterFeatures,
  };

  // Projection Mercator calibrée avec marge
  const padding = 36;
  const projection = geoMercator().fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    combinedFeatureCollection as any
  );

  const pathGenerator = geoPath().projection(projection);

  // Générer les pièces individuelles
  const pieces: PuzzlePieceCountry[] = [];
  let combinedOutlineD = "";

  for (let i = 0; i < clusterFeatures.length; i++) {
    const f = clusterFeatures[i];
    const iso3 = validIso3s[i];
    const atlas = atlasCountries.find((a) => a.iso3.toUpperCase() === iso3);
    const colorTheme = PUZZLE_COLORS[i % PUZZLE_COLORS.length];

    const pathD = pathGenerator(f) || "";
    if (!pathD) continue;

    combinedOutlineD += ` ${pathD}`;

    // Calcul du centroïde pour le label
    const rawCentroid = pathGenerator.centroid(f);
    const centroid: [number, number] =
      rawCentroid && !isNaN(rawCentroid[0]) && !isNaN(rawCentroid[1])
        ? [Math.round(rawCentroid[0]), Math.round(rawCentroid[1])]
        : [width / 2, height / 2];

    // Calcul des bornes de la pièce pour le cadrage du fragment
    const rawBounds = pathGenerator.bounds(f);
    const bounds = {
      minX: Math.round(rawBounds[0][0]),
      minY: Math.round(rawBounds[0][1]),
      maxX: Math.round(rawBounds[1][0]),
      maxY: Math.round(rawBounds[1][1]),
    };

    pieces.push({
      iso3,
      name: atlas?.name || iso3,
      flagEmoji: atlas?.flagEmoji || "🌍",
      capital: atlas?.capital || "Capitale",
      color: colorTheme.color,
      gradient: colorTheme.gradient,
      pathD,
      centroid,
      bounds,
    });
  }

  return {
    cluster,
    pieces,
    viewBox: `0 0 ${width} ${height}`,
    width,
    height,
    combinedOutlineD: combinedOutlineD.trim(),
  };
}

/**
 * Vérifie si une pièce est posée suffisamment près de son emplacement cible
 * Tolérance en pixels sur le repère de la carte
 */
export function isPieceSnapped(
  currentPos: { x: number; y: number },
  targetPos: { x: number; y: number } = { x: 0, y: 0 },
  tolerance = 45
): boolean {
  const dx = currentPos.x - targetPos.x;
  const dy = currentPos.y - targetPos.y;
  return Math.sqrt(dx * dx + dy * dy) <= tolerance;
}

/**
 * Tire une grappe aléatoire différente de la courante
 */
export function getRandomPuzzleCluster(excludeId?: string): BorderPuzzleClusterDef {
  const available = BORDER_PUZZLE_CLUSTERS.filter((c) => c.id !== excludeId);
  const pool = available.length > 0 ? available : BORDER_PUZZLE_CLUSTERS;
  return pool[Math.floor(Math.random() * pool.length)];
}
