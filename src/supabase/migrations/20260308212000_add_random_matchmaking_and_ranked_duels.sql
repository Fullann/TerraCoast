-- Random matchmaking + ranked duel leaderboard foundation.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS duel_rating integer NOT NULL DEFAULT 1000,
ADD COLUMN IF NOT EXISTS duel_ranked_games integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS duel_ranked_wins integer NOT NULL DEFAULT 0;

ALTER TABLE public.duels
ADD COLUMN IF NOT EXISTS match_type text NOT NULL DEFAULT 'casual'
  CHECK (match_type IN ('casual', 'ranked')),
ADD COLUMN IF NOT EXISTS ranking_processed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS player1_rating_delta integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS player2_rating_delta integer NOT NULL DEFAULT 0;

UPDATE public.duels
SET match_type = 'casual'
WHERE match_type IS NULL;

CREATE TABLE IF NOT EXISTS public.duel_matchmaking_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferred_quiz_id uuid NULL REFERENCES public.quizzes(id) ON DELETE SET NULL,
  match_type text NOT NULL DEFAULT 'ranked' CHECK (match_type IN ('casual', 'ranked')),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.duel_matchmaking_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own matchmaking queue" ON public.duel_matchmaking_queue;
CREATE POLICY "Users can view own matchmaking queue"
ON public.duel_matchmaking_queue
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own matchmaking queue" ON public.duel_matchmaking_queue;
CREATE POLICY "Users can insert own matchmaking queue"
ON public.duel_matchmaking_queue
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own matchmaking queue" ON public.duel_matchmaking_queue;
CREATE POLICY "Users can delete own matchmaking queue"
ON public.duel_matchmaking_queue
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_duel_matchmaking_queue_type_created
ON public.duel_matchmaking_queue(match_type, created_at);

CREATE OR REPLACE FUNCTION public.resolve_matchmaking_quiz(
  p_my_preferred_quiz_id uuid,
  p_other_preferred_quiz_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quiz_id uuid;
BEGIN
  IF p_my_preferred_quiz_id IS NOT NULL THEN
    RETURN p_my_preferred_quiz_id;
  END IF;

  IF p_other_preferred_quiz_id IS NOT NULL THEN
    RETURN p_other_preferred_quiz_id;
  END IF;

  SELECT q.id INTO v_quiz_id
  FROM public.quizzes q
  WHERE q.is_public = true OR q.is_global = true
  ORDER BY COALESCE(q.total_plays, 0) DESC, q.created_at DESC
  LIMIT 1;

  RETURN v_quiz_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_or_match_random_duel(
  p_match_type text DEFAULT 'ranked',
  p_preferred_quiz_id uuid DEFAULT NULL
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

  -- clear previous queue state for the caller
  DELETE FROM public.duel_matchmaking_queue
  WHERE user_id = v_self_id;

  SELECT q.* INTO v_candidate
  FROM public.duel_matchmaking_queue q
  JOIN public.profiles p ON p.id = q.user_id
  WHERE q.user_id <> v_self_id
    AND q.match_type = p_match_type
    AND COALESCE(p.is_banned, false) = false
  ORDER BY q.created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF FOUND THEN
    v_quiz_id := public.resolve_matchmaking_quiz(
      p_preferred_quiz_id,
      v_candidate.preferred_quiz_id
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

  INSERT INTO public.duel_matchmaking_queue (user_id, preferred_quiz_id, match_type)
  VALUES (v_self_id, p_preferred_quiz_id, p_match_type);

  RETURN QUERY
  SELECT NULL::uuid, NULL::uuid, false, true, NULL::uuid;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_random_duel_search()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.duel_matchmaking_queue
  WHERE user_id = auth.uid();
END;
$$;

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
     OR NEW.ranking_processed = true
     OR NEW.player1_session_id IS NULL
     OR NEW.player2_session_id IS NULL THEN
    RETURN NEW;
  END IF;

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

DROP TRIGGER IF EXISTS trg_process_ranked_duel_result ON public.duels;
CREATE TRIGGER trg_process_ranked_duel_result
AFTER UPDATE ON public.duels
FOR EACH ROW
WHEN (
  NEW.status = 'completed'
  AND NEW.match_type = 'ranked'
  AND NEW.ranking_processed = false
)
EXECUTE FUNCTION public.process_ranked_duel_result();
