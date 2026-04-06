# 13 — Diagrammes (Mermaid)

## Architecture globale

```mermaid
flowchart LR
  UI[React + TS (Vite)] -->|supabase-js| SB[Supabase]
  SB --> AUTH[Auth]
  SB --> DB[Postgres + RLS]
  SB --> RPC[RPC SQL + Triggers]
  SB --> ST[Storage]
```

## Parcours “jouer un quiz”

```mermaid
sequenceDiagram
  participant U as User (UI)
  participant FE as React
  participant SB as Supabase (DB)

  U->>FE: Ouvre un quiz
  FE->>SB: SELECT quizzes WHERE id=...
  FE->>SB: SELECT questions WHERE quiz_id=...
  FE->>SB: INSERT game_sessions (début partie)
  loop par question
    U->>FE: Répond
    FE->>SB: INSERT game_answers
  end
  FE->>SB: UPDATE/complétion session (selon mode)
```

## Workflow “validation quiz” (admin)

```mermaid
flowchart TD
  Q[Quiz pending_validation] -->|Admin| V[QuizValidationPage]
  V -->|approve| A[validation_status=approved, is_public=true]
  V -->|reject| R[validation_status=rejected]
  A --> LOG[log_admin_event]
  R --> LOG
```

## Workflow “geojson custom maps”

```mermaid
flowchart TD
  Upload[Admin upload GeoJSON] --> ST[Storage bucket: custom-geojson]
  Upload --> DB[geojson_custom_maps row status=pending]
  DB -->|approve| Approved[status=approved]
  Approved --> Public[Public read + use in quiz creation/play]
```

## Matchmaking/duels (vue très simplifiée)

```mermaid
sequenceDiagram
  participant FE as Frontend
  participant SB as Supabase RPC
  FE->>SB: rpc(create_or_match_random_duel)
  alt matched
    SB-->>FE: duel_id + quiz_id + opponent_id
    FE->>FE: (optionnel) afficher aperçu MMR
    FE->>FE: naviguer play-duel
  else waiting
    SB-->>FE: waiting=true
    FE->>SB: polling / refresh status
  end
```

