-- Duel security hardening:
-- - Restrict direct table writes on duels/game_sessions
-- - Enforce public/global quiz constraints in matchmaking resolution
-- - Harden duel finalization RPC against non-active duels

-- 1) RLS: duels table should not be directly mutable by regular users.
--    Keep direct insert only for invitation acceptance flow (casual duels).
DROP POLICY IF EXISTS "Users can create duels" ON public.duels;
DROP POLICY IF EXISTS "Users can update own duels" ON public.duels;

CREATE POLICY "Users can create duels from pending invitation"
ON public.duels
FOR INSERT
TO authenticated
WITH CHECK (
  player2_id = auth.uid()
  AND player1_id <> auth.uid()
  AND status = 'in_progress'
  AND match_type = 'casual'
  AND winner_id IS NULL
  AND player1_session_id IS NULL
  AND player2_session_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.duel_invitations di
    WHERE di.from_user_id = player1_id
      AND di.to_user_id = player2_id
      AND di.quiz_id = quiz_id
      AND di.status = 'pending'
      AND COALESCE(di.expires_at, NOW() + interval '1 second') > NOW()
  )
);

DROP POLICY IF EXISTS "Admins can manage all duels" ON public.duels;
CREATE POLICY "Admins can manage all duels"
ON public.duels
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

-- 2) RLS: prevent direct score/session forging by removing user UPDATE on game_sessions.
DROP POLICY IF EXISTS "Users can update own sessions" ON public.game_sessions;

DROP POLICY IF EXISTS "Admins can update all sessions" ON public.game_sessions;
CREATE POLICY "Admins can update all sessions"
ON public.game_sessions
FOR UPDATE
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

-- 3) Matchmaking: only public/global quizzes can be resolved from preferences.
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
  v_effective_difficulty := COALESCE(p_my_preferred_difficulty, p_other_preferred_difficulty);

  IF p_queue_mode = 'random_bonus' THEN
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
        AND (q.is_public = true OR q.is_global = true)
        AND (v_effective_difficulty IS NULL OR q.difficulty::text = v_effective_difficulty)
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
      AND (q.is_public = true OR q.is_global = true)
      AND (v_effective_difficulty IS NULL OR q.difficulty::text = v_effective_difficulty)
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
      AND (q.is_public = true OR q.is_global = true)
      AND (v_effective_difficulty IS NULL OR q.difficulty::text = v_effective_difficulty)
    ORDER BY random()
    LIMIT 1;
    IF v_quiz_id IS NOT NULL THEN
      RETURN v_quiz_id;
    END IF;
  END IF;

  IF p_my_preferred_quiz_id IS NOT NULL THEN
    SELECT q.id INTO v_quiz_id
    FROM public.quizzes q
    WHERE q.id = p_my_preferred_quiz_id
      AND (q.is_public = true OR q.is_global = true)
      AND (v_effective_difficulty IS NULL OR q.difficulty::text = v_effective_difficulty)
    LIMIT 1;
    IF v_quiz_id IS NOT NULL THEN
      RETURN v_quiz_id;
    END IF;
  END IF;

  IF p_other_preferred_quiz_id IS NOT NULL THEN
    SELECT q.id INTO v_quiz_id
    FROM public.quizzes q
    WHERE q.id = p_other_preferred_quiz_id
      AND (q.is_public = true OR q.is_global = true)
      AND (v_effective_difficulty IS NULL OR q.difficulty::text = v_effective_difficulty)
    LIMIT 1;
    IF v_quiz_id IS NOT NULL THEN
      RETURN v_quiz_id;
    END IF;
  END IF;

  SELECT q.id INTO v_quiz_id
  FROM public.quizzes q
  WHERE (q.is_public = true OR q.is_global = true)
    AND (v_effective_difficulty IS NULL OR q.difficulty::text = v_effective_difficulty)
  ORDER BY COALESCE(q.total_plays, 0) DESC, q.created_at DESC
  LIMIT 1;

  RETURN v_quiz_id;
END;
$$;

-- 4) Matchmaking hardening: reject banned callers.
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
  v_self_rating integer := 1000;
  v_candidate public.duel_matchmaking_queue%ROWTYPE;
  v_quiz_id uuid;
  v_duel_id uuid;
  v_enable_anti_repeat boolean;
  v_enable_progressive_expand boolean;
  v_recent_window interval := interval '15 minutes';
  v_expand_after interval := interval '90 seconds';
  v_ranked_initial_max_gap integer := 200;
  v_ranked_expand_step integer := 150;
  v_ranked_expand_cap integer := 1200;
  v_existing_duel public.duels%ROWTYPE;
  v_existing_opponent uuid;
BEGIN
  v_self_id := auth.uid();
  IF v_self_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_self_id
      AND COALESCE(p.is_banned, false) = true
  ) THEN
    RAISE EXCEPTION 'User banned';
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

  SELECT COALESCE(p.duel_rating, 1000)
  INTO v_self_rating
  FROM public.profiles p
  WHERE p.id = v_self_id;

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
      p_match_type <> 'ranked'
      OR ABS(COALESCE(p.duel_rating, 1000) - v_self_rating) <= v_ranked_initial_max_gap
      OR (
        v_enable_progressive_expand
        AND ABS(COALESCE(p.duel_rating, 1000) - v_self_rating) <= LEAST(
          v_ranked_expand_cap,
          v_ranked_initial_max_gap
          + (
            FLOOR(EXTRACT(EPOCH FROM (NOW() - q.created_at)) / 30)::integer
            * v_ranked_expand_step
          )
        )
      )
    )
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

