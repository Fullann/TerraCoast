# 01 — Vue d'Ensemble (Produit & Technique)

## 1. Mission & Philosophie

**TerraCoast** est une plateforme web moderne dédiée à l'apprentissage de la géographie par le jeu et l'interaction sociale.

Sa philosophie repose sur quatre piliers :
1. **L'accessibilité totale** : gratuit, réactif sur mobile comme sur ordinateur, sans installation requise (compatible PWA).
2. **La gamification bienveillante** : design chaleureux inspiré de Duolingo, boutons tactiles 3D (`border-b-4`), micro-animations réjouissantes, séries quotidiennes (flammes) et absence de barrières punitives.
3. **La diversité pédagogique** : cartes vectorielles 2D, globes 3D interactifs, imagerie satellite, reconnaissance de silhouettes, comparaisons de données démographiques réelles (ONU/Banque Mondiale).
4. **La communauté & le partage** : création libre de quiz, duels asynchrones ou en direct, et salons multijoueurs grand écran pour les classes et soirées entre amis.

---

## 2. Périmètre Fonctionnel

### A. Quiz & Pédagogie
- **Éditeur de Quiz enrichi** : création de quiz personnalisés avec questions à choix unique, choix multiples, vrai/faux, saisie libre, puzzle sur carte interactive, remise en ordre Top 10 et questions multi-critères (nom, capitale, clic carte).
- **Parcours de Quêtes** : progression linéaire le long d'un sentier d'apprentissage géographique avec verrouillage/déblocage de paliers et étoiles de performance.
- **Révision ciblée** : module automatique de révision des erreurs commises à la fin d'une session.
- **Entraînement Zen (`/training`)** : catalogue complet de quiz jouables sans chronomètre pour apprendre à son rythme.
- **Répétition Espacée SRS (`/games/srs`)** : mémorisation à long terme basée sur le système de boîtes de Leitner avec flashcards interactives recto/verso.

