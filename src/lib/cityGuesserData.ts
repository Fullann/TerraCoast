/**
 * 🛰️ City Guesser / Satellite Zoom-In
 * Données des métropoles mondiales vues du ciel et moteur de zoom orbital progressif.
 */


export interface MetropolisLocation {
  id: string;
  name: string;
  country: string;
  flagEmoji: string;
  continent: string;
  lat: number;
  lng: number;
  highOrbitUrl: string; // Vue haute altitude orbitale (~15 000 km)
  mediumOrbitUrl: string; // Vue moyenne altitude (~1 000 km)
  lowOrbitUrl: string; // Vue basse altitude / gros plan urbain (~20 km)
  landmarkFact: string;
  distractors: string[]; // 3 autres métropoles plausibles pour le QCM
}

export interface CityGuesserRoundResult {
  roundNumber: number;
  city: MetropolisLocation;
  buzzedAtAltitudeKm: number;
  timeRemainingSec: number;
  score: number; // 0 à 5 000
  isCorrect: boolean;
  selectedCity: string;
}

export const METROPOLISES_DATABASE: MetropolisLocation[] = [
  {
    id: "venice",
    name: "Venise",
    country: "Italie",
    flagEmoji: "🇮🇹",
    continent: "Europe",
    lat: 45.4408,
    lng: 12.3155,
    highOrbitUrl:
      "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=1600&q=80",
    mediumOrbitUrl:
      "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1600&q=80",
    lowOrbitUrl:
      "https://images.unsplash.com/photo-1498307833015-e7b400441eb8?auto=format&fit=crop&w=1600&q=80",
    landmarkFact:
      "Vue d'en haut, Venise ressemble à un grand poisson traversé par la forme sinueuse en 'S' du Grand Canal au milieu de sa lagune.",
    distractors: ["Amsterdam", "Stockholm", "Saint-Pétersbourg"],
  },
  {
    id: "dubai",
    name: "Dubaï",
    country: "Émirats Arabes Unis",
    flagEmoji: "🇦🇪",
    continent: "Moyen-Orient",
    lat: 25.2048,
    lng: 55.2708,
    highOrbitUrl:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80",
    mediumOrbitUrl:
      "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1600&q=80",
    lowOrbitUrl:
      "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1600&q=80",
    landmarkFact:
      "Les archipels artificiels de Palm Jumeirah et 'The World' sont parmi les rares structures humaines visibles à l'œil nu depuis la Station Spatiale Internationale.",
    distractors: ["Doha", "Abu Dhabi", "Koweït"],
  },
  {
    id: "new-york",
    name: "New York",
    country: "États-Unis",
    flagEmoji: "🇺🇸",
    continent: "Amériques",
    lat: 40.7128,
    lng: -74.006,
    highOrbitUrl:
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1600&q=80",
    mediumOrbitUrl:
      "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=1600&q=80",
    lowOrbitUrl:
      "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=1600&q=80",
    landmarkFact:
      "Manhattan se distingue nettement par son quadrillage dense encadré par l'Hudson et l'East River, avec le grand rectangle vert de Central Park en son centre.",
    distractors: ["Chicago", "Boston", "Toronto"],
  },
  {
    id: "paris",
    name: "Paris",
    country: "France",
    flagEmoji: "🇫🇷",
    continent: "Europe",
    lat: 48.8566,
    lng: 2.3522,
    highOrbitUrl:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=80",
    mediumOrbitUrl:
      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1600&q=80",
    lowOrbitUrl:
      "https://images.unsplash.com/photo-1509299349698-dd22323b5963?auto=format&fit=crop&w=1600&q=80",
    landmarkFact:
      "La Seine forme une grande boucle caractéristique entourant l'Île de la Cité, avec l'Étoile haussmannienne dont rayonnent 12 grandes avenues rectilignes.",
    distractors: ["Londres", "Bruxelles", "Vienne"],
  },
  {
    id: "tokyo",
    name: "Tokyo",
    country: "Japon",
    flagEmoji: "🇯🇵",
    continent: "Asie",
    lat: 35.6762,
    lng: 139.6503,
    highOrbitUrl:
      "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1600&q=80",
    mediumOrbitUrl:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1600&q=80",
    lowOrbitUrl:
      "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=1600&q=80",
    landmarkFact:
      "Plus grande aire métropolitaine du monde avec 38 millions d'habitants, Tokyo s'étend le long de sa baie avec les îles artificielles d'Odaiba et le mont Fuji à l'ouest.",
    distractors: ["Séoul", "Osaka", "Shanghai"],
  },
  {
    id: "rio-de-janeiro",
    name: "Rio de Janeiro",
    country: "Brésil",
    flagEmoji: "🇧🇷",
    continent: "Amériques",
    lat: -22.9068,
    lng: -43.1729,
    highOrbitUrl:
      "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1600&q=80",
    mediumOrbitUrl:
      "https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?auto=format&fit=crop&w=1600&q=80",
    lowOrbitUrl:
      "https://images.unsplash.com/photo-1544989164-31dc3c645987?auto=format&fit=crop&w=1600&q=80",
    landmarkFact:
      "La baie de Guanabara est ponctuée de pains de sucre granitiques spectaculaires émergeant de la forêt tropicale et des plages en croissant de Copacabana.",
    distractors: ["Buenos Aires", "São Paulo", "Lima"],
  },
  {
    id: "cairo",
    name: "Le Caire",
    country: "Égypte",
    flagEmoji: "🇪🇬",
    continent: "Afrique",
    lat: 30.0444,
    lng: 31.2357,
    highOrbitUrl:
      "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=1600&q=80",
    mediumOrbitUrl:
      "https://images.unsplash.com/photo-1568322445389-f64ac2515020?auto=format&fit=crop&w=1600&q=80",
    lowOrbitUrl:
      "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=1600&q=80",
    landmarkFact:
      "Le contraste spatial est saisissant : le ruban vert et fertile du Nil tranche brutalement avec l'immensité ocre du désert où se dressent les pyramides de Gizeh.",
    distractors: ["Alexandrie", "Casablanca", "Tunis"],
  },
  {
    id: "san-francisco",
    name: "San Francisco",
    country: "États-Unis",
    flagEmoji: "🇺🇸",
    continent: "Amériques",
    lat: 37.7749,
    lng: -122.4194,
    highOrbitUrl:
      "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1600&q=80",
    mediumOrbitUrl:
      "https://images.unsplash.com/photo-1449034446853-66c86144b0ad?auto=format&fit=crop&w=1600&q=80",
    lowOrbitUrl:
      "https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?auto=format&fit=crop&w=1600&q=80",
    landmarkFact:
      "La péninsule de San Francisco sépare l'océan Pacifique de sa baie intérieure, enjambée par les ponts mythiques du Golden Gate et du Bay Bridge.",
    distractors: ["Seattle", "San Diego", "Vancouver"],
  },
  {
    id: "sydney",
    name: "Sydney",
    country: "Australie",
    flagEmoji: "🇦🇺",
    continent: "Océanie",
    lat: -33.8688,
    lng: 151.2093,
    highOrbitUrl:
      "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1600&q=80",
    mediumOrbitUrl:
      "https://images.unsplash.com/photo-1523428096881-5cb799442992?auto=format&fit=crop&w=1600&q=80",
    lowOrbitUrl:
      "https://images.unsplash.com/photo-1528072164453-f4e8ef0d475a?auto=format&fit=crop&w=1600&q=80",
    landmarkFact:
      "La baie de Port Jackson est l'un des ports naturels les plus découpés au monde, avec ses dizaines de criques, plages et le promontoire de l'Opéra.",
    distractors: ["Melbourne", "Auckland", "Brisbane"],
  },
  {
    id: "london",
    name: "Londres",
    country: "Royaume-Uni",
    flagEmoji: "🇬🇧",
    continent: "Europe",
    lat: 51.5074,
    lng: -0.1278,
    highOrbitUrl:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1600&q=80",
    mediumOrbitUrl:
      "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&w=1600&q=80",
    lowOrbitUrl:
      "https://images.unsplash.com/photo-1486299267070-83823f5448dd?auto=format&fit=crop&w=1600&q=80",
    landmarkFact:
      "Les méandres prononcés de la Tamise serpentent à travers la capitale, avec la boucle spectaculaire de l'Isle of Dogs et Canary Wharf.",
    distractors: ["Dublin", "Manchester", "Édimbourg"],
  },
  {
    id: "hong-kong",
    name: "Hong Kong",
    country: "Chine",
    flagEmoji: "🇭🇰",
    continent: "Asie",
    lat: 22.3193,
    lng: 114.1694,
    highOrbitUrl:
      "https://images.unsplash.com/photo-1506970845246-18f21d533b20?auto=format&fit=crop&w=1600&q=80",
    mediumOrbitUrl:
      "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?auto=format&fit=crop&w=1600&q=80",
    lowOrbitUrl:
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1600&q=80",
    landmarkFact:
      "Une densité verticale phénoménale coincée entre des collines verdoyantes abruptes et le détroit de Victoria Harbour.",
    distractors: ["Singapour", "Taipei", "Macao"],
  },
  {
    id: "singapore",
    name: "Singapour",
    country: "Singapour",
    flagEmoji: "🇸🇬",
    continent: "Asie",
    lat: 1.3521,
    lng: 103.8198,
    highOrbitUrl:
      "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1600&q=80",
    mediumOrbitUrl:
      "https://images.unsplash.com/photo-1506354666786-959d6d497f1a?auto=format&fit=crop&w=1600&q=80",
    lowOrbitUrl:
      "https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=1600&q=80",
    landmarkFact:
      "Cité-État insulaire au carrefour stratégique du détroit de Malacca, reconnaissable à Marina Bay et à ses centaines de navires cargos au mouillage.",
    distractors: ["Kuala Lumpur", "Jakarta", "Manille"],
  },
  {
    id: "amsterdam",
    name: "Amsterdam",
    country: "Pays-Bas",
    flagEmoji: "🇳🇱",
    continent: "Europe",
    lat: 52.3676,
    lng: 4.9041,
    highOrbitUrl:
      "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1600&q=80",
    mediumOrbitUrl:
      "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=1600&q=80",
    lowOrbitUrl:
      "https://images.unsplash.com/photo-1468436139062-f60a71c5c892?auto=format&fit=crop&w=1600&q=80",
    landmarkFact:
      "Vue du ciel, la 'Grachtengordel' forme un éventail géométrique parfait de quatre canaux concentriques en demi-lune datant du Siècle d'Or.",
    distractors: ["Copenhague", "Hambourg", "Bruges"],
  },
  {
    id: "istanbul",
    name: "Istanbul",
    country: "Turquie",
    flagEmoji: "🇹🇷",
    continent: "Europe / Asie",
    lat: 41.0082,
    lng: 28.9784,
    highOrbitUrl:
      "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1600&q=80",
    mediumOrbitUrl:
      "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=1600&q=80",
    lowOrbitUrl:
      "https://images.unsplash.com/photo-1527838832700-5059252407fa?auto=format&fit=crop&w=1600&q=80",
    landmarkFact:
      "Seule métropole au monde construite à cheval sur deux continents, scindée par les eaux bleu profond du détroit du Bosphore et la Corne d'Or.",
    distractors: ["Athènes", "Ankara", "Beyrouth"],
  },
  {
    id: "cape-town",
    name: "Le Cap",
    country: "Afrique du Sud",
    flagEmoji: "🇿🇦",
    continent: "Afrique",
    lat: -33.9249,
    lng: 18.4241,
    highOrbitUrl:
      "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=1600&q=80",
    mediumOrbitUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
    lowOrbitUrl:
      "https://images.unsplash.com/photo-1576485290814-1c72aa4bbb8e?auto=format&fit=crop&w=1600&q=80",
    landmarkFact:
      "La Table Mountain forme un immense plateau horizontal en grès dominant la ville et la baie de la Table entre deux océans.",
    distractors: ["Durban", "Johannesburg", "Luanda"],
  },
];

/**
 * Calcule le score selon l'altitude à laquelle le joueur a buzzé
 * Plus l'altitude est haute (buzz rapide), plus le score est élevé (5 000 pts max)
 */
export function calculateAltitudeScore(altitudeProgress: number): number {
  // altitudeProgress va de 1.0 (très haute altitude 30 000 km) à 0.0 (sol)
  const clamped = Math.max(0, Math.min(1, altitudeProgress));
  // Score de 500 pts minimum si bonne réponse au sol, jusqu'à 5 000 pts en très haute altitude
  return Math.round(500 + clamped * 4500);
}

/**
 * Tire une session aléatoire de 5 métropoles
 */
export function getRandomCityGuesserSession(count = 5): MetropolisLocation[] {
  const shuffled = [...METROPOLISES_DATABASE].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
