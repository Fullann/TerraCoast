# Duels - Scenarios E2E critiques

Ce document couvre 5 scenarios critiques, en manuel (automatisable Playwright/Cypress + fixtures SQL).

## Pre-requis communs

- 2 comptes test: `P1`, `P2`
- 1 quiz public valide pour duel
- Base propre avant chaque test (vider queue duel + duels en cours)
- Horodatage de reference note pour verifier expiration

---

## 1) Match trouve simultane

### Objectif
Verifier qu'un seul duel est cree quand deux joueurs lancent la recherche au meme moment.

### Etapes
1. `P1` et `P2` ouvrent l'onglet matchmaking.
2. Ils cliquent "Recherche classee" presque en meme temps.
3. Attendre la resolution.

### Resultats attendus
- Un seul enregistrement dans `duels` pour la paire `P1/P2` (`status = in_progress`).
- Les deux joueurs sortent de `duel_matchmaking_queue`.
- Les deux clients voient le meme `duel_id`.

### Verification SQL
```sql
select id, player1_id, player2_id, status
from public.duels
where (player1_id = :p1 and player2_id = :p2)
   or (player1_id = :p2 and player2_id = :p1)
order by created_at desc
limit 3;
```

---

## 2) Requeue empeche si duel actif

### Objectif
Verifier qu'un joueur deja engage dans un duel actif ne peut pas etre requeue.

### Etapes
1. Forcer `P1` dans un duel actif (`pending` ou `in_progress`).
2. Depuis `P1`, relancer le matchmaking.

### Resultats attendus
- Aucun nouvel enregistrement `duel_matchmaking_queue` pour `P1`.
- La RPC renvoie le duel actif existant (ou navigation vers celui-ci).
- Aucun nouveau duel cree.

### Verification SQL
```sql
select count(*) from public.duel_matchmaking_queue where user_id = :p1;
select count(*) from public.duels
where (player1_id = :p1 or player2_id = :p1)
  and status in ('pending','in_progress');
```

---

## 3) Expiration forfait P1/P2

### Objectif
Verifier qu'a expiration, si un seul joueur a joue, il gagne par forfait.

### Etapes
1. Creer un duel classe `P1` vs `P2`, ancien (date de creation depassee).
2. Lier uniquement la session de `P1`.
3. Lancer `public.expire_stale_ranked_duels(30)`.
4. Refaire le test symetrique avec uniquement `P2`.

### Resultats attendus
- Duel passe en `completed`.
- `winner_id` = joueur qui a une session.
- `completed_at` renseigne.

### Verification SQL
```sql
select id, status, winner_id, player1_session_id, player2_session_id, completed_at
from public.duels
where id = :duel_id;
```

---

## 4) Expiration sans joueur => cancelled

### Objectif
Verifier qu'un duel classe expire sans session est annule.

### Etapes
1. Creer un duel classe `pending` ancien.
2. Aucune session liee.
3. Lancer `public.expire_stale_ranked_duels(30)`.

### Resultats attendus
- `status = cancelled`
- `winner_id is null`
- `completed_at` renseigne

### Verification SQL
```sql
select id, status, winner_id, completed_at
from public.duels
where id = :duel_id;
```

---

## 5) Resultat final + update rating coherent

### Objectif
Verifier coherence resultat duel + deltas MMR + compteurs ranked.

### Etapes
1. Creer duel classe `P1` vs `P2`.
2. Lier les 2 sessions avec des scores differents via `link_duel_session_and_finalize`.
3. Verifier trigger `process_ranked_duel_result`.
4. Refaire cas egalite.

### Resultats attendus
- Duel `completed`, `winner_id` conforme aux scores.
- `player1_rating_delta` et `player2_rating_delta` signes opposes.
- `ranking_processed = true`.
- `duel_ranked_games` incremente pour les 2 joueurs.
- `duel_ranked_wins` incremente uniquement pour le gagnant (0 en egalite).

### Verification SQL
```sql
select id, status, winner_id, ranking_processed, player1_rating_delta, player2_rating_delta
from public.duels
where id = :duel_id;

select id, duel_rating, duel_ranked_games, duel_ranked_wins
from public.profiles
where id in (:p1, :p2);
```

---

## Conseils d'automatisation

- API-first: preparer et nettoyer les fixtures via SQL/RPC.
- UI-runner: piloter uniquement les clics utilisateurs (matchmaking, validation).
- Assertions doubles:
  - frontend (etat/texte/toast/navigation),
  - backend (lignes SQL finales).
- Isoler chaque scenario dans des comptes et quiz dedies.
