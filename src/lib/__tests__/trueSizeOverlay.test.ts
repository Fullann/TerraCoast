import { describe, it, expect } from "vitest";
import {
  generateTrueSizeSvgs,
  getCleanCountryFeature,
} from "../trueSizeOverlay";
import type { AtlasCountry } from "../atlasData";

describe("trueSizeOverlay engine", () => {
  const mockSwitzerland = {
    iso3: "CHE",
    name: "Suisse",
    capital: "Berne",
    flagEmoji: "🇨🇭",
    continent: "Europe",
    population: 8700000,
    areaKm2: 41285,
    lat: 46.8,
    lng: 8.2,
  } as unknown as AtlasCountry;

  const mockFrance = {
    iso3: "FRA",
    name: "France",
    capital: "Paris",
    flagEmoji: "🇫🇷",
    continent: "Europe",
    population: 68000000,
    areaKm2: 643801,
    lat: 46.2,
    lng: 2.2,
  } as unknown as AtlasCountry;

  const mockMonaco = {
    iso3: "MCO",
    name: "Monaco",
    capital: "Monaco",
    flagEmoji: "🇲🇨",
    continent: "Europe",
    population: 39000,
    areaKm2: 2.02,
    lat: 43.73,
    lng: 7.42,
  } as unknown as AtlasCountry;

  it("extracts clean features without crashing", () => {
    const featCHE = getCleanCountryFeature(mockSwitzerland);
    expect(featCHE).toBeDefined();
    expect(featCHE.geometry).toBeDefined();

    const featFRA = getCleanCountryFeature(mockFrance);
    expect(featFRA).toBeDefined();
    expect(featFRA.geometry).toBeDefined();

    // Monaco synthetic fallback
    const featMCO = getCleanCountryFeature(mockMonaco);
    expect(featMCO).toBeDefined();
    expect(featMCO.geometry.type).toBe("Polygon");
  });

  it("calculates accurate scale and ratio for Switzerland vs France", () => {
    const res = generateTrueSizeSvgs(mockSwitzerland, mockFrance, {
      width: 600,
      height: 380,
      mode: "overlay",
    });

    expect(res.pathA.length).toBeGreaterThan(50);
    expect(res.pathB.length).toBeGreaterThan(50);
    expect(res.largerCountry).toBe("B"); // France is bigger
    expect(res.smallerCountry).toBe("A"); // Switzerland is smaller
    expect(res.ratio).toBeCloseTo(643801 / 41285, 1); // ~15.6x
  });

  it("supports side-by-side mode with translated coordinates", () => {
    const res = generateTrueSizeSvgs(mockSwitzerland, mockFrance, {
      width: 600,
      height: 380,
      mode: "sidebyside",
    });

    expect(res.pathA).toBeDefined();
    expect(res.pathB).toBeDefined();
  });
});
