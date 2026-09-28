# 08 — Modes de Jeu & Mécaniques de Gameplay

## 1. Moteur de Quiz Principal

Le moteur d'exécution des quiz (`src/components/quizzes/play/PlayQuizPage.tsx`) prend en charge plusieurs typologies de questions :

1. **Question à Choix Multiples (QCM / `mcq`)** :
   - Sélection parmi 2 à 6 options textuelles ou illustrées.
   - Feedback sonore et visuel instantané (vert pour la réponse correcte, rouge pour l'erreur).
2. **Vrai ou Faux (`true_false`)** :
   - Affirmation avec choix binaire rapide.
3. **Réponse Texte Libre (`text`)** :
   - Saisie au clavier avec tolérance orthographique et insensibilité à la casse.
4. **Puzzle sur Carte (`puzzle_map`)** :
   - Cartes du monde, cantons suisses, départements français, états américains ou cartes GeoJSON personnalisées.
   - Les pays validés se colorent progressivement (carte cumulative).
5. **Classement Top 10 (`top10`)** :
   - Ordonnancement par glisser-déposer (*drag-and-drop*) ou clics alternés sur mobile pour classer des pays selon un critère donné (ex: superficie, population, médailles).
6. **Questions Multi-Champs (`country_multi`)** :
   - Identification combinée : nom du pays, capitale et localisation par clic direct sur la carte.

---

## 2. Mode Salon Multijoueur / Party (`/party`)

Inspiré de l'expérience Kahoot, ce mode permet de rassembler jusqu'à plusieurs dizaines de joueurs simultanément :

- **Création du Salon & Code PIN** :
  - L'hôte génère un salon protégé par un code à 6 chiffres et un QR code d'accès direct.
- **Support Écran Grand Format (Mode Hôte Dédié)** :
  - L'hôte dispose d'une option **« Ne pas jouer / Écran seulement »**. Il peut animer la partie depuis son ordinateur ou un projecteur sans avoir à répondre aux questions ni fausser les classements.
- **Accès aux Quiz Privés de l'Hôte** :
  - L'hôte peut lancer ses propres créations privées en plus du catalogue public et global.
- **Mode Battle Royale** :
  - Les joueurs disposent d'un nombre de vies défini ; les erreurs éliminent progressivement les participants jusqu'au dernier survivant.
- **Podium & Récompenses** :
  - Révélation dramatique des 3 meilleurs joueurs sur podium animé avec pluie de confettis et distribution d'expérience.

---

## 3. Hub des Jeux Géographiques Dédiés (`/games`)

### A. Geo Detective (`/games/geo-detective`)
- **Principe** : Identifier l'emplacement exact d'un lieu à partir d'une photo satellite haute résolution ou d'une vue au niveau du sol.
- **Mini-carte zoomable** : placement d'une épingle sur une carte interactive Leaflet/Mapbox pour valider son estimation.
- **Scoring géodésique** : attribution des points proportionnelle à la proximité en kilomètres du point cible.

### B. Chrono Rush (`/games/chrono-rush`)
- **Principe** : Course contre la montre de 45 secondes pour enchaîner le plus grand nombre de questions géographiques (capitales, drapeaux, continents).
- **Combos dynamiques** : chaque bonne réponse consécutive augmente le multiplicateur de score (x2, x3, x4 🔥) et ajoute +3 secondes au compteur. Chaque erreur retire 5 secondes.

### C. Silhouette Mystère (`/games/silhouette`)
- **Principe** : Trouver le pays mystère à partir de son contour vectoriel brut sans aucun repère textuel.
- **Indices progressifs** : 5 essais maximum. Après chaque essai, l'algorithme indique la distance géodésique (en km) et la direction boussole (`⬆️ N`, `↘️ SE`...) vers la cible, puis révèle le continent, la première lettre du nom et le drapeau.

### D. Plus Grand ou Plus Petit (`/games/higher-lower`)
- **Principe** : Duel comparatif opposant deux pays. Le joueur doit deviner si le second pays a une population ou une superficie supérieure ou inférieure au premier.
- **Records de série** : suivi du plus long enchaînement victorieux personnel.

### E. Map Blitz (`/games/map-blitz`)
- **Principe** : Trouver un maximum de pays sur la carte en un temps record (1 minute).

### F. Physical Geo (`/games/physical-geo`)
- **Principe** : Défis axés sur la géographie physique mondiale : fleuves majeurs, chaînes de montagnes, déserts, détroits et volcans.

### G. Travle (`/games/travle`)
- **Principe** : Relier un pays de départ à un pays d'arrivée en nommant successivement les pays frontaliers nécessaires, en minimisant le nombre d'étapes.

---

## 4. Apprentissage & Mémorisation Durable

### A. Répétition Espacée SRS (`/games/srs`)
- Basé sur l'algorithme de Leitner en 5 boîtes de mémorisation.
- Les cartes réussies montent de niveau et sont révisées à intervalles croissants (1j, 3j, 7j, 14j, 30j). Les erreurs redescendent immédiatement en boîte 1.
- Flashcards 3D avec retournement tactile recto/verso.

### B. Mode Entraînement Zen (`/training`)
- Parcours libre à travers l'ensemble des quiz du site.
- Aucun chronomètre, explications détaillées après chaque question, possibilité de rejouer immédiatement.

### C. Flamme Quotidienne & Quiz du Jour
- Algorithme de hachage déterministe (`YYYY-MM-DD`) pour proposer le même défi quotidien à l'ensemble de la communauté mondiale.
- Validation de la série quotidienne (flamme 🔥) octroyant jusqu'à +50% de bonus d'XP.
