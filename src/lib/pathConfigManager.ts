/**
 * Path Configuration Manager
 * Gère l'attribution personnalisée des quiz sur les étapes (nœuds) du parcours d'apprentissage.
 * Permet aux administrateurs de définir quel questionnaire est joué sur chaque étape du parcours.
 */

import { supabase } from "./supabase";

export interface PathNodeAssignment {
  nodeId: string;
  quizId: string;
  quizTitle: string;
  quizDescription?: string;
  category?: string;
  difficulty?: string;
  assignedAt: string;
}

const STORAGE_KEY = "terracoast_path_node_assignments";
export const PATH_CONFIG_EVENT = "terracost_path_config_updated";

/**
 * Récupère l'ensemble des attributions actuelles des nœuds du parcours
 */
export function getAllPathAssignments(): Record<string, PathNodeAssignment> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
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
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("Erreur reset all path assignments:", err);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(PATH_CONFIG_EVENT, { detail: { resetAll: true } })
    );
  }
}
