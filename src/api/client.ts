const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

export const apiConfig = {
  apiUrl: API_URL,
  useMocks: USE_MOCKS,
  workspaceId: import.meta.env.VITE_WORKSPACE_ID ?? 'w1',
};

export function isApiEnabled() {
  return !apiConfig.useMocks && Boolean(apiConfig.apiUrl);
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function refreshAccessToken() {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) return false;
  const session = (await res.json()) as { accessToken: string };
  localStorage.setItem('agility.accessToken', session.accessToken);
  return true;
}

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const token = localStorage.getItem('agility.accessToken');
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401 && retry && path !== '/auth/refresh') {
    const refreshed = await refreshAccessToken();
    if (refreshed) return api<T>(path, init, false);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text || res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function refreshSessionToken() {
  return refreshAccessToken();
}
