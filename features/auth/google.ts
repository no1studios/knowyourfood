/**
 * Google SSO via expo-auth-session, or mock when client ID is unset.
 * Live path: AuthSession → ID token → POST /auth/oauth/google → Neon-backed session.
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
    scopes: ['openid', 'profile', 'email'] as string[],
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

type OAuthApiResponse = {
  userId?: string;
  email?: string;
  displayName?: string;
  idToken?: string;
  persisted?: boolean;
  error?: string;
  message?: string;
};

async function exchangeGoogleIdToken(
  apiBaseUrl: string,
  idToken: string,
): Promise<AuthSession> {
  const res = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/auth/oauth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  const data = (await res.json().catch(() => ({}))) as OAuthApiResponse;

  if (!res.ok) {
    throw new AuthError(
      data.error ?? 'google_failed',
      data.message || `Google sign-in failed (${res.status})`,
    );
  }

  return {
    userId: data.userId ?? `google_${Date.now().toString(36)}`,
    provider: 'google',
    isGuest: false,
    email: data.email,
    displayName: data.displayName,
    providerSubject: data.email ?? data.userId,
    idToken: data.idToken ?? idToken,
    issuedAt: new Date().toISOString(),
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
    // Prefer API mock exchange when the Verify API is reachable
    if (config.apiBaseUrl) {
      try {
        return await exchangeGoogleIdToken(config.apiBaseUrl, `mock-google-${Platform.OS}`);
      } catch {
        return createMockGoogleSession();
      }
    }
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
    undefined;

  if (!idToken) {
    throw new AuthError(
      'google_failed',
      'Google did not return an ID token. Check OAuth client IDs and redirect URIs.',
    );
  }

  if (!config.apiBaseUrl) {
    throw new AuthError(
      'api_not_configured',
      'Set EXPO_PUBLIC_AUTH_API_URL so Google tokens can be verified by the API.',
    );
  }

  return exchangeGoogleIdToken(config.apiBaseUrl, idToken);
}

/** Re-export for screens that prefer the hook directly. */
export { Google };
