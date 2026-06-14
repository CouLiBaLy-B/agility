const API_URL = import.meta.env.VITE_API_URL || '';
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';
const CSRF_COOKIE = 'agility.csrfToken';

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

function readCookie(name: string) {
  const prefix = `${name}=`;
  return document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
}

function createHeaders(initHeaders?: HeadersInit, options: { includeAuth?: boolean; includeCsrf?: boolean } = {}) {
  const headers = new Headers(initHeaders);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  if (options.includeCsrf) {
    const csrfToken = readCookie(CSRF_COOKIE);
    if (csrfToken) headers.set('X-CSRF-Token', decodeURIComponent(csrfToken));
  }

  if (options.includeAuth) {
    const token = localStorage.getItem('agility.accessToken');
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
}

async function refreshAccessToken() {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: createHeaders(undefined, { includeCsrf: true }),
  });
  if (!res.ok) return false;
  const session = (await res.json()) as { accessToken: string };
  localStorage.setItem('agility.accessToken', session.accessToken);
  return true;
}

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const method = init.method?.toUpperCase() ?? 'GET';
  const includeCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: createHeaders(init.headers, { includeAuth: true, includeCsrf }),
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
