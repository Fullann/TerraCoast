// Base de données des stations de radio régionales & des paysages sonores
// Conçue pour Radio Globe & Ambiances du Monde sur TerraCoast

export type SoundscapeId =
  | "rainforest"
  | "alpine"
  | "ocean"
  | "desert"
  | "zen"
  | "cafe"
  | "savanna"
  | "monsoon";

export interface SoundscapeDefinition {
  id: SoundscapeId;
  name: string;
  icon: string;
  region: string;
  description: string;
  accentColor: string;
}

export interface RadioStation {
  id: string;
  name: string;
  countryName: string;
  iso3: string;
  flag: string;
  streamUrl: string;
  fallbackSoundscape: SoundscapeId;
  genre: string;
  description: string;
}

export const SOUNDSCAPES: Record<SoundscapeId, SoundscapeDefinition> = {
  rainforest: {
    id: "rainforest",
    name: "Pluie d'Amazonie & Forêt Équatoriale",
    icon: "🌧️",
    region: "Amérique du Sud & Afrique Centrale",
    description: "Pluie continue sur la canopée, murmures de feuillage et gouttes d'eau régulières.",
    accentColor: "from-emerald-900 to-teal-950",
  },
  alpine: {
    id: "alpine",
    name: "Brise Alpine & Cloches Pastorales",
    icon: "🏔️",
    region: "Europe Centrale & Montagnes",
    description: "Vent frais des sommets et tintement lointain de cloches en bronze d'alpage.",
    accentColor: "from-sky-900 to-slate-950",
  },
  ocean: {
    id: "ocean",
    name: "Ressac Océanique & Vagues de Côte",
    icon: "🌊",
    region: "Îles & Littoraux Mondiaux",
    description: "Roulement puissant et apaisant des vagues sur les galets et le sable fin.",
    accentColor: "from-blue-900 to-cyan-950",
  },
  desert: {
    id: "desert",
    name: "Nuit du Sahara & Feu de Camp",
    icon: "🏕️",
    region: "Afrique du Nord & Moyen-Orient",
    description: "Souffle doux du vent tiède sur les dunes et crépitements de braises sous les étoiles.",
    accentColor: "from-amber-900 to-orange-950",
  },
  zen: {
    id: "zen",
    name: "Jardin Zen & Carillons de Bambou",
    icon: "🎋",
    region: "Asie de l'Est",
    description: "Harmonies pentatoniques apaisantes, eau s'écoulant et résonance de bambou.",
    accentColor: "from-emerald-950 to-stone-900",
  },
  cafe: {
    id: "cafe",
    name: "Piazzetta & Terrasse de Café",
    icon: "☕",
    region: "Bassin Méditerranéen & Europe",
    description: "Murmures lointains de marché, tintements discrets de tasses et brise d'été.",
    accentColor: "from-rose-950 to-slate-900",
  },
  savanna: {
    id: "savanna",
    name: "Vent du Sahel & Savane Dorée",
    icon: "🌾",
    region: "Afrique de l'Ouest & Grands Lacs",
    description: "Chaleur de fin de journée, souffle d'harmattan et résonance de kora africaine.",
    accentColor: "from-yellow-950 to-amber-900",
  },
  monsoon: {
    id: "monsoon",
    name: "Mousson Tropicale & Rivière",
    icon: "⛈️",
    region: "Asie du Sud & Océan Indien",
    description: "Averse chaude torrentielle et chant régulier de la rivière tropicale.",
    accentColor: "from-indigo-950 to-cyan-950",
  },
};

/**
 * Catalogue de flux radios publics vérifiés avec fallback automatique
 */
