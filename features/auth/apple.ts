/**
 * Apple Sign-In (iOS only) via expo-apple-authentication.
 * Mock path when forced or when Apple auth is unavailable.
 */

import { Platform } from 'react-native';

import { getAuthPublicConfig, isAppleLive } from './config';
import { AuthError, type AuthSession } from './types';

export function createMockAppleSession(): AuthSession {
  const now = new Date().toISOString();
  return {
    userId: `apple_mock_${Date.now().toString(36)}`,
    provider: 'apple',
    isGuest: false,
    email: 'mock.user@privaterelay.appleid.com',
    displayName: 'Mock Apple User',
    providerSubject: 'apple-mock-ios',
    issuedAt: now,
  };
}

export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    const AppleAuthentication = await import('expo-apple-authentication');
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function signInWithApple(): Promise<AuthSession> {
  if (Platform.OS !== 'ios') {
    throw new AuthError('apple_unavailable', 'Apple Sign-In is only available on iOS');
  }

  const config = getAuthPublicConfig();
  const available = await isAppleSignInAvailable();

  if (!isAppleLive() || !available) {
    await new Promise((r) => setTimeout(r, 700));
    return createMockAppleSession();
  }

  try {
    const AppleAuthentication = await import('expo-apple-authentication');
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    const identityToken = credential.identityToken ?? undefined;
    const displayName = [credential.fullName?.givenName, credential.fullName?.familyName]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (config.apiBaseUrl && identityToken) {
      try {
        const res = await fetch(`${config.apiBaseUrl.replace(/\/$/, '')}/auth/oauth/apple`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ identityToken, user: credential.user }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            userId?: string;
            email?: string;
            displayName?: string;
          };
          return {
            userId: data.userId ?? credential.user,
            provider: 'apple',
            isGuest: false,
            email: data.email ?? credential.email ?? undefined,
            displayName: data.displayName || displayName || undefined,
            providerSubject: credential.user,
            idToken: identityToken,
            issuedAt: new Date().toISOString(),
          };
        }
      } catch {
        // Fall through to local session
      }
    }

    return {
      userId: credential.user,
      provider: 'apple',
      isGuest: false,
      email: credential.email ?? undefined,
      displayName: displayName || undefined,
      providerSubject: credential.user,
      idToken: identityToken,
      issuedAt: new Date().toISOString(),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/cancel/i.test(message)) {
      throw new AuthError('cancelled', 'Apple Sign-In was cancelled');
    }
    // Dev / simulator without Apple capability → mock so UI flow continues
    if (__DEV__) {
      await new Promise((r) => setTimeout(r, 400));
      return createMockAppleSession();
    }
    throw new AuthError('apple_failed', message || 'Apple Sign-In failed');
  }
}
