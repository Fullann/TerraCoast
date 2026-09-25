/**
 * Path Configuration Manager
 * Gère l'attribution personnalisée des quiz sur les étapes (nœuds) du parcours d'apprentissage,
 * ainsi que la création, modification et suppression dynamique d'unités et d'étapes de parcours.
 */

import { supabase } from "./supabase";

export interface PathNode {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  xpReward: number;
  gemReward: number;
  stars: number; // 0, 1, 2, 3
  status: "locked" | "active" | "completed";
  isBoss?: boolean;
  quizIdOrFilter?: string; // fallback query param for quiz selection
  assignedQuizId?: string;
  assignedQuizTitle?: string;
  hasCustomQuiz?: boolean;
  isCustom?: boolean;
}

export interface PathChest {
  id: string;
  title: string;
  gemReward: number;
  xpReward: number;
  claimed: boolean;
  unlocked: boolean;
}

export interface PathUnit {
  id: string;
  unitNumber: number;
  title: string;
  description: string;
  themeColor: "green" | "blue" | "amber" | "purple" | "rose" | "sky" | "teal";
  badgeIcon: string;
  nodes: PathNode[];
  chest: PathChest;
  isCustom?: boolean;
}

export interface PathNodeAssignment {
  nodeId: string;
  quizId: string;
  quizTitle: string;
  quizDescription?: string;
  category?: string;
  difficulty?: string;
  assignedAt: string;
}

const STORAGE_KEY_ASSIGNMENTS = "terracoast_path_node_assignments";
const STORAGE_KEY_UNITS = "terracoast_custom_path_units";
export const PATH_CONFIG_EVENT = "terracost_path_config_updated";

const memoryStore = new Map<string, string>();

function getStoredString(key: string): string | null {
  if (typeof localStorage !== "undefined") {
    try {
      return localStorage.getItem(key);
    } catch {}
  }
  return memoryStore.get(key) || null;
}

function setStoredString(key: string, val: string): void {
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(key, val);
      return;
    } catch {}
  }
  memoryStore.set(key, val);
}

function removeStoredString(key: string): void {
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(key);
      return;
    } catch {}
  }
  memoryStore.delete(key);
}

export function resetPathConfigMemory(): void {
  memoryStore.clear();
  removeStoredString(STORAGE_KEY_ASSIGNMENTS);
  removeStoredString(STORAGE_KEY_UNITS);
}

/* =========================================================================
   1. GESTION DES ATTRIBUTIONS DE QUIZ PAR ÉTAPE (NODE ASSIGNMENTS)
   ========================================================================= */

/**
 * Récupère l'ensemble des attributions actuelles des nœuds du parcours
 */
export function getAllPathAssignments(): Record<string, PathNodeAssignment> {
  try {
    const raw = getStoredString(STORAGE_KEY_ASSIGNMENTS);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error("Erreur lors de la lecture des attributions du parcours:", err);
    return {};
  }
}

/**
 * Récupère l'attribution pour un nœud spécifique (ex: "u1-n1", "u1-boss")
 */
export function getPathAssignment(nodeId: string): PathNodeAssignment | null {
  const all = getAllPathAssignments();
  return all[nodeId] || null;
}

/**
 * Définit ou met à jour le quiz assigné à un nœud du parcours
 */
export function setPathAssignment(
  nodeId: string,
  assignment: {
    quizId: string;
    quizTitle: string;
    quizDescription?: string;
    category?: string;
    difficulty?: string;
  }
): PathNodeAssignment {
  const all = getAllPathAssignments();
  const entry: PathNodeAssignment = {
    nodeId,
    quizId: assignment.quizId,
    quizTitle: assignment.quizTitle,
    quizDescription: assignment.quizDescription,
    category: assignment.category,
    difficulty: assignment.difficulty,
    assignedAt: new Date().toISOString(),
  };

  all[nodeId] = entry;

  try {
    setStoredString(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(all));
  } catch (err) {
    console.error("Erreur sauvegarde attribution parcours:", err);
  }

  // Notifier l'ensemble des composants de l'application
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(PATH_CONFIG_EVENT, { detail: { nodeId, assignment: entry } })
    );
  }

  // Enregistrer l'événement admin si connecté
  supabase.auth.getUser().then(({ data }) => {
    if (data.user) {
      supabase.rpc("log_admin_event", {
        p_action: "assign_path_quiz",
        p_entity_type: "path_node",
        p_entity_id: nodeId,
        p_details: {
          quiz_id: assignment.quizId,
          quiz_title: assignment.quizTitle,
        } as any,
      }).then(() => {});
    }
  });

  return entry;
}

/**
 * Supprime l'attribution personnalisée pour rétablir le quiz officiel par défaut
 */
export function removePathAssignment(nodeId: string): void {
  const all = getAllPathAssignments();
  if (all[nodeId]) {
    delete all[nodeId];
    try {
      setStoredString(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(all));
    } catch (err) {
      console.error("Erreur suppression attribution parcours:", err);
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(PATH_CONFIG_EVENT, { detail: { nodeId, assignment: null } })
      );
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.rpc("log_admin_event", {
          p_action: "reset_path_quiz_to_default",
          p_entity_type: "path_node",
          p_entity_id: nodeId,
          p_details: {} as any,
        }).then(() => {});
      }
    });
  }
}

