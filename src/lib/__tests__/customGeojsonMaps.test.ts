import { describe, it, expect } from "vitest";
import {
  normalizeGeoJsonToFeatureCollection,
  mergeBboxes,
  getFeatureZoneId,
  getZoneIdFromRsmGeography,
  analyzeCustomGeoJsonText,
} from "../customGeojsonMaps";

describe("customGeojsonMaps helpers", () => {
  describe("normalizeGeoJsonToFeatureCollection", () => {
    it("returns FeatureCollection as-is when valid", () => {
      const fc = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [10, 20] },
            properties: { name: "Test Point" },
          },
        ],
      };
      const normalized = normalizeGeoJsonToFeatureCollection(fc);
      expect(normalized).not.toBeNull();
      expect(normalized?.type).toBe("FeatureCollection");
      expect(normalized?.features).toHaveLength(1);
    });

    it("wraps a single Feature into a FeatureCollection", () => {
      const singleFeature = {
        type: "Feature",
        geometry: { type: "Point", coordinates: [5, 10] },
        properties: { name: "Solo" },
      };
      const normalized = normalizeGeoJsonToFeatureCollection(singleFeature);
      expect(normalized).not.toBeNull();
      expect(normalized?.type).toBe("FeatureCollection");
      expect(normalized?.features).toHaveLength(1);
    });

    it("returns null for non-object, empty, or invalid input", () => {
      expect(normalizeGeoJsonToFeatureCollection(null)).toBeNull();
      expect(normalizeGeoJsonToFeatureCollection("invalid")).toBeNull();
      expect(normalizeGeoJsonToFeatureCollection({ type: "InvalidType" })).toBeNull();
    });
  });

  describe("mergeBboxes", () => {
    it("merges multiple bounding boxes into an enveloping box", () => {
      const box1: [number, number, number, number] = [0, 10, 5, 15];
      const box2: [number, number, number, number] = [-2, 8, 3, 20];
      const merged = mergeBboxes([box1, box2]);
      // minLng = -2, minLat = 8, maxLng = 5, maxLat = 20
      expect(merged).toEqual([-2, 8, 5, 20]);
    });

    it("returns null when bounding boxes array is empty", () => {
      expect(mergeBboxes([])).toBeNull();
    });
  });

  describe("getFeatureZoneId & getZoneIdFromRsmGeography", () => {
    it("extracts zone ID with priority given to specified idProperty in properties", () => {
      const feature = {
        type: "Feature",
        id: "FALLBACK_ID",
        properties: {
          code: "custom_code_123",
          name: "Zone A",
        },
      };
      const zoneId = getFeatureZoneId(feature, "code");
      expect(zoneId).toBe("CUSTOM_CODE_123");
    });

    it("falls back to feature.id if specified idProperty is absent", () => {
      const feature = {
        type: "Feature",
        id: "backup_id",
        properties: {
          name: "Zone B",
        },
      };
      const zoneId = getFeatureZoneId(feature, "non_existent_key");
      expect(zoneId).toBe("BACKUP_ID");
    });

    it("extracts zone ID from react-simple-maps geography wrapper", () => {
      const geo = {
        id: "geo_id_456",
        properties: {
          region_code: "r_01",
        },
      };
      expect(getZoneIdFromRsmGeography(geo, "region_code")).toBe("R_01");
      expect(getZoneIdFromRsmGeography(geo, "missing_key")).toBe("GEO_ID_456");
    });
  });

  describe("analyzeCustomGeoJsonText", () => {
    it("detects syntax errors in malformed JSON and returns error message", () => {
      const res = analyzeCustomGeoJsonText("{ malformed json", "tc_id");
      expect(res.error).toBe("JSON invalide");
      expect(res.featureCount).toBe(0);
    });

    it("detects non-FeatureCollection structures and returns descriptive error", () => {
      const res = analyzeCustomGeoJsonText(JSON.stringify({ someKey: "value" }), "tc_id");
      expect(res.error).toContain("GeoJSON : attendu une FeatureCollection");
    });

    it("successfully analyzes a valid GeoJSON FeatureCollection with polygon coordinates", () => {
      const validGeoJson = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: "ZONE-A",
            properties: {
              name: "Alpha Zone",
              tc_id: "ZA",
            },
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [2.0, 48.0],
                  [2.5, 48.0],
                  [2.5, 48.5],
                  [2.0, 48.5],
                  [2.0, 48.0],
                ],
              ],
            },
          },
        ],
      };

      const result = analyzeCustomGeoJsonText(JSON.stringify(validGeoJson), "tc_id");
      expect(result.error).toBeUndefined();
      expect(result.featureCount).toBe(1);
      expect(result.bbox).not.toBeNull();
      // Latitude between 48.0 and 48.5, Longitude between 2.0 and 2.5
      expect(result.bbox![0]).toBeCloseTo(2.0);
      expect(result.bbox![1]).toBeCloseTo(48.0);
      expect(result.bbox![2]).toBeCloseTo(2.5);
      expect(result.bbox![3]).toBeCloseTo(48.5);
      // Preset center should be within the bounds
      expect(result.preset.centerLng).toBeGreaterThanOrEqual(2.0);
      expect(result.preset.centerLng).toBeLessThanOrEqual(2.5);
      expect(result.preset.centerLat).toBeGreaterThanOrEqual(48.0);
      expect(result.preset.centerLat).toBeLessThanOrEqual(48.5);
    });
  });
});
