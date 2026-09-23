# Guide d'Intégration de la Sécurité Logicielle (DevSecOps CI/CD) — TerraCoast

Ce document détaille l'architecture et les mécanismes de sécurité intégrés au cycle de développement logiciel (**SDLC**) du projet **TerraCoast** à travers GitHub Actions. Il démontre la mise en pratique de l'approche **Shift-Left Security** : détecter et neutraliser les failles au plus tôt, avant tout déploiement en production.

---

## 1. Vue d'Ensemble & Architecture DevSecOps

Le pipeline CI/CD automatisé repose sur trois piliers fondamentaux de l'**Application Security (AppSec)** complétés par des barrières de qualité logicielle :

```
                        ┌──────────────────────────────────────────────────────────┐
                        │             Développeur (Commit / Pull Request)          │
                        └────────────────────────────┬─────────────────────────────┘
                                                     │
                                                     ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       PIPELINE DE SÉCURITÉ CI (GitHub Actions)                                   │
├───────────────────────────────┬───────────────────────────────┬───────────────────────────────┬──────────────────┤
│    1. DÉTECTION DE SECRETS    │      2. ANALYSE STATIQUE      │     3. ANALYSE DÉPENDANCES    │ 4. QUALITY GATE  │
│        (Secret Scanning)      │            (SAST)             │             (SCA)             │  (Types & Tests) │
├───────────────────────────────┼───────────────────────────────┼───────────────────────────────┼──────────────────┤
│  • Gitleaks                   │  • Semgrep                    │  • Dependabot (PR auto)       │  • Typecheck     │
│  • TruffleHog                 │  • Règles OWASP Top 10        │  • Snyk / npm audit           │    (TypeScript)  │
│  • Vérification .gitleaks.toml│  • Sécurité React & JS        │  • Seuil de criticité         │  • Vitest        │
│  • Zéro token en clair        │  • Export SARIF (Code Scan)   │    (Blocage failles High/Crit)│    (172 tests)   │
└───────────────────────────────┴───────────────────────────────┴───────────────────────────────┴──────────────────┘
                                                     │
                                                     ▼
                                     ┌───────────────────────────────┐
                                     │   Validation des 4 Portes ?   │
                                     └───────┬───────────────┬───────┘
                                             │               │
                                    OUI (OK) │               │ NON (Vulnérabilité)
                                             ▼               ▼
                        ┌────────────────────────┐  ┌───────────────────────────────────┐
                        │   DÉPLOIEMENT AUTORISÉ │  │     BLOCAGE DE LA PULL REQUEST    │
                        │    (FTP / Production)  │  │   Alerte SARIF dans GitHub Security│
                        └────────────────────────┘  └───────────────────────────────────┘
```

---

## 2. Pilier 1 : Analyse Statique du Code (SAST) avec Semgrep

### Rôle & Fonctionnement
L'analyse statique (**SAST - Static Application Security Testing**) inspecte le code source sans l'exécuter afin de déceler des patterns de programmation non sécurisés, des contournements de logique ou des failles exploitables.

### Outil retenu : Semgrep
**Semgrep** est un moteur d'analyse sémantique ultra-rapide capable de comprendre l'arbre syntaxique abstrait (AST) du code TypeScript et React de TerraCoast.

### Règles et Correspondance avec l'OWASP Top 10

| Catégorie OWASP Top 10 | Risque identifié | Protection Semgrep dans TerraCoast |
| :--- | :--- | :--- |
| **A01:2021 — Broken Access Control** | Élévation de privilèges, accès non autorisé aux fonctions admin | Règles `p/security-audit` vérifiant les gardes de rôles et les routes protégées (`ProtectedRoute`). |
| **A02:2021 — Cryptographic Failures** | Clés faibles, algorithmes obsolètes ou transmission de secrets | Règles détectant les clés de chiffrement faibles ou exposées dans le bundle frontend. |
| **A03:2021 — Injection (SQL, XSS, Command)** | Exécution de code ou scripts malveillants injectés par l'utilisateur | Règles `p/owasp-top-ten` et `p/react` bloquant `dangerouslySetInnerHTML`, les injections DOM et requêtes dynamiques non préparées. |
| **A04:2021 — Insecure Design** | Faiblesses architecturales ou absence de validation côté client/serveur | Analyse des flux de données non validés et des formulaires sans typage strict. |
| **A05:2021 — Security Misconfiguration** | Headers non sécurisés, mode debug en production | Règles `p/javascript` contrôlant les configurations de build Vite et les variables d'environnement. |
| **A07:2021 — Identification & Authentication Failures** | Contournement du MFA, faiblesses dans la gestion des sessions | Vérification des flux d'authentification Supabase et des tokens JWT. |
| **A10:2021 — Server-Side Request Forgery (SSRF)** | Requêtes non contrôlées vers des ressources internes | Blocage des URL utilisateur non filtrées envoyées via les fonctions réseau (`fetch`, webhooks). |

### Intégration SARIF
Les résultats de Semgrep sont compilés au format standardisé **SARIF** (`semgrep-results.sarif`) puis publiés directement dans l'onglet **Security > Code Scanning Alerts** de GitHub via l'action officielle `github/codeql-action/upload-sarif`.

---

## 3. Pilier 2 : Détection de Fuites de Secrets (Gitleaks & TruffleHog)

### Rôle & Fonctionnement
Une fuite de clé secrète (ex: clé Supabase `service_role`, mot de passe de base de données, clé API de production) dans un commit Git compromet instantanément l'infrastructure. Même si le commit est supprimé par la suite, le secret reste présent dans l'historique Git.

