import { describe, it, expect, beforeEach } from "vitest";
import {
  cardTranslationAPI,
  CATEGORY_TRANSLATIONS,
  RARITY_TRANSLATIONS,
  CONTINENT_TRANSLATIONS,
  STAT_KEY_TRANSLATIONS,
} from "../cardsTranslationService";
import { TERRA_CARDS_CATALOG } from "../cardsData";

describe("cardsTranslationService & cardTranslationAPI", () => {
  beforeEach(() => {
    cardTranslationAPI.clearCache();
  });

  it("should return the exact same card if target language is 'fr'", () => {
    const original = TERRA_CARDS_CATALOG[0]; // France
    const result = cardTranslationAPI.getTranslatedCard(original, "fr");

    expect(result.name).toBe(original.name);
    expect(result.tagline).toBe(original.tagline);
    expect(result.description).toBe(original.description);
  });

  it("should accurately translate known cards into English ('en')", () => {
    const frCard = TERRA_CARDS_CATALOG.find((c) => c.id === "card_country_fr")!;
    const enCard = cardTranslationAPI.getTranslatedCard(frCard, "en");

    expect(enCard.name).toBe("France");
    expect(enCard.tagline).toBe("The Hexagon of Enlightenment");
    expect(enCard.funFact).toContain("time zones");
    expect(enCard.quote).toBe("Liberty, Equality, Fraternity");
    expect(enCard.stats["Capital"]).toBe("Paris");
    expect(enCard.trivia.question).toBe("Which country holds the world record for the most time zones?");
  });

  it("should accurately translate Switzerland into German ('de')", () => {
    const chCard = TERRA_CARDS_CATALOG.find((c) => c.id === "card_country_ch")!;
    const deCard = cardTranslationAPI.getTranslatedCard(chCard, "de");

    expect(deCard.name).toBe("Schweiz");
    expect(deCard.tagline).toBe("Land der Helvetier und Alpengipfel");
    expect(deCard.stats["Kantone"]).toBe("26 Kantone");
    expect(deCard.trivia.question).toBe("Wie viele Landessprachen hat die Schweiz?");
  });

  it("should accurately translate cards into Spanish ('es')", () => {
    const chCard = TERRA_CARDS_CATALOG.find((c) => c.id === "card_country_ch")!;
    const esCard = cardTranslationAPI.getTranslatedCard(chCard, "es");

    expect(esCard.name).toBe("Suiza");
    expect(esCard.tagline).toBe("Tierra de Helvecios y Cumbres Alpinas");
    expect(esCard.stats["Cantones"]).toBe("26 cantones");
  });

  it("should accurately translate cards into Italian ('it')", () => {
    const chCard = TERRA_CARDS_CATALOG.find((c) => c.id === "card_country_ch")!;
    const itCard = cardTranslationAPI.getTranslatedCard(chCard, "it");

    expect(itCard.name).toBe("Svizzera");
    expect(itCard.tagline).toBe("Terra degli Elvezi e delle Cime Alpine");
  });

  it("should accurately translate cards into Portuguese ('pt')", () => {
    const frCard = TERRA_CARDS_CATALOG.find((c) => c.id === "card_country_fr")!;
    const ptCard = cardTranslationAPI.getTranslatedCard(frCard, "pt");

    expect(ptCard.name).toBe("França");
    expect(ptCard.tagline).toBe("O Hexágono das Luzes");
    expect(ptCard.quote).toBe("Liberdade, Igualdade, Fraternidade");
  });

  it("should translate category names across all 6 supported languages", () => {
    expect(CATEGORY_TRANSLATIONS.fr.country).toBe("Nations & Territoires");
    expect(CATEGORY_TRANSLATIONS.en.country).toBe("Nations & Territories");
    expect(CATEGORY_TRANSLATIONS.es.country).toBe("Naciones y Territorios");
    expect(CATEGORY_TRANSLATIONS.de.country).toBe("Nationen & Territorien");
    expect(CATEGORY_TRANSLATIONS.it.country).toBe("Nazioni e Territori");
    expect(CATEGORY_TRANSLATIONS.pt.country).toBe("Nações e Territórios");

    expect(CATEGORY_TRANSLATIONS.en.wonder).toBe("Natural Wonders");
    expect(CATEGORY_TRANSLATIONS.de.figure).toBe("Entdecker & Persönlichkeiten");
  });

  it("should translate card rarity labels across all languages", () => {
    expect(RARITY_TRANSLATIONS.fr.mythic).toBe("Mythique");
    expect(RARITY_TRANSLATIONS.en.mythic).toBe("Mythic");
    expect(RARITY_TRANSLATIONS.es.mythic).toBe("Mítica");
    expect(RARITY_TRANSLATIONS.de.mythic).toBe("Mythisch");
    expect(RARITY_TRANSLATIONS.it.mythic).toBe("Mitica");
    expect(RARITY_TRANSLATIONS.pt.mythic).toBe("Mítica");

    expect(RARITY_TRANSLATIONS.de.legendary).toBe("Legendär");
    expect(RARITY_TRANSLATIONS.en.epic).toBe("Epic");
  });

  it("should translate continent names across all languages", () => {
    expect(CONTINENT_TRANSLATIONS.en.Asie).toBe("Asia");
    expect(CONTINENT_TRANSLATIONS.es.Europe).toBe("Europa");
    expect(CONTINENT_TRANSLATIONS.de.Monde).toBe("Welt");
    expect(CONTINENT_TRANSLATIONS.pt.Afrique).toBe("África");
  });

  it("should translate standard stats keys", () => {
    expect(STAT_KEY_TRANSLATIONS.en.Capitale).toBe("Capital");
    expect(STAT_KEY_TRANSLATIONS.de.Capitale).toBe("Hauptstadt");
    expect(STAT_KEY_TRANSLATIONS.es.Population).toBe("Población");
    expect(STAT_KEY_TRANSLATIONS.it.Point_Culminant).toBe("Punto Più Alto");
  });

  it("should batch translate multiple cards", async () => {
    const subset = TERRA_CARDS_CATALOG.slice(0, 3);
    const translated = await cardTranslationAPI.batchTranslate(subset, "en");

    expect(translated.length).toBe(3);
    expect(translated[0].id).toBe(subset[0].id);
  });

  it("should export a valid JSON translation template", () => {
    const templateStr = cardTranslationAPI.exportTranslationTemplate();
    expect(typeof templateStr).toBe("string");
    const parsed = JSON.parse(templateStr);
    expect(parsed["card_country_fr"]).toBeDefined();
    expect(parsed["card_country_fr"].name).toBe("France");
  });

  it("should allow importing custom translations dynamically", () => {
    const customPayload = {
      en: {
        card_country_jp: {
          name: "Empire of Japan (Custom)",
          tagline: "Custom English Tagline",
        },
      },
    };

    const success = cardTranslationAPI.importCustomTranslations(customPayload);
    expect(success).toBe(true);

    const jpCard = TERRA_CARDS_CATALOG.find((c) => c.id === "card_country_jp")!;
    const translated = cardTranslationAPI.getTranslatedCard(jpCard, "en");
    expect(translated.name).toBe("Empire of Japan (Custom)");
    expect(translated.tagline).toBe("Custom English Tagline");
  });

  it("should return valid translation progress metrics", () => {
    const frProgress = cardTranslationAPI.getTranslationProgress("fr");
    expect(frProgress.percent).toBe(100);

    const enProgress = cardTranslationAPI.getTranslationProgress("en");
    expect(enProgress.total).toBe(TERRA_CARDS_CATALOG.length);
    expect(enProgress.translated).toBeGreaterThan(0);
  });
});
