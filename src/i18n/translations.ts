import fr from "./locales/fr";

export type Language = "fr" | "en" | "es" | "de" | "it" | "pt";

// Dictionnaires chargés en mémoire (le français sert de base et de repli immédiat)
export const loadedLocales: Partial<Record<Language, Record<string, string>>> = {
  fr,
};

/**
 * Charge dynamiquement le module de langue à la demande.
 */
export async function loadLanguage(lang: Language): Promise<Record<string, string>> {
  if (loadedLocales[lang]) {
    return loadedLocales[lang]!;
  }

  let dict: Record<string, string>;
  switch (lang) {
    case "en":
      dict = (await import("./locales/en")).default;
      break;
    case "es":
      dict = (await import("./locales/es")).default;
      break;
    case "de":
      dict = (await import("./locales/de")).default;
      break;
    case "it":
      dict = (await import("./locales/it")).default;
      break;
    case "pt":
      dict = (await import("./locales/pt")).default;
      break;
    case "fr":
    default:
      dict = fr;
      break;
  }

  loadedLocales[lang] = dict;
  return dict;
}

export const languageNames: Record<Language, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
};

export function detectUserLanguage(): Language {
  const browserLang = navigator.language?.toLowerCase().split("-")[0];
  const supported: Language[] = ["fr", "en", "es", "de", "it", "pt"];

  if (supported.includes(browserLang as Language)) {
    return browserLang as Language;
  }

  return "fr";
}

export function translate(key: string, language: Language): string {
  const dict = loadedLocales[language] || loadedLocales.fr || fr;
  return dict[key] || fr[key] || key;
}

// Proxy de compatibilité pour les éventuels accès directs `translations[lang][key]`
export const translations: Record<Language, Record<string, string>> = new Proxy(
  {} as Record<Language, Record<string, string>>,
  {
    get: (_target, prop: string) => {
      const lang = prop as Language;
      return loadedLocales[lang] || loadedLocales.fr || fr;
    },
  }
);
