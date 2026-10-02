import { useMemo } from "react";
import type { Language } from "../i18n/translations";
import {
  type TerraCard,
  type CardCategory,
  type CardRarity,
  type CardContinent,
  TERRA_CARDS_CATALOG,
} from "./cardsData";
import { useLanguage } from "../contexts/LanguageContext";

/**
 * 🌍 Service & API de Traduction pour le TerraDex (Cartes à collectionner)
 * Permet de traduire les cartes dans les 6 langues supportées par TerraCoast :
 * fr (Français - base), en (English), es (Español), de (Deutsch), it (Italiano), pt (Português).
 */

export interface CardTranslationEntry {
  name?: string;
  tagline?: string;
  description?: string;
  funFact?: string;
  quote?: string;
  stats?: Record<string, string | number>;
  trivia?: {
    question: string;
    options: string[];
    explanation: string;
  };
}

export type CardTranslationsDictionary = Partial<
  Record<Language, Record<string, CardTranslationEntry>>
>;

// ── TRADUCTIONS DES CATÉGORIES ──
export const CATEGORY_TRANSLATIONS: Record<Language, Record<CardCategory, string>> = {
  fr: {
    country: "Nations & Territoires",
    region: "Cantons & Régions",
    language: "Langues du Monde",
    figure: "Explorateurs & Figures",
    wonder: "Merveilles Naturelles",
  },
  en: {
    country: "Nations & Territories",
    region: "Cantons & Regions",
    language: "World Languages",
    figure: "Explorers & Figures",
    wonder: "Natural Wonders",
  },
  es: {
    country: "Naciones y Territorios",
    region: "Cantones y Regiones",
    language: "Idiomas del Mundo",
    figure: "Exploradores y Figuras",
    wonder: "Maravillas Naturales",
  },
  de: {
    country: "Nationen & Territorien",
    region: "Kantone & Regionen",
    language: "Sprachen der Welt",
    figure: "Entdecker & Persönlichkeiten",
    wonder: "Naturwunder",
  },
  it: {
    country: "Nazioni e Territori",
    region: "Cantoni e Regioni",
    language: "Lingue del Mondo",
    figure: "Esploratori e Figure",
    wonder: "Meraviglie Naturali",
  },
  pt: {
    country: "Nações e Territórios",
    region: "Cantões e Regiões",
    language: "Línguas do Mundo",
    figure: "Exploradores e Figuras",
    wonder: "Maravilhas Naturais",
  },
};

// ── TRADUCTIONS DES RARETÉS ──
export const RARITY_TRANSLATIONS: Record<Language, Record<CardRarity, string>> = {
  fr: {
    common: "Commune",
    rare: "Rare",
    epic: "Épique",
    legendary: "Légendaire",
    mythic: "Mythique",
  },
  en: {
    common: "Common",
    rare: "Rare",
    epic: "Epic",
    legendary: "Legendary",
    mythic: "Mythic",
  },
  es: {
    common: "Común",
    rare: "Rara",
    epic: "Épica",
    legendary: "Legendaria",
    mythic: "Mítica",
  },
  de: {
    common: "Gewöhnlich",
    rare: "Selten",
    epic: "Episch",
    legendary: "Legendär",
    mythic: "Mythisch",
  },
  it: {
    common: "Comune",
    rare: "Rara",
    epic: "Epica",
    legendary: "Leggendaria",
    mythic: "Mitica",
  },
  pt: {
    common: "Comum",
    rare: "Rara",
    epic: "Épica",
    legendary: "Lendária",
    mythic: "Mítica",
  },
};

