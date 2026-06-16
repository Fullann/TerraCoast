-- Fix: allow regular users to update their avatar_url and frame_style.
-- These columns were added in a later migration, but the update guard allowlist was not updated.

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
  -- Explicit local bypass for trusted SECURITY DEFINER functions.
  IF COALESCE(current_setting('app.bypass_profile_guard', true), '') = 'on' THEN
    RETURN NEW;
  END IF;

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
  old_protected := to_jsonb(OLD) - ARRAY[
    'pseudo',
    'email_newsletter',
    'language',
    'show_all_languages',
    'terms_accepted_at',
    'privacy_accepted_at',
    'avatar_url',
    'frame_style',
    'updated_at'
  ];

  new_protected := to_jsonb(NEW) - ARRAY[
    'pseudo',
    'email_newsletter',
    'language',
    'show_all_languages',
    'terms_accepted_at',
    'privacy_accepted_at',
    'avatar_url',
    'frame_style',
    'updated_at'
  ];

  IF old_protected IS DISTINCT FROM new_protected THEN
    RAISE EXCEPTION 'Forbidden profile fields update'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;
