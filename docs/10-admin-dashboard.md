# 10 — Admin Dashboard & Analytics

## Accès

L’accès admin est basé sur :
- `profiles.role === 'admin'`

## Shell admin

Le shell admin fournit :
- une sidebar par domaines
- une navigation vers les pages admin (gestion quiz, validation, modération, utilisateurs, config, analytics)

## Dashboard (vue admin)

KPI et widgets :
- utilisateurs
- quiz
- quiz à valider
- signalements/warnings en attente
- quiz sans localisation
- badges

## Workflow “quiz sans localisation”

Objectif : corriger rapidement les quiz sans coordonnées (`location_lat/lng`).

- Filtre : “Sans localisation”
- Bouton rapide : ouvre l’éditeur inline (lat/lng) directement dans la liste

## Analytics

L’onglet Analytics expose :
- comparatifs **J-1 / J-7 / J-30**
- deltas vs période précédente
- courbe multi-séries (sessions/joueurs/nouveaux comptes/nouveaux quiz)
- tops (catégories/tags par volume de parties)
- stats joueurs (actifs 24h/7j/30j, engagement, top joueurs, rétention approximative)
- export CSV

## Logs admin

`admin_activity_logs` enregistre :
- `actor_id`, `action`, `entity_type`, `entity_id`, `details`, `created_at`

La journalisation se fait via la RPC :
- `log_admin_event(...)`

