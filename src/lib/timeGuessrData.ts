/**
 * ⏳ TimeGuessr Géo-Historique
 * Données d'archives photographiques et historiques mondiales (1850 - 2024)
 * et moteur de calcul de score spatio-temporel.
 */

export interface HistoricalArchiveItem {
  id: string;
  title: string;
  year: number; // 1850 - 2024
  lat: number;
  lng: number;
  city: string;
  country: string;
  flagEmoji: string;
  imageUrl: string;
  secondaryImageUrl?: string;
  era: string; // Ex: "Belle Époque", "Guerre Froide", "Années Folles", "Entre-deux-guerres"
  historicalContext: string;
  clues: [string, string];
}

export interface TimeGuessrRoundResult {
  roundNumber: number;
  item: HistoricalArchiveItem;
  guessedYear: number;
  yearDelta: number;
  timeScore: number; // 0 à 2 500
  guessedLat: number;
  guessedLng: number;
  distanceKm: number;
  geoScore: number; // 0 à 2 500
  totalRoundScore: number; // 0 à 5 000
}

export const HISTORICAL_ARCHIVES: HistoricalArchiveItem[] = [
  {
    id: "eiffel-tower-construction",
    title: "Construction du 2e étage de la Tour Eiffel",
    year: 1888,
    lat: 48.8584,
    lng: 2.2945,
    city: "Paris",
    country: "France",
    flagEmoji: "🇫🇷",
    imageUrl:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1400&q=80",
    era: "Belle Époque",
    historicalContext:
      "Érigée pour l'Exposition Universelle de 1889 célébrant le centenaire de la Révolution française, la dame de fer de Gustave Eiffel mesurait alors 312 mètres et resta le plus haut monument du monde pendant 41 ans.",
    clues: [
      "Monument érigé sur le Champ-de-Mars au bord de la Seine.",
      "Fin du XIXe siècle, à l'aube de l'Exposition Universelle de 1889.",
    ],
  },
  {
    id: "berlin-wall-fall",
    title: "Chute du Mur de Berlin à la Porte de Brandebourg",
    year: 1989,
    lat: 52.5163,
    lng: 13.3777,
    city: "Berlin",
    country: "Allemagne",
    flagEmoji: "🇩🇪",
    imageUrl:
      "https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1400&q=80",
    era: "Fin de la Guerre Froide",
    historicalContext:
      "Le 9 novembre 1989, sous la pression populaire et après une annonce télévisée confuse des autorités est-allemandes, des dizaines de milliers de Berlinois franchissent le 'Rideau de Fer' et célèbrent la réunification sur le mur.",
    clues: [
      "Capitale européenne séparée en deux secteurs pendant près de 30 ans.",
      "Événement historique marquant l'automne précédant l'année 1990.",
    ],
  },
  {
    id: "mlk-i-have-a-dream",
    title: "Discours 'I Have a Dream' de Martin Luther King",
    year: 1963,
    lat: 38.8893,
    lng: -77.0502,
    city: "Washington D.C.",
    country: "États-Unis",
    flagEmoji: "🇺🇸",
    imageUrl:
      "https://images.unsplash.com/photo-1617581629397-a72507c3de9e?auto=format&fit=crop&w=1400&q=80",
    era: "Années 1960 / Droits Civiques",
    historicalContext:
      "Devant plus de 250 000 manifestants rassemblés sur les marches du Lincoln Memorial, le pasteur Martin Luther King Jr. prononce l'un des discours les plus mémorables de l'histoire pour les droits civiques et l'égalité raciale.",
    clues: [
      "Grand bassin réfléchissant au cœur de la capitale fédérale américaine.",
      "L'été où John F. Kennedy occupait encore la Maison Blanche (1963).",
    ],
  },
  {
    id: "statue-of-liberty-unveiling",
    title: "Inauguration de la Statue de la Liberté",
    year: 1886,
    lat: 40.6892,
    lng: -74.0445,
    city: "New York",
    country: "États-Unis",
    flagEmoji: "🇺🇸",
    imageUrl:
      "https://images.unsplash.com/photo-1605130284535-11dd9eedc58a?auto=format&fit=crop&w=1400&q=80",
    era: "Gilded Age (Fin XIXe)",
    historicalContext:
      "Offerte par le peuple français pour sceller l'amitié franco-américaine, 'La Liberté éclairant le monde' d'Auguste Bartholdi et Gustave Eiffel est inaugurée le 28 octobre 1886 dans la baie de Manhattan par le président Grover Cleveland.",
    clues: [
      "Îlot à l'entrée du port maritime le plus célèbre d'Amérique du Nord.",
      "Deux ans avant le début de la construction de la Tour Eiffel.",
    ],
  },
  {
    id: "golden-gate-construction",
    title: "Chantier des câbles du Golden Gate Bridge",
    year: 1935,
    lat: 37.8199,
    lng: -122.4783,
    city: "San Francisco",
    country: "États-Unis",
    flagEmoji: "🇺🇸",
    imageUrl:
      "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1400&q=80",
    era: "Entre-deux-guerres / New Deal",
    historicalContext:
      "Défi d'ingénierie suspendu au-dessus des courants violents du détroit reliant la baie de San Francisco au Pacifique, ce pont rouge 'International Orange' fut achevé en 1937 en pleine Grande Dépression.",
    clues: [
      "Baie mythique de la côte ouest américaine souvent enveloppée de brouillard.",
      "Chantier titanesque des années 1930 sous la présidence de Roosevelt.",
    ],
  },
  {
    id: "woodstock-festival",
    title: "Festival de Woodstock & Génération Peace and Love",
    year: 1969,
    lat: 41.7011,
    lng: -74.8802,
    city: "Bethel (New York)",
    country: "États-Unis",
    flagEmoji: "🇺🇸",
    imageUrl:
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1400&q=80",
    era: "Fin des Sixties / Contre-Culture",
    historicalContext:
      "Trois jours de paix et de musique rassemblant un demi-million de personnes dans les collines de l'État de New York, avec Jimi Hendrix, Janis Joplin et Carlos Santana à l'apogée du mouvement hippie.",
    clues: [
      "Plaines et collines rurales à une centaine de kilomètres au nord de New York.",
      "La même année historique que le premier pas de l'Homme sur la Lune (1969).",
    ],
  },
  {
    id: "apollo-11-launch",
    title: "Décollage d'Apollo 11 vers la Lune",
    year: 1969,
    lat: 28.5729,
    lng: -80.649,
    city: "Cap Canaveral (Floride)",
    country: "États-Unis",
    flagEmoji: "🇺🇸",
    imageUrl:
      "https://images.unsplash.com/photo-1517976487507-5b3b4b45f917?auto=format&fit=crop&w=1400&q=80",
    era: "Course à l'Espace",
    historicalContext:
      "Le 16 juillet 1969, la fusée géante Saturn V de 111 mètres s'arrache du pas de tir 39A emportant Neil Armstrong, Buzz Aldrin et Michael Collins vers le premier atterrissage lunaire sur la Mer de la Tranquillité.",
    clues: [
      "Péninsule côtière subtropicale bordée par l'océan Atlantique en Floride.",
      "Juillet 1969.",
    ],
  },
  {
    id: "mandela-release",
    title: "Libération de Nelson Mandela",
    year: 1990,
    lat: -33.9249,
    lng: 18.4241,
    city: "Le Cap",
    country: "Afrique du Sud",
    flagEmoji: "🇿🇦",
    imageUrl:
      "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1400&q=80",
    era: "Fin de l'Apartheid (Années 1990)",
    historicalContext:
      "Après 27 années d'emprisonnement, Nelson Mandela sort libre de la prison Victor Verster le 11 février 1990 et s'adresse à une foule immense depuis le balcon de l'hôtel de ville du Cap, scellant la fin du régime d'apartheid.",
    clues: [
      "Cité bordée par l'océan Atlantique au pied de la Montagne de la Table.",
      "L'année suivant la chute du mur de Berlin (1990).",
    ],
  },
  {
    id: "sydney-opera-house",
    title: "Construction des coques de l'Opéra de Sydney",
    year: 1966,
    lat: -33.8568,
    lng: 151.2153,
    city: "Sydney",
    country: "Australie",
    flagEmoji: "🇦🇺",
    imageUrl:
      "https://images.unsplash.com/photo-1523428096881-5cb799442992?auto=format&fit=crop&w=1400&q=80",
    era: "Architecture Moderne des Sixties",
    historicalContext:
      "Dessiné par l'architecte danois Jørn Utzon, ce chef-d'œuvre expressionniste en forme de voiles de bateau posées sur l'eau a nécessité 14 ans de travaux avant d'être inauguré en 1973 par la reine Elizabeth II.",
    clues: [
      "Bennelong Point, avançant dans l'une des plus belles baies naturelles de l'hémisphère sud.",
      "Milieu des années 1960.",
    ],
  },
  {
    id: "abbey-road-crossing",
    title: "Séance photo des Beatles sur le passage piéton d'Abbey Road",
    year: 1969,
    lat: 51.532,
    lng: -0.1774,
    city: "Londres",
    country: "Royaume-Uni",
    flagEmoji: "🇬🇧",
    imageUrl:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1400&q=80",
    era: "Swinging London / Fin des Beatles",
    historicalContext:
      "Le 8 août 1969 à 11h35, le photographe Iain Macmillan juché sur un escabeau prend six clichés de John, Ringo, Paul (pieds nus) et George traversant Abbey Road devant leurs studios d'enregistrement.",
    clues: [
      "Quartier de St John's Wood dans la capitale britannique.",
      "Année de sortie de l'ultime album studio enregistré par les 'Fab Four' (1969).",
    ],
  },
  {
    id: "christ-redeemer-unveiling",
    title: "Inauguration du Christ Rédempteur sur le Corcovado",
    year: 1931,
    lat: -22.9519,
    lng: -43.2105,
    city: "Rio de Janeiro",
    country: "Brésil",
    flagEmoji: "🇧🇷",
    imageUrl:
      "https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?auto=format&fit=crop&w=1400&q=80",
    era: "Art Déco / Années 1930",
    historicalContext:
      "Haute de 38 mètres et sculptée en stéatite par Paul Landowski et Heitor da Silva Costa, cette icône de l'Art Déco mondial est inaugurée le 12 octobre 1931 au sommet du pic du Corcovado à 710 mètres d'altitude.",
    clues: [
      "Sommet dominant la baie de Guanabara et les plages de Copacabana.",
      "Tout début des années 1930.",
    ],
  },
  {
    id: "coronation-elizabeth-ii",
    title: "Couronnement de la Reine Elizabeth II à Westminster",
    year: 1953,
    lat: 51.4994,
    lng: -0.1274,
    city: "Londres",
    country: "Royaume-Uni",
    flagEmoji: "🇬🇧",
    imageUrl:
      "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&w=1400&q=80",
    era: "Après-Guerre (Années 1950)",
    historicalContext:
      "Premier couronnement de l'histoire diffusé en direct à la télévision pour 277 millions de téléspectateurs à travers le monde, marquant le début du plus long règne de l'histoire britannique (70 ans et 214 jours).",
    clues: [
      "Abbaye royale millénaire au bord de la Tamise.",
      "La même année que l'ascension historique du Mont Everest (1953).",
    ],
  },
  {
    id: "tgv-inauguration",
    title: "Inauguration du TGV Sud-Est par François Mitterrand",
    year: 1981,
    lat: 48.8448,
    lng: 2.3735,
    city: "Paris (Gare de Lyon)",
    country: "France",
    flagEmoji: "🇫🇷",
    imageUrl:
      "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1400&q=80",
    era: "Années 1980 / Grande Vitesse",
    historicalContext:
      "Le 22 septembre 1981, la rame orange du TGV 16 relie Paris à Lyon à 260 km/h sur la première ligne à grande vitesse d'Europe, révolutionnant le transport ferroviaire mondial.",
    clues: [
      "Gare parisienne historique reconnaissable à sa grande tour de l'horloge.",
      "Année de l'élection de François Mitterrand à l'Élysée (1981).",
    ],
  },
  {
    id: "hong-kong-handover",
    title: "Rétrocession de Hong Kong à la République Populaire de Chine",
    year: 1997,
    lat: 22.2833,
    lng: 114.1736,
    city: "Hong Kong",
    country: "Chine",
    flagEmoji: "🇭🇰",
    imageUrl:
      "https://images.unsplash.com/photo-1506970845246-18f21d533b20?auto=format&fit=crop&w=1400&q=80",
    era: "Fin du XXe siècle",
    historicalContext:
      "Le 1er juillet 1997 à minuit, après 156 ans sous souveraineté britannique, le drapeau du Royaume-Uni est abaissé au Centre de Congrès de Victoria Harbour, consacrant le principe 'Un pays, deux systèmes'.",
    clues: [
      "Centre de convention maritime bordant Victoria Harbour face aux gratte-ciel de Kowloon.",
      "Trois ans avant l'an 2000 (1997).",
    ],
  },
  {
    id: "modern-olympics-athens",
    title: "Premiers Jeux Olympiques Modernes au Stade Panathénaïque",
    year: 1896,
    lat: 37.9686,
    lng: 23.7411,
    city: "Athènes",
    country: "Grèce",
    flagEmoji: "🇬🇷",
    imageUrl:
      "https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=1400&q=80",
    era: "Fin XIXe Siècle / Rénovation Olympique",
    historicalContext:
      "Sous l'impulsion de Pierre de Coubertin, le premier stade olympique moderne entièrement reconstruit en marbre blanc blanc accueille 241 athlètes de 14 nations pour la renaissance des Jeux.",
    clues: [
      "Berceau antique de la démocratie et de l'Acropole.",
      "Dernière décennie du XIXe siècle (1896).",
    ],
  },
];

