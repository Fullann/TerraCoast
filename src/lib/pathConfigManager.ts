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

export type StageDifficultyRating = "too_hard" | "balanced" | "too_easy";

export interface StageAnalytics {
  nodeId: string;
  attempts: number;
  completions: number;
  successRate: number; // 0 à 100 (%)
  averageScore: number; // 0 à 100 (%)
  difficultyRating: StageDifficultyRating;
  lastAttemptAt?: string;
}

const STORAGE_KEY_ASSIGNMENTS = "terracoast_path_node_assignments";
const STORAGE_KEY_UNITS = "terracoast_custom_path_units";
const STORAGE_KEY_ANALYTICS = "terracoast_path_stage_analytics";
export const PATH_CONFIG_EVENT = "terracost_path_config_updated";

export const BASELINE_STAGE_ANALYTICS: Record<string, StageAnalytics> = {
  // Unité 1 : Le Tour du Monde (Débutant)
  "u1-n1": {
    nodeId: "u1-n1",
    attempts: 342,
    completions: 318,
    successRate: 93,
    averageScore: 89,
    difficultyRating: "too_easy",
    lastAttemptAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  "u1-n2": {
    nodeId: "u1-n2",
    attempts: 285,
    completions: 231,
    successRate: 81,
    averageScore: 78,
    difficultyRating: "balanced",
    lastAttemptAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  "u1-n3": {
    nodeId: "u1-n3",
    attempts: 251,
    completions: 188,
    successRate: 75,
    averageScore: 74,
    difficultyRating: "balanced",
    lastAttemptAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
  },
  "u1-boss": {
    nodeId: "u1-boss",
    attempts: 228,
    completions: 107,
    successRate: 47,
    averageScore: 54,
    difficultyRating: "too_hard",
    lastAttemptAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
  },

  // Unité 2 : Trésors & Capitales d'Europe
  "u2-n1": {
    nodeId: "u2-n1",
    attempts: 198,
    completions: 172,
    successRate: 87,
    averageScore: 83,
    difficultyRating: "too_easy",
    lastAttemptAt: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
  },
  "u2-n2": {
    nodeId: "u2-n2",
    attempts: 184,
    completions: 132,
    successRate: 72,
    averageScore: 71,
    difficultyRating: "balanced",
    lastAttemptAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  "u2-n3": {
    nodeId: "u2-n3",
    attempts: 168,
    completions: 104,
    successRate: 62,
    averageScore: 66,
    difficultyRating: "balanced",
    lastAttemptAt: new Date(Date.now() - 1000 * 60 * 220).toISOString(),
  },
  "u2-boss": {
    nodeId: "u2-boss",
    attempts: 152,
    completions: 65,
    successRate: 43,
    averageScore: 49,
    difficultyRating: "too_hard",
    lastAttemptAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
  },

  // Unité 3 : Terres Sauvages d'Amérique
  "u3-n1": {
    nodeId: "u3-n1",
    attempts: 140,
    completions: 111,
    successRate: 79,
    averageScore: 77,
    difficultyRating: "balanced",
    lastAttemptAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
  "u3-n2": {
    nodeId: "u3-n2",
    attempts: 125,
    completions: 81,
    successRate: 65,
    averageScore: 67,
    difficultyRating: "balanced",
    lastAttemptAt: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
  },
  "u3-n3": {
    nodeId: "u3-n3",
    attempts: 115,
    completions: 61,
    successRate: 53,
    averageScore: 59,
    difficultyRating: "balanced",
    lastAttemptAt: new Date(Date.now() - 1000 * 60 * 490).toISOString(),
  },
  "u3-boss": {
    nodeId: "u3-boss",
    attempts: 104,
    completions: 40,
    successRate: 38,
    averageScore: 46,
    difficultyRating: "too_hard",
    lastAttemptAt: new Date(Date.now() - 1000 * 60 * 560).toISOString(),
  },

  // Unité 4 : Mystères d'Asie & Océanie
  "u4-n1": {
    nodeId: "u4-n1",
    attempts: 96,
    completions: 74,
    successRate: 77,
    averageScore: 75,
    difficultyRating: "balanced",
    lastAttemptAt: new Date(Date.now() - 1000 * 60 * 620).toISOString(),
  },
  "u4-n2": {
    nodeId: "u4-n2",
    attempts: 88,
    completions: 51,
    successRate: 58,
    averageScore: 62,
    difficultyRating: "balanced",
    lastAttemptAt: new Date(Date.now() - 1000 * 60 * 700).toISOString(),
  },
  "u4-n3": {
    nodeId: "u4-n3",
    attempts: 80,
    completions: 41,
    successRate: 51,
    averageScore: 58,
    difficultyRating: "balanced",
    lastAttemptAt: new Date(Date.now() - 1000 * 60 * 810).toISOString(),
  },
  "u4-boss": {
    nodeId: "u4-boss",
    attempts: 73,
    completions: 25,
    successRate: 34,
    averageScore: 42,
    difficultyRating: "too_hard",
    lastAttemptAt: new Date(Date.now() - 1000 * 60 * 950).toISOString(),
  },
};

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
  removeStoredString(STORAGE_KEY_ANALYTICS);
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

/* =========================================================================
   3. GESTION DES ANALYTIQUES DU PARCOURS (SUCCESS RATE, TENTATIVES, DIFFICULTÉ)
   ========================================================================= */

/**
 * Calcule l'évaluation qualitative de difficulté selon le taux de réussite
 * - < 50%  : "too_hard"  (🔴 Trop difficile - bloque les joueurs)
 * - 50%-85%: "balanced"  (🟢 Équilibré - progression stimulante)
 * - > 85%  : "too_easy"  (🟡 Trop facile - manque de défi)
 */
export function computeDifficultyRating(successRate: number): StageDifficultyRating {
  if (successRate < 50) return "too_hard";
  if (successRate > 85) return "too_easy";
  return "balanced";
}

/**
 * Récupère l'ensemble des analytiques de toutes les étapes du parcours
 */
export function getAllPathAnalytics(): Record<string, StageAnalytics> {
  const merged: Record<string, StageAnalytics> = { ...BASELINE_STAGE_ANALYTICS };
  try {
    const raw = getStoredString(STORAGE_KEY_ANALYTICS);
    if (raw) {
      const parsed = JSON.parse(raw);
      Object.assign(merged, parsed);
    }
  } catch (err) {
    console.error("Erreur lecture analytiques parcours:", err);
  }
  return merged;
}

/**
 * Récupère les métriques analytiques pour une étape précise
 */
export function getPathStageAnalytics(nodeId: string): StageAnalytics {
  const all = getAllPathAnalytics();
  if (all[nodeId]) {
    return all[nodeId];
  }
  return {
    nodeId,
    attempts: 0,
    completions: 0,
    successRate: 0,
    averageScore: 0,
    difficultyRating: "balanced",
  };
}

/**
 * Enregistre une tentative de joueur sur une étape donnée
 */
export function recordPathStageAttempt(
  nodeId: string,
  score: number,
  isSuccess: boolean
): StageAnalytics {
  const all = getAllPathAnalytics();
  const existing = all[nodeId] || {
    nodeId,
    attempts: 0,
    completions: 0,
    successRate: 0,
    averageScore: 0,
    difficultyRating: "balanced",
  };

  const nextAttempts = existing.attempts + 1;
  const nextCompletions = existing.completions + (isSuccess ? 1 : 0);
  const nextSuccessRate = Math.round((nextCompletions / nextAttempts) * 100);
  const nextAverageScore = Math.round(
    (existing.averageScore * existing.attempts + score) / nextAttempts
  );

  const updated: StageAnalytics = {
    nodeId,
    attempts: nextAttempts,
    completions: nextCompletions,
    successRate: nextSuccessRate,
    averageScore: nextAverageScore,
    difficultyRating: computeDifficultyRating(nextSuccessRate),
    lastAttemptAt: new Date().toISOString(),
  };

  all[nodeId] = updated;

  try {
    setStoredString(STORAGE_KEY_ANALYTICS, JSON.stringify(all));
  } catch (err) {
    console.error("Erreur enregistrement analytiques parcours:", err);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(PATH_CONFIG_EVENT, {
        detail: { nodeId, analytics: updated, action: "recordAttempt" },
      })
    );
  }

  return updated;
}

/**
 * Réinitialise les analytiques personnalisées (revient au baseline)
 */
export function resetPathStageAnalytics(): void {
  try {
    removeStoredString(STORAGE_KEY_ANALYTICS);
  } catch (err) {
    console.error("Erreur reset analytiques parcours:", err);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(PATH_CONFIG_EVENT, { detail: { action: "resetAnalytics" } })
    );
  }
}

