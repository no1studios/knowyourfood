/**
 * Public auth config from Expo env (`EXPO_PUBLIC_*`).
 * Never put secret server keys here — only client IDs / public API base.
 */

import { Platform } from 'react-native';

import type { AuthCapability, AuthMode } from './types';

function env(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function flagTrue(name: string): boolean {
  const v = env(name)?.toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

export type AuthPublicConfig = {
  apiBaseUrl?: string;
  googleWebClientId?: string;
  googleIosClientId?: string;
  googleAndroidClientId?: string;
  /** Accepted OTP when mock phone verify is active. Default 123456. */
  mockOtp: string;
  /** Force mock even if keys are present. */
  forceMock: boolean;
};

export function getAuthPublicConfig(): AuthPublicConfig {
  return {
    apiBaseUrl: env('EXPO_PUBLIC_AUTH_API_URL'),
    googleWebClientId: env('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID') ?? env('EXPO_PUBLIC_GOOGLE_CLIENT_ID'),
    googleIosClientId: env('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'),
    googleAndroidClientId: env('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'),
    mockOtp: env('EXPO_PUBLIC_AUTH_MOCK_OTP') ?? '123456',
    forceMock: flagTrue('EXPO_PUBLIC_AUTH_MOCK'),
  };
}

export function resolveGoogleClientId(config = getAuthPublicConfig()): string | undefined {
  if (Platform.OS === 'ios') {
    return config.googleIosClientId ?? config.googleWebClientId;
  }
  if (Platform.OS === 'android') {
    return config.googleAndroidClientId ?? config.googleWebClientId;
  }
  return config.googleWebClientId;
}

export function getAuthCapabilities(config = getAuthPublicConfig()): AuthCapability {
  const googleClientId = resolveGoogleClientId(config);
  const phoneLive = Boolean(config.apiBaseUrl) && !config.forceMock;
  const googleLive = Boolean(googleClientId) && !config.forceMock;
  const appleLive = Platform.OS === 'ios' && !config.forceMock;
  const anyLive = phoneLive || googleLive || appleLive;
  const mode: AuthMode = config.forceMock || !anyLive ? 'mock' : 'live';

  return {
    phone: true, // always available (live API or mock)
    google: true, // always available (live OAuth or mock)
    apple: Platform.OS === 'ios',
    mode,
  };
}

export function isPhoneLive(config = getAuthPublicConfig()): boolean {
  return Boolean(config.apiBaseUrl) && !config.forceMock;
}

export function isGoogleLive(config = getAuthPublicConfig()): boolean {
  return Boolean(resolveGoogleClientId(config)) && !config.forceMock;
}

export function isAppleLive(): boolean {
  const config = getAuthPublicConfig();
  return Platform.OS === 'ios' && !config.forceMock;
}
