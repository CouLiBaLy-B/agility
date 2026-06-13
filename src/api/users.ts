import { api } from './client';
import type { ApiUser } from './auth';

export function updateMe(input: { name?: string; email?: string }) {
  return api<ApiUser>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
