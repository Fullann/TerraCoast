-- Fix: do not requeue a player who already has an active duel.

CREATE OR REPLACE FUNCTION public.create_or_match_random_duel(
  p_match_type text DEFAULT 'ranked',
  p_preferred_quiz_id uuid DEFAULT NULL,
  p_preferred_difficulty text DEFAULT NULL,
  p_preferred_quiz_ids uuid[] DEFAULT NULL,
  p_queue_mode text DEFAULT 'targeted'
)
RETURNS TABLE(
  duel_id uuid,
  quiz_id uuid,
  matched boolean,
  waiting boolean,
  opponent_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_self_id uuid;
  v_candidate public.duel_matchmaking_queue%ROWTYPE;
  v_quiz_id uuid;
  v_duel_id uuid;
  v_enable_anti_repeat boolean;
  v_enable_progressive_expand boolean;
  v_recent_window interval := interval '15 minutes';
  v_expand_after interval := interval '90 seconds';
  v_existing_duel public.duels%ROWTYPE;
  v_existing_opponent uuid;
BEGIN
  v_self_id := auth.uid();
  IF v_self_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_match_type NOT IN ('casual', 'ranked') THEN
    RAISE EXCEPTION 'Invalid match_type';
  END IF;

  IF p_preferred_difficulty IS NOT NULL
     AND p_preferred_difficulty NOT IN ('easy', 'medium', 'hard') THEN
    RAISE EXCEPTION 'Invalid preferred_difficulty';
  END IF;

  IF p_queue_mode NOT IN ('targeted', 'random_bonus') THEN
    RAISE EXCEPTION 'Invalid queue_mode';
  END IF;

  IF p_preferred_quiz_ids IS NOT NULL AND array_length(p_preferred_quiz_ids, 1) > 10 THEN
    RAISE EXCEPTION 'Too many preferred quizzes (max 10)';
  END IF;

  -- Critical guard: if player already has an active duel, return it instead of requeueing.
  SELECT d.*
  INTO v_existing_duel
  FROM public.duels d
  WHERE (d.player1_id = v_self_id OR d.player2_id = v_self_id)
    AND d.status IN ('pending', 'in_progress')
  ORDER BY d.created_at DESC
  LIMIT 1;

  IF FOUND THEN
    DELETE FROM public.duel_matchmaking_queue
    WHERE user_id = v_self_id;

    v_existing_opponent :=
      CASE
        WHEN v_existing_duel.player1_id = v_self_id THEN v_existing_duel.player2_id
        ELSE v_existing_duel.player1_id
      END;

    RETURN QUERY
    SELECT
      v_existing_duel.id,
      v_existing_duel.quiz_id,
      true,
      false,
      v_existing_opponent;
    RETURN;
  END IF;

  v_enable_anti_repeat := public.get_duel_feature_flag('anti_repeat', true);
  v_enable_progressive_expand := public.get_duel_feature_flag('progressive_expand', true);

  DELETE FROM public.duel_matchmaking_queue
  WHERE user_id = v_self_id;

  SELECT q.* INTO v_candidate
  FROM public.duel_matchmaking_queue q
  JOIN public.profiles p ON p.id = q.user_id
  WHERE q.user_id <> v_self_id
    AND q.match_type = p_match_type
    AND q.queue_mode = p_queue_mode
    AND COALESCE(p.is_banned, false) = false
    AND (
      q.preferred_difficulty IS NULL
      OR p_preferred_difficulty IS NULL
      OR q.preferred_difficulty = p_preferred_difficulty
      OR (
        v_enable_progressive_expand
        AND NOW() - q.created_at >= v_expand_after
      )
    )
    AND (
      p_queue_mode = 'random_bonus'
      OR p_preferred_quiz_ids IS NULL
      OR q.preferred_quiz_ids IS NULL
      OR EXISTS (
        SELECT 1
        FROM unnest(p_preferred_quiz_ids) AS my_quiz_id
        JOIN unnest(q.preferred_quiz_ids) AS other_quiz_id
          ON my_quiz_id = other_quiz_id
      )
      OR (
        v_enable_progressive_expand
        AND NOW() - q.created_at >= v_expand_after
      )
    )
    AND (
      NOT v_enable_anti_repeat
      OR NOT EXISTS (
        SELECT 1
        FROM public.duels d
        WHERE d.created_at >= NOW() - v_recent_window
          AND (
            (d.player1_id = v_self_id AND d.player2_id = q.user_id)
            OR
            (d.player1_id = q.user_id AND d.player2_id = v_self_id)
          )
          AND d.status IN ('in_progress', 'completed')
      )
    )
  ORDER BY q.created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF FOUND THEN
    v_quiz_id := public.resolve_matchmaking_quiz(
      p_preferred_quiz_id,
      v_candidate.preferred_quiz_id,
      p_preferred_difficulty,
      v_candidate.preferred_difficulty,
      p_preferred_quiz_ids,
      v_candidate.preferred_quiz_ids,
      p_queue_mode
    );

    IF v_quiz_id IS NULL THEN
      RAISE EXCEPTION 'No available quiz for matchmaking';
    END IF;

    INSERT INTO public.duels (
      quiz_id,
      player1_id,
      player2_id,
      status,
      started_at,
      match_type,
      ranking_processed,
      queue_mode,
      random_bonus_enabled,
      bonus_xp,
      bonus_awarded
    )
    VALUES (
      v_quiz_id,
      v_candidate.user_id,
      v_self_id,
      'in_progress',
      NOW(),
      p_match_type,
      false,
      p_queue_mode,
      (p_queue_mode = 'random_bonus'),
      CASE WHEN p_queue_mode = 'random_bonus' THEN 100 ELSE 0 END,
      false
    )
    RETURNING id INTO v_duel_id;

    DELETE FROM public.duel_matchmaking_queue
    WHERE user_id = v_candidate.user_id;

    RETURN QUERY
    SELECT v_duel_id, v_quiz_id, true, false, v_candidate.user_id;
    RETURN;
  END IF;

  INSERT INTO public.duel_matchmaking_queue (
    user_id,
    preferred_quiz_id,
    preferred_difficulty,
    preferred_quiz_ids,
    match_type,
    queue_mode
  )
  VALUES (
    v_self_id,
    p_preferred_quiz_id,
    p_preferred_difficulty,
    p_preferred_quiz_ids,
    p_match_type,
    p_queue_mode
  );

  RETURN QUERY
  SELECT NULL::uuid, NULL::uuid, false, true, NULL::uuid;
END;
$$;
