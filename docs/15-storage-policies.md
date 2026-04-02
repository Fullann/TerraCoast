# 15 — Storage & Policies (Buckets)

## Buckets identifiés (via migrations)

### `quiz-images`

Migration : `src/supabase/migrations/20251027_setup_storage_quiz_images.sql`

- Bucket : public
- Limite : 5MB
- MIME : `image/jpeg`, `image/png`, `image/webp`, etc.

Policies sur `storage.objects` :
- SELECT : public (lecture)
- INSERT : authenticated (upload)
- UPDATE : authenticated
- DELETE : authenticated

> Remarque : la policy DELETE n’est pas restreinte à “ses propres images” dans la migration (elle filtre uniquement sur `bucket_id`).  
> Si tu veux un modèle strict “un user ne supprime que ses fichiers”, il faut une convention de chemin + policy plus restrictive.

### `custom-geojson`

Migration : `src/supabase/migrations/20260324180000_geojson_custom_maps.sql`

- Bucket : public
- Limite : 10MB
- MIME : `application/json`, `application/geo+json`, `text/plain`

Policies sur `storage.objects` :
- SELECT : public (lecture)
- INSERT/UPDATE/DELETE : authenticated **+ admin role** (`profiles.role='admin'`)

## Table associée : `geojson_custom_maps`

Toujours dans `20260324180000_geojson_custom_maps.sql` :
- table `public.geojson_custom_maps`
- RLS
- public SELECT uniquement si `status='approved'`
- admin SELECT/INSERT/UPDATE/DELETE

## Bonnes pratiques recommandées

- Définir une convention `storage_path` (ex: `${userId}/...`) si tu veux des policies ownership.
- Séparer les buckets “public read” des buckets “private read”.
- Éviter d’exposer des fichiers sensibles dans des buckets publics.

