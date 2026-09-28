# TerraCoast 🌍

*Apprends la géographie de manière ludique, sociale et gratuite.*

<p align="center">
  <img src="./public/logo.png" alt="Logo TerraCoast" height="84" />
</p>

## À propos

**TerraCoast** est une plateforme web interactive et communautaire dédiée à l'apprentissage de la géographie par le jeu. Inspirée des meilleures mécaniques de gamification (style tactile Duolingo, compétitions en direct façon Kahoot, défis quotidiens et exploration 3D), elle s'adresse aux élèves, étudiants, passionnés et curieux du monde entier.

Le projet est une **SPA React moderne** connectée à **Supabase** (Authentification + PostgreSQL + RLS + Storage + Realtime + RPC). La logique métier et la sécurité reposent sur les fonctions SQL, les canaux de présence temps réel et les politiques Row Level Security (RLS).

---

## Liens Utiles

- **Site officiel** : 👉 [https://TerraCoast.ch](https://TerraCoast.ch)
- **Documentation technique** : voir le dossier [`docs/`](./docs/README.md)
- **Journal des fonctionnalités** : [`walkthrough.md`](./walkthrough.md)

---

## Fonctionnalités Principales

### 🧠 1. Quiz & Parcours d'Apprentissage
- **Création & Édition de Quiz** : éditeur visuel complet avec support d'images, de questions QCM, Vrai/Faux, texte libre, puzzles sur carte, classements Top 10 et multi-champs (nom, capitale, clic carte).
- **Parcours Pédagogique (Quêtes)** : progression pas à pas avec déblocage de nœuds, étoiles et révision des erreurs.
- **Mode Entraînement Zen** : pratique sans chronomètre ni pression pour ancrer les connaissances.
- **Répétition Espacée (SRS / Leitner)** : système de flashcards 3D en 5 boîtes pour la mémorisation durable.

### 🎮 2. Hub des Jeux Géographiques (`/games`)
- **Geo Detective** : analyse d'images satellites haute résolution et repérage précis sur mini-carte zoomable.
- **Chrono Rush** : survie contre la montre de 45 secondes avec multiplicateurs de combos.
- **Silhouette Mystère** : devine le pays uniquement par sa forme vectorielle avec indices progressifs et distance géodésique.
- **Higher or Lower** : duel de cartes comparant population ou superficie.
- **Map Blitz** : course d'identification rapide de territoires sur carte.
- **Physical Geo** : identification des reliefs, fleuves, montagnes et déserts.
- **Travle** : relie deux pays frontière par frontière avec le moins de détours possible.

### ⚔️ 3. Duels 1v1 & Matchmaking (`/duels`)
- **Interface Tactile Simplifiée** : statut visuel instantané indiquant clairement à qui revient le tour de jeu (*"À toi de jouer !"* vs *"En attente de l'adversaire"*).
- **Matchmaking 1v1 Rapide** :
  - **Mode Classé 🏆** : calcul d'ELO/MMR en temps réel et classement mondial.
  - **Mode Amical 🎮** : parties d'entraînement sans enjeu de points.
  - Écran radar animé avec recherche intelligente par difficulté et filtres thématiques.
- **Défis entre Amis & Invitations** : envoi de défis personnalisés avec avatars et sélection de quiz.
- **Ghost Runs 👻** : défis asynchrones partageables par lien direct ou QR code.

### 👑 4. Mode Salon / Party Multijoueur (`/party`)
- **Expérience type Kahoot** : l'hôte crée un salon avec code PIN à 6 chiffres et QR code.
- **Support Écran Grand Format** : option exclusive permettant à l'hôte d'agir en tant que simple écran de projection sans participer comme joueur.
- **Accès aux Quiz Privés de l'Hôte** : possibilité pour l'organisateur de lancer ses propres quiz créés sur mesure.
- **Synchronisation Realtime** : questions en direct, podium animé, confettis et mode Battle Royale (élimination).

### 🗺️ 5. Atlas Interactif & TrueSize (`/atlas`)
- **Globe 3D & Carte 2D** : rotation fluide, thèmes de globe personnalisés et fiches pays complètes (données ONU / Banque Mondiale 2023).
- **Comparateur de Pays & TrueSize Overlay** : superposition vectorielle pour comparer la taille réelle des pays sans la déformation de Mercator.

### 🏆 6. Gamification, Récompenses & Boutique (`/shop`)
- **Points d'XP, Niveaux & Rangs**.
- **Séries Quotidiennes (Flamme / Streaks 🔥)** avec calendrier hebdomadaire et bonus d'XP progressif.
- **Boutique Cosmétique** : cadres d'avatar exclusifs, thèmes de globe 3D et titres de profil.
- **Classements Hebdomadaires & Mensuels** : ligues compétitives et coffres de gemmes pour le Top 3 le dimanche soir à minuit.

### 🛡️ 7. Administration & Modération (`/admin`)
- **Tableau de Bord & Analytics** : métriques d'activité comparées J-1, J-7 et J-30 avec exports CSV.
- **Validation des Quiz** : workflow de modération avant publication communautaire.
- **Configuration Globale du Site** : gestion des bannières d'annonces, promotions automatiques et maintenance.
- **Suivi de Couverture Géographique** : matrice des pays couverts par des quiz.
- **Gestion des Utilisateurs** : avertissements, bannissements et journalisation d'audit via RPC (`log_admin_event`).

---

## Architecture & Technologies

| Domaine | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS (Design tactile Duolingo) |
| **Routage** | `react-router-dom` avec découpage dynamique (`lazyWithRetry`) |
| **Backend & Données** | Supabase (PostgreSQL, Row Level Security, Triggers SQL, RPC) |
| **Temps Réel** | Supabase Realtime Channels (Broadcast + Presence pour le mode Party) |
| **Cartographie 2D & 3D** | `react-simple-maps`, `world-atlas`, `react-globe.gl`, `three`, TopoJSON |
| **Audio & Effets** | Synthétiseur Web Audio API natif (`src/lib/soundManager.ts`) + Canvas Confetti |
| **Graphiques** | `recharts` |
| **Tests** | Vitest (32 suites de tests, 205 tests unitaires passés avec succès) |

---

## Structure du Projet

```text
src/
  components/
    admin/        # Dashboard, analytics, validation, config site, couverture pays
    atlas/        # Carte 2D, globe 3D, fiches pays, comparateur TrueSize
    auth/         # Connexion, inscription, garde de routes (AuthLayout)
    common/       # Avatar, modales, toasts, confettis, badges
    conquest/     # Conquête territoriale
    daily/        # Quiz du jour & classement quotidien
    duels/        # Duels 1v1, matchmaking radar, Ghost Runs asynchrones
    friends/      # Liste d'amis, demandes d'amitié, chat
    games/        # Hub des mini-jeux (Geo Detective, Chrono Rush, Silhouette, etc.)
    home/         # Accueil, globe d'exploration, parcours de quêtes
    landing/      # Page de présentation publique & témoignages
    layout/       # Barre de navigation responsive, bannières d'annonces
    party/        # Salon multijoueur Kahoot-like (lobby, live game, podium)
    profile/      # Profil joueur, paramètres, gestion de la flamme
    quizzes/      # Éditeur de quiz, catalogue, moteur de jeu multi-modes
    shop/         # Boutique cosmétique (cadres, thèmes de globe)
  contexts/       # AuthContext, LanguageContext, NotificationContext
  i18n/           # Système multilingue (FR, EN, DE, ES, IT, PT)
  lib/            # Client Supabase, gestionnaires métier, algorithmes de jeu
  supabase/       # Migrations SQL, schémas, politiques RLS et fonctions RPC
docs/             # Documentation technique complète
```

---

## Démarrage Rapide

### Prérequis
- Node.js (version 18 ou supérieure)
- npm ou yarn

### Installation
```bash
git clone https://github.com/Fullann/TerraCoast.git
cd TerraCoast
npm install
```

### Configuration (.env)
Crée un fichier `.env` à la racine :
```env
VITE_SUPABASE_URL=https://ton-projet.supabase.co
VITE_SUPABASE_ANON_KEY=ta-cle-publique-anon
```

### Lancement du Serveur de Développement
```bash
npm run dev
```
L'application est disponible sur [http://localhost:5173](http://localhost:5173).

### Scripts Utiles
- **Exécuter les tests** : `npm test -- --run`
- **Vérifier les types TypeScript** : `npx tsc --noEmit`
- **Compiler pour la production** : `npm run build`
- **Linter le code** : `npm run lint`

---

## Auteurs & Remerciements

- **[Fullann]** – Conception de la plateforme et développement
- **[Biscome]** – Passionné de géographie & retours produit
- La communauté des passionnés de géographie et de cartographie !