### Outils intégrés
1. **Gitleaks (`gitleaks/gitleaks-action`)** :
   - Analyse l'intégralité de l'historique Git et les diffs des Pull Requests.
   - S'appuie sur le fichier de règles sur-mesure [`.gitleaks.toml`](file:///Users/fullann/Documents/GitHub/TerraCoast/.gitleaks.toml).
   - Règles configurées spécifiquement pour TerraCoast :
     - Détection des clés secrètes Supabase Service Role (`supabase-service-role-key`).
     - Blocage de tout fichier `.env` ou `.env.local` accidentellement traqué par Git (`committed-env-file`).
     - Détection des clés cryptographiques privées (`private-cryptographic-key`).
     - Liste blanche (`allowlist`) pour exclure les faux-positifs des mocks de tests unitaires.
2. **TruffleHog (`trufflesecurity/trufflehog`)** :
   - Moteur basé sur l'entropie et des détecteurs cryptographiques actifs.
   - Vérifie la validité réelle des clés compromises via l'option `--only-verified` afin d'éliminer les faux-positifs.

---

## 4. Pilier 3 : Analyse de Composition Logicielle (SCA)

### Rôle & Fonctionnement
Les applications modernes reposent à 80% sur des bibliothèques open-source tierces (npm). L'analyse de composition logicielle (**SCA - Software Composition Analysis**) inventorie ces dépendances et alerte dès qu'une vulnérabilité (CVE) y est découverte.

### Mécanismes Déployés dans TerraCoast
1. **Dependabot ([`.github/dependabot.yml`](file:///Users/fullann/Documents/GitHub/TerraCoast/.github/dependabot.yml))** :
   - Scrute de manière autonome l'écosystème `npm` chaque lundi à 06:00 UTC.
   - Scrute également les versions des **GitHub Actions** utilisées dans nos workflows CI/CD.
   - Ouvre automatiquement des Pull Requests avec les montées de versions sécurisées dès qu'un patch est disponible.
2. **Snyk & npm audit dans le workflow CI ([`security.yml`](file:///Users/fullann/Documents/GitHub/TerraCoast/.github/workflows/security.yml))** :
   - Si le secret `SNYK_TOKEN` est défini, **Snyk** réalise une analyse approfondie des dépendances directes et transitives.
   - Un contrôle strict `npm audit --audit-level=critical` bloque la chaîne en cas de faille critique immédiate dans le fichier `package-lock.json`.

---

## 5. Pilier 4 : Quality Gate & Déploiement Sécurisé (CD)

1. **Gate Qualité (`quality-gate`)** :
   - Exécution de `npm run typecheck` : valide l'absence d'erreurs de typage TypeScript.
   - Exécution de `npm test` : validation des 172 tests unitaires Vitest.
2. **Protection du Déploiement ([`.github/workflows/deploy.yml`](file:///Users/fullann/Documents/GitHub/TerraCoast/.github/workflows/deploy.yml))** :
   - Le workflow de déploiement intègre obligatoirement la vérification Gitleaks et l'audit de vulnérabilité `npm audit` avant toute étape de compilation (`npm run build`) et de synchronisation FTP vers la production.

---

## 6. Guide Pratique pour le Développeur

### Exécuter les scans en local avant de pusher (Pre-Commit)

#### 1. Scanner les secrets avec Gitleaks en local :
```bash
# Installation de Gitleaks (via Homebrew sur Mac)
brew install gitleaks

# Analyser le répertoire de travail
gitleaks detect --source . -c .gitleaks.toml -v
```

#### 2. Scanner le code avec Semgrep en local :
```bash
# Installation de Semgrep (via Homebrew ou pip)
brew install semgrep

# Lancer le scan ciblé OWASP Top 10 et React
semgrep scan --config "p/owasp-top-ten" --config "p/react" src/
```

#### 3. Auditer les dépendances npm :
```bash
npm audit
```

### Configuration des Secrets GitHub Repository
Pour profiter de l'intégralité des fonctionnalités du pipeline, configurez les secrets suivants dans **Settings > Secrets and variables > Actions** de votre dépôt GitHub :

| Secret | Description | Obligatoire |
| :--- | :--- | :---: |
| `VITE_SUPABASE_URL` | URL de l'instance Supabase de production | Oui |
| `VITE_SUPABASE_ANON_KEY` | Clé publique anonyme Supabase | Oui |
| `SFTP_HOST`, `SFTP_USER`, etc. | Identifiants pour le déploiement FTP | Pour le CD |
| `SNYK_TOKEN` | Jeton d'authentification API Snyk | Optionnel (enrichit le scan SCA) |

---

## 7. Résumé des Fichiers de Sécurité Ajoutés

| Fichier | Emplacement | Fonction |
| :--- | :--- | :--- |
| **Workflow de Sécurité CI** | [`.github/workflows/security.yml`](file:///Users/fullann/Documents/GitHub/TerraCoast/.github/workflows/security.yml) | Orchestration des scans SAST, Secrets, SCA et Quality Gate. |
| **Workflow de Déploiement CD** | [`.github/workflows/deploy.yml`](file:///Users/fullann/Documents/GitHub/TerraCoast/.github/workflows/deploy.yml) | Déploiement FTP avec barrière de sécurité pré-déploiement. |
| **Config Secrets** | [`.gitleaks.toml`](file:///Users/fullann/Documents/GitHub/TerraCoast/.gitleaks.toml) | Règles et exclusions de détection de secrets. |
| **Config Dependabot** | [`.github/dependabot.yml`](file:///Users/fullann/Documents/GitHub/TerraCoast/.github/dependabot.yml) | Veille et PRs automatisées pour les dépendances npm et GitHub Actions. |
| **Politique de Sécurité** | [`.github/SECURITY.md`](file:///Users/fullann/Documents/GitHub/TerraCoast/.github/SECURITY.md) | Déclaration publique et politique de divulgation responsable. |
