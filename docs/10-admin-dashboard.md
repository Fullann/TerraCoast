# 10 — Console d'Administration & Pilotage v2.4

## 1. Sécurité & Droits d'Accès

L'accès à la console d'administration (`/admin`) est strictement restreint au niveau du routeur React et des politiques PostgreSQL RLS :
- **Condition d'accès frontend** : `profiles.role === 'admin'` vérifié dans `ProtectedRoute.tsx`.
- **Masquage intelligent du header joueur** : la Navbar globale gamifiée est masquée pour donner 100% de la surface au bandeau exécutive sombre et à la console de pilotage.
- **Sécurité base de données** : chaque requête et fonction RPC (`site_config`, `terra_cards`, `log_admin_event`) valide les droits admin via PostgreSQL RLS.

---

## 2. Structure & 18 Modules de Pilotage

La console d'administration intègre **18 modules spécialisés** sous [`AdminDashboardLayout.tsx`](file:///Users/fullann/Documents/GitHub/TerraCoast/src/components/admin/layout/AdminDashboardLayout.tsx) répartis en 4 sections :

### 📊 Section 1 : Pilotage & Intelligence
1. **Vue d'Ensemble & KPI (`/admin`)** :
   - Indicateurs globaux en direct (utilisateurs inscrits, quiz validés, sessions terminées, duels joués).
   - Outils développeur pour créditer/réinitialiser XP, gemmes, boosters et tester l'attribution instantanée de badges et titres.
2. **Intelligence Géo — 250 Pays (`/admin/countries`)** :
   - Surveillance en temps réel du taux de reconnaissance de chaque pays.
   - Classement des pays les plus maîtrisés et des pièges géographiques mondiaux.
   - **Bouton 1-clic direct ⭐ « Définir comme Pays de la Semaine »** sur chaque pays avec pré-remplissage automatique des anecdotes, de la capitale et du continent.
   - Export CSV complet du rapport de géo-intelligence.
3. **Statistiques & Rétention (`/admin/analytics`)** :
   - Filtres temporels dynamiques (**J-1**, **J-7**, **J-30**).
   - Graphiques d'engagement et de complétion des quiz (`recharts`).

### 🗺️ Section 2 : Quêtes, Cartes & GeoGuessr
4. **Parcours Pédagogique (`/admin/path`)** :
   - Configuration des unités d'apprentissage, assignation des quiz aux nœuds oscillants, réglage des coffres et étoiles requises.
5. **GeoGuessr & Lieux Photo (`/admin/geodetective`)** :
   - Ajout de nouveaux clichés satellite ou sol avec coordonnées GPS précises (latitude/longitude), pays, difficulté et prévisualisation sur mini-carte.
   - Édition et suppression en direct des photos existantes.
6. **Quiz & Banques de Questions (`/admin/quizzes`)** :
   - Gestion du catalogue, affectation de thématiques, géolocalisation inline des quiz orphelins.
7. **Modération & Approbations (`/admin/validation`)** :
   - Examen et validation des quiz soumis par les membres de la communauté.
8. **Subdivisions Régionales GeoJSON (`/admin/geojson`)** :
   - Téléversement et gestion des fichiers GeoJSON/TopoJSON (cantons suisses, régions françaises, etc.).
9. **Cartes TerraDex & Raretés (`/admin/cards`)** :
   - **Créateur de carte en direct** : modale tactile 3D pour créer de nouvelles cartes (numéro, nom, catégorie, rareté, statistiques, anecdote, citation, couleurs de dégradé).
   - **Modification de rareté en 1 clic** (Commune, Rare, Épique, Légendaire, Mythique).
   - **Gestion de catalogue** : masquage, suppression, restauration et import/export JSON.
   - **Synchronisation automatique** avec la table Supabase `terra_cards`.

### 🛡️ Section 3 : Modération & Communauté
10. **Utilisateurs & Permissions (`/admin/users`)** :
    - Gestion des comptes, rôles (`user`, `moderator`, `admin`), sanctions et changement forcé de pseudo.
11. **Signalements & Sanctions (`/admin/warnings`)** :
    - Traitement des signalements communautaires et historique des avertissements.
12. **Avis & Témoignages Homepage (`/admin/homepage-testimonials-management`)** :
    - Modération et sélection des avis affichés sur la page vitrine.

### ⚙️ Section 4 : Configuration & Économie
13. **Personnalisation & Réglages du Site (`/admin/site-config`)** :
    - **Pays de la Semaine (Spotlight National)** : sélection parmi les 250 pays, badge d'en-tête (ex: `PAYS DE LA SEMAINE`), slogan, monument vedette, capsule culturelle TTS, multiplicateur XP bonus (+50%, 2X) et gemmes bonus.
    - **Bannière d'Annonce Globale** : activation, texte, type visuel (info, succès, alerte, célébration), bouton et URL de redirection.
    - **Événements Mondiaux & Double XP** : titre de saison, activation et multiplicateur d'XP en direct.
    - **Équilibrage Gameplay & Économie** : gemmes par série quotidienne, gemmes de victoire, seuil de conquête Pokédex (ex: 80%), minuterie par question.
    - **Thème Visuel & Mode Maintenance** : thème du globe, continent en vedette, activation de maintenance avec message d'attente.
    - **Synchronisation Temps Réel Supabase** : persistance sur la table `site_config` propagée à tous les joueurs connectés ou anonymes.
    - Modale tactile 3D de confirmation pour la réinitialisation.
14. **Duels, Kahoot & Battle Royale (`/admin/duels`)** :
    - Paramètres de matchmaking ELO/MMR et supervision des salons party.
15. **Badges & Trophées (`/admin/badges`)** :
    - Configuration des critères d'attribution des badges.
16. **Titres Honorifiques (`/admin/titles`)** :
    - Définition des titres de prestige et réassignation globale.
17. **Catégories Thématiques (`/admin/categories`)** :
    - Gestion de l'arbre des thématiques de quiz.
18. **Niveaux de Difficulté & Formats (`/admin/difficulties`, `/admin/types`)** :
    - Gestion des coefficients et formats de questions.

---

## 3. Traçabilité & Journal d'Audit (`admin_activity_logs`)

Toutes les actions sensibles sont consignées de manière immuable via la fonction RPC PostgreSQL :
- **Fonction SQL** : `log_admin_event(action, entity_type, entity_id, details)`
- **Champs enregistrés** : identifiant de l'administrateur (`actor_id`), action réalisée, type d'entité, identifiant de l'élément modifié, horodatage UTC et données contextuelles au format JSON.
