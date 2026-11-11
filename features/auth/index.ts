/** Auth feature — Phone OTP (+91), Google SSO, Apple Sign-In (iOS). */

export type {
  AuthCapability,
  AuthClient,
  AuthMode,
  AuthProvider,
  AuthSession,
  OAuthRequest,
  OtpStartRequest,
  OtpStartResult,
  OtpVerifyRequest,
} from './types';
export { AuthError } from './types';

export { authClient, registerGooglePrompt } from './client';
export {
  getAuthCapabilities,
  getAuthPublicConfig,
  isAppleLive,
  isGoogleLive,
  isPhoneLive,
  resolveGoogleClientId,
} from './config';
export { formatPhoneDisplay, normalizeIndiaPhone } from './phone';
export { getGoogleAuthRequestConfig, Google } from './google';
export { isAppleSignInAvailable } from './apple';
export { authSessionStore } from './session';
export { mergeHrefAfterAuth, type MergeVariant } from './post-auth';
