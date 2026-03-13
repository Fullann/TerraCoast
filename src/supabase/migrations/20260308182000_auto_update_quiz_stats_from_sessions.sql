-- Keep quiz stats in sync from completed game sessions.
-- This avoids relying on client-side updates that can fail with RLS.

CREATE OR REPLACE FUNCTION public.update_quiz_stats_from_completed_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only process when a session becomes completed for the first time.
  IF TG_OP = 'UPDATE'
     AND NEW.completed = true
     AND COALESCE(OLD.completed, false) = false THEN
    UPDATE public.quizzes q
    SET
      total_plays = COALESCE(q.total_plays, 0) + 1,
      average_score =
        (
          (COALESCE(q.average_score, 0) * COALESCE(q.total_plays, 0))
          + COALESCE(NEW.score, 0)
        ) / GREATEST(COALESCE(q.total_plays, 0) + 1, 1)
    WHERE q.id = NEW.quiz_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_quiz_stats_from_completed_session ON public.game_sessions;
CREATE TRIGGER trg_update_quiz_stats_from_completed_session
AFTER UPDATE ON public.game_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_quiz_stats_from_completed_session();
