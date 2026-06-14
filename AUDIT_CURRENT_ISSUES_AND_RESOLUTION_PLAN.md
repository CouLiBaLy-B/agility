# Audit courant — Problèmes, bugs, incohérences et plan de résolution

Date : 2026-06-13  
Projet : `CouLiBaLy-B/agility`  
Commit audité : `010d680 feat: add register and password reset auth flows`

## 1. Synthèse exécutive

L’application a fortement progressé : frontend React, backend Express, API auth, Prisma/PostgreSQL, stores `memory`/`prisma`, README, OpenAPI, tests API et déploiement statique GitHub Pages.

Cependant, elle n’est pas encore prête production. Les principaux risques sont :

| Criticité | Problème | Impact |
|---|---|---|
| 🔴 Haute | Backend non déployé publiquement | Le lien GitHub Pages ne permet pas de tester les flows API/auth réels. |
| 🔴 Haute | Token GitHub/PAT exposé dans la conversation | Risque compromission repo/compte, à révoquer immédiatement. |
| 🔴 Haute | Reset password renvoie le token dans la réponse API | Acceptable en MVP/dev, dangereux en prod. |
| 🔴 Haute | Pas de refresh token, JWT stocké en `localStorage` | Risque XSS/session compromise, UX session limitée. |
| 🔴 Haute | RBAC non appliqué sur les routes | Tout utilisateur authentifié peut théoriquement agir sur tous les workspaces/boards. |
| 🔴 Haute | En mode Prisma, `listWorkspaces()` retourne tous les workspaces | Fuite multi-tenant potentielle. |
| 🟡 Moyenne | Frontend partiellement branché API | Certains flows persistent mal ou restent locaux. |
| 🟡 Moyenne | CI GitHub Actions non poussée | Le token fourni n’avait pas le scope `workflow`, donc pas de CI distante active. |
| 🟡 Moyenne | Couverture tests insuffisante | Tests API memory uniquement, pas de tests Prisma/Postgres réels ni E2E. |
| 🟡 Moyenne | Documentation OpenAPI minimale | Pas de schemas DTO détaillés, pas de body examples. |

## 2. Validation technique effectuée

Commandes exécutées :

```bash
npm run typecheck
npm run lint
npm test
npm audit --audit-level=moderate
```

Résultat :

- TypeScript : ✅ OK
- ESLint : ✅ OK
- Tests : ✅ 11 tests passent
- Audit npm moderate/high : ✅ 0 vulnérabilité reportée

## 3. Audit fonctionnel

### 3.1 Fonctionnalités en place

| Domaine | État | Remarques |
|---|---|---|
| Dashboard | ✅ Fonctionnel en mock/API | Agrégation frontend. |
| Boards | ✅ Partiel | CRUD création/update partiel, pas delete/archive UI. |
| Tasks | ✅ Partiel | Création/update statut/priorité, mais commentaires API mal intégrés. |
| Kanban | ✅ Partiel | Drag-and-drop souris, pas clavier/accessibilité. |
| Timeline | ✅ Partiel | Fonctionnelle, mais pas de filtres avancés. |
| Inbox | ✅ Amélioré | Read/unread sync + mark all read. |
| Auth login | ✅ MVP | Fonctionne en mode API. |
| Register | ✅ MVP | Fonctionne, mais multi-tenant à sécuriser. |
| Forgot/reset password | ✅ MVP dev | Token renvoyé directement, pas d’email. |
| Profile/settings | ✅ Partiel | Profile + preferences persistés. |
| People/members | ⚠️ API présente, UI incomplète | API invite/update/remove, mais UI People ne l’exploite pas. |
| Tags | ⚠️ API présente, UI absente | CRUD API + client, pas d’interface dédiée. |
| Automations | ✅ Partiel | API + UI basique, pas de moteur d’exécution réel. |
| Backend public | ❌ Absent | Pas de lien API public. |

### 3.2 Bugs/incohérences fonctionnelles

