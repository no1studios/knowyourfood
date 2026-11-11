import { isAuthMock } from '@/lib/env';
import {
  AuthHttpError,
  jsonError,
  mockOAuth,
  type OAuthBody,
} from '@/lib/mock-auth';

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
 * Mock mode returns a deterministic session without validating the token.
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

    if (isAuthMock()) {
      return Response.json(mockOAuth(typed, body));
    }

    throw new AuthHttpError(
      501,
      'oauth_not_configured',
      `OAuth for ${typed} is not configured. Set AUTH_MOCK=true or wire provider secrets.`,
    );
  } catch (err) {
    return jsonError(err);
  }
}
