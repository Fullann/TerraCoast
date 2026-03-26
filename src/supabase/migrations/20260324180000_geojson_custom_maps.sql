-- Cartes GeoJSON personnalisées : métadonnées + stockage public (fichier servi à tous après approbation).

CREATE TABLE IF NOT EXISTS public.geojson_custom_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  file_size_bytes integer NOT NULL DEFAULT 0,
  feature_count integer NOT NULL DEFAULT 0,
  bbox double precision[] CHECK (bbox IS NULL OR array_length(bbox, 1) = 4),
  preset jsonb NOT NULL DEFAULT '{"centerLat": 20, "centerLng": 0, "zoom": 2, "idProperty": "tc_id"}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  CONSTRAINT geojson_custom_maps_slug_lower CHECK (slug = lower(slug) AND slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE UNIQUE INDEX IF NOT EXISTS geojson_custom_maps_slug_key ON public.geojson_custom_maps (slug);

CREATE INDEX IF NOT EXISTS idx_geojson_custom_maps_status ON public.geojson_custom_maps (status);
CREATE INDEX IF NOT EXISTS idx_geojson_custom_maps_created_at ON public.geojson_custom_maps (created_at DESC);

ALTER TABLE public.geojson_custom_maps ENABLE ROW LEVEL SECURITY;

-- Lecture : cartes approuvées pour tout le monde (y compris anon : URLs publiques + métadonnées).
DROP POLICY IF EXISTS "Public read approved geojson maps" ON public.geojson_custom_maps;
CREATE POLICY "Public read approved geojson maps"
ON public.geojson_custom_maps
FOR SELECT
TO public
USING (status = 'approved');

-- Admins : voir toutes les cartes (brouillons, rejetées).
DROP POLICY IF EXISTS "Admins read all geojson maps" ON public.geojson_custom_maps;
CREATE POLICY "Admins read all geojson maps"
ON public.geojson_custom_maps
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins insert geojson maps" ON public.geojson_custom_maps;
CREATE POLICY "Admins insert geojson maps"
ON public.geojson_custom_maps
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
  AND created_by = auth.uid()
);

DROP POLICY IF EXISTS "Admins update geojson maps" ON public.geojson_custom_maps;
CREATE POLICY "Admins update geojson maps"
ON public.geojson_custom_maps
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins delete geojson maps" ON public.geojson_custom_maps;
CREATE POLICY "Admins delete geojson maps"
ON public.geojson_custom_maps
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'custom-geojson',
  'custom-geojson',
  true,
  10485760,
  ARRAY['application/json', 'application/geo+json', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read custom geojson files" ON storage.objects;
CREATE POLICY "Public read custom geojson files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'custom-geojson');

DROP POLICY IF EXISTS "Admins upload custom geojson" ON storage.objects;
CREATE POLICY "Admins upload custom geojson"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'custom-geojson'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins update custom geojson" ON storage.objects;
CREATE POLICY "Admins update custom geojson"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'custom-geojson'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'custom-geojson'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins delete custom geojson" ON storage.objects;
CREATE POLICY "Admins delete custom geojson"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'custom-geojson'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);