| Criticité | Problème | Localisation | Détail | Correction recommandée |
|---|---|---|---|---|
| 🔴 Haute | GitHub Pages ne montre pas l’auth | Déploiement statique | Build actuel en mode mock. | Déployer backend public puis rebuild avec `VITE_USE_MOCKS=false` et `VITE_API_URL`. |
| 🔴 Haute | Auth réelle non testable sur URL publique | Infra | Backend non déployé. | Déployer API sur Render/Railway/Fly/VPS + DB Postgres. |
| 🟡 Moyenne | Commentaires TaskModal non persistés correctement en API Prisma | `TaskModal.tsx`, `App.tsx`, `PrismaStore.updateTask()` | Le frontend modifie `comments` dans un PATCH task, mais Prisma ignore `input.comments`. | Modifier `TaskModal` pour appeler `POST /tasks/:id/comments`, ou supporter nested comments dans `updateTask`. |
| 🟡 Moyenne | Tags API non exposés dans UI | `src/api/tags.ts` seulement | CRUD présent mais aucune page/action utilisateur. | Ajouter gestion tags dans modal task et/ou settings workspace. |
| 🟡 Moyenne | Members API non exposée dans UI | `People.tsx` | People affiche seulement stats. | Ajouter invitation, rôle, suppression dans People. |
| 🟡 Moyenne | Automations sans moteur réel | `Automations.tsx`, backend | CRUD présent, mais pas d’exécution sur événements. | Ajouter event bus + worker/queue. |
| 🟢 Basse | Favoris = premier board seulement | `Sidebar.tsx` | Pas de modèle favorite. | Ajouter `BoardFavorite` ou user preference. |
| 🟢 Basse | `Date.now()` pour IDs locaux | `App.tsx`, `TaskModal.tsx`, `Automations.tsx` | OK fallback, mais collisions possibles. | Utiliser `crypto.randomUUID()`. |

## 4. Audit sécurité

| Criticité | Problème | Risque | Plan de résolution |
|---|---|---|---|
| 🔴 Haute | PAT GitHub exposé dans conversation | Compromission repo/permissions | Révoquer immédiatement le token et en générer un nouveau si nécessaire. |
| 🔴 Haute | Reset token renvoyé par `/auth/forgot-password` | Prise de compte si exposé en prod | En prod : envoyer par email, ne jamais retourner le token, stocker hash seulement. |
| 🔴 Haute | JWT dans `localStorage` | Vol via XSS | Passer à access token court en mémoire + refresh token cookie `HttpOnly`, `Secure`, `SameSite`. |
| 🔴 Haute | RBAC absent | Accès transversal workspace/board/task | Ajouter guards par workspace et vérifier membership sur chaque ressource. |
| 🔴 Haute | Prisma `listWorkspaces()` retourne tous les workspaces | Fuite multi-tenant | Filtrer par `memberships.some(userId)`. |
| 🟡 Moyenne | Pas de politique password robuste | Faibles mots de passe possibles | Ajouter règles complexité raisonnables + zxcvbn optionnel. |
| 🟡 Moyenne | Pas de rate limit spécifique auth | Bruteforce login/reset | Ajouter limiters par IP/email sur `/auth/*`. |
| 🟡 Moyenne | Pas d’audit logs utilisés | Traçabilité limitée | Écrire dans `AuditLog` pour auth, settings, membres, tâches. |
| 🟡 Moyenne | OpenAPI `/docs` affiche spec inline | OK dev, basique prod | Mettre Swagger UI ou Redoc sécurisé si nécessaire. |

## 5. Audit architecture backend

### Points positifs

- Séparation `createApp()` / `index.ts`, testable avec Supertest.
- Stores interchangeables `memory` et `prisma`.
- Prisma schema relativement complet.
- Validation Zod sur endpoints principaux.
- Tests API couvrant plusieurs domaines.

### Problèmes/incohérences

