# 10 — Console d'Administration & Pilotage

## 1. Sécurité & Droits d'Accès

L'accès à la console d'administration (`/admin`) est strictement restreint au niveau du routeur React et des politiques PostgreSQL RLS :
- **Condition d'accès** : `profiles.role === 'admin'`.
- Toute tentative d'appel API par un utilisateur non-administrateur est immédiatement rejetée par la base de données.

---

## 2. Modules d'Administration

Le shell d'administration (`src/components/admin/layout/AdminDashboardLayout.tsx`) regroupe les outils de gestion en plusieurs sections :

### A. Tableau de Bord & Analytics (`AdminPage.tsx`)
- **Métriques Clés (KPI)** : nombre total d'utilisateurs inscrits, quiz publiés, sessions jouées et signalements en attente.
- **Comparatifs Périodiques** : variation de l'activité sur **J-1**, **J-7** et **J-30** avec calcul automatique des deltas par rapport à la période précédente.
- **Graphiques Multi-Courbes (`recharts`)** : évolution conjointe des sessions jouées, des créations de comptes et des nouveaux quiz.
- **Analyses d'Engagement** : temps moyen par session, taux de rétention estimé, classement des catégories les plus populaires.
- **Export CSV** : téléchargement en 1 clic des rapports statistiques pour analyse externe.

### B. Validation & Modération des Quiz (`QuizValidationPage.tsx`)
- **Workflow de validation** : les quiz créés par la communauté sont initialement au statut `pending`.
- L'administrateur peut inspecter l'ensemble des questions, tester le quiz, l'approuver (`approved`) ou le rejeter avec un motif (`rejected`).
- **Correction Rapide de Localisation** : outil inline pour attribuer rapidement des coordonnées GPS (`location_lat` / `location_lng`) aux quiz qui en sont dépourvus afin de les faire apparaître sur le globe 3D.

### C. Configuration Générale du Site (`SiteConfigPage.tsx`)
- **Bannière d'Annonce Globale** : activation d'un bandeau d'alerte en haut du site avec message personnalisé et niveau de priorité (information, succès, avertissement).
- **Mode Maintenance** : verrouillage temporaire de la plateforme avec message d'information pour les utilisateurs.
- **Promotion Hebdomadaire** : configuration des récompenses automatiques distribuées tous les dimanches soir à minuit pour le Top 3 du classement.

### D. Matrice de Couverture Géographique (`CountryTrackingPage.tsx`)
- Visualisation synthétique des 250 pays et territoires reconnus.
- Indicateurs visuels montrant les pays disposant déjà de quiz de qualité et ceux nécessitant encore la création de contenus pédagogiques.

### E. Gestion des Utilisateurs & Modération (`UserManagementPage.tsx`)
- Recherche d'utilisateurs par pseudo ou identifiant.
- Attribution de rôles (`user`, `moderator`, `admin`).
- Système d'avertissements (*warnings*) et bannissement temporaire ou définitif.
- Forçage de changement de pseudo en cas de non-respect de la charte.

---

## 3. Journal d'Audit & Traçabilité (`admin_activity_logs`)

Toutes les actions d'administration sensibles sont consignées de manière immuable via la fonction RPC PostgreSQL :
- **Fonction SQL** : `log_admin_event(action, entity_type, entity_id, details)`
- **Champs enregistrés** : identifiant de l'administrateur (`actor_id`), action réalisée, type d'entité, identifiant de l'élément modifié, horodatage UTC et données contextuelles au format JSON.
