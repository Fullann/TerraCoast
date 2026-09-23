# Politique de Sécurité (Security Policy) — TerraCoast

La sécurité des données de nos utilisateurs et l'intégrité de la plateforme TerraCoast sont au cœur de nos priorités. Nous appliquons les principes de **Security by Design** et de **DevSecOps** tout au long du cycle de vie du logiciel.

---

## 1. Versions Prises en Charge

Nous publions régulièrement des correctifs de sécurité. Seules les versions listées ci-dessous reçoivent actuellement des mises à jour de sécurité :

| Version | Prise en charge |
| :--- | :---: |
| 1.5.x (Dernière version stable) | :white_check_mark: |
| < 1.5.0 | :x: |

---

## 2. Signalement d'une Vulnérabilité (Responsible Disclosure)

Si vous découvrez une faille de sécurité dans TerraCoast, **merci de ne pas ouvrir d'issue publique sur GitHub**. 

Veuillez suivre notre processus de divulgation responsable :
1. Envoyez un e-mail détaillé à : **security@fullann.ch** (ou via l'interface [GitHub Private Vulnerability Reporting](https://github.com/Fullann/TerraCoast/security/advisories/new)).
2. Incluez dans votre rapport :
   - Le type de vulnérabilité identifié (ex. XSS, injection, contournement d'authentification, fuite de données).
   - Les étapes détaillées pour reproduire la vulnérabilité (PoC, captures d'écran, requêtes HTTP).
   - L'évaluation de l'impact potentiel (confidentialité, intégrité, disponibilité).

### Notre Engagement
- **Accusé de réception** : sous 48 heures ouvrées.
- **Évaluation et confirmation** : sous 5 jours ouvrés.
- **Déploiement du correctif** : priorité absolue selon la criticité CVSS.

---

## 3. Dispositifs de Sécurité Intégrés (CI/CD DevSecOps)

Notre chaîne d'intégration continue implémente les contrôles suivants à chaque commit :
- **SAST (Static Application Security Testing)** : Analyse continue avec **Semgrep** ciblant l'OWASP Top 10 (`p/owasp-top-ten`, `p/react`, `p/javascript`).
- **Secret Scanning** : Détection proactive de fuites de clés avec **Gitleaks** et **TruffleHog**.
- **SCA (Software Composition Analysis)** : Surveillance des vulnérabilités dans l'arbre de dépendances npm via **Dependabot** et **Snyk / npm audit**.
- **Protection des données (RLS)** : Toutes les tables Supabase sont protégées par des stratégies Row Level Security (RLS) strictes.
