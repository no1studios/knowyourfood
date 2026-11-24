/**
 * Shared CORS for Expo web → auth API (local Metro/Webpack + production origins).
 * Echo allowed Origin (never `*`) so credentialed clients stay compatible later.
 */

/** Expo web defaults — Metro often lands on 8081; Webpack/dev may use 8082. */
const LOCAL_EXPO_ORIGINS = [
  'http://localhost:8081',
  'http://localhost:8082',
  'http://127.0.0.1:8081',
  'http://127.0.0.1:8082',
  'http://localhost:19006',
  'http://127.0.0.1:19006',
] as const;

const ALLOW_METHODS = 'GET, POST, OPTIONS';
const ALLOW_HEADERS = 'Content-Type, Accept, Authorization';
const MAX_AGE_SECONDS = '86400';

function readEnvOrigins(): string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS;
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/** Built-in local Expo origins plus comma-separated `CORS_ALLOWED_ORIGINS`. */
export function getAllowedOrigins(): string[] {
  return [...new Set([...LOCAL_EXPO_ORIGINS, ...readEnvOrigins()])];
}

/** Return the request Origin when it is on the allowlist; otherwise null. */
export function resolveAllowedOrigin(request: Request): string | null {
  const origin = request.headers.get('Origin');
  if (!origin) return null;
  return getAllowedOrigins().includes(origin) ? origin : null;
}

/** Apply Access-Control-* headers onto an existing Headers bag. */
export function applyCorsHeaders(request: Request, headers: Headers): void {
  const allowed = resolveAllowedOrigin(request);
  if (allowed) {
    headers.set('Access-Control-Allow-Origin', allowed);
    headers.append('Vary', 'Origin');
  }
  headers.set('Access-Control-Allow-Methods', ALLOW_METHODS);
  headers.set('Access-Control-Allow-Headers', ALLOW_HEADERS);
  headers.set('Access-Control-Max-Age', MAX_AGE_SECONDS);
}

/** Clone a Response with CORS headers for an allowed (or absent) Origin. */
export function withCors(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  applyCorsHeaders(request, headers);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** OPTIONS preflight — 204 with CORS allow headers. */
export function corsPreflight(request: Request): Response {
  const headers = new Headers();
  applyCorsHeaders(request, headers);
  return new Response(null, { status: 204, headers });
}
