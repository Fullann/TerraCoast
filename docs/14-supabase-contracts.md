# 14 — Contrats Supabase (Tables & RPC)

Ce document récapitule les principaux **contrats** entre le frontend et Supabase :
- tables consultées/mises à jour
- RPC appelées depuis le client

> La source de vérité complète reste : `src/supabase/migrations/*.sql` et `src/lib/database.types.ts`.

## Client Supabase

- `src/lib/supabase.ts` : `createClient<Database>(url, anonKey)`

## RPC appelées depuis le frontend (repérées par `supabase.rpc(...)`)

### `grant_arcade_rewards(p_xp, p_score, p_game_mode)`

- **Côté DB** : `20261016180000_grant_arcade_rewards_rpc.sql`
- **But** : attribuer de manière atomique et sécurisée (`SECURITY DEFINER`, verrou `FOR UPDATE`, borne anti-triche `max 1000 XP`) les gains d'expérience, les montées de niveau et la progression dans le classement mensuel pour les 11 mini-jeux d'arcade et les missions quotidiennes.
- **Appels** :
  - `src/lib/rewardManager.ts`
  - `src/lib/dailyMissionsManager.ts`

### `log_admin_event(p_action, p_entity_type, p_entity_id, p_details)`

- **Côté DB** : `20260308230000_add_admin_activity_logs.sql`
- **But** : journaliser les actions d'administration de manière immuable
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

- **But** : suppression de compte utilisateur (server-side, via RPC sécurisée)
- **Appels** :
  - `src/components/profile/SettingsPage.tsx`

## Tables clés par domaine

### Auth & profil

- `profiles` : compte joueur, XP, niveau, séries, ligues, rôles (gardien `enforce_profiles_self_update_guard`)

### Quizzing & Conquête

- `quizzes`
- `questions`
- `game_sessions`
- `game_answers`
- `terra_cards` : catalogue de cartes de collection TerraDex

### Configuration en Direct

- `site_config` : configuration temps réel (Pays de la Semaine, Double XP, Bannière globale, Équilibrage)

### Multijoueur & Social

- `friendships`
- `chat_messages`
- `quiz_shares`
- `party_rooms` : salons multijoueurs façon Kahoot
- `party_players` : participants du salon

### Modération

- `warnings`
- `reports`

### Admin

- `admin_activity_logs`
- `geojson_custom_maps`

### Duels

- `duels`
- `duel_matchmaking_queue`
