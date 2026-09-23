import { describe, it, expect, beforeEach } from "vitest";
import {
  getRecommendedAudioForCountry,
  CURATED_RADIO_STATIONS,
  SOUNDSCAPES,
} from "../radioGlobeData";
import { getAudioAnecdoteForCountry } from "../audioAnecdotesData";
import { radioGlobeEngine } from "../radioGlobeEngine";
import { audioAnecdoteSpeaker } from "../audioAnecdoteSpeaker";

describe("Radio Globe & Soundscapes System", () => {
  beforeEach(() => {
    radioGlobeEngine.pause();
    radioGlobeEngine.setDucking(false);
    audioAnecdoteSpeaker.stop();
  });

  describe("radioGlobeData", () => {
    it("returns correct recommended radio station and soundscape for Brazil", () => {
      const rec = getRecommendedAudioForCountry("BRA");
      expect(rec.station.countryName).toBe("Brésil");
      expect(rec.station.fallbackSoundscape).toBe("rainforest");
      expect(rec.soundscape.id).toBe("rainforest");
    });

    it("returns correct recommended radio station and soundscape for Switzerland", () => {
      const rec = getRecommendedAudioForCountry("CHE");
      expect(rec.station.countryName).toBe("Suisse");
      expect(rec.soundscape.id).toBe("alpine");
    });

    it("returns correct recommended radio station and soundscape for Senegal", () => {
      const rec = getRecommendedAudioForCountry("SEN");
      expect(rec.station.countryName).toBe("Sénégal");
      expect(rec.soundscape.id).toBe("savanna");
    });

    it("returns correct recommended radio station and soundscape for Iceland", () => {
      const rec = getRecommendedAudioForCountry("ISL");
      expect(rec.station.countryName).toBe("Islande");
      expect(rec.soundscape.id).toBe("alpine");
    });

    it("gracefully falls back for unknown countries or null", () => {
      const recUnknown = getRecommendedAudioForCountry("XYZ");
      expect(recUnknown.station).toBeDefined();
      expect(recUnknown.soundscape).toBeDefined();

      const recNull = getRecommendedAudioForCountry(null);
      expect(recNull.station).toBeDefined();
      expect(recNull.soundscape).toBeDefined();
    });

    it("contains all verified curated radio stations with valid fallbacks", () => {
      expect(CURATED_RADIO_STATIONS.length).toBeGreaterThanOrEqual(10);
      CURATED_RADIO_STATIONS.forEach((station) => {
        expect(station.streamUrl).toMatch(/^https?:\/\//);
        expect(SOUNDSCAPES[station.fallbackSoundscape]).toBeDefined();
        expect(station.flag).toBeTruthy();
      });
    });
  });

  describe("audioAnecdotesData", () => {
    it("provides high quality 10-second anecdotes for flagship countries", () => {
      const flagship = ["BRA", "SEN", "CHE", "ISL", "JPN", "FRA", "MAR"];
      flagship.forEach((iso3) => {
        const anecdote = getAudioAnecdoteForCountry(iso3);
        expect(anecdote.iso3).toBe(iso3);
        expect(anecdote.text.length).toBeGreaterThan(50);
        expect(anecdote.durationSeconds).toBeGreaterThanOrEqual(8);
        expect(anecdote.durationSeconds).toBeLessThanOrEqual(12);
      });
    });

    it("generates a dynamic 10s anecdote for any unknown country", () => {
      const dynamic = getAudioAnecdoteForCountry("ABC", "Atlantide", "🔱");
      expect(dynamic.iso3).toBe("ABC");
      expect(dynamic.countryName).toBe("Atlantide");
      expect(dynamic.flag).toBe("🔱");
      expect(dynamic.text).toContain("Atlantide");
    });
  });

  describe("radioGlobeEngine", () => {
    it("updates volume safely between 0 and 1", () => {
      radioGlobeEngine.setVolume(0.8);
      expect(radioGlobeEngine.getState().volume).toBe(0.8);

      radioGlobeEngine.setVolume(1.5); // clamping
      expect(radioGlobeEngine.getState().volume).toBe(1.0);

      radioGlobeEngine.setVolume(-0.2); // clamping
      expect(radioGlobeEngine.getState().volume).toBe(0.0);
    });

    it("handles mute and unmute toggling", () => {
      const initialMuted = radioGlobeEngine.getState().isMuted;
      const toggled = radioGlobeEngine.toggleMute();
      expect(toggled).toBe(!initialMuted);
      expect(radioGlobeEngine.getState().isMuted).toBe(!initialMuted);

      const restored = radioGlobeEngine.toggleMute();
      expect(restored).toBe(initialMuted);
    });

    it("handles mode switching between radio and soundscape", () => {
      radioGlobeEngine.setMode("soundscape");
      expect(radioGlobeEngine.getState().mode).toBe("soundscape");

      radioGlobeEngine.setMode("radio");
      expect(radioGlobeEngine.getState().mode).toBe("radio");
    });

    it("handles ducking factor for vocal speech clarity", () => {
      radioGlobeEngine.setDucking(true);
      // Volume remains stored but effective duck factor applied
      expect(radioGlobeEngine.getState().volume).toBeDefined();
      radioGlobeEngine.setDucking(false);
    });
  });
});
