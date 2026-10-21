-- Migration: RPC grant_arcade_rewards
-- Permet aux joueurs d'accumuler de l'XP et de progresser dans le classement mensuel
-- lors des parties de mini-jeux arcade (Geo-Detective, Silhouette, Higher/Lower, Chrono Rush, etc.)
-- et des missions quotidiennes de manière sécurisée (SECURITY DEFINER).

CREATE OR REPLACE FUNCTION public.grant_arcade_rewards(
  p_xp integer,
  p_score integer DEFAULT 0,
  p_game_mode text DEFAULT 'arcade'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_profile public.profiles%ROWTYPE;
  v_current_month text;
  v_needs_month_reset boolean;
  v_earned_xp integer;
  v_new_xp integer;
  v_new_level integer;
  v_leveled_up boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentification requise pour enregistrer les récompenses'
      USING ERRCODE = '42501';
  END IF;

  -- Bypasser la protection de profil pour cette fonction server-side sécurisée
  PERFORM set_config('app.bypass_profile_guard', 'on', true);

  -- Verrouillage du profil pour mise à jour atomique
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil utilisateur introuvable';
  END IF;

  -- Borner les gains d'XP (protection anti-abus : max 1000 XP par appel)
  v_earned_xp := GREATEST(0, LEAST(1000, COALESCE(p_xp, 0)));

  v_current_month := to_char(NOW(), 'YYYY-MM');
  v_needs_month_reset := COALESCE(v_profile.last_reset_month, '') <> v_current_month;

  IF v_needs_month_reset AND v_profile.last_reset_month IS NOT NULL THEN
    PERFORM public.finalize_monthly_ranking_if_needed(v_profile.last_reset_month);
  END IF;

  v_new_xp := COALESCE(v_profile.experience_points, 0) + v_earned_xp;
  v_new_level := FLOOR(v_new_xp / 100) + 1;
  v_leveled_up := v_new_level > COALESCE(v_profile.level, 1);

  UPDATE public.profiles
  SET
    experience_points = v_new_xp,
    level = v_new_level,
    monthly_score = CASE
      WHEN v_needs_month_reset THEN GREATEST(0, COALESCE(p_score, v_earned_xp))
      ELSE COALESCE(monthly_score, 0) + GREATEST(0, COALESCE(p_score, v_earned_xp))
    END,
    monthly_games_played = CASE
      WHEN v_needs_month_reset THEN 1
      ELSE COALESCE(monthly_games_played, 0) + 1
    END,
    last_reset_month = v_current_month,
    updated_at = NOW()
  WHERE id = v_profile.id;

  -- Vérification des nouveaux badges et titres débloqués
  PERFORM public.assign_earned_badges(v_profile.id);
  PERFORM public.assign_earned_titles(v_profile.id);

  RETURN jsonb_build_object(
    'success', true,
    'earned_xp', v_earned_xp,
    'new_experience_points', v_new_xp,
    'new_level', v_new_level,
    'leveled_up', v_leveled_up,
    'game_mode', p_game_mode
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.grant_arcade_rewards(integer, integer, text) TO authenticated;
