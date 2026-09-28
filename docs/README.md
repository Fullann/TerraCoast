# Documentation Technique & Produit — TerraCoast 🌍

Ce dossier regroupe l'ensemble de la documentation technique, d'architecture et de gameplay du projet **TerraCoast**.

---

## Table des Matières

### 📌 1. Vue d’Ensemble & Architecture
- [`01-overview.md`](./01-overview.md) — Mission, philosophie de gamification, personas et inventaire complet des fonctionnalités.
- [`02-architecture.md`](./02-architecture.md) — Architecture SPA, découpage avec `react-router-dom` et `lazyWithRetry`, canaux temps réel Supabase et moteur audio natif.

### 🗄️ 2. Base de Données & Supabase
- [`03-database-schema.md`](./03-database-schema.md) — Modèle relationnel PostgreSQL (profils, quiz, questions, sessions, duels, salons party, etc.).
- [`04-security-rls.md`](./04-security-rls.md) — Politiques de sécurité Row Level Security (RLS) et permissions d'accès.
- [`05-storage.md`](./05-storage.md) — Gestion des buckets de stockage (avatars, illustrations de quiz, GeoJSON).

### 💻 3. Frontend & Expérience Utilisateur
- [`06-frontend.md`](./06-frontend.md) — Design system tactile Duolingo (`border-b-4`), arborescence des composants, layouts et contextes React.
- [`07-i18n.md`](./07-i18n.md) — Internationalisation multilingue (Français, Anglais, Allemand, Espagnol, Italien, Portugais).

### 🎮 4. Modes de Jeu & Fonctionnalités Sociales
- [`08-gameplay.md`](./08-gameplay.md) — Typologies de questions (QCM, texte, puzzle, Top 10), Hub des mini-jeux (Geo Detective, Chrono Rush, Silhouette, Higher/Lower, Travle, SRS) et mode entraînement.
- [`09-social-duels.md`](./09-social-duels.md) — Duels 1v1 (clarté des tours de jeu, radar de matchmaking ELO/MMR), Mode Salon Party (Kahoot-like, mode écran seul, quiz privés), Ghost Runs 👻 et chat d'amis.
- [`10-admin-dashboard.md`](./10-admin-dashboard.md) — Console d'administration, analytics périodiques (J-1/7/30), validation des quiz, configuration du site et couverture cartographique.

### 🛠️ 5. Runbook & Maintenance
- [`11-development.md`](./11-development.md) — Guide pour les développeurs, installation locale, exécution des tests et bonnes pratiques de code.
- [`12-deployment.md`](./12-deployment.md) — Déploiement et intégration continue.

### 📐 6. Annexes & Références
- [`13-diagrams.md`](./13-diagrams.md) — Schémas Mermaid des flux applicatifs clés.
- [`14-supabase-contracts.md`](./14-supabase-contracts.md) — Contrats d'interfaces, fonctions RPC et déclencheurs.
- [`15-storage-policies.md`](./15-storage-policies.md) — Politiques de sécurité S3 Storage.

---

## Sources de Vérité
- **Schéma DB & Migrations** : `src/supabase/migrations/*.sql`
- **Typage TypeScript DB** : `src/lib/database.types.ts`
- **Client Supabase** : `src/lib/supabase.ts`
- **Journal des Développements** : `walkthrough.md`