| Criticité | Problème | Localisation | Résolution |
|---|---|---|---|
| 🔴 Haute | Autorisation non centralisée | routes backend | Créer `requireWorkspaceRole(role)` et helpers resource ownership. |
| 🔴 Haute | `PrismaStore.listWorkspaces()` non filtré utilisateur | `server/src/services/prisma-store.ts` | Passer `userId` au store ou contexte request. |
| 🟡 Moyenne | Store interface implicite | `data-store.ts` | Définir interface `DataStore` explicite. |
| 🟡 Moyenne | Gestion erreurs Prisma silencieuse | nombreux `catch { return null }` | Logger + mapper erreurs Prisma (`P2002`, `P2025`). |
| 🟡 Moyenne | Routes tags/automations montées à la racine | `app.ts` | OK, mais documenter convention ou regrouper par router. |
| 🟡 Moyenne | Migrations manuelles | `prisma/migrations` | Utiliser `prisma migrate dev/deploy` en pipeline. |
| 🟢 Basse | `package.json#prisma` déprécié Prisma 7 | warning CLI | Migrer vers `prisma.config.ts`. |

## 6. Audit frontend

| Criticité | Problème | Localisation | Résolution |
|---|---|---|---|
| 🟡 Moyenne | Pas de routeur frontend | `App.tsx` | Ajouter React Router : `/login`, `/register`, `/forgot-password`, `/reset-password`. |
| 🟡 Moyenne | État data géré manuellement | `App.tsx` | Introduire TanStack Query pour cache/mutations/loading/errors. |
| 🟡 Moyenne | Optimistic updates sans rollback | `App.tsx`, `Inbox.tsx`, `Automations.tsx` | Mutations contrôlées avec rollback/toasts. |
| 🟡 Moyenne | LoginScreen mélange 4 formulaires | `LoginScreen.tsx` | Séparer en composants `LoginForm`, `RegisterForm`, etc. |
| 🟡 Moyenne | Messages erreur génériques | auth/settings | Mapper erreurs API pour UX claire. |
| 🟡 Moyenne | Accessibilité incomplète | boutons iconiques, drag/drop | Ajouter `aria-label`, navigation clavier, focus management. |
| 🟡 Moyenne | UI People/Tags incomplète | `People.tsx`, tags absent | Ajouter actions membres/tags. |
| 🟢 Basse | Hardcodes demo visibles | LoginScreen/README | OK dev, cacher en prod via env. |

## 7. Audit base de données / données

| Criticité | Problème | Détail | Résolution |
|---|---|---|---|
| 🔴 Haute | Données multi-tenant non isolées côté store Prisma | Workspaces/members/resources | Ajouter vérification membership dans requêtes. |
| 🟡 Moyenne | Tags créés par nom case-sensitive en Prisma | `workspaceId_name` | Normaliser `name` ou ajouter champ `normalizedName`. |
| 🟡 Moyenne | Delete tag supprime liaison mais pas confirmation UI | API only | Ajouter soft delete ou confirmation UI. |
| 🟡 Moyenne | Automations stockées JSON sans schema strict | `trigger/actions` | Définir types supportés et validation Zod discriminée. |
| 🟡 Moyenne | `AuditLog` non alimenté | Prisma schema | Ajouter service audit. |

## 8. Audit DevOps / déploiement

| Criticité | Problème | Impact | Résolution |
|---|---|---|---|
| 🔴 Haute | Backend non déployé | Auth/API publique indisponible | Déployer API + Postgres. |
| 🟡 Moyenne | GitHub Actions non présent | Pas de qualité automatique | Ajouter workflow avec token `workflow` scope. |
| 🟡 Moyenne | Pas de Dockerfile prod | Déploiement moins standard | Ajouter Dockerfile API + web si nécessaire. |
| 🟡 Moyenne | Pas de healthcheck DB | `/health` ne vérifie pas Postgres | Ajouter `/health/ready`. |
| 🟡 Moyenne | Pas de migration deploy script | Risque prod | Ajouter `npm run db:deploy` = `prisma migrate deploy`. |

## 9. Plan de résolution agile

### Sprint 1 — Sécurité et fondations production (priorité P0)

