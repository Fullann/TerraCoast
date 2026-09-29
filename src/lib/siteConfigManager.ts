/**
 * Site Configuration & Live Personalization Manager for TerraCoast
 * Manages site-wide announcements, active events (e.g. Double XP),
 * featured country of the week, gameplay balancing and visual themes.
 */

export type AnnouncementVariant = 'info' | 'success' | 'warning' | 'alert' | 'celebration';

export interface SiteAnnouncement {
  id: string;
  enabled: boolean;
  message: string;
  badgeText: string;
  variant: AnnouncementVariant;
  actionText: string;
  actionUrl: string;
  dismissible: boolean;
}

export interface FeaturedCountryConfig {
  iso3: string | null;
  name: string;
  flagEmoji: string;
  headline: string;
  xpMultiplier: number;
  gemBonus: number;
  isActive: boolean;
}

export interface GameplayConfig {
  globalXpMultiplier: number; // 1, 1.5, 2, 3
  eventTitle: string;
  isEventActive: boolean;
  dailyStreakGems: number;
  victoryGemsReward: number;
  conquestAccuracyThreshold?: number; // 70, 75, 80, 85, 90 (default 80%)
  quizTimerSeconds?: number; // 0 (unlimited), 15, 20, 30
  soundEffectsEnabled?: boolean;
  maxLives?: number; // 5, 10, -1 (unlimited) - maintained for backwards compatibility
  heartRechargeMinutes?: number; // 15, 30, 60 - maintained for backwards compatibility
}

export interface VisualThemeConfig {
  defaultGlobeTheme: 'realistic' | 'neon' | 'pastel' | 'night' | 'satellite';
  featuredContinent: string; // 'all' or 'Europe', 'Asia', 'Africa', 'Americas', 'Oceania'
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export interface SiteConfig {
  announcement: SiteAnnouncement;
  featuredCountry: FeaturedCountryConfig;
  gameplay: GameplayConfig;
  theme: VisualThemeConfig;
  updatedAt: string;
  updatedBy?: string;
}

const STORAGE_KEY = 'terracost_site_config_v1';
const DISMISSED_ANNOUNCEMENTS_KEY = 'terracost_dismissed_announcements_v1';

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  announcement: {
    id: 'welcome-season-2',
    enabled: true,
    message: '🎉 Bienvenue sur TerraCoast ! Découvrez le comparateur de pays en taille réelle et les nouveaux duels !',
    badgeText: 'NOUVEAU',
    variant: 'celebration',
    actionText: 'Explorer l’Atlas',
    actionUrl: '/atlas',
    dismissible: true,
  },
  featuredCountry: {
    iso3: 'JPN',
    name: 'Japon',
    flagEmoji: '🇯🇵',
    headline: 'Pays de la Semaine : Explorez l’archipel nippon et remportez +50% d’XP !',
    xpMultiplier: 1.5,
    gemBonus: 25,
    isActive: true,
  },
  gameplay: {
    globalXpMultiplier: 1,
    eventTitle: 'Saison Géographique Standard',
    isEventActive: false,
    dailyStreakGems: 25,
    victoryGemsReward: 15,
    conquestAccuracyThreshold: 80,
    quizTimerSeconds: 20,
    soundEffectsEnabled: true,
    maxLives: 5,
    heartRechargeMinutes: 30,
  },
  theme: {
    defaultGlobeTheme: 'realistic',
    featuredContinent: 'all',
    maintenanceMode: false,
    maintenanceMessage: 'TerraCoast fait peau neuve ! Nos cartographes reviennent dans quelques instants.',
  },
  updatedAt: new Date().toISOString(),
};

/**
 * Returns the current active site configuration
 */
export function getSiteConfig(): SiteConfig {
  if (typeof localStorage === 'undefined') return DEFAULT_SITE_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SITE_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SITE_CONFIG,
      ...parsed,
      announcement: { ...DEFAULT_SITE_CONFIG.announcement, ...(parsed.announcement || {}) },
      featuredCountry: { ...DEFAULT_SITE_CONFIG.featuredCountry, ...(parsed.featuredCountry || {}) },
      gameplay: { ...DEFAULT_SITE_CONFIG.gameplay, ...(parsed.gameplay || {}) },
      theme: { ...DEFAULT_SITE_CONFIG.theme, ...(parsed.theme || {}) },
    };
  } catch (err) {
    console.warn('Failed to parse site config from storage:', err);
    return DEFAULT_SITE_CONFIG;
  }
}

/**
 * Updates the site configuration and notifies all open tabs and components
 */
export function updateSiteConfig(changes: Partial<SiteConfig>): SiteConfig {
  const current = getSiteConfig();
  const next: SiteConfig = {
    ...current,
    ...changes,
    announcement: changes.announcement
      ? { ...current.announcement, ...changes.announcement }
      : current.announcement,
    featuredCountry: changes.featuredCountry
      ? { ...current.featuredCountry, ...changes.featuredCountry }
      : current.featuredCountry,
    gameplay: changes.gameplay
      ? { ...current.gameplay, ...changes.gameplay }
      : current.gameplay,
    theme: changes.theme
      ? { ...current.theme, ...changes.theme }
      : current.theme,
    updatedAt: new Date().toISOString(),
  };

  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.error('Failed to save site config to storage:', err);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('terracost_site_config_updated', { detail: next })
    );
  }

  return next;
}

/**
 * Resets the site configuration to factory defaults
 */
export function resetSiteConfig(): SiteConfig {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SITE_CONFIG));
    } catch (err) {
      console.error('Failed to reset site config:', err);
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('terracost_site_config_updated', { detail: DEFAULT_SITE_CONFIG })
    );
  }
  return DEFAULT_SITE_CONFIG;
}

/**
 * Checks if a specific announcement has been dismissed by the current user
 */
export function isAnnouncementDismissed(announcementId: string): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    const raw = localStorage.getItem(DISMISSED_ANNOUNCEMENTS_KEY);
    if (!raw) return false;
    const list: string[] = JSON.parse(raw);
    return Array.isArray(list) && list.includes(announcementId);
  } catch {
    return false;
  }
}

/**
 * Dismisses an announcement for the current user
 */
export function dismissAnnouncement(announcementId: string): void {
  if (typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem(DISMISSED_ANNOUNCEMENTS_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(announcementId)) {
        list.push(announcementId);
        localStorage.setItem(DISMISSED_ANNOUNCEMENTS_KEY, JSON.stringify(list));
      }
    } catch (err) {
      console.warn('Failed to dismiss announcement in storage:', err);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('terracost_announcement_dismissed', { detail: announcementId }));
  }
}