-- 5) Finalization RPC: reject non-active duels to avoid post-completion tampering.
CREATE OR REPLACE FUNCTION public.link_duel_session_and_finalize(
  p_duel_id uuid,
  p_session_id uuid
)
RETURNS public.duels
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_duel public.duels%ROWTYPE;
  v_session public.game_sessions%ROWTYPE;
  v_other_score integer;
  v_my_score integer;
  v_winner_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT *
  INTO v_duel
  FROM public.duels
  WHERE id = p_duel_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Duel not found';
  END IF;

  IF v_duel.status NOT IN ('pending', 'in_progress') THEN
    RAISE EXCEPTION 'Duel is not active';
  END IF;

  IF v_duel.player1_id <> v_user_id AND v_duel.player2_id <> v_user_id THEN
    RAISE EXCEPTION 'User is not part of this duel';
  END IF;

  SELECT *
  INTO v_session
  FROM public.game_sessions
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF v_session.player_id <> v_user_id THEN
    RAISE EXCEPTION 'Session does not belong to current user';
  END IF;

  IF v_session.mode <> 'duel' THEN
    RAISE EXCEPTION 'Session mode is not duel';
  END IF;

  IF v_session.quiz_id <> v_duel.quiz_id THEN
    RAISE EXCEPTION 'Session quiz mismatch';
  END IF;

  IF v_duel.player1_id = v_user_id THEN
    IF v_duel.player1_session_id IS NULL OR v_duel.player1_session_id = p_session_id THEN
      v_duel.player1_session_id := p_session_id;
    ELSE
      RAISE EXCEPTION 'Player1 session already linked to another session';
    END IF;
  ELSE
    IF v_duel.player2_session_id IS NULL OR v_duel.player2_session_id = p_session_id THEN
      v_duel.player2_session_id := p_session_id;
    ELSE
      RAISE EXCEPTION 'Player2 session already linked to another session';
    END IF;
  END IF;

  IF v_duel.player1_session_id IS NOT NULL AND v_duel.player2_session_id IS NOT NULL THEN
    SELECT score INTO v_my_score
    FROM public.game_sessions
    WHERE id = v_duel.player1_session_id;

    SELECT score INTO v_other_score
    FROM public.game_sessions
    WHERE id = v_duel.player2_session_id;

    v_winner_id := NULL;
    IF COALESCE(v_my_score, 0) > COALESCE(v_other_score, 0) THEN
      v_winner_id := v_duel.player1_id;
    ELSIF COALESCE(v_other_score, 0) > COALESCE(v_my_score, 0) THEN
      v_winner_id := v_duel.player2_id;
    END IF;

    v_duel.status := 'completed';
    v_duel.winner_id := v_winner_id;
    v_duel.completed_at := COALESCE(v_duel.completed_at, NOW());
  END IF;

  UPDATE public.duels
  SET
    player1_session_id = v_duel.player1_session_id,
    player2_session_id = v_duel.player2_session_id,
    status = v_duel.status,
    winner_id = v_duel.winner_id,
    completed_at = v_duel.completed_at
  WHERE id = v_duel.id
  RETURNING * INTO v_duel;

  RETURN v_duel;
END;
$$;

-- 6) Integrity guard: session IDs linked to a duel must belong to the correct players/quiz.
CREATE OR REPLACE FUNCTION public.validate_duel_sessions_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_p1_owner uuid;
  v_p1_quiz uuid;
  v_p2_owner uuid;
  v_p2_quiz uuid;
BEGIN
  IF NEW.player1_session_id IS NOT NULL THEN
    SELECT gs.player_id, gs.quiz_id
    INTO v_p1_owner, v_p1_quiz
    FROM public.game_sessions gs
    WHERE gs.id = NEW.player1_session_id;

    IF NOT FOUND OR v_p1_owner IS DISTINCT FROM NEW.player1_id OR v_p1_quiz IS DISTINCT FROM NEW.quiz_id THEN
      RAISE EXCEPTION 'Invalid player1_session_id linkage';
    END IF;
  END IF;

  IF NEW.player2_session_id IS NOT NULL THEN
    SELECT gs.player_id, gs.quiz_id
    INTO v_p2_owner, v_p2_quiz
    FROM public.game_sessions gs
    WHERE gs.id = NEW.player2_session_id;

    IF NOT FOUND OR v_p2_owner IS DISTINCT FROM NEW.player2_id OR v_p2_quiz IS DISTINCT FROM NEW.quiz_id THEN
      RAISE EXCEPTION 'Invalid player2_session_id linkage';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_duel_sessions_integrity ON public.duels;
CREATE TRIGGER trg_validate_duel_sessions_integrity
BEFORE INSERT OR UPDATE ON public.duels
FOR EACH ROW
EXECUTE FUNCTION public.validate_duel_sessions_integrity();
