# Agility

Agility is a project and task management application with a React frontend and a TypeScript backend API. It started as a static/mock frontend and now includes an incremental production-oriented backend foundation with authentication, PostgreSQL/Prisma support, OpenAPI documentation, tests, and a mock-compatible frontend fallback.

## Features

### Frontend

- Dashboard with task status, priority distribution, completion rate, and team workload.
- Board/table view with status and priority editing.
- Kanban view with drag-and-drop status updates.
- Timeline view.
- Task detail modal with subtasks and comments.
- Inbox with read/unread notification synchronization.
- People/team page.
- Settings page with persisted profile and user preferences.
- Authentication screens when API mode is enabled: sign in, register, forgot password, and reset password.
- API fallback mode to preserve the original mock-only behavior.

### Backend API

- JWT authentication MVP with register, forgot password, reset password, and HttpOnly refresh-token rotation.
- Workspaces and members.
- Boards and tasks.
- Subtasks and comments.
- Notifications with unread count, mark-one-read, and mark-all-read.
- User profile and preferences.
- Tags CRUD.
- Automation rules CRUD and test endpoint.
- In-memory store for quick development.
- Prisma/PostgreSQL store for persistent mode.
- OpenAPI JSON and lightweight docs page.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| UI support | Framer Motion, lucide-react, date-fns |
| Backend | Express 5, TypeScript, Zod |
| Auth | JWT MVP |
| Database | PostgreSQL via Prisma |
| Dev/Test | Vitest, Testing Library, Supertest, ESLint, Prettier |
| Local infra | Docker Compose, PostgreSQL, Redis |

## Project structure

```text
.
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── server/src/
│   ├── app.ts
│   ├── index.ts
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   └── __tests__/
├── src/
│   ├── api/
│   ├── components/
│   ├── context/
│   ├── data/
│   └── __tests__/
├── AUDIT_BACKEND_ROADMAP.md
├── IMPLEMENTATION_NOTES.md
├── docker-compose.yml
└── package.json
```

## Environment variables

Copy the example file:

```bash
cp .env.example .env
```

Important variables:

```env
# Frontend
VITE_API_URL=http://localhost:3000
VITE_USE_MOCKS=true
VITE_WORKSPACE_ID=w1

# Backend
PORT=3000
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=15m
DATABASE_URL=postgresql://agility:agility_dev@localhost:5432/agility?schema=public
DATA_STORE=memory
```

`DATA_STORE` supports:

- `memory`: uses seeded in-memory data; fastest for development and tests.
- `prisma`: uses PostgreSQL through Prisma.

`VITE_USE_MOCKS` supports:

- `true`: keeps the original static frontend behavior.
- `false`: enables API login and backend synchronization.

## Quick start — mock frontend only

```bash
npm install
npm run dev:web
```

This runs the UI with local mock data and does not require the backend.

## Quick start — API with in-memory store

Terminal 1:

```bash
cp .env.example .env
npm install
npm run dev:api
```

Terminal 2:

```bash
VITE_USE_MOCKS=false npm run dev:web
```

Default demo login:

```text
Email: sarah.chen@company.com
Password: demo-password
```

The auth UI includes sign in, account creation, forgot password, and reset password. In development, forgot password returns a reset token directly so the flow can be tested without an email provider. The current auth implementation is still an MVP and should be hardened before production.

## Quick start — API with PostgreSQL/Prisma

Start infrastructure:

```bash
docker compose up -d postgres redis
```

Prepare Prisma:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

Start API with persistent store:

```bash
DATA_STORE=prisma npm run dev:api
```

Start frontend:

```bash
VITE_USE_MOCKS=false npm run dev:web
```

## Scripts

```bash
npm run dev           # Vite frontend
npm run dev:web       # Vite frontend
npm run dev:api       # Express API with tsx watch
npm run start:api     # Express API without watch
npm run build         # Vite production build
npm run build:web     # Vite production build
npm run typecheck     # TypeScript check
npm run lint          # ESLint
npm run format        # Prettier write
npm test              # Vitest + frontend/API tests
npm run db:generate   # Prisma client generation
npm run db:push       # Push Prisma schema to DB
npm run db:migrate    # Create/run Prisma migration in dev
npm run db:deploy     # Deploy Prisma migrations in production
npm run db:seed       # Seed demo data
npm run db:studio     # Prisma Studio
```

## API documentation

When the API is running:

```text
GET http://localhost:3000/health
GET http://localhost:3000/health/ready
GET http://localhost:3000/openapi.json
GET http://localhost:3000/docs
```

## Main API endpoints

### Auth

