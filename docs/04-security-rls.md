# 04 — Sécurité & RLS (Supabase)

## Objectif

La sécurité est principalement assurée **au niveau Postgres** via :
- RLS (Row Level Security)
- Policies par table
- RPC `SECURITY DEFINER` pour certaines opérations serveur

## RLS : principes

- Les tables exposées au client ont **RLS activé**.
- Les policies utilisent généralement `auth.uid()` pour limiter l’accès.
- Le rôle admin est déterminé par `profiles.role = 'admin'`.

## Exemples

### Logs admin (`admin_activity_logs`)

Policies typiques :
- SELECT : uniquement admins
- INSERT : uniquement admins

La fonction RPC `log_admin_event(...)` :
- est `SECURITY DEFINER`
- vérifie l’auth + le rôle admin
- écrit une ligne dans `admin_activity_logs`

## Bonnes pratiques de dev

- **Ne jamais** contourner RLS côté frontend.
- Préférer :
  - des RPC strictes (avec checks)
  - des views SQL (si besoin) + policies
- Journaliser les actions admin importantes.

## Auth & profil

Le profil applicatif (`profiles`) est distinct de `auth.users` :
- `profiles.id` = `auth.users.id`
- Les infos métier (pseudo, rôle, ban, langue) vivent dans `profiles`.

