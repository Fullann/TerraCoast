-- Admin utility RPC: recompute badges + titles for all users.

CREATE OR REPLACE FUNCTION public.assign_badges_and_titles_to_all_users()
RETURNS TABLE(
  user_id uuid,
  badges_assigned integer,
  titles_assigned bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_badges integer;
  v_titles bigint;
  actor_is_admin boolean := false;
BEGIN
  -- service-role/backend allowed
  IF auth.uid() IS NULL THEN
    actor_is_admin := true;
  ELSE
    SELECT EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    ) INTO actor_is_admin;
  END IF;

  IF NOT actor_is_admin THEN
    RAISE EXCEPTION 'Only admins can execute assign_badges_and_titles_to_all_users'
      USING ERRCODE = '42501';
  END IF;

  FOR v_user_id IN SELECT id FROM public.profiles LOOP
    v_badges := public.assign_earned_badges(v_user_id);
    SELECT COUNT(*) INTO v_titles FROM public.assign_earned_titles(v_user_id);
    RETURN QUERY SELECT v_user_id, COALESCE(v_badges, 0), COALESCE(v_titles, 0);
  END LOOP;
END;
$$;
