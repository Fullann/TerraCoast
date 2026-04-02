# 14 — Contrats Supabase (Tables & RPC)

Ce document récapitule les principaux **contrats** entre le frontend et Supabase :
- tables consultées/mises à jour
- RPC appelées depuis le client

> La source de vérité complète reste : `src/supabase/migrations/*.sql` et `src/lib/database.types.ts`.

## Client Supabase

- `src/lib/supabase.ts` : `createClient<Database>(url, anonKey)`

## RPC appelées depuis le frontend (repérées par `supabase.rpc(...)`)

### `log_admin_event(p_action, p_entity_type, p_entity_id, p_details)`

- **Côté DB** : `20260308230000_add_admin_activity_logs.sql`
- **But** : journaliser les actions admin
- **Appels** :
  - `src/components/admin/AdminPage.tsx`
  - `src/components/admin/DuelFeaturesPage.tsx`
  - `src/components/admin/GeoJsonMapsManagementPage.tsx`

### `duplicate_quiz(p_quiz_id, p_new_title)`

- **But** : dupliquer un quiz (quiz + questions)
- **Appels** :
  - `src/components/admin/QuizManagementPage.tsx`

### `create_or_match_random_duel(...)`

- **But** : matchmaking (ranked/casual), retourne `duel_id` ou `waiting`
- **Appels** :
  - `src/components/duels/hooks/useMatchmaking.ts`

### `cancel_random_duel_search()`

- **But** : annuler la recherche matchmaking
- **Appels** :
  - `src/components/duels/hooks/useMatchmaking.ts`

### `link_duel_session_and_finalize(...)`

- **But** : lier une session de duel et finaliser/évaluer le résultat (selon logique DB)
- **Appels** :
  - `src/components/quizzes/PlayQuizPage.tsx`

### `delete_user_account(user_id)`

- **But** : suppression compte (server-side, via RPC)
- **Appels** :
  - `src/components/profile/SettingsPage.tsx`

## Tables clés par domaine

### Auth & profil

- `profiles`

### Quizzing

- `quizzes`
- `questions`
- `game_sessions`
- `game_answers`

### Social

- `friendships`
- `chat_messages`
- `quiz_shares`

### Modération

- `warnings`
- `reports` (historique / coexistence)

### Admin

- `admin_activity_logs`
- `geojson_custom_maps`

### Duels

- `duels`
- tables ranked/matchmaking (selon migrations 20260308xx/20260309xx)

