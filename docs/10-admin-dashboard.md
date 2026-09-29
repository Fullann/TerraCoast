# 10 — Console d'Administration & Pilotage v2.4

## 1. Sécurité & Droits d'Accès

L'accès à la console d'administration (`/admin`) est strictement restreint au niveau du routeur React et des politiques PostgreSQL RLS :
- **Condition d'accès** : `profiles.role === 'admin'`.
- Toute tentative d'appel API par un utilisateur non-administrateur est immédiatement rejetée par la base de données PostgreSQL.

---

## 2. Structure & Hub Central de Configuration Directe

La console d'administration intègre un **Hub Central de Configuration Directe** composé de **18 modules d'administration** organisés en 4 piliers stratégiques :

### 📊 Pilier 1 : Données, Utilisateurs & Sécurité
1. **Analytics & Métriques Clés (`/admin`)** :
   - Indicateurs globaux (utilisateurs, quiz validés, sessions terminées, signalements en attente).
   - Sélecteur de période temporelle dynamique (**J-1**, **J-7**, **J-30**) avec calcul automatique des pourcentages de variation.
   - Graphiques multi-courbes interactifs (`recharts`) et export CSV instantané des rapports d'activité.
2. **Gestion des Utilisateurs (`/admin/users`)** :
   - Recherche en direct par pseudo, email ou identifiant.
   - Attribution et modification des rôles (`user`, `moderator`, `admin`).
   - Outils de modération : avertissements formels, bannissement temporaire ou révocation définitive.
   - Outils développeur pour créditer ou réinitialiser l'XP des utilisateurs : synchronisation instantanée avec Supabase (`profiles.experience_points`, `profiles.level`, `profiles.monthly_score`), recalcul automatique du palier de ligue Duolingo, mise à jour des classements mensuels/généraux, déclenchement des titres gagnés via triggers PostgreSQL, et rafraîchissement temps réel de toute l'interface sans rechargement.
3. **Validation & Modération des Quiz (`/admin/quizzes`)** :
   - Examen des quiz soumis par la communauté (statut `pending`).
   - Outil de géolocalisation inline permettant d'attribuer rapidement des coordonnées GPS (`latitude`, `longitude`) aux quiz orphelins pour les afficher sur le globe 3D.
4. **Signalements & Modération (`/admin/reports`)** :
   - Traitement des signalements d'erreurs géographiques, questions litigieuses ou comportements inappropriés.
5. **Journal d'Audit Système (`/admin/audit`)** :
   - Registre immuable de toutes les actions d'administration via la fonction RPC `log_admin_event()`.

### 🎮 Pilier 2 : Modes de Jeux & Contenus
6. **Éditeur de Quiz Général (`/quizzes/create`)** :
   - Accès direct au constructeur de quiz multi-typologies (QCM, texte, puzzles cartographiques, classements Top 10).
7. **Gestionnaire Geo Detective Photos (`/admin/geo-detective`)** :
   - **Ajout de nouveaux clichés** : téléversement d'URL d'image haute résolution, nom du lieu, pays associé, niveau de difficulté et coordonnées GPS précises (latitude/longitude).
   - **Édition & Correction** : mise à jour instantanée des coordonnées ou du cadrage d'une photo.
   - **Suppression** : retrait en un clic d'un cliché de la rotation de jeu.
   - **Prévisualisation interactive** : affichage du rendu photo et de l'emplacement cible sur mini-carte.
8. **Gestion du Parcours de Quêtes (`/admin/learning-path`)** :
   - Configuration des nœuds pédagogiques du sentier d'apprentissage mondial.
9. **Supervision des Duels & Matchmaking (`/admin/duels`)** :
   - Historique des affrontements 1v1, équilibrage des gains/pertes d'ELO et calibration du radar de matchmaking.
10. **Salons Multijoueurs Party (`/admin/party`)** :
    - Supervision des salons temps réel actifs et statistiques des sessions de groupe.
11. **Stations Radio Globe (`/admin/radio`)** :
    - Monitoring des flux audio et indexation géographique des stations.

### 🗺️ Pilier 3 : Cartographie, Données & Géographie
12. **Matrice de Couverture des Pays (`/admin/tracking`)** :
    - Synthèse cartographique des 250 pays et territoires reconnus.
    - Identification visuelle immédiate des pays sous-représentés en quiz afin de guider la création de contenus.
13. **Explorateur Atlas & Fiches Pays (`/atlas`)** :
    - Inspection des fiches d'identité nationales et vérification des données démographiques ONU/Banque Mondiale.
14. **Comparateur & TrueSize (`/atlas`)** :
    - Outil d'analyse de projection vectorielle sans distorsion.
15. **Subdivisions & Régions (`/admin/subdivisions`)** :
    - Contrôle des entités infranationales (cantons suisses, départements français, provinces canadiennes).

### ⚙️ Pilier 4 : Système, Configuration & Événements
16. **Configuration Globale du Site & Gameplay (`/admin/site-config`)** :
    - **Équilibrage Gameplay** :
      - Seuil de précision pour la conquête Pokédex (`conquestAccuracyThreshold`, ex: 80%).
      - Minuterie configurable par question de quiz (10s, 15s, 20s, 30s).
      - Multiplicateur d'XP par défaut.
    - **Modèle sans blocage** : suppression définitive des limites de cœurs/vies au profit de la pratique libre.
17. **Événements & Double XP (`/admin/events`)** :
    - Déclenchement d'opérations spéciales à durée déterminée (week-ends Double XP, festivités géographiques).
    - Pays à l'honneur de la semaine (*Featured Country*) avec multiplicateur d'XP bonus.
18. **Bannière d'Annonce & Maintenance** :
    - Message d'alerte global personnalisable (variantes : information, succès, avertissement, alerte, célébration) avec bouton d'action et lien.
    - Activation du mode maintenance avec message d'attente convivial pour les visiteurs.

---

## 3. Outils Développeur & Test Rapide

Dans l'onglet principal [`AdminPage.tsx`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/components/admin/AdminPage.tsx), un panneau dédié aux tests permet :
- **Ajustement instantané d'XP** : ajouter +100 XP, +500 XP ou réinitialiser le profil de test pour vérifier les passages de niveaux et l'attribution des titres de prestige.
- **Lien direct "Voir le site ↗️"** : pour basculer facilement entre la console d'administration et la vue utilisateur.

---

## 4. Journal d'Audit & Traçabilité (`admin_activity_logs`)

Toutes les actions d'administration sensibles sont consignées de manière immuable via la fonction RPC PostgreSQL :
- **Fonction SQL** : `log_admin_event(action, entity_type, entity_id, details)`
- **Champs enregistrés** : identifiant de l'administrateur (`actor_id`), action réalisée, type d'entité, identifiant de l'élément modifié, horodatage UTC et données contextuelles au format JSON.

---

## 5. Référence aux Sources de Données
Pour connaître l'origine détaillée de toutes les données exploitées et modérées par la console d'administration, consultez [`16-data-sources-and-usage.md`](./16-data-sources-and-usage.md).