export const CURATED_RADIO_STATIONS: RadioStation[] = [
  {
    id: "brazil-samba",
    name: "Bossa Nova & Samba Brasil",
    countryName: "Brésil",
    iso3: "BRA",
    flag: "🇧🇷",
    streamUrl: "https://ice6.somafm.com/bossa-128-mp3",
    fallbackSoundscape: "rainforest",
    genre: "Bossa Nova / MPB",
    description: "Vibrations chaleureuses de Rio de Janeiro, guitare acoustique et rythmes de bossa.",
  },
  {
    id: "senegal-dakar",
    name: "Dakar Mbalax & Afrobeat",
    countryName: "Sénégal",
    iso3: "SEN",
    flag: "🇸🇳",
    streamUrl: "https://icecast.radiofrance.fr/fipworld-midfi.mp3",
    fallbackSoundscape: "savanna",
    genre: "Mbalax / Afro-Fusion",
    description: "Rythmes entraînants d'Afrique de l'Ouest, percussions sénégalaises et musiques métissées.",
  },
  {
    id: "switzerland-swiss-pop",
    name: "Radio Swiss Classic & Acoustique",
    countryName: "Suisse",
    iso3: "CHE",
    flag: "🇨🇭",
    streamUrl: "https://icecast.radiofrance.fr/francemusique-midfi.mp3",
    fallbackSoundscape: "alpine",
    genre: "Classique & Acoustique",
    description: "Élégance alpine, chefs-d'œuvre orchestraux et sérénité des sommets.",
  },
  {
    id: "iceland-nordic",
    name: "Reykjavik Waves & Nordic Ambient",
    countryName: "Islande",
    iso3: "ISL",
    flag: "🇮🇸",
    streamUrl: "https://icecast.err.ee/klassikaraadio.mp3",
    fallbackSoundscape: "alpine",
    genre: "Nordic Ambient / Post-Rock",
    description: "Atmosphères volcaniques et boréales, voix éthérées et mélodies d'Islande.",
  },
  {
    id: "japan-tokyo",
    name: "Tokyo Lo-Fi & Ambient Groove",
    countryName: "Japon",
    iso3: "JPN",
    flag: "🇯🇵",
    streamUrl: "https://ice6.somafm.com/groovesalad-128-mp3",
    fallbackSoundscape: "zen",
    genre: "Lo-Fi / Shamisen Chill",
    description: "Détente urbaine de Shinjuku et carillons traditionnels sous les cerisiers en fleurs.",
  },
  {
    id: "france-paris",
    name: "Paris Jazz & Chanson FIP",
    countryName: "France",
    iso3: "FRA",
    flag: "🇫🇷",
    streamUrl: "https://icecast.radiofrance.fr/fip-midfi.mp3",
    fallbackSoundscape: "cafe",
    genre: "Jazz & Éclectisme",
    description: "L'esprit des cafés parisiens et sélection musicale raffinée de Radio France.",
  },
  {
    id: "morocco-medina",
    name: "Radio Medina & Chaâbi",
    countryName: "Maroc",
    iso3: "MAR",
    flag: "🇲🇦",
    streamUrl: "https://radiostreaming.ert.gr/ert-kosmos",
    fallbackSoundscape: "desert",
    genre: "Andalou / Chaâbi",
    description: "Mélodies envoûtantes des souks de Marrakech et cordes du patrimoine méditerranéen.",
  },
  {
    id: "italy-roma",
    name: "Radio Italia & Canzoniere",
    countryName: "Italie",
    iso3: "ITA",
    flag: "🇮🇹",
    streamUrl: "https://icecast.radiofrance.fr/francemusique-midfi.mp3",
    fallbackSoundscape: "cafe",
    genre: "Classiques Italiens",
    description: "Dolce Vita, mandoline napolitaine et grands classiques du bel canto.",
  },
  {
    id: "usa-jazz",
    name: "New York Classic Roots & Jazz",
    countryName: "États-Unis",
    iso3: "USA",
    flag: "🇺🇸",
    streamUrl: "https://ice6.somafm.com/bootliquor-128-mp3",
    fallbackSoundscape: "ocean",
    genre: "Americana / Soul / Jazz",
    description: "L'énergie intemporelle des routes américaines, cuivres feutrés et guitare de nuit.",
  },
  {
    id: "india-delhi",
    name: "Delhi Sitar & Asian Beats",
    countryName: "Inde",
    iso3: "IND",
    flag: "🇮🇳",
    streamUrl: "https://ice6.somafm.com/suburbsofgoa-128-mp3",
    fallbackSoundscape: "monsoon",
    genre: "Raga / Asian Chill",
    description: "Spiritualité des rives du Gange, sitar méditatif et tabla envoûtante.",
  },
  {
    id: "australia-sydney",
    name: "Sydney Coast & Surf Retro",
    countryName: "Australie",
    iso3: "AUS",
    flag: "🇦🇺",
    streamUrl: "https://ice6.somafm.com/secretagent-128-mp3",
    fallbackSoundscape: "ocean",
    genre: "Surf Rock / Acoustic",
    description: "Vagues de Bondi Beach et grands espaces sauvages de l'océan Pacifique.",
  },
  {
    id: "greece-athens",
    name: "Athens Aegean Bouzouki",
    countryName: "Grèce",
    iso3: "GRC",
    flag: "🇬🇷",
    streamUrl: "https://radiostreaming.ert.gr/ert-kosmos",
    fallbackSoundscape: "ocean",
    genre: "Méditerranéen / Bouzouki",
    description: "Lumière des îles cycladiques, brise marine et cordes traditionnelles d'Athènes.",
  },
  {
    id: "uk-london",
    name: "Classic FM London",
    countryName: "Royaume-Uni",
    iso3: "GBR",
    flag: "🇬🇧",
    streamUrl: "https://media-ice.musicradio.com/ClassicFMMP3",
    fallbackSoundscape: "ocean",
    genre: "Symphonique & Classique",
    description: "Grands chefs-d'œuvre orchestraux et musique symphonique britannique de renommée mondiale.",
  },
];

