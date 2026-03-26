-- When ranking_processed is NULL, "ranking_processed = true" is unknown in SQL and
-- the trigger could still run Elo updates. Treat NULL as not processed.
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
     OR COALESCE(NEW.ranking_processed, false) = true THEN
    RETURN NEW;
  END IF;

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
