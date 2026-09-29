import { supabase } from "../supabase";
import {
  adminGrantResources,
  calculateLevelForXp,
} from "../gamificationManager";
import type { Database } from "../database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface UpdateUserXpParams {
  xpDelta?: number;
  setXp?: number;
}

export interface UpdateUserXpResult {
  success: boolean;
  profile?: Profile;
  error?: string;
  previousXp?: number;
  newXp?: number;
  newLevel?: number;
  xpDelta?: number;
}

/**
 * Met à jour les points d'XP d'un joueur depuis l'interface d'administration.
 * Synchronise en temps réel :
 * - Supabase `profiles` (experience_points, level, monthly_score, updated_at)
 * - Déclencheurs Supabase auto_assign_titles_on_profile_update
 * - État gamification local (localStorage + événement terracost_gamification_updated)
 * - Événement global terracoast:profile_updated pour rafraîchir AuthContext, Navbar, etc.
 */
export async function adminUpdateUserXp(
  userId: string,
  params: UpdateUserXpParams,
  currentProfile?: Partial<Profile> | null
): Promise<UpdateUserXpResult> {
  if (!userId) {
    return { success: false, error: "Identifiant utilisateur manquant" };
  }

  try {
    let currentXp = currentProfile?.experience_points;
    let currentMonthly = currentProfile?.monthly_score ?? 0;

    // Si les données actuelles ne sont pas fournies ou incomplètes, les charger depuis Supabase
    if (typeof currentXp !== "number") {
      const { data: fetched, error: fetchErr } = await supabase
        .from("profiles")
        .select("experience_points, level, monthly_score")
        .eq("id", userId)
        .single();

      if (fetchErr) {
        return { success: false, error: fetchErr.message };
      }
      currentXp = fetched?.experience_points ?? 0;
      currentMonthly = fetched?.monthly_score ?? 0;
    }

    let newXp: number;
    let delta = 0;

    if (typeof params.setXp === "number") {
      newXp = Math.max(0, Math.floor(params.setXp));
      delta = newXp - currentXp;
    } else if (typeof params.xpDelta === "number") {
      delta = Math.floor(params.xpDelta);
      newXp = Math.max(0, currentXp + delta);
    } else {
      return { success: false, error: "Aucun montant d'XP spécifié" };
    }

    const newLevel = calculateLevelForXp(newXp);
    const newMonthly = Math.max(
      0,
      currentMonthly + (delta > 0 ? delta : params.setXp === 0 ? -currentMonthly : 0)
    );

    // 1. Sauvegarde dans Supabase (source de vérité principale)
    const { data: updatedProfile, error: updateErr } = await supabase
      .from("profiles")
      .update({
        experience_points: newXp,
        level: newLevel,
        monthly_score: newMonthly,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // 2. Synchronisation de l'état gamification local (localStorage + custom event)
    adminGrantResources(userId, {
      setXp: newXp,
    });

    // 3. Diffusion de l'événement global pour mise à jour instantanée de l'interface
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("terracoast:profile_updated", {
          detail: {
            userId,
            newXp,
            newLevel,
            newMonthly,
            profile: updatedProfile,
          },
        })
      );
    }

    return {
      success: true,
      profile: updatedProfile,
      previousXp: currentXp,
      newXp,
      newLevel,
      xpDelta: delta,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Erreur inattendue lors de la mise à jour de l'XP",
    };
  }
}
