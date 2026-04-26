-- Manage homepage testimonials from admin interface.

CREATE TABLE IF NOT EXISTS public.landing_testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  text text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS landing_testimonials_position_idx
  ON public.landing_testimonials(position);

CREATE OR REPLACE FUNCTION public.set_landing_testimonials_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_landing_testimonials_updated_at ON public.landing_testimonials;
CREATE TRIGGER trg_landing_testimonials_updated_at
BEFORE UPDATE ON public.landing_testimonials
FOR EACH ROW
EXECUTE FUNCTION public.set_landing_testimonials_updated_at();

ALTER TABLE public.landing_testimonials ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'landing_testimonials'
      AND policyname = 'Public can read active landing testimonials'
  ) THEN
    CREATE POLICY "Public can read active landing testimonials"
    ON public.landing_testimonials
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'landing_testimonials'
      AND policyname = 'Admins can manage landing testimonials'
  ) THEN
    CREATE POLICY "Admins can manage landing testimonials"
    ON public.landing_testimonials
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'admin'
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'admin'
      )
    );
  END IF;
END $$;

INSERT INTO public.landing_testimonials (name, role, text, position)
VALUES
  ('Lina', 'Joueuse quotidienne', 'La meilleure app pour progresser en géographie sans s''ennuyer.', 1),
  ('Mathis', 'Créateur de quiz', 'Créer et partager mes quiz est super rapide, la communauté joue vraiment.', 2),
  ('Sara', 'Mode duel', 'Les défis entre amis rendent tout plus fun et motivant.', 3)
ON CONFLICT (position) DO NOTHING;
