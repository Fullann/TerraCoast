# 09 — Social & Duels

## Social

Composants principaux :
- amis (friendships)
- chat 1:1 (chat_messages)
- partage de quiz (quiz_shares)

## Duels

Le mode duel repose sur :
- `duels` : état d’un duel, participants, sessions associées
- `game_sessions` : une session par joueur
- logique matchmaking / ranked ajoutée par migrations dédiées

## Flags & configuration

Certaines features duels sont contrôlées via flags (migration dédiée) :
- anti-rematch
- élargissement progressif du matchmaking
- affichage MMR adverse, etc.

## Historique / ranked

Le ranked, l’Elo/MMR, et les protections (guards) sont gérés par :
- tables supplémentaires
- RPC SQL
- triggers (selon migrations 20260308xx/20260309xx)

