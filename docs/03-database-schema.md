# 03 — Base de données (Schéma)

## Source de vérité

- Migrations : `src/supabase/migrations/*.sql`
- Types : `src/lib/database.types.ts`

## Principales tables

> Cette liste est une vue “produit”. Pour le détail exact, se référer aux migrations.

### `profiles`

Profil applicatif (lié à `auth.users`) :
- `id` (uuid, PK) : identifiant user
- `pseudo`
- `role` : `'user' | 'admin'`
- progression : `level`, `experience_points`, `published_quiz_count`
- modération : `is_banned`, `ban_until`, `ban_reason`, `force_username_change`
- i18n : `language`, `show_all_languages`
- duels : `duel_rating`, `duel_ranked_games`, `duel_ranked_wins`
- mensuel : `monthly_score`, `monthly_games_played`, `current_streak`, `longest_streak`, etc.

### `quizzes`

Objet quiz :
- `id`, `creator_id`
- contenu : `title`, `description`, `category`, `tags[]`
- visibilité : `is_public`, `is_global`
- validation : `validation_status`, `pending_validation`
- gameplay : `difficulty`, `time_limit_seconds`, `randomize_questions`, `randomize_answers`, `quiz_type_id`
- stats : `total_plays`, `average_score`, `is_reported`, `report_count`
- médias : `cover_image_url`
- géolocalisation admin : `location_lat`, `location_lng` (+ contraintes de range dans une migration dédiée)

### `questions`

Questions d’un quiz :
- `quiz_id`
- `question_type` (ex. `mcq`, `puzzle_map`, `top10_order`, `country_multi`, etc. selon migrations)
- `correct_answer`, `correct_answers?`
- `options` (JSON)
- `map_data` (JSON) : paramètres puzzle/top10/country-multi, vues cartes, etc.
- `points`, `order_index`

### `game_sessions` / `game_answers`

Tracking des parties :
- session : score, précision, temps, mode (solo/duel), timestamps
- answers : user_answer, is_correct, points_earned, time_taken_seconds

### Social

- `friendships`
- `chat_messages`
- `quiz_shares`

### Modération

Deux systèmes coexistent dans l’historique :
- `reports` : signalements (quiz / message)
- `warnings` : workflow de sanctions et historique (migration dédiée)

### Admin / Observabilité

- `admin_activity_logs` : logs admin
- RPC : `log_admin_event(...)` (SECURITY DEFINER) pour tracer les actions admin

### Duels / ranked (selon migrations)

Plusieurs migrations ajoutent :
- matchmaking, ranked duels, flags de features, scheduler, guards, etc.

## Migrations notables

- Schéma initial : `20251003140304_create_geography_quiz_schema.sql`
- Logs admin : `20260308230000_add_admin_activity_logs.sql`
- Localisation quiz (admin) : `20260326113000_quiz_admin_location.sql`
- Cartes GeoJSON custom : `20260324180000_geojson_custom_maps.sql`

