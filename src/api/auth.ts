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

export async function login(email = 'sarah.chen@company.com', password = 'demo-password') {
  const session = await api<{ accessToken: string; user: ApiUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem('agility.accessToken', session.accessToken);
  return session;
}

export async function getMe() {
  return api<{ user: ApiUser; workspaces: WorkspaceSummary[] }>('/auth/me');
}
