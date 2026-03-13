-- Server-side progression pipeline (session completion + XP/level/monthly + badges/titles)

CREATE OR REPLACE FUNCTION public.check_badge_requirement(
  p_user_id uuid,
  p_requirement_type text,
  p_requirement_value integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_count integer;
  v_total_score integer;
BEGIN
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  CASE p_requirement_type
    WHEN 'level' THEN
      RETURN COALESCE(v_profile.level, 1) >= p_requirement_value;
    WHEN 'wins' THEN
      SELECT COUNT(*) INTO v_count
      FROM public.duels
      WHERE winner_id = p_user_id;
      RETURN COALESCE(v_count, 0) >= p_requirement_value;
    WHEN 'quizzes_completed' THEN
      SELECT COUNT(*) INTO v_count
      FROM public.game_sessions
      WHERE player_id = p_user_id
        AND completed = true;
      RETURN COALESCE(v_count, 0) >= p_requirement_value;
    WHEN 'perfect_scores' THEN
      SELECT COUNT(*) INTO v_count
      FROM public.game_sessions
      WHERE player_id = p_user_id
        AND completed = true
        AND COALESCE(total_questions, 0) > 0
        AND COALESCE(correct_answers, 0) = COALESCE(total_questions, 0);
      RETURN COALESCE(v_count, 0) >= p_requirement_value;
    WHEN 'streak' THEN
      RETURN COALESCE(v_profile.current_streak, 0) >= p_requirement_value;
    WHEN 'total_points', 'total_score' THEN
      SELECT COALESCE(SUM(score), 0)::integer INTO v_total_score
      FROM public.game_sessions
      WHERE player_id = p_user_id
        AND completed = true;
      RETURN COALESCE(v_total_score, 0) >= p_requirement_value;
    WHEN 'friends_count' THEN
      SELECT COUNT(*) INTO v_count
      FROM public.friendships
      WHERE (user_id = p_user_id OR friend_id = p_user_id)
        AND status = 'accepted';
      RETURN COALESCE(v_count, 0) >= p_requirement_value;
    WHEN 'published_quizzes' THEN
      RETURN COALESCE(v_profile.published_quiz_count, 0) >= p_requirement_value;
    ELSE
      RETURN false;
  END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_earned_badges(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted_count integer := 0;
BEGIN
  WITH inserted_badges AS (
    INSERT INTO public.user_badges (user_id, badge_id, earned_at)
    SELECT
      p_user_id,
      b.id,
      NOW()
    FROM public.badges b
    WHERE public.check_badge_requirement(
      p_user_id,
      b.requirement_type,
      b.requirement_value
    )
    ON CONFLICT (user_id, badge_id) DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_inserted_count
  FROM inserted_badges;

  RETURN COALESCE(v_inserted_count, 0);
END;
$$;

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
