/**
 * AuthClient implementation — Phone OTP + Google + Apple with mock fallback.
 */

import { signInWithApple } from './apple';
import { getAuthCapabilities } from './config';
import { signInWithGoogle, type GoogleAuthRequestHelpers } from './google';
import { startPhoneOtp, verifyPhoneOtp } from './phone';
import { authSessionStore } from './session';
import {
  AuthError,
  type AuthClient,
  type AuthSession,
  type OAuthRequest,
  type OtpStartRequest,
  type OtpStartResult,
  type OtpVerifyRequest,
} from './types';

let googlePrompt: GoogleAuthRequestHelpers['promptAsync'] | undefined;

/** Screens that own `Google.useAuthRequest` register their promptAsync here. */
export function registerGooglePrompt(
  promptAsync: GoogleAuthRequestHelpers['promptAsync'] | undefined,
) {
  googlePrompt = promptAsync;
}

function guestSession(): AuthSession {
  return {
    userId: null,
    provider: 'guest',
    isGuest: true,
    issuedAt: new Date().toISOString(),
  };
}

async function persist(session: AuthSession): Promise<AuthSession> {
  await authSessionStore.save(session);
  return session;
}

export const authClient: AuthClient = {
  getCapabilities() {
    return getAuthCapabilities();
  },

  async getSession() {
    const stored = await authSessionStore.load();
    if (stored) return stored;
    return guestSession();
  },

  async startPhoneOtp(req: OtpStartRequest): Promise<OtpStartResult> {
    return startPhoneOtp(req.phoneE164);
  },

  async verifyPhoneOtp(req: OtpVerifyRequest): Promise<AuthSession> {
    const session = await verifyPhoneOtp(req);
    return persist(session);
  },

  async signInWithOAuth(req: OAuthRequest): Promise<AuthSession> {
    if (req.provider === 'google') {
      const session = await signInWithGoogle(googlePrompt);
      return persist(session);
    }
    if (req.provider === 'apple') {
      const session = await signInWithApple();
      return persist(session);
    }
    throw new AuthError('unsupported_provider', `Unsupported provider: ${req.provider}`);
  },

  async continueAsGuest(): Promise<AuthSession> {
    const session = guestSession();
    await authSessionStore.save(session);
    return session;
  },

  async signOut(): Promise<void> {
    await authSessionStore.clear();
  },
};