```text
POST /auth/login
POST /auth/register
POST /auth/forgot-password
POST /auth/reset-password
POST /auth/refresh
POST /auth/logout
GET  /auth/me
```

### Workspaces and members

```text
GET    /workspaces
GET    /workspaces/:workspaceId
GET    /workspaces/:workspaceId/members
POST   /workspaces/:workspaceId/invitations
PATCH  /workspaces/:workspaceId/members/:userId
DELETE /workspaces/:workspaceId/members/:userId
```

### Boards and tasks

```text
GET   /workspaces/:workspaceId/boards
POST  /workspaces/:workspaceId/boards
GET   /boards/:boardId
PATCH /boards/:boardId
GET   /boards/:boardId/tasks
POST  /boards/:boardId/tasks
GET   /tasks/:taskId
PATCH /tasks/:taskId
PATCH /tasks/:taskId/status
PATCH /tasks/:taskId/priority
POST  /tasks/:taskId/comments
PATCH /tasks/:taskId/subtasks/:subtaskId
```

### Tags

```text
GET    /workspaces/:workspaceId/tags
POST   /workspaces/:workspaceId/tags
PATCH  /tags/:tagId
DELETE /tags/:tagId
```

### Notifications

```text
GET   /notifications
GET   /notifications/unread-count
PATCH /notifications/read-all
PATCH /notifications/:notificationId/read
```

### User profile/preferences

```text
PATCH /users/me
GET   /users/me/preferences
PATCH /users/me/preferences
```

### Automations

```text
GET    /boards/:boardId/automations
POST   /boards/:boardId/automations
PATCH  /automations/:ruleId
DELETE /automations/:ruleId
POST   /automations/:ruleId/test
```

## Testing

Run all checks:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm audit --audit-level=high
```

Current test coverage includes:

- frontend smoke rendering,
- API healthcheck,
- login and `/auth/me`,
- seeded boards,
- user preferences,
- notifications read/unread,
- tags CRUD,
- automation CRUD,
- member invitation/role update.

## Security notes

- No secrets should be committed. Use `.env` locally and secure environment variables in deployment.
- `JWT_SECRET` must be changed in production.
- The current auth is an MVP. It includes password hashing, RBAC guards and refresh-token rotation, but production should still add stricter password policy, email delivery for reset links, CSRF review, monitoring, and deployment-grade secret management.
- Run `npm audit` and dependency updates regularly.

## Production deployment: Supabase + Vercel

The repository is prepared for production deployment with:

- Supabase PostgreSQL for persistence.
- Vercel for the Vite frontend and serverless Express API.
- GitHub Actions workflow: `.github/workflows/production.yml`.

### 1. Supabase

Create a Supabase project and copy the PostgreSQL connection string. Use a direct or migration-safe connection string for CI migrations.

Recommended GitHub repository secrets:

```text
SUPABASE_DATABASE_URL=postgresql://postgres:<password>@<host>:5432/postgres
SUPABASE_DIRECT_URL=postgresql://postgres:<password>@<host>:5432/postgres
```

If you use Supabase pooler for runtime, configure the Vercel `DATABASE_URL` with the pooler URL and keep the direct URL in GitHub Actions for migrations.

### 2. Vercel

Create/import the project on Vercel and add these production environment variables in Vercel:

```text
NODE_ENV=production
DATA_STORE=prisma
DATABASE_URL=<supabase-runtime-or-pooler-url>
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=15m
CORS_ORIGIN=https://<your-vercel-domain>
EXPOSE_RESET_TOKEN=false
VITE_USE_MOCKS=false
VITE_API_URL=
VITE_WORKSPACE_ID=w1
```

`VITE_API_URL` can be empty because `vercel.json` rewrites API routes to the same Vercel deployment.

### 3. GitHub Actions secrets

Add these repository secrets:

```text
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
SUPABASE_DATABASE_URL
SUPABASE_DIRECT_URL
JWT_SECRET
VITE_API_URL
VITE_WORKSPACE_ID
```

The production workflow will:

1. install dependencies,
2. generate Prisma client,
3. typecheck,
4. lint,
5. run tests,
6. build frontend,
7. run `prisma migrate deploy` against Supabase,
8. build and deploy to Vercel production.

### 4. API routing on Vercel

`vercel.json` rewrites API paths such as `/auth/*`, `/workspaces/*`, `/tasks/*`, `/health`, `/docs`, and `/openapi.json` to the serverless Express app in `api/index.ts`.

## Additional documentation

- Full audit and roadmap: [`AUDIT_BACKEND_ROADMAP.md`](./AUDIT_BACKEND_ROADMAP.md)
- Implementation notes: [`IMPLEMENTATION_NOTES.md`](./IMPLEMENTATION_NOTES.md)