// ── TRADUCTIONS DES CONTINENTS ──
export const CONTINENT_TRANSLATIONS: Record<Language, Record<CardContinent, string>> = {
  fr: {
    Europe: "Europe",
    Asie: "Asie",
    Afrique: "Afrique",
    Amériques: "Amériques",
    Océanie: "Océanie",
    Monde: "Monde",
  },
  en: {
    Europe: "Europe",
    Asie: "Asia",
    Afrique: "Africa",
    Amériques: "Americas",
    Océanie: "Oceania",
    Monde: "World",
  },
  es: {
    Europe: "Europa",
    Asie: "Asia",
    Afrique: "África",
    Amériques: "Américas",
    Océanie: "Oceanía",
    Monde: "Mundo",
  },
  de: {
    Europe: "Europa",
    Asie: "Asien",
    Afrique: "Afrika",
    Amériques: "Amerika",
    Océanie: "Ozeanien",
    Monde: "Welt",
  },
  it: {
    Europe: "Europa",
    Asie: "Asia",
    Afrique: "Africa",
    Amériques: "Americhe",
    Océanie: "Oceania",
    Monde: "Mondo",
  },
  pt: {
    Europe: "Europa",
    Asie: "Ásia",
    Afrique: "África",
    Amériques: "Américas",
    Océanie: "Oceania",
    Monde: "Mundo",
  },
};

// ── TRADUCTIONS DES CLÉS STATISTIQUES STATS ──
export const STAT_KEY_TRANSLATIONS: Record<Language, Record<string, string>> = {
  fr: {
    Capitale: "Capitale",
    Population: "Population",
    Superficie: "Superficie",
    Point_Culminant: "Point Culminant",
    Fuseaux_Horaires: "Fuseaux Horaires",
    Langues_Officielles: "Langues Officielles",
    Langue_Maternelle: "Langue Maternelle",
    Locuteurs: "Locuteurs",
    Famille: "Famille",
    Écriture: "Écriture",
    Cantons: "Cantons",
    Pays: "Pays",
     Altitude: "Altitude",
    Profondeur: "Profondeur",
    Lacs: "Lacs",
    Capitale_Fédérale: "Capitale Fédérale",
    Sommet_Emblématique: "Sommet Emblématique",
  },
  en: {
    Capitale: "Capital",
    Population: "Population",
    Superficie: "Area",
    Point_Culminant: "Highest Peak",
    Fuseaux_Horaires: "Time Zones",
    Langues_Officielles: "Official Languages",
    Langue_Maternelle: "Native Language",
    Locuteurs: "Speakers",
    Famille: "Family",
    Écriture: "Writing System",
    Cantons: "Cantons",
    Pays: "Country",
    Découverte: "Discovery",
    Expéditions: "Expeditions",
    Record: "Record",
    Altitude: "Elevation",
    Profondeur: "Depth",
    Lacs: "Lakes",
    Capitale_Fédérale: "Federal Capital",
    Sommet_Emblématique: "Iconic Peak",
  },
  es: {
    Capitale: "Capital",
    Population: "Población",
    Superficie: "Superficie",
    Point_Culminant: "Punto Más Alto",
    Fuseaux_Horaires: "Husos Horarios",
    Langues_Officielles: "Idiomas Oficiales",
    Langue_Maternelle: "Lengua Materna",
    Locuteurs: "Hablantes",
    Famille: "Familia",
    Écriture: "Escritura",
    Cantons: "Cantones",
    Pays: "País",
    Découverte: "Descubrimiento",
    Expéditions: "Expediciones",
    Record: "Récord",
    Altitude: "Altitud",
    Profondeur: "Profundidad",
    Lacs: "Lagos",
    Capitale_Fédérale: "Capital Federal",
    Sommet_Emblématique: "Cumbre Emblemática",
  },
  de: {
    Capitale: "Hauptstadt",
    Population: "Bevölkerung",
    Superficie: "Fläche",
    Point_Culminant: "Höchster Punkt",
    Fuseaux_Horaires: "Zeitzonen",
    Langues_Officielles: "Amtssprachen",
    Langue_Maternelle: "Muttersprache",
    Locuteurs: "Sprecher",
    Famille: "Sprachfamilie",
    Écriture: "Schriftsystem",
    Cantons: "Kantone",
    Pays: "Land",
    Découverte: "Entdeckung",
    Expéditions: "Expeditionen",
    Record: "Rekord",
    Altitude: "Höhe",
    Profondeur: "Tiefe",
    Lacs: "Seen",
    Capitale_Fédérale: "Bundesstadt",
    Sommet_Emblématique: "Wahrzeichen-Gipfel",
  },
  it: {
    Capitale: "Capitale",
    Population: "Popolazione",
    Superficie: "Superficie",
    Point_Culminant: "Punto Più Alto",
    Fuseaux_Horaires: "Fusi Orari",
    Langues_Officielles: "Lingue Ufficiali",
    Langue_Maternelle: "Lingua Madre",
    Locuteurs: "Parlanti",
    Famille: "Famiglia",
    Écriture: "Scrittura",
    Cantons: "Cantoni",
    Pays: "Paese",
    Découverte: "Scoperta",
    Expéditions: "Spedizioni",
    Record: "Record",
    Altitude: "Altitudine",
    Profondeur: "Profundità",
    Lacs: "Laghi",
    Capitale_Fédérale: "Capitale Federale",
    Sommet_Emblématique: "Vetta Emblematica",
  },
  pt: {
    Capitale: "Capital",
    Population: "População",
    Superficie: "Área",
    Point_Culminant: "Ponto Mais Alto",
    Fuseaux_Horaires: "Fusos Horários",
    Langues_Officielles: "Línguas Oficiais",
    Langue_Maternelle: "Língua Materna",
    Locuteurs: "Falantes",
    Famille: "Família",
    Écriture: "Escrita",
    Cantons: "Cantões",
    Pays: "País",
    Découverte: "Descoberta",
    Expéditions: "Expedições",
    Record: "Recorde",
    Altitude: "Altitude",
    Profondeur: "Profundidade",
    Lacs: "Lagos",
    Capitale_Fédérale: "Capital Federal",
    Sommet_Emblématique: "Pico Emblemático",
  },
};

