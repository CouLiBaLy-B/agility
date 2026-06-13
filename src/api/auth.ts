import { api } from './client';
import type { User } from '../data/boards';

export interface ApiUser extends User {
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  currentUserRole: ApiUser['role'];
}

export interface AuthSession {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: ApiUser;
}

export interface ForgotPasswordResponse {
  ok: boolean;
  resetToken?: string;
  expiresAt?: string;
  message: string;
}

function persistSession(session: AuthSession) {
  localStorage.setItem('agility.accessToken', session.accessToken);
  return session;
}

export async function login(email = 'sarah.chen@company.com', password = 'demo-password') {
  const session = await api<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return persistSession(session);
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  workspaceName?: string;
}) {
  const session = await api<AuthSession>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return persistSession(session);
}

export function forgotPassword(email: string) {
  return api<ForgotPasswordResponse>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, password: string) {
  const session = await api<AuthSession>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
  return persistSession(session);
}

export async function getMe() {
  return api<{ user: ApiUser; workspaces: WorkspaceSummary[] }>('/auth/me');
}
