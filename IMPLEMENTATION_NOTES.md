# Implementation notes — démarrage

## Ce qui a été implémenté

- Backend API MVP sous `server/src` avec Express, validation Zod, Helmet, CORS, rate limiting, JWT et store in-memory seedé depuis les données existantes.
- Schéma PostgreSQL/Prisma complet sous `prisma/schema.prisma`, migration SQL initiale sous `prisma/migrations/000001_init/migration.sql` et seed sous `prisma/seed.ts`.
- Store API interchangeable : `DATA_STORE=memory` par défaut, `DATA_STORE=prisma` pour utiliser PostgreSQL via Prisma.
- Endpoints disponibles :
  - `GET /health`
  - `POST /auth/login`
  - `GET /auth/me`
  - `GET /workspaces`
  - `GET /workspaces/:workspaceId`
  - `GET /workspaces/:workspaceId/members`
  - `GET/POST /workspaces/:workspaceId/boards`
  - `GET/PATCH /boards/:boardId`
  - `GET/POST /boards/:boardId/tasks`
  - `GET/PATCH /tasks/:taskId`
  - `PATCH /tasks/:taskId/status`
  - `PATCH /tasks/:taskId/priority`
  - `POST /tasks/:taskId/comments`
  - `PATCH /tasks/:taskId/subtasks/:subtaskId`
  - `GET /notifications`
  - `GET /notifications/unread-count`
  - `PATCH /notifications/:notificationId/read`
- Couche API frontend sous `src/api` avec fallback mocks par défaut.
- Intégration frontend optionnelle via `VITE_USE_MOCKS=false`.
- Outillage qualité : ESLint, Prettier, Vitest, Testing Library, CI GitHub Actions.
- Docker Compose initial avec API, PostgreSQL et Redis.
- Correction de deux hardcodes : badge unread toujours vrai et date “Today” de la timeline fixée à avril 2026.
- Vulnérabilités npm high corrigées via mise à jour Vite/plugins.

## Démarrage local

```bash
cp .env.example .env
npm install
npm run dev:api
```

Dans un second terminal :

```bash
VITE_USE_MOCKS=false npm run dev:web
```

## Démarrage avec PostgreSQL/Prisma

```bash
cp .env.example .env
docker compose up -d postgres redis
npm run db:generate
npm run db:push
npm run db:seed
DATA_STORE=prisma npm run dev:api
```

Dans un second terminal :

```bash
VITE_USE_MOCKS=false npm run dev:web
```

Par défaut, le frontend garde le comportement historique mocké (`VITE_USE_MOCKS=true`) pour préserver la rétrocompatibilité.

