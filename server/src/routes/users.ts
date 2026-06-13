import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { dataStore } from '../services/data-store';

export const usersRouter = Router();
usersRouter.use(requireAuth);

usersRouter.patch('/me', async (req, res) => {
  const body = z
    .object({
      name: z.string().min(1).max(160).optional(),
      email: z.string().email().optional(),
    })
    .parse(req.body);

  const user = await dataStore.updateCurrentUser(req.user!.id, body);
  if (!user) return res.status(404).json({ error: 'user_not_found' });
  return res.json(user);
});

usersRouter.get('/me/preferences', async (req, res) => {
  return res.json(await dataStore.getPreferences(req.user!.id));
});

usersRouter.patch('/me/preferences', async (req, res) => {
  const body = z
    .object({
      emailNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      theme: z.enum(['light', 'dark', 'system']).optional(),
    })
    .parse(req.body);

  return res.json(await dataStore.updatePreferences(req.user!.id, body));
});