| Tâche | Priorité | Estimation | Critère d’acceptation |
|---|---:|---:|---|
| Révoquer le PAT exposé | Must | 15 min | Token invalide côté GitHub. |
| Déployer backend + Postgres staging | Must | 0.5-1 j | URL API publique + `/health` OK. |
| Rebuild GitHub Pages en mode API | Must | 0.5 j | Auth visible sur URL publique. |
| Ajouter RBAC middleware | Must | 1-2 j | Un user ne peut accéder qu’à ses workspaces. |
| Corriger `listWorkspaces()` Prisma | Must | 0.5 j | `/auth/me` ne retourne que les workspaces du user. |
| Ne plus retourner reset token en prod | Must | 0.5-1 j | Token seulement envoyé email/log dev conditionnel. |

### Sprint 2 — Cohérence API/frontend (P1)

| Tâche | Priorité | Estimation | Critère d’acceptation |
|---|---:|---:|---|
| Brancher commentaires sur `POST /tasks/:id/comments` | Must | 0.5-1 j | Commentaires persistent en API memory/prisma. |
| Ajouter UI Members dans People | Should | 1-2 j | Invite/update role/remove depuis UI. |
| Ajouter UI Tags | Should | 1-2 j | Lister/créer/modifier/supprimer tags + assigner task. |
| Séparer Login/Register/Forgot/Reset en composants | Should | 0.5-1 j | Code auth UI maintenable. |
| Ajouter React Router | Should | 1 j | URLs `/login`, `/register`, `/forgot-password`, `/reset-password`. |

### Sprint 3 — Qualité et tests (P1)

| Tâche | Priorité | Estimation | Critère d’acceptation |
|---|---:|---:|---|
| Tests Prisma/Postgres réels | Must | 1-2 j | Suite test `DATA_STORE=prisma` avec DB de test. |
| Tests E2E Playwright | Should | 1-2 j | Parcours login → board → task → comment → logout. |
| Tests accessibilité axe | Should | 0.5-1 j | Pas de violation critique sur pages principales. |
| Ajouter GitHub Actions | Must | 0.5 j | CI passe sur PR/push. |

### Sprint 4 — Automations et domaine métier (P2)

| Tâche | Priorité | Estimation | Critère d’acceptation |
|---|---:|---:|---|
| Définir schemas triggers/actions | Should | 1 j | Validation stricte automations. |
| Event bus domaine | Could | 1-2 j | Events task.created/status.changed émis. |
| Worker Redis/BullMQ | Could | 2-3 j | Automations exécutées async. |
| AuditLog | Should | 1 j | Changements sensibles historisés. |

### Sprint 5 — UX production (P2)

| Tâche | Priorité | Estimation | Critère d’acceptation |
|---|---:|---:|---|
| Toasts/loading/error states | Should | 1 j | Feedback global mutations. |
| Drag/drop accessible clavier | Could | 1-2 j | Kanban utilisable sans souris. |
| Responsive mobile navigation | Could | 1-2 j | Sidebar adaptée mobile. |
| Design tokens thème | Could | 1 j | Theme settings appliqué réellement. |

## 10. Checklist actionnable immédiate

- [ ] Révoquer le token GitHub exposé.
- [ ] Choisir un hébergeur backend : Render/Railway/Fly/VPS.
- [ ] Provisionner PostgreSQL.
- [ ] Définir `JWT_SECRET`, `DATABASE_URL`, `DATA_STORE=prisma`, `CORS_ORIGIN`.
- [ ] Déployer API et exécuter migrations/seed.
- [ ] Rebuild frontend avec `VITE_USE_MOCKS=false` et `VITE_API_URL=<api-url>`.
- [ ] Corriger isolation Prisma `listWorkspaces()` + RBAC.
- [ ] Corriger persistance commentaires frontend/API.
- [ ] Ajouter UI members/tags.
- [ ] Ajouter CI GitHub Actions avec token ayant `workflow` scope.

## 11. Conclusion

