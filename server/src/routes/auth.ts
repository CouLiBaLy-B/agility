import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, signAccessToken } from '../middleware/auth';
import { dataStore } from '../services/data-store';

export const authRouter = Router();

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

function sessionFor(user: { id: string }) {
  return {
    accessToken: signAccessToken(user.id),
    tokenType: 'Bearer',
    expiresIn: 900,
    user,
  };
}

authRouter.post('/login', async (req, res) => {
  const body = LoginSchema.parse(req.body);
  const user = await dataStore.validateCredentials(body.email, body.password);
  if (!user) return res.status(401).json({ error: 'invalid_credentials' });
  return res.json(sessionFor(user));
});

authRouter.post('/register', async (req, res) => {
  const body = RegisterSchema.parse(req.body);
  const user = await dataStore.register(body);
  if (!user) return res.status(409).json({ error: 'email_already_registered' });
  return res.status(201).json(sessionFor(user));
});

authRouter.post('/forgot-password', async (req, res) => {
  const body = ForgotPasswordSchema.parse(req.body);
  const reset = await dataStore.createPasswordResetToken(body.email);

  // Always return 200 to avoid account enumeration. In this MVP/dev build we expose
  // the token so the reset page can be tested without an email provider.
  return res.json({
    ok: true,
    resetToken: reset?.resetToken,
    expiresAt: reset?.expiresAt,
    message: 'If the email exists, reset instructions have been generated.',
  });
});

authRouter.post('/reset-password', async (req, res) => {
  const body = ResetPasswordSchema.parse(req.body);
  const user = await dataStore.resetPassword(body);
  if (!user) return res.status(400).json({ error: 'invalid_or_expired_reset_token' });
  return res.json(sessionFor(user));
});

authRouter.post('/logout', (_req, res) => res.status(204).send());

authRouter.get('/me', requireAuth, async (req, res) => {
  res.json({
    user: req.user,
    workspaces: await dataStore.listWorkspaces(),
  });
});
