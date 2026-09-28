import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSiteConfig,
  updateSiteConfig,
  resetSiteConfig,
  isAnnouncementDismissed,
  dismissAnnouncement,
  DEFAULT_SITE_CONFIG,
} from '../siteConfigManager';
import {
  fetchCountryIntelligence,
} from '../countryTrackingManager';

// Mock localStorage if running in pure node environment
const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.clear !== 'function') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: storageMock,
    writable: true,
  });
}

describe('siteConfigManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default site config when storage is empty', () => {
    const config = getSiteConfig();
    expect(config.announcement.enabled).toBe(true);
    expect(config.featuredCountry.iso3).toBe('JPN');
    expect(config.gameplay.maxLives).toBe(5);
  });

  it('updates site config and persists changes', () => {
    const updated = updateSiteConfig({
      gameplay: {
        ...DEFAULT_SITE_CONFIG.gameplay,
        globalXpMultiplier: 2,
        eventTitle: 'Super Double XP Weekend',
        isEventActive: true,
      },
    });

    expect(updated.gameplay.globalXpMultiplier).toBe(2);
    expect(updated.gameplay.eventTitle).toBe('Super Double XP Weekend');

    const fresh = getSiteConfig();
    expect(fresh.gameplay.globalXpMultiplier).toBe(2);
  });

  it('tracks announcement dismissal properly', () => {
    expect(isAnnouncementDismissed('announcement-123')).toBe(false);
    dismissAnnouncement('announcement-123');
    expect(isAnnouncementDismissed('announcement-123')).toBe(true);
    expect(isAnnouncementDismissed('other-announcement')).toBe(false);
  });

  it('resets config to factory defaults', () => {
    updateSiteConfig({
      gameplay: {
        ...DEFAULT_SITE_CONFIG.gameplay,
        maxLives: 10,
      },
    });
    expect(getSiteConfig().gameplay.maxLives).toBe(10);
    resetSiteConfig();
    expect(getSiteConfig().gameplay.maxLives).toBe(5);
  });
});

describe('countryTrackingManager', () => {
  it('computes complete country intelligence dataset', async () => {
    const intel = await fetchCountryIntelligence('fr');

    expect(intel.totalCountriesMonitored).toBeGreaterThan(180);
    expect(intel.allCountries.length).toBeGreaterThan(180);
    expect(intel.mostRecognizedCountries.length).toBe(10);
    expect(intel.mostFailedCountries.length).toBe(10);

    // Highly recognized countries should be at the top
    const topIsos = intel.mostRecognizedCountries.map((c) => c.iso3);
    expect(topIsos.some((iso) => ['FRA', 'USA', 'JPN', 'ITA', 'BRA'].includes(iso))).toBe(true);

    // Well-known traps should be in the bottom
    const trapIsos = intel.mostFailedCountries.map((c) => c.iso3);
    expect(trapIsos.some((iso) => ['NRU', 'TUV', 'KIR', 'STP', 'LSO', 'BTN'].includes(iso))).toBe(true);

    // Continent stats should include major continents
    expect(intel.continentStats.length).toBeGreaterThanOrEqual(4);
    const continentNames = intel.continentStats.map((c) => c.continent);
    expect(continentNames).toContain('Europe');
    expect(continentNames).toContain('Africa');
  });
});
