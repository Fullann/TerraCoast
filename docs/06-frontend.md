# 06 — Frontend (React)

## Stack

- React 18 + TypeScript
- Vite
- TailwindCSS
- `lucide-react` (icônes)
- `recharts` (graphes)
- carto : `react-simple-maps`, `react-globe.gl`

## Entrée & env

Variables requises (à la racine dans `.env`) :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Client Supabase :
- `src/lib/supabase.ts`

## Navigation

Navigation interne par `currentView` (SPA).
Le shell admin encapsule toutes les vues admin et fournit une sidebar.

## Contexts (état global)

- `AuthContext`
  - session
  - `profile`
  - refresh profil
- `LanguageContext`
  - `language`
  - `t(key)` pour traductions
- `NotificationContext`
  - notifications (success/error/info)
  - callback de navigation (pour ouvrir une vue depuis une notification)

## Modules principaux

- `components/quizzes/`
  - listing + recherche + carte 2D
  - création / édition
  - play (modes : QCM, puzzle, top10, multi-champs, duels)
- `components/home/`
  - globe 3D et points quiz (géolocalisation)
- `components/admin/`
  - dashboard + analytics
  - gestion quiz, validation, modération, users

