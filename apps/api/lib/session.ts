/**
 * Resolve the signed-in user for recipe / shopping (and future) authenticated routes.
 *
 * Headers:
 *   Authorization: Bearer <idToken>   — Google ID token, or mock session token
 *   X-KYF-User-Id: <uuid>             — Neon user id (required for mock/phone tokens)
 *
 * Google JWT path verifies the token and looks up auth_identities (header is a hint).
 * Mock / phone path trusts Bearer + X-KYF-User-Id when AUTH_MOCK (or mock_* token)
 * and the user row exists.
 */

import { ensureAuthSchema, getSql, withDbRetry } from './db';
import { isAuthMock, isDatabaseConfigured, isGoogleConfigured } from './env';
import { verifyGoogleIdToken } from './google';
import { AuthHttpError } from './mock-auth';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AuthedUser = {
  userId: string;
  provider: 'phone' | 'google' | 'apple' | 'mock';
  email?: string;
};

function bearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization') ?? request.headers.get('authorization');
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || null;
}

function headerUserId(request: Request): string | null {
  const raw =
    request.headers.get('X-KYF-User-Id') ??
    request.headers.get('x-kyf-user-id') ??
    '';
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function looksLikeJwt(token: string): boolean {
  const parts = token.split('.');
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

async function userExists(userId: string): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  const rows = (await sql`
    SELECT 1 AS ok FROM users WHERE id = ${userId}::uuid LIMIT 1
  `) as { ok: number }[];
  return rows.length > 0;
}

async function findUserByGoogleSub(sub: string): Promise<AuthedUser | null> {
  const sql = getSql();
  if (!sql) return null;
  const rows = (await sql`
    SELECT i.user_id, i.email, i.provider
    FROM auth_identities i
    WHERE i.provider = 'google'
      AND i.provider_subject = ${sub}
    LIMIT 1
  `) as { user_id: string; email: string | null; provider: 'google' }[];
  const row = rows[0];
  if (!row) return null;
  return {
    userId: row.user_id,
    provider: 'google',
    email: row.email ?? undefined,
  };
}

/**
 * Require an authenticated Neon user. Throws AuthHttpError on failure.
 */
export async function requireUser(request: Request): Promise<AuthedUser> {
  if (!isDatabaseConfigured()) {
    throw new AuthHttpError(
      503,
      'database_unavailable',
      'DATABASE_URL is not configured',
    );
  }

  const token = bearerToken(request);
  if (!token) {
    throw new AuthHttpError(401, 'unauthorized', 'Authorization Bearer token required');
  }

  const sql = getSql();
  if (!sql) {
    throw new AuthHttpError(
      503,
      'database_unavailable',
      'DATABASE_URL is not configured',
    );
  }

  return withDbRetry(async () => {
    await ensureAuthSchema(sql);

    // Live Google ID token → identity lookup (preferred).
    if (looksLikeJwt(token) && isGoogleConfigured()) {
      try {
        const claims = await verifyGoogleIdToken(token);
        const found = await findUserByGoogleSub(claims.sub);
        if (found) return found;
        throw new AuthHttpError(
          401,
          'user_not_found',
          'No account for this Google identity. Sign in again.',
        );
      } catch (err) {
        if (err instanceof AuthHttpError) throw err;
        throw new AuthHttpError(401, 'invalid_token', 'Invalid Google ID token');
      }
    }

    // Mock / phone session token + explicit user id header.
    const mockOk =
      isAuthMock() ||
      token.startsWith('mock_') ||
      token.startsWith('mock-') ||
      token.startsWith('mock_session_');

    if (!mockOk) {
      throw new AuthHttpError(
        401,
        'unauthorized',
        'Valid Google ID token or mock session required',
      );
    }

    const userId = headerUserId(request);
    if (!userId || !UUID_RE.test(userId)) {
      throw new AuthHttpError(
        401,
        'unauthorized',
        'X-KYF-User-Id must be a persisted user UUID',
      );
    }

    if (!(await userExists(userId))) {
      throw new AuthHttpError(401, 'user_not_found', 'Signed-in user was not found');
    }

    return { userId, provider: 'mock' };
  });
}