// ── DICTIONNAIRE MULTILINGUE PRÉ-COMPILÉ POUR LES CARTES ──
export const PREBUILT_CARD_TRANSLATIONS: CardTranslationsDictionary = {
  en: {
    card_country_fr: {
      name: "France",
      tagline: "The Hexagon of Enlightenment",
      description: "Most visited country in the world, renowned for its cultural heritage, gastronomy, and geographic diversity spanning 12 time zones thanks to its overseas territories.",
      funFact: "Thanks to its overseas departments and territories across the globe, France spans more time zones than any other country in the world!",
      quote: "Liberty, Equality, Fraternity",
      stats: {
        Capitale: "Paris",
        Population: "68 million",
        Superficie: "551,695 km²",
        Point_Culminant: "Mont Blanc (4,809 m)",
        Fuseaux_Horaires: "12 (world record)",
      },
      trivia: {
        question: "Which country holds the world record for the most time zones?",
        options: ["Russia", "France", "United States", "United Kingdom"],
        explanation: "With its overseas territories, France spans 12 different time zones, ahead of the US and Russia (11 each).",
      },
    },
    card_country_ch: {
      name: "Switzerland",
      tagline: "Land of Helvetians & Alpine Peaks",
      description: "Alpine confederation famous for neutrality, mountains, four official languages, and exceptional quality of life.",
      funFact: "Switzerland has over 1,500 lakes, and you are never more than 16 kilometers away from a body of water anywhere in the country!",
      quote: "One for all, all for one",
      stats: {
        Capitale: "Bern (Federal City)",
        Population: "8.9 million",
        Superficie: "41,285 km²",
        Cantons: "26 cantons",
        Langues_Officielles: "German, French, Italian, Romansh",
      },
      trivia: {
        question: "How many official languages does Switzerland have?",
        options: ["2", "3", "4", "5"],
        explanation: "Switzerland has 4 national languages: German, French, Italian, and Romansh.",
      },
    },
    card_country_jp: {
      name: "Japan",
      tagline: "Archipelago of the Rising Sun",
      description: "Volcanic archipelago blending millennia-old traditions with cutting-edge technology.",
      funFact: "Japan is made up of 6,852 islands, but four main islands account for 97% of the total land area!",
      quote: "Fall seven times, stand up eight",
      stats: {
        Capitale: "Tokyo",
        Population: "125 million",
        Point_Culminant: "Mount Fuji (3,776 m)",
        Iles: "6,852 islands",
      },
      trivia: {
        question: "What is the highest mountain in Japan?",
        options: ["Mount Fuji", "Mount Kita", "Mount Hotaka", "Mount Aso"],
        explanation: "Mount Fuji is an iconic sacred volcano rising to 3,776 meters.",
      },
    },
    card_country_br: {
      name: "Brazil",
      tagline: "Giant of the Amazon and Samba",
      description: "Largest country in South America, home to 60% of the Amazon rainforest and the greatest biodiversity on Earth.",
      funFact: "Brazil has a border with every South American country except Chile and Ecuador!",
      quote: "Order and Progress",
      stats: {
        Capitale: "Brasília",
        Population: "215 million",
        Superficie: "8,515,767 km²",
      },
      trivia: {
        question: "What is the capital city of Brazil?",
        options: ["Rio de Janeiro", "São Paulo", "Brasília", "Salvador"],
        explanation: "Brasília has been the planned federal capital since 1960.",
      },
    },
    card_region_gr: {
      name: "Grisons",
      tagline: "The Trilingual Alpine Fortress",
      description: "The largest Swiss canton by area, famous for the Engadine, the Rhine source, and being Switzerland's only trilingual canton.",
      funFact: "The Grisons is the only canton in Switzerland with three official languages: German, Romansh, and Italian!",
      quote: "Libertad e Fradellanza",
    },
    card_wonder_everest: {
      name: "Mount Everest",
      tagline: "Roof of the World (Chomolungma)",
      description: "The highest mountain on Earth above sea level, located in the Mahalangur Himal sub-range of the Himalayas.",
      funFact: "Everest grows about 4 millimeters taller each year due to continental plate collision!",
      quote: "Because it's there — George Mallory",
    },
    card_figure_magellan: {
      name: "Ferdinand Magellan",
      tagline: "Pioneer of Global Circumnavigation",
      description: "Portuguese navigator who led the 1519 Spanish expedition that achieved the first circumnavigation of the globe.",
      funFact: "Magellan named the Pacific Ocean 'Mar Pacífico' because of its tranquil waters when he entered it.",
    },
    card_lang_esperanto: {
      name: "Esperanto",
      tagline: "The Universal Bridge Language",
      description: "The most widely spoken constructed international auxiliary language, created by L. L. Zamenhof in 1887.",
      funFact: "Esperanto is recognized as a spoken language by UNESCO and has around 2,000 native speakers!",
    },
  },
  es: {
    card_country_fr: {
      name: "Francia",
      tagline: "El Hexágono de la Ilustración",
      description: "El país más visitado del mundo, famoso por su patrimonio cultural, gastronomía y diversidad geográfica que abarca 12 husos horarios.",
      funFact: "¡Gracias a sus territorios de ultramar, Francia es el país con más husos horarios del mundo!",
      quote: "Libertad, Igualdad, Fraternidad",
      stats: {
        Capitale: "París",
        Population: "68 millones",
        Superficie: "551.695 km²",
        Point_Culminant: "Mont Blanc (4.809 m)",
        Fuseaux_Horaires: "12 (récord mundial)",
      },
      trivia: {
        question: "¿Qué país tiene el récord mundial de más husos horarios?",
        options: ["Rusia", "Francia", "Estados Unidos", "Reino Unido"],
        explanation: "Con sus territorios de ultramar, Francia cubre 12 husos horarios.",
      },
    },
    card_country_ch: {
      name: "Suiza",
      tagline: "Tierra de Helvecios y Cumbres Alpinas",
      description: "Confederación alpina célebre por su neutralidad, 4 idiomas oficiales y alta calidad de vida.",
      funFact: "¡Suiza tiene más de 1.500 lagos y nunca estás a más de 16 km de un lago en cualquier punto del país!",
      quote: "Uno para todos, todos para uno",
      stats: {
        Capitale: "Berna (Ciudad Federal)",
        Population: "8,9 millones",
        Superficie: "41.285 km²",
        Cantons: "26 cantones",
        Langues_Officielles: "Alemán, Francés, Italiano, Romanche",
      },
      trivia: {
        question: "¿Cuántos idiomas oficiales tiene Suiza?",
        options: ["2", "3", "4", "5"],
        explanation: "Suiza tiene 4 idiomas oficiales: alemán, francés, italiano y romanche.",
      },
    },
    card_country_jp: {
      name: "Japón",
      tagline: "Archipiélago del Sol Naciente",
      description: "Archipiélago volcánico que fusiona tradiciones milenarias y tecnología puntera.",
      funFact: "¡Japón está formado por 6.852 islas!",
      quote: "Siete veces caer, ocho levantarse",
      stats: {
        Capitale: "Tokio",
        Population: "125 millones",
        Point_Culminant: "Monte Fuji (3.776 m)",
      },
    },
    card_wonder_everest: {
      name: "Monte Everest",
      tagline: "El Techo del Mundo (Chomolungma)",
      description: "La montaña más alta de la Tierra sobre el nivel del mar, en el Himalaya.",
      funFact: "¡El Everest crece unos 4 milímetros al año debido a la colisión tectónica!",
    },
  },
  de: {
    card_country_fr: {
      name: "Frankreich",
      tagline: "Das Hexagon der Aufklärung",
      description: "Das meistbesuchte Land der Welt, berühmt für Kultur, Gastronomie und 12 Zeitzonen dank seiner Überseegebiete.",
      funFact: "Frankreich besitzt dank seiner Überseegebiete die meisten Zeitzonen der Welt (12)!",
      quote: "Freiheit, Gleichheit, Brüderlichkeit",
      stats: {
        Capitale: "Paris",
        Population: "68 Millionen",
        Superficie: "551.695 km²",
        Point_Culminant: "Mont Blanc (4.809 m)",
        Fuseaux_Horaires: "12 (Weltrekord)",
      },
      trivia: {
        question: "Welches Land hat die meisten Zeitzonen der Welt?",
        options: ["Russland", "Frankreich", "USA", "Großbritannien"],
        explanation: "Mit seinen Überseegebieten erstreckt sich Frankreich über 12 Zeitzonen.",
      },
    },
    card_country_ch: {
      name: "Schweiz",
      tagline: "Land der Helvetier und Alpengipfel",
      description: "Alpine Eidgenossenschaft, bekannt für Neutralität, Berge, vier Landessprachen und Lebensqualität.",
      funFact: "Die Schweiz hat über 1.500 Seen; man ist nie weiter als 16 km von einem See entfernt!",
      quote: "Einer für alle, alle für einen",
      stats: {
        Capitale: "Bern (Bundesstadt)",
        Population: "8,9 Millionen",
        Superficie: "41.285 km²",
        Cantons: "26 Kantone",
        Langues_Officielles: "Deutsch, Französisch, Italienisch, Rätoromanisch",
      },
      trivia: {
        question: "Wie viele Landessprachen hat die Schweiz?",
        options: ["2", "3", "4", "5"],
        explanation: "Die Schweiz hat 4 Landessprachen: Deutsch, Französisch, Italienisch und Rätoromanisch.",
      },
    },
    card_country_jp: {
      name: "Japan",
      tagline: "Archipel der aufgehenden Sonne",
      description: "Vulkanischer Archipel, der jahrtausendealte Traditionen mit Spitzentechnologie verbindet.",
      funFact: "Japan besteht aus 6.852 Inseln!",
      quote: "Siebenmal hinfallen, achtmal aufstehen",
    },
    card_wonder_everest: {
      name: "Mount Everest",
      tagline: "Das Dach der Welt (Chomolungma)",
      description: "Der höchste Berg der Erde über dem Meeresspiegel im Himalaya.",
      funFact: "Der Mount Everest wächst jährlich um etwa 4 Millimeter!",
    },
  },
  it: {
    card_country_fr: {
      name: "Francia",
      tagline: "L'Esagono dei Lumi",
      description: "Il paese più visitato al mondo, celebre per il patrimonio culturale, la gastronomia e 12 fusi orari.",
      funFact: "Grazie ai suoi territori d'oltremare, la Francia conta più fusi orari di qualsiasi altro paese!",
      quote: "Libertà, Uguaglianza, Fratellanza",
      stats: {
        Capitale: "Parigi",
        Population: "68 milioni",
        Superficie: "551.695 km²",
        Point_Culminant: "Monte Bianco (4.809 m)",
        Fuseaux_Horaires: "12 (record mondiale)",
      },
      trivia: {
        question: "Quale paese detiene il record mondiale per il maggior numero di fusi orari?",
        options: ["Russia", "Francia", "Stati Uniti", "Regno Unito"],
        explanation: "Con i territori d'oltremare, la Francia copre 12 fusi orari diversi.",
      },
    },
    card_country_ch: {
      name: "Svizzera",
      tagline: "Terra degli Elvezi e delle Cime Alpine",
      description: "Confederazione alpina famosa per la neutralità, le quattro lingue ufficiali e l'alta qualità della vita.",
      funFact: "La Svizzera ha oltre 1.500 laghi e non si è mai a più di 16 km da uno specchio d'acqua!",
      quote: "Uno per tutti, tutti per uno",
      stats: {
        Capitale: "Berna (Città Federale)",
        Population: "8,9 milioni",
        Superficie: "41.285 km²",
        Cantons: "26 cantoni",
        Langues_Officielles: "Tedesco, Francese, Italiano, Romancio",
      },
      trivia: {
        question: "Quante lingue ufficiali ha la Svizzera?",
        options: ["2", "3", "4", "5"],
        explanation: "La Svizzera ha 4 lingue nazionali: tedesco, francese, italiano e romancio.",
      },
    },
    card_wonder_everest: {
      name: "Monte Everest",
      tagline: "Il Tetto del Mondo (Chomolungma)",
      description: "La vetta più alta della Terra sul livello del mare, nella catena dell'Himalaya.",
      funFact: "L'Everest cresce di circa 4 millimetri all'anno!",
    },
  },
  pt: {
    card_country_fr: {
      name: "França",
      tagline: "O Hexágono das Luzes",
      description: "O país mais visitado do mundo, famoso pelo patrimônio cultural, gastronomia e 12 fusos horários.",
      funFact: "Graças aos territórios ultramarinos, a França possui 12 fusos horários, recorde mundial!",
      quote: "Liberdade, Igualdade, Fraternidade",
      stats: {
        Capitale: "Paris",
        Population: "68 milhões",
        Superficie: "551.695 km²",
        Point_Culminant: "Monte Branco (4.809 m)",
        Fuseaux_Horaires: "12 (recorde mundial)",
      },
      trivia: {
        question: "Qual país detém o recorde mundial do maior número de fusos horários?",
        options: ["Rússia", "França", "Estados Unidos", "Reino Unido"],
        explanation: "Com seus territórios ultramarinos, a França cobre 12 fusos horários diferentes.",
      },
    },
    card_country_ch: {
      name: "Suíça",
      tagline: "Terra dos Helvécios e Cumes Alpinos",
      description: "Confederação alpina célebre pela neutralidade, 4 línguas oficiais e altíssima qualidade de vida.",
      funFact: "A Suíça possui mais de 1.500 lagos e você nunca está a mais de 16 km de uma massa de água!",
      quote: "Um por todos, todos por um",
      stats: {
        Capitale: "Berna (Cidade Federal)",
        Population: "8,9 milhões",
        Superficie: "41.285 km²",
        Cantons: "26 cantões",
        Langues_Officielles: "Alemão, Francês, Italiano, Romanche",
      },
      trivia: {
        question: "Quantas línguas oficiais a Suíça tem?",
        options: ["2", "3", "4", "5"],
        explanation: "A Suíça possui 4 línguas oficiais: alemão, francês, italiano e romanche.",
      },
    },
    card_wonder_everest: {
      name: "Monte Everest",
      tagline: "O Teto do Mundo (Chomolungma)",
      description: "A montanha mais alta da Terra acima do nível do mar, no Himalaia.",
      funFact: "O Everest cresce cerca de 4 milímetros por ano devido à tectônica de placas!",
    },
  },
};

