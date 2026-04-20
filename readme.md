# TerraCoast 🌍

*Apprends la géographie de manière ludique, sociale et gratuite.*
<p align="center">
  <img src="./public/logo.png" alt="Logo TerraCoast" height="84" />
</p>

## À propos

TerraCoast est une plateforme interactive dédiée aux passionnés de géographie et aux curieux souhaitant apprendre en s’amusant.

Le projet est une **SPA React** connectée à **Supabase** (Auth + Postgres + RLS + Storage + RPC). Il n’y a pas de backend Node/Express dédié : la logique “backend” vit majoritairement dans la base (RLS, triggers, fonctions SQL).

## Liens

- **Site** : 👉 [Découvre TerraCoast](https://TerraCoast.ch)
- **Documentation technique** : voir le dossier [`docs/`](./docs/README.md)

## Fonctionnalités (high-level)

- **Quiz communautaires**
  - création / édition / partage
  - validation admin avant publication (workflow pending → approved/rejected)
  - géolocalisation admin (utilisée sur globe 3D / map 2D)
- **Modes de jeu**
  - QCM, texte, puzzle map, top10 order, multi-champs (nom/capitale/clic carte), etc.
  - entraînement
  - duels (incl. ranked/matchmaking selon migrations)
- **Social**
  - amis
  - chat
  - partage de quiz
- **Gamification**
  - XP, niveaux
  - badges, titres
  - classement mensuel
- **Admin**
  - dashboard moderne + analytics
  - gestion quiz (incl. “quiz sans localisation” avec correction rapide inline)
  - modération (warnings/reports)
  - logs admin (journalisation via RPC)

## Architecture & stack

- **Frontend** : React 18 + TypeScript + Vite + TailwindCSS
- **Backend** : Supabase (Auth + Postgres + RLS + RPC + Storage)
- **Cartographie**
  - 2D : `react-simple-maps`, `world-atlas`, `topojson-client`
  - 3D : `react-globe.gl` + `three`
  - Subdivisions : `swiss-maps`, `us-atlas`
- **Charts** : `recharts`

## Documentation

La documentation détaillée est dans [`docs/`](./docs/README.md), notamment :
- Architecture : [`docs/02-architecture.md`](./docs/02-architecture.md)
- DB : [`docs/03-database-schema.md`](./docs/03-database-schema.md)
- RLS/Sécurité : [`docs/04-security-rls.md`](./docs/04-security-rls.md)
- Admin : [`docs/10-admin-dashboard.md`](./docs/10-admin-dashboard.md)
- Contrats Supabase (RPC/tables) : [`docs/14-supabase-contracts.md`](./docs/14-supabase-contracts.md)
- Storage/policies : [`docs/15-storage-policies.md`](./docs/15-storage-policies.md)

## Structure du repo

```text
src/
  components/
    admin/        # dashboard, analytics, gestion quiz/users, modération
    home/         # accueil + globe 3D
    quizzes/      # listing, création/édition, play (modes)
    duels/        # duels + matchmaking
    profile/      # profil, settings, account details
    layout/       # navbar + layout général
    auth/         # login/register, banned, force rename
  contexts/       # AuthContext, LanguageContext, NotificationContext
  i18n/           # translations.ts (toutes langues)
  lib/            # supabase client, types DB, helpers data (pays, geojson, etc.)
  supabase/
    migrations/   # schéma DB, RLS, RPC, triggers
docs/             # documentation technique/projet (voir docs/README.md)
```

## Workflows clés (liens rapides)

- **Jouer un quiz (session + answers)** : [`docs/13-diagrams.md`](./docs/13-diagrams.md) + [`docs/08-gameplay.md`](./docs/08-gameplay.md)
- **Validation d’un quiz (admin)** : [`docs/10-admin-dashboard.md`](./docs/10-admin-dashboard.md)
- **Quiz sans localisation (admin quick-fix)** : [`docs/10-admin-dashboard.md`](./docs/10-admin-dashboard.md)
- **Cartes GeoJSON custom (upload → approval)** : [`docs/13-diagrams.md`](./docs/13-diagrams.md) + [`docs/05-storage.md`](./docs/05-storage.md)
- **Duels / matchmaking / ranked** : [`docs/09-social-duels.md`](./docs/09-social-duels.md) + [`docs/14-supabase-contracts.md`](./docs/14-supabase-contracts.md)
- **Sécurité (RLS + RPC)** : [`docs/04-security-rls.md`](./docs/04-security-rls.md)

## Démarrage du projet

### Prérequis

Assure-toi d’avoir installé :
- Node.js (version 18 ou supérieure)
- npm ou yarn

### Installation

Clone le projet :

```bash
git clone https://github.com/Fullann/TerraCoast.git
cd TerraCoast
```

Installe les dépendances :

```bash
npm install
```

### Configuration de l’environnement

Crée un fichier `.env` à la racine du projet et ajoute tes clés Supabase :

```bash
VITE_SUPABASE_URL=ton_url_supabase
VITE_SUPABASE_ANON_KEY=ta_cle_supabase
```

### Lancer le serveur de développement

```bash
npm run dev
```

Le projet sera accessible à l’adresse [http://localhost:5173](http://localhost:5173).

### Autres scripts utiles

- **Build du projet** :  
  ```bash
  npm run build
  ```
- **Vérification TypeScript** :  
  ```bash
  npm run typecheck
  ```
- **Lint du code** :  
  ```bash
  npm run lint
  ```
- **Prévisualisation de la build** :  
  ```bash
  npm run preview
  ```

## Supabase (DB / migrations)

- **Migrations SQL** : `src/supabase/migrations/*.sql`
- **Types DB TypeScript** : `src/lib/database.types.ts`
- **Client Supabase** : `src/lib/supabase.ts`

## Contribution

Les contributions sont les bienvenues !  
Si tu souhaites proposer une amélioration, corriger un bug ou ajouter une fonctionnalité, crée une *issue* ou une *pull request* sur GitHub.

## Auteurs

- **[Fullann]** – Développeur web & concepteur de la plateforme  
- **[Biscome]** – Passionné de géographie & testeur principal  

***


## Technologies
- React + TypeScript (UI réactive et typée)  
- Vite (dev server et build rapides)  
- Supabase (auth, base de données, RLS)  
