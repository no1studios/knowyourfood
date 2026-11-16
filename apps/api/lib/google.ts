/**
 * Google ID token verification (Sign-In / OAuth).
 * Uses google-auth-library; audiences come from GOOGLE_*_CLIENT_ID env vars.
 */

import { OAuth2Client } from 'google-auth-library';

import { getGoogleAudiences } from './env';
import { AuthHttpError, type AuthSuccess } from './mock-auth';

const client = new OAuth2Client();

export type GoogleIdTokenClaims = {
  sub: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
  picture?: string;
};

/**
 * Verify a Google ID token against configured OAuth client IDs (audiences).
 * Throws AuthHttpError on missing/invalid tokens.
 */
export async function verifyGoogleIdToken(
  idToken: string,
): Promise<GoogleIdTokenClaims> {
  const audiences = getGoogleAudiences();
  if (audiences.length === 0) {
    throw new AuthHttpError(
      501,
      'google_not_configured',
      'Google Sign-In is not configured. Set GOOGLE_CLIENT_ID (and optional iOS/Android IDs).',
    );
  }

  const trimmed = idToken.trim();
  if (!trimmed || trimmed.length < 20) {
    throw new AuthHttpError(400, 'invalid_token', 'idToken is required');
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: trimmed,
      audience: audiences.length === 1 ? audiences[0] : audiences,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub) {
      throw new AuthHttpError(401, 'invalid_token', 'Google ID token missing subject');
    }
    return {
      sub: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified,
      name: payload.name,
      picture: payload.picture,
    };
  } catch (err) {
    if (err instanceof AuthHttpError) throw err;
    const message = err instanceof Error ? err.message : 'Invalid Google ID token';
    throw new AuthHttpError(401, 'invalid_token', message);
  }
}

/** Build AuthSuccess session from verified Google claims. */
export function googleSessionFromClaims(
  claims: GoogleIdTokenClaims,
  idToken: string,
): AuthSuccess {
  return {
    userId: `google_${claims.sub}`,
    email: claims.email,
    displayName: claims.name,
    provider: 'google',
    idToken,
    mock: false,
  };
}
