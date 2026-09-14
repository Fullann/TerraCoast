import { describe, it, expect, afterEach } from "vitest";
import { translations, loadLanguage, translate, detectUserLanguage } from "../translations";

describe("i18n translations & dynamic loader", () => {
  it("should have fallback French translations available synchronously", () => {
    expect(translations.fr).toBeDefined();
    expect(translations.fr["common.cancel"]).toBe("Annuler");
    expect(translations.fr["common.save"]).toBe("Enregistrer");
  });

  it("should provide fallback values via Proxy when accessing unloaded languages", () => {
    // Before explicit load, accessing key should fallback gracefully to French
    expect(translations.en["common.cancel"]).toBe("Annuler");
  });

  it("should dynamically load English translations and update dictionary", async () => {
    const enDict = await loadLanguage("en");
    expect(enDict).toBeDefined();
    expect(enDict["common.cancel"]).toBe("Cancel");
    expect(translations.en["common.cancel"]).toBe("Cancel");
  });

  it("should dynamically load German translations", async () => {
    const deDict = await loadLanguage("de");
    expect(deDict).toBeDefined();
    expect(deDict["common.cancel"]).toBe("Abbrechen");
    expect(translations.de["common.cancel"]).toBe("Abbrechen");
  });

  it("should dynamically load Spanish, Italian, and Portuguese translations", async () => {
    const esDict = await loadLanguage("es");
    expect(esDict["common.cancel"]).toBe("Cancelar");

    const itDict = await loadLanguage("it");
    expect(itDict["common.cancel"]).toBe("Annulla");

    const ptDict = await loadLanguage("pt");
    expect(ptDict["common.cancel"]).toBe("Cancelar");
  });

  it("should return cached dictionary reference on subsequent calls without re-fetching", async () => {
    const dict1 = await loadLanguage("es");
    const dict2 = await loadLanguage("es");
    expect(dict1).toBe(dict2);
  });

  describe("translate helper", () => {
    it("translates key in specified language", async () => {
      await loadLanguage("en");
      expect(translate("common.cancel", "en")).toBe("Cancel");
      expect(translate("common.cancel", "fr")).toBe("Annuler");
    });

    it("falls back to French translation if key is missing in target language", () => {
      expect(translate("common.cancel", "fr")).toBe("Annuler");
    });

    it("returns raw key if missing in all languages", () => {
      expect(translate("non_existent_key_xyz", "fr")).toBe("non_existent_key_xyz");
    });
  });

  describe("detectUserLanguage", () => {
    const originalNavigator = globalThis.navigator;

    afterEach(() => {
      Object.defineProperty(globalThis, "navigator", {
        value: originalNavigator,
        configurable: true,
      });
    });

    it("detects supported language codes from browser navigator.language", () => {
      const setNavigatorLang = (lang: string) => {
        Object.defineProperty(globalThis, "navigator", {
          value: { language: lang },
          configurable: true,
        });
      };

      setNavigatorLang("en-US");
      expect(detectUserLanguage()).toBe("en");

      setNavigatorLang("es-MX");
      expect(detectUserLanguage()).toBe("es");

      setNavigatorLang("de-AT");
      expect(detectUserLanguage()).toBe("de");

      setNavigatorLang("it-CH");
      expect(detectUserLanguage()).toBe("it");

      setNavigatorLang("pt-BR");
      expect(detectUserLanguage()).toBe("pt");

      setNavigatorLang("fr-BE");
      expect(detectUserLanguage()).toBe("fr");
    });

    it("falls back to 'fr' for unsupported or undefined languages", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: { language: "ja-JP" },
        configurable: true,
      });
      expect(detectUserLanguage()).toBe("fr");

      Object.defineProperty(globalThis, "navigator", {
        value: { language: "" },
        configurable: true,
      });
      expect(detectUserLanguage()).toBe("fr");
    });
  });

  it("should have error boundary translations in all loaded languages", async () => {
    expect(translations.fr["error.title"]).toBe("Oups ! Une erreur est survenue.");
    expect(translations.fr["error.returnHome"]).toBe("Retour à l'accueil");

    const enDict = await loadLanguage("en");
    expect(enDict["error.title"]).toBe("Oops! Something went wrong.");
    expect(enDict["error.returnHome"]).toBe("Back to home");
    expect(enDict["error.reload"]).toBe("Reload page");
  });
});

