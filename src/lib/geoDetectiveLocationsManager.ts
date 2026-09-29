import {
  SATELLITE_LOCATIONS,
  type SatelliteLocation,
  type SatelliteCategory,
} from "./geoDetectiveData";
import { supabase } from "./supabase";

export interface StoredGeoDetectiveConfig {
  version: number;
  customLocations: SatelliteLocation[];
  editedLocations: Record<string, Partial<SatelliteLocation>>;
  deletedLocationIds: string[];
  updatedAt: string;
}

const STORAGE_KEY = "terracost_geodetective_custom_locations_v1";
export const LOCATIONS_UPDATED_EVENT = "terracost_geodetective_locations_updated";

const DEFAULT_CONFIG: StoredGeoDetectiveConfig = {
  version: 1,
  customLocations: [],
  editedLocations: {},
  deletedLocationIds: [],
  updatedAt: new Date().toISOString(),
};

const memoryStore = new Map<string, string>();

function getRawStorage(key: string): string | null {
  try {
    if (typeof localStorage !== "undefined" && typeof localStorage.getItem === "function") {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch {
    // fallback
  }
  return memoryStore.get(key) || null;
}

function setRawStorage(key: string, value: string): void {
  memoryStore.set(key, value);
  try {
    if (typeof localStorage !== "undefined" && typeof localStorage.setItem === "function") {
      localStorage.setItem(key, value);
    }
  } catch {
    // fallback
  }
}

function getStoredConfig(): StoredGeoDetectiveConfig {
  try {
    const raw = getRawStorage(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      version: parsed.version || 1,
      customLocations: Array.isArray(parsed.customLocations) ? parsed.customLocations : [],
      editedLocations: parsed.editedLocations && typeof parsed.editedLocations === "object" ? parsed.editedLocations : {},
      deletedLocationIds: Array.isArray(parsed.deletedLocationIds) ? parsed.deletedLocationIds : [],
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch (err) {
    console.warn("Failed to load geo-detective custom locations from storage:", err);
    return DEFAULT_CONFIG;
  }
}

function saveStoredConfig(config: StoredGeoDetectiveConfig): void {
  try {
    config.updatedAt = new Date().toISOString();
    setRawStorage(STORAGE_KEY, JSON.stringify(config));
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(
        new CustomEvent(LOCATIONS_UPDATED_EVENT, { detail: config })
      );
    }
  } catch (err) {
    console.warn("Failed to save geo-detective custom locations:", err);
  }
}

/**
 * Logue une action d'administration pour la traçabilité
 */
async function logAdminAction(action: string, entityId: string, details: Record<string, unknown> = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("admin_activity_logs").insert({
        actor_id: user.id,
        action,
        entity_type: "geodetective_location",
        entity_id: entityId,
        details_json: details,
      });
    }
  } catch {
    // Non-blocking log
  }
}

/**
 * Récupère tous les lieux actifs pour le gameplay (par défaut + custom, moins supprimés, avec modifications)
 */
export function getActiveGeoDetectiveLocations(): SatelliteLocation[] {
  const config = getStoredConfig();
  const deletedSet = new Set(config.deletedLocationIds);

  // 1. Lieux par défaut (filtrés et modifiés)
  const defaultLocations = SATELLITE_LOCATIONS.filter((loc) => !deletedSet.has(loc.id)).map(
    (loc) => {
      const overrides = config.editedLocations[loc.id];
      if (overrides) {
        return { ...loc, ...overrides };
      }
      return loc;
    }
  );

  // 2. Lieux personnalisés créés par l'admin
  const customLocations = config.customLocations.filter((loc) => !deletedSet.has(loc.id)).map(
    (loc) => {
      const overrides = config.editedLocations[loc.id];
      if (overrides) {
        return { ...loc, ...overrides };
      }
      return loc;
    }
  );

  return [...defaultLocations, ...customLocations];
}

export interface AdminLocationView extends SatelliteLocation {
  isDefault: boolean;
  isCustom: boolean;
  isEdited: boolean;
  isDeleted: boolean;
}

/**
 * Récupère la liste exhaustive de tous les lieux pour l'interface admin
 */
export function getAllLocationsForAdmin(): AdminLocationView[] {
  const config = getStoredConfig();
  const deletedSet = new Set(config.deletedLocationIds);
  const result: AdminLocationView[] = [];

  // Lieux par défaut
  for (const loc of SATELLITE_LOCATIONS) {
    const isDeleted = deletedSet.has(loc.id);
    const overrides = config.editedLocations[loc.id];
    const isEdited = !!overrides;
    const finalLoc = overrides ? { ...loc, ...overrides } : loc;

    result.push({
      ...finalLoc,
      isDefault: true,
      isCustom: false,
      isEdited,
      isDeleted,
    });
  }

  // Lieux personnalisés
  for (const loc of config.customLocations) {
    const isDeleted = deletedSet.has(loc.id);
    const overrides = config.editedLocations[loc.id];
    const isEdited = !!overrides;
    const finalLoc = overrides ? { ...loc, ...overrides } : loc;

    result.push({
      ...finalLoc,
      isDefault: false,
      isCustom: true,
      isEdited,
      isDeleted,
    });
  }

  return result;
}

/**
 * Ajoute un nouveau lieu / photo personnalisé
 */
export function addCustomGeoDetectiveLocation(
  data: Omit<SatelliteLocation, "id"> & { id?: string }
): SatelliteLocation {
  const config = getStoredConfig();
  const id =
    data.id?.trim() ||
    `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const newLocation: SatelliteLocation = {
    ...data,
    id,
  };

  config.customLocations.push(newLocation);
  saveStoredConfig(config);
  logAdminAction("create_geodetective_location", id, { name: data.name, country: data.country });

  return newLocation;
}

/**
 * Modifie un lieu existant (qu'il soit par défaut ou personnalisé)
 */
export function updateGeoDetectiveLocation(
  id: string,
  changes: Partial<SatelliteLocation>
): SatelliteLocation {
  const config = getStoredConfig();

  // Vérifier si c'est un lieu personnalisé
  const customIndex = config.customLocations.findIndex((l) => l.id === id);
  if (customIndex >= 0) {
    config.customLocations[customIndex] = {
      ...config.customLocations[customIndex],
      ...changes,
    };
  } else {
    // Si c'est un lieu par défaut, enregistrer dans editedLocations
    config.editedLocations[id] = {
      ...(config.editedLocations[id] || {}),
      ...changes,
    };
  }

  saveStoredConfig(config);
  logAdminAction("update_geodetective_location", id, changes);

  const active = getActiveGeoDetectiveLocations().find((l) => l.id === id);
  if (!active) {
    throw new Error(`Location with id ${id} not found after update`);
  }
  return active;
}

/**
 * Supprime un lieu (le marque comme supprimé s'il s'agit d'un lieu par défaut, ou l'enlève des custom)
 */
export function deleteGeoDetectiveLocation(id: string): void {
  const config = getStoredConfig();

  // Si c'est un custom, le retirer
  config.customLocations = config.customLocations.filter((l) => l.id !== id);

  // Marquer comme supprimé pour empêcher son apparition
  if (!config.deletedLocationIds.includes(id)) {
    config.deletedLocationIds.push(id);
  }

  // Nettoyer les éditions
  delete config.editedLocations[id];

  saveStoredConfig(config);
  logAdminAction("delete_geodetective_location", id);
}

/**
 * Restaure un lieu supprimé ou réinitialise les modifications sur un lieu par défaut
 */
export function restoreGeoDetectiveLocation(id: string): void {
  const config = getStoredConfig();

  config.deletedLocationIds = config.deletedLocationIds.filter((item) => item !== id);
  delete config.editedLocations[id];

  saveStoredConfig(config);
  logAdminAction("restore_geodetective_location", id);
}

/**
 * Réinitialise complètement tous les lieux à leur état par défaut d'origine
 */
export function resetAllGeoDetectiveLocations(keepCustom = false): void {
  const config = getStoredConfig();
  const nextConfig: StoredGeoDetectiveConfig = {
    version: 1,
    customLocations: keepCustom ? config.customLocations : [],
    editedLocations: {},
    deletedLocationIds: [],
    updatedAt: new Date().toISOString(),
  };

  saveStoredConfig(nextConfig);
  logAdminAction("reset_all_geodetective_locations", "all", { keepCustom });
}

/**
 * Exporte la configuration au format JSON
 */
export function exportGeoDetectiveLocationsJson(): string {
  const config = getStoredConfig();
  return JSON.stringify(config, null, 2);
}

/**
 * Importe une configuration depuis un JSON
 */
export function importGeoDetectiveLocationsJson(jsonStr: string): {
  success: boolean;
  count: number;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || typeof parsed !== "object") {
      return { success: false, count: 0, error: "Format JSON invalide" };
    }

    const customLocations: SatelliteLocation[] = Array.isArray(parsed.customLocations)
      ? parsed.customLocations
      : [];
    const editedLocations =
      parsed.editedLocations && typeof parsed.editedLocations === "object"
        ? parsed.editedLocations
        : {};
    const deletedLocationIds = Array.isArray(parsed.deletedLocationIds)
      ? parsed.deletedLocationIds
      : [];

    const newConfig: StoredGeoDetectiveConfig = {
      version: 1,
      customLocations,
      editedLocations,
      deletedLocationIds,
      updatedAt: new Date().toISOString(),
    };

    saveStoredConfig(newConfig);
    logAdminAction("import_geodetective_locations", "batch", {
      customCount: customLocations.length,
      editedCount: Object.keys(editedLocations).length,
      deletedCount: deletedLocationIds.length,
    });

    return {
      success: true,
      count: customLocations.length,
    };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      error: err?.message || "Erreur lors de la lecture du fichier JSON",
    };
  }
}
