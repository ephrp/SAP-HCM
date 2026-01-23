# PeopleFlow  — Mini HCM/HXM pour PME (inspiré SAP)

PeopleFlow est une application web de gestion des ressources humaines (HCM/HXM) destinée aux petites et moyennes entreprises.  
Le projet s’inspire des principes fonctionnels de SAP HCM / SuccessFactors (rôles, processus RH, workflows) tout en restant volontairement simple, accessible et rapide à utiliser.

L’objectif est double :
1) construire un projet full-stack réaliste et professionnalisant (portfolio)  
2) poser une base qui peut devenir un produit monétisable (SaaS ou installation PME)

---

## Contexte & Problème

Dans beaucoup de PME, la gestion RH repose encore sur Excel, des échanges par e-mail et des validations informelles.  
Cela crée des pertes de temps, des erreurs (doublons, oublis), un manque de traçabilité et peu de visibilité pour les responsables.

Les solutions “enterprise” sont puissantes mais souvent trop coûteuses et trop complexes pour ces structures.  
PeopleFlow vise donc à offrir une alternative “light” : les fonctionnalités essentielles RH, dans une interface simple, avec une logique métier propre.

---

## Fonctionnalités (MVP)

### 1) Authentification & rôles (inspiration SAP : autorisations)
- Connexion sécurisée
- Gestion des rôles : `EMPLOYEE`, `MANAGER`, `HR_ADMIN`
- Accès et actions limités selon le rôle

### 2) Gestion des employés (Personnel Administration)
- Création et gestion des fiches employés
- Informations de base : identité, contact, département, poste, statut
- Désactivation d’un employé (soft delete) pour conserver l’historique

### 3) Congés & absences (workflow RH)
- Un employé soumet une demande de congé
- La demande passe par un workflow : `PENDING` → `APPROVED` ou `REJECTED`
- Les managers / RH peuvent valider ou refuser
- Historique des demandes et traçabilité des décisions

### 4) Formations & compétences (LMS léger)
- Catalogue de formations créé par RH
- Inscription des employés
- Suivi des formations (inscrit, complété…)
- Calcul des heures de formation par employé / équipe

### 5) Tableau de bord RH (analytics)
- Indicateurs clés : effectif, congés en attente, formations, répartition par département
- Objectif : aider à la décision et donner de la visibilité

---

## Rôles utilisateurs

- **EMPLOYEE** : consulte son profil, soumet des congés, suit ses formations
- **MANAGER** : valide les congés, supervise la partie équipe
- **HR_ADMIN** : gère les employés, les formations, accède à toutes les données et au dashboard

---

## Stack technique (prévue)

- **Frontend** : Angular (TypeScript, Router, HttpClient)
- **Backend** : Spring Boot (API REST)
- **Base de données** : PostgreSQL
- **Sécurité** : JWT + Spring Security + RBAC (role-based access control)
- **Documentation API** : OpenAPI / Swagger

---

## Architecture (haut niveau)

- Frontend Angular consommant une API REST
- Backend Spring Boot structuré en `controller / service / repository`
- Couche sécurité dédiée (`security/`) : JWT, filters, autorisations
- Entités métiers (v1) : `User`, `Employee`, `LeaveRequest`, `Training`, `Enrollment`

---

## Roadmap (Agile / sprints hebdomadaires)

> Début : vendredi 23 janvier

- **Sprint 1 — Fondations & sécurité** : base projet, DB, auth, rôles, Swagger
- **Sprint 2 — Employés (PA)** : CRUD employés + UI
- **Sprint 3 — Congés (workflow)** : demandes, validation manager/RH + UI
- **Sprint 4 — Formations** : catalogue + inscriptions + suivi + UI
- **Sprint 5 — Dashboard RH** : KPIs + graphiques
- **Sprint 6 — Stabilisation & déploiement** : tests, doc, déploiement, compte démo

---

## Monétisation (pistes)

PeopleFlow est conçu pour pouvoir évoluer vers :
- **SaaS PME** (abonnement mensuel selon nombre d’employés)
- **Installation + maintenance** (facturation projet + support)
- **Version personnalisée** (ajouts sur mesure : exports, règles RH spécifiques, intégrations)

---

## Statut du projet

- [ ] Initialisation (Sprint 1)
- [ ] Auth & rôles
- [ ] Module employés
- [ ] Congés
- [ ] Formations
- [ ] Dashboard
- [ ] Déploiement

---

## Licence

À définir.
