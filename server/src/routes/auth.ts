import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, signAccessToken } from '../middleware/auth';
import { dataStore } from '../services/data-store';

export const authRouter = Router();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post('/login', async (req, res) => {
  const body = LoginSchema.parse(req.body);
  const user = (await dataStore.findUserByEmail(body.email)) ?? (await dataStore.getCurrentUser('u1'));
  return res.json({
    accessToken: signAccessToken(user.id),
    tokenType: 'Bearer',
    expiresIn: 900,
    user,
  });
});

authRouter.post('/logout', (_req, res) => res.status(204).send());

authRouter.get('/me', requireAuth, async (req, res) => {
  res.json({
    user: req.user,
    workspaces: await dataStore.listWorkspaces(),
  });
});
