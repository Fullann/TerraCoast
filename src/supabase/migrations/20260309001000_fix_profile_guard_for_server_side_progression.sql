-- Fix: allow trusted server-side functions to update protected profile fields
-- by using an explicit local GUC bypass flag.

CREATE OR REPLACE FUNCTION public.enforce_profiles_self_update_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_is_admin boolean := false;
  old_protected jsonb;
  new_protected jsonb;
BEGIN
  -- Explicit local bypass for trusted SECURITY DEFINER functions.
  IF COALESCE(current_setting('app.bypass_profile_guard', true), '') = 'on' THEN
    RETURN NEW;
  END IF;

  -- Service-role / backend operations are allowed.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  ) INTO actor_is_admin;

  -- Admins keep full update capability.
  IF actor_is_admin THEN
    RETURN NEW;
  END IF;

  -- Non-admins can only update their own row (RLS should already enforce this).
  IF auth.uid() <> OLD.id THEN
    RAISE EXCEPTION 'Unauthorized profile update'
      USING ERRCODE = '42501';
  END IF;

  -- Allowlist of columns a regular user may change on their own profile.
  old_protected := to_jsonb(OLD) - ARRAY[
    'pseudo',
    'email_newsletter',
    'language',
    'show_all_languages',
    'terms_accepted_at',
    'privacy_accepted_at',
    'updated_at'
  ];

  new_protected := to_jsonb(NEW) - ARRAY[
    'pseudo',
    'email_newsletter',
    'language',
    'show_all_languages',
    'terms_accepted_at',
    'privacy_accepted_at',
    'updated_at'
  ];

  IF old_protected IS DISTINCT FROM new_protected THEN
    RAISE EXCEPTION 'Forbidden profile fields update'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_game_session_and_progress(
  p_session_id uuid,
  p_score integer,
  p_accuracy numeric,
  p_time_taken_seconds integer,
  p_correct_answers integer,
  p_total_questions integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.game_sessions%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_quiz public.quizzes%ROWTYPE;
  v_current_month text;
  v_needs_month_reset boolean;
  v_should_give_xp boolean;
  v_earned_xp integer := 0;
  v_new_xp integer;
  v_new_level integer;
  v_leveled_up boolean;
BEGIN
  SELECT * INTO v_session
  FROM public.game_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session introuvable';
  END IF;

  IF v_session.player_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Session non autorisée';
  END IF;

  IF COALESCE(v_session.completed, false) = true THEN
    SELECT * INTO v_profile
    FROM public.profiles
    WHERE id = v_session.player_id;

    RETURN jsonb_build_object(
      'earned_xp', 0,
      'new_experience_points', COALESCE(v_profile.experience_points, 0),
      'new_level', COALESCE(v_profile.level, 1),
      'leveled_up', false,
      'should_give_xp', false
    );
  END IF;

  UPDATE public.game_sessions
  SET
    score = GREATEST(0, LEAST(100, COALESCE(p_score, 0))),
    accuracy_percentage = GREATEST(0, LEAST(100, COALESCE(p_accuracy, 0))),
    time_taken_seconds = GREATEST(0, COALESCE(p_time_taken_seconds, 0)),
    completed = true,
    completed_at = NOW(),
    correct_answers = GREATEST(0, COALESCE(p_correct_answers, 0)),
    total_questions = GREATEST(0, COALESCE(p_total_questions, 0))
  WHERE id = p_session_id;

  SELECT * INTO v_quiz
  FROM public.quizzes
  WHERE id = v_session.quiz_id;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = v_session.player_id
  FOR UPDATE;

  v_current_month := to_char(NOW(), 'YYYY-MM');
  v_needs_month_reset := COALESCE(v_profile.last_reset_month, '') <> v_current_month;
  v_should_give_xp := COALESCE(v_quiz.is_public, false) OR COALESCE(v_quiz.is_global, false);

  IF v_needs_month_reset AND v_profile.last_reset_month IS NOT NULL THEN
    PERFORM public.finalize_monthly_ranking_if_needed(v_profile.last_reset_month);
  END IF;

  IF v_should_give_xp THEN
    v_earned_xp := GREATEST(0, LEAST(10, ROUND(COALESCE(p_score, 0) / 10.0)::integer));
  END IF;

  v_new_xp := COALESCE(v_profile.experience_points, 0) + v_earned_xp;
  v_new_level := FLOOR(v_new_xp / 100) + 1;
  v_leveled_up := v_new_level > COALESCE(v_profile.level, 1);

  -- Trusted bypass for protected profile fields update inside this RPC.
  PERFORM set_config('app.bypass_profile_guard', 'on', true);

  UPDATE public.profiles
  SET
    experience_points = v_new_xp,
    level = v_new_level,
    monthly_score = CASE
      WHEN v_needs_month_reset THEN GREATEST(0, COALESCE(p_score, 0))
      ELSE COALESCE(monthly_score, 0) + GREATEST(0, COALESCE(p_score, 0))
    END,
    monthly_games_played = CASE
      WHEN v_needs_month_reset THEN 1
      ELSE COALESCE(monthly_games_played, 0) + 1
    END,
    last_reset_month = v_current_month,
    updated_at = NOW()
  WHERE id = v_profile.id;

  PERFORM public.assign_earned_badges(v_profile.id);
  PERFORM public.assign_earned_titles(v_profile.id);

  RETURN jsonb_build_object(
    'earned_xp', v_earned_xp,
    'new_experience_points', v_new_xp,
    'new_level', v_new_level,
    'leveled_up', v_leveled_up,
    'should_give_xp', v_should_give_xp
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.award_random_bonus_on_duel_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed'
     AND COALESCE(OLD.status, '') <> 'completed'
     AND COALESCE(NEW.random_bonus_enabled, false) = true
     AND COALESCE(NEW.bonus_awarded, false) = false
     AND NEW.winner_id IS NOT NULL THEN
    -- Trusted bypass for protected profile fields update inside trigger.
    PERFORM set_config('app.bypass_profile_guard', 'on', true);

    UPDATE public.profiles
    SET experience_points = COALESCE(experience_points, 0) + GREATEST(NEW.bonus_xp, 0)
    WHERE id = NEW.winner_id;

    UPDATE public.duels
    SET bonus_awarded = true
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
