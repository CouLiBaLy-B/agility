import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import cookieParser from 'cookie-parser';
import { ZodError } from 'zod';
import { env } from './env';
import { authRouter } from './routes/auth';
import { workspacesRouter } from './routes/workspaces';
import { boardsRouter } from './routes/boards';
import { tasksRouter } from './routes/tasks';
import { notificationsRouter } from './routes/notifications';
import { usersRouter } from './routes/users';
import { tagsRouter } from './routes/tags';
import { automationsRouter } from './routes/automations';
import { openApiDocument } from './openapi';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(pinoHttp({ enabled: process.env.NODE_ENV !== 'test' }));
  app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false }));

  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'agility-api' }));
  app.get('/openapi.json', (_req, res) => res.json(openApiDocument));
  app.get('/docs', (_req, res) => {
    res.type('html').send(`<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>Agility API docs</title></head>
  <body style="font-family: system-ui; max-width: 900px; margin: 40px auto; line-height: 1.5">
    <h1>Agility API</h1>
    <p>OpenAPI JSON is available at <a href="/openapi.json">/openapi.json</a>.</p>
    <pre style="background:#f6f8fa;padding:16px;border-radius:8px;overflow:auto">${JSON.stringify(openApiDocument, null, 2)}</pre>
  </body>
</html>`);
  });

  app.use('/auth', authRouter);
  app.use('/workspaces', workspacesRouter);
  app.use('/boards', boardsRouter);
  app.use('/tasks', tasksRouter);
  app.use('/notifications', notificationsRouter);
  app.use('/users', usersRouter);
  app.use(tagsRouter);
  app.use(automationsRouter);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: 'validation_error', issues: err.issues });
    }
    const status = typeof err === 'object' && err && 'status' in err ? Number((err as { status: number }).status) : 500;
    const message = err instanceof Error ? err.message : 'Internal server error';
    return res.status(status || 500).json({ error: status === 500 ? 'internal_error' : message });
  });

  return app;
}
