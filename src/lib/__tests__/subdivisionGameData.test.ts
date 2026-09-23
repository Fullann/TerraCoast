import { describe, it, expect } from "vitest";
import {
  getSubdivisions,
  getSubdivisionsByIds,
  getSubdivisionIso3ByTopoId,
} from "../subdivisionGameData";

describe("subdivisionGameData", () => {
  it("loads 26 Swiss cantons with valid coordinates and iso3 codes", () => {
    const cantons = getSubdivisions("ch_cantons");
    expect(cantons).toHaveLength(26);
    expect(cantons.every((c) => c.iso3.startsWith("CH-"))).toBe(true);
    expect(cantons.every((c) => typeof c.lat === "number" && typeof c.lng === "number")).toBe(true);
  });

  it("loads French départements including Corsican 2A and 2B", () => {
    const deps = getSubdivisions("fr_departements");
    expect(deps).toHaveLength(96);
    const depIsos = deps.map((d) => d.iso3);
    expect(depIsos).toContain("FR-01");
    expect(depIsos).toContain("FR-75"); // Paris
    expect(depIsos).toContain("FR-2A"); // Corse-du-Sud
    expect(depIsos).toContain("FR-2B"); // Haute-Corse
  });

  it("loads 50 US states plus DC (51 total)", () => {
    const states = getSubdivisions("us_states");
    expect(states).toHaveLength(51);
    expect(states.every((s) => s.iso3.startsWith("US-"))).toBe(true);
    expect(states.map((s) => s.iso3)).toContain("US-DC");
  });

  it("filters subdivisions by ISO3 ids", () => {
    const selected = getSubdivisionsByIds("ch_cantons", ["CH-GE", "CH-VD", "UNKNOWN"]);
    expect(selected).toHaveLength(2);
    expect(selected.map((s) => s.name)).toEqual(expect.arrayContaining(["Genève", "Vaud"]));
  });

  describe("getSubdivisionIso3ByTopoId", () => {
    it("resolves Swiss canton topoId", () => {
      expect(getSubdivisionIso3ByTopoId("ch_cantons", 1)).toBe("CH-ZH");
      expect(getSubdivisionIso3ByTopoId("ch_cantons", "25")).toBe("CH-GE");
      expect(getSubdivisionIso3ByTopoId("ch_cantons", 999)).toBe("");
    });

    it("resolves and zero-pads US state topoId", () => {
      // California is FIPS 06
      expect(getSubdivisionIso3ByTopoId("us_states", 6)).toBe("US-CA");
      expect(getSubdivisionIso3ByTopoId("us_states", "06")).toBe("US-CA");
      // New York is FIPS 36
      expect(getSubdivisionIso3ByTopoId("us_states", "36")).toBe("US-NY");
    });

    it("resolves French département topoId with case insensitivity", () => {
      expect(getSubdivisionIso3ByTopoId("fr_departements", "01")).toBe("FR-01");
      expect(getSubdivisionIso3ByTopoId("fr_departements", "75")).toBe("FR-75");
      expect(getSubdivisionIso3ByTopoId("fr_departements", "2a")).toBe("FR-2A");
      expect(getSubdivisionIso3ByTopoId("fr_departements", "2B")).toBe("FR-2B");
    });

    it("returns empty string for empty or missing topoId", () => {
      expect(getSubdivisionIso3ByTopoId("us_states", "")).toBe("");
      // @ts-expect-error testing null input
      expect(getSubdivisionIso3ByTopoId("ch_cantons", null)).toBe("");
    });
  });
});
