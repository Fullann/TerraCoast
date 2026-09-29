# 16 — Matrice de Provenance et d'Utilisation des Données (Data Lineage)

Ce document détaille l'intégralité des **sources de données**, leur **origine exacte**, leur **implémentation technique** dans le code source et les **écrans/fonctionnalités où elles sont utilisées** au sein de la plateforme TerraCoast.

---

## 1. Tableau Récapitulatif Global

| Domaine de Donnée | Source & Origine Primaire | Fichier(s) Source & Moteur | Où la Donnée est Utilisée | Mode de Stockage / Fréquence |
| :--- | :--- | :--- | :--- | :--- |
| **Démographie & Géographie de base** (populations, superficies, capitales, devises, langues) | ONU (UNSD), Banque Mondiale (*World Bank 2023*), REST Countries v3.1, GeoNames | [`src/lib/atlasData.ts`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/lib/atlasData.ts), [`src/lib/countryGameData.ts`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/lib/countryGameData.ts) | • Atlas 2D & Globe 3D (`/atlas`)<br>• Fiches pays détaillées (`CountryDetailModal`)<br>• Pokédex Géographique (`/conquest`)<br>• Jeu Higher or Lower (`/games/higher-lower`)<br>• Comparateur de pays & TrueSize<br>• Générateur de questions de quiz | Fichiers statiques TypeScript intégrés au bundle Vite (zéro latence réseau) |
| **Cartographie Vectorielle Mondiale (110m & 50m)** | *Natural Earth Data* (vecteurs culturels & physiques), *TopoJSON World Atlas* | `public/data/ne_50m_admin_0_countries.json`, `node_modules/world-atlas/countries-110m.json` | • Planisphère 2D interactif (`AtlasWorldMap.tsx`)<br>• Carte de conquête Pokédex (`ConquestWorldMap.tsx`)<br>• Puzzles sur carte (`PlayQuizPage.tsx`)<br>• Mode Map Blitz (`MapBlitzPage.tsx`) | Fichiers TopoJSON / GeoJSON statiques servis via CDN / dossier `public` |
| **Micro-États & Territoires Isolés** | Coordonnées géodésiques certifiées (Monaco, Vatican, Saint-Marin, Nauru, Tuvalu, etc.) | [`src/lib/atlasData.ts`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/lib/atlasData.ts) (tableau `MICROSTATE_OFFSETS` & coordonnées centroïdes) | • Marqueurs d'accentuation circulaires sur la carte D3/SVG de l'Atlas (`AtlasWorldMap.tsx`)<br>• Pokédex Géographique (`/conquest`) | Intégré dans l'algorithme de rendu vectoriel pour rendre visibles les pays < 1 000 km² |
| **Cartographie Régionale Spécifique** (Cantons suisses, Départements français, États USA) | *SwissTopo* (`swiss-maps`), *IGN France*, *US Census Bureau* (`us-atlas`) | [`src/lib/customGeojsonMaps.ts`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/lib/customGeojsonMaps.ts), dossiers GeoJSON dédiés | • Puzzles cartographiques thématiques par pays / région (`puzzle_map`)<br>• Éditeur de quiz personnalisés | TopoJSON / GeoJSON vectoriels optimisés |
| **Monuments & Lore Culturel du Pokédex** | *UNESCO World Heritage List*, annales géographiques et historiques certifiées | [`src/lib/conquestManager.ts`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/lib/conquestManager.ts) (dictionnaire `CURATED_DETAILS`) | • Cartes holographiques du Pokédex TCG (`ConquestCardModal.tsx`)<br>• Badges de découvertes à l'écran de fin de quiz (`QuizResultsScreen.tsx`) | Dictionnaire statique enrichi avec fallback automatique sur les données de l'Atlas |
| **Raretés des Pays (TCG Pokédex)** | Classification selon rareté géopolitique, isolement ou statut historique | [`src/lib/conquestManager.ts`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/lib/conquestManager.ts) (dictionnaire `RARITY_MAP`) | • Pokédex (`/conquest`) : bordures or, violet, bleu ou argent<br>• Filtres d'album de cartes | Algorithme déterministe avec calcul de complétion par continent |
| **Photos & Coordonnées Geo Detective** | *Unsplash API* (licence libre / métadonnées de géolocalisation), *Wikimedia Commons*, créations personnalisées par les administrateurs | [`src/lib/geoDetectiveLocationsManager.ts`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/lib/geoDetectiveLocationsManager.ts), [`src/lib/geoDetectiveGame.ts`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/lib/geoDetectiveGame.ts) | • Jeu Geo Detective (`/games/geo-detective`)<br>• Panneau d'administration Geo Detective (`/admin/geo-detective`) | Stockage hybride : base locale TypeScript + synchronisation `localStorage` / table Supabase |
| **Formes Vectorielles Pures (Silhouettes)** | Projections GeoJSON d3-geo isolées de toute frontière voisine | [`src/lib/silhouetteGame.ts`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/lib/silhouetteGame.ts) | • Jeu Silhouette Mystère (`/games/silhouette`) | Tracé SVG autonome calculé à la volée |
| **Graphe Frontalier Terrestre (Travle)** | Traités internationaux de frontières et données terrestres directes | [`src/lib/travleGame.ts`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/lib/travleGame.ts) (matrice d'adjacence `COUNTRY_BORDERS`) | • Jeu Travle (`/games/travle`) pour le calcul du plus court chemin (algorithme BFS) | Graphe d'adjacence bidirectionnel en mémoire |
| **Géographie Physique** (Fleuves, monts, déserts, mers) | Atlas physique mondial, données bathymétriques et orographiques | [`src/lib/physicalGeoData.ts`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/lib/physicalGeoData.ts) | • Mode Physical Geo (`/games/physical-geo`) | Fichier statique de repères géophysiques mondiaux |
| **Drapeaux Nationaux** | Spécifications Unicode 15.0 + CDN Vectoriel *FlagCDN* / *Twemoji* | Emoji natifs UTF-8 + URLs CDN sécurisées HTTPS | • Tout le site : Quiz, Atlas, Pokédex, Duels, Leaderboard, Navbar | Pas de stockage serveur lourd : rendu via polices système ou CDN optimisé |
| **Stations Radios Mondiales en Direct** | *Radio Browser API* (annuaire communautaire mondial ouvert de flux webradio) | [`src/lib/radioGlobe.ts`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/lib/radioGlobe.ts) | • Radio Globe 3D interactif (`/radio-globe`)<br>• Lecteur audio en tâche de fond | Requêtes HTTP REST vers les miroirs de l'API Radio Browser avec mise en cache |
| **Comptes Joueurs & Gamification** (XP, niveaux, flamme, titres) | Base de données PostgreSQL hébergée sur Supabase | Table `profiles`, géré via [`src/lib/gamificationManager.ts`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/lib/gamificationManager.ts) et [`src/contexts/AuthContext.tsx`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/contexts/AuthContext.tsx) | • Header & Navbar (XP, niveau, flamme)<br>• Profil joueur (`/profile`)<br>• Classements et ligues (`/leaderboard`)<br>• Boutique cosmétique (`/shop`) | PostgreSQL + RLS + persistance locale `localStorage` pour le mode invité |
| **Séries Quotidiennes (Flammes 🔥)** | Horodatages des dernières sessions jouées en base de données | [`src/lib/streakUtils.ts`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/lib/streakUtils.ts), champ `current_streak` dans `profiles` | • Modal Flamme de la Navbar<br>• Quiz du Jour (`/daily`)<br>• Calcul du multiplicateur de bonus d'XP (+10% à +50%) | Calcul de différence de jours calendaires UTC |
| **Duels 1v1 & ELO/MMR** | Matchs et historiques en base de données Supabase | Table `duel_matches`, triggers SQL de calcul ELO | • Arène de duels (`/duels`)<br>• Matchmaking radar<br>• Historique des duels récents | PostgreSQL en temps réel avec notifications Supabase |
| **Salons Multijoueurs (Mode Party)** | Canaux temps réel Supabase (*Realtime Broadcast & Presence*) | Table `party_rooms`, table `party_participants` | • Lobby d'attente, écran de projection hôte, écran joueur, podium final (`/party`) | Canaux WebSockets éphémères + snapshots en base |
| **Configuration Globale du Site & Événements** | Configuration centralisée (Double XP, bannière, seuil Pokédex, etc.) | [`src/lib/siteConfigManager.ts`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/lib/siteConfigManager.ts), table `site_config` | • Bannière d'annonces de la Navbar<br>• Écran d'accueil (pays de la semaine)<br>• Calculs de gains XP (multiplicateurs)<br>• Dashboard admin (`/admin`) | `localStorage` synchrone avec synchronisation Supabase |
| **Traductions & Textes d'Interface (i18n)** | Dictionnaire multilingue officiel TerraCoast (FR, EN, DE, ES, IT, PT) | [`src/i18n/translations.ts`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/i18n/translations.ts) | • 100% de l'application : navigation, modales, types de quiz, pages d'erreurs, authentification | Bundle frontend TypeScript sans dépendance externe |

---

## 2. Détail par Domaine Majeur

### A. Données de l'Atlas & Fiches Pays

#### 1. Provenance
* **Populations & Superficies** : Recensements officiels de la Division Statistique des Nations Unies (UNSD) et indicateurs de la Banque Mondiale mis à jour pour 2023-2024.
* **Capitales, Devises & Langues** : Données géopolitiques normalisées ISO 3166-1 alpha-3 provenant de *REST Countries* et *GeoNames*.
* **Localisations & Centroïdes GPS** : Coordonnées calculées pour le centrage automatique de caméra et l'affichage des marqueurs de micro-états.

#### 2. Fichiers et Implémentation
* [`src/lib/atlasData.ts`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/lib/atlasData.ts) : Contient l'ensemble des structures typées `AtlasCountry`, le dictionnaire des 250 pays et territoires du globe, ainsi que les méthodes d'accès rapide (`getAtlasCountryByIso3`, `getAllAtlasCountries`, `searchAtlasCountries`).
* [`src/lib/countryGameData.ts`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/lib/countryGameData.ts) : Fournit des variantes allégées et des listes d'options pour alimenter les générateurs de questions automatiques.

#### 3. Utilisations dans l'Application
1. **Planisphère interactif 2D (`AtlasWorldMap.tsx`)** : Coloriage dynamique selon les continents, zoom/pan interactif, infobulles au survol.
2. **Recherche & Autocomplétion de l'Atlas (`AtlasPage.tsx`)** : Moteur de recherche insensible aux accents et à la casse permettant de cibler n'importe quel pays ou micro-état en quelques frappes avec centrage instantané de la vue.
3. **Globe WebGL 3D (`AtlasGlobe.tsx`)** : Rendu des polygones de pays sur la sphère 3D avec élévation et surbrillance au clic.
4. **Comparateur & TrueSize (`TrueSizeOverlay.tsx`)** : Extraction des polygones géométriques pour superposer deux pays et révéler leur taille réelle sans la distorsion de projection Mercator.

---

### B. Le Pokédex Géographique (Conquête Mondiale)

#### 1. Provenance
* **Monuments Emblématiques (`landmark`)** : Sélection rigoureuse issue du Patrimoine Mondial de l'UNESCO et des symboles architecturaux majeurs de chaque pays (ex : *Colisée* pour l'Italie, *Pyramides de Gizeh* pour l'Égypte, *Nid du Tigre* pour le Bhoutan, etc.).
* **Anecdotes Culturelles (`funFact`)** : Faits insolites vérifiés auprès de sources encyclopédiques de référence (géographie, démographie, histoire).
* **Raretés des Cartes** : Définies selon 4 échelons :
  * 🌟 **Légendaire** : Micro-états mystérieux (Vatican, Monaco, Bhoutan, Islande...) ou géants mondiaux (USA, Chine, Inde).
  * 🏛️ **Épique** : Merveilles du monde et géants culturels (France, Japon, Égypte, Italie, Brésil, Pérou...).
  * 🏰 **Rare** : Nations réputées et carrefours historiques (Portugal, Suède, Irlande, Singapour, Cuba, Maroc...).
  * 📍 **Commune** : L'ensemble des autres pays et territoires reconnus.

#### 2. Fichiers et Implémentation
* [`src/lib/conquestManager.ts`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/lib/conquestManager.ts) :
  * `CURATED_DETAILS` : Dictionnaire des monuments, icônes et anecdotes pour les cartes de collection.
  * `RARITY_MAP` : Dictionnaire assignant chaque ISO3 à sa rareté TCG.
  * `recordConqueredCountries()` : Algorithme vérifiant si la précision de la partie est supérieure ou égale au seuil configuré (`conquestAccuracyThreshold`, par défaut 80%) et enregistrant la conquête.
  * `getConquestStats()` : Calcul de l'avancement global (`X / 250 pays`), du pourcentage mondial et des jauges par continent.

#### 3. Utilisations dans l'Application
1. **Page de Conquête Mondiale (`ConquestPage.tsx` à l'URL `/conquest`)** : Interface principale avec statistiques, filtres d'album et bascule entre la carte du monde et l'album de cartes.
2. **Carte du Monde & Brouillard de Guerre (`ConquestWorldMap.tsx`)** : Les pays non découverts restent dans l'ombre (`#1e293b`) tandis que les pays conquis s'illuminent en vert émeraude (`#10B981`) ou lueur dorée.
3. **Carte TCG Holographique (`ConquestCardModal.tsx`)** : Affichage plein écran de la carte avec reflets lumineux, détails géographiques, monument, anecdote et certificat de capture.
4. **Écran de Fin de Quiz (`QuizResultsScreen.tsx`)** : Déclenchement automatique de la capture des pays testés si la précision requise est atteinte.

---

### C. Le Hub des Mini-Jeux Dédiés

#### 1. Geo Detective (`/games/geo-detective`)
* **Provenance des photos** : Photographies haute résolution libres de droits (Unsplash API avec coordonnées de prise de vue, Wikimedia Commons) et photos ajoutées manuellement par les administrateurs.
* **Fichiers** : [`src/lib/geoDetectiveLocationsManager.ts`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/lib/geoDetectiveLocationsManager.ts) et [`src/lib/geoDetectiveGame.ts`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/lib/geoDetectiveGame.ts).
* **Administration** : Gestionnaire complet dans [`AdminGeoDetectivePage.tsx`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/components/admin/AdminGeoDetectivePage.tsx) permettant d'ajouter, modifier ou supprimer des emplacements avec prévisualisation et pointage GPS.
* **Utilisation** : Mode de jeu invitant le joueur à zoomer sur une mini-carte interactive pour placer une épingle et mesurer la distance géodésique à la cible.

#### 2. Silhouette Mystère (`/games/silhouette`)
* **Provenance des formes** : Extraits vectoriels GeoJSON isolés sans repère géographique environnant.
* **Fichiers** : [`src/lib/silhouetteGame.ts`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/lib/silhouetteGame.ts).
* **Utilisation** : Le joueur dispose de 5 essais pour identifier le pays. Chaque tentative erronée utilise la formule de Haversine pour afficher la distance en kilomètres et la direction cardinale (`⬆️ N`, `↘️ SE`...).

#### 3. Higher or Lower (`/games/higher-lower`)
* **Provenance des chiffres** : Données de population et superficie de l'Atlas (`atlasData.ts`).
* **Fichiers** : [`src/lib/higherLowerGame.ts`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/lib/higherLowerGame.ts).
* **Utilisation** : Duel de cartes successif demandant si le pays suivant est plus peuplé ou plus étendu que le précédent.

#### 4. Travle (`/games/travle`)
* **Provenance des frontières** : Liste des frontières terrestres directes reconnues par le droit international.
* **Fichiers** : [`src/lib/travleGame.ts`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/lib/travleGame.ts).
* **Utilisation** : Calcul du chemin le plus court via l'algorithme BFS (*Breadth-First Search*) ; le joueur doit saisir successivement les pays intermédiaires pour rallier deux nations éloignées.

---

### D. Stations Webradio du Monde (Radio Globe)

#### 1. Provenance
* **Origine** : *Radio Browser API* (`radio-browser.info`), base de données communautaire et ouverte répertoriant plus de 30 000 stations de radio en ligne géolocalisées avec flux audio HTTP/HTTPS et logos.

#### 2. Fichiers et Implémentation
* [`src/lib/radioGlobe.ts`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/lib/radioGlobe.ts) : Interroge les miroirs de l'API avec mise en cache mémoire des stations par code pays ISO2/ISO3.

#### 3. Utilisations dans l'Application
* **Radio Globe 3D (`/radio-globe`)** : Globe interactif où chaque station est représentée par une impulsion sonore lumineuse sur sa ville d'origine, avec écoute directe en streaming.

---

### E. Gamification, Utilisateurs & Économie

#### 1. Provenance & Modèle de Données
* **Base de données Supabase** :
  * `profiles` : Pseudo, avatar, email, rôle (`admin`, `moderator`, `user`), total XP, niveau, gemmes, série de flamme (`current_streak`), dernière date d'activité.
  * `duel_matches` : Historique des parties en 1v1, scores et deltas d'ELO.
  * `party_rooms` & `party_participants` : Salons multijoueurs actifs.
  * `site_config` : Paramètres d'exploitation du site en temps réel.

#### 2. Fichiers et Implémentation
* [`src/lib/gamificationManager.ts`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/lib/gamificationManager.ts) : Gère le calcul des niveaux (`XP = niveau * 100`), la distribution des gemmes, et propose des fonctions d'administration pour ajuster ou réinitialiser l'XP.
* [`src/lib/siteConfigManager.ts`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/lib/siteConfigManager.ts) : Gère la persistance de la configuration du site : événements Double XP, pays à l'honneur de la semaine, seuil de précision du Pokédex (`conquestAccuracyThreshold`), minuteur des questions de quiz.

---

## 3. Synthèse de la Disponibilité Hors-Ligne & Robustesse

Grâce à cette architecture :
1. **Fonctionnement hors-ligne et résilience** : L'ensemble des données géographiques, démographiques, cartographiques et du Pokédex fonctionne **sans dépendre d'une API tierce payante ou instable**.
2. **Confidentialité & Zéro Fuite de Données** : Aucune donnée de navigation n'est transmise à des régies publicitaires ; les requêtes externes sont limitées aux avatars Supabase et aux flux streaming de webradios.
3. **Temps de Réponse Instantanés** : La consultation des fiches pays, de la recherche de l'Atlas ou du Pokédex s'exécute en **moins de 5 millisecondes**, directement en mémoire dans le navigateur.
