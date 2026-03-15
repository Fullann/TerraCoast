-- Multi-quiz matchmaking preferences + random bonus mode.

ALTER TABLE public.duel_matchmaking_queue
ADD COLUMN IF NOT EXISTS preferred_quiz_ids uuid[] NULL,
ADD COLUMN IF NOT EXISTS queue_mode text NOT NULL DEFAULT 'targeted'
  CHECK (queue_mode IN ('targeted', 'random_bonus'));

ALTER TABLE public.duels
ADD COLUMN IF NOT EXISTS queue_mode text NOT NULL DEFAULT 'targeted'
  CHECK (queue_mode IN ('targeted', 'random_bonus')),
ADD COLUMN IF NOT EXISTS random_bonus_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS bonus_xp integer NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS bonus_awarded boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.pick_random_public_quiz(
  p_difficulty text DEFAULT NULL
)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT q.id
  FROM public.quizzes q
  WHERE (q.is_public = true OR q.is_global = true)
    AND (p_difficulty IS NULL OR q.difficulty::text = p_difficulty)
  ORDER BY random()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.resolve_matchmaking_quiz(
  p_my_preferred_quiz_id uuid,
  p_other_preferred_quiz_id uuid,
  p_my_preferred_difficulty text DEFAULT NULL,
  p_other_preferred_difficulty text DEFAULT NULL,
  p_my_preferred_quiz_ids uuid[] DEFAULT NULL,
  p_other_preferred_quiz_ids uuid[] DEFAULT NULL,
  p_queue_mode text DEFAULT 'targeted'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quiz_id uuid;
  v_effective_difficulty text;
  v_intersection uuid[];
BEGIN
  IF p_queue_mode = 'random_bonus' THEN
    v_effective_difficulty := COALESCE(p_my_preferred_difficulty, p_other_preferred_difficulty);
    RETURN public.pick_random_public_quiz(v_effective_difficulty);
  END IF;

  IF p_my_preferred_quiz_ids IS NOT NULL AND array_length(p_my_preferred_quiz_ids, 1) > 0
     AND p_other_preferred_quiz_ids IS NOT NULL AND array_length(p_other_preferred_quiz_ids, 1) > 0 THEN
    SELECT ARRAY(
      SELECT unnest(p_my_preferred_quiz_ids)
      INTERSECT
      SELECT unnest(p_other_preferred_quiz_ids)
    ) INTO v_intersection;

    IF v_intersection IS NOT NULL AND array_length(v_intersection, 1) > 0 THEN
      SELECT q.id INTO v_quiz_id
      FROM public.quizzes q
      WHERE q.id = ANY(v_intersection)
      ORDER BY random()
      LIMIT 1;

      IF v_quiz_id IS NOT NULL THEN
        RETURN v_quiz_id;
      END IF;
    END IF;
  END IF;

  IF p_my_preferred_quiz_ids IS NOT NULL AND array_length(p_my_preferred_quiz_ids, 1) > 0 THEN
    SELECT q.id INTO v_quiz_id
    FROM public.quizzes q
    WHERE q.id = ANY(p_my_preferred_quiz_ids)
    ORDER BY random()
    LIMIT 1;
    IF v_quiz_id IS NOT NULL THEN
      RETURN v_quiz_id;
    END IF;
  END IF;

  IF p_other_preferred_quiz_ids IS NOT NULL AND array_length(p_other_preferred_quiz_ids, 1) > 0 THEN
    SELECT q.id INTO v_quiz_id
    FROM public.quizzes q
    WHERE q.id = ANY(p_other_preferred_quiz_ids)
    ORDER BY random()
    LIMIT 1;
    IF v_quiz_id IS NOT NULL THEN
      RETURN v_quiz_id;
    END IF;
  END IF;

  IF p_my_preferred_quiz_id IS NOT NULL THEN
    RETURN p_my_preferred_quiz_id;
  END IF;

  IF p_other_preferred_quiz_id IS NOT NULL THEN
    RETURN p_other_preferred_quiz_id;
  END IF;

  v_effective_difficulty := COALESCE(p_my_preferred_difficulty, p_other_preferred_difficulty);
  SELECT q.id INTO v_quiz_id
  FROM public.quizzes q
  WHERE (q.is_public = true OR q.is_global = true)
    AND (
      v_effective_difficulty IS NULL
      OR q.difficulty::text = v_effective_difficulty
    )
  ORDER BY COALESCE(q.total_plays, 0) DESC, q.created_at DESC
  LIMIT 1;

  RETURN v_quiz_id;
END;
$$;

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

DROP TRIGGER IF EXISTS trg_award_random_bonus_on_duel_complete ON public.duels;
CREATE TRIGGER trg_award_random_bonus_on_duel_complete
AFTER UPDATE ON public.duels
FOR EACH ROW
WHEN (
  NEW.status = 'completed'
  AND COALESCE(NEW.random_bonus_enabled, false) = true
)
EXECUTE FUNCTION public.award_random_bonus_on_duel_complete();
