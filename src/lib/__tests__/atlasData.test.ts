import { describe, it, expect } from "vitest";
import {
  getAllAtlasCountries,
  getAtlasCountryByIso3,
  getLocalizedContinent,
} from "../atlasData";

describe("atlasData", () => {
  it("loads enriched country data with essential geography fields", () => {
    const countries = getAllAtlasCountries("fr");
    expect(countries.length).toBeGreaterThan(150);

    const france = countries.find((c) => c.iso3 === "FRA");
    expect(france).toBeDefined();
    expect(france?.name).toBe("France");
    expect(france?.capital).toBe("Paris");
    expect(france?.flagEmoji).toBeTruthy();
    expect(france?.continent).toBe("Europe");
    expect(france?.population).toBeGreaterThan(60000000);
    expect(france?.areaKm2).toBeGreaterThan(500000);
    expect(france?.currencies.length).toBeGreaterThan(0);
    expect(france?.borders).toContain("ESP");
  });

  it("translates country names based on language", () => {
    const franceFr = getAtlasCountryByIso3("FRA", "fr");
    const franceDe = getAtlasCountryByIso3("FRA", "de");
    expect(franceFr?.name).toBe("France");
    expect(franceDe?.name).toBe("Frankreich");
  });

  it("translates continent names correctly", () => {
    expect(getLocalizedContinent("Europe", "fr")).toBe("Europe");
    expect(getLocalizedContinent("Asia", "fr")).toBe("Asie");
    expect(getLocalizedContinent("Americas", "de")).toBe("Amerika");
    expect(getLocalizedContinent("Africa", "es")).toBe("África");
  });

  it("finds country by ISO3 or ISO2 code", () => {
    const chIso3 = getAtlasCountryByIso3("CHE", "fr");
    const chIso2 = getAtlasCountryByIso3("CH", "fr");
    expect(chIso3).toBeDefined();
    expect(chIso3?.name).toBe("Suisse");
    expect(chIso2?.iso3).toBe("CHE");
  });

  it("contains microstates with valid geographic data", () => {
    const monaco = getAtlasCountryByIso3("MCO", "fr");
    const vatican = getAtlasCountryByIso3("VAT", "fr");
    const sanMarino = getAtlasCountryByIso3("SMR", "fr");
    const malta = getAtlasCountryByIso3("MLT", "fr");

    expect(monaco).toBeDefined();
    expect(monaco?.name).toBe("Monaco");
    expect(monaco?.lat).toBeCloseTo(43.73, 1);

    expect(vatican).toBeDefined();
    expect(vatican?.capital).toBe("Vatican City");

    expect(sanMarino).toBeDefined();
    expect(malta).toBeDefined();
  });

  it("matches countries regardless of accents (e.g. bresil -> Brésil, algerie -> Algérie)", () => {
    const countries = getAllAtlasCountries("fr");
    const normalize = (s: string) =>
      s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

    const search = (q: string) => {
      const nq = normalize(q);
      return countries.filter((c) => normalize(c.name).includes(nq) || normalize(c.capital).includes(nq));
    };

    expect(search("bresil").some((c) => c.iso3 === "BRA")).toBe(true);
    expect(search("algerie").some((c) => c.iso3 === "DZA")).toBe(true);
    expect(search("etats-unis").some((c) => c.iso3 === "USA")).toBe(true);
    expect(search("perou").some((c) => c.iso3 === "PER")).toBe(true);
    expect(search("suede").some((c) => c.iso3 === "SWE")).toBe(true);
    expect(search("senegal").some((c) => c.iso3 === "SEN")).toBe(true);
  });
});

