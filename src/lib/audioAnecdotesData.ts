// Base de données des capsules d'anecdotes culturelles & géographiques (10 secondes)
// Diffusées à chaque bonne réponse en quiz avec audio ducking

export interface AudioAnecdote {
  iso3: string;
  countryName: string;
  flag: string;
  text: string;
  durationSeconds: number; // estimée ~10s
}

export const CURATED_AUDIO_ANECDOTES: Record<string, AudioAnecdote> = {
  BRA: {
    iso3: "BRA",
    countryName: "Brésil",
    flag: "🇧🇷",
    text: "Le saviez-vous ? Le Brésil abrite la plus grande biodiversité au monde. L'Amazonie produit à elle seule un cinquième de toute l'eau douce déversée dans les océans de la Terre !",
    durationSeconds: 10,
  },
  SEN: {
    iso3: "SEN",
    countryName: "Sénégal",
    flag: "🇸🇳",
    text: "Le saviez-vous ? Le Sénégal abrite le mythique Lac Rose, dont la concentration exceptionnelle en sel et les micro-algues donnent une coloration magique unique au monde !",
    durationSeconds: 10,
  },
  CHE: {
    iso3: "CHE",
    countryName: "Suisse",
    flag: "🇨🇭",
    text: "Le saviez-vous ? La Suisse compte plus de mille cinq cents lacs. Aucun endroit du pays n'est situé à plus de seize kilomètres d'un plan d'eau ou d'une rivière !",
    durationSeconds: 9,
  },
  ISL: {
    iso3: "ISL",
    countryName: "Islande",
    flag: "🇮🇸",
    text: "Le saviez-vous ? En Islande, cent pour cent de l'électricité provient des énergies géothermiques et hydrauliques. Fait insolite : il n'y a aucun moustique sur l'île !",
    durationSeconds: 10,
  },
  JPN: {
    iso3: "JPN",
    countryName: "Japon",
    flag: "🇯🇵",
    text: "Le saviez-vous ? Le Japon est un archipel de plus de six mille huit cents îles. Tokyo possède le réseau ferroviaire le plus ponctuel et fréquenté de la planète !",
    durationSeconds: 10,
  },
  FRA: {
    iso3: "FRA",
    countryName: "France",
    flag: "🇫🇷",
    text: "Le saviez-vous ? Grâce à ses territoires d'outre-mer sur tous les océans, la France est le pays qui couvre le plus grand nombre de fuseaux horaires : douze au total !",
    durationSeconds: 9,
  },
  MAR: {
    iso3: "MAR",
    countryName: "Maroc",
    flag: "🇲🇦",
    text: "Le saviez-vous ? Fondée en l'an 859 à Fès par Fatima al-Fihriya, l'Université Al Quaraouiyine au Maroc est reconnue par l'UNESCO comme la plus ancienne en activité au monde !",
    durationSeconds: 10,
  },
  ITA: {
    iso3: "ITA",
    countryName: "Italie",
    flag: "🇮🇹",
    text: "Le saviez-vous ? L'Italie possède le plus grand nombre de sites classés au patrimoine mondial de l'UNESCO au monde, avec cinquante-neuf trésors culturels et naturels !",
    durationSeconds: 10,
  },
  USA: {
    iso3: "USA",
    countryName: "États-Unis",
    flag: "🇺🇸",
    text: "Le saviez-vous ? Le parc national de Yellowstone, créé en 1872 aux États-Unis, est le tout premier parc national de l'histoire de l'humanité !",
    durationSeconds: 9,
  },
  IND: {
    iso3: "IND",
    countryName: "Inde",
    flag: "🇮🇳",
    text: "Le saviez-vous ? L'Inde compte plus de deux mille groupes ethniques distincts et son réseau ferroviaire transporte chaque jour l'équivalent de la population de l'Australie !",
    durationSeconds: 10,
  },
  AUS: {
    iso3: "AUS",
    countryName: "Australie",
    flag: "🇦🇺",
    text: "Le saviez-vous ? La Grande Barrière de corail en Australie est la plus grande structure vivante de la Terre. Elle est même visible depuis l'espace !",
    durationSeconds: 9,
  },
  CAN: {
    iso3: "CAN",
    countryName: "Canada",
    flag: "🇨🇦",
    text: "Le saviez-vous ? Le Canada possède le plus long littoral au monde avec plus de deux cent mille kilomètres de côtes, et plus de la moitié des lacs naturels du globe !",
    durationSeconds: 10,
  },
  EGY: {
    iso3: "EGY",
    countryName: "Égypte",
    flag: "🇪🇬",
    text: "Le saviez-vous ? La Grande Pyramide de Gizeh est restée la plus haute construction humaine au monde pendant plus de trois mille huit cents ans !",
    durationSeconds: 9,
  },
  NOR: {
    iso3: "NOR",
    countryName: "Norvège",
    flag: "🇳🇴",
    text: "Le saviez-vous ? Les fjords majestueux de Norvège ont été sculptés par les glaciers lors des dernières ères glaciaires, atteignant plus de mille mètres de profondeur !",
    durationSeconds: 10,
  },
  GRC: {
    iso3: "GRC",
    countryName: "Grèce",
    flag: "🇬🇷",
    text: "Le saviez-vous ? La Grèce compte plus de six mille îles et îlots baignés par la Méditerranée, dont seulement deux cent vingt-sept sont habités !",
    durationSeconds: 9,
  },
};

/**
 * Récupère ou génère dynamiquement une capsule d'anecdote de 10s pour n'importe quel pays
 */
export function getAudioAnecdoteForCountry(
  iso3: string | null | undefined,
  fallbackName?: string,
  flag?: string
): AudioAnecdote {
  const safeIso = (iso3 || "").toUpperCase().trim();
  const curated = CURATED_AUDIO_ANECDOTES[safeIso];
  if (curated) return curated;

  const country = fallbackName || "ce territoire";
  const countryFlag = flag || "🌍";

  return {
    iso3: safeIso || "WLD",
    countryName: country,
    flag: countryFlag,
    text: `Bien joué ! Saviez-vous que ${country} possède une géographie et un patrimoine fascinants qui façonnent l'histoire de notre planète ? Continuez votre exploration !`,
    durationSeconds: 8,
  };
}
