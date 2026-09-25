export type SatelliteCategory =
  | "monument"
  | "natural_wonder"
  | "urban_island"
  | "canal_port"
  | "volcano_crater";

export interface SatelliteLocation {
  id: string;
  name: string;
  country: string;
  iso3: string;
  flagEmoji: string;
  continent: string;
  lat: number;
  lng: number;
  category: SatelliteCategory;
  satelliteImageUrl: string;
  secondaryImageUrl?: string;
  zoomLevelHint?: number; // Niveau de zoom indicatif
  clues: [string, string]; // 2 indices progressifs
  funFact: string; // Anecdote vue du ciel / satellite
  difficulty: "easy" | "medium" | "hard";
}

export interface GeoDetectiveGuess {
  guessedLat: number;
  guessedLng: number;
  distanceKm: number;
  score: number; // 0 à 5 000
  bearingDegrees: number;
  compassDirection: string;
  compassArrow: string;
}

export interface GeoDetectiveRound {
  roundNumber: number;
  location: SatelliteLocation;
  guess: GeoDetectiveGuess | null;
  usedClue: boolean;
}

export interface GeoDetectiveGameState {
  rounds: GeoDetectiveRound[];
  currentRoundIndex: number; // 0 à 4
  totalScore: number; // 0 à 25 000
  isGameOver: boolean;
}

export interface GeoDetectiveRank {
  title: string;
  icon: string;
  minScore: number;
  description: string;
}

/**
 * Calcule l'URL de la dalle satellite directe (Esri World Imagery / Sentinel / Landsat)
 * pour n'importe quelles coordonnées géographiques mondiales.
 */
export function getSatelliteTileUrl(lat: number, lng: number, zoom: number = 14): string {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;
}

