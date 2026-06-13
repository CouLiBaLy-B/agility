import { api } from './client';

export interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
}

export function getPreferences() {
  return api<UserPreferences>('/users/me/preferences');
}

export function updatePreferences(input: Partial<UserPreferences>) {
  return api<UserPreferences>('/users/me/preferences', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