/**
 * Réinitialise toutes les attributions de parcours aux quiz par défaut
 */
export function resetAllPathAssignments(): void {
  try {
    removeStoredString(STORAGE_KEY_ASSIGNMENTS);
  } catch (err) {
    console.error("Erreur reset all path assignments:", err);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(PATH_CONFIG_EVENT, { detail: { resetAll: true } })
    );
  }
}

/* =========================================================================
   2. GESTION DES UNITÉS DU PARCOURS (CUSTOM UNITS CRUD)
   ========================================================================= */

/**
 * Récupère les unités personnalisées créées ou modifiées par l'administrateur
 */
export function getCustomUnits(): PathUnit[] {
  try {
    const raw = getStoredString(STORAGE_KEY_UNITS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("Erreur lecture custom units:", err);
    return [];
  }
}

/**
 * Sauvegarde ou met à jour une unité personnalisée
 */
export function saveCustomUnit(unit: PathUnit): void {
  const units = getCustomUnits();
  const index = units.findIndex((u) => u.id === unit.id);
  const toSave: PathUnit = {
    ...unit,
    isCustom: true,
  };

  if (index >= 0) {
    units[index] = toSave;
  } else {
    units.push(toSave);
  }

  try {
    setStoredString(STORAGE_KEY_UNITS, JSON.stringify(units));
  } catch (err) {
    console.error("Erreur sauvegarde custom unit:", err);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(PATH_CONFIG_EVENT, { detail: { unitId: unit.id, action: "saveUnit" } })
    );
  }

  supabase.auth.getUser().then(({ data }) => {
    if (data.user) {
      supabase.rpc("log_admin_event", {
        p_action: index >= 0 ? "update_path_unit" : "create_path_unit",
        p_entity_type: "path_unit",
        p_entity_id: unit.id,
        p_details: {
          title: unit.title,
          unitNumber: unit.unitNumber,
          nodes_count: unit.nodes.length,
        } as any,
      }).then(() => {});
    }
  });
}

/**
 * Supprime une unité personnalisée
 */
export function deleteCustomUnit(unitId: string): void {
  const units = getCustomUnits();
  const nextUnits = units.filter((u) => u.id !== unitId);

  try {
    setStoredString(STORAGE_KEY_UNITS, JSON.stringify(nextUnits));
  } catch (err) {
    console.error("Erreur suppression custom unit:", err);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(PATH_CONFIG_EVENT, { detail: { unitId, action: "deleteUnit" } })
    );
  }

  supabase.auth.getUser().then(({ data }) => {
    if (data.user) {
      supabase.rpc("log_admin_event", {
        p_action: "delete_path_unit",
        p_entity_type: "path_unit",
        p_entity_id: unitId,
        p_details: {} as any,
      }).then(() => {});
    }
  });
}

/**
 * Ajoute une étape à une unité (qu'elle soit de base ou personnalisée)
 */
export function addStageToUnit(
  unitId: string,
  node: PathNode,
  baseUnitsFallback: PathUnit[]
): void {
  const customUnits = getCustomUnits();
  let targetUnit = customUnits.find((u) => u.id === unitId);

  if (!targetUnit) {
    const baseUnit = baseUnitsFallback.find((u) => u.id === unitId);
    if (!baseUnit) return;
    targetUnit = JSON.parse(JSON.stringify(baseUnit));
    customUnits.push(targetUnit!);
  }

  targetUnit!.nodes.push({
    ...node,
    isCustom: true,
  });

  try {
    setStoredString(STORAGE_KEY_UNITS, JSON.stringify(customUnits));
  } catch (err) {
    console.error("Erreur addStageToUnit:", err);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(PATH_CONFIG_EVENT, { detail: { unitId, nodeId: node.id, action: "addStage" } })
    );
  }
}

/**
 * Supprime une étape d'une unité
 */
export function removeStageFromUnit(
  unitId: string,
  nodeId: string,
  baseUnitsFallback: PathUnit[]
): void {
  const customUnits = getCustomUnits();
  let targetUnit = customUnits.find((u) => u.id === unitId);

  if (!targetUnit) {
    const baseUnit = baseUnitsFallback.find((u) => u.id === unitId);
    if (!baseUnit) return;
    targetUnit = JSON.parse(JSON.stringify(baseUnit));
    customUnits.push(targetUnit!);
  }

  targetUnit!.nodes = targetUnit!.nodes.filter((n) => n.id !== nodeId);

  try {
    setStoredString(STORAGE_KEY_UNITS, JSON.stringify(customUnits));
  } catch (err) {
    console.error("Erreur removeStageFromUnit:", err);
  }

  // Nettoyer aussi une éventuelle attribution de quiz pour ce nœud supprimé
  removePathAssignment(nodeId);

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(PATH_CONFIG_EVENT, { detail: { unitId, nodeId, action: "removeStage" } })
    );
  }
}

/**
 * Réinitialise complètement toutes les unités personnalisées pour revenir au parcours d'origine
 */
export function resetCustomUnits(): void {
  try {
    removeStoredString(STORAGE_KEY_UNITS);
  } catch (err) {
    console.error("Erreur reset custom units:", err);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(PATH_CONFIG_EVENT, { detail: { action: "resetAllUnits" } })
    );
  }
}