### B. Pokédex Géographique & Conquête Mondiale (`/conquest`)
- **Collection de Cartes TCG Holographiques** : 250 pays et territoires à débloquer avec 4 niveaux de rareté (🌟 Légendaire, 🏛️ Épique, 🏰 Rare, 📍 Commune).
- **Condition de Capture Équitable** : validation automatique d'un pays dès qu'un joueur atteint le seuil requis (≥ 80% de précision par défaut, configurable par l'administration) lors d'un quiz, défi quotidien ou duel.
- **Brouillard de Guerre Interactif (*Fog of War*)** : le globe terrestre commence dans la pénombre ; chaque pays conquis s'illumine en vert émeraude vibrant ou éclat doré sur le planisphère vectoriel.
- **Anatomie de Carte Complète** : monument emblématique illustré avec récit historique, anecdote culturelle insolite (*fun fact*), fiche démographique et certificat horodaté d'explorateur.
- **Album & Jauges Continentales** : suivi de complétion mondial et par continent, filtres par rareté et mode masque mystère.

### C. Hub des Jeux Géographiques (`/games`)
- **Geo Detective (`/games/geo-detective`)** : identification de lieux à partir de photos et satellites avec mini-carte zoomable haute précision et outil d'administration pour ajouter, modifier ou supprimer des emplacements personnalisés.
- **Chrono Rush (`/games/chrono-rush`)** : contre-la-montre de 45 secondes sous haute tension avec multiplicateurs de score et questions ultra-rapides.
- **Silhouette Mystère (`/games/silhouette`)** : deviner un pays à partir de son contour vectoriel brut avec indices géodésiques (distance Haversine et boussole).
- **Higher or Lower (`/games/higher-lower`)** : jeu de cartes comparatif opposant populations ou superficies.
- **Map Blitz (`/games/map-blitz`)** : course contre la montre de localisation sur carte 2D.
- **Physical Geo (`/games/physical-geo`)** : défi sur les reliefs, fleuves, mers et déserts du globe.
- **Travle (`/games/travle`)** : relier deux pays frontière par frontière avec le chemin le plus court.
- **Radio Globe 3D (`/radio-globe`)** : écoute en direct de milliers de stations webradio géolocalisées sur le globe.

### D. Duels 1v1 & Compétition (`/duels`)
- **Tour de jeu limpide** : affichage immédiat de l'état d'action (*C'est à toi de jouer !* vs *En attente du tour de l'adversaire*).
- **Matchmaking 1v1** :
  - **Mode Classé 🏆** : points MMR/ELO, classement compétitif.
  - **Mode Amical 🎮** : parties d'entraînement libres.
  - Interface radar animée avec critères de difficulté et sélection thématique ciblée.
- **Défis directs entre amis** : modal tactile avec recherche d'amis et de quiz.
- **Ghost Runs 👻** : défis asynchrones générant un lien partageable ou un QR code pour défier n'importe qui sur un temps record.

### E. Mode Salon Multijoueur / Party (`/party`)
- **Expérience collective façon Kahoot** : l'organisateur crée un salon public ou privé avec un code PIN à 6 chiffres.
- **Mode Grand Écran pour l'Hôte** : possibilité pour l'organisateur de ne pas être compté comme joueur afin de projeter uniquement le plateau de jeu sur rétroprojecteur ou téléviseur.
- **Prise en charge des quiz privés** : l'hôte peut sélectionner ses propres créations pour animer une session sur mesure.
- **Podium & Célébrations** : podium 3D, confettis et mode Battle Royale (élimination progressive).

### F. Atlas & Exploration (`/atlas`)
- **Visualisation 2D / 3D** : navigation fluide sur planisphère D3 vectoriel ou globe WebGL.
- **Recherche Prédictive Intelligente** : moteur de recherche insensible aux accents et à la casse avec autocomplétion instantanée et centrage automatique de la caméra sur le pays sélectionné.
- **Prise en Charge des Micro-États** : repères circulaires accentués pour rendre parfaitement cliquables les micro-états (Monaco, Vatican, Saint-Marin, Andorre, Liechtenstein, Singapour, Tuvalu, etc.).
- **Fiches pays complètes** : populations certifiées (ONU/Banque Mondiale 2023), superficies, langues, capitales, monnaies et pays limitrophes cliquables.
- **Comparateur & TrueSize** : outil de superposition vectorielle pour apprécier la superficie réelle des pays sans distorsion cartographique.

### G. Gamification & Boutique (`/shop`)
- **Philosophie d'Apprentissage Positif** : aucune barrière punitive de vies ou cœurs limités ; le joueur peut s'entraîner en continu sans restriction.
- **Progression globale** : XP, niveaux de joueur, titres de prestige.
- **Flamme Quotidienne (Streaks 🔥)** : suivi du nombre de jours consécutifs avec calendrier hebdomadaire et bonus d'XP progressif (+10% à +50%).
- **Boutique cosmétique** : cadres d'avatars personnalisés et thèmes graphiques pour le globe 3D.
- **Ligues & Récompenses hebdomadaires** : distribution automatique de coffres et gemmes pour le Top 3 tous les dimanches soir à minuit.

### H. Console d'Administration v2.4 (`/admin`)
- **Hub Central de Configuration Directe** : 18 modules classés en 4 piliers stratégiques (Données & Utilisateurs, Modes de Jeux, Cartographie, Système).
- **Gestionnaire Geo Detective** : interface complète pour ajouter, modifier ou supprimer des photographies avec coordonnées GPS et prévisualisation.
- **Équilibrage du Gameplay** : ajustement en direct du seuil de conquête Pokédex (ex. 80%), de la minuterie par question et de l'économie d'XP.
- **Tableau de bord & Analytics** : suivi de fréquentation avec filtres J-1, J-7, J-30 et graphiques multi-courbes.
- **Modération & Validation** : validation des quiz communautaires et géolocalisation inline des quiz orphelins.
- **Couverture Géographique** : matrice des pays couverts par des contenus pédagogiques.
- **Audit & Sécurité** : journalisation de toutes les actions d'administration via la fonction RPC `log_admin_event`.

---

## 3. Architecture Technique Simplifiée

```mermaid
flowchart TD
    subgraph Client [Navigateur Client - React SPA]
        Router[React Router DOM]
        State[Contexts: Auth, Lang, Notif]
        UI[Design Tactile Duolingo + TailwindCSS]
        Audio[Synthétiseur Web Audio API]
    end

    subgraph Supabase [Backend Supabase]
        Auth[Auth / JWT]
        Postgres[(PostgreSQL + RLS)]
        Realtime[Realtime Channels / Presence]
        Storage[Storage Buckets]
        RPC[Fonctions SQL / Triggers]
    end

    Router --> UI
    UI --> State
    UI --> Audio
    State --> Auth
    UI --> Postgres
    UI --> Realtime
    UI --> Storage
    UI --> RPC
```

- **Source de vérité backend** : `src/supabase/migrations/*.sql`
- **Contrats et typage** : `src/lib/database.types.ts`
- **Client unique** : `src/lib/supabase.ts`
- **Cartographie des données (Data Lineage)** : [`16-data-sources-and-usage.md`](./16-data-sources-and-usage.md)
