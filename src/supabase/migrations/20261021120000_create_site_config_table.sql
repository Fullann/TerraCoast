-- Migration: Create site_config table for real-time remote configuration
-- Enables full remote administration of Featured Country of the Week,
-- Global Announcements, Double XP Events, Gameplay Economy & Theming.

CREATE TABLE IF NOT EXISTS public.site_config (
  id text PRIMARY KEY DEFAULT 'current',
  announcement jsonb NOT NULL DEFAULT '{}'::jsonb,
  featured_country jsonb NOT NULL DEFAULT '{}'::jsonb,
  gameplay jsonb NOT NULL DEFAULT '{}'::jsonb,
  theme jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- 1. Public read for everyone (anon and authenticated)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'site_config'
      AND policyname = 'Anyone can view site config'
  ) THEN
    CREATE POLICY "Anyone can view site config"
    ON public.site_config
    FOR SELECT
    TO anon, authenticated
    USING (true);
  END IF;
END $$;

-- 2. Only admins can insert, update or delete site config
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins can manage site config" ON public.site_config;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'site_config'
      AND policyname = 'Admins can insert site config'
  ) THEN
    CREATE POLICY "Admins can insert site config"
    ON public.site_config
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (select auth.uid())
          AND p.role = 'admin'
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'site_config'
      AND policyname = 'Admins can update site config'
  ) THEN
    CREATE POLICY "Admins can update site config"
    ON public.site_config
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (select auth.uid())
          AND p.role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (select auth.uid())
          AND p.role = 'admin'
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'site_config'
      AND policyname = 'Admins can delete site config'
  ) THEN
    CREATE POLICY "Admins can delete site config"
    ON public.site_config
    FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (select auth.uid())
          AND p.role = 'admin'
      )
    );
  END IF;
END $$;
