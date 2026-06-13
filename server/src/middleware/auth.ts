import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../env';
import { dataStore } from '../services/data-store';
import type { ApiUser } from '../services/store';

declare global {
  namespace Express {
    interface Request {
      user?: ApiUser;
    }
  }
}

export function signAccessToken(userId: string) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

  if (!token) {
    return res.status(401).json({ error: 'missing_token' });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    req.user = await dataStore.getCurrentUser(String(payload.sub ?? 'u1'));
    return next();
  } catch {
    return res.status(401).json({ error: 'invalid_token' });
  }
}
