-- Centralize duel state transitions in a single server-side function,
-- then reuse it from expiration and session-linking flows.

CREATE OR REPLACE FUNCTION public.resolve_duel_outcome(
  p_duel_id uuid
)
RETURNS public.duels
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_duel public.duels%ROWTYPE;
  v_p1_score integer;
  v_p2_score integer;
  v_winner_id uuid;
BEGIN
  SELECT *
  INTO v_duel
  FROM public.duels
  WHERE id = p_duel_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Duel not found';
  END IF;

  -- Idempotent return for terminal states.
  IF v_duel.status IN ('completed', 'cancelled') THEN
    RETURN v_duel;
  END IF;

  v_winner_id := NULL;

  IF v_duel.player1_session_id IS NULL AND v_duel.player2_session_id IS NULL THEN
    UPDATE public.duels
    SET
      status = 'cancelled',
      completed_at = COALESCE(completed_at, NOW())
    WHERE id = v_duel.id
    RETURNING * INTO v_duel;

    RETURN v_duel;
  END IF;

  IF v_duel.player1_session_id IS NOT NULL AND v_duel.player2_session_id IS NULL THEN
    v_winner_id := v_duel.player1_id;
  ELSIF v_duel.player2_session_id IS NOT NULL AND v_duel.player1_session_id IS NULL THEN
    v_winner_id := v_duel.player2_id;
  ELSE
    SELECT score INTO v_p1_score
    FROM public.game_sessions
    WHERE id = v_duel.player1_session_id;

    SELECT score INTO v_p2_score
    FROM public.game_sessions
    WHERE id = v_duel.player2_session_id;

    IF COALESCE(v_p1_score, 0) > COALESCE(v_p2_score, 0) THEN
      v_winner_id := v_duel.player1_id;
    ELSIF COALESCE(v_p2_score, 0) > COALESCE(v_p1_score, 0) THEN
      v_winner_id := v_duel.player2_id;
    END IF;
  END IF;

  UPDATE public.duels
  SET
    status = 'completed',
    winner_id = v_winner_id,
    completed_at = COALESCE(completed_at, NOW())
  WHERE id = v_duel.id
  RETURNING * INTO v_duel;

  RETURN v_duel;
END;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_duel_outcome(uuid) TO authenticated;

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

  -- Link current user's session (idempotent if already set to same).
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

  -- Move out of pending once a first session is linked.
  IF v_duel.status = 'pending' AND (
    v_duel.player1_session_id IS NOT NULL OR v_duel.player2_session_id IS NOT NULL
  ) THEN
    v_duel.status := 'in_progress';
    v_duel.started_at := COALESCE(v_duel.started_at, NOW());
  END IF;

  UPDATE public.duels
  SET
    player1_session_id = v_duel.player1_session_id,
    player2_session_id = v_duel.player2_session_id,
    status = v_duel.status,
    started_at = v_duel.started_at
  WHERE id = v_duel.id;

  -- Finalize if both sessions are now present using one shared rule engine.
  IF v_duel.player1_session_id IS NOT NULL AND v_duel.player2_session_id IS NOT NULL THEN
    RETURN public.resolve_duel_outcome(v_duel.id);
  END IF;

  SELECT *
  INTO v_duel
  FROM public.duels
  WHERE id = p_duel_id;

  RETURN v_duel;
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_stale_ranked_duels(
  p_expire_after_minutes integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_duel_id uuid;
  v_resolved public.duels%ROWTYPE;
  v_completed_count integer := 0;
  v_cancelled_count integer := 0;
BEGIN
  IF p_expire_after_minutes < 1 THEN
    RAISE EXCEPTION 'p_expire_after_minutes must be >= 1';
  END IF;

  FOR v_duel_id IN
    SELECT d.id
    FROM public.duels d
    WHERE d.match_type = 'ranked'
      AND d.status IN ('pending', 'in_progress')
      AND COALESCE(d.started_at, d.created_at) <= NOW() - make_interval(mins => p_expire_after_minutes)
    FOR UPDATE SKIP LOCKED
  LOOP
    v_resolved := public.resolve_duel_outcome(v_duel_id);
    IF v_resolved.status = 'cancelled' THEN
      v_cancelled_count := v_cancelled_count + 1;
    ELSIF v_resolved.status = 'completed' THEN
      v_completed_count := v_completed_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'completed', v_completed_count,
    'cancelled', v_cancelled_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_stale_ranked_duels(integer) TO authenticated;

-- Prefer scheduled expiration on the server, so clients stay lightweight.
DO $$
DECLARE
  v_job record;
BEGIN
  BEGIN
    FOR v_job IN
      SELECT jobid
      FROM cron.job
      WHERE jobname = 'expire-stale-ranked-duels'
    LOOP
      PERFORM cron.unschedule(v_job.jobid);
    END LOOP;

    PERFORM cron.schedule(
      'expire-stale-ranked-duels',
      '*/5 * * * *',
      'SELECT public.expire_stale_ranked_duels(30);'
    );
  EXCEPTION
    WHEN undefined_table OR undefined_function OR invalid_schema_name THEN
      RAISE NOTICE 'pg_cron is not available; configure scheduler outside SQL migration.';
  END;
END;
$$;