export const SATELLITE_LOCATIONS: SatelliteLocation[] = [
  {
    id: "giza-pyramids",
    name: "Grandes Pyramides de Gizeh & Le Sphinx",
    country: "Égypte",
    iso3: "EGY",
    flagEmoji: "🇪🇬",
    continent: "Africa",
    lat: 29.9792,
    lng: 31.1342,
    category: "monument",
    satelliteImageUrl:
      "https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1600&q=85",
    secondaryImageUrl:
      "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1600&q=85",
    clues: [
      "Situé à la limite exacte entre une immense métropole et un désert infini.",
      "Le plus long fleuve d'Afrique coule à quelques kilomètres à l'est.",
    ],
    funFact:
      "Depuis l'orbite terrestre, la Grande Pyramide de Khéops présente en réalité 8 faces concaves, visibles uniquement lors des équinoxes sous une lumière rasante !",
    difficulty: "easy",
  },
  {
    id: "palm-jumeirah",
    name: "Palm Jumeirah & Marina",
    country: "Émirats arabes unis",
    iso3: "ARE",
    flagEmoji: "🇦🇪",
    continent: "Asia",
    lat: 25.1124,
    lng: 55.139,
    category: "urban_island",
    satelliteImageUrl:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=85",
    secondaryImageUrl:
      "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1600&q=85",
    clues: [
      "Un archipel artificiel gigantesque en forme de palmier posé dans un golfe très chaud.",
      "Cette mégalopole abrite le plus haut gratte-ciel du monde (Burj Khalifa).",
    ],
    funFact:
      "Plus de 94 millions de mètres cubes de sable marin ont été projetés pour créer cette silhouette de palmier visible depuis la Station Spatiale Internationale.",
    difficulty: "easy",
  },
  {
    id: "venice-lagoon",
    name: "Lagune de Venise & Le Grand Canal",
    country: "Italie",
    iso3: "ITA",
    flagEmoji: "🇮🇹",
    continent: "Europe",
    lat: 45.4387,
    lng: 12.3359,
    category: "urban_island",
    satelliteImageUrl:
      "https://images.unsplash.com/photo-1520175480921-4edfa2983e0f?auto=format&fit=crop&w=1600&q=85",
    secondaryImageUrl:
      "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=1600&q=85",
    clues: [
      "Une cité bâtie sur 118 îles reliées par plus de 400 ponts.",
      "Située au fond de la mer Adriatique, le Grand Canal y serpente comme un grand S inversé.",
    ],
    funFact:
      "Vue du ciel, la ville historique forme exactement la silhouette stylisée d'un poisson géant !",
    difficulty: "easy",
  },
  {
    id: "mount-fuji",
    name: "Cratère du Mont Fuji",
    country: "Japon",
    iso3: "JPN",
    flagEmoji: "🇯🇵",
    continent: "Asia",
    lat: 35.3606,
    lng: 138.7274,
    category: "volcano_crater",
    satelliteImageUrl:
      "https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=1600&q=85",
    secondaryImageUrl:
      "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=1600&q=85",
    clues: [
      "Un cône volcanique à la symétrie quasi parfaite culminant à 3 776 mètres.",
      "Montagne sacrée entourée de 5 lacs sur l'île principale de Honshu.",
    ],
    funFact:
      "L'ombre portée du Mont Fuji au lever du soleil peut s'étendre sur plus de 24 kilomètres dans la plaine du Kantō.",
    difficulty: "easy",
  },
  {
    id: "manhattan-central-park",
    name: "Manhattan & Rectangle de Central Park",
    country: "États-Unis",
    iso3: "USA",
    flagEmoji: "🇺🇸",
    continent: "Americas",
    lat: 40.7829,
    lng: -73.9654,
    category: "urban_island",
    satelliteImageUrl:
      "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=1600&q=85",
    secondaryImageUrl:
      "https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?auto=format&fit=crop&w=1600&q=85",
    clues: [
      "Un rectangle de verdure géant de 341 hectares encadré par des gratte-ciels.",
      "Flanqué par l'Hudson River à l'ouest et l'East River à l'est.",
    ],
    funFact:
      "Le contraste thermique entre le feuillage de Central Park et le béton des avenues environnantes crée un micro-climat visible sur les caméras thermiques satellites.",
    difficulty: "easy",
  },
  {
    id: "richat-structure",
    name: "L'Œil du Sahara (Structure de Richat)",
    country: "Mauritanie",
    iso3: "MRT",
    flagEmoji: "🇲🇷",
    continent: "Africa",
    lat: 21.1269,
    lng: -11.4016,
    category: "natural_wonder",
    satelliteImageUrl:
      "https://images.unsplash.com/photo-1547234935-80c7145ec969?auto=format&fit=crop&w=1600&q=85",
    secondaryImageUrl:
      "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1600&q=85",
    clues: [
      "Un dôme géologique circulaire spectaculaire de 40 km de diamètre au milieu des dunes.",
      "Longtemps utilisé comme point de repère visuel par les premières missions spatiales Gemini.",
    ],
    funFact:
      "Pendant des décennies, les scientifiques ont cru à un cratère d'impact météoritique géant avant de découvrir un dôme magmatique érodé vieux de 100 millions d'années.",
    difficulty: "hard",
  },
  {
    id: "panama-canal",
    name: "Écluses de Miraflores & Canal de Panama",
    country: "Panama",
    iso3: "PAN",
    flagEmoji: "🇵🇦",
    continent: "Americas",
    lat: 9.0169,
    lng: -79.5936,
    category: "canal_port",
    satelliteImageUrl:
      "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1600&q=85",
    secondaryImageUrl:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=85",
    clues: [
      "Le point de passage artificiel le plus stratégique reliant l'Océan Pacifique et l'Océan Atlantique.",
      "Un isthme tropical montagneux traversé par le lac Gatún.",
    ],
    funFact:
      "Curieusement sur une carte, en raison de la forme en S de l'isthme, les navires venant de l'Atlantique naviguent vers le Sud-Est pour atteindre le Pacifique !",
    difficulty: "medium",
  },
  {
    id: "taj-mahal",
    name: "Mausolée du Taj Mahal & Fleuve Yamuna",
    country: "Inde",
    iso3: "IND",
    flagEmoji: "🇮🇳",
    continent: "Asia",
    lat: 27.1751,
    lng: 78.0421,
    category: "monument",
    satelliteImageUrl:
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1600&q=85",
    secondaryImageUrl:
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1600&q=85",
    clues: [
      "Mausolée en marbre blanc d'une symétrie parfaite bordé par une boucle de rivière.",
      "Situé dans l'État de l'Uttar Pradesh, au cœur du sous-continent indien.",
    ],
    funFact:
      "La symétrie axiale des jardins moghols et des bassins de réflexion a été pensée pour être harmonieuse sous n'importe quel angle, y compris le zénith.",
    difficulty: "easy",
  },
  {
    id: "uluru-rock",
    name: "Monolithe d'Uluru (Ayers Rock)",
    country: "Australie",
    iso3: "AUS",
    flagEmoji: "🇦🇺",
    continent: "Oceania",
    lat: -25.3444,
    lng: 131.0369,
    category: "natural_wonder",
    satelliteImageUrl:
      "https://images.unsplash.com/photo-1529108190281-9a4f620bc2d7?auto=format&fit=crop&w=1600&q=85",
    secondaryImageUrl:
      "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1600&q=85",
    clues: [
      "Un inselberg de grès ocre isolé au milieu du désert rouge de l'Outback.",
      "Site sacré pour les peuples autochtones Anangu du Territoire du Nord.",
    ],
    funFact:
      "Cette montagne de 348 mètres n'est que la partie visible d'un bloc rocheux colossal s'enfonçant jusqu'à 6 kilomètres sous terre !",
    difficulty: "medium",
  },
  {
    id: "santorini-caldera",
    name: "Caldeira Volcanique de Santorin",
    country: "Grèce",
    iso3: "GRC",
    flagEmoji: "🇬🇷",
    continent: "Europe",
    lat: 36.4166,
    lng: 25.4316,
    category: "volcano_crater",
    satelliteImageUrl:
      "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1600&q=85",
    secondaryImageUrl:
      "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1600&q=85",
    clues: [
      "Un anneau d'îles déchiquetées entourant un cratère sous-marin englouti dans la mer Égée.",
      "Célèbre pour ses falaises noires couronnées de villages aux coupoles bleues.",
    ],
    funFact:
      "L'éruption minoenne cataclysmique il y a environ 3 600 ans est l'une des plus gigantesques explosions volcaniques de l'histoire humaine et a inspiré le mythe de l'Atlantide.",
    difficulty: "medium",
  },
  {
    id: "mont-saint-michel",
    name: "Îlot du Mont-Saint-Michel & Ses Marées",
    country: "France",
    iso3: "FRA",
    flagEmoji: "🇫🇷",
    continent: "Europe",
    lat: 48.636,
    lng: -1.5115,
    category: "monument",
    satelliteImageUrl:
      "https://images.unsplash.com/photo-1509024644558-2f56ce76c490?auto=format&fit=crop&w=1600&q=85",
    secondaryImageUrl:
      "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1600&q=85",
    clues: [
      "Un monticule rocheux couronné par une abbaye médiévale cerné par d'immenses bancs de sable.",
      "Le théâtre des plus fortes marées d'Europe continentale (marnage jusqu'à 15 mètres).",
    ],
    funFact:
      "À marée haute, la mer monte à la vitesse d'un cheval au galop selon le dicton, isolant totalement le mont du continent.",
    difficulty: "medium",
  },
  {
    id: "grand-canyon",
    name: "Gorges du Grand Canyon & Le Colorado",
    country: "États-Unis",
    iso3: "USA",
    flagEmoji: "🇺🇸",
    continent: "Americas",
    lat: 36.1069,
    lng: -112.1129,
    category: "natural_wonder",
    satelliteImageUrl:
      "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?auto=format&fit=crop&w=1600&q=85",
    secondaryImageUrl:
      "https://images.unsplash.com/photo-1527333656061-ca7adf608ae1?auto=format&fit=crop&w=1600&q=85",
    clues: [
      "Une faille géologique spectaculaire de 446 km de long sculptée dans les plateaux de l'Arizona.",
      "Des strates rocheuses rouges exposant près de 2 milliards d'années d'histoire de la Terre.",
    ],
    funFact:
      "Le canyon est si profond (jusqu'à 1 800 m) que la température au fond du fleuve peut être de 15°C plus chaude qu'au sommet de la falaise.",
    difficulty: "easy",
  },
  {
    id: "victoria-falls",
    name: "Chutes Victoria (Mosi-oa-Tunya)",
    country: "Zambie",
    iso3: "ZMB",
    flagEmoji: "🇿🇲",
    continent: "Africa",
    lat: -17.9243,
    lng: 25.8572,
    category: "natural_wonder",
    satelliteImageUrl:
      "https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?auto=format&fit=crop&w=1600&q=85",
    secondaryImageUrl:
      "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1600&q=85",
    clues: [
      "Le fleuve Zambèze s'engouffre dans une faille étroite de basalte de plus de 1 700 m de large.",
      "Frontière naturelle spectaculaire entre la Zambie et le Zimbabwe.",
    ],
    funFact:
      "Le panache de vapeur d'eau pulvérisée s'élève à plus de 400 mètres de hauteur et est couramment photographié depuis l'orbite spatiale basse.",
    difficulty: "medium",
  },
  {
    id: "bosphorus-strait",
    name: "Le Détroit du Bosphore & La Corne d'Or",
    country: "Turquie",
    iso3: "TUR",
    flagEmoji: "🇹🇷",
    continent: "Europe",
    lat: 41.0082,
    lng: 28.9784,
    category: "canal_port",
    satelliteImageUrl:
      "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1600&q=85",
    secondaryImageUrl:
      "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=1600&q=85",
    clues: [
      "L'unique bras de mer reliant la Mer Noire à la Mer de Marmara.",
      "Sépare la partie européenne et la partie asiatique d'une cité millénaire.",
    ],
    funFact:
      "C'est la seule voie maritime naturelle au monde qui sépare deux continents au cœur d'une même métropole de 16 millions d'âmes.",
    difficulty: "medium",
  },
  {
    id: "iguazu-falls",
    name: "Chutes d'Iguazú & La Gorge du Diable",
    country: "Argentine",
    iso3: "ARG",
    flagEmoji: "🇦🇷",
    continent: "Americas",
    lat: -25.6953,
    lng: -54.4367,
    category: "natural_wonder",
    satelliteImageUrl:
      "https://images.unsplash.com/photo-1589802829985-817e51171b92?auto=format&fit=crop&w=1600&q=85",
    secondaryImageUrl:
      "https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=1600&q=85",
    clues: [
      "Un amphithéâtre naturel en demi-cercle de 275 cascades au cœur de la forêt subtropicale.",
      "Frontière entre la province de Misiones et l'État brésilien du Paraná.",
    ],
    funFact:
      "Le grondement de la Garganta del Diablo (« Gorge du Diable ») est perceptible à plus de 10 kilomètres à la ronde.",
    difficulty: "medium",
  },
  {
    id: "machu-picchu",
    name: "Citadelle Perchée de Machu Picchu",
    country: "Pérou",
    iso3: "PER",
    flagEmoji: "🇵🇪",
    continent: "Americas",
    lat: -13.1631,
    lng: -72.545,
    category: "monument",
    satelliteImageUrl:
      "https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=1600&q=85",
    secondaryImageUrl:
      "https://images.unsplash.com/photo-1509299349698-dd22323b5963?auto=format&fit=crop&w=1600&q=85",
    clues: [
      "Une citadelle de terrasses suspendue sur une crête rocheuse à 2 430 m d'altitude.",
      "Enlacée par les méandres vertigineux de la rivière Urubamba.",
    ],
    funFact:
      "Les blocs de granit mégalithiques ont été taillés et emboîtés sans aucun mortier avec une précision telle qu'une lame de couteau ne peut s'y glisser.",
    difficulty: "medium",
  },
  {
    id: "aogashima-island",
    name: "Île Volcanique d'Aogashima (Cratère dans le Cratère)",
    country: "Japon",
    iso3: "JPN",
    flagEmoji: "🇯🇵",
    continent: "Asia",
    lat: 32.4555,
    lng: 139.7686,
    category: "volcano_crater",
    satelliteImageUrl:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=85",
    secondaryImageUrl:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=85",
    clues: [
      "Une île volcanique isolée en plein océan Pacifique avec une caldeira emboîtée dans une caldeira.",
      "L'un des villages les plus isolés du Japon, à plus de 350 km au sud de Tokyo.",
    ],
    funFact:
      "Cette formation géologique rarissime appelée « caldeira double » abrite environ 170 habitants qui utilisent les fumerolles volcaniques pour cuisiner et se chauffer.",
    difficulty: "hard",
  },
  {
    id: "suez-canal",
    name: "Le Canal de Suez & Lacs Amers",
    country: "Égypte",
    iso3: "EGY",
    flagEmoji: "🇪🇬",
    continent: "Africa",
    lat: 30.5852,
    lng: 32.2654,
    category: "canal_port",
    satelliteImageUrl:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1600&q=85",
    secondaryImageUrl:
      "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1600&q=85",
    clues: [
      "Une voie maritime artificielle de 193 km reliant directement Port-Saïd à la Mer Rouge.",
      "Évite à tous les navires marchands de contourner l'Afrique par le Cap de Bonne-Espérance.",
    ],
    funFact:
      "Environ 12% du commerce maritime mondial transite par cette saignée creusée sans aucune écluse dans le désert égyptien.",
    difficulty: "easy",
  },
  {
    id: "salardeuyuni",
    name: "Le Salar d'Uyuni (Le Grand Miroir de Sel)",
    country: "Bolivie",
    iso3: "BOL",
    flagEmoji: "🇧🇴",
    continent: "Americas",
    lat: -20.1338,
    lng: -67.4891,
    category: "natural_wonder",
    satelliteImageUrl:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=85",
    secondaryImageUrl:
      "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1600&q=85",
    clues: [
      "Le plus vaste désert de sel au monde (plus de 10 500 km²) perché à 3 650 m d'altitude.",
      "Situé sur l'Altiplano andin, il devient un miroir géant parfait pendant la saison des pluies.",
    ],
    funFact:
      "Sa surface est si parfaitement plane et réfléchissante que les agences spatiales mondiales (NASA, ESA) l'utilisent pour étalonner les altimètres des satellites en orbite !",
    difficulty: "medium",
  },
  {
    id: "barringer-crater",
    name: "Meteor Crater (Cratère de Barringer)",
    country: "États-Unis",
    iso3: "USA",
    flagEmoji: "🇺🇸",
    continent: "Americas",
    lat: 35.0272,
    lng: -111.0225,
    category: "volcano_crater",
    satelliteImageUrl:
      "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1600&q=85",
    secondaryImageUrl:
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=85",
    clues: [
      "Le cratère d'impact météoritique le mieux conservé de la planète (1 200 m de diamètre).",
      "Perché sur le plateau du Colorado près de Flagstaff en Arizona.",
    ],
    funFact:
      "C'est sur ce terrain lunaire et désolé que les astronautes des missions Apollo de la NASA se sont entraînés avant de marcher sur la Lune !",
    difficulty: "hard",
  },
  {
    id: "cape-of-good-hope",
    name: "Péninsule du Cap de Bonne-Espérance",
    country: "Afrique du Sud",
    iso3: "ZAF",
    flagEmoji: "🇿🇦",
    continent: "Africa",
    lat: -34.3568,
    lng: 18.4967,
    category: "natural_wonder",
    satelliteImageUrl:
      "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1600&q=85",
    secondaryImageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85",
    clues: [
      "Un promontoire rocheux mythique s'avançant dans l'océan à l'extrémité australe de l'Afrique.",
      "Franchie pour la première fois en 1488 par le navigateur portugais Bartolomeu Dias.",
    ],
    funFact:
      "Contrairement à une idée reçue, ce n'est pas le point le plus au sud du continent africain (titre détenu par le Cap des Aiguilles à 150 km à l'est) !",
    difficulty: "easy",
  },
  {
    id: "bora-bora",
    name: "Atoll & Lagon de Bora Bora",
    country: "France",
    iso3: "PYF",
    flagEmoji: "🇵🇫",
    continent: "Oceania",
    lat: -16.5004,
    lng: -151.7415,
    category: "urban_island",
    satelliteImageUrl:
      "https://images.unsplash.com/photo-1532408840957-031d8034aeef?auto=format&fit=crop&w=1600&q=85",
    secondaryImageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85",
    clues: [
      "Un volcan éteint ceinturé par une barrière de corail turquoise et des motus de sable blanc.",
      "Situé dans l'archipel des îles Sous-le-Vent en Polynésie française.",
    ],
    funFact:
      "La barrière de corail ne possède qu'une seule passe navigable (la passe de Teavanui), permettant aux grands navires d'entrer dans ce lagon aux 50 nuances de bleu.",
    difficulty: "medium",
  },
  {
    id: "easter-island",
    name: "Île de Pâques (Rapa Nui) & Cratère Rano Kau",
    country: "Chili",
    iso3: "CHL",
    flagEmoji: "🇨🇱",
    continent: "Oceania",
    lat: -27.1127,
    lng: -109.3497,
    category: "volcano_crater",
    satelliteImageUrl:
      "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1600&q=85",
    secondaryImageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85",
    clues: [
      "L'une des terres habitées les plus isolées du monde, au cœur du Pacifique Sud-Est.",
      "Célèbre pour ses centaines de statues monumentales en tuf volcanique (Moaï).",
    ],
    funFact:
      "L'île a une forme triangulaire parfaite car elle est née de la fusion de trois volcans distincts surgis des abysses océaniques.",
    difficulty: "hard",
  },
  {
    id: "okavango-delta",
    name: "Delta de l'Okavango (Le Fleuve qui ne Trouve Jamais la Mer)",
    country: "Botswana",
    iso3: "BWA",
    flagEmoji: "🇧🇼",
    continent: "Africa",
    lat: -19.2789,
    lng: 22.9197,
    category: "natural_wonder",
    satelliteImageUrl:
      "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1600&q=85",
    secondaryImageUrl:
      "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1600&q=85",
    clues: [
      "Un éventail luxuriant de canaux et de marécages au milieu du désert du Kalahari.",
      "L'un des très rares fleuves endoréiques de la planète : ses eaux s'évaporent entièrement dans le sable.",
    ],
    funFact:
      "Chaque année pendant la saison sèche, la crue venue des hauts plateaux d'Angola met 6 mois à parcourir 1 000 km pour inonder le delta, attirant la plus forte concentration d'éléphants d'Afrique.",
    difficulty: "hard",
  },
  {
    id: "lake-baikal",
    name: "Lac Baïkal (L'Œil Bleu de la Sibérie)",
    country: "Russie",
    iso3: "RUS",
    flagEmoji: "🇷🇺",
    continent: "Asia",
    lat: 53.5587,
    lng: 108.165,
    category: "natural_wonder",
    satelliteImageUrl:
      "https://images.unsplash.com/photo-1508873696983-2df57046475a?auto=format&fit=crop&w=1600&q=85",
    secondaryImageUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85",
    clues: [
      "Un croissant d'eau géant et mystique de 636 km de long enchâssé entre les montagnes de Sibérie.",
      "Le lac le plus profond du monde (1 642 mètres).",
    ],
    funFact:
      "Le Baïkal contient à lui seul 20% de l'eau douce de surface non gelée de la planète Terre, soit plus que les cinq Grands Lacs d'Amérique du Nord réunis !",
    difficulty: "easy",
  },
];
