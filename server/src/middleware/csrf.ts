import { randomBytes } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

export const CSRF_COOKIE = 'agility.csrfToken';
export const CSRF_HEADER = 'x-csrf-token';

export function issueCsrfToken(res: Response) {
  const token = randomBytes(32).toString('hex');
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });
  return token;
}

export function clearCsrfToken(res: Response) {
  res.clearCookie(CSRF_COOKIE, { path: '/' });
}

export function requireCsrf(req: Request, res: Response, next: NextFunction) {
  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.header(CSRF_HEADER);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: 'invalid_csrf_token' });
  }

  return next();
}
