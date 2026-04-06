# 12 — Déploiement

## Build

```bash
npm run build
```

La sortie est dans `dist/`.

## Variables d’environnement

Au minimum :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Supabase

Le déploiement doit être cohérent côté DB :
- appliquer les migrations (via workflow Supabase)
- vérifier les buckets Storage et leurs policies
- vérifier les policies RLS et RPC nécessaires (admin logs, progression, etc.)

## Checklist

- Build OK
- Navigation OK (dont admin)
- Auth OK (ban / force rename)
- i18n OK
- Storage OK (upload image quiz, custom geojson)

