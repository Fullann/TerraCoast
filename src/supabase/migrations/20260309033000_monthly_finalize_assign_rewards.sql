-- Monthly rollover hardening:
-- ensure rewards (badges/titles) are assigned immediately for users
-- inserted into monthly_rankings_history at month finalization.

CREATE OR REPLACE FUNCTION public.finalize_monthly_ranking_if_needed(p_month text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF p_month IS NULL OR p_month = '' THEN
    RETURN;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('monthly_ranking:' || p_month));

  -- Trusted bypass for protected profile fields update inside this function.
  PERFORM set_config('app.bypass_profile_guard', 'on', true);

  WITH ranked AS (
    SELECT
      id AS user_id,
      monthly_score AS final_score,
      ROW_NUMBER() OVER (ORDER BY monthly_score DESC, created_at ASC) AS final_rank
    FROM public.profiles
    WHERE COALESCE(monthly_games_played, 0) > 0
      AND COALESCE(monthly_score, 0) > 0
    ORDER BY monthly_score DESC, created_at ASC
    LIMIT 10
  ),
  inserted_history AS (
    INSERT INTO public.monthly_rankings_history (user_id, month, final_rank, final_score)
    SELECT user_id, p_month, final_rank, final_score
    FROM ranked
    ON CONFLICT (user_id, month) DO NOTHING
    RETURNING user_id
  )
  UPDATE public.profiles p
  SET top_10_count = COALESCE(p.top_10_count, 0) + 1
  WHERE p.id IN (SELECT user_id FROM inserted_history);

  -- Immediately recompute progression rewards for newly inserted monthly winners.
  FOR v_user_id IN
    SELECT h.user_id
    FROM public.monthly_rankings_history h
    WHERE h.month = p_month
  LOOP
    PERFORM public.assign_earned_badges(v_user_id);
    PERFORM public.assign_earned_titles(v_user_id);
  END LOOP;
END;
$$;