Le produit est maintenant un MVP technique solide pour continuer : il a un backend, un modèle DB, des tests, un frontend API-ready et des flows auth. Les risques principaux restants sont surtout production/security/multi-tenant et quelques incohérences de persistance frontend/API.

Priorité absolue : sécuriser le token exposé, déployer le backend, activer le mode API public, puis verrouiller RBAC/multi-tenant avant d’ajouter plus de fonctionnalités.

## Addendum — Sprint démarré et corrections appliquées

Corrections implémentées après cet audit :

- RBAC API ajouté pour workspaces, boards, tasks, tags et automations.
- Filtrage multi-tenant Prisma corrigé pour `listWorkspaces(userId)` et `/auth/me`.
- Reset token masqué en production, exposé seulement en dev ou avec `EXPOSE_RESET_TOKEN=true`.
- Persistance des commentaires corrigée côté frontend via `POST /tasks/:taskId/comments`.
- Validations relancées : typecheck, lint, tests, build et audit npm high passent.

Restent à traiter en priorité : déploiement backend public, refresh token HttpOnly, CI GitHub Actions avec token `workflow`, tests Prisma/PostgreSQL réels, UI members/tags complète et moteur d'automations.

## Addendum — Sprint suivant UI Members/Tags

Corrections implémentées :

- UI People enrichie avec invitation membre, changement de rôle et suppression.
- UI Tags ajoutée dans Settings > Integrations avec CRUD nom/couleur.
- Contexte frontend étendu avec `setUsers` pour synchroniser les mutations membres.
- Validations relancées : typecheck, lint, tests, build, audit high OK.

Reste : déploiement backend public, refresh tokens HttpOnly, tests Prisma/PostgreSQL réels, React Router pour pages auth dédiées, moteur d'automations réel.

## Addendum — Sprint auth/session

Corrections implémentées :

- Rotation de refresh token avec cookie HttpOnly.
- Endpoint `/auth/refresh` ajouté.
- Endpoint `/auth/logout` révoque les refresh tokens.
- Client API configuré avec `credentials: include` et retry refresh sur 401.
- Restauration de session frontend via refresh cookie.
- Tests API refresh/logout ajoutés.

Reste à renforcer avant production : revue CSRF complète, politique password, email provider reset password, déploiement backend public, tests Prisma/PostgreSQL réels et CI GitHub Actions.

## Addendum — Sprint routing/déploiement readiness

Corrections implémentées :

- React Router ajouté avec HashRouter compatible GitHub Pages.
- Routes auth dédiées disponibles côté frontend : `#/login`, `#/register`, `#/forgot-password`, `#/reset-password`.
- Ajout de `/health/ready` avec vérification DB lorsque `DATA_STORE=prisma`.
- Ajout Dockerfile API, `start:api` et `db:deploy` pour déploiement.
- Tests readiness ajoutés.

## Addendum — Sprint sécurité CSRF

Corrections implémentées :

- Protection CSRF double-submit ajoutée pour les endpoints de session basés sur cookie.
- `/auth/refresh` et `/auth/logout` exigent maintenant `X-CSRF-Token` correspondant au cookie `agility.csrfToken`.
- Le client API envoie automatiquement le token CSRF sur les méthodes mutantes.
- Tests API ajoutés pour vérifier le refus sans CSRF et le fonctionnement avec CSRF.

## Addendum — Préparation production Supabase/Vercel

Corrections implémentées :

- API Express exportée comme fonction Vercel via `api/index.ts`.
- `vercel.json` ajouté avec rewrites vers l'API serverless.
- Workflow GitHub Actions de production ajouté pour typecheck/lint/test/build/audit/migrations Supabase/déploiement Vercel.
- Exemple d'environnement production ajouté.
- README mis à jour avec les secrets requis et la procédure Supabase + Vercel.

À faire côté plateforme : créer le projet Supabase, créer le projet Vercel, renseigner les secrets GitHub et variables Vercel, puis vérifier le premier run CI/CD.
