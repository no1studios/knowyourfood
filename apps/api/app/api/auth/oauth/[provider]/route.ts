import { sanitizeDbError } from '@/lib/db-errors';
import {
  isAuthMock,
  isDatabaseConfigured,
  isGoogleConfigured,
} from '@/lib/env';
import { googleSessionFromClaims, verifyGoogleIdToken } from '@/lib/google';
import {
  AuthHttpError,
  jsonError,
  mockOAuth,
  type AuthSuccess,
  type OAuthBody,
} from '@/lib/mock-auth';
import { upsertOAuthUser } from '@/lib/users';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ provider: string }>;
};

const SUPPORTED = new Set(['google', 'apple']);

/**
 * POST /api/auth/oauth/[provider]
 * provider: google | apple
 * Body (google): { idToken }
 * Body (apple): { identityToken, user? }
 *
 * Google: when GOOGLE_CLIENT_ID (or platform IDs) is set, verifies the ID token
 * and upserts to Neon — independent of AUTH_MOCK so phone can stay mocked.
 * Otherwise AUTH_MOCK returns a deterministic session; live without config → 501.
 * Apple remains mock / 501 until wired.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { provider: raw } = await context.params;
    const provider = raw.toLowerCase();
    if (!SUPPORTED.has(provider)) {
      throw new AuthHttpError(
        400,
        'unsupported_provider',
        `Unsupported provider: ${raw}. Use google or apple.`,
      );
    }

    const body = (await request.json().catch(() => ({}))) as OAuthBody;
    const typed = provider as 'google' | 'apple';

    let session: AuthSuccess;

    if (typed === 'google' && isGoogleConfigured()) {
      if (!body.idToken) {
        throw new AuthHttpError(400, 'invalid_token', 'idToken is required');
      }
      const claims = await verifyGoogleIdToken(body.idToken);
      session = googleSessionFromClaims(claims, body.idToken);
    } else if (isAuthMock()) {
      session = mockOAuth(typed, body);
    } else if (typed === 'google') {
      throw new AuthHttpError(
        501,
        'google_not_configured',
        'Google Sign-In is not configured. Set AUTH_MOCK=true or set GOOGLE_CLIENT_ID.',
      );
    } else {
      throw new AuthHttpError(
        501,
        'oauth_not_configured',
        `OAuth for ${typed} is not configured. Set AUTH_MOCK=true or wire provider secrets.`,
      );
    }

    return Response.json(await maybePersistOAuth(typed, session, body));
  } catch (err) {
    return jsonError(err);
  }
}

async function maybePersistOAuth(
  provider: 'google' | 'apple',
  session: AuthSuccess,
  body: OAuthBody,
) {
  if (!isDatabaseConfigured()) {
    return {
      ...session,
      persisted: false,
      persistError: {
        code: 'db_not_configured',
        message: 'DATABASE_URL is not set',
      },
    };
  }

  // Prefer the subject baked into mock/live userId (google_<sub> / apple_<sub>)
  // before upsert replaces userId with a Neon UUID. Do not key mock identities
  // on the shared placeholder email.
  const providerSubject =
    body.user ||
    session.userId.replace(/^(google|apple)_/, '') ||
    body.email ||
    session.email;

  if (!providerSubject) {
    return {
      ...session,
      persisted: false,
      persistError: {
        code: 'subject_required',
        message: 'provider subject required to persist',
      },
    };
  }

  try {
    const user = await upsertOAuthUser({
      provider,
      providerSubject,
      email: session.email ?? body.email,
      displayName: session.displayName ?? body.displayName,
    });
    return {
      ...session,
      userId: user.id,
      email: user.email ?? session.email,
      displayName: user.displayName ?? session.displayName ?? undefined,
      persisted: true,
    };
  } catch (dbErr) {
    const persistError = sanitizeDbError(dbErr);
    console.error(
      `[oauth/${provider}] DB upsert failed`,
      persistError.code,
      persistError.message,
      persistError.causeCode ?? '',
    );
    if (isAuthMock() || session.mock) {
      return {
        ...session,
        persisted: false,
        persistError,
      };
    }
    throw dbErr;
  }
}
