# Documentation TerraCoast V2

Ce dossier regroupe la documentation technique et produit du projet **TerraCoast**.

## Table des matières

- **Vue d’ensemble**
  - [`01-overview.md`](./01-overview.md)
  - [`02-architecture.md`](./02-architecture.md)
- **Base de données & Supabase**
  - [`03-database-schema.md`](./03-database-schema.md)
  - [`04-security-rls.md`](./04-security-rls.md)
  - [`05-storage.md`](./05-storage.md)
- **Frontend**
  - [`06-frontend.md`](./06-frontend.md)
  - [`07-i18n.md`](./07-i18n.md)
- **Fonctionnalités**
  - [`08-gameplay.md`](./08-gameplay.md)
  - [`09-social-duels.md`](./09-social-duels.md)
  - [`10-admin-dashboard.md`](./10-admin-dashboard.md)
- **Runbook**
  - [`11-development.md`](./11-development.md)
  - [`12-deployment.md`](./12-deployment.md)
- **Annexes**
  - [`13-diagrams.md`](./13-diagrams.md)
  - [`14-supabase-contracts.md`](./14-supabase-contracts.md)
  - [`15-storage-policies.md`](./15-storage-policies.md)

## Périmètre “backend”

Le projet n’a pas de serveur backend Node/Express dédié : le “backend” est principalement assuré par **Supabase** :
- Authentification
- Base Postgres
- RLS (Row Level Security)
- RPC (fonctions SQL) et triggers
- Storage (images, GeoJSON, etc.)

## Sources de vérité

- **Schéma DB** : `src/supabase/migrations/*.sql`
- **Types DB** : `src/lib/database.types.ts`
- **Client Supabase** : `src/lib/supabase.ts`

