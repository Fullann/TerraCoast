# 06 — Architecture & Composants Frontend

## 1. Stack Technique

- **Framework** : React 18 + TypeScript + Vite
- **Styling** : TailwindCSS avec design system tactile Duolingo 2.0 (`card-duo`, `btn-duo`, `border-b-4`, `active:translate-y-0.5`, `rounded-2xl` / `rounded-3xl`)
- **Icônes** : `lucide-react`
- **Graphiques** : `recharts`
- **Cartographie 2D** : `react-simple-maps`, `world-atlas`, `topojson-client`, `swiss-maps`, `us-atlas`
- **Cartographie 3D** : `react-globe.gl` + `three.js`
- **Audio & Physique** : Web Audio API native + `canvas-confetti` + Web Speech API (TTS culturel)

---

## 2. Charte Graphique & Design Tactile Duolingo 2.0

L'application adopte une identité visuelle chaleureuse, vivante et tactile inspirée de l'ergonomie Duolingo :
- **Boutons 3D tactiles (`btn-duo`)** :
  - `btn-duo-green` : actions de validation et succès (vert émeraude `#58cc02`).
  - `btn-duo-blue` : actions primaires, navigation et lancements (bleu `#1cb0f6`).
  - `btn-duo-white` : actions neutres, secondaires et retours (fond blanc, bordure 3D ardoise).
  - `btn-duo-teal` : mode audio, radio et exploration.
  - Tous intègrent une bordure inférieure physique `border-b-4` créant une réaction mécanique d'enfoncement (`active:translate-y-1 active:border-b-0`).
- **Cartes & Conteneurs (`card-duo`)** :
  - Arrondis généreux (`rounded-2xl` ou `rounded-3xl`), double bordure avec ombrage 3D (`border-2 border-b-4 border-slate-200/80`) et fond blanc immaculé ou dégradé doux.
- **Formulaires & Inputs Tactiles** :
  - Champs de texte avec bordure inférieure `border-b-4` changeant de couleur au focus (`focus:border-emerald-500` ou `focus:border-sky-500`).
- **Palette chromatique cohérente** :
  - Émeraude / Sarcelle : validation, actions principales, parcours de quêtes.
  - Ambre / Or : séries de flammes quotidiennes, couronnes, podiums et XP.
  - Indigo / Violet : compétitions classées, salons multijoueurs (Party) et matchmaking.
  - Ciel / Bleu : détente, modes amicaux et atlas.
  - Rose / Corail : alertes, erreurs et décomptes d'urgence.

---

## 3. Structure des Dossiers Frontend

```text
src/
├── components/
│   ├── admin/             # Console d'administration (18 modules, layout dédié)
│   ├── atlas/             # Planisphère D3, globe 3D, recherche prédictive, micro-états, TrueSize
│   ├── audio/             # Radio Globe 3D interactif et lecteur de stations mondiales
│   ├── auth/              # Formulaires connexion/inscription sous AuthLayout
│   ├── cards/             # TerraDex (album TCG, cartes holographiques, ouverture boosters)
│   ├── common/            # Avatar, Confetti, ToastContainer, modales réutilisables
│   ├── conquest/          # Pokédex Géographique & Conquête Mondiale (carte Fog of War)
│   ├── daily/             # Carte et modal du Quiz du Jour
│   ├── duels/             # Page des duels, matchmaking radar, Ghost Runs
│   ├── friends/           # Liste d'amis, requêtes d'amitié, statuts et défis
│   ├── chat/              # Messagerie instantanée sécurisée avec retour vers amis
│   ├── games/             # 11 mini-jeux (Geo Detective, Chrono Rush, Silhouette, Border Puzzle, etc.)
│   ├── home/              # Accueil connecté, globe d'exploration, quêtes, pays de la semaine
│   ├── landing/           # Accueil public vitrine, témoignages, aperçu
│   ├── layout/            # Navbar responsive, bandeau d'annonces globales
│   ├── leaderboard/       # Classement mondial, ligues hebdomadaires
│   ├── legal/             # Mentions légales et politique de confidentialité (card-duo)
│   ├── missions/          # Missions quotidiennes avec barre de progression et coffres
│   ├── party/             # Mode Salon Kahoot-like (lobby, live game, podium)
│   ├── profile/           # Profil, statistiques, streak modal, paramètres
│   ├── quizzes/           # Création, édition, lecture de quiz multi-modes
│   └── shop/              # Boutique de cosmétiques (cadres et thèmes)
├── contexts/
│   ├── AuthContext.tsx         # Gestion de la session, du profil et du rôle admin
│   ├── LanguageContext.tsx     # Internationalisation multilingue (6 langues)
│   ├── NotificationContext.tsx # Notifications toasts et alertes de duels
│   └── RadioGlobeContext.tsx   # Streaming audio et stations mondiales
├── hooks/
│   ├── useNetworkStatus.ts     # Détection de l'état de connexion en ligne/hors-ligne
│   └── usePersistentState.ts   # Synchronisation d'état avec le localStorage
├── i18n/                       # Traductions modulaires (fr, en, de, es, it, pt)
└── lib/                        # Algorithmes de jeux, records, client Supabase, sound engine
```

---

## 4. Layouts, Navigation & Plein Écran Dynamique

1. **`Navbar.tsx` & `ProtectedRoute.tsx`** :
   - Présente sur les pages de découverte et hubs (`/`, `/atlas`, `/conquest`, `/games`, `/friends`, `/shop`).
   - **Masquage Automatique Intelligent** : la Navbar disparaît automatiquement sur les sessions de mini-jeux actives (`/games/:id`), les quiz en cours (`/quizzes/play/*`, `/duels/play/*`, `/party`) et l'espace d'administration (`/admin/*`) pour supprimer les doubles en-têtes et libérer 100% de l'écran.
   - Intègre le logo officiel, le niveau du joueur, les gemmes, l'indicateur de flamme avec calendrier, le commutateur audio et le tiroir responsive mobile.
2. **`AtlasPage.tsx`** :
   - Barre de filtres et recherche arrimée sous la Navbar (`sticky top-16 md:top-[72px] z-30 bg-white/95 backdrop-blur-md`) pour éviter tout chevauchement lors du défilement.
3. **`AdminDashboardLayout.tsx`** :
   - Header exécutive sombre avec statut en direct, fil d'Ariane et raccourci "Voir le site".
   - Sidebar gauche avec 18 modules catégorisés et zone de travail responsive.

---

## 5. Provenance et Consommation des Données
Pour une cartographie complète de l'origine de chaque donnée (démographie, polygones cartographiques, photos géolocalisées, audio) et de ses composants consommateurs dans le frontend, consultez [`16-data-sources-and-usage.md`](./16-data-sources-and-usage.md).
