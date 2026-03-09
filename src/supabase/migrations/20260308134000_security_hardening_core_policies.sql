-- Security hardening: profiles update restrictions + title/badge policies + admin RPC guard.

-- 1) Prevent privilege escalation and unauthorized self-updates on profiles.
--    Users can update only a strict allowlist of profile fields.
CREATE OR REPLACE FUNCTION public.enforce_profiles_self_update_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_is_admin boolean := false;
  old_protected jsonb;
  new_protected jsonb;
BEGIN
  -- Service-role / backend operations are allowed.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  ) INTO actor_is_admin;

  -- Admins keep full update capability.
  IF actor_is_admin THEN
    RETURN NEW;
  END IF;

  -- Non-admins can only update their own row (RLS should already enforce this).
  IF auth.uid() <> OLD.id THEN
    RAISE EXCEPTION 'Unauthorized profile update'
      USING ERRCODE = '42501';
  END IF;

  -- Allowlist of columns a regular user may change on their own profile.
  -- Everything else (role, ban flags, xp/level, moderation fields, etc.) is protected.
  old_protected := to_jsonb(OLD) - ARRAY[
    'pseudo',
    'email_newsletter',
    'language',
    'show_all_languages',
    'terms_accepted_at',
    'privacy_accepted_at',
    'updated_at'
  ];

  new_protected := to_jsonb(NEW) - ARRAY[
    'pseudo',
    'email_newsletter',
    'language',
    'show_all_languages',
    'terms_accepted_at',
    'privacy_accepted_at',
    'updated_at'
  ];

  IF old_protected IS DISTINCT FROM new_protected THEN
    RAISE EXCEPTION 'Forbidden profile fields update'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profiles_self_update_guard_trigger ON public.profiles;
CREATE TRIGGER enforce_profiles_self_update_guard_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_profiles_self_update_guard();

-- 2) Tighten badge/title insertion policies (no more WITH CHECK true).
DROP POLICY IF EXISTS "System can insert badges" ON public.user_badges;
CREATE POLICY "Users or admins can insert user_badges"
  ON public.user_badges
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "System can insert titles" ON public.user_titles;
CREATE POLICY "Users or admins can insert user_titles"
  ON public.user_titles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'admin'
    )
  );

-- 3) Harden admin RPC by enforcing admin check inside the function itself.
CREATE OR REPLACE FUNCTION public.assign_titles_to_all_users()
RETURNS TABLE(user_id uuid, assigned_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_count bigint;
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
    RAISE EXCEPTION 'Only admins can execute assign_titles_to_all_users'
      USING ERRCODE = '42501';
  END IF;

  FOR v_user_id IN SELECT id FROM public.profiles LOOP
    SELECT COUNT(*) INTO v_count FROM public.assign_earned_titles(v_user_id);
    RETURN QUERY SELECT v_user_id, v_count;
  END LOOP;
END;
$$;
