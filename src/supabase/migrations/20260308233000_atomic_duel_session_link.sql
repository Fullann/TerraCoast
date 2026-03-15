-- Atomic duel session linking and finalization to avoid race conditions.

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

  -- Finalize if both sessions are now present.
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
