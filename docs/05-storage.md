# 05 — Supabase Storage

## Rôle

Le Storage est utilisé pour héberger des assets accessibles depuis le frontend :
- images de quiz (cover / assets éventuels)
- fichiers GeoJSON (cartes custom)

## Points d’attention

- Buckets + policies doivent être alignés avec :
  - les droits de lecture (public vs authentifié)
  - les droits d’écriture (créateur/admin uniquement)
- Les URLs publiques doivent être traitées comme des ressources publiques (si bucket public).

## Cartes GeoJSON custom

Flux typique :
- upload du fichier dans un bucket dédié (ex: `custom-geojson`)
- insertion d’une ligne DB (ex: `geojson_custom_maps`) avec :
  - `storage_path`
  - `public_url`
  - preset (centre/zoom/idProperty + labels)
- workflow d’approbation admin (status `pending` → `approved`)

