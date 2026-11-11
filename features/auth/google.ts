/**
 * Google SSO via expo-auth-session, or mock when client ID is unset.
 */

import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import {
  getAuthPublicConfig,
  isGoogleLive,
  resolveGoogleClientId,
} from './config';
import { AuthError, type AuthSession } from './types';

WebBrowser.maybeCompleteAuthSession();

export type GoogleAuthRequestHelpers = {
  /** Call from a component that owns the AuthSession hook result. */
  promptAsync: () => Promise<{
    type: string;
    authentication?: { idToken?: string | null; accessToken?: string | null } | null;
    params?: Record<string, string>;
  }>;
};

/** Build Google provider hook args for screens. */
export function getGoogleAuthRequestConfig() {
  const config = getAuthPublicConfig();
  return {
    webClientId: config.googleWebClientId,
    iosClientId: config.googleIosClientId,
    androidClientId: config.googleAndroidClientId,
    // expo-auth-session Google provider also accepts a single clientId
    clientId: resolveGoogleClientId(config),
  };
}

export function createMockGoogleSession(): AuthSession {
  const now = new Date().toISOString();
  return {
    userId: `google_mock_${Date.now().toString(36)}`,
    provider: 'google',
    isGuest: false,
    email: 'mock.user@gmail.com',
    displayName: 'Mock Google User',
    providerSubject: `google-mock-${Platform.OS}`,
    issuedAt: now,
  };
}

/**
 * Complete Google sign-in using a promptAsync from useAuthRequest.
 * Falls back to mock when Google is not configured.
 */
export async function signInWithGoogle(
  promptAsync?: GoogleAuthRequestHelpers['promptAsync'],
): Promise<AuthSession> {
  const config = getAuthPublicConfig();

  if (!isGoogleLive(config) || !promptAsync) {
    // Brief delay so the in-progress screen is visible in mock mode
    await new Promise((r) => setTimeout(r, 700));
    return createMockGoogleSession();
  }

  const result = await promptAsync();
  if (result.type === 'dismiss' || result.type === 'cancel') {
    throw new AuthError('cancelled', 'Google sign-in was cancelled');
  }
  if (result.type !== 'success') {
    throw new AuthError('google_failed', `Google sign-in failed (${result.type})`);
  }

  const idToken =
    result.authentication?.idToken ||
    result.params?.id_token ||
    result.authentication?.accessToken ||
    undefined;

  // Optional exchange with Verify API when configured
  if (config.apiBaseUrl && idToken) {
    try {
      const res = await fetch(`${config.apiBaseUrl.replace(/\/$/, '')}/auth/oauth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          userId?: string;
          email?: string;
          displayName?: string;
        };
        return {
          userId: data.userId ?? `google_${Date.now().toString(36)}`,
          provider: 'google',
          isGuest: false,
          email: data.email,
          displayName: data.displayName,
          providerSubject: data.email ?? data.userId,
          idToken,
          issuedAt: new Date().toISOString(),
        };
      }
    } catch {
      // Fall through to local session from token
    }
  }

  return {
    userId: `google_${Date.now().toString(36)}`,
    provider: 'google',
    isGuest: false,
    providerSubject: idToken ? idToken.slice(0, 24) : `google-${Platform.OS}`,
    idToken: idToken ?? undefined,
    issuedAt: new Date().toISOString(),
  };
}

/** Re-export for screens that prefer the hook directly. */
export { Google };
