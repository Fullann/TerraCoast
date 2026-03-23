-- Expire stale ranked duels:
-- - if one player has played, they win by forfeit
-- - if nobody played, duel is cancelled
-- - if both played but duel is still active, finalize using scores

CREATE OR REPLACE FUNCTION public.expire_stale_ranked_duels(
  p_expire_after_minutes integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_duel public.duels%ROWTYPE;
  v_p1_score integer;
  v_p2_score integer;
  v_winner_id uuid;
  v_completed_count integer := 0;
  v_cancelled_count integer := 0;
BEGIN
  IF p_expire_after_minutes < 1 THEN
    RAISE EXCEPTION 'p_expire_after_minutes must be >= 1';
  END IF;

  FOR v_duel IN
    SELECT d.*
    FROM public.duels d
    WHERE d.match_type = 'ranked'
      AND d.status IN ('pending', 'in_progress')
      AND COALESCE(d.started_at, d.created_at) <= NOW() - make_interval(mins => p_expire_after_minutes)
    FOR UPDATE SKIP LOCKED
  LOOP
    v_winner_id := NULL;

    IF v_duel.player1_session_id IS NULL AND v_duel.player2_session_id IS NULL THEN
      UPDATE public.duels
      SET
        status = 'cancelled',
        completed_at = COALESCE(completed_at, NOW())
      WHERE id = v_duel.id;
      v_cancelled_count := v_cancelled_count + 1;
      CONTINUE;
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
    WHERE id = v_duel.id;

    v_completed_count := v_completed_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'completed', v_completed_count,
    'cancelled', v_cancelled_count
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_stale_ranked_duels(integer) TO authenticated;

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
     OR NEW.ranking_processed = true THEN
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
