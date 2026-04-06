# 01 — Overview (Produit & Tech)

## Mission

**TerraCoast** est une plateforme d’apprentissage de la géographie, ludique et sociale, basée sur :
- des quiz communautaires (création / modification / partage),
- des modes de jeu variés (solo, entraînement, duels),
- une progression (XP, niveaux, badges, titres, classement).

## Stack technique

- **Frontend** : React 18 + TypeScript + Vite + TailwindCSS
- **Cartographie** :
  - 2D : `react-simple-maps`, `world-atlas`, `topojson-client`
  - 3D : `react-globe.gl` + `three`
  - subdivisions : `swiss-maps`, `us-atlas`
- **Backend** : Supabase (Postgres + Auth + RLS + RPC + Storage)
- **Charts** : `recharts`

## Concepts clés

- **Supabase** est la source de vérité (données + politiques d’accès).
- **RLS** protège les données au niveau DB.
- **Admin** : rôle `profiles.role = 'admin'` donnant accès aux modules d’administration.
- **i18n** : traductions centralisées, langage stocké dans `profiles.language`.

## Principales fonctionnalités

- **Quiz**
  - création / édition
  - validation admin (workflow “pending” → “approved/rejected”)
  - publication / visibilité (privé / public / global)
  - géolocalisation admin (`quizzes.location_lat`, `quizzes.location_lng`)
  - modes avancés : puzzle map, top10 order, country_multi, etc.
- **Social**
  - amis
  - chat
  - partages de quiz
- **Duels**
  - duels (solo/duel)
  - ranked / matchmaking (migrations dédiées)
  - flags d’options via `duel_feature_flags`
- **Admin**
  - dashboard + analytics
  - modération (warnings/reports)
  - gestion quiz + localisation inline
  - logs admin (`admin_activity_logs`)