/**
 * Mapping des codes ISO3 vers leur soundscape ou station idéale
 */
export const ISO3_TO_PREFERENCES: Record<
  string,
  { stationId?: string; soundscapeId: SoundscapeId }
> = {
  // Amériques
  BRA: { stationId: "brazil-samba", soundscapeId: "rainforest" },
  COL: { stationId: "brazil-samba", soundscapeId: "rainforest" },
  PER: { stationId: "brazil-samba", soundscapeId: "alpine" },
  ARG: { stationId: "brazil-samba", soundscapeId: "cafe" },
  USA: { stationId: "usa-jazz", soundscapeId: "ocean" },
  CAN: { stationId: "usa-jazz", soundscapeId: "alpine" },
  MEX: { stationId: "brazil-samba", soundscapeId: "desert" },

  // Europe
  CHE: { stationId: "switzerland-swiss-pop", soundscapeId: "alpine" },
  FRA: { stationId: "france-paris", soundscapeId: "cafe" },
  ITA: { stationId: "italy-roma", soundscapeId: "cafe" },
  ISL: { stationId: "iceland-nordic", soundscapeId: "alpine" },
  NOR: { stationId: "iceland-nordic", soundscapeId: "alpine" },
  SWE: { stationId: "iceland-nordic", soundscapeId: "alpine" },
  FIN: { stationId: "iceland-nordic", soundscapeId: "alpine" },
  DEU: { stationId: "switzerland-swiss-pop", soundscapeId: "cafe" },
  GBR: { stationId: "france-paris", soundscapeId: "ocean" },
  ESP: { stationId: "france-paris", soundscapeId: "cafe" },
  PRT: { stationId: "france-paris", soundscapeId: "ocean" },
  GRC: { stationId: "greece-athens", soundscapeId: "ocean" },
  AUT: { stationId: "switzerland-swiss-pop", soundscapeId: "alpine" },

  // Afrique
  SEN: { stationId: "senegal-dakar", soundscapeId: "savanna" },
  MAR: { stationId: "morocco-medina", soundscapeId: "desert" },
  DZA: { stationId: "morocco-medina", soundscapeId: "desert" },
  TUN: { stationId: "morocco-medina", soundscapeId: "desert" },
  EGY: { stationId: "morocco-medina", soundscapeId: "desert" },
  KEN: { stationId: "senegal-dakar", soundscapeId: "savanna" },
  ZAF: { stationId: "senegal-dakar", soundscapeId: "ocean" },
  CIV: { stationId: "senegal-dakar", soundscapeId: "rainforest" },

  // Asie & Océanie
  JPN: { stationId: "japan-tokyo", soundscapeId: "zen" },
  KOR: { stationId: "japan-tokyo", soundscapeId: "zen" },
  CHN: { stationId: "japan-tokyo", soundscapeId: "zen" },
  IND: { stationId: "india-delhi", soundscapeId: "monsoon" },
  IDN: { stationId: "india-delhi", soundscapeId: "rainforest" },
  THA: { stationId: "india-delhi", soundscapeId: "monsoon" },
  VNM: { stationId: "india-delhi", soundscapeId: "monsoon" },
  AUS: { stationId: "australia-sydney", soundscapeId: "ocean" },
  NZL: { stationId: "australia-sydney", soundscapeId: "ocean" },
};

/**
 * Retrouve la station ou ambiance recommandée pour un pays donné
 */
export function getRecommendedAudioForCountry(iso3: string | null | undefined): {
  station: RadioStation;
  soundscape: SoundscapeDefinition;
} {
  const safeIso = (iso3 || "").toUpperCase().trim();
  const pref = ISO3_TO_PREFERENCES[safeIso];

  let station: RadioStation = CURATED_RADIO_STATIONS[0]; // défaut: Brésil
  let soundscape: SoundscapeDefinition = SOUNDSCAPES.rainforest;

  if (pref) {
    if (pref.stationId) {
      const foundStation = CURATED_RADIO_STATIONS.find((s) => s.id === pref.stationId);
      if (foundStation) station = foundStation;
    }
    soundscape = SOUNDSCAPES[pref.soundscapeId] || SOUNDSCAPES.rainforest;
  } else {
    // Si pas de mapping exact, chercher si le pays a une station directe
    const directStation = CURATED_RADIO_STATIONS.find((s) => s.iso3 === safeIso);
    if (directStation) {
      station = directStation;
      soundscape = SOUNDSCAPES[directStation.fallbackSoundscape] || SOUNDSCAPES.rainforest;
    }
  }

  return { station, soundscape };
}
