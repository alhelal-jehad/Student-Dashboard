import { env } from '@/shared/config/env';
import { ApiError, codeFromStatus } from '@/shared/utils/errors';

/** What Models depend on. Tests pass a fake. Responses are `unknown` until a Model parses them. */
export interface ApiClient {
  get(path: string): Promise<unknown>;
  post(path: string, body?: unknown): Promise<unknown>;
}

const TIMEOUT_MS = 15_000;
const inflight = new Map<string, Promise<unknown>>();

/** Double-submit CSRF: the server sets a readable `csrf_token` cookie; we echo it in a header. */
function csrfToken(): string {
  const match = /(?:^|; )csrf_token=([^;]+)/.exec(document.cookie);
  return match?.[1] ?? '';
}

async function request(method: 'GET' | 'POST', path: string, body?: unknown): Promise<unknown> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const init: RequestInit = {
    method,
    headers,
    credentials: 'same-origin', // auth is an httpOnly cookie; JS never sees the token
    signal: AbortSignal.timeout(TIMEOUT_MS),
  };
  if (method === 'POST') {
    headers['X-CSRF-Token'] = csrfToken();
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
  }

  let res: Response;
  try {
    res = await fetch(env.VITE_API_BASE_URL + path, init);
  } catch {
    throw new ApiError('network');
  }
  if (!res.ok) throw new ApiError(codeFromStatus(res.status), res.status);
  if (res.status === 204) return null;
  try {
    return (await res.json()) as unknown;
  } catch {
    throw new ApiError('invalid_response', res.status);
  }
}

export const apiClient: ApiClient = {
  // Identical in-flight GETs share one request (de-duplication).
  get(path) {
    const existing = inflight.get(path);
    if (existing) return existing;
    const p = request('GET', path).finally(() => inflight.delete(path));
    inflight.set(path, p);
    return p;
  },
  post: (path, body) => request('POST', path, body),
};
