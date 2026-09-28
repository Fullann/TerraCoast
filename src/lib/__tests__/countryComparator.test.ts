import { describe, it, expect } from "vitest";
import {
  compareCountries,
  getMercatorAreaMultiplier,
} from "../countryComparator";
import { getAllAtlasCountries } from "../atlasData";

describe("countryComparator", () => {
  const countries = getAllAtlasCountries("fr");
  const switzerland = countries.find((c) => c.iso3 === "CHE")!;
  const japan = countries.find((c) => c.iso3 === "JPN")!;
  const brazil = countries.find((c) => c.iso3 === "BRA")!;

  it("should calculate correct Mercator exaggeration based on latitude", () => {
    // Equator ~ 0 deg -> multiplier approx 1
    const equator = getMercatorAreaMultiplier(0);
    expect(equator).toBeCloseTo(1, 1);

    // 60 deg -> cos(60) = 0.5 -> multiplier = 4
    const lat60 = getMercatorAreaMultiplier(60);
    expect(lat60).toBeCloseTo(4, 1);
  });

  it("should compare Switzerland vs Japan accurately", () => {
    expect(switzerland).toBeDefined();
    expect(japan).toBeDefined();

    const result = compareCountries(switzerland, japan);
    expect(result.countryA.name).toBe("Suisse");
    expect(result.countryB.name).toBe("Japon");

    // Japan has more population than Switzerland
    expect(result.population.winner).toBe("B");
    // Japan has more area than Switzerland
    expect(result.area.winner).toBe("B");
    // True size linear scale ratio should be > 1 (Japan larger)
    expect(result.trueSize.linearScaleRatio).toBeGreaterThan(1);
    expect(result.trueSize.insightText).toContain("Japon");
  });

  it("should compare Switzerland vs Brazil with density comparison", () => {
    const result = compareCountries(switzerland, brazil);
    // Switzerland is more densely populated than Brazil
    expect(result.density.winner).toBe("A");
    // Brazil is vastly larger in area
    expect(result.area.winner).toBe("B");
  });
});