## Validation effectuée

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm audit --audit-level=high
DATABASE_URL='postgresql://agility:agility_dev@localhost:5432/agility?schema=public' npx prisma validate
DATABASE_URL='postgresql://agility:agility_dev@localhost:5432/agility?schema=public' npm run db:generate
```

Tous les contrôles passent et `npm audit` ne signale plus de vulnérabilité high.

## Incrément suivant réalisé

- Ajout d'un `AppDataProvider` frontend pour centraliser utilisateur courant, membres et workspace.
- Remplacement progressif des imports directs `users` dans `Avatar`, `Dashboard`, `People`, `TaskModal`, `Sidebar`, `Settings`.
- `Inbox` charge désormais les notifications depuis `/notifications` quand `VITE_USE_MOCKS=false`.
- `Settings` utilise l'utilisateur courant au lieu de `Sarah Chen` hardcodé.
- Ajout des préférences utilisateur :
  - `GET /users/me/preferences`
  - `PATCH /users/me/preferences`
- Les préférences notifications/thème sont persistées via l'API en mode backend.
- Ajout du client frontend `src/api/preferences.ts`.

## Auth UI incrémentale

- Ajout de `src/components/LoginScreen.tsx`.
- Quand `VITE_USE_MOCKS=false`, l'application n'effectue plus de login démo automatique si aucun token n'est présent.
- Une session existante est restaurée via `/auth/me`.
- En cas de token invalide, le token local est supprimé et l'écran de connexion est affiché.
- Le mode mock reste inchangé lorsque `VITE_USE_MOCKS=true`.

## Profil utilisateur

- Ajout de `PATCH /users/me` pour mettre à jour le nom et l'email du profil courant.
- Implémentation disponible dans les deux stores (`memory` et `prisma`).
- Ajout du client frontend `src/api/users.ts`.
- L'onglet Profile de `Settings` utilise maintenant des champs contrôlés et sauvegarde via l'API en mode backend.
- Le contexte `AppDataProvider` expose `setCurrentUser` pour synchroniser l'UI après sauvegarde.

## Tests d'intégration API

- Refactor backend : `server/src/app.ts` exporte `createApp()` pour tester l'API sans ouvrir de port réseau.
- `server/src/index.ts` ne fait plus que démarrer le serveur.
- Ajout de `supertest` et `@types/supertest`.
- Ajout de `server/src/__tests__/api.test.ts` : healthcheck, login, `/auth/me`, boards seedés et préférences utilisateur.
- La suite de tests contient maintenant 5 tests passants.

## Notifications lues/non lues

- Ajout de `PATCH /notifications/read-all`.
- Les stores `memory` et `prisma` savent marquer toutes les notifications utilisateur comme lues.
- Le client frontend notifications expose maintenant `markNotificationRead()` et `markAllNotificationsRead()`.
- L'Inbox marque une notification comme lue lors du clic, met à jour le badge unread et propose `Mark all as read`.
- Les tests API couvrent le compteur unread et la lecture globale des notifications.

## Tags, membres, automations et README

- Ajout des endpoints membres : invitation, changement de rôle, suppression de membre.
- Ajout du CRUD tags : `/workspaces/:workspaceId/tags` et `/tags/:tagId`.
- Ajout du CRUD automations : `/boards/:boardId/automations`, `/automations/:ruleId` et `/automations/:ruleId/test`.
- Implémentation des nouvelles capacités dans les stores `memory` et `prisma`.
- Ajout des clients frontend `src/api/tags.ts` et `src/api/automations.ts`.
- L'écran Automations charge, crée, active/désactive et supprime les règles via API lorsque `VITE_USE_MOCKS=false`.
- Ajout de tests API pour tags, automations et membres.
- Ajout d'un README complet avec installation, variables d'environnement, scripts, endpoints et notes sécurité/déploiement.

## Authentification complète MVP

- Ajout de `POST /auth/register` pour créer un compte et une session JWT.
- Ajout de `POST /auth/forgot-password` pour générer un token de reset. En MVP/dev, le token est renvoyé dans la réponse afin de tester sans fournisseur email.
- Ajout de `POST /auth/reset-password` pour changer le mot de passe et ouvrir une session.
- Ajout d'un hash password `scrypt` côté backend.
- Ajout d'un modèle Prisma `PasswordResetToken` et migration `000002_password_reset_tokens`.
- L'écran d'authentification frontend supporte maintenant : Login, Register, Forgot password et Reset password.
- Les tests API couvrent maintenant register, forgot password et reset password.

## Sprint sécurité/cohérence — corrections appliquées

- Ajout de contrôles RBAC workspace/board/task/tag/automation côté API.
- `PrismaStore.listWorkspaces()` et `/auth/me` filtrent désormais les workspaces par utilisateur courant.
- Les routes sensibles membres, boards, tasks, tags et automations exigent maintenant un rôle minimal (`viewer`, `member`, `admin`).
- Le reset token n'est plus exposé en production sauf `EXPOSE_RESET_TOKEN=true`.
- Les commentaires de tâche côté frontend passent désormais par `POST /tasks/:taskId/comments` via `src/api/tasks.ts`, au lieu de dépendre d'un PATCH global de tâche.

## Sprint suivant — UI Members/Tags

- La page People permet maintenant d'inviter un membre, de modifier son rôle et de le retirer du workspace.
- `AppDataProvider` expose `setUsers` pour synchroniser l'UI après mutations membres.
- L'onglet Settings > Integrations inclut maintenant un gestionnaire de tags : liste, création, modification couleur/nom et suppression.
- Les mutations utilisent les endpoints API existants en mode `VITE_USE_MOCKS=false` et conservent un fallback local en mode mock.

## Sprint auth/session — refresh token HttpOnly

- Ajout du modèle Prisma `RefreshToken` et migration `000003_refresh_tokens`.
- Ajout de la rotation de refresh token dans les stores `memory` et `prisma`.
- Ajout de `POST /auth/refresh`.
- `POST /auth/login`, `/auth/register` et `/auth/reset-password` déposent maintenant un cookie refresh token HttpOnly.
- `POST /auth/logout` révoque le refresh token et nettoie le cookie.
- CORS API accepte désormais les credentials.
- Le client API utilise `credentials: 'include'` et tente un refresh automatique sur réponse 401.
- Le bootstrap frontend peut restaurer une session via cookie refresh même si l'access token n'est plus en localStorage.
- Le bouton Log Out dans Settings appelle maintenant le backend.
- Tests API ajoutés pour refresh/logout.

## Sprint routing/déploiement readiness

- Ajout de `react-router-dom` avec `HashRouter` pour supporter GitHub Pages.
- Les écrans auth sont maintenant accessibles par routes hash : `#/login`, `#/register`, `#/forgot-password`, `#/reset-password`.
- Après login/register/reset réussi, l'utilisateur est redirigé vers `#/app`.
- Logout redirige vers `#/login` en mode API.
- Ajout de `/health/ready` pour readiness API et vérification DB en mode Prisma.
- Ajout de `npm run start:api`, `npm run db:deploy` et d'un `Dockerfile` API.
- Les tests couvrent maintenant `/health/ready`.
