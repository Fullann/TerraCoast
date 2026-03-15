-- Phase 2: matchmaking preferences (quiz + difficulty) + compatibility checks.

ALTER TABLE public.duel_matchmaking_queue
ADD COLUMN IF NOT EXISTS preferred_difficulty text NULL
  CHECK (preferred_difficulty IN ('easy', 'medium', 'hard'));

CREATE OR REPLACE FUNCTION public.resolve_matchmaking_quiz(
  p_my_preferred_quiz_id uuid,
  p_other_preferred_quiz_id uuid,
  p_my_preferred_difficulty text DEFAULT NULL,
  p_other_preferred_difficulty text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quiz_id uuid;
  v_effective_difficulty text;
BEGIN
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
  p_preferred_difficulty text DEFAULT NULL
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

  DELETE FROM public.duel_matchmaking_queue
  WHERE user_id = v_self_id;

  SELECT q.* INTO v_candidate
  FROM public.duel_matchmaking_queue q
  JOIN public.profiles p ON p.id = q.user_id
  WHERE q.user_id <> v_self_id
    AND q.match_type = p_match_type
    AND COALESCE(p.is_banned, false) = false
    AND (
      q.preferred_difficulty IS NULL
      OR p_preferred_difficulty IS NULL
      OR q.preferred_difficulty = p_preferred_difficulty
    )
  ORDER BY q.created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF FOUND THEN
    v_quiz_id := public.resolve_matchmaking_quiz(
      p_preferred_quiz_id,
      v_candidate.preferred_quiz_id,
      p_preferred_difficulty,
      v_candidate.preferred_difficulty
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
      ranking_processed
    )
    VALUES (
      v_quiz_id,
      v_candidate.user_id,
      v_self_id,
      'in_progress',
      NOW(),
      p_match_type,
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
    match_type
  )
  VALUES (
    v_self_id,
    p_preferred_quiz_id,
    p_preferred_difficulty,
    p_match_type
  );

  RETURN QUERY
  SELECT NULL::uuid, NULL::uuid, false, true, NULL::uuid;
END;
$$;
