# 08 — Gameplay (Quiz & modes)

## Concepts

- Un **quiz** contient des **questions** ordonnées.
- Une partie crée une `game_session`, et chaque réponse une `game_answer`.
- Les points et la progression (XP / badges / titres) sont gérés via logique applicative + triggers/RPC selon migrations.

## Types de questions (haut niveau)

> La liste exacte dépend des migrations, mais on retrouve notamment :

- **QCM** (`mcq`)
- **Vrai/Faux**
- **Réponse texte**
- **Puzzle map**
  - drag & drop / clic sur carte selon mode
  - feedback visuel + support cartes monde/subdivisions/custom GeoJSON
- **Top 10 order**
  - ordonner une liste (UX : 2 colonnes 1–5 / 6–10)
  - drag & drop + interaction mobile “tap to move”
- **Country multi (multi-champs)**
  - plusieurs champs par cible (nom, capitale, clic carte)
  - support i18n pour noms + autocomplétion

## Géographie / cartes

- Monde : `world-atlas`
- Cantons CH : `swiss-maps`
- États US : `us-atlas`
- Départements FR : GeoJSON dédié (`subdivisionGameData`)
- Cartes custom : GeoJSON uploadé + preset (centre/zoom/idProperty)

