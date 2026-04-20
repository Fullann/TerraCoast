-- Public lightweight stats for the landing page.
-- Uses SECURITY DEFINER so anon users can read aggregated values
-- without direct table access under RLS.

CREATE OR REPLACE FUNCTION public.get_public_landing_stats()
RETURNS TABLE (
  active_quizzes bigint,
  completed_sessions bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (
      SELECT COUNT(*)
      FROM public.quizzes q
      WHERE q.is_public = true OR q.is_global = true
    ) AS active_quizzes,
    (
      SELECT COUNT(*)
      FROM public.game_sessions gs
      WHERE gs.completed = true
    ) AS completed_sessions;
$$;

REVOKE ALL ON FUNCTION public.get_public_landing_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_landing_stats() TO anon, authenticated;

