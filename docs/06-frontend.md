# 06 — Architecture & Composants Frontend

## 1. Stack Technique

- **Framework** : React 18 + TypeScript + Vite
- **Styling** : TailwindCSS avec système de boutons et cartes tactiles 3D (`border-b-4`, `active:translate-y-0.5`, `rounded-2xl` / `rounded-3xl`)
- **Icônes** : `lucide-react`
- **Graphiques** : `recharts`
- **Cartographie 2D** : `react-simple-maps`, `world-atlas`, `topojson-client`, `swiss-maps`, `us-atlas`
- **Cartographie 3D** : `react-globe.gl` + `three.js`
- **Audio & Physique** : Web Audio API native + `canvas-confetti`

---

## 2. Charte Graphique & Design Tactile

L'application adopte une identité visuelle chaleureuse et ludique inspirée de l'ergonomie Duolingo :
- **Boutons 3D tactiles** : fond coloré vif, bord inférieur renforcé de 4px (`border-b-4`) créant un effet d'enfoncement mécanique au clic (`active:translate-y-1`).
- **Cartes & Conteneurs** : arrondis prononcés (`rounded-2xl` ou `rounded-3xl`), bordures nettes et contrastées (`border-2 border-emerald-100` ou `border-gray-200`) et ombres douces.
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
│   ├── admin/             # Console d'administration, analytics, gestionnaires
│   ├── atlas/             # Planisphère D3, globe 3D, recherche prédictive, micro-états, fiches pays
│   ├── audio/             # Radio Globe 3D interactif et lecteur de stations mondiales
│   ├── auth/              # Formulaires connexion/inscription sous AuthLayout
│   ├── common/            # Avatar, Confetti, Toast, modales réutilisables
│   ├── conquest/          # Pokédex Géographique & Conquête Mondiale (cartes TCG, fog of war)
│   ├── daily/             # Carte et modal du Quiz du Jour
│   ├── duels/             # Page des duels, matchmaking radar, Ghost Runs
│   ├── friends/           # Liste d'amis, requêtes, chat direct
│   ├── games/             # Mini-jeux (Geo Detective, Chrono Rush, Silhouette, etc.)
│   ├── home/              # Accueil connecté, globe d'exploration, quêtes
│   ├── landing/           # Accueil public vitrine, témoignages, aperçu
│   ├── layout/            # Navbar responsive, bandeau d'annonces globales
│   ├── leaderboard/       # Classement mondial, ligues hebdomadaires
│   ├── party/             # Mode Salon Kahoot-like (lobby, live game, podium)
│   ├── profile/           # Profil, statistiques, suivi de flamme
│   ├── quizzes/           # Création, édition, lecture de quiz multi-modes
│   └── shop/              # Boutique de cosmétiques (cadres et thèmes)
├── contexts/
│   ├── AuthContext.tsx         # Gestion de la session, du profil et du rôle admin
│   ├── LanguageContext.tsx     # Internationalisation multilingue (6 langues)
│   └── NotificationContext.tsx # Notifications toasts et alertes de duels
├── hooks/
│   ├── useNetworkStatus.ts     # Détection de l'état de connexion en ligne/hors-ligne
│   └── usePersistentState.ts   # Synchronisation d'état avec le localStorage
├── i18n/                       # Traductions complètes (fr, en, de, es, it, pt)
└── lib/                        # Algorithmes de jeux, client Supabase, sound engine
```

---

## 4. Layouts & Navigation

1. **`Navbar.tsx`** :
   - Présente en permanence sur toutes les pages applicatives.
   - Intègre le vrai logo TerraCoast, le niveau du joueur, les gemmes, l'indicateur de flamme quotidienne cliquable avec calendrier, le commutateur de son muet/actif, et les raccourcis vers Duels, Party, Jeux, Atlas et Profil.
   - Menu tiroir latéral responsive pour les petits écrans mobiles.
2. **`AuthLayout.tsx`** :
   - Encapsulation des pages de connexion et d'inscription avec carte d'accueil, bénéfices de jeu et bascule fluide entre création de compte et connexion.
3. **`AdminDashboardLayout.tsx`** :
   - Sidebar moderne v2.4 dédiée aux administrateurs avec accès direct aux 18 modules (Hub Central, Analytics, Modération, Photos Geo Detective, Équilibrage gameplay sans vies).

---

## 5. Provenance et Consommation des Données
Pour une cartographie complète de l'origine de chaque donnée (démographie, polygones cartographiques, photos géolocalisées, audio) et de ses composants consommateurs dans le frontend, consultez [`16-data-sources-and-usage.md`](./16-data-sources-and-usage.md).

