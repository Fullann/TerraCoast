# 02 — Architecture

## Architecture logique

TerraCoast est une application SPA (Single Page App) :
- **UI** (React) gère navigation + vues + composants.
- **Supabase** fournit Auth + DB + Storage + RPC.

```mermaid
flowchart LR
  UI[React + TS (Vite)] -->|supabase-js| SB[Supabase]
  SB --> AUTH[Auth]
  SB --> DB[Postgres + RLS]
  SB --> RPC[SQL RPC + Triggers]
  SB --> ST[Storage]
```

## Navigation (views)

Le projet utilise une navigation interne par `currentView` (ex. `home`, `quizzes`, `play-quiz`, `admin`, etc.).
Le shell admin (sidebar) encapsule les vues admin (ex. `admin`, `quiz-management`, `admin-analytics`).

## Découpage du code

- `src/components/`
  - `admin/` : pages admin, dashboard, analytics
  - `home/` : page d’accueil (globe 3D, actions rapides, etc.)
  - `quizzes/` : parcours quiz (listing, création, édition, play)
  - `duels/` : matchmaking/duels
  - `profile/` : profil, settings, account details
  - `layout/` : navbar, layout général
- `src/contexts/`
  - `AuthContext` : session utilisateur + profil + rôle
  - `LanguageContext` : i18n
  - `NotificationContext` : notifications + navigation callback
- `src/lib/`
  - `supabase.ts` : client Supabase
  - `database.types.ts` : types DB
  - data helpers (ex. `countryGameData.ts`, `customGeojsonMaps.ts`)

## Données & contrats

La source de vérité des contrats est :
- migrations SQL (`src/supabase/migrations/*.sql`)
- types générés/maintenus dans `src/lib/database.types.ts`

