import type { Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, signAccessToken } from '../middleware/auth';
import { dataStore } from '../services/data-store';
import type { ApiUser } from '../services/store';

export const authRouter = Router();

const REFRESH_COOKIE = 'agility.refreshToken';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const RegisterSchema = z.object({
  name: z.string().min(1).max(160),
  email: z.string().email(),
  password: z.string().min(8).max(200),
  workspaceName: z.string().min(1).max(120).optional(),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(16),
  password: z.string().min(8).max(200),
});

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/auth',
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: '/auth' });
}

async function issueSession(res: Response, user: ApiUser) {
  const refresh = await dataStore.createRefreshToken(user.id);
  if (refresh) setRefreshCookie(res, refresh.refreshToken);
  return {
    accessToken: signAccessToken(user.id),
    tokenType: 'Bearer' as const,
    expiresIn: 900,
    user,
  };
}

authRouter.post('/login', async (req, res) => {
  const body = LoginSchema.parse(req.body);
  const user = await dataStore.validateCredentials(body.email, body.password);
  if (!user) return res.status(401).json({ error: 'invalid_credentials' });
  return res.json(await issueSession(res, user));
});

authRouter.post('/register', async (req, res) => {
  const body = RegisterSchema.parse(req.body);
  const user = await dataStore.register(body);
  if (!user) return res.status(409).json({ error: 'email_already_registered' });
  return res.status(201).json(await issueSession(res, user));
});

authRouter.post('/forgot-password', async (req, res) => {
  const body = ForgotPasswordSchema.parse(req.body);
  const reset = await dataStore.createPasswordResetToken(body.email);

  const exposeToken = process.env.NODE_ENV !== 'production' || process.env.EXPOSE_RESET_TOKEN === 'true';
  return res.json({
    ok: true,
    resetToken: exposeToken ? reset?.resetToken : undefined,
    expiresAt: exposeToken ? reset?.expiresAt : undefined,
    message: 'If the email exists, reset instructions have been generated.',
  });
});

authRouter.post('/reset-password', async (req, res) => {
  const body = ResetPasswordSchema.parse(req.body);
  const user = await dataStore.resetPassword(body);
  if (!user) return res.status(400).json({ error: 'invalid_or_expired_reset_token' });
  return res.json(await issueSession(res, user));
});

authRouter.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];
  if (!refreshToken) return res.status(401).json({ error: 'missing_refresh_token' });
  const rotated = await dataStore.rotateRefreshToken(refreshToken);
  if (!rotated) {
    clearRefreshCookie(res);
    return res.status(401).json({ error: 'invalid_refresh_token' });
  }
  setRefreshCookie(res, rotated.refreshToken);
  return res.json({
    accessToken: signAccessToken(rotated.user.id),
    tokenType: 'Bearer',
    expiresIn: 900,
    user: rotated.user,
  });
});

authRouter.post('/logout', async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE];
  if (refreshToken) await dataStore.revokeRefreshToken(refreshToken);
  clearRefreshCookie(res);
  return res.status(204).send();
});

authRouter.get('/me', requireAuth, async (req, res) => {
  res.json({
    user: req.user,
    workspaces: await dataStore.listWorkspaces(req.user!.id),
  });
});
