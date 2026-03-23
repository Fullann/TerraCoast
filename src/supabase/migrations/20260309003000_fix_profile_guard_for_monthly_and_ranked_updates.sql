-- Fix: ensure all trusted server-side writers to public.profiles
-- enable the explicit profile guard bypass in their transaction.

CREATE OR REPLACE FUNCTION public.finalize_monthly_ranking_if_needed(p_month text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_month IS NULL OR p_month = '' THEN
    RETURN;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('monthly_ranking:' || p_month));

  -- Trusted bypass for protected profile fields update inside this function.
  PERFORM set_config('app.bypass_profile_guard', 'on', true);

  WITH ranked AS (
    SELECT
      id AS user_id,
      monthly_score AS final_score,
      ROW_NUMBER() OVER (ORDER BY monthly_score DESC, created_at ASC) AS final_rank
    FROM public.profiles
    WHERE COALESCE(monthly_games_played, 0) > 0
      AND COALESCE(monthly_score, 0) > 0
    ORDER BY monthly_score DESC, created_at ASC
    LIMIT 10
  ),
  inserted_history AS (
    INSERT INTO public.monthly_rankings_history (user_id, month, final_rank, final_score)
    SELECT user_id, p_month, final_rank, final_score
    FROM ranked
    ON CONFLICT (user_id, month) DO NOTHING
    RETURNING user_id
  )
  UPDATE public.profiles p
  SET top_10_count = COALESCE(p.top_10_count, 0) + 1
  WHERE p.id IN (SELECT user_id FROM inserted_history);
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

  -- Enable trusted bypass early in case nested server-side logic
  -- (e.g. monthly finalize) writes protected profile fields.
  PERFORM set_config('app.bypass_profile_guard', 'on', true);

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

CREATE OR REPLACE FUNCTION public.process_ranked_duel_result()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_p1_rating integer;
  v_p2_rating integer;
  v_expected1 numeric;
  v_expected2 numeric;
  v_score1 numeric;
  v_score2 numeric;
  v_k numeric := 32;
  v_delta1 integer;
  v_delta2 integer;
BEGIN
  IF NEW.match_type <> 'ranked'
     OR NEW.status <> 'completed'
     OR NEW.ranking_processed = true
     OR NEW.player1_session_id IS NULL
     OR NEW.player2_session_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Trusted bypass for protected profile fields update inside trigger.
  PERFORM set_config('app.bypass_profile_guard', 'on', true);

  SELECT COALESCE(duel_rating, 1000) INTO v_p1_rating
  FROM public.profiles
  WHERE id = NEW.player1_id
  FOR UPDATE;

  SELECT COALESCE(duel_rating, 1000) INTO v_p2_rating
  FROM public.profiles
  WHERE id = NEW.player2_id
  FOR UPDATE;

  v_expected1 := 1 / (1 + power(10, (v_p2_rating - v_p1_rating)::numeric / 400));
  v_expected2 := 1 / (1 + power(10, (v_p1_rating - v_p2_rating)::numeric / 400));

  IF NEW.winner_id IS NULL THEN
    v_score1 := 0.5;
    v_score2 := 0.5;
  ELSIF NEW.winner_id = NEW.player1_id THEN
    v_score1 := 1;
    v_score2 := 0;
  ELSE
    v_score1 := 0;
    v_score2 := 1;
  END IF;

  v_delta1 := round(v_k * (v_score1 - v_expected1));
  v_delta2 := round(v_k * (v_score2 - v_expected2));

  UPDATE public.profiles
  SET
    duel_rating = GREATEST(100, COALESCE(duel_rating, 1000) + v_delta1),
    duel_ranked_games = COALESCE(duel_ranked_games, 0) + 1,
    duel_ranked_wins = COALESCE(duel_ranked_wins, 0) +
      CASE WHEN NEW.winner_id = NEW.player1_id THEN 1 ELSE 0 END
  WHERE id = NEW.player1_id;

  UPDATE public.profiles
  SET
    duel_rating = GREATEST(100, COALESCE(duel_rating, 1000) + v_delta2),
    duel_ranked_games = COALESCE(duel_ranked_games, 0) + 1,
    duel_ranked_wins = COALESCE(duel_ranked_wins, 0) +
      CASE WHEN NEW.winner_id = NEW.player2_id THEN 1 ELSE 0 END
  WHERE id = NEW.player2_id;

  UPDATE public.duels
  SET
    ranking_processed = true,
    player1_rating_delta = v_delta1,
    player2_rating_delta = v_delta2
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;
