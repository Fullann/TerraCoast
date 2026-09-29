import { describe, it, expect, beforeEach } from "vitest";
import {
  getActiveGeoDetectiveLocations,
  getAllLocationsForAdmin,
  addCustomGeoDetectiveLocation,
  updateGeoDetectiveLocation,
  deleteGeoDetectiveLocation,
  restoreGeoDetectiveLocation,
  resetAllGeoDetectiveLocations,
  exportGeoDetectiveLocationsJson,
  importGeoDetectiveLocationsJson,
} from "../geoDetectiveLocationsManager";
import { SATELLITE_LOCATIONS } from "../geoDetectiveData";

describe("geoDetectiveLocationsManager", () => {
  beforeEach(() => {
    resetAllGeoDetectiveLocations(false);
  });

  it("returns base satellite locations by default", () => {
    const active = getActiveGeoDetectiveLocations();
    expect(active.length).toBe(SATELLITE_LOCATIONS.length);
    expect(active[0].id).toBe(SATELLITE_LOCATIONS[0].id);
  });

  it("allows adding a new custom location", () => {
    const custom = addCustomGeoDetectiveLocation({
      name: "Tour Eiffel & Champ de Mars",
      country: "France",
      iso3: "FRA",
      flagEmoji: "🇫🇷",
      continent: "Europe",
      lat: 48.8584,
      lng: 2.2945,
      category: "monument",
      satelliteImageUrl: "https://images.unsplash.com/photo-test",
      clues: ["Monument en fer forgé", "Capitale européenne traversée par la Seine"],
      funFact: "Construite en 1889 pour l'Exposition universelle.",
      difficulty: "easy",
    });

    expect(custom.id).toBeTruthy();
    const active = getActiveGeoDetectiveLocations();
    expect(active.length).toBe(SATELLITE_LOCATIONS.length + 1);

    const found = active.find((l) => l.name === "Tour Eiffel & Champ de Mars");
    expect(found).toBeDefined();
    expect(found?.iso3).toBe("FRA");
  });

  it("allows updating an existing default location", () => {
    const target = SATELLITE_LOCATIONS[0];
    updateGeoDetectiveLocation(target.id, {
      name: "Pyramides d'Égypte (Modifié)",
      difficulty: "hard",
    });

    const active = getActiveGeoDetectiveLocations();
    const updated = active.find((l) => l.id === target.id);
    expect(updated?.name).toBe("Pyramides d'Égypte (Modifié)");
    expect(updated?.difficulty).toBe("hard");
  });

  it("allows deleting and restoring a location", () => {
    const target = SATELLITE_LOCATIONS[0];
    deleteGeoDetectiveLocation(target.id);

    let active = getActiveGeoDetectiveLocations();
    expect(active.find((l) => l.id === target.id)).toBeUndefined();
    expect(active.length).toBe(SATELLITE_LOCATIONS.length - 1);

    const adminList = getAllLocationsForAdmin();
    const deletedInAdmin = adminList.find((l) => l.id === target.id);
    expect(deletedInAdmin?.isDeleted).toBe(true);

    // Restore
    restoreGeoDetectiveLocation(target.id);
    active = getActiveGeoDetectiveLocations();
    expect(active.find((l) => l.id === target.id)).toBeDefined();
    expect(active.length).toBe(SATELLITE_LOCATIONS.length);
  });

  it("exports and imports configuration accurately", () => {
    addCustomGeoDetectiveLocation({
      name: "Colisée de Rome",
      country: "Italie",
      iso3: "ITA",
      flagEmoji: "🇮🇹",
      continent: "Europe",
      lat: 41.8902,
      lng: 12.4922,
      category: "monument",
      satelliteImageUrl: "https://images.unsplash.com/colosseum",
      clues: ["Arène antique", "Situé dans la ville aux 7 collines"],
      funFact: "Pouvant accueillir jusqu'à 80 000 spectateurs.",
      difficulty: "easy",
    });

    const exportedJson = exportGeoDetectiveLocationsJson();
    expect(exportedJson).toContain("Colisée de Rome");

    // Reset all
    resetAllGeoDetectiveLocations(false);
    expect(getActiveGeoDetectiveLocations().length).toBe(SATELLITE_LOCATIONS.length);

    // Re-import
    const res = importGeoDetectiveLocationsJson(exportedJson);
    expect(res.success).toBe(true);
    expect(res.count).toBe(1);

    const afterImport = getActiveGeoDetectiveLocations();
    expect(afterImport.some((l) => l.name === "Colisée de Rome")).toBe(true);
  });
});
