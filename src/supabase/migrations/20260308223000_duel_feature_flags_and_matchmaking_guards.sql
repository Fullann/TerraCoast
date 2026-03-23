-- Admin-togglable duel features:
-- - anti_repeat
-- - progressive_expand
-- - show_opponent_mmr

CREATE TABLE IF NOT EXISTS public.duel_feature_flags (
  feature_key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.duel_feature_flags ENABLE ROW LEVEL SECURITY;

INSERT INTO public.duel_feature_flags (feature_key, enabled)
VALUES
  ('anti_repeat', true),
  ('progressive_expand', true),
  ('show_opponent_mmr', true)
ON CONFLICT (feature_key) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated can read duel feature flags" ON public.duel_feature_flags;
CREATE POLICY "Authenticated can read duel feature flags"
ON public.duel_feature_flags
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can manage duel feature flags" ON public.duel_feature_flags;
CREATE POLICY "Admins can manage duel feature flags"
ON public.duel_feature_flags
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

CREATE OR REPLACE FUNCTION public.get_duel_feature_flag(
  p_feature_key text,
  p_default boolean DEFAULT true
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT f.enabled FROM public.duel_feature_flags f WHERE f.feature_key = p_feature_key),
    p_default
  );
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

  v_enable_anti_repeat := public.get_duel_feature_flag('anti_repeat', true);
  v_enable_progressive_expand := public.get_duel_feature_flag('progressive_expand', true);

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
      OR (
        v_enable_progressive_expand
        AND NOW() - q.created_at >= v_expand_after
      )
    )
    AND (
      q.preferred_quiz_id IS NULL
      OR p_preferred_quiz_id IS NULL
      OR q.preferred_quiz_id = p_preferred_quiz_id
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
