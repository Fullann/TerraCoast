-- Add data structures for Puzzle Map and Top 10 quiz modes.

-- 1) Reference table for countries (optional backend cache/source of truth).
CREATE TABLE IF NOT EXISTS public.countries_reference (
  iso3 text PRIMARY KEY,
  name text NOT NULL,
  continent text NOT NULL,
  lat numeric,
  lng numeric,
  population bigint,
  area_km2 numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.countries_reference ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'countries_reference'
      AND policyname = 'Authenticated can read countries reference'
  ) THEN
    CREATE POLICY "Authenticated can read countries reference"
      ON public.countries_reference
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- 2) Configurable Top 10 ranking rules.
CREATE TABLE IF NOT EXISTS public.top10_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  label text NOT NULL,
  metric text NOT NULL CHECK (metric IN ('population', 'area_km2')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.top10_rules ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'top10_rules'
      AND policyname = 'Authenticated can read active top10 rules'
  ) THEN
    CREATE POLICY "Authenticated can read active top10 rules"
      ON public.top10_rules
      FOR SELECT
      TO authenticated
      USING (is_active = true);
  END IF;
END $$;

INSERT INTO public.top10_rules (code, label, metric)
VALUES
  ('world_population_top10', 'Top 10 countries by population', 'population'),
  ('world_area_top10', 'Top 10 countries by area', 'area_km2')
ON CONFLICT (code) DO NOTHING;

-- 3) Register the new quiz types in quiz_types catalog.
INSERT INTO public.quiz_types (name, description, color)
VALUES
  ('Puzzle Map', 'Place countries back on the map', '#0EA5E9'),
  ('Top 10', 'Sort countries in the right order', '#F97316')
ON CONFLICT (name) DO NOTHING;