/**
 * Calcule la distance orthodromique (en kilomètres) entre deux coordonnées géodésiques
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Rayon moyen de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Calcule le score spatial (0 à 2 500 points) selon la distance en km
 */
export function calculateSpatialScore(distanceKm: number): number {
  if (distanceKm <= 25) return 2500;
  // Décroissance exponentielle : 0 km -> 2500, 1000 km -> ~1100, 3000 km -> ~200
  const score = Math.round(2500 * Math.exp(-distanceKm / 1250));
  return Math.max(0, Math.min(2500, score));
}

/**
 * Calcule le score temporel (0 à 2 500 points) selon l'écart d'années
 */
export function calculateTemporalScore(guessedOrDelta: number, actualYear?: number): number {
  const absDelta =
    actualYear !== undefined
      ? Math.abs(guessedOrDelta - actualYear)
      : Math.abs(guessedOrDelta);
  if (absDelta === 0) return 2500;
  // Perte de 100 points par année d'écart (0 point au-delà de 25 ans d'écart)
  const score = Math.round(2500 * Math.max(0, 1 - absDelta / 25));
  return Math.max(0, Math.min(2500, score));
}

/**
 * Sélectionne 5 archives aléatoires pour une session complète
 */
export function getRandomTimeGuessrSession(count = 5): HistoricalArchiveItem[] {
  const shuffled = [...HISTORICAL_ARCHIVES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
