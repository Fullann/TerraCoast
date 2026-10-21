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

### Social & Multijoueur

- `friendships` : relations d'amitié (statut en attente, accepté, bloqué)
- `chat_messages` : messages instantanés chiffrés entre amis
- `quiz_shares` : partages de quiz directs
- `party_rooms` : salons multijoueurs temps réel façon Kahoot (code PIN, statut, paramètres d'hôte)
- `party_players` : participants du salon (pseudo, avatar, score, statut éliminé)

### Cartes de Collection (`terra_cards`)

Catalogue des cartes géographiques TerraDex :
- `id` (text, PK)
- `number`, `name`, `category`, `rarity` (`common`, `rare`, `epic`, `legendary`, `mythic`), `continent`
- `flag`, `icon`, `tagline`, `description`
- `stats` (JSONB) : puissance, superficie, population, culture
- `fun_fact`, `quote`, `color_scheme` (JSONB), `trivia` (JSONB)
- `is_active` (boolean), timestamps

### Configuration Globale en Direct (`site_config`)

Table maîtresse de configuration du site en temps réel :
- `id` (text, PK, default `'current'`)
- `announcement` (JSONB) : bannière d'annonce (message, variante, badge, actionUrl)
- `featured_country` (JSONB) : pays à l'honneur de la semaine (iso3, name, flag, bonus XP, gemmes, slogan, capsule audio)
- `gameplay` (JSONB) : double XP actif, gemmes quotidiennes de série, seuil de conquête
- `theme` (JSONB) : thème 3D du globe, continent en vedette, mode maintenance
- `updated_at`, `updated_by`

### Modération

Deux systèmes coexistent dans l’historique :
- `reports` : signalements (quiz / message)
- `warnings` : workflow de sanctions et historique (migration dédiée)

### Admin / Observabilité

- `admin_activity_logs` : journalisation d'audit des actions d'administration
- RPC : `log_admin_event(...)` (SECURITY DEFINER)
- RPC : `grant_arcade_rewards(p_xp, p_score, p_game_mode)` (SECURITY DEFINER) pour distribuer en toute sécurité l'XP des mini-jeux et actualiser le classement mensuel avec borne anti-triche et verrou atomique `FOR UPDATE`.

## Migrations notables

- Schéma initial : `20251003140304_create_geography_quiz_schema.sql`
- Logs admin : `20260308230000_add_admin_activity_logs.sql`
- Localisation quiz (admin) : `20260326113000_quiz_admin_location.sql`
- Cartes GeoJSON custom : `20260324180000_geojson_custom_maps.sql`
- Salons multijoueurs Party : `20260327000000_party_rooms.sql`
- Catalogue TerraCards : `20261003120000_create_terra_cards_catalog.sql`
- Récompenses Arcade Sécurisées : `20261016180000_grant_arcade_rewards_rpc.sql`
- Configuration en Direct : `20261021120000_create_site_config_table.sql`

