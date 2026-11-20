/** Stable error codes. Models expose these; Views translate them. No user-facing strings here. */
export type ErrorCode =
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'rate_limited'
  | 'server'
  | 'invalid_response'
  | 'unknown';

export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly status?: number,
  ) {
    super(code); // never include URL, body or user data: errors may reach logs
    this.name = 'ApiError';
  }
}

export function codeFromStatus(status: number): ErrorCode {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 429) return 'rate_limited';
  return status >= 500 ? 'server' : 'unknown';
}

export function toErrorCode(error: unknown): ErrorCode {
  return error instanceof ApiError ? error.code : 'unknown';
}
