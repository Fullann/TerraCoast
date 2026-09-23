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
});
