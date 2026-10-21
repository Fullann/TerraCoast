# 04 — Sécurité & RLS (Supabase)

## Objectif

La sécurité est assurée de manière défensive en profondeur :
- **Au niveau PostgreSQL / Supabase** : RLS (Row Level Security sur 100% des tables), triggers d'intégrité et RPC `SECURITY DEFINER`.
- **Au niveau HTTP / Serveur Web** : En-têtes de sécurité conformes aux recommandations de l'OWASP.
- **Au niveau Frontend** : Échappement natif React, absence totale de `dangerouslySetInnerHTML` et stockage local dépourvu de tokens sensibles.

## 1. RLS & Politiques de Sécurité

- Les tables exposées au client ont **RLS activé sans exception**.
- Les politiques vérifient l'identité via `auth.uid()`.
- Le rôle d'administration est validé par la vérification `profiles.role = 'admin'`.

### A. Déclencheur Gardien de Profil (`enforce_profiles_self_update_guard`)
Pour empêcher toute tentative d'escalade de privilèges côté client :
- Un déclencheur `BEFORE UPDATE` s'exécute sur `profiles`.
- Seuls les champs de personnalisation autorisés (`pseudo`, `language`, `email_newsletter`, `terms_accepted_at`) peuvent être modifiés par l'utilisateur lui-même.
- Les champs critiques (`role`, `is_banned`, `ban_until`, `experience_points`, `level`, `monthly_score`) sont protégés et rejetés avec le code d'erreur `42501` s'ils sont ciblés sans privilège d'administration.

### B. Configuration en Direct (`site_config`) & Cartes (`terra_cards`)
- `site_config` :
  - **SELECT** : public (anonyme et authentifié) pour propager le Pays de la Semaine et les annonces à tous.
  - **INSERT / UPDATE / DELETE** : strictement réservé aux utilisateurs avec `role = 'admin'`.
- `terra_cards` :
  - **SELECT** : `USING (is_active = true)` pour tous les utilisateurs.
  - **GESTION** : restreinte aux administrateurs.

## 2. Fonctions RPC Sécurisées (`SECURITY DEFINER`)

- **`grant_arcade_rewards(p_xp, p_score, p_game_mode)`** :
  - Vérifie obligatoirement `auth.uid() IS NOT NULL`.
  - Verrouille la ligne du profil de manière atomique avec `FOR UPDATE` (prévention des *race conditions*).
  - Borne strictement le gain d'XP : `GREATEST(0, LEAST(1000, COALESCE(p_xp, 0)))` pour éliminer la triche.
  - Met à jour l'XP, le niveau et le classement mensuel en une seule transaction.
- **`log_admin_event(...)`** :
  - Journalise les actions d'administration de manière immuable dans `admin_activity_logs`.

## 3. En-têtes HTTP de Sécurité (OWASP)

Configurés dans `.htaccess` (Apache) et `_headers` (Cloudflare Pages, Netlify, Vercel) :
- `X-Frame-Options: SAMEORIGIN` : protection intégrale contre le détournement de clic (Clickjacking).
- `X-Content-Type-Options: nosniff` : protection contre le reniflage de type MIME.
- `Referrer-Policy: strict-origin-when-cross-origin` : empêche la fuite d'URLs privées.
- `Permissions-Policy: camera=(), microphone=(), geolocation=(self)` : verrouillage matériel.
- `X-XSS-Protection: 1; mode=block` : filtre XSS navigateur.

## 4. Frontend & Stockage Client

- **0 `dangerouslySetInnerHTML`** et **0 `eval()`** dans l'ensemble du projet.
- `localStorage` utilisé exclusivement pour des données non confidentielles (préférences sonores, langue, high scores locaux, file d'attente hors-ligne).
- Flux d'authentification Supabase basé sur le standard PKCE sécurisé.