// ── CACHE & STORAGE AVEC REPLI MÉMOIRE POUR SSR / TESTS ──
const CACHE_KEY = "terracoast_cards_translations_cache";
const CUSTOM_TRANSLATIONS_KEY = "terracoast_cards_translations_custom";

const memoryStorage: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(key);
    }
  } catch {}
  return memoryStorage[key] || null;
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, value);
    }
  } catch {}
  memoryStorage[key] = value;
}

function safeRemoveItem(key: string): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(key);
    }
  } catch {}
  delete memoryStorage[key];
}

function safeDispatchEvent(name: string): void {
  if (typeof window !== "undefined" && typeof CustomEvent !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(name));
    } catch {}
  }
}

function getStoredCache(): CardTranslationsDictionary {
  try {
    const raw = safeGetItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredCache(cache: CardTranslationsDictionary) {
  try {
    safeSetItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

function getCustomTranslations(): CardTranslationsDictionary {
  try {
    const raw = safeGetItem(CUSTOM_TRANSLATIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Configuration optionnelle pour un serveur externe de traduction (LibreTranslate, LLM Proxy...)
let externalApiEndpoint: string | null = null;

/**
 * 🎴 API PUBLIQUE DE TRADUCTION DES CARTES (cardTranslationAPI)
 */
export const cardTranslationAPI = {
  /**
   * Configure l'URL d'une API externe pour traduire dynamiquement les nouvelles cartes
   */
  setExternalApiUrl(url: string | null) {
    externalApiEndpoint = url;
  },

  /**
   * Traduit une carte de façon synchrone et immédiate
   * Utilise le dictionnaire pré-compilé, le cache utilisateur, et applique les correspondances de métadonnées.
   */
  getTranslatedCard(card: TerraCard, targetLang: Language): TerraCard {
    if (targetLang === "fr") return card;

    // 1. Chercher dans les traductions personnalisées
    const custom = getCustomTranslations()[targetLang]?.[card.id];
    // 2. Chercher dans le cache runtime
    const cached = getStoredCache()[targetLang]?.[card.id];
    // 3. Chercher dans le dictionnaire embarqué
    const prebuilt = PREBUILT_CARD_TRANSLATIONS[targetLang]?.[card.id];

    const match: CardTranslationEntry | undefined = custom || cached || prebuilt;

    // Traduction des clés de stats
    const translatedStats: Record<string, string | number> = {};
    const statKeyMap = STAT_KEY_TRANSLATIONS[targetLang] || STAT_KEY_TRANSLATIONS.fr;

    // 1. Clés d'origine traduites
    Object.entries(card.stats).forEach(([key, val]) => {
      const translatedKey = statKeyMap[key] || key;
      const specificVal = match?.stats?.[key] ?? match?.stats?.[translatedKey] ?? val;
      translatedStats[translatedKey] = specificVal;
    });

    // 2. Clés additionnelles fournies par la traduction
    if (match?.stats) {
      Object.entries(match.stats).forEach(([k, v]) => {
        const translatedKey = statKeyMap[k] || k;
        if (translatedStats[translatedKey] === undefined) {
          translatedStats[translatedKey] = v;
        }
      });
    }

    // Traduction de la trivia si disponible
    const trivia = {
      question: match?.trivia?.question || card.trivia.question,
      options: match?.trivia?.options || card.trivia.options,
      correctIndex: card.trivia.correctIndex,
      explanation: match?.trivia?.explanation || card.trivia.explanation,
    };

    return {
      ...card,
      name: match?.name || card.name,
      tagline: match?.tagline || card.tagline,
      description: match?.description || card.description,
      funFact: match?.funFact || card.funFact,
      quote: match?.quote || card.quote,
      stats: translatedStats,
      trivia,
    };
  },

  /**
   * Traduit une carte de façon asynchrone (avec fallback API externe si disponible)
   */
  async translateCardAsync(card: TerraCard, targetLang: Language): Promise<TerraCard> {
    if (targetLang === "fr") return card;

    // Si déjà disponible dans les dictionnaires locaux
    const immediate = this.getTranslatedCard(card, targetLang);
    if (immediate.name !== card.name || immediate.tagline !== card.tagline) {
      return immediate;
    }

    // Si une API externe est configurée (ex: LibreTranslate ou Cloud Translation)
    if (externalApiEndpoint) {
      try {
        const res = await fetch(`${externalApiEndpoint}/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            q: [card.name, card.tagline, card.description, card.funFact],
            source: "fr",
            target: targetLang,
            format: "text",
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const translatedTexts = data.translatedText || [];
          const entry: CardTranslationEntry = {
            name: translatedTexts[0] || card.name,
            tagline: translatedTexts[1] || card.tagline,
            description: translatedTexts[2] || card.description,
            funFact: translatedTexts[3] || card.funFact,
          };

          // Sauvegarder dans le cache local
          const cache = getStoredCache();
          if (!cache[targetLang]) cache[targetLang] = {};
          cache[targetLang]![card.id] = entry;
          saveStoredCache(cache);

          return this.getTranslatedCard(card, targetLang);
        }
      } catch (err) {
        console.warn("CardTranslationAPI external call fallback:", err);
      }
    }

    return immediate;
  },

  /**
   * Traduit un tableau complet de cartes
   */
  async batchTranslate(cards: TerraCard[], targetLang: Language): Promise<TerraCard[]> {
    return Promise.all(cards.map((c) => this.translateCardAsync(c, targetLang)));
  },

  /**
   * Exporte un modèle JSON de toutes les cartes prêt pour un traducteur ou une API externe (DeepL/OpenAI)
   */
  exportTranslationTemplate(): string {
    const template: Record<string, CardTranslationEntry> = {};
    TERRA_CARDS_CATALOG.forEach((c) => {
      template[c.id] = {
        name: c.name,
        tagline: c.tagline,
        description: c.description,
        funFact: c.funFact,
        quote: c.quote,
        stats: c.stats,
        trivia: {
          question: c.trivia.question,
          options: c.trivia.options,
          explanation: c.trivia.explanation,
        },
      };
    });
    return JSON.stringify(template, null, 2);
  },

  /**
   * Importe un dictionnaire de traductions personnalisées
   */
  importCustomTranslations(jsonPayload: string | Record<string, any>): boolean {
    try {
      const parsed = typeof jsonPayload === "string" ? JSON.parse(jsonPayload) : jsonPayload;
      if (!parsed || typeof parsed !== "object") return false;
      const current = getCustomTranslations();
      const merged = { ...current, ...parsed };
      safeSetItem(CUSTOM_TRANSLATIONS_KEY, JSON.stringify(merged));
      safeDispatchEvent("terracoast_card_translations_updated");
      return true;
    } catch (err) {
      console.error("Failed to import custom translations:", err);
      return false;
    }
  },

  /**
   * Retourne l'état de progression de la traduction pour une langue donnée
   */
  getTranslationProgress(targetLang: Language): { total: number; translated: number; percent: number } {
    if (targetLang === "fr") {
      return { total: TERRA_CARDS_CATALOG.length, translated: TERRA_CARDS_CATALOG.length, percent: 100 };
    }
    const prebuilt = PREBUILT_CARD_TRANSLATIONS[targetLang] || {};
    const cached = getStoredCache()[targetLang] || {};
    const custom = getCustomTranslations()[targetLang] || {};

    let translated = 0;
    TERRA_CARDS_CATALOG.forEach((card) => {
      if (prebuilt[card.id] || cached[card.id] || custom[card.id]) {
        translated++;
      }
    });

    const total = TERRA_CARDS_CATALOG.length;
    const percent = Math.round((translated / total) * 100);
    return { total, translated, percent };
  },

  /**
   * Efface le cache des traductions
   */
  clearCache(): void {
    safeRemoveItem(CACHE_KEY);
    safeRemoveItem(CUSTOM_TRANSLATIONS_KEY);
  },
};

/**
 * 🪝 Hook React pour obtenir une carte traduite réactivement selon la langue active
 */
export function useTranslatedCard(
  card: TerraCard | null | undefined,
  langOverride?: Language
): TerraCard | null {
  const { language } = useLanguage();
  const activeLang = langOverride || language;

  return useMemo(() => {
    if (!card) return null;
    return cardTranslationAPI.getTranslatedCard(card, activeLang);
  }, [card, activeLang]);
}

/**
 * 🪝 Hook React pour obtenir une liste de cartes traduites
 */
export function useTranslatedCards(
  cards: TerraCard[],
  langOverride?: Language
): TerraCard[] {
  const { language } = useLanguage();
  const activeLang = langOverride || language;

  return useMemo(() => {
    return cards.map((c) => cardTranslationAPI.getTranslatedCard(c, activeLang));
  }, [cards, activeLang]);
}
